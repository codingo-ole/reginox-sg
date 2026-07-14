// Populates color_order and hideprice_order columns from scraped original site sort data
const db = require('./backend/node_modules/better-sqlite3')('./reginox.db');

// Add columns if not exist
try { db.prepare('ALTER TABLE products ADD COLUMN color_order INTEGER').run(); } catch(e){}
try { db.prepare('ALTER TABLE products ADD COLUMN hideprice_order INTEGER').run(); } catch(e){}

// ── Color sort order (all 8 pages scraped) ──────────────────────────────
const COLOR_ORDER = [
  // Page 1
  'R18 370 (R) OSP','R18 370 (R) OKG','R18 3530 (R) OSK','Rio (L) OSP','Boston (L) OKG',
  'Rio (L) SP-CC','R18 390 (R) OSK','L18 390 (L) OSK','L18 390 (L) OKG','L18 4035 (L) OSK',
  'Princess 80 (L) KGOKG','R18 4035 (R) OKG','Regidrain (R) OKG','L18 3440 (L) OKG',
  'L18 4035 (L) OKG','L18 4035 (L) OKG W.O.K.','L18 35D40 (L) KGOKG','Atlantis (L) OSP',
  'Caribbean (L) OSP','Ottawa OSP Wall mount set','L18 370 (L) OKG','L18 390 (L) KG-CC',
  'L18 4035 (L) VP-CC','Ohio 50x40 Tapwing (L) OKG','Ohio 80x42 (L) OKG','Ohio 50x40 (L) OKG',
  'Ohio 40x40 Tapwing (L) OKG','Ohio 40x40 (L) OKG','Morena (L) KGKG','Queen 60 (L) KGOKG',
  'Queen 60 (L) KGOKG left','Beta 10 BAP OKG','Beta 20 BAP KGOKG','Queen 60 (L) KGOKG Right',
  'Ohio 18x40 (L) OKG','Admiral 60 (L) KGOKG',
  // Page 2
  'Admiral 40 (L) OKG','Jumbo (R)','Kansas 40x40 (L) OKG','Centurio 10 (L) OKG',
  'Centurio 10 (L) OKG KRG.2','Centurio 1.5 (L) KGOKG','L18 4035 (L) KG-CC',
  'Diplomat 10 ECO OKG','Diplomat 1.5 ECO KGOKG','Diplomat 30 ECO KGOKG',
  'Centurio 20 (L) KGOKG','Caribbean (L) SP-CC','Centurio 10 (R) OKG',
  'Centurio 10 (L) Right','Centurio 10 (L) Left','IB 4040 (L) KG-CC (316)',
  'IB 5040 (L) KG-CC (316)','Kansas 50x40 (L) KG-CC','Boston (R) KG-CC',
  'IB 1840 (L) KG-CC','Kansas 40x40 (L) KG-CC','IB 1840 (L) OKG',
  'Centurio 10 (L) KG-CC','Colorado (L) OKG Comfort','Colorado (R) OKG Comfort',
  'Minister OKG Reversible','Admiral 40 (L) KG-CC','L18 390 (L) OKG Comfort',
  'R18 390 (R) OKG Comfort','New York 40x40 (L) OKG Comfort','New York 50x40 (L) OKG Comfort',
  'New York 18x40+50x40 (L) OKGD Comfort','New York 34x40+18x40 (L) OKGD Comfort',
  'New York 40x40+18x40 (L) OKGD Comfort','New York 34x40 (L) OKG Comfort',
  'New York 50x40+18x40 (L) OKGD Comfort',
  // Page 3
  'New York 18x40+34x40 (L) OKGD Comfort','New York 18x40 (L) OKG Comfort',
  'New York 18x40+40x40 (L) OKGD Comfort','New York 40x40 (L) OKG',
  'New York 50x40 (L) OKG','New York 34x40+34x40 (L) OKGD Comfort',
  'New York 40x40+40x40 (L) OKGD Comfort','Miami 40x40 Gun Metal','Miami 40x40 Copper',
  'Miami 40x40 Gold','Miami 50x40 Gun Metal','Miami 50x40 Copper','Miami 50x40 Gold',
  'Amsterdam 540 Pure White','Amsterdam 540 Black Silvery','Amsterdam 540 Grey Silvery',
  'Amsterdam 540 Caffe Silvery','Amsterdam 40 Caffe Silvery','Amsterdam 78 Pure White',
  'Amsterdam 78 Black Silvery','Amsterdam 78 Grey Silvery','Amsterdam 78 Caffe Silvery',
  'Houston 50x40','Houston 34x40','New Jersey 40x37 (L) OKG Comfort',
  'New Jersey 50x37 (L) OKG Comfort','New Jersey 18x37+34x37 (L) OKGD Comfort LB',
  'New Jersey 34x37+18x37 (L) OKGD Comfort LB','Amsterdam 43 Black Silvery',
  'Amsterdam 43 Caffe Silvery','Amsterdam 43 Grey Silvery','Amsterdam 43 Pure White',
  'Amsterdam 34 Black Silvery','Amsterdam 34 Caffe Silvery','Amsterdam 34 Grey Silvery',
  'Amsterdam 34 Pure White',
  // Page 4
  'Texel 50x40 (L) Black Silvery','New York 34x40 (L) KG-CC','New York 50x40 (L) KG-CC',
  'New York 72x40 (L) KG-CC','Amsterdam 40 Pure Black','Amsterdam 50 Pure Black',
  'Texel 40x40 (L) Pure Black','Texel 50x40 (L) Pure Black',
  'New York 50x40 Tapwing (L) OKG Comfort 1x taphole','L18 35D40 (L) KGKG-CC',
  'New York 40x40 (L) OKG Comfort Copper Rose','New York 50x40 (L) OKG Comfort Copper Rose',
  'Amsterdam 50 Pure White','Amsterdam 50 Black Silvery','Amsterdam 50 Grey Silvery',
  'Amsterdam 50 Caffe Silvery','Amsterdam 72 Pure White','Amsterdam 72 Black Silvery',
  'Amsterdam 72 Grey Silvery','Amsterdam 72 Caffe Silvery','Amsterdam 10 Pure White',
  'Amsterdam 10 Grey Silvery','Amsterdam 10 Caffe Silvery','Amsterdam 15 Pure White',
  'Amsterdam 15 Black Silvery','Amsterdam 15 Grey Silvery','Amsterdam 15 Caffe Silvery',
  'Amsterdam 20 Black Silvery','Amsterdam 20 Grey Silvery','Amsterdam 20 Caffe Silvery',
  'Amsterdam 54 Tapwing Pure White','Amsterdam 54 Tapwing Black Silvery',
  'Amsterdam 54 Tapwing Grey Silvery','Amsterdam 54 Tapwing Caffe Silvery',
  'Amsterdam 25 Pure White','Amsterdam 25 Black Silvery',
  // Page 5
  'Amsterdam 25 Grey Silvery','Amsterdam 25 Caffe Silvery','Harlem 10 Pure White',
  'Harlem 10 Black Silvery','Harlem 10 Grey Silvery','Harlem 10 Caffe Silvery',
  'Harlem 15 Pure White','Harlem 15 Black Silvery','Harlem 15 Grey Silvery',
  'Harlem 15 Caffe Silvery','New York 72x40 (L) OKG','IB 4040 (L) OKG',
  'IB 5040 (L) OKG','L18 4035 (L) SK 10 cm','Amsterdam 40 Pure White',
  'Amsterdam 40 Black Silvery','Amsterdam 40 Grey Silvery','New York Round (L) OKG Comfort',
  'Amsterdam 72 Pure Black','New York 40x40 Stainless Steel bottom',
  'New York 50x40 Stainless Steel Bottom','Ontario 40x40 Stainless Steel Bottom',
  'Ontario 50x40 Stainless Steel Bottom','L18 390 (L) VP-CC 10cm','L18 4035 (L) VP 10 cm',
  'New York 55x40 (L) OKG Comfort','New York 34x40 (L) Tapwing OKG Comfort KRG.1',
  'Diplomat 10 ECO OKG KRG.2','New York Slim 40x40 (L) OKG Comfort',
  'New York Slim 50x40 (L) OKG Comfort','New York 50x40 (L) OKG Comfort Gold II',
  'New Jersey 40x37 (L) KG 10 cm','New Jersey 50x37 (L) KG 10cm',
  'Verona 70 Nero Black','Verona 50 Nero Black','Verona 40 Nero Black',
  // Page 6
  'Messina 70 Nero Black','Messina 50 Nero Black','Messina 40 Nero Black',
  'Florence 72 Nero Black','Florence 50 Nero Black','Florence 40 Nero Black',
  'Bari 5 Nero Black','Bari 10 Nero Black','New York 18x40 (L) OKG Comfort Copper II',
  'New York 18x40 (L) OKG Comfort Gold II','New York 18x40 (L) OKG Comfort Gun Metal II',
  'New York 34x40 (L) OKG Comfort Copper II','New York 34x40 (L) OKG Comfort Gold II',
  'New York 34x40 (L) OKG Comfort Gun Metal II',
  'New York 34x40+18x40 (L) OKGD Comfort Copper II',
  'New York 34x40+18x40 (L) OKGD Comfort Gold II',
  'New York 34x40+18x40 (L) OKGD Comfort Gun Metal II',
  'New York Slim 40x40 (L) OKG Comfort Copper II','New York Slim 40x40 (L) OKG Comfort Gold II',
  'New York Slim 40x40 (L) OKG Comfort Gun Metal II',
  'New York Slim 50x40 (L) OKG Comfort Copper II','New York Slim 50x40 (L) OKG Comfort Gold II',
  'New York Slim 50x40 (L) OKG Comfort Gun Metal II',
  'New York 40x40 (L) OKG Comfort Copper II','New York 40x40 (L) OKG Comfort Gold II',
  'New York 40x40 (L) OKG Comfort Gun Metal II','New York 50x40 (L) OKG Comfort Copper II',
  'New York 50x40 (L) OKG Comfort Gun Metal II','Diplomat 30 ECO KGKG-CC',
  'Amsterdam 10 Black Silvery','Boston (R) OKG','Ohio 50x40 (L) OKG Gold II',
  'Messina 50 Champagne','Monaco 1.5 (R) KGOKG','Monaco 10 (R) OKG','Monaco 30 (R) KGOKG',
  // Page 7
  'Envoy 10 (R) OKG','Envoy 1.5 (R) KGOKG','New York 50x40 (L) Tapwing Gold II',
  'New York 50x40 (L) Tapwing Gun Metal II','New York 50x40 Tapwing Copper II',
  'New York 40x40 Tapwing Gold II','New York 40x40 Tapwing Gun Metal II',
  'New York 40x40 Tapwing Copper II','Ohio 40x40 (L) OKG Copper II',
  'Ohio 40x40 (L) OKG Gold II','Ohio 40x40 (L) OKG Gun Metal II',
  'Ohio 50x40 (L) OKG Copper II','Ohio 50x40 (L) OKG Gun Metal II',
  'Vero 40x40 (L) Tapwing OKG KRG.1','Vero 50x40 (L) Tapwing OKG KRG.1',
  'Vero 40x40 (L) OKG','Vero 50x40 (L) OKG','Vero 30x40 (L) OKG',
  'Bari 10 Soft White','Bari 5 Soft White','Florence 40 Soft White','Florence 50 Soft White',
  'Florence 72 Soft White','Messina 40 Champagne','Messina 40 Soft White',
  'Messina 50 Soft White','Messina 70 Champagne','Messina 70 Soft White',
  'Verona 40 Champagne','Verona 40 Soft White','Verona 50 Soft White',
  'Verona 70 Champagne','Verona 70 Soft White','New York 40x40 Tapwing',
  'New York 30x40 (L) OKG Comfort',
  // Page 8
  'Amsterdam 78 Pure Black','Amsterdam 20 Pure White','Texel 40x40 (L) Black Silvery',
  'Colorado (L) KG-CC','Verona 50 Champagne',
];

// ── Hideprice sort order (all 8 pages scraped) ──────────────────────────
const HIDEPRICE_ORDER = [
  // Page 1
  'R18 370 (R) OSP','R18 3530 (R) OSK','Boston (L) OKG','R18 390 (R) OSK',
  'L18 4035 (L) OSK','R18 4035 (R) OKG','Regidrain (R) OKG','L18 4035 (L) OKG',
  'L18 390 (L) KG-CC','Ohio 80x42 (L) OKG','Ohio 40x40 Tapwing (L) OKG',
  'Queen 60 (L) KGOKG left','Beta 10 BAP OKG','Beta 20 BAP KGOKG','Admiral 60 (L) KGOKG',
  'Centurio 1.5 (L) KGOKG','Diplomat 1.5 ECO KGOKG','Centurio 20 (L) KGOKG',
  'IB 1840 (L) OKG','Colorado (R) OKG Comfort','Minister OKG Reversible',
  'Admiral 40 (L) KG-CC','R18 390 (R) OKG Comfort','New York 40x40 (L) OKG Comfort',
  'New York 50x40 (L) OKG Comfort','New York 18x40+50x40 (L) OKGD Comfort',
  'New York 34x40+18x40 (L) OKGD Comfort','New York 40x40+18x40 (L) OKGD Comfort',
  'New York 50x40+18x40 (L) OKGD Comfort','New York 18x40+34x40 (L) OKGD Comfort',
  'New York 18x40 (L) OKG Comfort','New York 18x40+40x40 (L) OKGD Comfort',
  'New York 40x40 (L) OKG','New York 50x40 (L) OKG','New York 40x40+40x40 (L) OKGD Comfort',
  'Amsterdam 540 Pure White',
  // Page 2
  'Amsterdam 540 Black Silvery','Amsterdam 540 Caffe Silvery','Amsterdam 78 Pure White',
  'Amsterdam 78 Grey Silvery','New Jersey 50x37 (L) OKG Comfort',
  'New Jersey 34x37+18x37 (L) OKGD Comfort LB','Amsterdam 43 Caffe Silvery',
  'Amsterdam 43 Pure White','Amsterdam 34 Black Silvery','Amsterdam 34 Caffe Silvery',
  'Amsterdam 34 Pure White','Texel 50x40 (L) Black Silvery','Texel 40x40 (L) Pure Black',
  'New York 50x40 Tapwing (L) OKG Comfort 1x taphole',
  'New York 40x40 (L) OKG Comfort Copper Rose','New York 50x40 (L) OKG Comfort Copper Rose',
  'Amsterdam 10 Pure White','Amsterdam 15 Pure White','Amsterdam 15 Grey Silvery',
  'Amsterdam 15 Caffe Silvery','Amsterdam 20 Caffe Silvery','Amsterdam 25 Pure White',
  'Amsterdam 25 Grey Silvery','Amsterdam 25 Caffe Silvery','Harlem 10 Grey Silvery',
  'Harlem 10 Caffe Silvery','Harlem 15 Grey Silvery','New York 72x40 (L) OKG',
  'Amsterdam 40 Black Silvery','New York Round (L) OKG Comfort',
  'New York 50x40 Stainless Steel Bottom','Ontario 50x40 Stainless Steel Bottom',
  'L18 390 (L) VP-CC 10cm','New York 55x40 (L) OKG Comfort',
  'New York 34x40 (L) Tapwing OKG Comfort KRG.1','New York Slim 40x40 (L) OKG Comfort',
  // Page 3
  'New York Slim 50x40 (L) OKG Comfort','New York 50x40 (L) OKG Comfort Gold II',
  'New Jersey 40x37 (L) KG 10 cm','New Jersey 50x37 (L) KG 10cm',
  'Verona 70 Nero Black','Verona 50 Nero Black','Verona 40 Nero Black',
  'Messina 70 Nero Black','Messina 50 Nero Black','Messina 40 Nero Black',
  'Florence 72 Nero Black','Florence 50 Nero Black','Florence 40 Nero Black',
  'Bari 5 Nero Black','Bari 10 Nero Black','New York 18x40 (L) OKG Comfort Copper II',
  'New York 18x40 (L) OKG Comfort Gold II','New York 18x40 (L) OKG Comfort Gun Metal II',
  'New York 34x40 (L) OKG Comfort Copper II','New York 34x40 (L) OKG Comfort Gold II',
  'New York 34x40 (L) OKG Comfort Gun Metal II',
  'New York 34x40+18x40 (L) OKGD Comfort Copper II',
  'New York 34x40+18x40 (L) OKGD Comfort Gold II',
  'New York 34x40+18x40 (L) OKGD Comfort Gun Metal II',
  'New York Slim 40x40 (L) OKG Comfort Copper II','New York Slim 40x40 (L) OKG Comfort Gold II',
  'New York Slim 40x40 (L) OKG Comfort Gun Metal II',
  'New York Slim 50x40 (L) OKG Comfort Copper II','New York Slim 50x40 (L) OKG Comfort Gold II',
  'New York Slim 50x40 (L) OKG Comfort Gun Metal II',
  'New York 40x40 (L) OKG Comfort Copper II','New York 40x40 (L) OKG Comfort Gold II',
  'New York 40x40 (L) OKG Comfort Gun Metal II','New York 50x40 (L) OKG Comfort Copper II',
  'New York 50x40 (L) OKG Comfort Gun Metal II','Diplomat 30 ECO KGKG-CC',
  // Page 4
  'Ohio 50x40 (L) OKG Gold II','Messina 50 Champagne','Monaco 1.5 (R) KGOKG',
  'Monaco 10 (R) OKG','Monaco 30 (R) KGOKG','Envoy 10 (R) OKG','Envoy 1.5 (R) KGOKG',
  'New York 50x40 (L) Tapwing Gold II','New York 50x40 (L) Tapwing Gun Metal II',
  'New York 50x40 Tapwing Copper II','New York 40x40 Tapwing Gold II',
  'New York 40x40 Tapwing Gun Metal II','New York 40x40 Tapwing Copper II',
  'Ohio 40x40 (L) OKG Copper II','Ohio 40x40 (L) OKG Gold II','Ohio 40x40 (L) OKG Gun Metal II',
  'Ohio 50x40 (L) OKG Copper II','Ohio 50x40 (L) OKG Gun Metal II',
  'Vero 40x40 (L) Tapwing OKG KRG.1','Vero 50x40 (L) Tapwing OKG KRG.1',
  'Vero 40x40 (L) OKG','Vero 50x40 (L) OKG','Vero 30x40 (L) OKG',
  'Bari 10 Soft White','Bari 5 Soft White','Florence 40 Soft White','Florence 50 Soft White',
  'Florence 72 Soft White','Messina 40 Champagne','Messina 40 Soft White',
  'Messina 50 Soft White','Messina 70 Champagne','Messina 70 Soft White',
  'Verona 40 Champagne','Verona 40 Soft White','Verona 50 Soft White',
  // Page 5
  'Verona 70 Champagne','Verona 70 Soft White','New York 40x40 Tapwing',
  'New York 30x40 (L) OKG Comfort','Amsterdam 78 Pure Black','Amsterdam 20 Pure White',
  'Texel 40x40 (L) Black Silvery','Colorado (L) KG-CC','Verona 50 Champagne',
  'R18 370 (R) OKG','Rio (L) OSP','Rio (L) SP-CC','L18 390 (L) OSK','L18 390 (L) OKG',
  'Princess 80 (L) KGOKG','L18 3440 (L) OKG','L18 4035 (L) OKG W.O.K.',
  'L18 35D40 (L) KGOKG','Atlantis (L) OSP','Caribbean (L) OSP','Ottawa OSP Wall mount set',
  'L18 370 (L) OKG','L18 4035 (L) VP-CC','Ohio 50x40 Tapwing (L) OKG','Ohio 50x40 (L) OKG',
  'Ohio 40x40 (L) OKG','Morena (L) KGKG','Queen 60 (L) KGOKG','Queen 60 (L) KGOKG Right',
  'Ohio 18x40 (L) OKG','Admiral 40 (L) OKG','Jumbo (R)','Kansas 40x40 (L) OKG',
  'Centurio 10 (L) OKG','Centurio 10 (L) OKG KRG.2','L18 4035 (L) KG-CC',
  // Page 6
  'Diplomat 10 ECO OKG','Diplomat 30 ECO KGOKG','Caribbean (L) SP-CC',
  'Centurio 10 (R) OKG','Centurio 10 (L) Right','Centurio 10 (L) Left',
  'IB 4040 (L) KG-CC (316)','IB 5040 (L) KG-CC (316)','Kansas 50x40 (L) KG-CC',
  'Boston (R) KG-CC','IB 1840 (L) KG-CC','Kansas 40x40 (L) KG-CC','Centurio 10 (L) KG-CC',
  'Colorado (L) OKG Comfort','L18 390 (L) OKG Comfort','New York 34x40 (L) OKG Comfort',
  'New York 34x40+34x40 (L) OKGD Comfort','Miami 40x40 Gun Metal','Miami 40x40 Copper',
  'Miami 40x40 Gold','Miami 50x40 Gun Metal','Miami 50x40 Copper','Miami 50x40 Gold',
  'Amsterdam 540 Grey Silvery','Amsterdam 40 Caffe Silvery','Amsterdam 78 Black Silvery',
  'Amsterdam 78 Caffe Silvery','Houston 50x40','Houston 34x40',
  'New Jersey 40x37 (L) OKG Comfort','New Jersey 18x37+34x37 (L) OKGD Comfort LB',
  'Amsterdam 43 Black Silvery','Amsterdam 43 Grey Silvery','Amsterdam 34 Grey Silvery',
  'New York 34x40 (L) KG-CC','New York 50x40 (L) KG-CC',
  // Page 7
  'New York 72x40 (L) KG-CC','Amsterdam 40 Pure Black','Amsterdam 50 Pure Black',
  'Texel 50x40 (L) Pure Black','L18 35D40 (L) KGKG-CC','Amsterdam 50 Pure White',
  'Amsterdam 50 Black Silvery','Amsterdam 50 Grey Silvery','Amsterdam 50 Caffe Silvery',
  'Amsterdam 72 Pure White','Amsterdam 72 Black Silvery','Amsterdam 72 Grey Silvery',
  'Amsterdam 72 Caffe Silvery','Amsterdam 10 Grey Silvery','Amsterdam 10 Caffe Silvery',
  'Amsterdam 15 Black Silvery','Amsterdam 20 Black Silvery','Amsterdam 20 Grey Silvery',
  'Amsterdam 54 Tapwing Pure White','Amsterdam 54 Tapwing Black Silvery',
  'Amsterdam 54 Tapwing Grey Silvery','Amsterdam 54 Tapwing Caffe Silvery',
  'Amsterdam 25 Black Silvery','Harlem 10 Pure White','Harlem 10 Black Silvery',
  'Harlem 15 Pure White','Harlem 15 Black Silvery','Harlem 15 Caffe Silvery',
  'IB 4040 (L) OKG','IB 5040 (L) OKG','L18 4035 (L) SK 10 cm',
  'Amsterdam 40 Pure White','Amsterdam 40 Grey Silvery','Amsterdam 72 Pure Black',
  'New York 40x40 Stainless Steel bottom','Ontario 40x40 Stainless Steel Bottom',
  // Page 8
  'L18 4035 (L) VP 10 cm','Diplomat 10 ECO OKG KRG.2','Amsterdam 10 Black Silvery',
  'Boston (R) OKG',
];

function populate(list, column) {
  const update = db.prepare(`UPDATE products SET ${column} = ? WHERE LOWER(name) = LOWER(?) AND category = 'Sinks'`);
  const fuzzy  = db.prepare(`UPDATE products SET ${column} = ? WHERE name LIKE ? AND category = 'Sinks'`);
  let matched = 0, notFound = [];
  list.forEach((name, idx) => {
    const order = idx + 1;
    let r = update.run(order, name);
    if (r.changes === 0) {
      r = fuzzy.run(order, name.substring(0, 22) + '%');
    }
    if (r.changes > 0) matched++;
    else notFound.push(name);
  });
  console.log(`${column}: ${matched}/${list.length} matched`);
  if (notFound.length) console.log('  Not found:', notFound.slice(0, 10));
}

populate(COLOR_ORDER, 'color_order');
populate(HIDEPRICE_ORDER, 'hideprice_order');

// Verify
const sample = db.prepare("SELECT name, position, color_order, hideprice_order FROM products WHERE category='Sinks' ORDER BY color_order LIMIT 5").all();
console.log('\nTop 5 by color_order:');
sample.forEach(p => console.log(`  [c=${p.color_order} h=${p.hideprice_order} pos=${p.position}] ${p.name}`));

db.close();
