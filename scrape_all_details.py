#!/usr/bin/env python3
"""
Re-scrapes ALL product detail pages for all categories.
- Downloads full gallery images (from text/x-magento-init JSON)
- Downloads DXF/PDF/STP/JPG files from /media//dxf/
- Updates DB: all_images, download_files columns
- Saves fresh HTML to site_mirror/pages/
- Also adds download_files column to DB if missing
"""

import re
import json
import time
import sqlite3
import logging
import requests
from pathlib import Path
from urllib.parse import urljoin, urlparse

logging.basicConfig(level=logging.INFO, format="[%(asctime)s] %(message)s", datefmt="%H:%M:%S")
log = logging.getLogger(__name__)

BASE_URL = "https://www.reginox.com"
DIR = Path(__file__).parent
DB_PATH = DIR / "reginox.db"
IMG_DIR = DIR / "site_mirror" / "assets" / "images"
DXF_DIR = DIR / "site_mirror" / "assets" / "dxf"
PAGES_DIR = DIR / "site_mirror" / "pages"

IMG_DIR.mkdir(parents=True, exist_ok=True)
DXF_DIR.mkdir(parents=True, exist_ok=True)
PAGES_DIR.mkdir(parents=True, exist_ok=True)

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120 Safari/537.36",
    "Accept-Language": "en-GB,en;q=0.9",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
}

DELAY = 1.5

SESSION = requests.Session()
SESSION.headers.update(HEADERS)


def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    # Add download_files column if missing
    try:
        conn.execute("ALTER TABLE products ADD COLUMN download_files TEXT")
        conn.commit()
        log.info("Added download_files column to DB")
    except sqlite3.OperationalError:
        pass
    return conn


def fetch(url, retries=3):
    for attempt in range(retries):
        try:
            r = SESSION.get(url, timeout=25)
            if r.status_code == 200:
                return r
            if r.status_code == 429:
                log.warning(f"  Rate limited — waiting 15s...")
                time.sleep(15)
                continue
            log.warning(f"  HTTP {r.status_code}: {url}")
            return None
        except Exception as e:
            log.warning(f"  Attempt {attempt+1} failed: {e}")
            time.sleep(3)
    return None


def download_file(url, dest_dir, fname=None):
    """Download a file and return local filename, or None on failure."""
    if not fname:
        fname = Path(urlparse(url).path).name
    if not fname or len(fname) < 3:
        return None
    local = dest_dir / fname
    if local.exists() and local.stat().st_size > 0:
        return fname
    try:
        r = SESSION.get(url, timeout=45, stream=True)
        if r.status_code == 200:
            with open(local, "wb") as f:
                for chunk in r.iter_content(8192):
                    f.write(chunk)
            size_kb = local.stat().st_size // 1024
            log.info(f"    Downloaded {size_kb}KB → {fname}")
            return fname
        else:
            log.warning(f"    HTTP {r.status_code} for {url}")
    except Exception as e:
        log.warning(f"    Download failed {url}: {e}")
    return None


def extract_gallery_from_html(html):
    """
    Extract all gallery image URLs from Magento's text/x-magento-init JSON blobs.
    Returns list of dicts: [{thumb, img, full, caption, position, isMain}, ...]
    """
    gallery_items = []
    # Find all text/x-magento-init script blocks
    for m in re.finditer(r'<script[^>]+type=["\']text/x-magento-init["\'][^>]*>([\s\S]*?)</script>', html):
        try:
            data = json.loads(m.group(1))
        except (json.JSONDecodeError, ValueError):
            continue
        # Look for mage/gallery/gallery entry
        for selector, cfg in data.items():
            if "mage/gallery/gallery" in cfg:
                items = cfg["mage/gallery/gallery"].get("data", [])
                for item in items:
                    if item.get("type") == "image" and item.get("img"):
                        gallery_items.append(item)
    return gallery_items


def extract_download_links(html):
    """
    Extract download file links from #downloads.tab section.
    Returns list of dicts: [{url, label, filename, ext}, ...]
    """
    downloads = []
    # Find the downloads tab content
    m = re.search(r'id="downloads\.tab"[^>]*>([\s\S]*?)</div>\s*</div>\s*<script', html)
    if not m:
        m = re.search(r'id="downloads\.tab"[^>]*>([\s\S]*?)(?=</div>\s*</div>\s*<script|<div class="data item title)', html)
    if not m:
        return downloads

    section = m.group(1)
    # Find all download links
    for link_m in re.finditer(r'<a\s+href="(https?://www\.reginox\.com/media/+dxf/+([^"]+))"[^>]*download[^>]*>(.*?)</a>', section):
        url = link_m.group(1)
        fname = link_m.group(2).lstrip("/")  # strip leading slash from double-slash URLs
        label = re.sub(r'<[^>]+>', '', link_m.group(3)).strip()
        ext = Path(fname).suffix.lower()
        if fname:
            downloads.append({"url": url, "label": label, "filename": fname, "ext": ext})

    return downloads


def url_to_page_filename(page_url):
    """Convert a product URL to a local HTML filename."""
    path = urlparse(page_url).path.strip("/")
    # product-range/sinks/admiral-40 → product-range_sinks_admiral-40.html
    fname = path.replace("/", "_") + ".html"
    return fname


def scrape_product(conn, product):
    """Re-scrape one product's detail page. Returns True if successful."""
    page_url = product["page_url"]
    if not page_url or not page_url.startswith("http"):
        return False

    product_id = product["id"]
    name = product["name"] or ""

    log.info(f"  Fetching: {name[:60]} — {page_url}")
    r = fetch(page_url)
    time.sleep(DELAY)

    if not r:
        log.warning(f"  FAILED to fetch {page_url}")
        return False

    html = r.text

    # Extract gallery images
    gallery_items = extract_gallery_from_html(html)
    log.info(f"  Gallery: {len(gallery_items)} images found")

    # Download all gallery images
    all_image_urls = []
    for item in gallery_items:
        img_url = item.get("full") or item.get("img") or ""
        if not img_url:
            continue
        fname = Path(urlparse(img_url).path).name
        downloaded = download_file(img_url, IMG_DIR, fname)
        if downloaded:
            all_image_urls.append(f"/assets/images/{downloaded}")
        else:
            # Keep original URL as fallback
            all_image_urls.append(img_url)

    # Also download thumb images (smaller, for gallery navigation)
    for item in gallery_items:
        thumb_url = item.get("thumb") or ""
        if thumb_url:
            fname = Path(urlparse(thumb_url).path).name
            if not (IMG_DIR / fname).exists():
                download_file(thumb_url, IMG_DIR, fname)
        time.sleep(0.1)

    # Extract and download downloadable files
    downloads = extract_download_links(html)
    log.info(f"  Downloads: {len(downloads)} files found")

    download_records = []
    for dl in downloads:
        fname = download_file(dl["url"], DXF_DIR, dl["filename"])
        download_records.append({
            "url": dl["url"],
            "local": f"/assets/dxf/{dl['filename']}" if fname else None,
            "label": dl["label"],
            "filename": dl["filename"],
            "ext": dl["ext"],
        })
        time.sleep(0.2)

    # Save fresh HTML to pages directory
    page_fname = url_to_page_filename(page_url)
    page_local = PAGES_DIR / page_fname
    try:
        with open(page_local, "w", encoding="utf-8", errors="replace") as f:
            f.write(html)
        log.info(f"  Saved HTML → {page_fname}")
    except Exception as e:
        log.warning(f"  Failed to save HTML: {e}")
        page_fname = None

    # Update main image URL if we have gallery items
    main_img = None
    if gallery_items:
        # isMain=true is the primary image
        main = next((i for i in gallery_items if i.get("isMain")), gallery_items[0])
        full_url = main.get("full") or main.get("img") or ""
        if full_url:
            fname = Path(urlparse(full_url).path).name
            main_img = f"/assets/images/{fname}"

    # Build all_images pipe-separated list
    all_images_str = "|".join(all_image_urls) if all_image_urls else None

    # Update DB
    download_files_json = json.dumps(download_records) if download_records else None

    updates = {}
    if all_images_str:
        updates["all_images"] = all_images_str
    if download_files_json:
        updates["download_files"] = download_files_json
    if page_fname:
        updates["local_page"] = page_fname
    if main_img:
        updates["local_image_path"] = main_img
        updates["image_url"] = (gallery_items[0].get("full") or gallery_items[0].get("img")) if gallery_items else None

    if updates:
        set_clause = ", ".join(f"{k} = ?" for k in updates)
        values = list(updates.values()) + [product_id]
        conn.execute(f"UPDATE products SET {set_clause} WHERE id = ?", values)
        conn.commit()

    return True


def main():
    conn = get_db()

    # Get all products with known categories and valid page_urls
    rows = conn.execute("""
        SELECT id, name, page_url, category, local_page, all_images, download_files
        FROM products
        WHERE page_url IS NOT NULL AND page_url != ''
          AND category IS NOT NULL AND category != ''
        ORDER BY category, id
    """).fetchall()

    log.info(f"Found {len(rows)} products to re-scrape")

    categories = {}
    for row in rows:
        cat = row["category"]
        categories.setdefault(cat, []).append(row)

    for cat, products in categories.items():
        log.info(f"\n{'='*60}")
        log.info(f"Category: {cat} — {len(products)} products")
        log.info(f"{'='*60}")

        for i, product in enumerate(products, 1):
            log.info(f"\n[{i}/{len(products)}]")
            try:
                scrape_product(conn, product)
            except KeyboardInterrupt:
                log.info("\nInterrupted")
                conn.close()
                return
            except Exception as e:
                log.error(f"Error: {e}", exc_info=True)

    # Final stats
    total = conn.execute("SELECT COUNT(*) FROM products WHERE category != '' AND category IS NOT NULL").fetchone()[0]
    with_gallery = conn.execute("SELECT COUNT(*) FROM products WHERE all_images LIKE '%|%'").fetchone()[0]
    with_downloads = conn.execute("SELECT COUNT(*) FROM products WHERE download_files IS NOT NULL").fetchone()[0]
    log.info(f"\n{'='*60}")
    log.info(f"DONE: {total} products total")
    log.info(f"  {with_gallery} with multiple gallery images")
    log.info(f"  {with_downloads} with download files")
    log.info(f"{'='*60}")

    conn.close()


if __name__ == "__main__":
    main()
