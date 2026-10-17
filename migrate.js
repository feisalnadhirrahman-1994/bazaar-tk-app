/**
 * ============================================================================
 *  BAZAAR DANUS — Migrasi Google Sheets ke Supabase
 * ============================================================================
 *  Cara pakai:
 *     npm install @supabase/supabase-js
 *     node migrate.js            # jalankan migrasi
 *     node migrate.js --dry-run  # cek data saja, tidak menulis apa pun
 *
 *  Skrip ini login sebagai akun admin biasa. TIDAK ADA service_role /
 *  secret key di mana pun — akses penuh sudah diberikan lewat policy
 *  "admin kelola ..." di supabase-schema.sql.
 *
 *  Aman dijalankan berulang: semua tulisan memakai upsert, jadi menjalankan
 *  dua kali tidak menggandakan data.
 * ============================================================================
 */

import { createClient } from '@supabase/supabase-js';
import readline from 'node:readline';

const SUPABASE_URL = 'https://gpxkbtdyyblsirkqmyss.supabase.co';
const PUBLISHABLE_KEY = 'sb_publishable_E5E8YHYwjI5ycpfgReTXDw_x-tRvwWo';
const ADMIN_EMAIL = 'admin@danus.com';
const SHEET_URL =
  'https://script.google.com/macros/s/AKfycbyyfkDa12D55oAB_l_rU15U4EENvXAb1IwBz6WRY6DaoYrZobvi9D0dF_UaMUi9iBAU/exec';
const BUCKET = 'product-images';

const DRY = process.argv.includes('--dry-run');

/**
 * HARGA HISTORIS.
 *
 * Order lama hanya menyimpan nama produk dan jumlahnya di kolom "Rincian
 * Items" — harganya tidak pernah ikut tercatat per baris. Jadi untuk
 * merekonstruksi order lama, skrip ini memakai harga dari master produk
 * yang berlaku SEKARANG.
 *
 * Kalau sebuah produk pernah diubah harganya setelah ada order masuk,
 * rekonstruksi itu meleset. Sheet tetap menyimpan angka yang benar di kolom
 * Hak Vendor dan Hak Panitia, jadi selisihnya langsung ketahuan.
 *
 * Isi map ini dengan harga LAMA produk tersebut. Harga di master produk
 * tidak ikut berubah — map ini hanya dipakai saat membaca order lama.
 * Kalau ada yang tidak cocok, skrip akan menyarankan baris yang perlu
 * ditambahkan di sini.
 *
 *   'p-1787059736412': { price_owner: 9900, price_organizer: 1100 },
 */
const HISTORICAL_PRICES = {
  // Black Americano (Oh My Precious.id). Snapshot sheet 4 Sep 2026 mencatat
  // 9900/1100; master sekarang 10000/1000. Order BZ-514932 (31 Agu) masuk
  // sebelum perubahan itu. Harga master TIDAK diubah oleh baris ini.
  'p-1787059736412': { price_owner: 9900, price_organizer: 1100 },
};

// ----------------------------------------------------------------- util ----

const log = (...a) => console.log(...a);
const warn = (...a) => console.warn('  !', ...a);

/** Nomor telepon kadang terbaca sebagai angka dari spreadsheet. */
const asPhone = (v) => {
  if (v === null || v === undefined || v === '') return null;
  if (typeof v === 'number') return BigInt(Math.round(v)).toString();
  return String(v).replace(/[‪-‮]/g, '').trim() || null;
};

const asText = (v) => {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  return s === '' ? null : s;
};

const asInt = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? Math.round(n) : 0;
};

const asDate = (v) => {
  if (!v) return null;
  const s = String(v);
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  const d = new Date(v);
  return isNaN(d) ? null : d.toISOString().slice(0, 10);
};

/** Sama persis dengan normalizeVariants() di App.jsx. */
export const normalizeVariants = (raw) => {
  if (Array.isArray(raw)) return raw;
  if (typeof raw === 'string') {
    const s = raw.trim();
    if (!s) return [];
    try {
      const p = JSON.parse(s);
      return Array.isArray(p) ? p : [];
    } catch {
      return [];
    }
  }
  return [];
};

/** Sama persis dengan splitRincianItems() di App.jsx: dipecah per "(xN)". */
export const splitRincianItems = (text) => {
  const out = [];
  const re = /\(x\s*(\d+)\s*\)/gi;
  let last = 0, m;
  while ((m = re.exec(text)) !== null) {
    const chunk = text.slice(last, m.index).replace(/^\s*,\s*/, '').trim();
    if (chunk) out.push({ name: chunk, qty: parseInt(m[1], 10) || 1 });
    last = re.lastIndex;
  }
  const tail = text.slice(last).replace(/^\s*,\s*/, '').trim();
  if (tail) out.push({ name: tail, qty: 1 });
  return out;
};

/** Nama produk di sheet kadang berakhir spasi atau koma. */
export const normName = (s) =>
  String(s || '').trim().replace(/[,;]+$/, '').trim().toLowerCase();

/**
 * Pecah satu baris rincian jadi item siap simpan.
 * products: [{id,name,tenant_id,price_owner,price_organizer,variants:[...]}]
 */
export const resolveItem = (raw, qty, products) => {
  let base = raw, variantName = '';
  const vm = raw.match(/^(.*?) \[([^\]]+)\]$/);
  if (vm) { base = vm[1].trim(); variantName = vm[2].trim(); }

  const p = products.find((x) => normName(x.name) === normName(base));
  if (!p) return { error: `produk tidak dikenal: ${raw}` };

  let priceOwner = asInt(p.price_owner);
  let priceOrganizer = asInt(p.price_organizer);
  let variant = null;

  if (variantName) {
    variant = (p.variants || []).find(
      (v) => String(v.name).toLowerCase() === variantName.toLowerCase()
    );
    if (!variant) return { error: `varian tidak dikenal: ${raw}` };
    priceOwner = asInt(variant.priceOwner);
    priceOrganizer = asInt(variant.priceOrganizer);
  }

  // Harga lama menang untuk order historis, kalau didaftarkan.
  const histKey = variant ? `${p.id}|${variant.name}` : p.id;
  const hist = HISTORICAL_PRICES[histKey];
  if (hist) {
    priceOwner = asInt(hist.price_owner);
    priceOrganizer = asInt(hist.price_organizer);
  }

  return {
    _histKey: histKey,
    product_id: p.id,
    variantName: variant ? variant.name : null,
    product_name: raw,
    tenant_id: p.tenant_id,
    qty,
    price_owner: priceOwner,
    price_organizer: priceOrganizer,
  };
};

function askPassword(prompt) {
  return new Promise((resolve) => {
    const stdin = process.stdin;
    process.stdout.write(prompt);
    if (!stdin.isTTY) {
      const rl = readline.createInterface({ input: stdin });
      rl.once('line', (l) => { rl.close(); resolve(l); });
      return;
    }
    stdin.setRawMode(true); stdin.resume(); stdin.setEncoding('utf8');
    let pw = '';
    const onData = (ch) => {
      if (ch === '\n' || ch === '\r' || ch === '\u0004') {
        stdin.setRawMode(false); stdin.pause();
        stdin.removeListener('data', onData);
        process.stdout.write('\n'); resolve(pw);
      } else if (ch === '\u0003') { process.stdout.write('\n'); process.exit(1); }
      else if (ch === '\u007f') { pw = pw.slice(0, -1); }
      else pw += ch;
    };
    stdin.on('data', onData);
  });
}

// ------------------------------------------------------------- migrasi -----

async function main() {
  if (DRY) log('MODE DRY-RUN — tidak ada yang ditulis ke Supabase.\n');

  log('1/7  Mengambil data dari Google Sheets...');
  const res = await fetch(`${SHEET_URL}?t=${Date.now()}`, { cache: 'no-store' });
  const json = await res.json();
  if (json.status !== 'success') throw new Error('Sheets menolak: ' + JSON.stringify(json).slice(0, 200));
  const D = json.data;
  log(`     ${D.products.length} produk, ${D.tenants.length} tenant, ` +
      `${D.classes.length} kelas, ${D.batches.length} batch, ${D.orders.length} order`);

  // --- siapkan bentuk data, sekaligus periksa sebelum menulis apa pun ------
  const tenants = D.tenants.filter((t) => t.id).map((t) => ({
    id: String(t.id), name: asText(t.name) || '(tanpa nama)',
    owner: asText(t.owner), phone: asPhone(t.phone),
  }));

  const classes = D.classes.filter((c) => c.id).map((c) => ({
    id: String(c.id), name: asText(c.name) || '(tanpa nama)', phone: asPhone(c.phone),
  }));

  const batches = D.batches.filter((b) => b.id).map((b) => ({
    id: String(b.id), name: asText(b.name) || '(tanpa nama)',
    start_date: asDate(b.startDate), end_date: asDate(b.endDate),
    ready_date: asDate(b.readyDate),
    is_active: b.isActive === true || String(b.isActive).toLowerCase() === 'true',
    description: asText(b.description),
  }));
  for (const b of batches) {
    if (!b.start_date || !b.end_date) throw new Error(`Batch ${b.id} tanggalnya tidak terbaca.`);
  }

  const products = D.products.filter((p) => p.id).map((p) => ({
    id: String(p.id), tenant_id: String(p.tenantId),
    name: asText(p.name) || '(tanpa nama)',
    price_owner: asInt(p.priceOwner), price_organizer: asInt(p.priceOrganizer),
    description: asText(p.description), category: asText(p.category),
    available: p.available !== false && String(p.available).toLowerCase() !== 'false',
    _image: typeof p.imageUrl === 'string' && p.imageUrl.startsWith('data:') ? p.imageUrl : null,
    _imageUrlPlain: typeof p.imageUrl === 'string' && /^https?:/.test(p.imageUrl) ? p.imageUrl : null,
    variants: normalizeVariants(p.variants),
  }));

  const orphan = products.filter((p) => !tenants.some((t) => t.id === p.tenant_id));
  if (orphan.length) throw new Error(`Produk tanpa tenant: ${orphan.map((p) => p.name).join(', ')}`);

  const nVariant = products.filter((p) => p.variants.length).length;
  log(`     ${nVariant} produk bervarian, ` +
      `${products.reduce((n, p) => n + p.variants.length, 0)} baris varian`);

  // --- rekonstruksi order + pemeriksaan angka ------------------------------
  log('2/7  Memeriksa order terhadap angka di sheet...');
  const orders = [];
  const problems = [];
  const mismatched = [];
  const trustedKeys = new Set();   // harga yang terbukti benar di order lain

  for (const o of D.orders) {
    const code = asText(o['Order ID']);
    if (!code) continue;
    const items = [];
    for (const { name, qty } of splitRincianItems(String(o['Rincian Items'] || ''))) {
      const it = resolveItem(name, qty, products);
      if (it.error) { problems.push(`${code}: ${it.error}`); continue; }
      items.push(it);
    }
    const gotOwner = items.reduce((n, i) => n + i.price_owner * i.qty, 0);
    const gotOrg = items.reduce((n, i) => n + i.price_organizer * i.qty, 0);
    const wantOwner = asInt(o['Hak Vendor']), wantOrg = asInt(o['Hak Panitia']);
    if (gotOwner !== wantOwner || gotOrg !== wantOrg) {
      mismatched.push({ o, code, items, gotOwner, gotOrg, wantOwner, wantOrg });
    } else {
      // Order ini cocok, jadi harga semua itemnya memang benar.
      items.forEach((i) => trustedKeys.add(i._histKey));
    }
    orders.push({
      row: {
        code, batch_id: String(o['Batch ID'] || ''),
        nama_anak: asText(o['Nama Anak']) || '-',
        kelas: asText(o['Kelas']) || '-',
        nama_ortu: asText(o['Nama Ortu']) || '-',
        catatan: asText(o['Catatan']) === '-' ? null : asText(o['Catatan']),
        status: String(o['Status']).trim() === 'Paid' ? 'Paid' : 'Unpaid',
        created_at: o['Timestamp'] ? new Date(o['Timestamp']).toISOString() : new Date().toISOString(),
      },
      items,
    });
  }

  // Laporan selisih, setelah tahu harga mana saja yang sudah terbukti benar.
  for (const m of mismatched) {
    const dOwner = m.wantOwner - m.gotOwner, dOrg = m.wantOrg - m.gotOrg;
    const lines = [
      `${m.code} (${asDate(m.o['Timestamp']) || '?'}) — hitung ${m.gotOwner}/${m.gotOrg}, ` +
      `sheet ${m.wantOwner}/${m.wantOrg}  [selisih ${dOwner >= 0 ? '+' : ''}${dOwner} vendor, ` +
      `${dOrg >= 0 ? '+' : ''}${dOrg} panitia]`,
    ];
    for (const i of m.items) {
      const tag = trustedKeys.has(i._histKey) ? '  (harga terbukti benar di order lain)' : '';
      lines.push(`    ${i.qty} x ${i.product_name} @ ${i.price_owner}/${i.price_organizer}${tag}`);
    }
    // Kandidat = item yang harganya BELUM terbukti benar di order lain,
    // dan selisihnya habis dibagi jumlahnya.
    const fits = (i) => dOwner % i.qty === 0 && dOrg % i.qty === 0 &&
                        i.price_owner + dOwner / i.qty >= 0 && i.price_organizer + dOrg / i.qty >= 0;
    const suspects = m.items.filter((i) => fits(i) && !trustedKeys.has(i._histKey));
    const line = (c) => `      '${c._histKey}': { price_owner: ${c.price_owner + dOwner / c.qty}, ` +
                        `price_organizer: ${c.price_organizer + dOrg / c.qty} },`;
    lines.push('');
    if (suspects.length === 1) {
      lines.push(`    Penyebabnya "${suspects[0].product_name}" — harganya pernah diubah setelah order ini masuk.`);
      lines.push('    Tambahkan baris ini di HISTORICAL_PRICES (bagian atas file):');
      lines.push(line(suspects[0]));
    } else if (suspects.length > 1) {
      lines.push('    Beberapa kemungkinan penyebab. Pilih yang harganya memang pernah Anda ubah:');
      suspects.forEach((c) => lines.push(`    ${c.product_name}:\n${line(c)}`));
    } else {
      lines.push('    Tidak ada satu produk pun yang bisa menjelaskan selisih ini sendirian.');
      lines.push('    Kemungkinan ada lebih dari satu harga yang berubah, atau angka di sheet salah ketik.');
    }
    problems.push(lines.join('\n  '));
  }

  if (problems.length) {
    log(`\n  BERHENTI — ${problems.length} order tidak cocok. Tidak ada data yang ditulis.\n`);
    problems.forEach((p) => log('  ! ' + p + '\n'));
    log('  Harga di master produk TIDAK perlu diubah. Daftarkan harga lamanya');
    log('  di HISTORICAL_PRICES, lalu jalankan --dry-run lagi.');
    process.exit(1);
  }
  log(`     ${orders.length} order cocok semua, selisih Rp 0.`);

  const badBatch = orders.filter((o) => !batches.some((b) => b.id === o.row.batch_id));
  if (badBatch.length) throw new Error(`Order dengan batch tak dikenal: ${badBatch.map((o) => o.row.code).join(', ')}`);

  if (DRY) {
    log('\nDRY-RUN selesai. Semua pemeriksaan lolos, tidak ada yang ditulis.');
    return;
  }

  // --- login --------------------------------------------------------------
  log('\n3/7  Login sebagai ' + ADMIN_EMAIL);
  const pw = await askPassword('     Password admin: ');
  const sb = createClient(SUPABASE_URL, PUBLISHABLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { error: authErr } = await sb.auth.signInWithPassword({ email: ADMIN_EMAIL, password: pw });
  if (authErr) throw new Error('Login gagal: ' + authErr.message);
  log('     Berhasil.');

  const push = async (table, rows, conflict = 'id') => {
    if (!rows.length) return;
    for (let i = 0; i < rows.length; i += 200) {
      const { error } = await sb.from(table).upsert(rows.slice(i, i + 200), { onConflict: conflict });
      if (error) throw new Error(`${table}: ${error.message}`);
    }
    log(`     ${table}: ${rows.length} baris`);
  };

  // --- master -------------------------------------------------------------
  log('4/7  Menulis master...');
  await push('tenants', tenants);
  await push('classes', classes);
  await push('batches', batches);
  await push('products', products.map(({ _image, _imageUrlPlain, variants, ...p }) => p));

  // --- varian -------------------------------------------------------------
  const variantRows = [];
  for (const p of products) {
    p.variants.forEach((v, i) => variantRows.push({
      product_id: p.id, name: String(v.name),
      price_owner: asInt(v.priceOwner), price_organizer: asInt(v.priceOrganizer),
      sort_order: i,
    }));
  }
  await push('product_variants', variantRows, 'product_id,name');

  // --- gambar -------------------------------------------------------------
  log('5/7  Memindahkan gambar ke Storage...');
  let uploaded = 0, skipped = 0;
  for (const p of products) {
    if (p._imageUrlPlain) { skipped++; continue; }
    if (!p._image) { skipped++; continue; }
    const m = p._image.match(/^data:([^;]+);base64,(.*)$/s);
    if (!m) { skipped++; continue; }
    const ext = (m[1].split('/')[1] || 'jpg').replace('jpeg', 'jpg');
    const path = `${p.id}.${ext}`;
    const { error } = await sb.storage.from(BUCKET)
      .upload(path, Buffer.from(m[2], 'base64'), { contentType: m[1], upsert: true });
    if (error) { warn(`${p.name}: ${error.message}`); continue; }
    const { data } = sb.storage.from(BUCKET).getPublicUrl(path);
    const { error: uErr } = await sb.from('products').update({ image_url: data.publicUrl }).eq('id', p.id);
    if (uErr) { warn(`${p.name}: ${uErr.message}`); continue; }
    uploaded++;
    if (uploaded % 10 === 0) log(`     ${uploaded} gambar...`);
  }
  log(`     ${uploaded} gambar diunggah, ${skipped} dilewati.`);

  // --- order --------------------------------------------------------------
  log('6/7  Menulis order...');
  const { data: vRows, error: vErr } = await sb.from('product_variants').select('id,product_id,name');
  if (vErr) throw new Error('baca varian: ' + vErr.message);
  const vKey = (pid, name) => `${pid}||${String(name).toLowerCase()}`;
  const vMap = new Map(vRows.map((v) => [vKey(v.product_id, v.name), v.id]));

  let written = 0;
  for (const o of orders) {
    const { data: or, error: oErr } = await sb.from('orders')
      .upsert(o.row, { onConflict: 'code' }).select('id').single();
    if (oErr) throw new Error(`order ${o.row.code}: ${oErr.message}`);
    await sb.from('order_items').delete().eq('order_id', or.id);
    const rows = o.items.map((i) => ({
      order_id: or.id, product_id: i.product_id,
      variant_id: i.variantName ? vMap.get(vKey(i.product_id, i.variantName)) ?? null : null,
      product_name: i.product_name, tenant_id: i.tenant_id,
      qty: i.qty, price_owner: i.price_owner, price_organizer: i.price_organizer,
    }));
    const { error: iErr } = await sb.from('order_items').insert(rows);
    if (iErr) throw new Error(`item ${o.row.code}: ${iErr.message}`);
    written++;
  }
  log(`     ${written} order ditulis.`);

  // --- verifikasi ---------------------------------------------------------
  log('7/7  Verifikasi dari Supabase...');
  const { data: recap, error: rErr } = await sb.from('v_tenant_recap')
    .select('tenant_name,total_qty,hak_vendor,hak_panitia,total_tagihan');
  if (rErr) throw new Error('rekap: ' + rErr.message);

  const sumSheet = D.orders.reduce((a, o) => {
    a.owner += asInt(o['Hak Vendor']); a.org += asInt(o['Hak Panitia']); return a;
  }, { owner: 0, org: 0 });
  const sumDb = recap.reduce((a, r) => {
    a.owner += Number(r.hak_vendor); a.org += Number(r.hak_panitia); return a;
  }, { owner: 0, org: 0 });

  const rp = (n) => 'Rp ' + n.toLocaleString('id-ID');
  log(`     Sheets  : vendor ${rp(sumSheet.owner)} | panitia ${rp(sumSheet.org)}`);
  log(`     Supabase: vendor ${rp(sumDb.owner)} | panitia ${rp(sumDb.org)}`);

  if (sumSheet.owner !== sumDb.owner || sumSheet.org !== sumDb.org) {
    log('\n  GAGAL — angka tidak cocok. Periksa sebelum melanjutkan ke Fase 3.');
    process.exit(1);
  }

  log('\nSELESAI. Angka cocok persis, selisih Rp 0.');
  log('Tenant dengan rekap Rp 0 (harusnya kosong): ' +
      (recap.filter((r) => Number(r.total_tagihan) === 0).map((r) => r.tenant_name).join(', ') || 'tidak ada'));
}

// Hanya jalan kalau dieksekusi langsung, supaya fungsinya bisa diuji terpisah.
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('migrate.js')) {
  main().catch((e) => { console.error('\nGAGAL:', e.message); process.exit(1); });
}
