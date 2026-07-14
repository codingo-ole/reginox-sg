#!/usr/bin/env python3
"""
Reginox Website Full Scraper
Downloads all pages, assets (images, CSS, JS, fonts), and builds a local database.
"""

import os
import re
import json
import time
import sqlite3
import hashlib
import mimetypes
import urllib.parse
from pathlib import Path
from collections import deque
from datetime import datetime

import requests
from bs4 import BeautifulSoup

# ─────────────────────────────────────────
BASE_URL   = "https://www.reginox.com"
OUT_DIR    = Path(__file__).parent / "site_mirror"
DB_PATH    = Path(__file__).parent / "reginox.db"
ASSETS_DIR = OUT_DIR / "assets"
PAGES_DIR  = OUT_DIR / "pages"

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/120.0.0.0 Safari/537.36"
    ),
    "Accept-Language": "en-US,en;q=0.9",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
}

ASSET_EXTS = {
    ".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg", ".ico",
    ".mp4", ".webm", ".mov", ".avi",
    ".css", ".js",
    ".woff", ".woff2", ".ttf", ".eot", ".otf",
    ".pdf", ".zip",
}

SKIP_EXTENSIONS = {".php", ".asp", ".aspx"}
MAX_PAGES = 300
DELAY = 0.4   # seconds between requests

# ─────────────────────────────────────────
session = requests.Session()
session.headers.update(HEADERS)

visited_pages  = set()
visited_assets = set()
downloaded_assets = {}
failed_urls = []

log_lines = []

def log(msg):
    ts = datetime.now().strftime("%H:%M:%S")
    line = f"[{ts}] {msg}"
    print(line)
    log_lines.append(line)


def setup_dirs():
    for d in [OUT_DIR, ASSETS_DIR, PAGES_DIR,
              ASSETS_DIR/"images", ASSETS_DIR/"css",
              ASSETS_DIR/"js", ASSETS_DIR/"fonts",
              ASSETS_DIR/"video", ASSETS_DIR/"other"]:
        d.mkdir(parents=True, exist_ok=True)


def setup_db():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.executescript("""
    CREATE TABLE IF NOT EXISTS pages (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        url         TEXT UNIQUE,
        title       TEXT,
        description TEXT,
        html_path   TEXT,
        status_code INTEGER,
        scraped_at  TEXT
    );
    CREATE TABLE IF NOT EXISTS assets (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        original_url TEXT UNIQUE,
        local_path   TEXT,
        asset_type   TEXT,
        file_size    INTEGER,
        mime_type    TEXT,
        downloaded_at TEXT
    );
    CREATE TABLE IF NOT EXISTS products (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        name        TEXT,
        model_code  TEXT,
        collection  TEXT,
        material    TEXT,
        dimensions  TEXT,
        description TEXT,
        colors      TEXT,
        image_urls  TEXT,
        page_url    TEXT,
        category    TEXT
    );
    CREATE TABLE IF NOT EXISTS links (
        id       INTEGER PRIMARY KEY AUTOINCREMENT,
        from_url TEXT,
        to_url   TEXT,
        anchor   TEXT
    );
    CREATE TABLE IF NOT EXISTS metadata (
        key   TEXT PRIMARY KEY,
        value TEXT
    );
    INSERT OR IGNORE INTO metadata VALUES ('scraped_at', datetime('now'));
    INSERT OR IGNORE INTO metadata VALUES ('base_url', 'https://www.reginox.com');
    """)
    conn.commit()
    return conn


def is_internal(url):
    parsed = urllib.parse.urlparse(url)
    return (not parsed.netloc) or (parsed.netloc in ("www.reginox.com", "reginox.com"))


def normalize_url(url, base=BASE_URL):
    if not url or url.startswith(("mailto:", "tel:", "javascript:", "#")):
        return None
    url = url.strip()
    if url.startswith("//"):
        url = "https:" + url
    if url.startswith("/"):
        url = BASE_URL + url
    if not url.startswith("http"):
        url = urllib.parse.urljoin(base, url)
    # Remove fragment
    url = url.split("#")[0].rstrip("/") or url
    return url


def asset_local_path(url, mime=None):
    ext = Path(urllib.parse.urlparse(url).path).suffix.lower()
    if not ext and mime:
        ext = mimetypes.guess_extension(mime.split(";")[0].strip()) or ""

    fname = hashlib.md5(url.encode()).hexdigest()[:12] + ext

    if ext in {".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg", ".ico"}:
        folder = ASSETS_DIR / "images"
        atype  = "image"
    elif ext in {".mp4", ".webm", ".mov", ".avi", ".ogv"}:
        folder = ASSETS_DIR / "video"
        atype  = "video"
    elif ext == ".css":
        folder = ASSETS_DIR / "css"
        atype  = "css"
    elif ext == ".js":
        folder = ASSETS_DIR / "js"
        atype  = "js"
    elif ext in {".woff", ".woff2", ".ttf", ".eot", ".otf"}:
        folder = ASSETS_DIR / "fonts"
        atype  = "font"
    elif ext == ".pdf":
        folder = ASSETS_DIR / "other"
        atype  = "pdf"
    else:
        folder = ASSETS_DIR / "other"
        atype  = "other"

    return folder / fname, atype


def download_asset(url, conn):
    if url in visited_assets:
        return downloaded_assets.get(url)
    visited_assets.add(url)

    try:
        r = session.get(url, timeout=20, stream=True)
        if r.status_code != 200:
            return None

        mime = r.headers.get("Content-Type", "")
        local_path, atype = asset_local_path(url, mime)
        size = 0
        with open(local_path, "wb") as f:
            for chunk in r.iter_content(8192):
                f.write(chunk)
                size += len(chunk)

        rel = str(local_path.relative_to(OUT_DIR))
        downloaded_assets[url] = rel

        conn.execute("""
            INSERT OR IGNORE INTO assets
            (original_url, local_path, asset_type, file_size, mime_type, downloaded_at)
            VALUES (?, ?, ?, ?, ?, datetime('now'))
        """, (url, rel, atype, size, mime))
        conn.commit()

        log(f"  ✓ Asset [{atype}] {size//1024}KB — {url[-70:]}")
        return rel

    except Exception as e:
        failed_urls.append((url, str(e)))
        log(f"  ✗ Asset FAIL {url[-60:]}: {e}")
        return None


def extract_assets(soup, page_url, conn):
    """Find and download all referenced assets in a parsed page."""
    asset_urls = set()

    # Images
    for tag in soup.find_all(["img", "source"]):
        for attr in ["src", "srcset", "data-src", "data-srcset"]:
            val = tag.get(attr, "")
            for part in val.split(","):
                u = normalize_url(part.strip().split(" ")[0], page_url)
                if u:
                    asset_urls.add(u)

    # CSS links
    for tag in soup.find_all("link", rel=lambda r: r and "stylesheet" in r):
        u = normalize_url(tag.get("href", ""), page_url)
        if u:
            asset_urls.add(u)

    # JS scripts
    for tag in soup.find_all("script", src=True):
        u = normalize_url(tag["src"], page_url)
        if u:
            asset_urls.add(u)

    # Video sources
    for tag in soup.find_all(["video", "source"]):
        for attr in ["src", "poster"]:
            u = normalize_url(tag.get(attr, ""), page_url)
            if u:
                asset_urls.add(u)

    # Background images in inline styles
    for tag in soup.find_all(style=True):
        urls_in_style = re.findall(r'url\(["\']?([^"\')\s]+)["\']?\)', tag["style"])
        for u in urls_in_style:
            nu = normalize_url(u, page_url)
            if nu:
                asset_urls.add(nu)

    # Favicon & apple touch
    for tag in soup.find_all("link", href=True):
        rel = " ".join(tag.get("rel", []))
        if any(x in rel for x in ["icon", "apple-touch"]):
            u = normalize_url(tag["href"], page_url)
            if u:
                asset_urls.add(u)

    # Download all found assets
    for u in asset_urls:
        ext = Path(urllib.parse.urlparse(u).path).suffix.lower()
        if ext in SKIP_EXTENSIONS:
            continue
        download_asset(u, conn)

    return asset_urls


def extract_product_data(soup, page_url, conn):
    """Heuristically extract product info from the page."""
    products = []

    # Look for product containers using common class names
    selectors = [
        soup.find_all(class_=lambda c: c and any(
            x in c for x in ["product", "item", "sink", "tap", "model"]
        )),
        soup.find_all("article"),
    ]

    for container_list in selectors:
        for container in container_list:
            name = ""
            model = ""
            desc = ""
            imgs = []

            # Try to find name
            for tag in ["h1","h2","h3","h4"]:
                el = container.find(tag)
                if el and el.get_text(strip=True):
                    name = el.get_text(strip=True)
                    break

            # Model code — look for patterns like R35153
            text = container.get_text(" ", strip=True)
            model_match = re.search(r'\b(R\d{4,6}[A-Z\-]*)\b', text)
            if model_match:
                model = model_match.group(1)

            # Description
            p = container.find("p")
            if p:
                desc = p.get_text(strip=True)

            # Images
            for img in container.find_all("img"):
                src = img.get("src") or img.get("data-src", "")
                if src:
                    imgs.append(normalize_url(src, page_url) or src)

            if name or model:
                products.append({
                    "name": name,
                    "model_code": model,
                    "description": desc,
                    "image_urls": json.dumps(imgs),
                    "page_url": page_url,
                })

    for p in products:
        try:
            conn.execute("""
                INSERT OR IGNORE INTO products
                (name, model_code, description, image_urls, page_url)
                VALUES (:name, :model_code, :description, :image_urls, :page_url)
            """, p)
        except Exception:
            pass
    if products:
        conn.commit()

    return products


def save_page_html(url, html, title, desc, status, conn):
    """Rewrite asset references to local paths and save HTML."""
    safe = re.sub(r'[^\w\-]', '_', url.replace(BASE_URL, "").strip("/")) or "home"
    html_path = PAGES_DIR / f"{safe}.html"

    # Rewrite asset URLs to local relative paths
    rewritten = html
    for orig_url, local_rel in downloaded_assets.items():
        rewritten = rewritten.replace(orig_url, f"../assets/{Path(local_rel).name}")
        short = orig_url.replace(BASE_URL, "")
        if short:
            rewritten = rewritten.replace(short, f"../assets/{Path(local_rel).name}")

    with open(html_path, "w", encoding="utf-8") as f:
        f.write(rewritten)

    rel = str(html_path.relative_to(OUT_DIR))
    conn.execute("""
        INSERT OR REPLACE INTO pages
        (url, title, description, html_path, status_code, scraped_at)
        VALUES (?, ?, ?, ?, ?, datetime('now'))
    """, (url, title, desc, rel, status))
    conn.commit()
    return rel


def scrape_page(url, conn):
    """Fetch one page, download its assets, extract links."""
    if url in visited_pages:
        return []
    visited_pages.add(url)

    log(f"\n[{len(visited_pages)}] Scraping: {url}")
    time.sleep(DELAY)

    try:
        r = session.get(url, timeout=30)
    except Exception as e:
        log(f"  ✗ Request failed: {e}")
        failed_urls.append((url, str(e)))
        return []

    if r.status_code != 200:
        log(f"  ✗ HTTP {r.status_code}")
        return []

    soup = BeautifulSoup(r.text, "lxml")
    title = soup.title.string.strip() if soup.title else ""
    desc_tag = soup.find("meta", {"name": "description"})
    desc = desc_tag["content"].strip() if desc_tag and desc_tag.get("content") else ""

    log(f"  Title: {title[:70]}")

    # Download assets
    extract_assets(soup, url, conn)

    # Extract product data
    prods = extract_product_data(soup, url, conn)
    if prods:
        log(f"  → Found {len(prods)} product entries")

    # Save HTML
    save_page_html(url, r.text, title, desc, r.status_code, conn)

    # Extract internal links
    new_links = []
    for a in soup.find_all("a", href=True):
        href = a["href"].strip()
        full = normalize_url(href, url)
        if not full:
            continue
        if not is_internal(full):
            continue
        ext = Path(urllib.parse.urlparse(full).path).suffix.lower()
        if ext and ext not in ("", ".html", ".htm") and ext not in ASSET_EXTS:
            continue
        if ext in SKIP_EXTENSIONS:
            continue
        if full not in visited_pages:
            new_links.append(full)
            # Save link relationship
            conn.execute("INSERT INTO links (from_url, to_url, anchor) VALUES (?, ?, ?)",
                         (url, full, a.get_text(strip=True)[:100]))

    conn.commit()
    return list(set(new_links))


def scrape_css_assets(conn):
    """Parse downloaded CSS files to extract @import and url() references."""
    log("\n=== Scanning CSS for embedded assets ===")
    css_dir = ASSETS_DIR / "css"
    for css_file in css_dir.glob("*.css"):
        text = css_file.read_text(encoding="utf-8", errors="ignore")
        urls = re.findall(r'url\(["\']?([^"\')\s]+)["\']?\)', text)
        imports = re.findall(r'@import\s+["\']([^"\']+)["\']', text)
        for u in urls + imports:
            if u.startswith("data:"):
                continue
            full = normalize_url(u, BASE_URL)
            if full:
                download_asset(full, conn)


def run():
    log("=" * 60)
    log("REGINOX FULL SITE SCRAPER")
    log(f"Target : {BASE_URL}")
    log(f"Output : {OUT_DIR}")
    log(f"DB     : {DB_PATH}")
    log("=" * 60)

    setup_dirs()
    conn = setup_db()

    # Seed pages to visit — all known URL paths
    seed_urls = [
        BASE_URL,
        BASE_URL + "/productrange",
        BASE_URL + "/productrange/sinks",
        BASE_URL + "/productrange/taps",
        BASE_URL + "/productrange/accessories",
        BASE_URL + "/productrange/attachments",
        BASE_URL + "/productrange/stainless-steel-worktops",
        BASE_URL + "/productrange/bar-tops",
        BASE_URL + "/inspiration",
        BASE_URL + "/inspiration/new-york",
        BASE_URL + "/inspiration/miami",
        BASE_URL + "/inspiration/colorado",
        BASE_URL + "/inspiration/ohio",
        BASE_URL + "/inspiration/panama",
        BASE_URL + "/inspiration/regi-granite",
        BASE_URL + "/inspiration/elite-granite",
        BASE_URL + "/inspiration/new-jersey",
        BASE_URL + "/inspiration/clean-care",
        BASE_URL + "/about-reginox",
        BASE_URL + "/about-reginox/history",
        BASE_URL + "/about-reginox/certificates",
        BASE_URL + "/about-reginox/news",
        BASE_URL + "/about-reginox/csr",
        BASE_URL + "/about-reginox/downloads",
        BASE_URL + "/service",
        BASE_URL + "/service/installation-methods",
        BASE_URL + "/service/warranty",
        BASE_URL + "/service/maintenance",
        BASE_URL + "/service/faq",
        BASE_URL + "/contact",
        BASE_URL + "/en",
        BASE_URL + "/nl",
        BASE_URL + "/de",
    ]

    queue = deque(seed_urls)

    while queue and len(visited_pages) < MAX_PAGES:
        url = queue.popleft()
        if url in visited_pages:
            continue
        new_links = scrape_page(url, conn)
        for l in new_links:
            if l not in visited_pages:
                queue.append(l)

    # Second pass — scan CSS for more assets
    scrape_css_assets(conn)

    # ── Final stats ──────────────────────────────────
    c = conn.cursor()
    n_pages    = c.execute("SELECT COUNT(*) FROM pages").fetchone()[0]
    n_assets   = c.execute("SELECT COUNT(*) FROM assets").fetchone()[0]
    n_products = c.execute("SELECT COUNT(*) FROM products").fetchone()[0]
    n_images   = c.execute("SELECT COUNT(*) FROM assets WHERE asset_type='image'").fetchone()[0]
    n_videos   = c.execute("SELECT COUNT(*) FROM assets WHERE asset_type='video'").fetchone()[0]
    n_css      = c.execute("SELECT COUNT(*) FROM assets WHERE asset_type='css'").fetchone()[0]
    n_js       = c.execute("SELECT COUNT(*) FROM assets WHERE asset_type='js'").fetchone()[0]
    n_fonts    = c.execute("SELECT COUNT(*) FROM assets WHERE asset_type='font'").fetchone()[0]
    n_failed   = len(failed_urls)

    log("\n" + "=" * 60)
    log("SCRAPING COMPLETE")
    log("=" * 60)
    log(f"Pages scraped   : {n_pages}")
    log(f"Assets total    : {n_assets}")
    log(f"  ├─ Images     : {n_images}")
    log(f"  ├─ Videos     : {n_videos}")
    log(f"  ├─ CSS files  : {n_css}")
    log(f"  ├─ JS files   : {n_js}")
    log(f"  └─ Fonts      : {n_fonts}")
    log(f"Products found  : {n_products}")
    log(f"Failed URLs     : {n_failed}")
    log(f"Database        : {DB_PATH}")
    log("=" * 60)

    # Save log file
    with open(OUT_DIR / "scrape_log.txt", "w") as f:
        f.write("\n".join(log_lines))

    # Save failed URLs
    if failed_urls:
        with open(OUT_DIR / "failed_urls.txt", "w") as f:
            for u, err in failed_urls:
                f.write(f"{u}\t{err}\n")

    # Export products as JSON
    rows = c.execute("SELECT * FROM products").fetchall()
    cols = [d[0] for d in c.description]
    products_json = [dict(zip(cols, r)) for r in rows]
    with open(OUT_DIR / "products.json", "w") as f:
        json.dump(products_json, f, indent=2, ensure_ascii=False)

    # Export pages index as JSON
    rows = c.execute("SELECT url, title, description, html_path, status_code FROM pages").fetchall()
    pages_json = [{"url":r[0],"title":r[1],"desc":r[2],"path":r[3],"status":r[4]} for r in rows]
    with open(OUT_DIR / "pages_index.json", "w") as f:
        json.dump(pages_json, f, indent=2, ensure_ascii=False)

    conn.close()
    log(f"\nAll files saved to: {OUT_DIR}")
    log(f"Products JSON : {OUT_DIR}/products.json")
    log(f"Pages index   : {OUT_DIR}/pages_index.json")


if __name__ == "__main__":
    run()
