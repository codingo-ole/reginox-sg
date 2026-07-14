#!/usr/bin/env python3
"""Scrape missing product detail pages + all filter category pages."""
import sqlite3, re, time, hashlib, logging, os
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

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120 Safari/537.36",
    "Accept-Language": "en-GB,en;q=0.9",
}
SESSION = requests.Session()
SESSION.headers.update(HEADERS)
DELAY = 0.4

def url_to_filename(url):
    parsed = urlparse(url)
    path = parsed.path.strip("/").replace("/", "_")
    if not path: path = "home"
    if len(path) > 120:
        path = path[:80] + "_" + hashlib.md5(path.encode()).hexdigest()[:8]
    return path + ".html"

def download_image(url):
    if not url or not url.startswith("http"): return
    fname = Path(urlparse(url).path).name
    if not fname or len(fname) < 4: return
    dest = ASSETS_IMG / fname
    if dest.exists(): return
    try:
        r = SESSION.get(url, timeout=20, stream=True)
        if r.status_code == 200:
            with open(dest, "wb") as f:
                for chunk in r.iter_content(8192): f.write(chunk)
    except: pass

def scrape_page(url, force=False):
    fname = url_to_filename(url)
    dest = PAGES_DIR / fname
    if dest.exists() and not force:
        return fname
    try:
        r = SESSION.get(url, timeout=25)
        if r.status_code != 200:
            log.warning(f"  HTTP {r.status_code}: {url}")
            return None
        html = r.text
        # Fix relative asset paths
        html = html.replace("../assets/", "/assets/")
        soup = BeautifulSoup(html, "lxml")
        for img in soup.select("img[src]"):
            src = img.get("src","")
            if "media/catalog/product" in src:
                download_image(src)
        with open(dest, "w", encoding="utf-8") as f:
            f.write(html)
        return fname
    except Exception as e:
        log.warning(f"  Error {url}: {e}")
        return None

def main():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row

    # 1. Scrape missing product detail pages
    missing = conn.execute("""
        SELECT id, name, page_url FROM products
        WHERE (local_page IS NULL OR local_page = '')
          AND page_url LIKE 'http%'
          AND name != ''
        ORDER BY category, name
    """).fetchall()

    log.info(f"\n{'='*60}")
    log.info(f"STEP 1: Scraping {len(missing)} missing product detail pages")
    log.info(f"{'='*60}")

    done = 0
    for i, p in enumerate(missing, 1):
        url = p["page_url"]
        fname = url_to_filename(url)

        # Check if file already exists even though DB doesn't know
        if (PAGES_DIR / fname).exists():
            conn.execute("UPDATE products SET local_page = ? WHERE id = ?", (fname, p["id"]))
            if i % 50 == 0: conn.commit()
            continue

        log.info(f"  [{i}/{len(missing)}] {p['name'][:55]}")
        fname = scrape_page(url)
        if fname:
            conn.execute("UPDATE products SET local_page = ? WHERE id = ?", (fname, p["id"]))
            done += 1
        time.sleep(DELAY)

        if i % 50 == 0:
            conn.commit()
            log.info(f"  Progress {i}/{len(missing)}, new: {done}")

    conn.commit()
    log.info(f"Step 1 done: {done} new product pages scraped")

    # 2. Scrape all filter category pages
    filter_urls_file = Path("/tmp/filter_urls.txt")
    filter_urls = []
    if filter_urls_file.exists():
        filter_urls = [l.strip() for l in filter_urls_file.read_text().splitlines() if l.strip()]

    log.info(f"\n{'='*60}")
    log.info(f"STEP 2: Scraping {len(filter_urls)} filter category pages")
    log.info(f"{'='*60}")

    filter_done = 0
    for i, url in enumerate(filter_urls, 1):
        fname = url_to_filename(url)
        if (PAGES_DIR / fname).exists():
            log.info(f"  [{i}/{len(filter_urls)}] Already exists: {fname}")
            continue
        log.info(f"  [{i}/{len(filter_urls)}] {url}")
        if scrape_page(url):
            filter_done += 1
        time.sleep(DELAY)

    # 3. Scrape paginated sinks pages (?p=2 etc.) that aren't saved yet
    log.info(f"\n{'='*60}")
    log.info(f"STEP 3: Scraping paginated listing pages")
    log.info(f"{'='*60}")

    LISTING_BASES = [
        ("https://www.reginox.com/product-range/sinks", 8),
        ("https://www.reginox.com/product-range/taps", 2),
        ("https://www.reginox.com/assortiment/accessoires", 2),
        ("https://www.reginox.com/assortiment/toebehoren", 2),
        ("https://www.reginox.com/assortiment/werkbladen/rvs", 2),
        ("https://www.reginox.com/assortiment/werkbladen/tap-en-lekbladen", 1),
    ]
    for base_url, max_pages in LISTING_BASES:
        for page in range(1, max_pages + 1):
            url = f"{base_url}?p={page}" if page > 1 else base_url
            # Use a special filename for paginated pages
            parsed = urlparse(base_url)
            base_slug = parsed.path.strip("/").replace("/", "_")
            fname = f"{base_slug}_p{page}.html" if page > 1 else f"{base_slug}.html"

            if (PAGES_DIR / fname).exists():
                continue
            log.info(f"  Listing: {url}")
            r_html = scrape_page(url)
            if r_html and r_html != fname:
                # Rename to consistent name
                src = PAGES_DIR / r_html
                dst = PAGES_DIR / fname
                if src.exists():
                    src.rename(dst)
            time.sleep(DELAY)

    total_pages = len(list(PAGES_DIR.glob("*.html")))
    log.info(f"\n{'='*60}")
    log.info(f"DONE!")
    log.info(f"  Product pages scraped: {done}")
    log.info(f"  Filter pages scraped: {filter_done}")
    log.info(f"  Total HTML pages: {total_pages}")
    log.info(f"{'='*60}")
    conn.close()

if __name__ == "__main__":
    main()
