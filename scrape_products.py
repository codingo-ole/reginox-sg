#!/usr/bin/env python3
"""
Dedicated product scraper for reginox.com.
Handles Magento pagination to get ALL products from all categories.
"""

import re
import time
import math
import sqlite3
import hashlib
import logging
import requests
from pathlib import Path
from urllib.parse import urljoin, urlparse
from bs4 import BeautifulSoup

logging.basicConfig(
    level=logging.INFO,
    format="[%(asctime)s] %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger(__name__)

BASE_URL = "https://www.reginox.com"
DIR = Path(__file__).parent
DB_PATH = DIR / "reginox.db"
IMG_DIR = DIR / "site_mirror" / "assets" / "images"
IMG_DIR.mkdir(parents=True, exist_ok=True)

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/120.0.0.0 Safari/537.36"
    ),
    "Accept-Language": "en-GB,en;q=0.9",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
}

DELAY = 0.5  # seconds between requests

# All category URLs to paginate through
CATEGORIES = [
    {"name": "Sinks",         "url": "/product-range/sinks"},
    {"name": "Taps",          "url": "/product-range/taps"},
    {"name": "Accessories",   "url": "/assortiment/accessoires"},
    {"name": "Attachments",   "url": "/assortiment/toebehoren"},
    {"name": "Worktops",      "url": "/assortiment/werkbladen/rvs"},
    {"name": "Bar Tops",      "url": "/assortiment/werkbladen/tap-en-lekbladen"},
]

SESSION = requests.Session()
SESSION.headers.update(HEADERS)


# ---------------------------------------------------------------------------
# Database helpers
# ---------------------------------------------------------------------------

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def ensure_products_table(conn):
    conn.execute("""
        CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            category TEXT,
            subcategory TEXT,
            name TEXT,
            model_code TEXT,
            description TEXT,
            features TEXT,
            dimensions TEXT,
            colors TEXT,
            material TEXT,
            collection TEXT,
            image_url TEXT,
            image_urls TEXT,
            local_image_path TEXT,
            all_images TEXT,
            page_url TEXT UNIQUE,
            scraped_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    # Add new columns if upgrading from old schema
    for col, coltype in [
        ("subcategory", "TEXT"),
        ("features", "TEXT"),
        ("all_images", "TEXT"),
        ("image_url", "TEXT"),
        ("local_image_path", "TEXT"),
        ("page_url", "TEXT"),
    ]:
        try:
            conn.execute(f"ALTER TABLE products ADD COLUMN {col} {coltype}")
        except sqlite3.OperationalError:
            pass
    conn.commit()


def product_exists(conn, url):
    row = conn.execute("SELECT id FROM products WHERE page_url = ?", (url,)).fetchone()
    return row is not None


def upsert_product(conn, data):
    # Rename product_url → page_url for schema compatibility
    if "product_url" in data:
        data["page_url"] = data.pop("product_url")
    # Delete existing row with same page_url first, then insert fresh
    conn.execute("DELETE FROM products WHERE page_url = ?", (data.get("page_url"),))
    cols = list(data.keys())
    placeholders = ", ".join("?" * len(cols))
    col_str = ", ".join(cols)
    conn.execute(
        f"INSERT INTO products ({col_str}) VALUES ({placeholders})",
        list(data.values()),
    )
    conn.commit()


# ---------------------------------------------------------------------------
# HTTP helpers
# ---------------------------------------------------------------------------

def fetch(url, retries=3):
    for attempt in range(retries):
        try:
            r = SESSION.get(url, timeout=20)
            if r.status_code == 200:
                return r
            log.warning(f"  HTTP {r.status_code}: {url}")
            return None
        except Exception as e:
            log.warning(f"  Attempt {attempt+1} failed for {url}: {e}")
            time.sleep(2)
    return None


def download_image(img_url):
    """Download image and return local relative path, or None on failure."""
    if not img_url:
        return None
    abs_url = img_url if img_url.startswith("http") else urljoin(BASE_URL, img_url)
    # Remove query params for filename
    path = urlparse(abs_url).path
    fname = Path(path).name
    if not fname or len(fname) < 4:
        fname = hashlib.md5(abs_url.encode()).hexdigest() + ".jpg"
    local = IMG_DIR / fname
    if local.exists():
        return f"site_mirror/assets/images/{fname}"
    try:
        r = SESSION.get(abs_url, timeout=30, stream=True)
        if r.status_code == 200:
            with open(local, "wb") as f:
                for chunk in r.iter_content(8192):
                    f.write(chunk)
            size_kb = local.stat().st_size // 1024
            log.info(f"    Downloaded image {size_kb}KB → {fname}")
            return f"site_mirror/assets/images/{fname}"
    except Exception as e:
        log.warning(f"    Image download failed: {abs_url}: {e}")
    return None


# ---------------------------------------------------------------------------
# Parsing helpers
# ---------------------------------------------------------------------------

MODEL_RE = re.compile(r'\b(R\d{4,6}[A-Z0-9\-]*)\b')


def extract_model_code(text):
    """Find first Reginox model code like R35153 in text."""
    m = MODEL_RE.search(text or "")
    return m.group(1) if m else None


def parse_toolbar_total(soup):
    """Parse 'Items 1-36 of 256' style text → total product count."""
    for elem in soup.select(".toolbar-amount, .products-list-total, .toolbar-number"):
        text = elem.get_text(" ", strip=True)
        m = re.search(r'of\s+(\d+)', text)
        if m:
            return int(m.group(1))
    # fallback: look in any text
    for text in soup.stripped_strings:
        m = re.search(r'Items?\s+\d+[-–]\d+\s+of\s+(\d+)', text, re.I)
        if m:
            return int(m.group(1))
    return 0


def parse_product_items(soup, category_name):
    """Extract product list items from a category page."""
    products = []

    # Magento 2 product list
    for item in soup.select("li.product-item, .item.product"):
        name_el = item.select_one(".product-item-name, .product-name")
        name = name_el.get_text(strip=True) if name_el else ""

        link_el = item.select_one("a.product-item-link, a.product-item-photo")
        if not link_el:
            link_el = item.select_one("a[href]")
        url = link_el["href"] if link_el and link_el.get("href") else ""
        if url and not url.startswith("http"):
            url = urljoin(BASE_URL, url)

        img_el = item.select_one("img.product-image-photo, img")
        img_url = ""
        if img_el:
            img_url = img_el.get("src") or img_el.get("data-src") or ""

        model_code = extract_model_code(name) or extract_model_code(url)

        if name and url:
            products.append({
                "category": category_name,
                "name": name,
                "model_code": model_code or "",
                "image_url": img_url,
                "product_url": url,
            })

    return products


def parse_product_detail(soup, url, base_data):
    """Extract full product details from a product detail page."""
    data = dict(base_data)

    # Full description
    desc_el = soup.select_one(".product-info-description, .description, [class*='description']")
    if desc_el:
        data["description"] = desc_el.get_text(" ", strip=True)[:2000]

    # Short description / features
    short_el = soup.select_one(".product-info-short, .short-description")
    if short_el:
        data["features"] = short_el.get_text(" ", strip=True)[:1000]

    # Attributes table (specifications)
    attrs = {}
    for row in soup.select(".product-attribute-set-table tr, .data.table.additional-attributes tr, table.product-attrib tr"):
        cells = row.select("th, td")
        if len(cells) >= 2:
            k = cells[0].get_text(strip=True)
            v = cells[1].get_text(strip=True)
            attrs[k] = v

    # Also check definition lists
    for dt, dd in zip(soup.select(".product-attribute dt"), soup.select(".product-attribute dd")):
        attrs[dt.get_text(strip=True)] = dd.get_text(strip=True)

    # Extract known fields from attrs
    dim_keys = ["dimensions", "overall dimensions", "afmetingen", "maten", "size"]
    for k, v in attrs.items():
        kl = k.lower()
        if any(d in kl for d in dim_keys):
            data["dimensions"] = v
        elif "material" in kl or "material" in kl:
            data["material"] = v
        elif "collection" in kl or "serie" in kl:
            data["collection"] = v
        elif "color" in kl or "colour" in kl or "kleur" in kl or "finish" in kl:
            data["colors"] = v

    # All product images
    all_images = []
    for img in soup.select(".fotorama img, .gallery img, .MagicZoom img, "
                           "[data-fotorama] img, .product-media img, "
                           ".gallery-placeholder img"):
        src = img.get("src") or img.get("data-src") or img.get("data-zoom-image") or ""
        if src and "placeholder" not in src.lower():
            all_imgs_url = src if src.startswith("http") else urljoin(BASE_URL, src)
            all_images.append(all_imgs_url)

    # Also get full-size URLs from data attributes
    for el in soup.select("[data-zoom-image], [data-src], [data-full]"):
        for attr in ["data-zoom-image", "data-full", "data-large-image"]:
            src = el.get(attr, "")
            if src and "placeholder" not in src.lower():
                src_url = src if src.startswith("http") else urljoin(BASE_URL, src)
                if src_url not in all_images:
                    all_images.append(src_url)

    if all_images:
        data["all_images"] = "|".join(all_images[:20])  # Store up to 20 image URLs

    # Main product image (best quality)
    main_img_el = soup.select_one(".product-media img.no-display, "
                                   ".fotorama__img--full, .gallery-placeholder__image, "
                                   ".product-image-photo")
    if main_img_el:
        main_src = (main_img_el.get("src") or main_img_el.get("data-src") or
                    main_img_el.get("data-zoom-image") or "")
        if main_src and "placeholder" not in main_src:
            data["image_url"] = main_src if main_src.startswith("http") else urljoin(BASE_URL, main_src)

    # Refine model code from page
    if not data.get("model_code"):
        sku_el = soup.select_one(".product-info-sku, [itemprop='sku'], .sku")
        if sku_el:
            sku_text = sku_el.get_text(strip=True)
            data["model_code"] = extract_model_code(sku_text) or sku_text[:30]

    # Refine name
    h1 = soup.select_one("h1.page-title, h1[itemprop='name'], h1")
    if h1:
        data["name"] = h1.get_text(strip=True)

    return data


# ---------------------------------------------------------------------------
# Main scraper
# ---------------------------------------------------------------------------

def scrape_category(conn, category):
    name = category["name"]
    base_path = category["url"]
    cat_url = urljoin(BASE_URL, base_path)

    log.info(f"\n{'='*60}")
    log.info(f"Category: {name} → {cat_url}")
    log.info(f"{'='*60}")

    # Fetch first page to find total
    r = fetch(cat_url)
    if not r:
        log.warning(f"  Cannot fetch {cat_url}")
        return 0

    time.sleep(DELAY)
    soup = BeautifulSoup(r.text, "lxml")
    total = parse_toolbar_total(soup)

    if total == 0:
        # Try to count items on page
        items = soup.select("li.product-item, .item.product")
        total = len(items)
        if total == 0:
            log.warning(f"  No products found on {cat_url}")
            return 0

    per_page = 36
    total_pages = max(1, math.ceil(total / per_page))
    log.info(f"  Total: {total} products across {total_pages} pages")

    all_product_stubs = []

    # Collect all product stubs from all listing pages
    for page_num in range(1, total_pages + 1):
        if page_num == 1:
            page_url = cat_url
        else:
            page_url = f"{cat_url}?p={page_num}"

        log.info(f"  Page {page_num}/{total_pages}: {page_url}")

        if page_num > 1:
            r = fetch(page_url)
            if not r:
                log.warning(f"    Skipping page {page_num}")
                continue
            soup = BeautifulSoup(r.text, "lxml")
            time.sleep(DELAY)

        items = parse_product_items(soup, name)
        log.info(f"    Found {len(items)} products on this page")
        all_product_stubs.extend(items)

    log.info(f"\n  Total stubs collected: {len(all_product_stubs)}")
    detail_scraped = 0

    # Now fetch each product detail page
    for i, stub in enumerate(all_product_stubs, 1):
        url = stub.get("product_url", "")
        if not url:
            continue

        if product_exists(conn, url):
            log.info(f"  [{i}/{len(all_product_stubs)}] Already in DB: {stub['name'][:50]}")
            # Still update image if missing
            row = conn.execute("SELECT local_image_path, image_url FROM products WHERE page_url = ?", (url,)).fetchone()
            if row and not row["local_image_path"] and row["image_url"]:
                local = download_image(row["image_url"])
                if local:
                    conn.execute("UPDATE products SET local_image_path = ? WHERE page_url = ?", (local, url))
                    conn.commit()
            continue

        log.info(f"  [{i}/{len(all_product_stubs)}] Fetching: {stub['name'][:50]}")
        r = fetch(url)
        time.sleep(DELAY)

        if r:
            detail_soup = BeautifulSoup(r.text, "lxml")
            product_data = parse_product_detail(detail_soup, url, stub)
        else:
            product_data = stub

        # Download main image
        img_url = product_data.get("image_url", "")
        local_img = download_image(img_url)
        product_data["local_image_path"] = local_img or ""

        upsert_product(conn, product_data)
        detail_scraped += 1

        # Also download additional images in background
        if product_data.get("all_images"):
            for extra_url in product_data["all_images"].split("|")[1:5]:  # Up to 4 extra images
                download_image(extra_url)
                time.sleep(0.1)

    log.info(f"\n  Category {name} done: {detail_scraped} new products scraped")
    return detail_scraped


def main():
    conn = get_db()
    ensure_products_table(conn)

    log.info("Starting paginated product scraper for reginox.com")
    log.info(f"Database: {DB_PATH}")
    log.info(f"Image dir: {IMG_DIR}")

    total_new = 0
    for category in CATEGORIES:
        try:
            n = scrape_category(conn, category)
            total_new += n
        except KeyboardInterrupt:
            log.info("\nInterrupted by user")
            break
        except Exception as e:
            log.error(f"Error in category {category['name']}: {e}", exc_info=True)

    # Final summary
    total_products = conn.execute("SELECT COUNT(*) FROM products").fetchone()[0]
    total_images = conn.execute("SELECT COUNT(*) FROM products WHERE local_image_path != ''").fetchone()[0]
    log.info(f"\n{'='*60}")
    log.info(f"DONE: {total_products} total products in DB, {total_images} with local images")
    log.info(f"New products scraped this run: {total_new}")
    log.info(f"{'='*60}")
    conn.close()


if __name__ == "__main__":
    main()
