// Scrapes position/color/hideprice sort orders for ALL categories from reginox.com
// and stores them in the local SQLite DB.
// Run: node scrape_all_sort_orders.js
//
// For Sinks: only fills in missing orders (already done)
// For Taps/Accessories/Attachments/Worktops/Bar Tops: fills all orders

const https = require('https');
const db = require('./backend/node_modules/better-sqlite3')('./reginox.db');

const DELAY_MS = 2500;

const CATEGORIES = [
  {
    name: 'Taps',
    dbCategory: 'Taps',
    baseUrl: 'https://www.reginox.com/product-range/taps',
    perPage: 36,
  },
  {
    name: 'Accessories',
    dbCategory: 'Accessories',
    baseUrl: 'https://www.reginox.com/assortiment/accessoires',
    perPage: 36,
  },
  {
    name: 'Attachments',
    dbCategory: 'Attachments',
    baseUrl: 'https://www.reginox.com/assortiment/toebehoren',
    perPage: 36,
  },
  {
    name: 'Worktops',
    dbCategory: 'Worktops',
    baseUrl: 'https://www.reginox.com/assortiment/werkbladen/rvs',
    perPage: 36,
  },
  {
    name: 'Bar Tops',
    dbCategory: 'Bar Tops',
    baseUrl: 'https://www.reginox.com/assortiment/werkbladen/tap-en-lekbladen',
    perPage: 36,
  },
  {
    name: 'Sinks (fill gaps only)',
    dbCategory: 'Sinks',
    baseUrl: 'https://www.reginox.com/product-range/sinks',
    perPage: 36,
    fillGapsOnly: true,
  },
];

const SORT_TYPES = [
  { key: 'position',      col: 'position',       urlParam: 'position' },
  { key: 'color',         col: 'color_order',    urlParam: 'color' },
  { key: 'hideprice_action', col: 'hideprice_order', urlParam: 'hideprice_action' },
];

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function fetchPage(url) {
  return new Promise((resolve, reject) => {
    const options = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-GB,en;q=0.9',
      }
    };
    https.get(url, options, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    }).on('error', reject);
  });
}

function extractProductNames(html) {
  const names = [];
  const re = /<a\s+class="product-item-link"[^>]*>\s*([\s\S]*?)\s*<\/a>/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    const name = m[1].replace(/\s+/g, ' ').trim();
    if (name) names.push(name);
  }
  return names;
}

function extractTotalProducts(html) {
  // "Items 1-36 of 31" or similar
  const m = html.match(/Items?\s+\d+[-–]\d+\s+of\s+(\d+)/i);
  if (m) return parseInt(m[1]);
  // fallback: count product-item-link elements
  const re = /class="product-item-link"/g;
  let count = 0;
  while (re.exec(html)) count++;
  return count;
}

async function scrapeAllNamesForSort(baseUrl, sortParam, perPage) {
  // First fetch page 1 to find total
  const url1 = `${baseUrl}?product_list_order=${sortParam}&limit=${perPage}&p=1`;
  console.log(`    Fetching ${url1}`);
  const { status, body } = await fetchPage(url1);
  if (status !== 200) {
    console.log(`    HTTP ${status} — skipping`);
    return [];
  }

  const total = extractTotalProducts(body);
  const totalPages = total > 0 ? Math.ceil(total / perPage) : 1;
  console.log(`    Total: ${total} products, ${totalPages} pages`);

  const allNames = extractProductNames(body);
  console.log(`    Page 1: ${allNames.length} names`);

  for (let page = 2; page <= totalPages; page++) {
    await sleep(DELAY_MS);
    const url = `${baseUrl}?product_list_order=${sortParam}&limit=${perPage}&p=${page}`;
    console.log(`    Fetching page ${page}: ${url}`);
    let attempts = 0;
    while (attempts < 3) {
      try {
        const { status: s, body: b } = await fetchPage(url);
        if (s === 200) {
          const names = extractProductNames(b);
          console.log(`    Page ${page}: ${names.length} names`);
          allNames.push(...names);
          break;
        } else if (s === 429) {
          console.log(`    Rate limited, waiting 15s...`);
          await sleep(15000);
          attempts++;
        } else {
          console.log(`    HTTP ${s} on page ${page}`);
          break;
        }
      } catch (e) {
        console.log(`    Error: ${e.message}`);
        attempts++;
        await sleep(5000);
      }
    }
  }

  return allNames;
}

async function processCategorySort(cat, sortType, fillGapsOnly) {
  console.log(`\n  Sort: ${sortType.key}`);
  const names = await scrapeAllNamesForSort(cat.baseUrl, sortType.urlParam, cat.perPage);
  console.log(`  Total scraped: ${names.length} names`);

  if (names.length === 0) return 0;

  const colName = sortType.col;
  const updateExact = db.prepare(`UPDATE products SET ${colName} = ? WHERE LOWER(name) = LOWER(?) AND category = ?`);
  const updateFuzzy = db.prepare(`UPDATE products SET ${colName} = ? WHERE name LIKE ? AND category = ?`);

  // If fillGapsOnly, skip products that already have this sort value
  const checkHas = fillGapsOnly
    ? db.prepare(`SELECT ${colName} FROM products WHERE LOWER(name) = LOWER(?) AND category = ?`)
    : null;

  let matched = 0;
  for (let i = 0; i < names.length; i++) {
    const name = names[i];
    const pos = i + 1;

    if (fillGapsOnly && checkHas) {
      const existing = checkHas.get(name, cat.dbCategory);
      if (existing && existing[colName] !== null) {
        continue; // already has value
      }
    }

    let r = updateExact.run(pos, name, cat.dbCategory);
    if (r.changes === 0) {
      r = updateFuzzy.run(pos, name.substring(0, 25) + '%', cat.dbCategory);
    }
    if (r.changes > 0) {
      matched++;
    } else {
      console.log(`    NOT FOUND: "${name}"`);
    }
  }

  console.log(`  Updated ${matched}/${names.length} for ${colName}`);
  return matched;
}

async function run() {
  // Ensure columns exist
  for (const col of ['position', 'color_order', 'hideprice_order']) {
    try { db.exec(`ALTER TABLE products ADD COLUMN ${col} INTEGER`); } catch(e) {}
  }

  for (const cat of CATEGORIES) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Category: ${cat.name}`);
    console.log(`${'='.repeat(60)}`);

    for (const sortType of SORT_TYPES) {
      try {
        await processCategorySort(cat, sortType, cat.fillGapsOnly || false);
        await sleep(DELAY_MS);
      } catch (e) {
        console.error(`  Error processing ${sortType.key}: ${e.message}`);
      }
    }
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  for (const cat of CATEGORIES) {
    const row = db.prepare(`
      SELECT
        COUNT(*) as total,
        COUNT(position) as has_pos,
        COUNT(color_order) as has_color,
        COUNT(hideprice_order) as has_hideprice
      FROM products WHERE category = ?
    `).get(cat.dbCategory);
    console.log(`${cat.name}: ${row.total} total | pos:${row.has_pos} color:${row.has_color} hideprice:${row.has_hideprice}`);
  }

  db.close();
  console.log('\nDone.');
}

run().catch(console.error);
