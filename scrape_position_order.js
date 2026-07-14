// Scrapes product-range/sinks in position order from reginox.com
// and stores position values in the local DB.
// Run: node scrape_position_order.js

const https = require('https');
const db = require('./backend/node_modules/better-sqlite3')('./reginox.db');

const TOTAL_PAGES = 8;
const DELAY_MS = 3000; // 3s between requests to avoid rate limiting
const BASE_URL = 'https://www.reginox.com/product-range/sinks?product_list_order=position&limit=36&p=';

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function fetchPage(url) {
  return new Promise((resolve, reject) => {
    const options = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-US,en;q=0.9',
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

async function run() {
  const allNames = [];

  for (let page = 1; page <= TOTAL_PAGES; page++) {
    const url = BASE_URL + page;
    console.log(`Fetching page ${page}/${TOTAL_PAGES}: ${url}`);
    try {
      const { status, body } = await fetchPage(url);
      if (status === 200) {
        const names = extractProductNames(body);
        console.log(`  Found ${names.length} products`);
        allNames.push(...names);
      } else if (status === 429) {
        console.log(`  Rate limited (429). Waiting 10s and retrying...`);
        await sleep(10000);
        page--; // retry
        continue;
      } else {
        console.log(`  HTTP ${status} — skipping`);
      }
    } catch(e) {
      console.log(`  Error: ${e.message}`);
    }
    if (page < TOTAL_PAGES) await sleep(DELAY_MS);
  }

  console.log(`\nTotal products found: ${allNames.length}`);

  // Update DB positions
  const updateStmt = db.prepare("UPDATE products SET position = ? WHERE LOWER(name) = LOWER(?) AND category = 'Sinks'");
  const updateFuzzy = db.prepare("UPDATE products SET position = ? WHERE name LIKE ? AND category = 'Sinks'");

  let matched = 0;
  allNames.forEach((name, idx) => {
    const pos = idx + 1;
    let r = updateStmt.run(pos, name);
    if (r.changes === 0) {
      // Try fuzzy: first 20 chars match
      r = updateFuzzy.run(pos, name.substring(0, 20) + '%');
    }
    if (r.changes > 0) {
      matched++;
      if (idx < 15) console.log(`  [${pos}] ${name}`);
    } else {
      console.log(`  NOT FOUND in DB: ${name}`);
    }
  });

  console.log(`\nUpdated ${matched}/${allNames.length} products with position.`);
  db.close();
}

run().catch(console.error);
