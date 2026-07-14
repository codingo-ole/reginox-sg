#!/usr/bin/env python3
"""Scrape all individual product detail pages from the database URLs."""
import sqlite3, re, time, hashlib, logging
import requests
from pathlib import Path
from urllib.parse import urlparse
from bs4 import BeautifulSoup

logging.basicConfig(level=logging.INFO, format="[%(asctime)s] %(message)s", datefmt="%H:%M:%S")
log = logging.getLogger(__name__)

DIR = Path(__file__).parent
DB_PATH = DIR / "reginox.db"
PAGES_DIR = DIR / "site_mirror" / "pages"
ASSETS_IMG = DIR / "site_mirror" / "assets" / "images"
PAGES_DIR.mkdir(parents=True, exist_ok=True)

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
    "Accept-Language": "en-GB,en;q=0.9",
}
SESSION = requests.Session()
SESSION.headers.update(HEADERS)
DELAY = 0.4

def url_to_filename(url):
    """Convert a URL to a safe filename."""
    parsed = urlparse(url)
    path = parsed.path.strip("/").replace("/", "_")
    if not path:
        path = "home"
    # Truncate if too long
    if len(path) > 120:
        path = path[:80] + "_" + hashlib.md5(path.encode()).hexdigest()[:8]
    return path + ".html"

def rewrite_html(content, page_path):
    """Rewrite asset paths and internal links in HTML."""
    # Fix asset paths: ../assets/X → /assets/X and /static/X → /assets/X
    content = content.replace("../assets/", "/assets/")
    content = re.sub(r'src="https?://www\.reginox\.com/static/version[^"]+/([^"]+)"',
                     lambda m: f'src="/assets/{Path(m.group(1)).name}"', content)
    return content

def download_image(url):
    """Download image if not already saved."""
    if not url or not url.startswith("http"):
        return
    fname = Path(urlparse(url).path).name
    if not fname or len(fname) < 4:
        return
    dest = ASSETS_IMG / fname
    if dest.exists():
        return
    try:
        r = SESSION.get(url, timeout=20, stream=True)
        if r.status_code == 200:
            with open(dest, "wb") as f:
                for chunk in r.iter_content(8192):
                    f.write(chunk)
            log.info(f"  IMG {dest.stat().st_size//1024}KB: {fname}")
    except Exception as e:
        log.warning(f"  IMG fail: {e}")

def scrape_page(url):
    """Fetch URL and save HTML locally. Return local filename."""
    fname = url_to_filename(url)
    dest = PAGES_DIR / fname
    if dest.exists():
        return fname

    try:
        r = SESSION.get(url, timeout=20)
        if r.status_code != 200:
            log.warning(f"  HTTP {r.status_code}: {url}")
            return None

        html = rewrite_html(r.text, fname)
        soup = BeautifulSoup(html, "lxml")

        # Download all product images found on the page
        for img in soup.select("img[src]"):
            src = img.get("src", "")
            if "media/catalog/product" in src or "wysiwyg" in src:
                download_image(src)

        with open(dest, "w", encoding="utf-8") as f:
            f.write(html)

        log.info(f"  Saved: {fname}")
        return fname

    except Exception as e:
        log.warning(f"  Error {url}: {e}")
        return None

def main():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row

    # Get all product URLs from DB
    products = conn.execute(
        "SELECT id, name, page_url FROM products WHERE page_url LIKE 'http%' AND name != '' ORDER BY category, name"
    ).fetchall()

    log.info(f"Found {len(products)} products to scrape detail pages for")

    done = 0
    for i, p in enumerate(products, 1):
        url = p["page_url"]
        if not url or not url.startswith("http"):
            continue

        fname = url_to_filename(url)
        dest = PAGES_DIR / fname

        if dest.exists():
            # Already scraped - update DB with filename
            conn.execute("UPDATE products SET local_page = ? WHERE id = ?", (fname, p["id"]))
        else:
            log.info(f"[{i}/{len(products)}] {p['name'][:50]}")
            fname = scrape_page(url)
            if fname:
                conn.execute("UPDATE products SET local_page = ? WHERE id = ?", (fname, p["id"]))
                done += 1
            time.sleep(DELAY)

        if i % 50 == 0:
            conn.commit()
            log.info(f"Progress: {i}/{len(products)}, new pages: {done}")

    conn.commit()

    # Also scrape category pages that are missing
    EXTRA_URLS = [
        "https://www.reginox.com/product-range/sinks",
        "https://www.reginox.com/product-range/taps",
        "https://www.reginox.com/assortiment/accessoires",
        "https://www.reginox.com/assortiment/toebehoren",
        "https://www.reginox.com/assortiment/werkbladen/rvs",
        "https://www.reginox.com/assortiment/werkbladen/tap-en-lekbladen",
        "https://www.reginox.com/inspiration",
        "https://www.reginox.com/service",
        "https://www.reginox.com/customer-contact",
        "https://www.reginox.com/new-york",
        "https://www.reginox.com/miami",
        "https://www.reginox.com/ohio",
        "https://www.reginox.com/colorado",
        "https://www.reginox.com/panama",
        "https://www.reginox.com/new-jersey",
        "https://www.reginox.com/clean-and-care",
    ]
    log.info(f"\nScraping {len(EXTRA_URLS)} extra pages...")
    for url in EXTRA_URLS:
        fname = url_to_filename(url)
        if not (PAGES_DIR / fname).exists():
            log.info(f"Extra: {url}")
            scrape_page(url)
            time.sleep(DELAY)

    # Add local_page column if missing
    try:
        conn.execute("ALTER TABLE products ADD COLUMN local_page TEXT")
        conn.commit()
    except:
        pass

    total_pages = len(list(PAGES_DIR.glob("*.html")))
    log.info(f"\nDone! {done} new product pages scraped. Total HTML pages: {total_pages}")
    conn.close()

if __name__ == "__main__":
    main()
