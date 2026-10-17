/**
 * ============================================================================
 *  BAZAAR DANUS PTA LITTLE DARBI — Google Apps Script Backend
 * ============================================================================
 *  Cara pasang:
 *    1. Buka spreadsheet > Extensions > Apps Script
 *    2. Hapus seluruh isi Code.gs, ganti dengan file ini
 *    3. Deploy > Manage deployments > (ikon pensil) > Version: New version > Deploy
 *       PENTING: pakai "Manage deployments", JANGAN "New deployment",
 *       supaya URL /exec tetap sama dan tidak perlu ubah app.
 *
 *  Yang diperbaiki dibanding versi lama:
 *    - checkout: baris ditulis MENGIKUTI HEADER, bukan urutan key payload.
 *      Ini penyebab order terakhir bergeser kolom (Nama Anak berisi tanggal,
 *      Kelas berisi JSON customer, dst).
 *    - syncAll Products: kolom `variants` dijamin selalu ada dan ditulis
 *      sebagai JSON string. Header tidak bisa hilang lagi.
 *    - syncAll menolak payload kosong/rusak, supaya sheet tidak tertimpa habis.
 * ============================================================================
 */

var SS = SpreadsheetApp.getActiveSpreadsheet();

/** Header baku tiap sheet. Ini yang menentukan urutan kolom, bukan payload. */
var SCHEMA = {
  Products: ['id', 'tenantId', 'name', 'priceOwner', 'priceOrganizer', 'description',
             'category', 'imageUrl', 'available', 'variants'],
  Tenants:  ['id', 'name', 'owner', 'phone'],
  Batches:  ['id', 'name', 'startDate', 'endDate', 'readyDate', 'isActive', 'description'],
  Classes:  ['id', 'name', 'phone'],
  Orders:   ['Timestamp', 'Order ID', 'Batch ID', 'Nama Anak', 'Kelas', 'Nama Ortu',
             'Catatan', 'Total Tagihan', 'Hak Vendor', 'Hak Panitia', 'Status', 'Rincian Items'],
  Settings: ['key', 'value']
};

function getSheet_(name) {
  var sh = SS.getSheetByName(name);
  if (!sh) {
    sh = SS.insertSheet(name);
    sh.getRange(1, 1, 1, SCHEMA[name].length).setValues([SCHEMA[name]]);
  }
  return sh;
}

/** Pastikan baris header persis sesuai SCHEMA (menambal kolom yang hilang). */
function ensureHeader_(sh, name) {
  var want = SCHEMA[name];
  var lastCol = Math.max(sh.getLastColumn(), want.length);
  var cur = sh.getRange(1, 1, 1, lastCol).getValues()[0];
  var same = true;
  for (var i = 0; i < want.length; i++) {
    if (String(cur[i] || '').trim() !== want[i]) { same = false; break; }
  }
  if (!same) sh.getRange(1, 1, 1, want.length).setValues([want]);
  return want;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/** Baca sheet jadi array of object, memakai baris 1 sebagai nama field. */
function readSheet_(name) {
  var sh = SS.getSheetByName(name);
  if (!sh) return [];
  var values = sh.getDataRange().getValues();
  if (values.length < 2) return [];
  var head = values[0];
  var out = [];
  for (var r = 1; r < values.length; r++) {
    var row = values[r];
    var blank = true;
    for (var c = 0; c < row.length; c++) { if (row[c] !== '' && row[c] !== null) { blank = false; break; } }
    if (blank) continue;
    var o = {};
    for (var c2 = 0; c2 < head.length; c2++) {
      var key = String(head[c2] || '').trim();
      if (!key) continue;
      var v = row[c2];
      if (v instanceof Date) v = Utilities.formatDate(v, SS.getSpreadsheetTimeZone(), 'yyyy-MM-dd');
      o[key] = v;
    }
    out.push(o);
  }
  return out;
}

// ---------------------------------------------------------------- GET --------
function doGet(e) {
  try {
    var settings = {};
    readSheet_('Settings').forEach(function (row) { settings[row.key] = row.value; });

    return json_({
      status: 'success',
      data: {
        products: readSheet_('Products'),
        tenants:  readSheet_('Tenants'),
        batches:  readSheet_('Batches'),
        classes:  readSheet_('Classes'),
        orders:   readSheet_('Orders'),
        settings: settings
      }
    });
  } catch (err) {
    return json_({ status: 'error', message: String(err) });
  }
}

// --------------------------------------------------------------- POST --------
function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000);
    var data = JSON.parse(e.postData.contents);

    switch (data.action) {
      case 'checkout':          return handleCheckout_(data);
      case 'syncAll':           return handleSyncAll_(data);
      case 'updateOrderStatus': return handleUpdateStatus_(data);
      case 'deleteOrder':       return handleDeleteOrder_(data);
      default:                  return json_({ status: 'error', message: 'Aksi tidak dikenal: ' + data.action });
    }
  } catch (err) {
    return json_({ status: 'error', message: String(err) });
  } finally {
    try { lock.releaseLock(); } catch (ignore) {}
  }
}

/**
 * PERBAIKAN UTAMA.
 * Baris disusun eksplisit per kolom header, jadi urutan key di payload
 * tidak lagi menentukan penempatan data.
 */
function handleCheckout_(data) {
  var sh = getSheet_('Orders');
  ensureHeader_(sh, 'Orders');

  var cust = data.customer || {};

  // Kalau app tidak mengirim formattedItemsText, rakit sendiri dari items.
  var rincian = data.formattedItemsText;
  if (!rincian && Array.isArray(data.items)) {
    rincian = data.items.map(function (it) {
      return String(it.name || '').replace(/\(x\s*\d+\)/gi, '').trim() + ' (x' + (it.qty || 1) + ')';
    }).join(', ');
  }

  sh.appendRow([
    data.date || new Date().toISOString(),   // Timestamp
    data.orderId || '',                      // Order ID
    data.batchId || '',                      // Batch ID
    cust.namaAnak || '',                     // Nama Anak
    cust.kelas || '',                        // Kelas
    cust.namaOrtu || '',                     // Nama Ortu
    cust.catatan || '-',                     // Catatan
    Number(data.totalAmount) || 0,           // Total Tagihan
    Number(data.totalOwnerShare) || 0,       // Hak Vendor
    Number(data.totalOrganizerShare) || 0,   // Hak Panitia
    data.status || 'Unpaid',                 // Status
    rincian || ''                            // Rincian Items
  ]);

  return json_({ status: 'success', orderId: data.orderId });
}

/** Tulis ulang satu sheet master mengikuti SCHEMA. */
function writeMaster_(name, list) {
  if (!Array.isArray(list)) return;              // field tidak dikirim -> jangan disentuh
  if (list.length === 0) return;                 // penjaga: jangan kosongkan sheet

  var sh = getSheet_(name);
  var head = SCHEMA[name];

  var rows = list.map(function (obj) {
    return head.map(function (key) {
      var v = obj[key];
      if (key === 'variants') {
        // Selalu JSON string. Ini yang dulu hilang dan bikin rekap jadi 0.
        if (v === null || v === undefined || v === '') return '[]';
        if (typeof v === 'string') return v;
        try { return JSON.stringify(v); } catch (err) { return '[]'; }
      }
      if (v === null || v === undefined) return '';
      if (typeof v === 'object') { try { return JSON.stringify(v); } catch (err) { return ''; } }
      return v;
    });
  });

  sh.clear();
  sh.getRange(1, 1, 1, head.length).setValues([head]);
  sh.getRange(2, 1, rows.length, head.length).setValues(rows);
}

function handleSyncAll_(data) {
  // Penjaga: tolak payload produk yang jelas rusak, daripada menimpa sheet.
  if (data.products !== undefined) {
    if (!Array.isArray(data.products) || data.products.length === 0) {
      return json_({ status: 'error', message: 'Payload products kosong/tidak valid — sync dibatalkan.' });
    }
  }

  writeMaster_('Products', data.products);
  writeMaster_('Tenants',  data.tenants);
  writeMaster_('Batches',  data.batches);
  writeMaster_('Classes',  data.classes);

  if (data.settings && typeof data.settings === 'object') {
    var sh = getSheet_('Settings');
    ensureHeader_(sh, 'Settings');
    var vals = sh.getDataRange().getValues();
    Object.keys(data.settings).forEach(function (k) {
      var val = data.settings[k];
      if (typeof val === 'object') { try { val = JSON.stringify(val); } catch (err) { val = ''; } }
      var found = -1;
      for (var r = 1; r < vals.length; r++) { if (String(vals[r][0]) === k) { found = r + 1; break; } }
      if (found > 0) sh.getRange(found, 2).setValue(val);
      else sh.appendRow([k, val]);
    });
  }

  return json_({ status: 'success' });
}

function findOrderRow_(sh, orderId) {
  var ids = sh.getRange(1, 2, sh.getLastRow(), 1).getValues();  // kolom B = Order ID
  for (var r = 1; r < ids.length; r++) {
    if (String(ids[r][0]).trim() === String(orderId).trim()) return r + 1;
  }
  return -1;
}

function handleUpdateStatus_(data) {
  var sh = getSheet_('Orders');
  var row = findOrderRow_(sh, data.orderId);
  if (row < 0) return json_({ status: 'error', message: 'Order tidak ditemukan: ' + data.orderId });
  sh.getRange(row, 11).setValue(data.status);   // kolom K = Status
  return json_({ status: 'success' });
}

function handleDeleteOrder_(data) {
  var sh = getSheet_('Orders');
  var row = findOrderRow_(sh, data.orderId);
  if (row < 0) return json_({ status: 'error', message: 'Order tidak ditemukan: ' + data.orderId });
  sh.deleteRow(row);
  return json_({ status: 'success' });
}

/**
 * Jalankan SEKALI dari editor Apps Script (pilih fungsi ini > Run) untuk
 * merapikan header semua sheet tanpa menyentuh data.
 */
function perbaikiHeader() {
  Object.keys(SCHEMA).forEach(function (name) {
    var sh = SS.getSheetByName(name);
    if (sh) ensureHeader_(sh, name);
  });
}
