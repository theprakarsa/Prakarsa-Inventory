import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (ch === '"' && next === '"') { cell += '"'; i++; }
      else if (ch === '"') { inQuotes = false; }
      else { cell += ch; }
    } else {
      if (ch === '"') { inQuotes = true; }
      else if (ch === ',') { row.push(cell); cell = ''; }
      else if (ch === '\n') { row.push(cell); rows.push(row); row = []; cell = ''; }
      else if (ch === '\r') { /* skip */ }
      else { cell += ch; }
    }
  }
  if (cell.length > 0 || row.length > 0) { row.push(cell); rows.push(row); }
  return rows;
}

async function main() {
  const csvPath = path.join(process.cwd(), 'prisma', 'data-assets.csv');
  const raw = fs.readFileSync(csvPath, 'utf-8');
  const rows = parseCSV(raw);
  const [header, ...data] = rows;

  const idx = (col: string) => header.indexOf(col);
  const col = {
    legacyCode: idx('legacy_code'),
    name: idx('name'),
    categoryCode: idx('category_code'),
    ownership: idx('ownership'),
    price: idx('price'),
    quantity: idx('quantity'),
    depreciation: idx('depreciation'),
    specs: idx('specs'),
    note: idx('note'),
    auctionStatus: idx('auction_status'),
    auctionNote: idx('auction_note'),
    status: idx('status'),
  };

  const divisions = await prisma.division.findMany();
  const categories = await prisma.category.findMany();
  const divMap: Record<string, number> = {};
  const catMap: Record<string, number> = {};
  for (const d of divisions) divMap[d.code] = d.id;
  for (const c of categories) catMap[c.code] = c.id;

  const divId = divMap['UMM'];
  if (!divId) throw new Error('Divisi UMM tidak ada. Jalankan seed dulu.');

  // counter per kategori untuk kode baru
  const counters: Record<string, number> = {};

  let inserted = 0;
  let skipped = 0;

  for (let i = 0; i < data.length; i++) {
    const r = data[i];
    if (!r[col.legacyCode] || r[col.legacyCode].trim() === '') continue;

    const legacyCode = r[col.legacyCode].trim();
    const catCode = (r[col.categoryCode] || '').trim().toUpperCase();
    const catId = catMap[catCode];
    if (!catId) { console.warn(`⚠️  row ${i + 2}: kategori "${catCode}" tidak ditemukan, skip`); skipped++; continue; }

    const exists = await prisma.asset.findFirst({ where: { legacyCode } });
    if (exists) { skipped++; continue; }

    const num = (counters[catCode] || 0) + 1;
    counters[catCode] = num;
    const code = `PRAKARSA-UMM-${catCode}-${String(num).padStart(3, '0')}`;

    const priceStr = (r[col.price] || '').trim();
    const depStr = (r[col.depreciation] || '').trim();
    const qtyStr = (r[col.quantity] || '').trim();

    await prisma.asset.create({
      data: {
        code,
        legacyCode,
        name: (r[col.name] || '').trim(),
        divisionId: divId,
        categoryId: catId,
        ownership: (r[col.ownership] || '').trim() || null,
        price: priceStr ? Number(priceStr) : null,
        quantity: qtyStr ? Number(qtyStr) : 1,
        depreciation: depStr ? Number(depStr) : null,
        specs: (r[col.specs] || '').trim() || null,
        note: (r[col.note] || '').trim() || null,
        auctionStatus: ((r[col.auctionStatus] || 'none').trim() || 'none') as any,
        auctionNote: (r[col.auctionNote] || '').trim() || null,
        status: ((r[col.status] || 'tersedia').trim() || 'tersedia') as any,
      },
    });
    inserted++;

    if (inserted % 20 === 0) console.log(`   ... ${inserted} aset diimport`);
  }

  console.log(`\n✅ Import selesai`);
  console.log(`   Inserted: ${inserted}`);
  console.log(`   Skipped (duplikat/invalid): ${skipped}`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
