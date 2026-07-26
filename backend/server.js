require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });
const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const Database = require("better-sqlite3");

const app = express();
const PORT = process.env.PORT || 3001;

const DB_PATH = path.join(__dirname, "..", "reginox.db");
const SITE_DIR = path.join(__dirname, "..", "site_mirror");
const ASSETS_DIR = path.join(SITE_DIR, "assets");
const PAGES_DIR = path.join(SITE_DIR, "pages");

const db = new Database(DB_PATH, { readonly: true });

app.use(cors());
app.use(express.json());

// ── Asset CDN proxy ─────────────────────────────────────────────────────────
// images/ (492MB), dxf/ (866MB), video/ (173MB) live in a private Backblaze B2
// bucket instead of git, so the repo stays small enough to deploy on free
// hosts. B2 has no CDN of its own (~1.5-2s per direct download, measured), so
// a Cloudflare Worker (cf-worker/worker.js) sits in front of it holding the B2
// credentials as its own secrets, and edge-caches each file after its first
// fetch — repeat requests from anywhere are served from Cloudflare's edge in
// well under 300ms. Locally (site_mirror/assets/{images,dxf,video} still on
// disk) nothing changes — served from disk as always. In production those
// folders don't exist (gitignored), so on a miss we redirect to the Worker.
const CDN_BASE = process.env.CDN_BASE_URL; // e.g. https://reginox-assets.codingoole.workers.dev
const CDN_PREFIXES = ["images", "dxf", "video"];

// ── Smart asset router ─────────────────────────────────────────────────────
const ASSET_SUBDIRS = ["images", "css", "js", "fonts", "video", "dxf", "other", ""];
app.use("/assets", (req, res, next) => {
  // Collapse duplicate slashes: some original hrefs carry them
  // (/media//dxf//FILE.jpg), which path.join() forgives locally but B2 does
  // not — a key with "dxf//FILE" simply doesn't exist there, so the CDN
  // redirect 404s. Normalize before either lookup.
  const fname = req.path.replace(/^\//, "").replace(/\/{2,}/g, "/");
  for (const sub of ASSET_SUBDIRS) {
    const fullPath = sub
      ? path.join(ASSETS_DIR, sub, fname)
      : path.join(ASSETS_DIR, fname);
    if (fs.existsSync(fullPath)) return res.sendFile(fullPath, { dotfiles: 'allow' });
  }
  const topDir = fname.split("/")[0];
  if (CDN_BASE) {
    if (CDN_PREFIXES.includes(topDir)) {
      return res.redirect(302, `${CDN_BASE}/${fname}`);
    }
    // Bare filename (no images/dxf/video prefix in the URL) — the theme
    // references a handful of assets this way (logo.svg, com.png, de.png,
    // gb.png, nl.png, product photos, mounting-method videos, ...) even
    // though they physically live in a subfolder of the B2 bucket. Almost
    // all of them are images/, except pagebuilder <video> tags whose bare
    // .mp4 src lives under video/ instead.
    if (!fname.includes("/")) {
      const prefix = /\.(mp4|webm|mov|m4v)$/i.test(fname) ? "video" : "images";
      return res.redirect(302, `${CDN_BASE}/${prefix}/${fname}`);
    }
  }
  next();
});

// CSS references ../fonts/ relative to /assets/styles-l.css → /fonts/
// Serve those from assets/fonts/
app.use("/fonts", (req, res, next) => {
  const fname = req.path.replace(/^\//, "").split('?')[0];
  const fullPath = path.join(ASSETS_DIR, "fonts", fname);
  if (fs.existsSync(fullPath)) return res.sendFile(fullPath);
  next();
});

// (Theme JS also asks for a root-relative /images/loader-1.gif. Left to 404:
// the origin 404s it too, and resolving it from the mirrored static dir only
// works in dev — that directory is gitignored, so production would keep
// 404ing anyway and the two environments would disagree.)

// Instagram widget feed requested by Magento_Theme/js/theme.js. The origin
// answers with an empty array — the widget has no images — so mirror that
// rather than leaving the request to 404.
app.get("/nbxtheme/instagram/images", (req, res) => res.json([]));

// ── Origin-mirrored assets: /static/* and /media/* ────────────────────────
// RequireJS baseUrl and remaining media URLs (banners, swatches, gallery
// images) were originally live-proxied from reginox.com with an on-disk
// cache-after-first-fetch. That relied on a writable disk that PERSISTS
// between requests — true on Render, but not on serverless hosts (Vercel
// functions get a fresh, ephemeral filesystem per invocation), so every
// request would re-fetch from the live site with no caching benefit, and
// permanently break if reginox.com ever changes or removes the file.
// All 3,031 referenced files were fetched once and now live permanently in
// the same private B2 bucket as /assets (under media/ and static/), fronted
// by the same Cloudflare Worker CDN — this router mirrors the /assets one:
// local disk in dev, CDN redirect in production. No more live fetching.
const ORIGIN_CACHE_DIR = path.join(__dirname, "..", "site_mirror", "origin_cache");
function originRouter(subdir) {
  return (req, res, next) => {
    // Duplicate slashes collapsed for the same reason as in /assets above:
    // B2 has no key containing "//", so an un-normalized CDN redirect 404s.
    const fname = decodeURIComponent(req.path.replace(/^\//, "").split("?")[0])
      .replace(/\/{2,}/g, "/");
    const localPath = path.resolve(path.join(ORIGIN_CACHE_DIR, subdir, fname));
    if (!localPath.startsWith(path.resolve(ORIGIN_CACHE_DIR))) return res.status(400).end();
    // dotfiles:'allow' — Magento uses /.renditions/ paths; sendFile 404s them by default
    if (fs.existsSync(localPath) && fs.statSync(localPath).isFile()) {
      return res.sendFile(localPath, { dotfiles: "allow" });
    }
    if (CDN_BASE) return res.redirect(302, `${CDN_BASE}/${subdir}/${fname}`);
    next();
  };
}
app.use("/static", originRouter("static"));
app.use("/media", originRouter("media"));

// ── Complete URL → local page mapping ─────────────────────────────────────
// URLs keep their ORIGINAL paths (domain stripped) so the clone's URL
// structure is identical to reginox.com. Routes + redirects replicate the
// original server behavior (e.g. /colorado 301s to /inspiration/colorado).
const URL_MAP = {
  // Core pages
  "https://www.reginox.com/": "/",
  "https://www.reginox.com": "/",
  "https://www.reginox.com/home/": "/",
  "https://www.reginox.com/productrange": "/productrange",
  "https://www.reginox.com/product-range": "/product-range",
  "https://www.reginox.com/product-range/sinks": "/product-range/sinks",
  "https://www.reginox.com/product-range/taps": "/product-range/taps",
  "https://www.reginox.com/assortiment/accessoires": "/assortiment/accessoires",
  "https://www.reginox.com/assortiment/toebehoren": "/assortiment/toebehoren",
  "https://www.reginox.com/assortiment/werkbladen/rvs": "/assortiment/werkbladen/rvs",
  "https://www.reginox.com/assortiment/werkbladen/tap-en-lekbladen": "/assortiment/werkbladen/tap-en-lekbladen",
  // About
  "https://www.reginox.com/about-reginox": "/about-reginox",
  "https://www.reginox.com/50-years": "/50-years",
  "https://www.reginox.com/about-reginox/certificates": "/about-reginox/certificates",
  "https://www.reginox.com/about-reginox/csr": "/about-reginox/csr",
  "https://www.reginox.com/about-reginox/downloads": "/about-reginox/downloads",
  "https://www.reginox.com/about-reginox/news-page": "/about-reginox/news-page",
  "https://www.reginox.com/over-reginox/distributor-award-winners": "/over-reginox/distributor-award-winners",
  // Inspiration (legacy root URLs kept — server 301s them like the original)
  "https://www.reginox.com/inspiration": "/inspiration",
  "https://www.reginox.com/all-blogs": "/all-blogs",
  "https://www.reginox.com/clean-and-care": "/clean-and-care",
  "https://www.reginox.com/colorado": "/colorado",
  "https://www.reginox.com/taps1": "/taps1",
  "https://www.reginox.com/miami": "/miami",
  "https://www.reginox.com/new-jersey": "/new-jersey",
  "https://www.reginox.com/new-york": "/new-york",
  "https://www.reginox.com/new-york-pvd": "/new-york-pvd",
  "https://www.reginox.com/ohio": "/ohio",
  "https://www.reginox.com/panama": "/panama",
  "https://www.reginox.com/regi-granite": "/regi-granite",
  "https://www.reginox.com/elite-granite-com": "/elite-granite-com",
  "https://www.reginox.com/inspiration/stainless-steel-worktops": "/inspiration/stainless-steel-worktops",
  // Service & contact
  "https://www.reginox.com/service": "/service",
  "https://www.reginox.com/customer-contact": "/customer-contact",
  // Misc
  "https://www.reginox.com/disclaimer-privacy-com": "/#",
  "https://www.reginox.com/news-reginox-quooker-com": "/inspiration",
  "https://www.reginox.com/catalogsearch/advanced/": "/catalogsearch/advanced/",
  "https://www.reginox.com/catalogsearch/advanced/result/": "/catalogsearch/advanced/result/",
};

// Fotorama gallery HTML template — served locally so the RequireJS text! plugin
// can load it without hitting reginox.com (our XHR interceptor redirects that request here).
const GALLERY_HTML_TEMPLATE = `<!--
/**
 * Copyright © Magento, Inc. All rights reserved.
 * See COPYING.txt for license details.
 */
-->
<div class="fotorama-item" data-gallery-role="gallery">
    <div data-gallery-role="fotorama__focusable-start" tabindex="-1"></div>
    <div class="fotorama__wrap fotorama__wrap--css3 fotorama__wrap--slide fotorama__wrap--toggle-arrows">
        <div class="fotorama__stage" data-fotorama-stage="fotorama__stage">
            <div class="fotorama__arr fotorama__arr--prev" tabindex="0" role="button" aria-label="Previous" data-gallery-role="arrow">
                <div class="fotorama__arr__arr"></div>
            </div>
            <div class="fotorama__stage__shaft" tabindex="0" data-gallery-role="stage-shaft">
            </div>
            <div class="fotorama__arr fotorama__arr--next fotorama__arr--disabled" tabindex="-1" role="button"
                 aria-label="Next" data-gallery-role="arrow">
                <div class="fotorama__arr__arr"></div>
            </div>
            <div class="fotorama__video-close"></div>
            <div class="fotorama__zoom-in" data-gallery-role="fotorama__zoom-in" aria-label="Zoom in" role="button" tabindex="0"></div>
            <div class="fotorama__zoom-out" data-gallery-role="fotorama__zoom-out" aria-label="Zoom out" role="button" tabindex="0"></div>
            <div class="fotorama__spinner"></div>
        </div>
        <div class="fotorama__nav-wrap" data-gallery-role="nav-wrap">
            <div class="fotorama__nav fotorama__nav--thumbs">
                <div class="fotorama__fullscreen-icon" data-gallery-role="fotorama__fullscreen-icon" tabindex="0" aria-label="Exit fullscreen" role="button"></div>
                <div class="fotorama__thumb__arr fotorama__thumb__arr--left" role="button" aria-label="Previous" data-gallery-role="arrow" tabindex = "-1">
                    <div class="fotorama__thumb--icon"></div>
                </div>
                <div class="fotorama__nav__shaft">
                    <div class="fotorama__thumb-border"></div>
                </div>
                <div class="fotorama__thumb__arr fotorama__thumb__arr--right" role="button" aria-label="Next" data-gallery-role="arrow" tabindex = "-1">
                    <div class="fotorama__thumb--icon"></div>
                </div>
            </div>
        </div>
    </div>
    <div data-gallery-role="fotorama__focusable-end" tabindex="-1"></div>
</div>
<div class="magnifier-preview" data-gallery-role="magnifier" id="preview"></div>`;

// Client-side filter injection script — makes Magento filters work offline
const FILTER_SCRIPT = `
<script>
(function() {
  // Block all external XHR to reginox.com — return empty to avoid {} artifacts
  var origXHR = window.XMLHttpRequest;
  var _open = origXHR.prototype.open;
  origXHR.prototype.open = function(method, url) {
    if (url && url.indexOf('reginox.com') !== -1) {
      // Redirect fotorama gallery HTML template to local copy so the text! plugin
      // can load it — all other reginox.com XHR requests return empty.
      if (url.indexOf('mage/gallery/gallery.html') !== -1) {
        arguments[1] = '/api/gallery-html';
      } else {
        arguments[1] = 'data:text/plain,';
      }
    }
    return _open.apply(this, arguments);
  };

  // Block external fetch — return empty to avoid {} artifacts
  var origFetch = window.fetch;
  window.fetch = function(url, opts) {
    if (typeof url === 'string' && url.indexOf('reginox.com') !== -1) {
      return Promise.resolve(new Response('', {status:200, headers:{'Content-Type':'application/json'}}));
    }
    return origFetch.apply(this, arguments);
  };

  // URL rewrite map
  var urlMap = ${JSON.stringify(URL_MAP)};

  function localizeHref(href) {
    if (!href || href === '#' || href.startsWith('/') || href.startsWith('data:')) return href;
    var pageM = href.match(/[?&]p=(\\d+)/);
    var pSuffix = (pageM && parseInt(pageM[1]) > 1) ? '?p=' + pageM[1] : '';
    var clean = href.split('?')[0].replace(/\\/$/, '');
    if (urlMap[clean] || urlMap[clean + '/']) return (urlMap[clean] || urlMap[clean + '/']) + pSuffix;
    var m;
    if ((m = clean.match(/https?:\\/\\/www\\.reginox\\.com\\/product-range\\/sinks\\/(.+)/)))
      return '/product-range/sinks/' + m[1] + pSuffix;
    if ((m = clean.match(/https?:\\/\\/www\\.reginox\\.com\\/product-range\\/taps\\/(.+)/)))
      return '/product-range/taps/' + m[1] + pSuffix;
    if ((m = clean.match(/https?:\\/\\/www\\.reginox\\.com\\/product-range\\/(.+)/)))
      return '/product-range/' + m[1] + pSuffix;
    if ((m = clean.match(/https?:\\/\\/www\\.reginox\\.com(\\/assortiment\\/.+)/)))
      return m[1] + pSuffix;
    if (href.match(/https?:\\/\\/www\\.reginox\\.(com|nl|de|co\\.uk)/)) return null;
    return href;
  }

  document.addEventListener('DOMContentLoaded', function() {
    // Rewrite all anchor hrefs
    document.querySelectorAll('a[href]').forEach(function(a) {
      // Region switcher links (DE/NL/UK) are intentionally external — leave them.
      if (a.hasAttribute('data-rg-ext')) return;
      var href = a.getAttribute('href');
      var local = localizeHref(href);
      if (local === null) {
        a.href = '#';
        a.onclick = function(e) { e.preventDefault(); };
      } else if (local !== href) {
        a.href = local;
      }
    });

    // Fix filter form actions
    document.querySelectorAll('form[action*="reginox.com"]').forEach(function(f) {
      f.setAttribute('action', f.getAttribute('action').replace(/https?:\\/\\/www\\.reginox\\.com/, ''));
    });

    // Disable store switcher — but NOT the region switcher links we want to keep.
    document.querySelectorAll('[data-store-code], .store-menu a').forEach(function(el) {
      if (el.hasAttribute('data-rg-ext')) return;
      el.onclick = function(e) { e.preventDefault(); };
    });

    // Intercept pagination clicks immediately (before filter engine fetch completes)
    // so clicking Next never navigates away — fires rg-goto-page custom event instead
    document.querySelector('.pages') && document.addEventListener('click', function(e) {
      var a = e.target.closest('.pages a, a.rg-page-btn');
      if (!a) return;
      e.preventDefault(); e.stopPropagation();
      var m = (a.getAttribute('href') || '').match(/[?&]p=(\\d+)/);
      var pg = a.getAttribute('data-page')
        ? parseInt(a.getAttribute('data-page'))
        : (m ? parseInt(m[1]) : null);
      if (pg) document.dispatchEvent(new CustomEvent('rg-goto-page', {detail: pg}));
    }, true);

    // Block Amasty's own link navigation on every listing page — all of them
    // now filter and sort in place off the database, so a filter click must
    // never navigate away.
    var ENGINE_PATHS = ['/product-range/sinks', '/product-range/taps',
      '/assortiment/werkbladen/rvs', '/assortiment/werkbladen/tap-en-lekbladen',
      '/assortiment/accessoires', '/assortiment/toebehoren'];
    var p_ = window.location.pathname;
    var engineActive = ENGINE_PATHS.some(function(k){
      return p_ === k || p_.indexOf(k + '/') === 0 || p_.indexOf(k + '?') === 0;
    });
    // Combined /product-range also runs the engine (exact match, not sub-paths)
    if (p_ === '/product-range' || p_.indexOf('/product-range?') === 0) engineActive = true;
    if (engineActive) {
      document.querySelectorAll('a[data-am-js="filter-item-default"], a.am-swatch-link, a.amshopby-filter-parent').forEach(function(a) {
        a.addEventListener('click', function(e) { e.preventDefault(); }, true);
      });
      document.querySelectorAll('form[data-amshopby-filter]').forEach(function(form) {
        form.addEventListener('submit', function(e) { e.preventDefault(); });
      });
    }

    // (Accessoires/Toebehoren used to navigate to mirrored SEO filter pages and
    // let the origin do their sorting. They run the local engine now, so that
    // navigation path is gone — see ENGINE_PATHS above.)
  });
})();
</script>
`;

// ── Client-side DB-driven filter ──────────────────────────────────────────
const CLIENT_FILTER_SCRIPT = `
<style>
/* Dynamic product cards — match original Magento image structure */
/* Placeholder for products without an image; sizing comes from per-product
   aspect-ratio <style> blocks identical to the original markup */
.product-image-container span.product-image-wrapper.rg-no-img{display:block;background:#eee;height:100%;width:100%}
/* Disable filter options with 0 count */
.rg-filter-disabled{opacity:.3;pointer-events:none}
/* Now Shopping By / active filter block */
#rg-filter-current{display:none}
#rg-filter-current.active{display:block}
/* Dual-range slider — matches original Amasty -default .am-slider exactly */
.rg-dual-slider{position:relative;height:1px;margin:0}
.rg-track{position:absolute;top:0;left:0;right:0;height:1px;background:#868686;pointer-events:none}
.rg-dual-slider input[type=range]{position:absolute;width:100%;pointer-events:none;-webkit-appearance:none;appearance:none;background:transparent;height:1px;top:0;margin:0;padding:0;outline:none;overflow:visible}
.rg-dual-slider input[type=range]::-webkit-slider-thumb{pointer-events:all;-webkit-appearance:none;width:21px;height:21px;border-radius:50%;background:#3b3b3b;cursor:pointer;border:none;margin-top:-10px}
.rg-dual-slider input[type=range]::-webkit-slider-runnable-track{height:1px;background:transparent}
.rg-dual-slider input[type=range]::-moz-range-thumb{pointer-events:all;width:21px;height:21px;border-radius:50%;background:#3b3b3b;cursor:pointer;border:none;transform:translateY(-10px)}
/* Hide Amasty slider display (original uses hideDisplay:1) */
.amshopby-slider-container .amshopby-slider-display{display:none}
/* Hide Go button — slider controls filter directly */
.amshopby-fromto-wrap .am-filter-go{display:none}
/* Make am-filter-price inputs pill-shaped to match original */
.amshopby-fromto-wrap .am-fromto-widget .am-filter-price{border-radius:22px}
/* Auto 1 SmCp font now mirrored in assets/fonts — labels render small-caps
   natively like the original (uppercase workaround removed) */
/* Pagination only in bottom toolbar; top toolbar never shows pages */
.toolbar.toolbar-products.-top .pages{display:none!important}
/* Override Magento's display:flex!important rules when we want pages hidden */
.toolbar.toolbar-products .pages.rg-pages-hidden{display:none!important}
/* Hide cookie consent popup — clone doesn't need real cookie tracking */
.ec-gtm-cookie-directive,template[data-consent]{display:none!important}
</style>
<script>
(function() {
  document.addEventListener('DOMContentLoaded', function() {
    // Proxied "live" pages (search / sort variants) already carry the exact
    // original grid+order — the client engine must NOT re-render them.
    if (window.__rgNoEngine) return;
    if (!document.querySelector('[data-amshopby-filter]')) return;
    initFilterEngine();
  });

  function initFilterEngine() {
    var path = window.location.pathname;
    // Every listing page runs the engine off the database. Accessoires and
    // Toebehoren used to navigate to mirrored SEO pages instead, which meant
    // their sort/filter answers came from the origin rather than our own data
    // — so a product removed from the database would still show up there.
    // Their catalog fields (position, colors, subcategory, assortiment,
    // afvoergat) are now populated, so they run locally like the rest.
    var CAT_MAP = {
      '/product-range/sinks':                      'Sinks',
      '/product-range/taps':                       'Taps',
      '/assortiment/werkbladen/rvs':               'Worktops',
      '/assortiment/werkbladen/tap-en-lekbladen':  'Bar Tops',
      '/assortiment/accessoires':                  'Accessories',
      '/assortiment/toebehoren':                   'Attachments',
    };
    var baseCat = null;
    Object.keys(CAT_MAP).forEach(function(k) {
      if (path === k || path.startsWith(k + '/') || path.startsWith(k + '?')) baseCat = CAT_MAP[k];
    });
    // Combined catalog /product-range → engine over ALL products (439). Exact
    // match only, so it doesn't shadow /product-range/sinks etc.
    if (!baseCat && (path === '/product-range' || path.indexOf('/product-range?') === 0)) baseCat = 'ALL';
    if (!baseCat) return;

    // On Accessoires/Toebehoren the Category filter lists product types
    // (Colanders, Strainers, …) rather than the Sinks material tree, so
    // category_ids maps to a different field there. The option labels are
    // English while the stored slugs are the original Dutch ones, so they
    // are translated here (pairs taken from each option's own cat-<slug> URL).
    var SUBCAT_SLUG = {
      'colanders': 'restenbakjes', 'bottomgrids': 'bodemroosters',
      'cleaning': 'reinigingsartikelen', 'soap dispensers': 'zeeppompjes',
      'portable drainer cover': 'afdekplaat', 'drainer': 'afdruipmat',
      'drainer sets': 'afvoersets', 'pop-up sets': 'pop_up_sets',
      'overflow': 'overloopplaatjes', 'syphons': 'sifons',
      'clips': 'klemmen', 'strainers': 'zeefjes', 'standpipe': 'standpijpen',
    };
    var isSubcatPage = (baseCat === 'Accessories' || baseCat === 'Attachments');

    // Maps data-amshopby-filter attr → { key, type, field }
    // field: the actual property name in the API product object
    var ATTR_MAP = {
      'category_ids': isSubcatPage
        ? { key: 'subcat',   type: 'subcat',      field: 'subcategory'          }
        : { key: 'material', type: 'sink_tree',   field: 'material_categories'  },
      'x1':           { key: 'mounting',    type: 'token_match', field: 'mounting_type'       },
      'x143':         { key: 'assortiment', type: 'attach_mat', field: 'assortiment'         },
      'x142':         { key: 'afvoergat', type: 'exact',       field: 'afvoergat'            },
      'x4':           { key: 'color',     type: 'exact',       field: 'colors'               },
      'x5':           { key: 'shape',     type: 'exact',       field: 'shape'                },
      'x7':           { key: 'overflow',  type: 'exact',       field: 'overflow'             },
      'x14':          { key: 'lenDim',    type: 'range_w',     field: 'dimensions'           },
      'x15':          { key: 'wdDim',     type: 'range_d',     field: 'dimensions'           },
      'x16':          { key: 'depDim',    type: 'range_h',     field: 'dimensions'           },
      'x26':          { key: 'cabinet',   type: 'equals_num',  field: 'cabinet_width'        },
      'x54':          { key: 'pullout',   type: 'exact',       field: 'pullout'              },
      'x146':         { key: 'sale',      type: 'exact',       field: 'sale'                 },
    };

    // Normalize material display label → DB slug
    var MAT_SLUG = {
      'stainless steel': 'stainless_steel', 'edelstaal': 'stainless_steel',
      'pvd': 'pvd', 'granite': 'granite', 'graniet': 'granite',
      'elegance': 'elegance', 'elite': 'elite',
    };

    var activeFilters = {
      material: [], mounting: [], color: [], shape: [],
      overflow: [], cabinet: [], pullout: [], assortiment: [], sale: [],
      subcat: [], afvoergat: [],
      lenDim: null, wdDim: null, depDim: null,
    };

    var allProducts = [], filteredProducts = [], currentPage = 1, PAGE_SIZE = 36, currentSort = 'name', currentDir = 'asc';

    // ── Helpers ──────────────────────────────────────────────────────────
    function esc(s){ return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

    function getMaterialCats(p) {
      var raw = p.material_categories;
      if (!raw) return p.material_category ? [p.material_category.toLowerCase()] : [];
      if (Array.isArray(raw)) return raw.map(function(c){return (c||'').toLowerCase();});
      try { return JSON.parse(raw).map(function(c){return (c||'').toLowerCase();}); }
      catch(e) { return [String(raw).toLowerCase()]; }
    }

    // labelToVal: returns the canonical storage key for a display label
    // For non-material filters, the display label IS the value (stored as-is)
    // For material, returns the display label too — normalization happens in matchOne
    function labelToVal(cfg, label) {
      return label.trim();
    }

    // Normalize a stored value for comparison against the DB field
    function normalizeVal(cfg, val) {
      if (cfg.key === 'material' || cfg.key === 'assortiment') {
        var nl = val.toLowerCase();
        return MAT_SLUG[nl] || nl.replace(/\\s+/g,'_');
      }
      if (cfg.key === 'subcat') {
        var sl = val.toLowerCase().replace(/\\s+/g,' ').trim();
        return SUBCAT_SLUG[sl] || sl.replace(/\\s+/g,'_');
      }
      return val.toLowerCase();
    }

    // Split a DB multi-value string (comma or slash separated) into tokens
    function splitTokens(s) {
      return (s||'').split(/[,\\/]/).map(function(t){ return t.trim().toLowerCase(); }).filter(Boolean);
    }

    function parseDims(p) {
      var parts = (p.dimensions||'').split(/[xX×]/);
      return { w: parseFloat(parts[0])||0, d: parseFloat(parts[1])||0, h: parseFloat(parts[2])||0 };
    }

    // ── Match a single product against one option value for a given cfg ──
    function matchOne(cfg, p, val) {
      var norm = normalizeVal(cfg, val);
      switch (cfg.type) {
        case 'json_array':
          return getMaterialCats(p).indexOf(norm) !== -1;
        case 'sink_tree':
          // category_ids on the combined page = the Sink category tree.
          // "Sinks" → any sink; a material label → sinks of that material.
          var lv = val.trim().toLowerCase();
          if (lv === 'sinks') return (p.category||'').toLowerCase() === 'sinks';
          return (p.category||'').toLowerCase() === 'sinks' && getMaterialCats(p).indexOf(norm) !== -1;
        case 'attach_mat':
          // x143 "Assortiment" = Attachments by material. Reads the strict
          // 'assortiment' field, not material_categories — see normalizeProduct.
          var asr = Array.isArray(p[cfg.field])
            ? p[cfg.field].map(function(c){ return (c||'').toLowerCase(); })
            : [];
          return (p.category||'').toLowerCase() === 'attachments' && asr.indexOf(norm) !== -1;
        case 'subcat':
          // category_ids on Accessoires/Toebehoren = product type (subcategory)
          return (p[cfg.field]||'').toLowerCase() === norm;
        case 'token_match':
          var dbToks = splitTokens(p[cfg.field] || '');
          var filterToks = splitTokens(val);
          return filterToks.some(function(ft){ return dbToks.indexOf(ft.toLowerCase()) !== -1; });
        case 'exact':
          return (p[cfg.field]||'').toLowerCase() === norm;
        case 'equals_num':
          return parseInt(p[cfg.field]) === parseInt(val);
        default:
          return false;
      }
    }

    // ── Match a product against all active filters ────────────────────────
    function matchesFilters(p) {
      var arrKeys = ['material','mounting','color','shape','overflow','cabinet','pullout','assortiment','sale','subcat','afvoergat'];
      for (var i = 0; i < arrKeys.length; i++) {
        var key = arrKeys[i];
        var arr = activeFilters[key];
        if (!arr || arr.length === 0) continue;
        var cfg = cfgForKey(key);
        if (!cfg) continue;
        if (!arr.some(function(v){ return matchOne(cfg, p, v); })) return false;
      }
      // Dimension ranges
      if (activeFilters.lenDim || activeFilters.wdDim || activeFilters.depDim) {
        var d = parseDims(p);
        if (activeFilters.lenDim && (d.w < activeFilters.lenDim.from || d.w > activeFilters.lenDim.to)) return false;
        if (activeFilters.wdDim  && (d.d < activeFilters.wdDim.from  || d.d > activeFilters.wdDim.to))  return false;
        if (activeFilters.depDim && (d.h < activeFilters.depDim.from  || d.h > activeFilters.depDim.to)) return false;
      }
      return true;
    }

    function cfgForKey(key) {
      var found = null;
      Object.keys(ATTR_MAP).forEach(function(k){ if (ATTR_MAP[k].key === key) found = ATTR_MAP[k]; });
      return found;
    }

    var STORAGE_KEY = 'rg_filters_' + window.location.pathname;

    function saveFilters() {
      try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify({
          filters: activeFilters,
          sort: currentSort,
          dir: currentDir,
          pageSize: PAGE_SIZE,
          page: currentPage
        }));
      } catch(e) {}
    }

    // ── Apply filters + re-render ────────────────────────────────────────
    function applyFilters() {
      filteredProducts = allProducts.filter(matchesFilters);
      currentPage = 1;
      renderGrid();
      updateActiveFilterBar();
      updateSidebarCounts();
      saveFilters();
    }

    // ── Dynamic sidebar: show counts & dim options with 0 results ────────
    function updateSidebarCounts() {
      document.querySelectorAll('form[data-amshopby-filter]').forEach(function(form) {
        var attrKey = form.getAttribute('data-amshopby-filter');
        var cfg = ATTR_MAP[attrKey];
        if (!cfg || cfg.type.indexOf('range') !== -1) return;

        // Products that pass all OTHER filters (excluding this group)
        var key = cfg.key;
        var savedArr = activeFilters[key].slice();
        activeFilters[key] = [];
        var base = allProducts.filter(matchesFilters);
        activeFilters[key] = savedArr;

        var items = cfg.key === 'color'
          ? form.querySelectorAll('div.am-swatch-wrapper')
          : form.querySelectorAll('li[data-label]');

        var visibleCount = 0;
        items.forEach(function(el) {
          var label = getItemLabel(el);
          if (!label) return;
          var count = base.filter(function(p){ return matchOne(cfg, p, label); }).length;

          // Update count badge if present
          var badge = el.querySelector('.count, .amshopby-filter-count');
          if (badge) badge.textContent = count;

          // activeFilters stores raw labels — compare directly
          var isActive = activeFilters[key].indexOf(label) !== -1;
          // Hide "Stainless Steel" color swatch when SS material is active (same concept, redundant)
          var isSsColorRedundant = cfg.key === 'color' &&
            label.toLowerCase() === 'stainless steel' &&
            activeFilters.material.some(function(m){ return m.toLowerCase() === 'stainless steel'; });
          if ((count === 0 && !isActive) || isSsColorRedundant) {
            el.classList.add('rg-filter-disabled');
            el.style.setProperty('display', 'none', 'important');
          } else {
            el.classList.remove('rg-filter-disabled');
            // Use !important to override Amasty's own JS, which hides options it
            // thinks have 0 results (it can't fetch AJAX counts here). Swatches are
            // inline-block; option <li> are list-item.
            var vis = el.matches('div.am-swatch-wrapper') ? 'inline-block' : 'list-item';
            el.style.setProperty('display', vis, 'important');
            visibleCount++;
          }
        });

        // Hide / show the entire filter section (dt title + dd content)
        var dd = form.closest('dd.filter-options-content');
        var dt = dd && dd.previousElementSibling;
        if (dd) dd.style.display = visibleCount === 0 ? 'none' : '';
        if (dt && dt.matches('dt.filter-options-title')) dt.style.display = visibleCount === 0 ? 'none' : '';

        // Amasty's "Show (N) more" button collapses options it thinks overflow.
        // Our engine already shows every option with results, so the button is
        // vestigial — hide it (matches the original's fully-loaded state where
        // Amasty removes it once all options fit).
        var sm = dd && dd.querySelector('.am-show-more, [data-am-js*="show-more"]');
        if (sm) sm.style.setProperty('display', 'none', 'important');
      });
    }

    // ── Product card (replicates original Magento markup exactly:
    //    per-product <style> with aspect-ratio, same as server-rendered items) ──
    function productCard(p) {
      var imgSrc = p.image || '';
      var href = p.href || '/product-range/' + p.slug;
      var uid = p.id || Math.floor(Math.random() * 100000);
      var imgInner = imgSrc
        ? '<span class="product-image-wrapper"><img class="product-image-photo" src="' + esc(imgSrc) + '" loading="eager" width="400" height="400" alt="' + esc(p.name) + '"></span>'
        : '<span class="product-image-wrapper rg-no-img"></span>';
      var sizeStyle =
        '<style>.product-image-container-' + uid + '{width:400px;height:auto;aspect-ratio:400 / 400}' +
        '.product-image-container-' + uid + ' span.product-image-wrapper{height:100%;width:100%}' +
        '@supports not (aspect-ratio: auto){.product-image-container-' + uid + ' span.product-image-wrapper{padding-bottom:100%}}</style>';
      return '<li class="item product product-item">' +
        '<div class="product-item-info" id="product-item-info_' + uid + '" data-container="product-grid">' +
          '<a class="product photo product-item-photo" href="' + href + '" tabindex="-1">' +
            '<span class="product-image-container product-image-container-' + uid + '">' + imgInner + '</span>' +
            sizeStyle +
          '</a>' +
          '<div class="product details product-item-details">' +
            '<strong class="product name product-item-name">' +
              '<a class="product-item-link" href="' + href + '">' + esc(p.name) + '</a>' +
            '</strong>' +
            '<div class="hide_price_text hide_price_text_' + uid + '">Please contact us for price.</div>' +
          '</div>' +
        '</div>' +
      '</li>';
    }

    // ── Sort filtered products ───────────────────────────────────────────
    function getSorted() {
      var arr = filteredProducts.slice();
      if (currentSort === 'name')
        arr.sort(function(a,b){ return (a.name||'').localeCompare(b.name||''); });
      else if (currentSort === 'color')
        arr.sort(function(a,b){ return (a.color_order||99999) - (b.color_order||99999) || (a.name||'').localeCompare(b.name||''); });
      else if (currentSort === 'hideprice_action')
        arr.sort(function(a,b){ return (a.hideprice_order||99999) - (b.hideprice_order||99999) || (a.name||'').localeCompare(b.name||''); });
      else
        arr.sort(function(a,b){ return (a.position||99999) - (b.position||99999); });
      if (currentDir === 'desc') arr.reverse();
      return arr;
    }

    // ── Render grid ──────────────────────────────────────────────────────
    function renderGrid() {
      var grid = document.querySelector('ol.products.list.items.product-items, ol.product-items');
      if (!grid) return;
      var sorted = getSorted();
      var start = (currentPage - 1) * PAGE_SIZE;
      var pageItems = sorted.slice(start, start + PAGE_SIZE);
      grid.innerHTML = pageItems.length
        ? pageItems.map(productCard).join('')
        : '<li style="padding:20px;color:#888;list-style:none">Geen producten gevonden.</li>';
      updateToolbar();
      updatePagination();
    }

    function updateToolbar() {
      // Magento toolbar format: single page → "N Items"; paginated → "Items s-e of N"
      var total = filteredProducts.length;
      var s = (currentPage-1)*PAGE_SIZE+1, e = Math.min(currentPage*PAGE_SIZE, total);
      var text;
      if (total === 0) text = 'No items';
      else if (total <= PAGE_SIZE) text = total + (total === 1 ? ' Item' : ' Items');
      else text = 'Items '+s+'-'+e+' of '+total;
      document.querySelectorAll('.toolbar-amount').forEach(function(el){ el.textContent = text; });
    }

    function updatePagination() {
      var total = filteredProducts.length;
      var tp = Math.ceil(total / PAGE_SIZE);
      // Always hide top toolbar pages
      var topTb = document.querySelector('.toolbar.toolbar-products.-top');
      if (topTb) { var topPages = topTb.querySelector('.pages'); if (topPages) topPages.classList.add('rg-pages-hidden'); }
      // Only update bottom toolbar
      var bottomTb = document.querySelector('.toolbar.toolbar-products.-bottom');
      if (!bottomTb) return;
      var pagesEl = bottomTb.querySelector('.pages');
      if (!pagesEl) return;
      if (tp <= 1) {
        pagesEl.classList.add('rg-pages-hidden');
        return;
      }
      pagesEl.classList.remove('rg-pages-hidden');
      var items = pagesEl.querySelector('.pages-items');
      if (!items) return;
      var html = '';
      var oc = 'onclick="event.preventDefault();window._rgPage&&window._rgPage(this)"';
      // Sliding window: 5 pages centered on currentPage
      var winSize = 5;
      var half = Math.floor(winSize / 2);
      var startPage = Math.max(1, currentPage - half);
      var endPage = Math.min(tp, startPage + winSize - 1);
      // Adjust start if we're near the end
      if (endPage - startPage < winSize - 1) startPage = Math.max(1, endPage - winSize + 1);
      if (currentPage > 1)
        html += '<li class="item pages-item-previous"><a href="#" class="action  previous" title="Previous" data-page="' + (currentPage - 1) + '" ' + oc + '><span class="label">Page</span><span>Previous</span></a></li>';
      for (var i = startPage; i <= endPage; i++) {
        html += i === currentPage
          ? '<li class="item current"><strong class="page"><span class="label">You\\'re currently reading page</span><span>' + i + '</span></strong></li>'
          : '<li class="item"><a href="#" class="page" data-page="' + i + '" ' + oc + '><span class="label">Page</span><span>' + i + '</span></a></li>';
      }
      if (currentPage < tp)
        html += '<li class="item pages-item-next"><a href="#" class="action  next" title="Next" data-page="' + (currentPage + 1) + '" ' + oc + '><span class="label">Page</span><span>Next</span></a></li>';
      items.innerHTML = html;
      window._rgPage = function(el) {
        var pg = parseInt(el.getAttribute('data-page'));
        if (!pg) return;
        currentPage = pg;
        renderGrid();
        saveFilters();
        window.scrollTo(0, 0);
      };
    }

    // ── Active filter chips (Magento "Now Shopping by" style) ────────────
    var KEY_LABELS = {
      material:'Category', mounting:'Mounting method', color:'Color',
      shape:'Shape', overflow:'Overflow', cabinet:'Cabinet size (mm)',
      pullout:'Pull-out system', assortiment:'Assortiment', sale:'Sale',
      subcat:'Category', afvoergat:'Afvoergat',
      lenDim:'Length', wdDim:'Width', depDim:'Depth (mm)'
    };
    function updateActiveFilterBar() {
      // Re-use or create the amshopby-filter-current block + separate filter-actions div
      var bar = document.getElementById('rg-filter-current');
      var actionsDiv = document.getElementById('rg-filter-actions');
      if (!bar) {
        bar = document.createElement('div');
        bar.id = 'rg-filter-current';
        bar.className = 'amshopby-filter-current filter-current';
        actionsDiv = document.createElement('div');
        actionsDiv.id = 'rg-filter-actions';
        actionsDiv.className = 'block-actions filter-actions';
        var filterBlock = document.querySelector('.sidebar-main .block.filter, .block.filter');
        if (filterBlock) {
          var filterContent = filterBlock.querySelector('.filter-content');
          var anchor = filterContent || filterBlock;
          var first = anchor.firstChild;
          anchor.insertBefore(actionsDiv, first);
          anchor.insertBefore(bar, actionsDiv);
        }
      }
      var chips = [];
      ['material','mounting','color','shape','overflow','cabinet','pullout','assortiment','sale','subcat','afvoergat'].forEach(function(k){
        (activeFilters[k]||[]).forEach(function(v){ chips.push({key:k,val:v}); });
      });
      ['lenDim','wdDim','depDim'].forEach(function(k){
        if (activeFilters[k]) chips.push({key:k, val:'mm'+activeFilters[k].from+' - mm'+activeFilters[k].to});
      });
      if (!chips.length) {
        bar.classList.remove('active'); bar.innerHTML='';
        if (actionsDiv) actionsDiv.style.display = 'none';
        return;
      }
      bar.classList.add('active');
      bar.innerHTML =
        '<span class="block-subtitle filter-current-subtitle" role="heading" aria-level="2">Now Shopping by</span>' +
        '<ol class="amshopby-items items">' +
        chips.map(function(f){
          return '<li class="item amshopby-item" data-fkey="'+esc(f.key)+'" data-fval="'+esc(f.val)+'">' +
            '<a href="#" class="amshopby-remove" aria-label="Remove '+esc(KEY_LABELS[f.key]||f.key)+' '+esc(f.val)+'"></a>' +
            '<span class="amshopby-filter-name">'+esc(KEY_LABELS[f.key]||f.key)+'</span>' +
            '<div class="amshopby-filter-value">'+esc(f.val)+'</div>' +
            '</li>';
        }).join('') +
        '<li class="amshopby-button-wrap"></li>' +
        '</ol>';
      if (actionsDiv) {
        actionsDiv.style.display = '';
        actionsDiv.innerHTML = '<a href="#" class="action clear filter-clear" id="rg-clear-all"><span>Clear All</span></a>';
      }
      bar.querySelectorAll('li[data-fkey] .amshopby-remove').forEach(function(a){
        a.addEventListener('click', function(e){
          e.preventDefault();
          var li = a.closest('li[data-fkey]');
          var k=li.getAttribute('data-fkey'), v=li.getAttribute('data-fval');
          if (Array.isArray(activeFilters[k])) activeFilters[k]=activeFilters[k].filter(function(x){return x!==v;});
          else activeFilters[k]=null;
          syncSidebarState(); applyFilters();
        });
      });
      var ca=document.getElementById('rg-clear-all');
      if (ca) ca.addEventListener('click',function(e){
        e.preventDefault();
        ['material','mounting','color','shape','overflow','cabinet','pullout','assortiment','sale','subcat','afvoergat'].forEach(function(k){activeFilters[k]=[];});
        ['lenDim','wdDim','depDim'].forEach(function(k){activeFilters[k]=null;});
        // Reset all sliders to min/max
        document.querySelectorAll('.rg-dual-slider').forEach(function(sl){
          var smn = sl.querySelector('.rg-smin');
          var smx = sl.querySelector('.rg-smax');
          if (smn) smn.value = smn.min;
          if (smx) smx.value = smx.max;
          // Reset fromto inputs
          var wrap = sl.closest('.amshopby-slider-wrapper');
          if (wrap) {
            var fi = wrap.querySelector('input[data-amshopby-fromto="from"]');
            var ti = wrap.querySelector('input[data-amshopby-fromto="to"]');
            if (fi && smn) fi.value = smn.min;
            if (ti && smx) ti.value = smx.max;
          }
        });
        try { sessionStorage.removeItem(STORAGE_KEY); } catch(e) {}
        syncSidebarState(); applyFilters();
      });
    }

    // ── Get label text from a filter element ─────────────────────────────
    function getItemLabel(el) {
      var dl = el.getAttribute('data-label'); if (dl) return dl.trim();
      var inp = el.querySelector('input[aria-label]'); if (inp) return inp.getAttribute('aria-label').trim();
      var a = el.querySelector('a[aria-label]'); if (a) return a.getAttribute('aria-label').trim();
      var sp = el.querySelector('.label'); if (sp) return sp.textContent.trim();
      return '';
    }

    // ── Sync checked/selected state in sidebar ───────────────────────────
    function syncSidebarState() {
      document.querySelectorAll('form[data-amshopby-filter]').forEach(function(form){
        var cfg = ATTR_MAP[form.getAttribute('data-amshopby-filter')];
        if (!cfg || cfg.type.indexOf('range') !== -1) return;
        var els = cfg.key === 'color'
          ? form.querySelectorAll('div.am-swatch-wrapper')
          : form.querySelectorAll('li[data-label]');
        els.forEach(function(el){
          var label = getItemLabel(el); if (!label) return;
          // activeFilters stores raw display labels — compare directly
          var active = (activeFilters[cfg.key]||[]).indexOf(label) !== -1;
          el.classList.toggle('-is-selected', active);
          var inp = el.querySelector('input'); if (inp) inp.checked = active;
        });
      });
    }

    // ── Wire filter sidebar clicks ────────────────────────────────────────
    function wireFilterSidebar() {
      document.querySelectorAll('form[data-amshopby-filter]').forEach(function(form){
        var attrKey = form.getAttribute('data-amshopby-filter');
        var cfg = ATTR_MAP[attrKey];
        if (!cfg) return;

        if (cfg.type === 'range_w' || cfg.type === 'range_d' || cfg.type === 'range_h') {
          // Each dimension has TWO forms: slider form + fromto form
          var wrapper = form.closest('.amshopby-slider-wrapper');
          var key = cfg.key;

          // ── SLIDER FORM: inject dual-range slider ────────────────────────
          if (form.querySelector('.amshopby-slider-container')) {
            var container = form.querySelector('.amshopby-slider-container');
            var dMin = parseInt(container.getAttribute('data-min')) || 0;
            var dMax = parseInt(container.getAttribute('data-max')) || 9999;

            // Replace am-slider div with a CSS dual-range slider
            var amSlider = container.querySelector('.am-slider');
            if (amSlider) {
              var track = document.createElement('div');
              track.className = 'rg-dual-slider';
              track.innerHTML =
                '<div class="rg-track"></div>' +
                '<input type="range" class="rg-smin" min="'+dMin+'" max="'+dMax+'" value="'+dMin+'" step="1">' +
                '<input type="range" class="rg-smax" min="'+dMin+'" max="'+dMax+'" value="'+dMax+'" step="1">';
              amSlider.replaceWith(track);

              var sMin = track.querySelector('.rg-smin');
              var sMax = track.querySelector('.rg-smax');

              // Init fromto inputs with actual values
              if (wrapper) {
                var _fi = wrapper.querySelector('input[data-amshopby-fromto="from"]');
                var _ti = wrapper.querySelector('input[data-amshopby-fromto="to"]');
                if (_fi) _fi.value = dMin;
                if (_ti) _ti.value = dMax;
              }

              function onSlider() {
                var from = parseInt(sMin.value), to = parseInt(sMax.value);
                if (from > to) {
                  if (this === sMin) { sMin.value = to; from = to; }
                  else { sMax.value = from; to = from; }
                }
                // Sync fromto inputs
                if (wrapper) {
                  var fi = wrapper.querySelector('input[data-amshopby-fromto="from"]');
                  var ti = wrapper.querySelector('input[data-amshopby-fromto="to"]');
                  if (fi) fi.value = from;
                  if (ti) ti.value = to;
                }
                activeFilters[key] = (from > dMin || to < dMax) ? {from:from,to:to} : null;
                applyFilters();
              }
              sMin.addEventListener('input', onSlider);
              sMax.addEventListener('input', onSlider);
            }
            return;
          }

          // ── FROMTO FORM: wire text inputs + sync back to slider ───────────
          var fInp = form.querySelector('input[data-amshopby-fromto="from"]');
          var tInp = form.querySelector('input[data-amshopby-fromto="to"]');
          var applyBtn = form.querySelector('button[data-amshopby-fromto="go"]');
          if (!fInp || !tInp) return;

          function applyRange(e){
            if (e) e.preventDefault();
            var hasFrom = fInp.value !== '', hasTo = tInp.value !== '';
            var from = hasFrom ? parseFloat(fInp.value) : 0;
            var to   = hasTo   ? parseFloat(tInp.value) : 99999;
            activeFilters[key] = (hasFrom || hasTo) ? {from:from,to:to} : null;
            // Sync slider thumbs
            if (wrapper) {
              var sMin2 = wrapper.querySelector('.rg-smin');
              var sMax2 = wrapper.querySelector('.rg-smax');
              if (sMin2 && hasFrom) sMin2.value = from;
              if (sMax2 && hasTo)   sMax2.value = to;
            }
            applyFilters();
          }
          if (applyBtn) applyBtn.addEventListener('click', applyRange);
          fInp.addEventListener('keydown', function(e){ if(e.key==='Enter') applyRange(e); });
          tInp.addEventListener('keydown', function(e){ if(e.key==='Enter') applyRange(e); });
          return;
        }

        var els = cfg.key === 'color'
          ? form.querySelectorAll('div.am-swatch-wrapper')
          : form.querySelectorAll('li[data-label]');

        els.forEach(function(el){
          var label = getItemLabel(el); if (!label) return;
          var val = labelToVal(cfg, label);
          function toggle(e){
            // For li[data-label] items: skip if click targets a nested child li (has its own toggle)
            if (el.matches('li[data-label]') && e.target.closest('li[data-label]') !== el) return;
            e.preventDefault(); e.stopImmediatePropagation();
            var arr = activeFilters[cfg.key];
            var idx = arr.indexOf(val);
            if (idx === -1) arr.push(val); else arr.splice(idx, 1);
            syncSidebarState(); applyFilters();
          }
          el.addEventListener('click', toggle, true);
          var a = el.querySelector('a');
          if (a) a.addEventListener('click', function(e){ e.preventDefault(); e.stopImmediatePropagation(); }, true);
        });
      });
    }

    // ── Global page-navigation listener (from FILTER_SCRIPT interceptor) ───
    document.addEventListener('rg-goto-page', function(e) {
      currentPage = e.detail;
      renderGrid();
      window.scrollTo(0, 0);
    });

    // ── Wire "Show X per page" + Sort By controls ───────────────────────
    // Sync the asc/desc direction arrow's class + title to match currentDir
    // (Magento toggles .sort-asc / .sort-desc on [data-role="direction-switcher"]).
    function syncDirArrow() {
      document.querySelectorAll('.sorter-action, [data-role="direction-switcher"]').forEach(function(a){
        a.classList.remove('sort-asc', 'sort-desc');
        a.classList.add(currentDir === 'desc' ? 'sort-desc' : 'sort-asc');
        a.setAttribute('data-value', currentDir === 'desc' ? 'asc' : 'desc');
        a.setAttribute('title', currentDir === 'desc' ? 'Set Ascending Direction' : 'Set Descending Direction');
      });
    }

    function wireToolbarControls() {
      // Set initial displayed values
      document.querySelectorAll('select[data-role="limiter"], select.limiter-options').forEach(function(s){ s.value = String(PAGE_SIZE); });
      document.querySelectorAll('select[data-role="sorter"], select.sorter-options').forEach(function(s){ s.value = currentSort; });
      syncDirArrow();

      // Expose global handlers called by inline onchange (bypasses Magento JS event blocking)
      window._rgLimiter = function(sel) {
        var v = parseInt(sel.value);
        if (!v) return;
        PAGE_SIZE = v;
        document.querySelectorAll('select[data-role="limiter"], select.limiter-options').forEach(function(s){ s.value = String(v); });
        currentPage = 1;
        renderGrid();
        saveFilters();
      };
      // Every page — including the combined /product-range — sorts in place off
      // the database. It used to navigate to ?product_list_order and let the
      // origin supply the order, because color_order/hideprice_order were only
      // populated for some categories; they now cover all 439 products.
      var sortByNav = false;
      function navParam(k, v){ var u = new URL(window.location.href); u.searchParams.set(k, v); window.location.href = u.toString(); }

      window._rgSorter = function(sel) {
        if (sortByNav) { navParam('product_list_order', sel.value); return; }
        currentSort = sel.value;
        document.querySelectorAll('select[data-role="sorter"], select.sorter-options').forEach(function(s){ s.value = currentSort; });
        currentPage = 1;
        renderGrid();
        saveFilters();
      };

      // Direction arrow (asc/desc). Capture-phase so it beats Magento's own handler.
      document.querySelectorAll('.sorter-action, [data-role="direction-switcher"]').forEach(function(arrow){
        arrow.addEventListener('click', function(e){
          e.preventDefault(); e.stopImmediatePropagation();
          if (sortByNav) { var cur = new URL(window.location.href).searchParams.get('product_list_dir') || 'asc'; navParam('product_list_dir', cur === 'asc' ? 'desc' : 'asc'); return; }
          currentDir = (currentDir === 'desc') ? 'asc' : 'desc';
          syncDirArrow();
          currentPage = 1;
          renderGrid();
          saveFilters();
        }, true);
      });
    }

    // ── Fetch products → boot ────────────────────────────────────────────
    // baseCat 'ALL' (the combined /product-range) → no category filter (439 products)
    var apiUrl = baseCat === 'ALL'
      ? '/api/products?limit=1000'
      : '/api/products?category=' + encodeURIComponent(baseCat) + '&limit=1000';
    fetch(apiUrl)
      .then(function(r){ return r.json(); })
      .then(function(data){
        allProducts = data.products || [];
        // NOTE: filter state is intentionally NOT restored from sessionStorage.
        // The original Reginox site is stateless (each filter is a distinct URL),
        // so a fresh page load must always show ALL products unfiltered. Restoring
        // stale state caused wrong results (e.g. leftover filter → "No items").
        try { sessionStorage.removeItem(STORAGE_KEY); } catch(e) {}
        filteredProducts = allProducts.filter(matchesFilters);
        renderGrid();
        wireFilterSidebar();
        // After wireFilterSidebar inits sliders, restore dim slider positions
        ['lenDim','wdDim','depDim'].forEach(function(dimKey){
          var f = activeFilters[dimKey];
          if (!f) return;
          Object.keys(ATTR_MAP).forEach(function(attrKey){
            if (ATTR_MAP[attrKey].key !== dimKey) return;
            var form = document.querySelector('form[data-amshopby-filter="'+attrKey+'"]');
            if (!form) return;
            var wrapper = form.closest('.amshopby-slider-wrapper');
            if (!wrapper) return;
            var sMin = wrapper.querySelector('.rg-smin');
            var sMax = wrapper.querySelector('.rg-smax');
            var fi = wrapper.querySelector('input[data-amshopby-fromto="from"]');
            var ti = wrapper.querySelector('input[data-amshopby-fromto="to"]');
            if (sMin) sMin.value = f.from;
            if (sMax) sMax.value = f.to;
            if (fi) fi.value = f.from;
            if (ti) ti.value = f.to;
          });
        });
        syncSidebarState();
        updateActiveFilterBar();
        updateSidebarCounts();
        wireToolbarControls();
        // Amasty's own filter JS loads asynchronously (RequireJS) and hides
        // options it thinks have 0 results. Re-assert our correct visibility
        // after it has run, and keep a MutationObserver as a backstop. The
        // observer is disconnected while WE update so we don't self-trigger.
        var narrow = document.querySelector('#narrow-by-list, .filter-options');
        var mo = null, reassert;
        function reassertCounts(){
          if (mo) mo.disconnect();
          updateSidebarCounts();
          if (mo && narrow) mo.observe(narrow, { attributes: true, attributeFilter: ['style'], subtree: true });
        }
        [400, 1200, 2500].forEach(function(t){ setTimeout(reassertCounts, t); });
        if (narrow) {
          mo = new MutationObserver(function(){
            clearTimeout(reassert);
            reassert = setTimeout(reassertCounts, 150);
          });
          mo.observe(narrow, { attributes: true, attributeFilter: ['style'], subtree: true });
        }
      })
      .catch(function(err){ console.warn('Filter engine error:', err); });
  }
})();
</script>
`;

// ── Product gallery script ─────────────────────────────────────────────────
// Injected on product detail pages. Does two things:
// Gallery + tabs + breadcrumbs fix script for product detail pages.
// Root cause of gallery failure: requirejs-config.js declares
//   deps: ['mageTranslationDictionary']
// which RequireJS tries to load automatically. On live Magento it's defined
// server-side; on our clone it's missing → mage/translate deadlocks →
// mage/gallery/gallery and mage/bootstrap never load → no gallery, no tabs.
// Fix: define the stub synchronously before RequireJS processes deps.
const GALLERY_SCRIPT = `
<style>
/* Tabs fallback: if Magento tabs widget doesn't run, use adjacent-sibling trick */
.product.data.items > .item.content { display: none; }
.product.data.items > .item.title.active + .item.content { display: block; }
/* Original uses native fullscreen (no fotorama--fullscreen class) so no X button appears.
   Our fallback uses fotorama custom fullscreen → hide the icon to match original.
   Must override styles-l.css which has specificity (0,3,0) with display:block !important. */
.fotorama.fotorama--fullscreen .fotorama__fullscreen-icon,
.fotorama--fullscreen .fotorama__fullscreen-icon { display: none !important; }
</style>
<script>
(function(){
  // ── Define mageTranslationDictionary stub ─────────────────────────────────
  // Must run synchronously (outside DOMContentLoaded) so RequireJS finds the
  // module already defined when it processes the deps[] from requirejs-config.js.
  if (typeof define === 'function' && define.amd) {
    define('mageTranslationDictionary', [], function() { return {}; });
  }

  document.addEventListener('DOMContentLoaded', function(){

    // ── Tabs fallback ─────────────────────────────────────────────────────────
    var tabsWrap = document.querySelector('.product.data.items');
    if (tabsWrap) {
      tabsWrap.querySelectorAll('[data-role="collapsible"]').forEach(function(title) {
        title.addEventListener('click', function() {
          tabsWrap.querySelectorAll('[data-role="collapsible"]').forEach(function(t) {
            t.classList.remove('active');
          });
          this.classList.add('active');
        });
      });
    }

    // ── Breadcrumbs ──────────────────────────────────────────────────────────
    var bc = document.querySelector('.breadcrumbs');
    if (bc) {
      var productName = '';
      document.querySelectorAll('script[type="text/x-magento-init"]').forEach(function(s){
        try {
          var cfg = JSON.parse(s.textContent);
          if (cfg['.breadcrumbs'] && cfg['.breadcrumbs'].breadcrumbs)
            productName = cfg['.breadcrumbs'].breadcrumbs.product || '';
        } catch(e){}
      });
      if (productName) {
        var ul = document.createElement('ul');
        ul.className = 'items';
        ul.innerHTML =
          '<li class="item home"><a href="/" title="Go to Home Page">Home</a></li>' +
          '<li class="item product"><strong>' + productName.toUpperCase() + '</strong></li>';
        bc.innerHTML = '';
        bc.appendChild(ul);
      } else if (bc.textContent.trim() === '{}') {
        bc.textContent = '';
      }
    }

    // ── Gallery fallback ─────────────────────────────────────────────────────
    // With mageTranslationDictionary now defined, mage/gallery/gallery should
    // initialize the gallery via mage/bootstrap → mage/apply/main. We give it
    // 800ms then fall back to our direct fotorama call if it hasn't run.
    var ph = document.querySelector('[data-gallery-role="gallery-placeholder"]');
    if (!ph) return;

    var galleryData = null, galleryOptions = null, galleryFullscreen = null;
    document.querySelectorAll('script[type="text/x-magento-init"]').forEach(function(s){
      try {
        var cfg = JSON.parse(s.textContent);
        var key = '[data-gallery-role=gallery-placeholder]';
        if (cfg[key] && cfg[key]['mage/gallery/gallery']) {
          var g = cfg[key]['mage/gallery/gallery'];
          galleryData       = g.data;
          galleryOptions    = g.options;
          galleryFullscreen = g.fullscreen || null;
        }
      } catch(e){}
    });
    if (!galleryData || !galleryOptions) return;

    // stray {} text node cleaner + duplicate-gallery guard.
    // On some products the native mage/gallery/gallery module ends up firing
    // twice (a quirk of the real Magento JS pipeline we proxy in, outside our
    // control), appending a SECOND .fotorama-item into the same placeholder.
    // That second instance never gets fotorama's own sizing JS applied to it
    // correctly, which is what produced the inconsistent thumbnail box sizes.
    // Defensively keep only the first .fotorama-item, whenever one appears.
    function dedupeGallery(){
      var items = ph.querySelectorAll('.fotorama-item');
      for (var i = 1; i < items.length; i++) items[i].remove();
    }
    new MutationObserver(function(muts){
      muts.forEach(function(m){
        m.addedNodes.forEach(function(n){
          if (n.nodeType === 3 && n.textContent.trim() === '{}') n.remove();
        });
      });
      dedupeGallery();
    }).observe(ph, {childList:true, subtree:true});
    // Backstop pass once everything (native + fallback) has had time to settle.
    setTimeout(dedupeGallery, 2500);

    var GALLERY_TMPL =
      '<div class="fotorama-item" data-gallery-role="gallery">' +
        '<div data-gallery-role="fotorama__focusable-start" tabindex="-1"></div>' +
        '<div class="fotorama__wrap fotorama__wrap--css3 fotorama__wrap--slide fotorama__wrap--toggle-arrows">' +
          '<div class="fotorama__stage" data-fotorama-stage="fotorama__stage">' +
            '<div class="fotorama__arr fotorama__arr--prev" tabindex="0" role="button" aria-label="Previous" data-gallery-role="arrow"><div class="fotorama__arr__arr"></div></div>' +
            '<div class="fotorama__stage__shaft" tabindex="0" data-gallery-role="stage-shaft"></div>' +
            '<div class="fotorama__arr fotorama__arr--next fotorama__arr--disabled" tabindex="-1" role="button" aria-label="Next" data-gallery-role="arrow"><div class="fotorama__arr__arr"></div></div>' +
            '<div class="fotorama__video-close"></div>' +
            '<div class="fotorama__zoom-in" data-gallery-role="fotorama__zoom-in" aria-label="Zoom in" role="button" tabindex="0"></div>' +
            '<div class="fotorama__zoom-out" data-gallery-role="fotorama__zoom-out" aria-label="Zoom out" role="button" tabindex="0"></div>' +
            '<div class="fotorama__spinner"></div>' +
          '</div>' +
          '<div class="fotorama__nav-wrap" data-gallery-role="nav-wrap">' +
            '<div class="fotorama__nav fotorama__nav--thumbs">' +
              '<div class="fotorama__fullscreen-icon" data-gallery-role="fotorama__fullscreen-icon" tabindex="0" aria-label="Exit fullscreen" role="button"></div>' +
              '<div class="fotorama__thumb__arr fotorama__thumb__arr--left" role="button" aria-label="Previous" data-gallery-role="arrow" tabindex="-1"><div class="fotorama__thumb--icon"></div></div>' +
              '<div class="fotorama__nav__shaft"><div class="fotorama__thumb-border"></div></div>' +
              '<div class="fotorama__thumb__arr fotorama__thumb__arr--right" role="button" aria-label="Next" data-gallery-role="arrow" tabindex="-1"><div class="fotorama__thumb--icon"></div></div>' +
            '</div>' +
          '</div>' +
        '</div>' +
        '<div data-gallery-role="fotorama__focusable-end" tabindex="-1"></div>' +
      '</div>' +
      '<div class="magnifier-preview" data-gallery-role="magnifier" id="preview"></div>';

    var fallbackDone = false;

    function doFallbackInit($) {
      if (fallbackDone) return;
      // mage/gallery/gallery appends .fotorama-item when it runs successfully
      if (ph.querySelector('.fotorama-item')) { fallbackDone = true; return; }

      fallbackDone = true;

      ph.className = ph.className.replace('_block-content-loading', '').trim();

      // APPEND like mage/gallery/gallery does — keeps original .fotorama__plus in DOM
      // so the page's own inline fotorama:ready handler can move it to .fotorama__stage
      // and the inline click handler can open fullscreen correctly.
      ph.insertAdjacentHTML('beforeend', GALLERY_TMPL);

      var opts = $.extend({}, galleryOptions, {
        data: galleryData.map(function(item){
          return {
            img: item.img || item.full,
            full: item.full || item.img,
            thumb: item.thumb,
            caption: item.caption,
            isMain: item.isMain,
            type: item.type || 'image',
            videoUrl: item.videoUrl || null
          };
        })
      });

      var $fotoramaEl = $(ph.querySelector('[data-gallery-role="gallery"]'));
      $fotoramaEl.fotorama(opts);

      // Apply fullscreen-specific options on enter/exit, matching mage/gallery/gallery behaviour
      if (galleryFullscreen) {
        $fotoramaEl.on('fotorama:fullscreenenter', function() {
          var api = $fotoramaEl.data('fotorama');
          if (api && api.setOptions) api.setOptions(galleryFullscreen);
        });
        $fotoramaEl.on('fotorama:fullscreenexit', function() {
          var api = $fotoramaEl.data('fotorama');
          if (api && api.setOptions) api.setOptions(galleryOptions);
        });
      }

      // Arrow height fix only — plusBtn is handled by the page's inline fotorama:ready script
      $(ph).one('fotorama:ready', function() {
        var $stage = $(ph).find('.fotorama__stage');
        $('.fotorama__arr').css('height', $stage.css('height'));
        $(window).on('resize.fotorama', function() {
          $('.fotorama__arr').css('height', $stage.css('height'));
        });
      });
    }

    function tryFallback() {
      if (fallbackDone) return;
      if (typeof require === 'undefined') { setTimeout(tryFallback, 100); return; }
      require(['jquery', 'fotorama/fotorama'], function($) {
        if (!$.fn.fotorama) { setTimeout(tryFallback, 100); return; }
        doFallbackInit($);
      });
    }

    // Give mage/gallery/gallery (now unblocked) 800ms to initialize first
    // Give mage/gallery/gallery 1500ms to initialize first; if it doesn't, we take over
    setTimeout(tryFallback, 1500);

  });
})();
</script>
`;

// ── Search results script ──────────────────────────────────────────────────
// Injected only on the catalogsearch results page. Reads ?q= from the URL,
// fetches /api/search, and renders the product grid + title + toolbar, exactly
// like the original Magento search results page.
const SEARCH_SCRIPT = `
<script>
(function(){
  document.addEventListener('DOMContentLoaded', function(){
    var params = new URLSearchParams(window.location.search);
    var q = (params.get('q') || '').trim();

    // The same page backs both searches. Advanced Search arrives on
    // /catalogsearch/advanced/result/ carrying name / sku / short_description
    // instead of q, and titles itself differently.
    var ADV_FIELDS = ['name', 'sku', 'short_description'];
    var advQuery = new URLSearchParams();
    ADV_FIELDS.forEach(function(k){
      var v = (params.get(k) || '').trim();
      if (v) advQuery.set(k, v);
    });
    var isAdvanced = window.location.pathname.indexOf('/catalogsearch/advanced') === 0;

    function esc(s){ return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

    var heading = isAdvanced ? 'Catalog Advanced Search' : "Search results for: '" + q + "'";
    document.querySelectorAll('.base[data-ui-id="page-title-wrapper"], .page-title-wrapper .base').forEach(function(el){
      el.textContent = heading;
    });
    document.title = isAdvanced ? 'Advanced Search Results' : heading;

    // Prefill the search box
    var si = document.getElementById('search');
    if (si && !isAdvanced) si.value = q;

    var grid = document.querySelector('ol.products.list.items.product-items, ol.product-items');

    function card(p){
      var href = p.href || ('/product-range/' + p.slug);
      var uid = p.id || Math.floor(Math.random()*100000);
      var imgInner = p.image
        ? '<span class="product-image-wrapper"><img class="product-image-photo" src="' + esc(p.image) + '" loading="eager" width="400" height="400" alt="' + esc(p.name) + '"></span>'
        : '<span class="product-image-wrapper rg-no-img"></span>';
      var sizeStyle = '<style>.product-image-container-' + uid + '{width:400px;height:auto;aspect-ratio:400 / 400}.product-image-container-' + uid + ' span.product-image-wrapper{height:100%;width:100%}@supports not (aspect-ratio: auto){.product-image-container-' + uid + ' span.product-image-wrapper{padding-bottom:100%}}</style>';
      return '<li class="item product product-item">' +
        '<div class="product-item-info" id="product-item-info_' + uid + '" data-container="product-grid">' +
          '<a class="product photo product-item-photo" href="' + href + '" tabindex="-1">' +
            '<span class="product-image-container product-image-container-' + uid + '">' + imgInner + '</span>' + sizeStyle +
          '</a>' +
          '<div class="product details product-item-details">' +
            '<strong class="product name product-item-name"><a class="product-item-link" href="' + href + '">' + esc(p.name) + '</a></strong>' +
            '<div class="hide_price_text hide_price_text_' + uid + '">Please contact us for price.</div>' +
          '</div>' +
        '</div></li>';
    }

    // Magento's wording: a single page of results reads "N Items", and only a
    // paginated set reads "Items 1-N of M". Results are rendered in one page
    // here, so anything up to the page size takes the first form — the origin
    // shows "13 Items" for a 13-hit search, not "Items 1-13 of 13".
    function setToolbar(n){
      var PAGE_SIZE = 36;
      var text = n === 0 ? 'No items'
        : (n <= PAGE_SIZE ? n + (n === 1 ? ' Item' : ' Items')
                          : 'Items 1-' + n + ' of ' + n);
      document.querySelectorAll('.toolbar-amount').forEach(function(el){
        el.textContent = text;
      });
    }

    var hasCriteria = isAdvanced ? (advQuery.toString().length > 0) : !!q;
    if (!hasCriteria) { if (grid) grid.innerHTML=''; setToolbar(0); return; }

    // Default search sort = relevance (matches the original). The sorter dropdown
    // on the search page re-fetches with &sort=.
    var currentSort = 'relevance';

    function load(){
      var url = isAdvanced
        ? '/api/advanced-search?' + advQuery.toString()
        : '/api/search?q=' + encodeURIComponent(q) +
          (currentSort && currentSort !== 'relevance' ? '&sort=' + currentSort : '');
      fetch(url)
        .then(function(r){ return r.json(); })
        .then(function(list){
          list = Array.isArray(list) ? list : [];
          if (grid) grid.innerHTML = list.length ? list.map(card).join('') : '';
          setToolbar(list.length);
          var old = document.querySelector('.rg-no-results');
          if (old) old.remove();
          if (!list.length) {
            var wrap = document.querySelector('.column.main');
            if (wrap) {
              var d = document.createElement('div');
              d.className = 'message notice rg-no-results';
              d.innerHTML = '<div>Your search returned no results.</div>';
              var tb = wrap.querySelector('.toolbar.toolbar-products');
              wrap.insertBefore(d, tb || wrap.firstChild);
            }
          }
        })
        .catch(function(e){ console.warn('search error', e); });
    }

    // Wire the sorter dropdown (options: relevance/name/color/hideprice_action)
    document.querySelectorAll('select[data-role="sorter"], select.sorter-options, #sorter').forEach(function(s){
      s.value = currentSort;
      s.addEventListener('change', function(){ currentSort = s.value; load(); });
      // beat any Magento onchange that would reload the page
      s.setAttribute('onchange', '');
    });

    load();
  });
})();
</script>
`;

// ── Live search-results page: wire sorter + direction to reload ──────────────
// The proxied page IS the real Magento search page. Its sorter/direction must
// reload with product_list_order / product_list_dir so the proxy re-fetches the
// correctly-sorted original results. (processHtml stripped the native toolbar JS.)
const SEARCH_LIVE_SCRIPT = `
<script>
(function(){
  document.addEventListener('DOMContentLoaded', function(){
    function setParam(k,v){ var u=new URL(window.location.href); u.searchParams.set(k,v); window.location.href=u.toString(); }
    document.querySelectorAll('select[data-role="sorter"], select.sorter-options, #sorter').forEach(function(s){
      s.setAttribute('onchange','');
      s.addEventListener('change', function(){ setParam('product_list_order', s.value); });
    });
    document.querySelectorAll('.sorter-action, [data-role="direction-switcher"]').forEach(function(a){
      a.addEventListener('click', function(e){
        e.preventDefault(); e.stopImmediatePropagation();
        var cur=new URL(window.location.href).searchParams.get('product_list_dir')||'asc';
        setParam('product_list_dir', cur==='asc'?'desc':'asc');
      }, true);
    });
  });
})();
</script>
`;

// ── Live listing page: wire ALL interactions to navigate (→ proxy) ───────────
// Injected on the fully-proxied listing pages (product-range, accessoires,
// toebehoren, werkbladen). Every filter click / sort / direction / slider /
// pagination navigates to the original's URL, which the server proxies — so the
// result is byte-identical to reginox.com. Amasty's own AJAX has no backend
// here, so we force real navigation in the capture phase before it runs.
const LISTING_LIVE_SCRIPT = `
<script>
(function(){
  document.addEventListener('DOMContentLoaded', function(){
    function go(url){ window.location.href = url; }
    function setParam(k,v){ var u=new URL(window.location.href); u.searchParams.set(k,v); u.searchParams.delete('p'); go(u.toString()); }

    function navHref(h){
      if (!h || h === '#' || h.indexOf('javascript') === 0) return;
      go(h.charAt(0)==='/' || /^https?:/.test(h) ? h : (location.pathname + h));
    }

    // ONE delegated capture-phase click handler for everything (beats Amasty).
    document.addEventListener('click', function(e){
      // A) jQuery-UI selectmenu item (the VISIBLE sorter/limiter dropdown — the
      //    native <select> is display:none, so we must handle the menu items).
      var mItem = e.target.closest('li.ui-menu-item, .ui-selectmenu-menu li');
      if (mItem) {
        var menu = mItem.closest('ul[id$="-menu"], ul.ui-menu');
        var selId = menu ? menu.id.replace(/-menu$/, '') : '';
        var sel = selId && document.getElementById(selId);
        if (sel) {
          var txt = mItem.textContent.trim().toLowerCase();
          var opt = null;
          for (var i=0;i<sel.options.length;i++){ if (sel.options[i].textContent.trim().toLowerCase()===txt){ opt=sel.options[i]; break; } }
          if (opt) {
            e.preventDefault(); e.stopImmediatePropagation();
            if (selId === 'sorter')  return setParam('product_list_order', opt.value);
            if (selId === 'limiter') return setParam('product_list_limit', opt.value);
          }
        }
      }

      // B) Filter option (anywhere in the <li>/swatch, not just the <a>),
      //    pagination, and "Now Shopping by" chips.
      var optEl = e.target.closest(
        '.filter-options-content li, form[data-amshopby-filter] li, div.am-swatch-wrapper, ' +
        '.filter-options-content a[href], .pages a[href], ' +
        '.amshopby-filter-current li, .filter-current li, .am-shopby-remove, .action.clear[href]');
      if (optEl) {
        var link = optEl.matches('a[href]') ? optEl : optEl.querySelector('a[href]');
        if (link) { e.preventDefault(); e.stopImmediatePropagation(); navHref(link.getAttribute('href')); }
      }
    }, true);

    // Also keep the native <select> change wired (in case the theme JS DOES run).
    document.querySelectorAll('#sorter, select[data-role="sorter"]').forEach(function(s){
      s.setAttribute('onchange',''); s.addEventListener('change', function(){ setParam('product_list_order', s.value); });
    });
    document.querySelectorAll('#limiter, select[data-role="limiter"]').forEach(function(s){
      s.setAttribute('onchange',''); s.addEventListener('change', function(){ setParam('product_list_limit', s.value); });
    });
    // Direction arrow → product_list_dir
    document.querySelectorAll('.sorter-action, [data-role="direction-switcher"]').forEach(function(a){
      a.addEventListener('click', function(e){
        e.preventDefault(); e.stopImmediatePropagation();
        var cur = new URL(window.location.href).searchParams.get('product_list_dir') || 'asc';
        setParam('product_list_dir', cur === 'asc' ? 'desc' : 'asc');
      }, true);
    });

    // 5. Sliders (Length/Width/Depth). Amasty renders a jQuery-UI slider via JS
    //    that doesn't run here, so build our own dual-range slider on the
    //    .amshopby-slider-container and navigate to ?<attr>=<from>-<to> on release.
    document.querySelectorAll('.amshopby-slider-container').forEach(function(container){
      var form = container.closest('form[data-amshopby-filter]');
      if (!form) return;
      var attr = form.getAttribute('data-amshopby-filter');
      var dMin = parseInt(container.getAttribute('data-min')) || 0;
      var dMax = parseInt(container.getAttribute('data-max')) || 9999;
      // current selection from URL (?attr=from-to)
      var cur = new URL(window.location.href).searchParams.get(attr);
      var cFrom = dMin, cTo = dMax;
      if (cur && /^\\d+-\\d+$/.test(cur)) { var pp = cur.split('-'); cFrom = parseInt(pp[0]); cTo = parseInt(pp[1]); }

      // No numbers rendered under the track — the original shows the current
      // range only in the FROM/TO boxes above (a sibling widget in the same
      // .amshopby-slider-wrapper), never as labels below the slider itself.
      var track = document.createElement('div');
      track.className = 'rg-dual-slider';
      track.innerHTML =
        '<div class="rg-track"></div>' +
        '<input type="range" class="rg-smin" min="'+dMin+'" max="'+dMax+'" value="'+cFrom+'" step="1">' +
        '<input type="range" class="rg-smax" min="'+dMin+'" max="'+dMax+'" value="'+cTo+'" step="1">';
      var amSlider = container.querySelector('.am-slider') || container.querySelector('[data-am-js="slider"]');
      if (amSlider) amSlider.replaceWith(track); else container.appendChild(track);

      var sMin = track.querySelector('.rg-smin'), sMax = track.querySelector('.rg-smax');
      // Sync with the FROM/TO number boxes (.amshopby-fromto-wrap) that live
      // alongside the slider in the original markup.
      var sliderWrap = container.closest('.amshopby-slider-wrapper');
      var fromBox = sliderWrap && sliderWrap.querySelector('input[data-amshopby-fromto="from"]');
      var toBox   = sliderWrap && sliderWrap.querySelector('input[data-amshopby-fromto="to"]');
      if (fromBox) fromBox.value = cFrom;
      if (toBox)   toBox.value   = cTo;
      function clamp(){
        var a = parseInt(sMin.value), b = parseInt(sMax.value);
        if (a > b) { if (this === sMin) sMin.value = b; else sMax.value = a; }
        if (fromBox) fromBox.value = sMin.value;
        if (toBox)   toBox.value   = sMax.value;
      }
      function apply(){
        var a = parseInt(sMin.value), b = parseInt(sMax.value);
        if (a <= dMin && b >= dMax) { var u = new URL(window.location.href); u.searchParams.delete(attr); u.searchParams.delete('p'); go(u.toString()); return; }
        setParam(attr, a + '-' + b);
      }
      sMin.addEventListener('input', clamp); sMax.addEventListener('input', clamp);
      sMin.addEventListener('change', apply); sMax.addEventListener('change', apply);
      // Typing directly into the FROM/TO boxes should also drive the slider + navigate.
      function applyFromBoxes(){
        var a = parseInt(fromBox.value), b = parseInt(toBox.value);
        if (isNaN(a) || isNaN(b)) return;
        sMin.value = a; sMax.value = b;
        apply();
      }
      [fromBox, toBox].forEach(function(inp){
        if (!inp) return;
        inp.addEventListener('keydown', function(e){ if (e.key === 'Enter') { e.preventDefault(); applyFromBoxes(); } });
        inp.addEventListener('change', applyFromBoxes);
      });
    });
  });
})();
</script>
`;

// ── Header search UI script (injected on every page) ────────────────────────
// Keeps the search submit button enabled and adds a live autocomplete dropdown
// backed by /api/search, matching the original quickSearch behaviour.
const SEARCH_UI_SCRIPT = `
<style>
/* Suggestion dropdown. These values are the theme's own — taken from its
   .mst-searchautocomplete__* rules — because the markup cannot carry those
   class names: Mirasvit's script blanks any element wearing them. Same blue
   top rule, same uppercase section headings, 80px thumbnails, blue bold
   match highlight, and the "view all" bar pinned to the bottom. */
/* Fixed, and attached to <body> rather than beside the input: the search
   form sits inside .block-content, which is overflow:hidden, so a panel
   positioned within it is clipped away entirely however it is anchored.
   Placed under the input by measurement instead — see place() below. */
.rg-ac{display:none;position:fixed;box-sizing:border-box;background:#fff;border-top:2px solid #1ba1fc;border-radius:3px;box-shadow:0 3px 10px rgba(0,0,0,.16);z-index:100000;text-align:left;overflow:hidden}
.rg-ac._active{display:block}
.rg-ac-close{position:absolute;right:6px;top:0;padding:10px;font-weight:bold;font-size:1.6rem;line-height:1rem;color:#999;cursor:pointer}
.rg-ac-scroll{max-height:70vh;overflow-y:auto;padding-bottom:40px}
.rg-ac-title{border-bottom:1px solid #efefef;margin:0 10px;padding:10px 0 9px;font-size:1.2rem;line-height:1.2rem;font-weight:700;color:#777;text-transform:uppercase}
.rg-ac ul{list-style:none;margin:0;padding:0}
.rg-ac-item{display:flex;align-items:center;padding:10px;cursor:pointer;border-bottom:1px solid #f6f6f6}
.rg-ac-item:last-child{border-bottom:none}
.rg-ac-item:hover,.rg-ac-item._active{background:#f8f8f8}
.rg-ac-imgwrap{flex:0 0 8rem;height:8rem;width:8rem;margin-right:1rem}
.rg-ac-imgwrap img{height:8rem;max-width:8rem;display:block;margin:auto;object-fit:contain}
.rg-ac-meta{flex-grow:1;overflow:hidden}
.rg-ac-name{display:block;color:#333;font-weight:500;word-break:break-word}
.rg-ac-page .rg-ac-name{font-size:1.4rem}
.rg-hl{font-weight:600;color:#1ba1fc}
.rg-ac-all{border-top:1px solid #efefef;position:absolute;left:0;bottom:0;width:100%;height:40px;text-align:center;background:#fff}
.rg-ac-all a{display:block;padding:10px 0;font-size:1.2rem;font-weight:600;color:#777;text-decoration:none}
</style>
<script>
(function(){
  document.addEventListener('DOMContentLoaded', function(){
    var form = document.getElementById('search_mini_form');
    var input = document.getElementById('search');
    if (!form || !input) return;
    var btn = form.querySelector('button.action.search, button[type="submit"]');
    form.setAttribute('action', '/catalogsearch/result/');

    function sync(){ if (btn) btn.disabled = input.value.trim().length < 1; }
    sync();
    input.addEventListener('input', sync);
    input.addEventListener('focus', sync);

    // The suggestions are drawn into Mirasvit's own element, using its class
    // names, exactly as on the original: the theme already ships the CSS for
    // .mst-searchautocomplete__*, so the dropdown is styled natively instead
    // of by anything hand-rolled here. (Magento's #search_autocomplete is not
    // used — the theme hides it outright for this same reason.)
    // Our own container, and deliberately WITHOUT any mst-* class: Mirasvit's
    // script re-renders every .mst-searchautocomplete__autocomplete it finds
    // from its own AJAX call, so anything wearing that class gets wiped a
    // moment after we fill it. Styled by the rules below instead, shaped to
    // match the original dropdown (thumbnail on the left, name beside it).
    function getBox(){
      var b = document.querySelector('.rg-ac');
      if (b) return b;
      b = document.createElement('div');
      b.className = 'rg-ac';
      document.body.appendChild(b);
      return b;
    }
    // Line the panel up under the input. Right-aligned to it, because the
    // search sits at the far right of the header; widened to a readable
    // minimum, and nudged back inside the viewport if that overflows.
    function place(box){
      var r = input.getBoundingClientRect();
      var w = Math.max(r.width, 320);
      if (w > window.innerWidth - 16) w = window.innerWidth - 16;
      var left = r.right - w;
      if (left < 8) left = 8;
      box.style.top = Math.round(r.bottom) + 'px';
      box.style.left = Math.round(left) + 'px';
      box.style.width = Math.round(w) + 'px';
    }
    var timer, items = [], pages = [], sel = -1, lastQ = '';
    function esc(s){ return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
    // Wrap the matched query in the highlight span the theme styles.
    function hl(name, q){
      var e = esc(name);
      if (!q) return e;
      try {
        var re = new RegExp('(' + q.replace(/[.*+?^\${}()|[\\]\\\\]/g, '\\\\$&') + ')', 'ig');
        return e.replace(re, '<span class="rg-hl">$1</span>');
      } catch(err){ return e; }
    }
    function render(){
      var box = getBox();
      if (!box) return;
      if (!items.length && !pages.length){ box.innerHTML=''; box.classList.remove('_active'); return; }
      box.classList.add('_active');
      place(box);

      var html = '<span class="rg-ac-close">&times;</span><div class="rg-ac-scroll">';

      if (items.length) {
        html += '<div class="rg-ac-title">Products (' + items.length + ')</div><ul role="listbox">' +
          items.map(function(p,i){
            // Not loading="lazy": the panel is created hidden and revealed in
            // the same frame, which leaves lazy thumbnails at naturalWidth 0.
            var thumb = p.image
              ? '<span class="rg-ac-imgwrap"><img src="' + esc(p.image) + '" alt=""></span>'
              : '<span class="rg-ac-imgwrap"></span>';
            return '<li class="rg-ac-item' + (i===sel ? ' _active' : '') +
              '" data-href="' + esc(p.href||'#') + '" role="option">' + thumb +
              '<span class="rg-ac-meta"><span class="rg-ac-name">' + hl(p.name, lastQ) +
              '</span></span></li>';
          }).join('') + '</ul>';
      }

      if (pages.length) {
        html += '<div class="rg-ac-title">Information (' + pages.length + ')</div><ul>' +
          pages.map(function(pg){
            return '<li class="rg-ac-item rg-ac-page" data-href="' + esc(pg.href||'#') + '">' +
              '<span class="rg-ac-meta"><span class="rg-ac-name">' + hl(pg.title, lastQ) +
              '</span></span></li>';
          }).join('') + '</ul>';
      }

      html += '</div><div class="rg-ac-all"><a href="/catalogsearch/result/?q=' +
        encodeURIComponent(lastQ) + '">View all ' + (items.length + pages.length) +
        ' results \\u2192</a></div>';

      box.innerHTML = html;
      box.querySelectorAll('.rg-ac-item').forEach(function(li){
        li.addEventListener('mousedown', function(e){ e.preventDefault(); window.location.href = li.getAttribute('data-href'); });
      });
      var x = box.querySelector('.rg-ac-close');
      if (x) x.addEventListener('mousedown', function(e){
        e.preventDefault(); items=[]; pages=[]; sel=-1; render();
      });
    }
    input.addEventListener('input', function(){
      clearTimeout(timer);
      var q = input.value.trim();
      if (q.length < 2){ items=[]; pages=[]; sel=-1; render(); return; }
      timer = setTimeout(function(){
        lastQ = q;
        fetch('/api/autocomplete?q=' + encodeURIComponent(q))
          .then(function(r){ return r.json(); })
          .then(function(d){
            items = (d && Array.isArray(d.products) ? d.products : []).slice(0,8);
            pages = (d && Array.isArray(d.pages) ? d.pages : []).slice(0,4);
            sel=-1; render();
          })
          .catch(function(){});
      }, 180);
    });
    input.addEventListener('keydown', function(e){
      if (!items.length) return;
      if (e.key==='ArrowDown'){ e.preventDefault(); sel=(sel+1)%items.length; render(); }
      else if (e.key==='ArrowUp'){ e.preventDefault(); sel=(sel-1+items.length)%items.length; render(); }
      else if (e.key==='Enter' && sel>=0){ e.preventDefault(); window.location.href = items[sel].href||'#'; }
      else if (e.key==='Escape'){ items=[]; render(); }
    });
    document.addEventListener('click', function(e){
      var box = document.querySelector('.rg-ac');
      if (box && box.contains(e.target)) return;
      if (!form.contains(e.target)){ items=[]; pages=[]; render(); }
    });
    // Fixed positioning is relative to the viewport, so the panel has to be
    // re-measured whenever the input can have moved under it.
    ['scroll','resize'].forEach(function(ev){
      window.addEventListener(ev, function(){
        var box = document.querySelector('.rg-ac');
        if (box && box.classList.contains('_active')) place(box);
      }, true);
    });
  });
})();
</script>
`;

// ── HTML processing ────────────────────────────────────────────────────────
function processHtml(html, pageName) {
  // Fix asset paths
  html = html.replace(/(['"])\.\.\/(assets\/)/g, '$1/$2');
  html = html.replace(/url\(\.\.\/(assets\/)/g, 'url(/$1');

  // Fix static versioned Magento assets
  html = html.replace(
    /https?:\/\/www\.reginox\.com\/static\/version[^/]+\/frontend\/[^"']*/g,
    (m) => '/assets/' + path.basename(m.split('?')[0])
  );

  // Fix Magento media URLs (product images on live site)
  html = html.replace(
    /src="(https?:\/\/www\.reginox\.com\/media\/catalog\/product[^"]+)"/g,
    (match, url) => {
      const fname = path.basename(url.split('?')[0]);
      const local = path.join(ASSETS_DIR, 'images', fname);
      if (fs.existsSync(local)) return `src="/assets/images/${fname}"`;
      return match; // keep original if not downloaded
    }
  );

  // Rewrite gallery CDN image URLs inside text/x-magento-init JSON blobs.
  // JSON uses escaped slashes (\/), so `\/` in the HTML string is a literal backslash+slash.
  // We capture the final filename and serve it from /assets/images/ when available.
  html = html.replace(
    /https:\\\/\\\/www\.reginox\.com\\\/media(?:\\\/|[^"\\])*\\\/([A-Za-z0-9_.-]+\.(?:jpg|jpeg|png|gif|webp))/gi,
    (match, fname) => {
      const local = path.join(ASSETS_DIR, 'images', fname);
      return fs.existsSync(local) ? '/assets/images/' + fname : match;
    }
  );

  // RequireJS baseUrl uses \uXXXX-escaped URL pointing at the live site.
  // Route it through our /static caching proxy so all Magento JS modules
  // are cached locally after first load.
  html = html.replace(
    /https\\u003A\\u002F\\u002Fwww\.reginox\.com\\u002Fstatic/g,
    '\\u002Fstatic'
  );

  // Fix DXF/PDF/STP/JPG download links → always point at our /assets/dxf/
  // route. That route resolves the file from local disk in dev, or redirects
  // to Backblaze B2 in production (see the B2 fallback on the /assets router) —
  // so link generation doesn't need to know which one applies.
  // MUST run BEFORE the generic /media/ rule below, which would otherwise
  // strip the domain first and leave a dead relative /media//dxf/ link that
  // never matches this pattern (that was a real bug — verified by testing).
  html = html.replace(
    /href="https?:\/\/www\.reginox\.com\/media\/\/dxf\/([^"]+)"/g,
    (match, fname) => `href="/assets/dxf/${fname}"`
  );

  // "Download Productsheet" buttons call a live PDF-generation endpoint
  // (md_productpdf) that has no local equivalent — there's no static file to
  // mirror since Magento builds the PDF on request. Stash the domain behind a
  // sentinel so the later catch-all rules (which strip every remaining
  // reginox.com occurrence, including inside onclick="window.open(...)", not
  // just href=) don't collapse it into a dead local path. Restored after
  // those strips run, further down.
  html = html.replace(
    /https?:\/\/www\.reginox\.com(\/md_productpdf\/[^'"]+)/g,
    '\x00REGINOX_LIVE\x00$1'
  );

  // Remaining media URLs (swatches, category banners, gallery JSON not
  // matched above) → /media caching proxy. Plain and JSON-escaped forms.
  html = html.replace(/https?:\/\/www\.reginox\.com\/media\//g, '/media/');
  html = html.replace(/https?:\\\/\\\/www\.reginox\.com\\\/media\\\//g, '\\/media\\/');

  // Language/region switcher (DE/NL/UK/COM) → send DE/NL/UK to the REAL regional
  // sites; COM stays on this local clone. Must run BEFORE the generic reginox.com
  // href rewrite below. data-rg-ext marks them so the client script leaves them.
  html = html.replace(
    /href="https?:\/\/www\.reginox\.com\/stores\/store\/redirect\/___store\/(b2cgen_\w+)[^"]*"/g,
    (m, store) => {
      const dest = {
        b2cgen_de: 'https://www.reginox.de/',
        b2cgen_nl: 'https://www.reginox.nl/',
        b2cgen_en: 'https://www.reginox.co.uk/',
        b2cgen_com: '/'
      }[store];
      return dest ? `href="${dest}" data-rg-ext="1"` : m;
    }
  );

  // Replace ALL reginox.com hrefs with local equivalents. Preserve the FULL
  // query string (?x4=, ?x54=, ?p=N …) so Amasty filter/swatch links keep their
  // parameters — dropping them broke color-swatch and other query-based filters.
  html = html.replace(/href="(https?:\/\/www\.reginox\.com[^"]*)"/g, (match, url) => {
    const qIdx = url.indexOf('?');
    let pSuffix = qIdx !== -1 ? url.slice(qIdx) : '';
    // drop a redundant ?p=1
    if (/^\?p=1$/.test(pSuffix)) pSuffix = '';
    const cleanUrl = url.split('?')[0].replace(/\/$/, '');
    const mapped = URL_MAP[cleanUrl] || URL_MAP[cleanUrl + '/'];
    if (mapped) return `href="${mapped}${pSuffix}"`;

    // Pattern-based replacement
    let m;
    if ((m = cleanUrl.match(/https?:\/\/www\.reginox\.com\/product-range\/sinks\/(.+)/)))
      return `href="/product-range/sinks/${m[1]}${pSuffix}"`;
    if ((m = cleanUrl.match(/https?:\/\/www\.reginox\.com\/product-range\/taps\/(.+)/)))
      return `href="/product-range/taps/${m[1]}${pSuffix}"`;
    if ((m = cleanUrl.match(/https?:\/\/www\.reginox\.com\/product-range\/(.+)/)))
      return `href="/product-range/${m[1]}${pSuffix}"`;
    if ((m = cleanUrl.match(/https?:\/\/www\.reginox\.com(\/assortiment\/.+)/)))
      return `href="${m[1]}${pSuffix}"`;
    if (cleanUrl.match(/https?:\/\/www\.reginox\.(nl|de|co\.uk)/))
      return 'href="#"';

    // Fallback: strip the domain, keep the original path — the click stays
    // local (catch-all route serves the mirrored page or a local 404).
    const localPath = url.replace(/https?:\/\/www\.reginox\.com/, '') || '/';
    return `href="${localPath}"`;
  });

  // Also rewrite reginox.com URLs in JS/JSON configs (baseUrl, customerLoginUrl,
  // datalayer endpoints, x-magento-init blobs). These use escaped slashes
  // (\/) — the path part is a sequence of \/segment groups. NOTHING may keep
  // pointing at the live site, so unmatched URLs fall back to their local path.
  html = html.replace(
    /"https:\\\/\\\/www\.reginox\.com((?:\\\/[^"\\]*)*)"/g,
    (match, escapedPath) => {
      const path_ = escapedPath.replace(/\\\//g, '/');
      const cleanUrl = 'https://www.reginox.com' + (path_.split('?')[0] || '/');
      const mapped = URL_MAP[cleanUrl] || URL_MAP[cleanUrl.replace(/\/$/, '')];
      if (mapped) return `"${mapped}"`;
      // keep original path locally, re-escape slashes for JSON validity
      return `"${(path_ || '/').replace(/\//g, '\\/')}"`;
    }
  );

  // Strip \u-escaped reginox.com domain in inline JS (var BASE_URL etc.) —
  // leaves a root-relative /... path so runtime-built URLs stay local.
  html = html.replace(/https\\u003A\\u002F\\u002Fwww\.reginox\.com/g, '');

  // Cookie domain must match localhost, not the live site
  html = html.replace(/"COOKIE_DOMAIN":"www\.reginox\.com"/g, '"COOKIE_DOMAIN":""');

  // Final catch-alls: NO reference may keep pointing at the live site.
  // Strip the domain from any remaining occurrence (escaped-JSON form first,
  // then plain form) — leaves root-relative paths that resolve locally.
  html = html.replace(/https?:\\\/\\\/www\.reginox\.com/g, '');
  html = html.replace(/https?:\/\/www\.reginox\.com/g, '');

  // Restore the md_productpdf sentinel now that the strips above are done.
  html = html.replace(/\x00REGINOX_LIVE\x00/g, 'https://www.reginox.com');

  // Strip productListToolbarForm widget init — prevents Magento from overriding our pagination
  html = html.replace(/\s+data-mage-init='[^']*productListToolbarForm[^']*'/g, '');

  // Inject onchange handlers directly into limiter/sorter selects — bypasses any Magento JS interference
  html = html.replace(
    /(<select[^>]+id="limiter"[^>]*)(>)/,
    '$1 onchange="window._rgLimiter&&window._rgLimiter(this)"$2'
  );
  html = html.replace(
    /(<select[^>]+id="sorter"[^>]*)(>)/,
    '$1 onchange="window._rgSorter&&window._rgSorter(this)"$2'
  );

  // Force product-grid images to load eagerly. Native loading="lazy" on the
  // mirrored listing pages never triggers in our served context (the original's
  // IntersectionObserver lazy-loader isn't running), leaving blank white cards.
  // Product grids show ≤36 images, so eager loading is safe and matches how the
  // original appears once scrolled.
  html = html.replace(/<img\b[^>]*\bclass="[^"]*product-image-photo[^"]*"[^>]*>/g,
    (tag) => tag.replace(/\bloading="lazy"/, 'loading="eager"'));

  // Block external form actions — EXCEPT the search form, which must submit
  // (GET) to /catalogsearch/result/ so search actually works.
  html = html.replace(/action="https?:\/\/www\.reginox\.com([^"]*)"/g,
    (_, path_) => {
      const local = path_ || '/';
      if (/catalogsearch\/result/.test(local)) return `action="${local}"`;
      return `action="${local}" data-blocked="true"`;
    });

  // Magento disables the header search submit button until its quickSearch JS
  // enables it — that JS doesn't fully run here, so the magnifier stays dead.
  // Remove the disabled attribute so the button submits (SEARCH_UI_SCRIPT wires
  // autocomplete + keeps it enabled).
  html = html.replace(/(<button[^>]*class="[^"]*action\s+search[^"]*"[^>]*?)\s+disabled(="")?/g, '$1');

  // Inject our fix script + client filter before </head>
  // Also inject gallery script on product detail pages (has gallery-placeholder)
  const hasGallery = html.includes('data-gallery-role="gallery-placeholder"');
  const galleryInject = hasGallery ? GALLERY_SCRIPT : '';
  const searchInject = pageName === 'catalogsearch_result.html' ? SEARCH_SCRIPT
                     : pageName === 'catalogsearch_live.html' ? SEARCH_LIVE_SCRIPT
                     : pageName === 'listing_live.html' ? LISTING_LIVE_SCRIPT : '';
  // Proxied live pages already have the exact grid/order — disable the client
  // engine so it doesn't re-render them.
  const noEngine = (pageName === 'listing_live.html' || pageName === 'catalogsearch_live.html')
    ? '<script>window.__rgNoEngine=true;</script>' : '';
  html = html.replace('</head>', noEngine + FILTER_SCRIPT + CLIENT_FILTER_SCRIPT + SEARCH_UI_SCRIPT + galleryInject + searchInject + '</head>');

  return html;
}

function servePage(pageName, res) {
  const pagePath = path.join(PAGES_DIR, pageName);
  if (!fs.existsSync(pagePath)) return false;
  const raw = fs.readFileSync(pagePath, "utf8");
  const html = processHtml(raw, pageName);
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache");
  res.send(html);
  return true;
}

// Smart lookup: try many filename patterns for a given slug
function smartServe(candidates, res) {
  for (const c of candidates) {
    if (c && servePage(c, res)) return true;
  }
  return false;
}

// 404 response — guarantees the request always gets an answer
function serve404(res) {
  res.status(404);
  if (servePage("404.html", res)) return;
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.send('<!doctype html><html><head><title>404 Not Found</title></head><body><h1>404 Not Found</h1><p><a href="/">Back to homepage</a></p></body></html>');
}

// Serve the first page that exists; never hang — falls back to 404
function serveFirst(res, ...names) {
  for (const n of names) {
    if (n && servePage(n, res)) return;
  }
  serve404(res);
}

// Build filename candidates from a URL path like "product-range/sinks/admiral-40"
function slugCandidates(urlPath, ...extras) {
  const parts = urlPath.replace(/^\//, '').split('/');
  const joined = parts.join('_');
  const slug = parts[parts.length - 1];
  return [
    joined + '.html',
    joined.replace(/-/g, '_') + '.html',
    ...extras,
  ];
}

// Scan all pages directory and find best match for a slug
function findPageBySlug(slug) {
  const allPages = fs.readdirSync(PAGES_DIR);
  const normalSlug = slug.replace(/-/g, '_').toLowerCase();
  // Exact suffix match first
  const exact = allPages.find(f => f.toLowerCase().endsWith('_' + normalSlug + '.html') || f.toLowerCase() === normalSlug + '.html');
  if (exact) return exact;
  // Partial match
  const partial = allPages.find(f => f.toLowerCase().includes(normalSlug));
  return partial || null;
}

// ── API routes ─────────────────────────────────────────────────────────────

// Serve gallery HTML template locally so the RequireJS text! plugin can load it
// (our XHR interceptor redirects text!mage/gallery/gallery.html here)
app.get("/api/gallery-html", (req, res) => {
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=3600");
  res.send(GALLERY_HTML_TEMPLATE);
});

// ── Page routes ────────────────────────────────────────────────────────────

app.get("/", (req, res) => servePage("home.html", res) || res.redirect("/product-range"));

// Helper: serve paginated listing page (handles ?p=N)
function serveListingWithPage(baseFile, req, res) {
  const p = parseInt(req.query.p || 1);
  const base = baseFile.replace('.html', '');
  if (p > 1) {
    if (servePage(`${base}_p${p}.html`, res)) return;
  }
  serveFirst(res, baseFile);
}

// URL structure mirrors the original site exactly:
//   /productrange (landing) and /product-range (full listing) are DIFFERENT pages
//   category listings live at the Dutch /assortiment/* URLs like the original
app.get("/productrange", (req, res) => serveFirst(res, "productrange.html"));
// ── Listing pages ──────────────────────────────────────────────────────────
// Each serves its mirrored shell (chrome, filter UI, banner); the client
// engine then fills the grid from the database and handles sort/filter in
// place. These used to live-proxy the origin for every sort/filter variant,
// which made their answers reflect the origin's catalog rather than ours.
app.get("/product-range", (req, res) => serveFirst(res, "product-range.html"));
app.get("/product-range/sinks", (req, res) => serveListingWithPage("product-range_sinks.html", req, res));
app.get("/product-range/taps", (req, res) => serveListingWithPage("product-range_taps.html", req, res));

app.get("/assortiment/accessoires", (req, res) =>
  serveListingWithPage("assortiment_accessoires.html", req, res));
app.get("/assortiment/toebehoren", (req, res) =>
  serveListingWithPage("assortiment_toebehoren.html", req, res));
app.get("/assortiment/werkbladen/rvs", (req, res) =>
  serveFirst(res, "assortiment_werkbladen_rvs.html", "assortiment_werkbladen.html"));
app.get("/assortiment/werkbladen/tap-en-lekbladen", (req, res) =>
  serveFirst(res, "assortiment_werkbladen_tap-en-lekbladen.html", "assortiment_werkbladen.html"));

// English aliases → original Dutch URLs
app.get("/product-range/accessories", (req, res) => res.redirect(301, "/assortiment/accessoires"));
app.get("/product-range/attachments", (req, res) => res.redirect(301, "/assortiment/toebehoren"));
app.get("/product-range/worktops", (req, res) => res.redirect(301, "/assortiment/werkbladen/rvs"));
app.get("/product-range/bar-tops", (req, res) => res.redirect(301, "/assortiment/werkbladen/tap-en-lekbladen"));

// About pages
app.get("/about", (req, res) => serveFirst(res, "about-reginox.html"));
app.get("/about/certificates", (req, res) => serveFirst(res, "about-reginox_certificates.html"));
app.get("/about/csr", (req, res) => serveFirst(res, "about-reginox_csr.html"));
app.get("/about/downloads", (req, res) => serveFirst(res, "about-reginox_downloads.html"));
app.get("/about/news", (req, res) => serveFirst(res, "about-reginox_news-page.html"));
app.get("/50-years", (req, res) => serveFirst(res, "50-years.html"));

// Inspiration / collections
app.get("/inspiration", (req, res) => serveFirst(res, "inspiration.html", "all-blogs.html"));
app.get("/inspiration/clean-and-care", (req, res) => serveFirst(res, "clean-and-care.html"));
app.get("/inspiration/colorado", (req, res) => serveFirst(res, "colorado.html"));
app.get("/inspiration/miami", (req, res) => serveFirst(res, "miami.html"));
app.get("/inspiration/new-york", (req, res) => serveFirst(res, "new-york.html"));
app.get("/inspiration/new-york-pvd", (req, res) => serveFirst(res, "new-york-pvd.html"));
app.get("/inspiration/ohio", (req, res) => serveFirst(res, "ohio.html"));
app.get("/inspiration/panama", (req, res) => serveFirst(res, "panama.html"));
app.get("/inspiration/new-jersey", (req, res) => serveFirst(res, "new-jersey.html"));
app.get("/inspiration/regi-granite", (req, res) => serveFirst(res, "regi-granite.html"));
app.get("/inspiration/elite-granite", (req, res) => serveFirst(res, "elite-granite-com.html", "elite-granite.html"));
app.get("/inspiration/worktops", (req, res) => serveFirst(res, "stainless-steel-worktops.html"));
app.get("/inspiration/stainless-steel-worktops", (req, res) => serveFirst(res, "stainless-steel-worktops.html"));
app.get("/inspiration/taps", (req, res) => serveFirst(res, "taps.html", "taps1.html"));
app.get("/inspiration/:slug", (req, res) => {
  serveFirst(res, `${req.params.slug}.html`, "all-blogs.html");
});

// Service & Contact
app.get("/service", (req, res) => serveFirst(res, "service.html"));
app.get("/service/:sub", (req, res) =>
  serveFirst(res, `service_${req.params.sub}.html`, `${req.params.sub}.html`, "service.html"));
app.get("/contact", (req, res) => serveFirst(res, "contact.html", "customer-contact.html"));

// ── Generic product detail handler ────────────────────────────────────────
// Handles ALL categories: sinks, taps, accessories, attachments, worktops, bar-tops
// and filter pages like /product-range/sinks/cat-stainless_steel_1

// Category → Magento URL base + local prefix mappings
const CAT_CONFIG = {
  sinks:       { urlBase: "/product-range/sinks",                    prefix: "product-range_sinks_",          listing: "product-range_sinks.html" },
  taps:        { urlBase: "/product-range/taps",                     prefix: "product-range_taps_",           listing: "product-range_taps.html" },
  accessories: { urlBase: "/assortiment/accessoires",                 prefix: "assortiment_accessoires_",      listing: "assortiment_accessoires.html" },
  attachments: { urlBase: "/assortiment/toebehoren",                  prefix: "assortiment_toebehoren_",       listing: "assortiment_toebehoren.html" },
  worktops:    { urlBase: "/assortiment/werkbladen/rvs",              prefix: "assortiment_werkbladen_rvs_",   listing: "assortiment_werkbladen_rvs.html" },
  "bar-tops":  { urlBase: "/assortiment/werkbladen/tap-en-lekbladen", prefix: "assortiment_werkbladen_tap-en-lekbladen_", listing: "assortiment_werkbladen_tap-en-lekbladen.html" },
};

async function serveProductOrFilter(cat, slug, req, res, page) {
  const cfg = CAT_CONFIG[cat];
  const prefix = cfg?.prefix || `${cat}_`;

  // 1. Is it a PRODUCT? Serve the local mirrored detail page (gallery/downloads work).
  if (cfg && !page) {
    const dbUrl = `https://www.reginox.com${cfg.urlBase}/${slug}`;
    const p = db.prepare("SELECT local_page FROM products WHERE page_url = ? OR page_url LIKE ?")
                .get(dbUrl, `%/${slug}`);
    if (p?.local_page && servePage(p.local_page, res)) return;
  }

  // 2. Otherwise it's a FILTER (or pagination) URL → serve the mirrored page
  //    for that filter. Its grid is re-rendered from the database by the
  //    client engine, so it reflects our catalog, not the origin's.
  const pSuffix = page && page > 1 ? `_p${page}` : '';
  const candidates = [
    `${prefix}${slug}${pSuffix}.html`,
    `${prefix}${slug.replace(/-/g,'_')}${pSuffix}.html`,
    `${prefix}${slug.toLowerCase()}${pSuffix}.html`,
  ];
  if (smartServe(candidates, res)) return;
  const found = !page && findPageBySlug(slug);
  if (found && servePage(found, res)) return;
  servePage(cfg?.listing || "product-range.html", res);
}

// Register routes for each category (pass page query param through)
Object.keys(CAT_CONFIG).forEach(cat => {
  app.get(`/product-range/${cat}/:slug`, (req, res) => {
    const page = parseInt(req.query.p || 1);
    serveProductOrFilter(cat, req.params.slug, req, res, page > 1 ? page : null);
  });
});

// Catch-all for /product-range/:slug — product OR filter on the combined page.
// Must come AFTER exact category routes (/product-range/sinks etc.).
app.get("/product-range/:slug", async (req, res) => {
  const slug = req.params.slug;
  // Product? serve local detail page.
  const p = db.prepare("SELECT local_page FROM products WHERE page_url LIKE ?").get(`%/${slug}`);
  if (p?.local_page && servePage(p.local_page, res)) return;
  // Otherwise a FILTER on /product-range → mirrored shell, grid from the DB.
  for (const cfg of Object.values(CAT_CONFIG)) {
    if (servePage(`${cfg.prefix}${slug}.html`, res)) return;
  }
  const found = findPageBySlug(slug);
  if (found && servePage(found, res)) return;
  res.redirect("/product-range");
});

// Also handle assortiment/* URLs directly (Magento-style)
app.get("/assortiment/accessoires/:slug", (req, res) => serveProductOrFilter("accessories", req.params.slug, req, res));
app.get("/assortiment/toebehoren/:slug",  (req, res) => serveProductOrFilter("attachments", req.params.slug, req, res));
app.get("/assortiment/werkbladen/rvs/:slug", (req, res) => serveProductOrFilter("worktops", req.params.slug, req, res));
app.get("/assortiment/werkbladen/tap-en-lekbladen/:slug", (req, res) => serveProductOrFilter("bar-tops", req.params.slug, req, res));

// About/contact — original serves these paths directly (200, no redirect)
app.get("/about-reginox", (req, res) => serveFirst(res, "about-reginox.html"));
app.get("/about-reginox/all-blogs", (req, res) => serveFirst(res, "all-blogs.html"));
app.get("/about-reginox/:sub", (req, res) =>
  serveFirst(res, `about-reginox_${req.params.sub}.html`, `${req.params.sub}.html`, "about-reginox.html"));
app.get("/over-reginox", (req, res) => serveFirst(res, "over-reginox.html", "about-reginox.html"));
app.get("/over-reginox/:sub", (req, res) =>
  serveFirst(res, `over-reginox_${req.params.sub}.html`, "about-reginox.html"));
app.get("/customer-contact", (req, res) => serveFirst(res, "customer-contact.html", "contact.html"));

// Legacy inspiration URLs — original site 301s these to /inspiration/* equivalents
app.get("/colorado", (req, res) => res.redirect(301, "/inspiration/colorado"));
app.get("/miami", (req, res) => res.redirect(301, "/inspiration/miami"));
app.get("/new-jersey", (req, res) => res.redirect(301, "/inspiration/new-jersey"));
app.get("/new-york", (req, res) => res.redirect(301, "/inspiration/new-york"));
app.get("/new-york-pvd", (req, res) => res.redirect(301, "/inspiration/new-york-pvd"));
app.get("/ohio", (req, res) => res.redirect(301, "/inspiration/ohio"));
app.get("/panama", (req, res) => res.redirect(301, "/inspiration/panama"));
app.get("/regi-granite", (req, res) => res.redirect(301, "/inspiration/regi-granite"));
app.get("/clean-and-care", (req, res) => res.redirect(301, "/inspiration/clean-and-care"));
// These serve 200 on the original site (no redirect)
app.get("/elite-granite-com", (req, res) => serveFirst(res, "elite-granite-com.html"));
// /taps1 → /inspiration/taps1 (matches original 301 target exactly)
app.get("/taps1", (req, res) => res.redirect(301, "/inspiration/taps1"));
app.get("/inspiration/taps1", (req, res) => serveFirst(res, "taps.html", "taps1.html"));
// /all-blogs → /about-reginox/all-blogs (matches original 301 target)
app.get("/all-blogs", (req, res) => res.redirect(301, "/about-reginox/all-blogs"));
app.get("/customer/account", (req, res) => res.redirect("/"));
app.get("/customer/account/login", (req, res) => res.redirect("/"));
app.get("/checkout/cart", (req, res) => res.redirect("/"));
// (proxyOriginal lived here: a live fetch of the origin page, cached to disk
// per path+query, used for search results and every listing sort/filter
// variant. Removed — those pages are rendered from the database now, so
// nothing about the running site depends on reginox.com being reachable.)

// Search results: the mirrored shell, with SEARCH_SCRIPT rebuilding the grid
// from /api/search. This used to live-proxy the origin's result page per
// query. Free-text queries are unbounded, so unlike the listing pages they
// could never be mirrored up front — and a proxied result reflects the
// origin's catalog, so a product removed here would still have shown up.
app.get(["/catalogsearch/result", "/catalogsearch/result/"], (req, res) => {
  serveFirst(res, "catalogsearch_result.html");
});
// Advanced Search results. The mirrored form (catalogsearch_advanced.html)
// submits here, but nothing served this path, so it fell through to a 404.
// Same result shell as above — SEARCH_SCRIPT notices the /advanced path and
// queries /api/advanced-search with the form's fields instead of ?q=.
app.get(["/catalogsearch/advanced/result", "/catalogsearch/advanced/result/"], (req, res) => {
  serveFirst(res, "catalogsearch_result.html");
});
app.get("/installation", (req, res) => servePage("installation.html", res) || res.redirect("/service"));
app.get("/accessoireshop", (req, res) => res.redirect("/product-range/accessories"));
app.get("/terms-conditions-com", (req, res) => res.redirect("/"));
app.get("/disclaimer-privacy-com", (req, res) => res.redirect("/"));

// Catalog product view (Magento direct URL)
app.get("/catalog/product/view/id/:id", (req, res) => {
  const allPages = fs.readdirSync(PAGES_DIR);
  const match = allPages.find(f => f.includes(`_id_${req.params.id}_`));
  if (match) return servePage(match, res);
  res.redirect("/product-range");
});

// ── REST API ───────────────────────────────────────────────────────────────

app.get("/api/products", (req, res) => {
  const { category, q, page = 1, limit = 200,
          material, mounting, width, shape, reversible } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);
  const where = ["name != ''"];
  const params = [];

  if (category) { where.push("LOWER(category) = LOWER(?)"); params.push(category); }
  if (q) {
    where.push("(LOWER(name) LIKE ? OR LOWER(model_code) LIKE ?)");
    params.push(`%${q.toLowerCase()}%`, `%${q.toLowerCase()}%`);
  }
  // Filter by material category — uses material_categories JSON (OR within group)
  if (material) {
    const mats = material.split(',').map(m => m.trim().toLowerCase()).filter(Boolean);
    where.push(`(${mats.map(() => "LOWER(material_categories) LIKE ? OR LOWER(material_category) = ?").join(" OR ")})`);
    params.push(...mats.flatMap(m => [`%"${m}"%`, m]));
  }
  // Filter by mounting type (inset, undermount, integrated, semi-integrated)
  if (mounting) {
    const ms = mounting.split(',').map(m => m.trim()).filter(Boolean);
    where.push(`(${ms.map(() => "LOWER(mounting_type) LIKE ?").join(" OR ")})`);
    params.push(...ms.map(m => `%${m}%`));
  }
  // Filter by cabinet width (mm)
  if (width) {
    const ws = width.split(',').map(w => parseInt(w.trim())).filter(Boolean);
    where.push(`cabinet_width IN (${ws.map(() => '?').join(',')})`);
    params.push(...ws);
  }
  // Filter by shape
  if (shape) { where.push("LOWER(shape) LIKE ?"); params.push(`%${shape.toLowerCase()}%`); }
  // Filter by reversible drain
  if (reversible) { where.push("LOWER(reversible) = LOWER(?)"); params.push(reversible); }

  const whereStr = "WHERE " + where.join(" AND ");
  const total = db.prepare(`SELECT COUNT(*) as count FROM products ${whereStr}`).get(...params).count;
  const products = db.prepare(`SELECT * FROM products ${whereStr} ORDER BY id ASC LIMIT ? OFFSET ?`).all(...params, parseInt(limit), offset);

  res.json({ products: products.map(normalizeProduct), total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
});

// Filter options with counts for a given category + active filters
app.get("/api/filters/:category", (req, res) => {
  const cat = req.params.category;
  const { material, mounting, width, shape, reversible } = req.query;
  const base = ["LOWER(category) = LOWER(?)", "name != ''"];
  const baseParams = [cat];

  // Build filter function that adds active filter conditions
  function withFilters(excluding) {
    const conds = [...base]; const ps = [...baseParams];
    if (material && excluding !== 'material') {
      const ms = material.split(',').map(m => m.trim()).filter(Boolean);
      conds.push(`(${ms.map(() => "LOWER(material_category) = LOWER(?)").join(" OR ")})`);
      ps.push(...ms);
    }
    if (mounting && excluding !== 'mounting') {
      const ms = mounting.split(',').map(m => m.trim()).filter(Boolean);
      conds.push(`(${ms.map(() => "LOWER(mounting_type) LIKE ?").join(" OR ")})`);
      ps.push(...ms.map(m => `%${m}%`));
    }
    if (width && excluding !== 'width') {
      const ws = width.split(',').map(w => parseInt(w)).filter(Boolean);
      conds.push(`cabinet_width IN (${ws.map(() => '?').join(',')})`);
      ps.push(...ws);
    }
    if (shape && excluding !== 'shape') { conds.push("LOWER(shape) LIKE ?"); ps.push(`%${shape.toLowerCase()}%`); }
    if (reversible && excluding !== 'reversible') { conds.push("LOWER(reversible) = LOWER(?)"); ps.push(reversible); }
    return { where: "WHERE " + conds.join(" AND "), params: ps };
  }

  function counts(field, labelField, excluding) {
    const { where, params } = withFilters(excluding);
    const sql = `SELECT ${field} as value, ${labelField} as label, COUNT(*) as count FROM products ${where} AND ${field} IS NOT NULL AND ${field} != '' GROUP BY ${field} ORDER BY count DESC`;
    return db.prepare(sql).all(...params);
  }

  res.json({
    material:   counts("material_category", "material_category", "material"),
    mounting:   db.prepare(`SELECT DISTINCT mounting_type as value FROM products WHERE LOWER(category) = LOWER(?) AND mounting_type IS NOT NULL AND mounting_type != ''`).all(cat),
    width:      counts("cabinet_width", "cabinet_width", "width"),
    shape:      counts("shape", "shape", "shape"),
    reversible: counts("reversible", "reversible", "reversible"),
  });
});

app.get("/api/products/slug/:slug", (req, res) => {
  const slug = req.params.slug;
  const p = db.prepare("SELECT * FROM products WHERE page_url LIKE ?").get(`%${slug}`) ||
            db.prepare("SELECT * FROM products WHERE LOWER(model_code) = LOWER(?)").get(slug);
  if (!p) return res.status(404).json({ error: "Not found" });
  res.json(normalizeProduct(p));
});

app.get("/api/products/:id", (req, res) => {
  const p = db.prepare("SELECT * FROM products WHERE id = ?").get(req.params.id);
  if (!p) return res.status(404).json({ error: "Not found" });
  res.json(normalizeProduct(p));
});

app.get("/api/categories", (req, res) => {
  const cats = db.prepare("SELECT category, COUNT(*) as count FROM products WHERE category IS NOT NULL AND category != '' AND name != '' GROUP BY category ORDER BY count DESC").all();
  res.json(cats);
});

app.get("/api/search", (req, res) => {
  const { q, sort } = req.query;
  if (!q) return res.json([]);
  const ql = q.toLowerCase();
  let results = db.prepare(
    "SELECT * FROM products WHERE name != '' AND (LOWER(name) LIKE ? OR LOWER(model_code) LIKE ?)"
  ).all(`%${ql}%`, `%${ql}%`);

  // Sorting. Magento's search defaults to "relevance": exact-name match first,
  // then name-starts-with, then catalog position ascending — which reproduces
  // the original result order (verified against /catalogsearch/result/?q=colorado).
  const pos = p => (p.position != null ? p.position : 999999);
  const rel = p => {
    const n = (p.name || "").toLowerCase();
    if (n === ql) return 0;
    if (n.startsWith(ql)) return 1;
    if ((p.model_code || "").toLowerCase() === ql) return 1;
    return 2;
  };
  const byName  = (a, b) => (a.name || "").localeCompare(b.name || "");
  const byColor = (a, b) => (a.color_order || 99999) - (b.color_order || 99999) || byName(a, b);
  const byHide  = (a, b) => (a.hideprice_order || 99999) - (b.hideprice_order || 99999) || byName(a, b);
  const byRel   = (a, b) => rel(a) - rel(b) || pos(a) - pos(b) || byName(a, b);

  if (sort === "name") results.sort(byName);
  else if (sort === "color") results.sort(byColor);
  else if (sort === "hideprice_action") results.sort(byHide);
  else results.sort(byRel); // default = relevance

  res.json(results.map(normalizeProduct));
});

// Magento quickSearch autocomplete endpoint (fallback for any theme JS that hits it)
app.get(["/search/ajax/suggest", "/search/ajax/suggest/"], (req, res) => {
  const q = (req.query.q || "").toLowerCase();
  if (!q) return res.json([]);
  const rows = db.prepare("SELECT DISTINCT name FROM products WHERE name != '' AND LOWER(name) LIKE ? LIMIT 8")
    .all(`%${q}%`);
  res.json(rows.map(r => ({ title: r.name, num_results: 1 })));
});

// Mirasvit autocomplete endpoint. The header dropdown is drawn by
// SEARCH_UI_SCRIPT off /api/search, so this only catches theme JS that calls
// the Mirasvit URL directly — answered from the database rather than the
// origin, which it used to proxy on every keystroke.
app.get(["/searchautocomplete/ajax/suggest", "/searchautocomplete/ajax/suggest/"], (req, res) => {
  // Deliberately an empty — but well-formed — result set. Mirasvit's script
  // reads data.indexes, so this shape keeps it from erroring, while leaving
  // the visible dropdown to SEARCH_UI_SCRIPT alone; both drawing into the
  // same container would have them overwrite each other.
  const q = (req.query.q || "").toString();
  res.json({
    query: q,
    totalItems: 0,
    indexes: [],
    noResults: true,
    textEmpty: "",
    textAll: "",
    urlAll: "/catalogsearch/result/?q=" + encodeURIComponent(q),
  });
});

// Backs the header suggestion dropdown, which lists products and — as the
// original does under an "Information" heading — matching content pages.
// Page matching is by title and stored description only, so it finds less
// than the origin's full-text index does.
app.get("/api/autocomplete", (req, res) => {
  const q = (req.query.q || "").toString().trim().toLowerCase();
  if (!q) return res.json({ products: [], pages: [], total: 0 });
  const like = `%${q}%`;

  const products = db.prepare(
    "SELECT * FROM products WHERE name != '' AND (LOWER(name) LIKE ? OR LOWER(model_code) LIKE ?) LIMIT 8"
  ).all(like, like).map(normalizeProduct);

  let pages = [];
  try {
    pages = db.prepare(
      `SELECT title, url FROM pages
        WHERE title IS NOT NULL AND TRIM(title) != ''
          AND (LOWER(title) LIKE ? OR LOWER(description) LIKE ?)
        LIMIT 4`
    ).all(like, like).map(p => ({
      title: p.title,
      href: (p.url || "").replace(/^https?:\/\/www\.reginox\.com/, "") || "/",
    }));
  } catch (e) { pages = []; }

  res.json({ products, pages, total: products.length + pages.length });
});

// Advanced Search. The mirrored form posts name / sku / short_description;
// Magento ANDs whatever is filled in and ignores the rest. sku maps to
// model_code (R25444 and friends), short_description to the description text.
app.get("/api/advanced-search", (req, res) => {
  const FIELDS = {
    name: "name",
    sku: "model_code",
    short_description: "description",
  };
  const where = ["name != ''"];
  const params = [];
  for (const [param, col] of Object.entries(FIELDS)) {
    const v = (req.query[param] || "").toString().trim();
    if (!v) continue;
    where.push(`LOWER(${col}) LIKE ?`);
    params.push(`%${v.toLowerCase()}%`);
  }
  // No criteria at all → no results, rather than the whole catalogue.
  if (params.length === 0) return res.json([]);
  const rows = db.prepare(
    `SELECT * FROM products WHERE ${where.join(" AND ")} ORDER BY name COLLATE NOCASE ASC`
  ).all(...params);
  res.json(rows.map(normalizeProduct));
});

app.get("/api/stats", (req, res) => {
  res.json({
    products: db.prepare("SELECT COUNT(*) as n FROM products WHERE name != ''").get().n,
    pages: db.prepare("SELECT COUNT(*) as n FROM pages").get().n,
    assets: db.prepare("SELECT COUNT(*) as n FROM assets").get().n,
    images: db.prepare("SELECT COUNT(*) as n FROM assets WHERE asset_type='image'").get().n,
  });
});

// ── Helpers ───────────────────────────────────────────────────────────────
function normalizeProduct(p) {
  const img = resolveImg(p);
  const slug = urlToSlug(p.page_url || "");
  const localHref = p.page_url
    ? p.page_url.replace('https://www.reginox.com', '')
    : '';
  return {
    id: p.id, name: p.name || "", model_code: p.model_code || "",
    category: p.category || "", subcategory: p.subcategory || "",
    collection: p.collection || "", description: p.description || "",
    features: p.features || "", dimensions: p.dimensions || "",
    colors: p.colors || "", material: p.material || "",
    material_category: p.material_category || "",
    material_categories: p.material_categories ? JSON.parse(p.material_categories) : [p.material_category || ""].filter(Boolean),
    // Strict view of the same column, without the material_category fallback
    // above: the x143 "Assortiment" filter is its own upstream attribute, and
    // three attachments carry material_category 'pvd' without appearing under
    // its PVD option — the fallback would over-match them.
    assortiment: p.material_categories ? JSON.parse(p.material_categories) : [],
    afvoergat: p.afvoergat || "",
    mounting_type: p.mounting_type || "",
    cabinet_width: p.cabinet_width || null,
    shape: p.shape || "",
    overflow: p.overflow || "",
    pullout: p.pullout || "",
    sale: p.sale || "",
    reversible: p.reversible || "",
    num_bowls: p.num_bowls || "",
    image: img,
    images: p.all_images
      ? p.all_images.split('|').map(u => u.startsWith('/') ? u : (u.startsWith('http') ? u : '/assets/images/' + path.basename(u))).filter(Boolean)
      : [img].filter(Boolean),
    page_url: p.page_url || "", slug, local_page: p.local_page || "",
    href: localHref || `/product-range/${slug}`,
    position: p.position || null,
    color_order: p.color_order || null,
    hideprice_order: p.hideprice_order || null,
  };
}

function resolveImg(p) {
  if (p.local_image_path) return `/assets/images/${path.basename(p.local_image_path)}`;
  if (p.image_url?.startsWith("http")) return p.image_url;
  if (p.image_url) return `/assets/images/${path.basename(p.image_url)}`;
  return null;
}

function urlToSlug(url) {
  if (!url) return "";
  return url.split("/").filter(Boolean).pop() || "";
}

// Catch-all: resolve any unmatched GET.
//  1) mirrored page by full-path slug,
//  2) a PRODUCT by its last-segment slug (root-level product URLs like
//     /admiral-60-l-kgokg that the original serves and search links use) →
//     local detail page so the gallery/downloads work,
//  3) LIVE-PROXY the original (category-filter links, CMS/"Information" results,
//     advanced search, and any other real reginox.com page),
//  4) 404.
app.get(/.*/, async (req, res) => {
  const segs = req.path.split("/").filter(Boolean);
  const pageSlug = segs.join("_");
  if (pageSlug && servePage(`${pageSlug}.html`, res)) return;

  const last = segs[segs.length - 1] || "";
  if (last && !req.path.startsWith("/media") && !req.path.startsWith("/static") && !req.path.startsWith("/assets")) {
    try {
      const p = db.prepare("SELECT local_page FROM products WHERE page_url LIKE ? OR page_url LIKE ?")
                  .get(`%/${last}`, `%/${last}/`);
      if (p?.local_page && servePage(p.local_page, res)) return;
    } catch (e) {}
  }

  serve404(res);
});

app.listen(PORT, () => {
  console.log(`\nReginox server → http://localhost:${PORT}`);
  console.log(`  Homepage:  http://localhost:${PORT}/`);
  console.log(`  Sinks:     http://localhost:${PORT}/product-range/sinks`);
  console.log(`  API:       http://localhost:${PORT}/api/stats`);
});
