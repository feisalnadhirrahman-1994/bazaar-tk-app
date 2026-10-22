import React, { useState, useEffect, useMemo, useRef, Fragment } from 'react';
import { 
  ShoppingBag, 
  ShoppingCart, 
  Plus, 
  Trash2, 
  Edit3, 
  CheckCircle2, 
  MessageCircle, 
  Store, 
  Settings, 
  Search, 
  FileSpreadsheet, 
  X, 
  Send,
  User,
  School,
  Lock,
  Phone,
  Image as ImageIcon,
  AlertCircle,
  RefreshCw,
  Layers,
  Printer,
  Save,
  Share2,
  Menu,
  List,
  Filter,
  RotateCcw,
  Clock,
  Download,
  FileText
} from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

// ============================================================================
//  SUPABASE — satu-satunya sumber data sejak 17 Oktober 2026.
//  Google Sheets + Apps Script sudah dipensiunkan; sheet lama jadi arsip.
//  Publishable key memang dipakai di browser dan aman dibagikan: yang
//  menjaga data adalah Row Level Security di sisi database, bukan kunci ini.
// ============================================================================
const SUPABASE_URL = 'https://gpxkbtdyyblsirkqmyss.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_E5E8YHYwjI5ycpfgReTXDw_x-tRvwWo';
const IMAGE_BUCKET = 'product-images';

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

// Sisa cache localStorage dari era spreadsheet. Dibersihkan sekali supaya
// tidak ada data basi (termasuk password admin lama) yang tertinggal di
// browser panitia maupun orang tua.
const purgeLegacyCache = () => {
  ['ld_bazaar_products', 'ld_bazaar_tenants', 'ld_bazaar_batches',
   'ld_bazaar_orders', 'ld_bazaar_classes', 'ld_bazaar_admin_auth',
   'ld_bazaar_sheet_webhook'].forEach((k) => {
    try { localStorage.removeItem(k); } catch (e) { /* abaikan */ }
  });
};

const PREDEFINED_CATEGORIES = [
  "Makanan Siap Saji",
  "Minuman",
  "Frozen Food",
  "Lauk Pauk & Frozen",
  "Roti & Kue",
  "Snack & Cemilan",
  "Kesehatan & Kecantikan"
];

const formatIndoDate = (dateStr) => {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    if (isNaN(d)) return dateStr;
    return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch (e) {
    return dateStr;
  }
};


// ============================================================================
// PENULIS XLSX MINIMAL (ZIP store-only) — tanpa dependency tambahan.
// Dipakai untuk fitur "Export Excel" di menu Semua Pesanan.
// ============================================================================
// ---- Penulis XLSX minimal (ZIP store-only). Tanpa dependency. ----
const crcTable = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; }
  return t;
})();
const crc32 = (buf) => { let c = 0xFFFFFFFF; for (let i = 0; i < buf.length; i++) c = crcTable[(c ^ buf[i]) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; };
const enc = (s) => new TextEncoder().encode(s);
const esc = (s) => String(s).replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[m]))
                            .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '');
const colName = (n) => { let s = ''; while (n > 0) { const r = (n - 1) % 26; s = String.fromCharCode(65 + r) + s; n = Math.floor((n - 1) / 26); } return s; };

function zip(files) {
  const chunks = [], central = []; let offset = 0;
  const u16 = (v) => [v & 255, (v >> 8) & 255];
  const u32 = (v) => [v & 255, (v >> 8) & 255, (v >> 16) & 255, (v >>> 24) & 255];
  for (const f of files) {
    const data = enc(f.data), crc = crc32(data);
    const nameB = enc(f.name);
    const local = new Uint8Array([...u32(0x04034b50), ...u16(20), ...u16(0), ...u16(0), ...u16(0), ...u16(0),
      ...u32(crc), ...u32(data.length), ...u32(data.length), ...u16(nameB.length), ...u16(0)]);
    chunks.push(local, nameB, data);
    central.push(new Uint8Array([...u32(0x02014b50), ...u16(20), ...u16(20), ...u16(0), ...u16(0), ...u16(0), ...u16(0),
      ...u32(crc), ...u32(data.length), ...u32(data.length), ...u16(nameB.length), ...u16(0), ...u16(0), ...u16(0), ...u16(0), ...u32(0), ...u32(offset)]), nameB);
    offset += local.length + nameB.length + data.length;
  }
  const cdStart = offset; let cdLen = 0;
  for (const c of central) cdLen += c.length;
  const end = new Uint8Array([...u32(0x06054b50), ...u16(0), ...u16(0), ...u16(files.length), ...u16(files.length), ...u32(cdLen), ...u32(cdStart), ...u16(0)]);
  const all = [...chunks, ...central, end];
  let total = 0; for (const a of all) total += a.length;
  const out = new Uint8Array(total); let p = 0;
  for (const a of all) { out.set(a, p); p += a.length; }
  return out;
}

const buildXlsx = function(sheetName, rows, colWidths) {
  const body = rows.map((row, ri) => {
    const cells = row.map((v, ci) => {
      const ref = colName(ci + 1) + (ri + 1);
      if (v === null || v === undefined || v === '') return '';
      if (typeof v === 'number' && isFinite(v)) return `<c r="${ref}" s="${ri === 0 ? 1 : 0}"><v>${v}</v></c>`;
      return `<c r="${ref}" s="${ri === 0 ? 1 : 0}" t="inlineStr"><is><t xml:space="preserve">${esc(v)}</t></is></c>`;
    }).join('');
    return `<row r="${ri + 1}">${cells}</row>`;
  }).join('');
  const cols = (colWidths || []).map((w, i) => `<col min="${i + 1}" max="${i + 1}" width="${w}" customWidth="1"/>`).join('');
  const sheet = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>${cols ? `<cols>${cols}</cols>` : ''}<sheetData>${body}</sheetData></worksheet>`;
  const styles = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="2"><font><sz val="10"/><name val="Arial"/></font><font><b/><sz val="10"/><color rgb="FFFFFFFF"/><name val="Arial"/></font></fonts><fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF2F5597"/><bgColor indexed="64"/></patternFill></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="2"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"/></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>`;
  return zip([
    { name: '[Content_Types].xml', data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>` },
    { name: '_rels/.rels', data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>` },
    { name: 'xl/workbook.xml', data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="${esc(sheetName).slice(0, 31)}" sheetId="1" r:id="rId1"/></sheets></workbook>` },
    { name: 'xl/_rels/workbook.xml.rels', data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>` },
    { name: 'xl/styles.xml', data: styles },
    { name: 'xl/worksheets/sheet1.xml', data: sheet },
  ]);
};

const downloadBlob = (bytes, filename, mime) => {
  const blob = new Blob([bytes], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

// Cek apakah suatu tanggal (YYYY-MM-DD) sudah lewat, dibandingkan tanggal lokal hari ini.
const toDateOnly = (v) => {
  if (!v) return null;
  const s = String(v).slice(0, 10);
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) { const d = new Date(v); return isNaN(d) ? null : new Date(d.getFullYear(), d.getMonth(), d.getDate()); }
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
};

// Status periode batch: 'before' | 'open' | 'closed'
const getBatchWindow = (batch) => {
  if (!batch) return 'closed';
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const start = toDateOnly(batch.startDate);
  const end = toDateOnly(batch.endDate);
  if (start && today < start) return 'before';
  if (end && today > end) return 'closed';   // toleransi sampai akhir hari tanggal berakhir
  return 'open';
};

const formatRupiah = (num) => {
  const validNum = Number(num) || 0;
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(validNum);
};

const parseAndCleanItem = (rawName) => {
  if (!rawName) return '';
  return String(rawName).replace(/\(x\s*\d+\)/gi, '').trim();
};

// --- FIX: normalisasi variants -----------------------------------------------
// Selalu kembalikan ARRAY, apapun bentuk inputnya (array / JSON string / null).
const normalizeVariants = (raw) => {
  if (Array.isArray(raw)) return raw;
  if (typeof raw === 'string') {
    const s = raw.trim();
    if (!s) return [];
    try {
      const parsed = JSON.parse(s);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.warn('Gagal parse variants:', s, e);
      return [];
    }
  }
  return [];
};



/**
 * Isian stok dari form ke nilai database.
 * Kosong -> null, artinya TIDAK DIBATASI. Angka 0 tetap 0, artinya habis.
 * Keduanya tidak boleh tertukar: null membuat kasir bebas menjual, 0 memblokir.
 */
const stokKeDb = (v) => {
  if (v === '' || v === null || v === undefined) return null;
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : null;
};

/** Teks sisa stok yang dipakai di kasir dan daftar produk offline. */
const labelStok = (s) => {
  if (s === null || s === undefined) return 'Tidak dibatasi';
  return s === 0 ? 'Habis' : `${s} sisa`;
};

const warnaStok = (s) => {
  if (s === null || s === undefined) return 'bg-slate-100 text-slate-500';
  if (s === 0) return 'bg-red-100 text-red-700';
  return s <= 3 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-50 text-emerald-700';
};

/**
 * Satu baris stok di daftar Produk Offline, lengkap dengan tombol cepat.
 * Tombolnya sengaja besar-besar relatif ke barisnya: dipakai sambil berdiri
 * di meja kasir, bukan sambil duduk di depan laptop.
 */
function BarisStok({ nama, stok, onGeser }) {
  const tbl = 'px-1.5 py-0.5 rounded font-bold border transition-colors disabled:opacity-40';
  return (
    <div className="flex items-center gap-1.5 text-[9px]">
      <span className="text-slate-500 truncate max-w-[72px]" title={nama}>{nama}</span>
      <span className={`px-1.5 py-0.5 rounded font-bold shrink-0 ${warnaStok(stok)}`}>{labelStok(stok)}</span>
      {stok !== null && (
        <span className="flex gap-1 ml-auto shrink-0">
          <button type="button" onClick={() => onGeser(-1)} disabled={stok === 0}
            className={`${tbl} bg-white border-slate-200 text-slate-600 hover:bg-slate-100`}>&minus;1</button>
          <button type="button" onClick={() => onGeser(5)}
            className={`${tbl} bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100`}>+5</button>
          <button type="button" onClick={() => onGeser(10)}
            className={`${tbl} bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100`}>+10</button>
        </span>
      )}
    </div>
  );
}

/**
 * Menu panel admin, dikelompokkan per kategori.
 *
 * Dulu kesepuluh menu ini berjajar sebagai tab horizontal, dan sejak menu
 * Kasir + Pendaftaran masuk, barisnya tidak muat lagi: muncul scrollbar
 * mendatar dan menu paling kiri terpotong. Daftar bergrup jauh lebih tahan
 * ditambah menu baru daripada satu baris yang memanjang terus.
 */
const MENU_ADMIN = [
  {
    label: 'Laporan',
    items: [
      { id: 'batch_reports', nama: 'Rekap Per Tenant' },
      { id: 'orders', nama: 'Semua Pesanan' },
    ],
  },
  {
    label: 'Produk',
    items: [
      { id: 'products', nama: 'Produk Online' },
      { id: 'products_offline', nama: 'Produk Offline' },
      { id: 'submissions', nama: 'Pendaftaran', badge: 'pendaftaran' },
    ],
  },
  {
    label: 'Pengaturan',
    items: [
      { id: 'batches', nama: 'Kelola Batch' },
      { id: 'tenants', nama: 'Kelola Stand' },
      { id: 'classes', nama: 'Routing WA Kelas' },
    ],
  },
];

const IKON_MENU = {
  batch_reports: FileSpreadsheet,
  orders: List,
  kasir: ShoppingCart,
  products: ShoppingBag,
  products_offline: Layers,
  submissions: FileText,
  batches: Clock,
  tenants: Store,
  classes: School,
};

const semuaMenuAdmin = () => [
  { id: 'kasir', nama: 'Kasir Offline' },
  ...MENU_ADMIN.flatMap((g) => g.items),
];

/** Nilai khusus di pilihan stand: "buat stand baru sesuai usulan penjual". */
const STAND_BARU = '__stand_baru__';

const KELIPATAN_BULAT = 500;

/**
 * Margin panitia menurut aturan: harga jual = nett + 10%, lalu TOTALNYA
 * dibulatkan ke atas ke kelipatan Rp 500. Selisihnya masuk margin.
 *
 *   nett 19.000 -> 20.900 -> 21.000  => margin 2.000
 *   nett 21.000 -> 23.100 -> 23.500  => margin 2.500
 *   nett  9.900 -> 10.890 -> 11.000  => margin 1.100
 *   nett 35.000 -> 38.500            => margin 3.500 (sudah kelipatan 500)
 *
 * Karena pembulatannya ke atas, marginnya bisa sedikit melebihi 10%.
 */
const saranMargin = (nett) => {
  const n = Math.max(0, Math.floor(Number(nett) || 0));
  if (n === 0) return 0;
  const total = Math.ceil((n * 1.1) / KELIPATAN_BULAT) * KELIPATAN_BULAT;
  return total - n;
};

const LABEL_KANAL = {
  online: 'Etalase Online',
  offline: 'Bazaar Offline (Kasir)',
};

const INITIAL_TENANTS = [{ id: 't1', name: 'Stand Snack', description: 'Menjual aneka cemilan ringan', phone: '628123456789' }];
const INITIAL_PRODUCTS = [{ id: 'p1', tenantId: 't1', name: 'Produk A', priceOwner: 5000, priceOrganizer: 1000, category: 'Makanan Siap Saji', imageUrl: '', available: true, description: '', variants: [] }];
const INITIAL_BATCHES = [{ id: 'b1', name: 'Batch 1', startDate: '2026-08-01', endDate: '2026-08-31', readyDate: '2026-09-01', isActive: true, description: '' }];
const INITIAL_CLASSES = [{ id: 'c1', name: 'Little Owl', phone: '628123456781' }];

function LittleDarbiLogo({ className = "w-10 h-10" }) {
  return (
    <svg className={className} viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="200" cy="200" r="190" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="8"/>
      <path d="M 200,108 C 240,150 260,200 230,240 C 200,250 200,250 170,240 C 140,200 160,150 200,108 Z" fill="#FFFFFF" stroke="#007A37" strokeWidth="8" strokeLinejoin="round"/>
      <circle cx="200" cy="180" r="28" fill="#F58220" />
      <path d="M 160,210 Q 200,195 240,210 L 235,230 Q 200,218 165,230 Z" fill="#FFC20E" />
      <g id="boy">
        <circle cx="125" cy="115" r="22" fill="#FCD3B1" />
        <path d="M 108,108 Q 125,85 140,110 Q 130,102 108,108 Z" fill="#231F20" />
        <path d="M 110,128 L 72,135 M 140,128 L 160,110" stroke="#231F20" strokeWidth="5" strokeLinecap="round" />
        <circle cx="68" cy="136" r="6" fill="#FCD3B1" stroke="#231F20" strokeWidth="2"/>
        <circle cx="163" cy="108" r="6" fill="#FCD3B1" stroke="#231F20" strokeWidth="2"/>
        <path d="M 105,128 L 145,128 L 160,195 Q 125,215 90,190 Z" fill="#ED1C24" stroke="#231F20" strokeWidth="4" />
      </g>
      <g id="girl">
        <circle cx="275" cy="118" r="20" fill="#FCD3B1" />
        <path d="M 275,88 C 248,88 245,118 250,140 C 260,148 290,148 300,140 C 305,118 302,88 275,88 Z" fill="#00AEEF" stroke="#231F20" strokeWidth="4" />
        <ellipse cx="275" cy="115" rx="16" ry="18" fill="#FCD3B1" />
        <path d="M 260,140 L 220,108 M 290,140 L 328,135" stroke="#231F20" strokeWidth="5" strokeLinecap="round" />
        <circle cx="217" cy="106" r="6" fill="#FCD3B1" stroke="#231F20" strokeWidth="2"/>
        <circle cx="332" cy="136" r="6" fill="#FCD3B1" stroke="#231F20" strokeWidth="2"/>
        <path d="M 250,145 L 300,145 L 315,210 Q 275,225 235,210 Z" fill="#FFF200" stroke="#231F20" strokeWidth="4" />
      </g>
      <path d="M 50,265 Q 200,200 350,265" fill="none" stroke="#231F20" strokeWidth="7" strokeLinecap="round"/>
      <text x="75" y="240" fontWidth="bold" fontSize="42" fontFamily="Arial, sans-serif" fontWeight="900" fill="#3A3A3C" transform="rotate(-15, 75, 240)">l</text>
      <text x="90" y="235" fontWidth="bold" fontSize="42" fontFamily="Arial, sans-serif" fontWeight="900" fill="#ED1C24" transform="rotate(-12, 90, 235)">i</text>
      <text x="102" y="230" fontWidth="bold" fontSize="42" fontFamily="Arial, sans-serif" fontWeight="900" fill="#F58220" transform="rotate(-9, 102, 230)">t</text>
      <text x="118" y="226" fontWidth="bold" fontSize="42" fontFamily="Arial, sans-serif" fontWeight="900" fill="#FFC20E" transform="rotate(-6, 118, 226)">t</text>
      <text x="134" y="223" fontWidth="bold" fontSize="42" fontFamily="Arial, sans-serif" fontWeight="900" fill="#007A37" transform="rotate(-3, 134, 223)">l</text>
      <text x="150" y="221" fontWidth="bold" fontSize="42" fontFamily="Arial, sans-serif" fontWeight="900" fill="#00AEEF" transform="rotate(-1, 150, 221)">e</text>
      <text x="195" y="221" fontWidth="bold" fontSize="46" fontFamily="Arial, sans-serif" fontWeight="900" fill="#007A37" transform="rotate(2, 195, 221)">d</text>
      <text x="225" y="224" fontWidth="bold" fontSize="46" fontFamily="Arial, sans-serif" fontWeight="900" fill="#F58220" transform="rotate(5, 225, 224)">a</text>
      <text x="252" y="228" fontWidth="bold" fontSize="46" fontFamily="Arial, sans-serif" fontWeight="900" fill="#2E3192" transform="rotate(8, 252, 228)">r</text>
      <text x="274" y="233" fontWidth="bold" fontSize="46" fontFamily="Arial, sans-serif" fontWeight="900" fill="#ED1C24" transform="rotate(12, 274, 233)">b</text>
      <text x="302" y="240" fontWidth="bold" fontSize="46" fontFamily="Arial, sans-serif" fontWeight="900" fill="#8C2685" transform="rotate(16, 302, 240)">i</text>
    </svg>
  );
}

export default function App() {
  const [activeTab, setActiveTab] = useState('shop');
  const [adminSubTab, setAdminSubTab] = useState('batch_reports');
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [toastMessage, setToastMessage] = useState('');
  const [isCloudSyncing, setIsCloudSyncing] = useState(true);

  // FIX: kunci pengaman. Selama data cloud belum pernah berhasil ditarik,
  // DILARANG push ke Sheets — inilah penyebab kolom variants terhapus:
  // admin edit produk sebelum sync awal selesai, lalu state localStorage yang
  // basi (tanpa key `variants`) menimpa seluruh sheet Products.
  const cloudLoadedRef = useRef(false);

  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, msg: '', onConfirm: null });
  const [zoomedImage, setZoomedImage] = useState(null);

  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [sortOrder, setSortOrder] = useState('default');
  const [selectedTenantFilter, setSelectedTenantFilter] = useState('all');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('all');

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  const showConfirm = (msg, onConfirm) => {
    setConfirmDialog({ isOpen: true, msg, onConfirm });
  };

  // Data selalu datang dari Supabase. Tidak ada lagi cache localStorage:
  // itulah yang dulu membuat state basi menimpa seluruh sheet.
  const [classesList, setClassesList] = useState(INITIAL_CLASSES);
  const [tenants, setTenants] = useState(INITIAL_TENANTS);
  const [products, setProducts] = useState(INITIAL_PRODUCTS);
  const [batches, setBatches] = useState(INITIAL_BATCHES);
  const [orders, setOrders] = useState([]);

  // --- Pendaftaran produk oleh penjual ------------------------------------
  // Halaman depan hanya boleh tahu pendaftaran buka atau tutup. Kodenya ada
  // di tabel yang tidak bisa dibaca anon dan dicocokkan di server.
  const [pendaftaran, setPendaftaran] = useState({ isOpen: false, batchName: '' });
  const [submissions, setSubmissions] = useState([]);
  const [regSettings, setRegSettings] = useState([]);
  const [reviewModal, setReviewModal] = useState({ isOpen: false, item: null });
  const [orderDetail, setOrderDetail] = useState(null);
  const [tolakModal, setTolakModal] = useState({ isOpen: false, item: null, note: '' });

  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [checkoutData, setCheckoutData] = useState({
    namaAnak: '',
    kelas: classesList[0]?.name || 'TK A1',
    namaOrtu: '',
    catatan: ''
  });
  
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [productModal, setProductModal] = useState({ isOpen: false, item: null });
  const [tenantModal, setTenantModal] = useState({ isOpen: false, item: null });
  const [batchModal, setBatchModal] = useState({ isOpen: false, item: null });
  const [classModal, setClassModal] = useState({ isOpen: false, item: null });
  const [printData, setPrintData] = useState(null);
  
  const [variantModal, setVariantModal] = useState({ isOpen: false, product: null });

  const [reportSelectedBatchId, setReportSelectedBatchId] = useState('');
  const [reportSelectedStatus, setReportSelectedStatus] = useState('Paid');

  // Filter khusus tab "Semua Pesanan". Export Excel & Print PDF mengikuti filter ini.
  const [orderFilterBatchId, setOrderFilterBatchId] = useState('ALL');
  const [orderFilterStatus, setOrderFilterStatus] = useState('ALL');
  const [orderFilterChannel, setOrderFilterChannel] = useState('ALL');
  const [orderSearch, setOrderSearch] = useState('');
  const [printOrders, setPrintOrders] = useState(null);

  // Peserta batch: stand mana yang ikut, dan produk mana yang dikecualikan.
  // batchTenants      : { [batchId]: Set(tenantId) }
  // batchExclusions   : { [batchId]: Set(productId) }
  const [batchTenants, setBatchTenants] = useState({});
  const [batchExclusions, setBatchExclusions] = useState({});
  const [pesertaBatchId, setPesertaBatchId] = useState('');
  const [standTertutup, setStandTertutup] = useState({});

  // --- Kasir bazaar offline -------------------------------------------------
  const [posCart, setPosCart] = useState([]);           // [{key, productId, variantId, name, tenantId, price, qty}]
  const [posBayar, setPosBayar] = useState('Tunai');
  const [posPembeli, setPosPembeli] = useState('');
  const [posSubmitting, setPosSubmitting] = useState(false);
  const [posStruk, setPosStruk] = useState(null);       // hasil transaksi terakhir

  // Bersihkan sisa cache era spreadsheet sekali saat app dibuka.
  useEffect(() => { purgeLegacyCache(); }, []);

  // --- Pemetaan baris Supabase ke bentuk yang sudah dipakai seluruh UI ----
  // Sengaja dipertahankan sama persis dengan bentuk lama, supaya tampilan,
  // rekap, export Excel dan cetak PDF tidak perlu diubah sedikit pun.
  const mapProduct = (p) => ({
    id: p.id, tenantId: p.tenant_id, name: p.name,
    priceOwner: Number(p.price_owner) || 0,
    priceOrganizer: Number(p.price_organizer) || 0,
    description: p.description || '', category: p.category || '',
    imageUrl: p.image_url || '', available: p.available !== false,
    channel: p.channel === 'offline' ? 'offline' : 'online',
    // null sengaja dipertahankan, TIDAK diubah jadi 0: null berarti stoknya
    // tidak dibatasi, 0 berarti habis. Dua hal yang sangat berbeda di kasir.
    stock: p.stock === null || p.stock === undefined ? null : Number(p.stock),
    variants: (p.product_variants || [])
      .slice()
      .sort((x, y) => (x.sort_order ?? 0) - (y.sort_order ?? 0))
      .map((v) => ({
        id: v.id, name: v.name,
        priceOwner: Number(v.price_owner) || 0,
        priceOrganizer: Number(v.price_organizer) || 0,
        stock: v.stock === null || v.stock === undefined ? null : Number(v.stock),
      })),
  });

  const mapSubmission = (s) => ({
    id: s.id, code: s.code, batchId: s.batch_id, status: s.status,
    channel: s.channel === 'offline' ? 'offline' : 'online',
    sellerName: s.seller_name || '', sellerPhone: s.seller_phone || '',
    tenantId: s.tenant_id || '', tenantBaru: s.tenant_baru || '',
    bankName: s.bank_name || '', bankAccount: s.bank_account || '',
    bankAccountName: s.bank_account_name || '',
    name: s.name || '', category: s.category || '', description: s.description || '',
    imageUrl: s.image_url || '',
    priceOwner: Number(s.price_owner) || 0,
    stock: s.stock === null || s.stock === undefined ? null : Number(s.stock),
    variants: normalizeVariants(s.variants).map((v) => ({
      name: v.name,
      priceOwner: Number(v.price_owner ?? v.priceOwner) || 0,
      stock: v.stock === null || v.stock === undefined ? null : Number(v.stock),
    })),
    productId: s.product_id || '', reviewNote: s.review_note || '',
    createdAt: s.created_at, reviewedAt: s.reviewed_at,
  });

  const mapOrder = (o) => ({
    id: o.id, orderId: o.code, batchId: o.batch_id, date: o.created_at,
    status: o.status,
    channel: o.channel === 'offline' ? 'offline' : 'online',
    paymentMethod: o.payment_method || '',
    customer: {
      namaAnak: o.nama_anak, kelas: o.kelas,
      namaOrtu: o.nama_ortu, catatan: o.catatan || '-',
    },
    items: (o.order_items || []).map((i) => ({
      id: i.variant_id ? `${i.product_id}|${i.variant_id}` : i.product_id,
      name: i.product_name, tenantId: i.tenant_id,
      priceOwner: Number(i.price_owner) || 0,
      priceOrganizer: Number(i.price_organizer) || 0,
      qty: Number(i.qty) || 1,
      subtotal: (Number(i.price_owner) + Number(i.price_organizer)) * (Number(i.qty) || 1),
    })),
    totalAmount: (o.order_items || []).reduce(
      (n, i) => n + (Number(i.price_owner) + Number(i.price_organizer)) * (Number(i.qty) || 1), 0),
  });

  /**
   * Tarik katalog dari Supabase. Order ikut ditarik hanya kalau admin login —
   * pembeli memang tidak punya izin membacanya, dan itu disengaja.
   */
  const fetchCloudData = async (silent = false, withOrders = null) => {
    setIsCloudSyncing(true);
    try {
      const wantOrders = withOrders === null ? isAdminLoggedIn : withOrders;

      const [tRes, cRes, bRes, pRes, btRes, beRes] = await Promise.all([
        supabase.from('tenants').select('*').order('sort_order').order('name'),
        supabase.from('classes').select('*').order('name'),
        supabase.from('batches').select('*').order('start_date', { ascending: false }),
        supabase.from('products').select('*, product_variants(*)').order('name'),
        supabase.from('batch_tenants').select('batch_id, tenant_id'),
        supabase.from('batch_product_exclusions').select('batch_id, product_id'),
      ]);

      const firstErr = [tRes, cRes, bRes, pRes, btRes, beRes].find((r) => r.error);
      if (firstErr) throw firstErr.error;

      const bt = {};
      btRes.data.forEach((r) => { (bt[r.batch_id] ||= new Set()).add(r.tenant_id); });
      setBatchTenants(bt);
      const be = {};
      beRes.data.forEach((r) => { (be[r.batch_id] ||= new Set()).add(r.product_id); });
      setBatchExclusions(be);

      setTenants(tRes.data.map((t) => ({
        id: t.id, name: t.name, description: t.owner || '', phone: t.phone || '',
        bankName: t.bank_name || '', bankAccount: t.bank_account || '',
        bankAccountName: t.bank_account_name || '',
        sortOrder: Number.isFinite(t.sort_order) ? t.sort_order : 1000,
      })));
      setClassesList(cRes.data.map((c) => ({ id: c.id, name: c.name, phone: c.phone || '' })));

      const mappedBatches = bRes.data.map((b) => ({
        id: b.id, name: b.name, startDate: b.start_date, endDate: b.end_date,
        readyDate: b.ready_date || '', isActive: !!b.is_active,
        description: b.description || '',
      }));
      setBatches(mappedBatches);
      const act = mappedBatches.find((b) => b.isActive) || mappedBatches[0];
      if (act) {
        setReportSelectedBatchId((prev) => prev || act.id);
        setPesertaBatchId((prev) => prev || act.id);
      }

      setProducts(pRes.data.map(mapProduct));

      if (wantOrders) {
        const { data: oData, error: oErr } = await supabase
          .from('orders').select('*, order_items(*)')
          .order('created_at', { ascending: false });
        if (oErr) throw oErr;
        setOrders(oData.map(mapOrder));

        // Pendaftaran & kodenya hanya bisa dibaca admin yang login. Dua
        // permintaan ini sengaja TIDAK ikut Promise.all di atas: untuk anon
        // keduanya pasti ditolak, dan itu akan menggagalkan seluruh muatan.
        const [sRes, rRes] = await Promise.all([
          supabase.from('product_submissions').select('*').order('created_at', { ascending: false }),
          supabase.from('registration_settings').select('*'),
        ]);
        // Sengaja TIDAK dilempar sebagai kegagalan: kalau supabase-06 belum
        // dijalankan, tabelnya memang belum ada. Panel admin yang lain tidak
        // boleh ikut mati hanya karena satu fitur baru belum dipasang.
        if (sRes.error) console.warn('Pendaftaran belum tersedia:', sRes.error.message);
        if (rRes.error) console.warn('Pengaturan pendaftaran belum tersedia:', rRes.error.message);
        setSubmissions((sRes.data || []).map(mapSubmission));
        setRegSettings((rRes.data || []).map((r) => ({
          batchId: r.batch_id, isOpen: !!r.is_open, code: r.code || '',
        })));
      }

      // Buka/tutup pendaftaran: boleh diketahui siapa pun, kodenya tidak.
      const { data: regData } = await supabase.rpc('registration_status');
      const reg = Array.isArray(regData) ? regData[0] : regData;
      setPendaftaran({ isOpen: !!reg?.is_open, batchName: reg?.batch_name || '' });

      cloudLoadedRef.current = true;
      if (!silent) showToast('Data tersinkronisasi!');
    } catch (e) {
      console.error('Gagal memuat data:', e);
      // Tidak lagi gagal diam-diam seperti era no-cors.
      showToast('Gagal memuat data: ' + (e.message || 'periksa koneksi'));
    } finally {
      setIsCloudSyncing(false);
    }
  };

  // Pulihkan sesi admin yang masih hidup, lalu muat data.
  useEffect(() => {
    let batal = false;
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (batal) return;
      const masuk = !!data?.session;
      setIsAdminLoggedIn(masuk);
      fetchCloudData(true, masuk);
    })();
    return () => { batal = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Pesan error database diterjemahkan ke bahasa yang bisa ditindaklanjuti.
   * Dulu semua kegagalan tulis lewat begitu saja tanpa jejak.
   */
  const jelaskanError = (e) => {
    const m = String(e?.message || e);
    if (/violates foreign key.*products_tenant_id/i.test(m))
      return 'Stand ini masih punya produk. Hapus atau pindahkan produknya dulu.';
    if (/violates foreign key.*orders_batch_id/i.test(m))
      return 'Batch ini sudah punya pesanan, jadi tidak bisa dihapus.';
    if (/duplicate key.*product_variants/i.test(m))
      return 'Ada dua varian dengan nama yang sama. Nama varian harus berbeda.';
    if (/row-level security|permission denied|JWT/i.test(m))
      return 'Sesi admin sudah habis. Silakan login ulang.';
    return m;
  };

  /** Bungkus setiap tulisan: kerjakan, tarik ulang data, lapor hasilnya. */
  const simpan = async (label, fn) => {
    if (!cloudLoadedRef.current) {
      showToast('Data belum termuat. Tunggu sebentar lalu coba lagi.');
      return false;
    }
    try {
      await fn();
      await fetchCloudData(true);
      showToast(label);
      return true;
    } catch (e) {
      console.error(label, e);
      showToast('Gagal: ' + jelaskanError(e));
      return false;
    }
  };

  const lempar = ({ error }) => { if (error) throw error; };

  // --- Produk --------------------------------------------------------------
  /** Apakah sebuah produk tampil di batch tertentu. */
  const produkIkutBatch = (p, batchId) => {
    if (!batchId) return false;
    const ikut = batchTenants[batchId];
    if (!ikut || !ikut.has(p.tenantId)) return false;       // standnya tidak ikut
    return !(batchExclusions[batchId]?.has(p.id));          // produknya tidak dikecualikan
  };

  /** Centang/lepas satu stand dari sebuah batch. */
  const toggleStandBatch = (batchId, tenantId, ikut) =>
    simpan(ikut ? 'Stand ditambahkan ke batch.' : 'Stand dikeluarkan dari batch.', async () => {
      if (ikut) {
        lempar(await supabase.from('batch_tenants')
          .upsert({ batch_id: batchId, tenant_id: tenantId }, { onConflict: 'batch_id,tenant_id' }));
      } else {
        lempar(await supabase.from('batch_tenants')
          .delete().eq('batch_id', batchId).eq('tenant_id', tenantId));
      }
    });

  /** Centang/lepas satu produk di sebuah batch (lewat daftar pengecualian). */
  const toggleProdukBatch = (batchId, productId, ikut) =>
    simpan(ikut ? 'Produk ditampilkan di batch.' : 'Produk disembunyikan di batch.', async () => {
      if (ikut) {
        lempar(await supabase.from('batch_product_exclusions')
          .delete().eq('batch_id', batchId).eq('product_id', productId));
      } else {
        lempar(await supabase.from('batch_product_exclusions')
          .upsert({ batch_id: batchId, product_id: productId }, { onConflict: 'batch_id,product_id' }));
      }
    });

  const saveProduct = (form, existing) => simpan('Produk tersimpan!', async () => {
    const id = existing?.id || 'p-' + Date.now();
    lempar(await supabase.from('products').upsert({
      id,
      tenant_id: form.tenantId,
      name: String(form.name).trim(),
      price_owner: Number(form.priceOwner) || 0,
      price_organizer: Number(form.priceOrganizer) || 0,
      description: form.description?.trim() || null,
      category: form.category || null,
      image_url: form.imageUrl || null,
      available: existing ? existing.available !== false : true,
      channel: form.channel === 'offline' ? 'offline' : 'online',
      stock: stokKeDb(form.stock),
    }));

    const baru = normalizeVariants(form.variants)
      .filter((v) => String(v.name || '').trim() !== '');

    const { data: lama, error: eLama } = await supabase
      .from('product_variants').select('id,name').eq('product_id', id);
    if (eLama) throw eLama;

    const dipakai = new Set(baru.map((v) => String(v.name).trim()));
    const dibuang = (lama || []).filter((v) => !dipakai.has(v.name)).map((v) => v.id);
    if (dibuang.length) lempar(await supabase.from('product_variants').delete().in('id', dibuang));

    if (baru.length) {
      lempar(await supabase.from('product_variants').upsert(
        baru.map((v, i) => ({
          product_id: id, name: String(v.name).trim(),
          price_owner: Number(v.priceOwner) || 0,
          price_organizer: Number(v.priceOrganizer) || 0,
          stock: stokKeDb(v.stock),
          sort_order: i,
        })),
        { onConflict: 'product_id,name' }
      ));
    }
  });

  const deleteProduct = (id) => simpan('Produk dihapus.', async () =>
    lempar(await supabase.from('products').delete().eq('id', id)));

  /**
   * Tambah / kurangi stok langsung dari daftar, tanpa membuka form produk.
   * Dipakai di hari bazaar ketika penjual menambah barang dan tidak ada waktu
   * untuk mengisi form penuh.
   *
   * Nilai baru dihitung dari angka yang baru dibaca dari database, bukan dari
   * state di layar: layar bisa sudah tertinggal beberapa transaksi kasir.
   */
  const geserStok = (jenis, id, delta) => simpan('Stok diperbarui.', async () => {
    const tabel = jenis === 'variant' ? 'product_variants' : 'products';
    const { data, error } = await supabase.from(tabel).select('stock,name').eq('id', id).single();
    if (error) throw error;
    if (data.stock === null) {
      throw new Error(`Stok "${data.name}" belum dibatasi. Isi jumlah stok dulu lewat Edit produk.`);
    }
    const baru = Math.max(0, Number(data.stock) + delta);
    lempar(await supabase.from(tabel).update({ stock: baru }).eq('id', id));
  });

  // --- Pendaftaran produk --------------------------------------------------
  /**
   * Setujui pendaftaran. Satu panggilan RPC, bukan tiga perintah terpisah:
   * membuat produk dan menandai pendaftaran harus terjadi bersama-sama, kalau
   * tidak satu pendaftaran bisa disetujui dua kali dan produknya dobel.
   */
  const approveSubmission = (sub, form) => simpan('Produk disetujui & masuk daftar offline!', async () => {
    const standBaru = form.tenantId === STAND_BARU;
    lempar(await supabase.rpc('approve_submission', {
      p_submission_id: sub.id,
      p_channel: form.channel === 'offline' ? 'offline' : 'online',
      p_tenant_id: standBaru ? null : form.tenantId,
      p_tenant_baru: standBaru ? (sub.tenantBaru || '') : null,
      p_name: String(form.name || '').trim(),
      p_category: form.category || null,
      p_description: form.description || null,
      p_image_url: form.imageUrl || null,
      p_price_owner: Number(form.priceOwner) || 0,
      p_price_organizer: Number(form.priceOrganizer) || 0,
      p_stock: stokKeDb(form.stock),
      p_variants: (form.variants || [])
        .filter((v) => String(v.name || '').trim() !== '')
        .map((v) => ({
          name: String(v.name).trim(),
          price_owner: Number(v.priceOwner) || 0,
          price_organizer: Number(v.priceOrganizer) || 0,
          stock: stokKeDb(v.stock) === null ? null : String(stokKeDb(v.stock)),
        })),
    }));
  });

  const rejectSubmission = (sub, note) => simpan('Pendaftaran ditolak.', async () =>
    lempar(await supabase.rpc('reject_submission', {
      p_submission_id: sub.id, p_note: note || null,
    })));

  const hapusSubmission = (sub) => simpan('Pendaftaran dihapus.', async () =>
    lempar(await supabase.from('product_submissions').delete().eq('id', sub.id)));

  /** Buka / tutup pendaftaran beserta kodenya, per batch. */
  const simpanPendaftaran = (batchId, isOpen, code) => simpan('Pengaturan pendaftaran tersimpan.', async () => {
    const kode = String(code || '').trim().toUpperCase();
    if (isOpen && kode.length < 4) {
      throw new Error('Kode pendaftaran minimal 4 karakter.');
    }
    lempar(await supabase.from('registration_settings').upsert({
      batch_id: batchId, is_open: !!isOpen, code: kode, updated_at: new Date().toISOString(),
    }, { onConflict: 'batch_id' }));
  });

  // --- Stand / tenant ------------------------------------------------------
  const saveTenant = (form, existing) => simpan('Stand tersimpan!', async () =>
    lempar(await supabase.from('tenants').upsert({
      id: existing?.id || 't-' + Date.now(),
      name: String(form.name).trim(),
      owner: form.description?.trim() || null,
      phone: form.phone ? String(form.phone).trim() : null,
      sort_order: existing?.sortOrder ?? (Math.max(0, ...tenants.map((t) => t.sortOrder || 0)) + 10),
      bank_name: form.bankName?.trim() || null,
      bank_account: form.bankAccount ? String(form.bankAccount).trim() : null,
      bank_account_name: form.bankAccountName?.trim() || null,
    })));

  const deleteTenant = (id) => simpan('Stand dihapus.', async () =>
    lempar(await supabase.from('tenants').delete().eq('id', id)));

  /**
   * Geser satu stand naik/turun. Seluruh urutan ditulis ulang sebagai
   * kelipatan 10 supaya tidak ada dua stand yang bernomor sama.
   */
  const moveTenant = (tenantId, arah) => simpan('Urutan stand diperbarui.', async () => {
    const urut = [...tenantsUrut];
    const dari = urut.findIndex((t) => t.id === tenantId);
    const ke = dari + arah;
    if (dari < 0 || ke < 0 || ke >= urut.length) return;
    urut.splice(ke, 0, urut.splice(dari, 1)[0]);
    lempar(await supabase.from('tenants').upsert(
      urut.map((t, i) => ({ id: t.id, name: t.name, sort_order: (i + 1) * 10 }))
    ));
  });

  // --- Batch ---------------------------------------------------------------
  const saveBatch = (form, existing) => simpan('Batch tersimpan!', async () => {
    const id = existing?.id || 'b-' + Date.now();
    // Hanya boleh ada satu batch aktif.
    if (form.isActive) lempar(await supabase.from('batches').update({ is_active: false }).neq('id', id));
    lempar(await supabase.from('batches').upsert({
      id, name: String(form.name).trim(),
      start_date: form.startDate, end_date: form.endDate,
      ready_date: form.readyDate || null,
      is_active: !!form.isActive,
      description: form.description?.trim() || null,
    }));
  });

  // --- Kelas ---------------------------------------------------------------
  const saveClass = (form, existing) => simpan('Kelas tersimpan!', async () =>
    lempar(await supabase.from('classes').upsert({
      id: existing?.id || 'c-' + Date.now(),
      name: String(form.name).trim(),
      phone: form.phone ? String(form.phone).trim() : null,
    })));

  const deleteClass = (id) => simpan('Kelas dihapus.', async () =>
    lempar(await supabase.from('classes').delete().eq('id', id)));

  const activeBatch = useMemo(() => {
    const explicitActive = batches.find((b) => b.isActive);
    if (explicitActive) return explicitActive;
    const todayStr = new Date().toISOString().slice(0, 10);
    return batches.find((b) => todayStr >= b.startDate && todayStr <= b.endDate) || batches[0];
  }, [batches]);

  // FIX: status periode pemesanan. 'before' = belum dibuka, 'open' = jalan,
  // 'closed' = tanggal berakhir sudah lewat. Sebelumnya tidak pernah dicek
  // sehingga pembeli tetap bisa checkout walau batch sudah tutup.
  const batchWindow = useMemo(() => getBatchWindow(activeBatch), [activeBatch]);
  const isOrderingOpen = batchWindow === 'open';

  /**
   * Login lewat Supabase Auth. Password tidak lagi disimpan di database
   * aplikasi maupun dibandingkan di browser — dulu password admin bisa
   * dibaca siapa pun yang membuka endpoint spreadsheet.
   */
  const handleAdminLogin = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    setLoginError('');
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: loginForm.username.trim(),
        password: loginForm.password,
      });
      if (error) {
        setLoginError(/Invalid login/i.test(error.message)
          ? 'Email atau password salah.' : error.message);
        return;
      }
      setIsAdminLoggedIn(true);
      setLoginForm({ username: '', password: '' });
      showToast('Login admin berhasil!');
      fetchCloudData(true, true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAdminLogout = async () => {
    await supabase.auth.signOut();
    setIsAdminLoggedIn(false);
    setOrders([]);          // jangan tinggalkan data pesanan di browser
    setActiveTab('shop');
    showToast('Sudah keluar dari panel admin.');
  };

  const addToCart = (productObj, qty = 1) => {
    // FIX: blokir penambahan ke keranjang di luar periode batch.
    if (!isOrderingOpen) {
      showToast(batchWindow === 'before' ? 'Periode pemesanan belum dibuka.' : 'Periode pemesanan sudah ditutup.');
      return;
    }
    // TIDAK ada batas stok di sini. Pesanan online berjalan sebagai PO:
    // penjual menyiapkan barang setelah periode pesan ditutup, jadi semua
    // pesanan harus bisa masuk. Stok hanya berlaku di kasir offline.
    setCart((prev) => {
      const existing = prev.find((item) => item.id === productObj.id);
      if (existing) {
        return prev.map((item) => item.id === productObj.id ? { ...item, qty: item.qty + qty } : item);
      }
      return [...prev, { ...productObj, qty: qty }];
    });
    showToast('Berhasil ditambah ke keranjang!');
  };

  const updateCartQty = (productId, delta) => {
    setCart((prev) => prev.map((it) => {
      if (it.id === productId) {
        const newQty = it.qty + delta;
        return newQty > 0 ? { ...it, qty: newQty } : null;
      }
      return it;
    }).filter(Boolean));
  };

  const cartSummary = useMemo(() => {
    return cart.reduce(
      (acc, item) => {
        const itemSellingPrice = Number(item.priceOwner) + Number(item.priceOrganizer);
        acc.totalSellingPrice += itemSellingPrice * item.qty;
        acc.totalOwnerPrice += Number(item.priceOwner) * item.qty;
        acc.totalOrganizerPrice += Number(item.priceOrganizer) * item.qty;
        acc.totalItems += item.qty;
        return acc;
      },
      { totalSellingPrice: 0, totalOwnerPrice: 0, totalOrganizerPrice: 0, totalItems: 0 }
    );
  }, [cart]);

  /**
   * Checkout lewat fungsi server create_order().
   *
   * Browser hanya mengirim produk, varian, dan jumlahnya. HARGA DIAMBIL DARI
   * DATABASE, bukan dari sini — sebelumnya nominal dikirim dari browser dan
   * bisa diubah siapa pun lewat developer tools. Periode batch juga dicek
   * ulang di server, bukan hanya di tombol.
   */
  const handleCheckoutSubmit = async (e) => {
    e.preventDefault();
    if (!activeBatch || !checkoutData.namaAnak.trim() || !checkoutData.namaOrtu.trim() || cart.length === 0) return;
    if (isSubmitting) return;

    if (!isOrderingOpen) {
      showToast(batchWindow === 'before'
        ? `Periode ${activeBatch.name} belum dibuka.`
        : `Periode ${activeBatch.name} sudah ditutup (${formatIndoDate(activeBatch.endDate)}).`);
      setIsCheckoutModalOpen(false);
      return;
    }

    setIsSubmitting(true);
    try {
      const itemsPayload = cart.map((item) => {
        const [productId, variantKey] = String(item.id).split('|');
        let variantId = null;
        if (variantKey) {
          variantId = Number(variantKey);
          if (!Number.isFinite(variantId)) {
            // Cadangan: keranjang lama yang masih menyimpan nama varian.
            const prod = products.find((p) => p.id === productId);
            const v = (prod?.variants || []).find(
              (x) => String(x.name).toLowerCase() === String(variantKey).toLowerCase());
            variantId = v?.id ?? null;
          }
          if (variantId === null) {
            throw new Error(`Varian untuk ${item.name} tidak dikenali. Muat ulang halaman lalu coba lagi.`);
          }
        }
        return { product_id: productId, variant_id: variantId, qty: item.qty };
      });

      const { data, error } = await supabase.rpc('create_order', {
        p_batch_id: activeBatch.id,
        p_nama_anak: checkoutData.namaAnak.trim(),
        p_kelas: checkoutData.kelas,
        p_nama_ortu: checkoutData.namaOrtu.trim(),
        p_catatan: checkoutData.catatan?.trim() || null,
        p_items: itemsPayload,
      });

      if (error) {
        // Sekarang kegagalan benar-benar terlihat, tidak lagi lenyap diam-diam.
        showToast('Pesanan gagal: ' + (error.message || 'coba lagi'));
        setIsSubmitting(false);
        return;
      }

      const hasil = Array.isArray(data) ? data[0] : data;
      const newOrderId = hasil?.code;
      const totalTagihan = Number(hasil?.total_tagihan) || cartSummary.totalSellingPrice;

      // Pesan WA disusun dari keranjang, memakai total resmi dari server.
      let waText = `*PEMESANAN BAZAAR DANUS PTA LITTLE DARBI*\n`;
      waText += `Periode: ${activeBatch.name}\n`;
      waText += `-----------------------------------\n`;
      waText += `*No. Pesanan:* ${newOrderId}\n`;
      waText += `*Nama Anak:* ${checkoutData.namaAnak}\n`;
      waText += `*Kelas:* ${checkoutData.kelas}\n`;
      waText += `*Nama Ortu:* ${checkoutData.namaOrtu}\n`;
      if (checkoutData.catatan) waText += `*Catatan:* ${checkoutData.catatan}\n`;
      waText += `*Status:* UNPAID (Belum Lunas)\n`;
      waText += `-----------------------------------\n`;
      waText += `*Rincian Pesanan:*\n`;
      cart.forEach((item, index) => {
        const tenant = tenants.find((t) => t.id === item.tenantId);
        const tenantName = tenant ? tenant.name : 'Stand';
        const itemSubtotal = (Number(item.priceOwner) + Number(item.priceOrganizer)) * item.qty;
        waText += `${index + 1}. *${parseAndCleanItem(item.name)}* (x${item.qty}) - ${formatRupiah(itemSubtotal)}\n   _[${tenantName}]_\n`;
      });
      waText += `-----------------------------------\n`;
      waText += `*TOTAL TAGIHAN: ${formatRupiah(totalTagihan)}*\n`;
      waText += `-----------------------------------\n`;
      waText += `Halo PIC Kelas ${checkoutData.kelas}, mohon instruksi info rekening pembayaran. Terima kasih!`;

      const targetClassObj = classesList.find((c) => c.name === checkoutData.kelas);
      let cleanPhone = String(targetClassObj?.phone || '').replace(/[^0-9]/g, '');
      if (cleanPhone.startsWith('0')) cleanPhone = '62' + cleanPhone.slice(1);

      setCart([]);
      setIsCheckoutModalOpen(false);
      setIsCartOpen(false);
      setCheckoutData({ namaAnak: '', kelas: classesList[0]?.name || 'TK A1', namaOrtu: '', catatan: '' });
      showToast(`Pesanan ${newOrderId} tersimpan!`);
      if (isAdminLoggedIn) fetchCloudData(true, true);

      if (cleanPhone.length > 5) {
        setTimeout(() => {
          window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(waText)}`, '_blank');
        }, 100);
      } else {
        showToast('Pesanan tersimpan, tapi nomor WA kelas tidak valid.');
      }
    } catch (err) {
      console.error('Checkout gagal:', err);
      showToast('Pesanan gagal: ' + (err.message || 'periksa koneksi'));
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Kanal katalog yang sedang ditampilkan. Layar Kasir memakai produk offline,
   * sisanya produk online. Filter, pencarian, dan aturan etalase dipakai
   * bersama supaya kasir tidak perlu belajar tata letak yang berbeda.
   */
  const katalogKanal = (activeTab === 'admin' && adminSubTab === 'kasir') ? 'offline' : 'online';

  // Ganti layar, filter kategori/stand direset — kategori produk offline
  // belum tentu ada di produk online, dan sebaliknya.
  useEffect(() => {
    setSearchQuery('');
    setSelectedCategoryFilter('all');
    setSelectedTenantFilter('all');
    setSortOrder('default');
  }, [katalogKanal]);

  const availableCategories = useMemo(() => {
    const cats = products
      .filter((p) => p.channel === katalogKanal && produkIkutBatch(p, activeBatch?.id))
      .map((p) => p.category).filter((c) => c && c.trim() !== '');
    return [...new Set(cats)].sort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products, activeBatch, batchTenants, batchExclusions, katalogKanal]);

  /**
   * Urutan stand yang dipakai SELURUH app. Diurutkan di sisi app, bukan
   * mengandalkan urutan dari server — kalau keduanya berbeda, tombol panah
   * di Kelola Stand bisa menggeser stand yang salah.
   */
  const tenantsUrut = useMemo(() => [...tenants].sort(
    (a, b) => (a.sortOrder - b.sortOrder) || String(a.name).localeCompare(String(b.name))
  ), [tenants]);

  /**
   * Produk dikelompokkan per stand untuk tab "Produk & Harga".
   * Sebelumnya daftarnya datar, jadi produk baru tenggelam di antara 87 kartu.
   */
  const kelompokkanProduk = (kanal) => tenantsUrut
    .map((tenant) => ({
      tenant,
      items: products
        .filter((p) => p.tenantId === tenant.id && (!kanal || p.channel === kanal))
        .sort((a, b) => String(a.name).localeCompare(String(b.name))),
    }))
    .filter((g) => g.items.length > 0);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const productsByTenant = useMemo(() => kelompokkanProduk('online'), [products, tenantsUrut]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const offlineByTenant  = useMemo(() => kelompokkanProduk('offline'), [products, tenantsUrut]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const semuaByTenant    = useMemo(() => kelompokkanProduk(null), [products, tenantsUrut]);

  /**
   * Kunci produk offline yang sudah ada: "stand|nama". Dipakai untuk menandai
   * produk online yang kembarannya sudah dibuat di kasir, supaya tidak disalin
   * dua kali tanpa sadar.
   */
  /** Jumlah pendaftaran yang belum di-review, untuk angka merah di tab. */
  const jumlahMenunggu = useMemo(
    () => submissions.filter((s) => s.status === 'pending').length,
    [submissions]
  );

  const kunciOffline = useMemo(() => new Set(
    products
      .filter((p) => p.channel === 'offline')
      .map((p) => `${p.tenantId}|${String(p.name || '').trim().toLowerCase()}`)
  ), [products]);

  /** Etalase hanya masuk akal saat katalog ditampilkan utuh. */
  // Memilih urutan A-Z juga mematikan etalase: kalau tidak, tombol itu jadi
  // kendali mati yang kelihatan bisa ditekan tapi tidak mengubah apa pun.
  const modeEtalase = searchQuery.trim() === ''
    && selectedCategoryFilter === 'all'
    && selectedTenantFilter === 'all'
    && sortOrder === 'default';

  /** Produk yang tampil di halaman pembeli, dikelompokkan per stand, ikut urutan stand. */
  const etalase = useMemo(() => {
    return tenantsUrut
      .map((tenant) => ({
        tenant,
        items: products
          .filter((p) => p.tenantId === tenant.id && p.available && p.channel === katalogKanal
                      && produkIkutBatch(p, activeBatch?.id))
          .sort((a, b) => String(a.name).localeCompare(String(b.name))),
      }))
      .filter((g) => g.items.length > 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products, tenantsUrut, activeBatch, batchTenants, batchExclusions, katalogKanal]);

  const filteredProducts = useMemo(() => {
    let result = products.filter((p) => {
      const matchTenant = selectedTenantFilter === 'all' || p.tenantId === selectedTenantFilter;
      const matchCategory = selectedCategoryFilter === 'all' || p.category === selectedCategoryFilter;
      const matchSearch = String(p.name || '').toLowerCase().includes(searchQuery.toLowerCase());
      // Hanya produk dari stand yang ikut batch aktif, dan tidak dikecualikan.
      const ikutBatch = produkIkutBatch(p, activeBatch?.id);
      // Produk offline tidak pernah muncul di halaman pembeli.
      return matchTenant && matchCategory && matchSearch && p.available
             && p.channel === katalogKanal && ikutBatch;
    });

    if (sortOrder === 'az') {
      result.sort((a, b) => String(a.name).localeCompare(String(b.name)));
    } else if (sortOrder === 'za') {
      result.sort((a, b) => String(b.name).localeCompare(String(a.name)));
    }

    return result;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products, selectedTenantFilter, selectedCategoryFilter, searchQuery, sortOrder,
      activeBatch, batchTenants, batchExclusions, katalogKanal]);

  const enrichOrderItems = (ord) => {
    if (!ord || !ord.items || !Array.isArray(ord.items)) return [];
    return ord.items.map(it => {
      if (!it) return null;
      const baseId = it.id ? String(it.id).split('|')[0] : '';
      const dbProduct = products.find(p => p.id === baseId);
      
      if (dbProduct) {
        let pOwner = Number(it.priceOwner) || 0;
        let pOrg = Number(it.priceOrganizer) || 0;
        
        if (pOwner === 0 && pOrg === 0) {
            const variantKey = String(it.id).includes('|') ? String(it.id).split('|')[1] : null;
            const dbVariants = normalizeVariants(dbProduct.variants);   // FIX: tahan bentuk string
            if (variantKey) {
                // Cocokkan lewat id varian, atau namanya untuk data lama.
                const v = dbVariants.find(x => String(x.id) === String(variantKey))
                       || dbVariants.find(x => String(x.name).toLowerCase() === String(variantKey).toLowerCase());
                if (v) { pOwner = Number(v.priceOwner) || 0; pOrg = Number(v.priceOrganizer) || 0; }
            } else {
                pOwner = Number(dbProduct.priceOwner) || 0; pOrg = Number(dbProduct.priceOrganizer) || 0;
            }
        }

        return {
          ...it,
          priceOwner: pOwner,
          priceOrganizer: pOrg,
          subtotal: (pOwner + pOrg) * (it.qty || 1),
          tenantId: dbProduct.tenantId || it.tenantId
        };
      }
      return {
        ...it,
        priceOwner: Number(it.priceOwner) || 0,
        priceOrganizer: Number(it.priceOrganizer) || 0,
        subtotal: (Number(it.priceOwner || 0) + Number(it.priceOrganizer || 0)) * (it.qty || 1)
      };
    }).filter(Boolean);
  };

  // ---- Daftar pesanan sesuai filter tab "Semua Pesanan" -----------------------
  const filteredOrders = useMemo(() => {
    const q = orderSearch.trim().toLowerCase();
    return (Array.isArray(orders) ? orders : []).filter((o) => {
      if (!o || typeof o !== 'object') return false;
      if (orderFilterBatchId !== 'ALL' && o.batchId !== orderFilterBatchId) return false;
      if (orderFilterStatus !== 'ALL' && (o.status || 'Unpaid') !== orderFilterStatus) return false;
      if (orderFilterChannel !== 'ALL' && (o.channel || 'online') !== orderFilterChannel) return false;
      if (!q) return true;
      const c = o.customer || {};
      return [o.orderId, c.namaAnak, c.kelas, c.namaOrtu].some(v => String(v || '').toLowerCase().includes(q));
    });
  }, [orders, orderFilterBatchId, orderFilterStatus, orderFilterChannel, orderSearch]);

  // Ringkasan angka untuk header tab + baris total di export.
  const filteredOrdersSummary = useMemo(() => {
    return filteredOrders.reduce((acc, o) => {
      const items = enrichOrderItems(o);
      const gross = items.reduce((n, it) => n + (Number(it.subtotal) || 0), 0);
      const owner = items.reduce((n, it) => n + (Number(it.priceOwner) || 0) * (Number(it.qty) || 1), 0);
      const org = items.reduce((n, it) => n + (Number(it.priceOrganizer) || 0) * (Number(it.qty) || 1), 0);
      acc.gross += gross; acc.owner += owner; acc.org += org;
      acc.items += items.reduce((n, it) => n + (Number(it.qty) || 1), 0);
      if ((o.status || 'Unpaid') === 'Paid') acc.paid += 1; else acc.unpaid += 1;
      if ((o.channel || 'online') === 'offline') { acc.offline += 1; acc.grossOffline += gross; }
      else { acc.online += 1; acc.grossOnline += gross; }
      return acc;
    }, { gross: 0, owner: 0, org: 0, items: 0, paid: 0, unpaid: 0,
         online: 0, offline: 0, grossOnline: 0, grossOffline: 0 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredOrders, products]);

  // Label filter aktif, dipakai di nama file dan judul dokumen cetak.
  const orderFilterLabel = useMemo(() => {
    const b = orderFilterBatchId === 'ALL' ? 'Semua Batch' : (batches.find(x => x.id === orderFilterBatchId)?.name || orderFilterBatchId);
    const st = orderFilterStatus === 'ALL' ? 'Semua Status' : orderFilterStatus;
    const ch = orderFilterChannel === 'ALL' ? 'Online+Offline'
             : orderFilterChannel === 'offline' ? 'Offline' : 'Online';
    return `${b} - ${st} - ${ch}`;
  }, [orderFilterBatchId, orderFilterStatus, orderFilterChannel, batches]);

  // Satu baris per ITEM, supaya bisa dilihat produk & harganya per pesanan.
  const buildOrderRows = () => {
    const header = ['No Order', 'Tanggal', 'Batch', 'Kanal', 'Metode Bayar',
                    'Nama Anak', 'Kelas', 'Nama Ortu', 'Status',
                    'Produk', 'Stand', 'Qty', 'Harga Satuan', 'Hak Vendor', 'Hak Panitia', 'Subtotal', 'Catatan'];
    const rows = [header];
    filteredOrders.forEach((o) => {
      const c = o.customer || {};
      const batchName = batches.find(b => b.id === o.batchId)?.name || o.batchId || '-';
      const tgl = o.date ? new Date(o.date) : null;
      const tglStr = tgl && !isNaN(tgl) ? tgl.toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' }) : '-';
      const items = enrichOrderItems(o);
      const kanal = (o.channel || 'online') === 'offline' ? 'Offline' : 'Online';
      const bayar = o.paymentMethod || '-';
      if (items.length === 0) {
        rows.push([o.orderId || '-', tglStr, batchName, kanal, bayar,
                   c.namaAnak || '-', c.kelas || '-', c.namaOrtu || '-',
                   o.status || 'Unpaid', '(tidak ada item)', '-', 0, 0, 0, 0, 0, c.catatan || '-']);
        return;
      }
      items.forEach((it) => {
        const qty = Number(it.qty) || 1;
        const po = Number(it.priceOwner) || 0;
        const pg = Number(it.priceOrganizer) || 0;
        rows.push([
          o.orderId || '-', tglStr, batchName, kanal, bayar,
          c.namaAnak || '-', c.kelas || '-', c.namaOrtu || '-',
          o.status || 'Unpaid',
          parseAndCleanItem(it.name),
          tenants.find(t => t.id === it.tenantId)?.name || '-',
          qty, po + pg, po * qty, pg * qty, (po + pg) * qty,
          c.catatan || '-'
        ]);
      });
    });
    rows.push([]);
    rows.push(['TOTAL', '', '', '', '', '', '', '', '', `${filteredOrders.length} pesanan`, '',
               filteredOrdersSummary.items, '', filteredOrdersSummary.owner, filteredOrdersSummary.org, filteredOrdersSummary.gross, '']);
    return rows;
  };

  const handleExportOrdersExcel = () => {
    if (filteredOrders.length === 0) { showToast('Tidak ada pesanan untuk diexport.'); return; }
    try {
      const rows = buildOrderRows();
      const widths = [13, 16, 12, 9, 13, 26, 24, 18, 9, 38, 20, 6, 13, 13, 13, 13, 26];
      const bytes = buildXlsx('Pesanan', rows, widths);
      const stamp = new Date().toISOString().slice(0, 10);
      const safe = orderFilterLabel.replace(/[^a-zA-Z0-9 -]/g, '').trim().replace(/\s+/g, '-');
      downloadBlob(bytes, `Pesanan-Bazaar-${safe}-${stamp}.xlsx`,
                   'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      showToast(`${filteredOrders.length} pesanan diexport ke Excel.`);
    } catch (err) {
      console.error('Export Excel gagal:', err);
      showToast('Export Excel gagal. Cek console.');
    }
  };

  const batchReportData = useMemo(() => {
    let filtered = orders.filter((o) => o?.batchId === reportSelectedBatchId);
    if (reportSelectedStatus !== 'ALL') {
      filtered = filtered.filter((o) => o?.status === reportSelectedStatus);
    }

    return tenants.map((tenant) => {
      const customerOrdersDetail = [];
      const itemTotalsMap = {};
      let tenantTotalGross = 0;
      let grossOnline = 0, grossOffline = 0;
      let tenantTotalOwnerShare = 0;
      let tenantTotalMargin = 0;

      filtered.forEach((ord) => {
        if (!ord) return;
        const enrichedItems = enrichOrderItems(ord);
        const tenantItemsInOrder = enrichedItems.filter((it) => it?.tenantId === tenant.id);
        
        if (tenantItemsInOrder.length > 0) {
          customerOrdersDetail.push({
            orderId: ord.orderId,
            channel: ord.channel || 'online',
            paymentMethod: ord.paymentMethod || '',
            namaAnak: ord.customer?.namaAnak || 'Unknown',
            kelas: ord.customer?.kelas || '-',
            namaOrtu: ord.customer?.namaOrtu || '-',
            catatan: ord.customer?.catatan || '-',
            items: tenantItemsInOrder
          });

          tenantItemsInOrder.forEach((it) => {
            const cleanNameLocal = parseAndCleanItem(it.name);
            if (!itemTotalsMap[cleanNameLocal]) {
              itemTotalsMap[cleanNameLocal] = {
                qty: 0,
                priceOwner: Number(it.priceOwner) || 0,
                priceOrganizer: Number(it.priceOrganizer) || 0,
              };
            }
            itemTotalsMap[cleanNameLocal].qty += (Number(it.qty) || 1);
            tenantTotalOwnerShare += (Number(it.priceOwner) || 0) * (Number(it.qty) || 1);
            tenantTotalMargin += (Number(it.priceOrganizer) || 0) * (Number(it.qty) || 1);
            tenantTotalGross += (Number(it.subtotal) || 0);
            if ((ord.channel || 'online') === 'offline') grossOffline += (Number(it.subtotal) || 0);
            else grossOnline += (Number(it.subtotal) || 0);
          });
        }
      });

      return {
        tenantId: tenant.id,
        tenantName: tenant.name,
        tenantDesc: tenant.description || tenant.owner || '', 
        tenantPhone: tenant.phone || '',
        tenantBankName: tenant.bankName || '',
        tenantBankAccount: tenant.bankAccount || '',
        tenantBankAccountName: tenant.bankAccountName || '',
        customerOrdersDetail,
        itemTotalsMap,
        tenantTotalGross,
        grossOnline,
        grossOffline,
        tenantTotalOwnerShare,
        tenantTotalMargin
      };
    });
  }, [orders, reportSelectedBatchId, reportSelectedStatus, tenants, products]);

  const updateOrderStatusDirect = async (orderId, newStatus) => {
    try {
      const { error } = await supabase.from('orders')
        .update({ status: newStatus }).eq('code', orderId);
      if (error) throw error;
      setOrders((prev) => prev.map((o) => o.orderId === orderId ? { ...o, status: newStatus } : o));
      showToast('Status tersimpan!');
    } catch (e) {
      console.error('Gagal simpan status:', e);
      showToast('Gagal simpan status: ' + jelaskanError(e));
      fetchCloudData(true, true);   // kembalikan tampilan ke kondisi sebenarnya
    }
  };

  const deleteOrder = async (orderId) => {
    try {
      const { error } = await supabase.from('orders').delete().eq('code', orderId);
      if (error) throw error;
      setOrders((prev) => prev.filter((o) => o.orderId !== orderId));
      showToast('Pesanan dihapus.');
    } catch (e) {
      console.error('Gagal hapus pesanan:', e);
      showToast('Gagal hapus: ' + jelaskanError(e));
      fetchCloudData(true, true);
    }
  };

  const posTotal = useMemo(
    () => posCart.reduce((n, i) => n + i.price * i.qty, 0), [posCart]);

  /**
   * Tambah ke keranjang kasir, dibatasi sisa stok.
   * Pemeriksaannya dilakukan di luar updater state supaya toast tidak muncul
   * dua kali: React boleh menjalankan updater lebih dari sekali.
   * Ini hanya pagar di layar — penjaga yang sesungguhnya ada di create_pos_order.
   */
  const posTambah = (item, jumlah = 1) => {
    const ada = posCart.find((x) => x.key === item.key);
    const batas = item.stok ?? ada?.stok ?? null;
    const target = (ada?.qty || 0) + jumlah;
    if (batas !== null && target > batas) {
      showToast(batas === 0 ? `${item.name} sudah habis.` : `Stok ${item.name} tinggal ${batas}.`);
      return;
    }
    setPosCart((prev) => {
      const sudah = prev.find((x) => x.key === item.key);
      if (sudah) return prev.map((x) => x.key === item.key ? { ...x, qty: x.qty + jumlah } : x);
      return [...prev, { ...item, qty: jumlah }];
    });
  };

  const posUbahQty = (key, delta) => {
    const item = posCart.find((x) => x.key === key);
    if (!item) return;
    const target = item.qty + delta;
    const batas = item.stok ?? null;
    if (batas !== null && target > batas) {
      showToast(`Stok ${item.name} tinggal ${batas}.`);
      return;
    }
    setPosCart((prev) => prev
      .map((x) => x.key === key ? { ...x, qty: target } : x)
      .filter((x) => x.qty > 0));
  };

  const posReset = () => { setPosCart([]); setPosPembeli(''); setPosBayar('Tunai'); };

  /** Tutup transaksi kasir. Harga diambil ulang dari database di sisi server. */
  const posSelesaikan = async () => {
    if (posSubmitting || posCart.length === 0) return;
    if (!activeBatch) { showToast('Belum ada batch aktif.'); return; }
    setPosSubmitting(true);
    try {
      const { data, error } = await supabase.rpc('create_pos_order', {
        p_batch_id: activeBatch.id,
        p_nama_pembeli: posPembeli.trim() || null,
        p_catatan: null,
        p_payment_method: posBayar,
        p_items: posCart.map((i) => ({
          product_id: i.productId, variant_id: i.variantId, qty: i.qty,
        })),
      });
      if (error) { showToast('Transaksi gagal: ' + (error.message || 'coba lagi')); return; }
      const hasil = Array.isArray(data) ? data[0] : data;
      setPosStruk({
        code: hasil?.code,
        total: Number(hasil?.total_tagihan) || posTotal,
        items: posCart,
        bayar: posBayar,
        pembeli: posPembeli.trim() || 'admin offline',
      });
      posReset();
      fetchCloudData(true, true);
    } catch (e) {
      console.error('Kasir gagal:', e);
      showToast('Transaksi gagal: ' + (e.message || 'periksa koneksi'));
    } finally {
      setPosSubmitting(false);
    }
  };

  /**
   * Satu kartu produk. Dipakai etalase (baris geser) maupun hasil pencarian
   * (grid datar), supaya perilakunya tidak pernah berbeda di antara keduanya.
   */
  const KartuProduk = ({ prod, tenant, showTenant, pos = false }) => {
    const hasVariants = Array.isArray(prod.variants) && prod.variants.length > 0;
    const displayPriceText = hasVariants
      ? `Mulai ${formatRupiah(Math.min(...prod.variants.map((v) => Number(v.priceOwner) + Number(v.priceOrganizer))))}`
      : formatRupiah(Number(prod.priceOwner || 0) + Number(prod.priceOrganizer || 0));
    const cleanName = parseAndCleanItem(prod.name);
    // Kasir memakai keranjangnya sendiri, tapi tombol dan perilakunya sama.
    const inCart = hasVariants
      ? null
      : (pos ? posCart.find((i) => i.key === prod.id) : cart.find((i) => i.id === prod.id));

    // Stok hanya relevan di layar kasir. Halaman pembeli sengaja TIDAK
    // menampilkan maupun membatasi stok: pesanan online adalah PO.
    // Untuk produk bervarian, kartunya menampilkan jumlah seluruh varian;
    // rinciannya ada di modal varian. Satu varian saja yang tidak dibatasi
    // membuat totalnya tidak dibatasi — menjumlahkannya akan menyesatkan.
    const stokKartu = !pos ? null
      : hasVariants
        ? (prod.variants.some((v) => v.stock === null || v.stock === undefined)
            ? null
            : prod.variants.reduce((n, v) => n + Number(v.stock), 0))
        : (prod.stock ?? null);
    const habis = pos && stokKartu === 0;
    const bolehPesan = pos ? !habis : isOrderingOpen;
    const sudahMaksimal = Boolean(inCart) && stokKartu !== null && stokKartu !== undefined
      && inCart.qty >= stokKartu;

    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden h-full transition-all hover:shadow-md">
        <div
          className="h-28 sm:h-36 w-full bg-slate-100 relative group cursor-pointer overflow-hidden shrink-0"
          onClick={() => prod.imageUrl && setZoomedImage(prod.imageUrl)}
        >
          {prod.imageUrl ? (
            <img src={prod.imageUrl} alt={cleanName} loading="lazy" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-300">
              <ImageIcon className="w-6 h-6 sm:w-8 sm:h-8" />
            </div>
          )}
          {showTenant && (
            <span className="absolute top-1.5 left-1.5 text-[9px] font-bold bg-white/90 px-1.5 py-0.5 rounded shadow-sm text-slate-700 z-10 backdrop-blur-xs">
              {tenant?.name || 'Stand'}
            </span>
          )}
          {hasVariants && (
            <span className="absolute bottom-1.5 right-1.5 text-[9px] font-bold bg-indigo-600 text-white px-1.5 py-0.5 rounded shadow-sm z-10">
              {prod.variants.length} varian
            </span>
          )}
        </div>

        <div className="p-2.5 sm:p-3 flex-1 flex flex-col justify-between gap-2">
          <div>
            <h3 className="font-bold text-slate-900 text-xs sm:text-sm line-clamp-2 leading-tight">{cleanName}</h3>
            {prod.category && <span className="inline-block text-[9px] text-amber-600 font-bold bg-amber-50 px-1.5 py-0.5 rounded mt-1">{prod.category}</span>}
            {prod.description && <p className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">{prod.description}</p>}
          </div>

          <div className="pt-2 border-t border-slate-100 flex flex-col gap-1.5">
            <span className="text-xs sm:text-sm font-black text-amber-600">{displayPriceText}</span>
            {pos && stokKartu !== null && stokKartu !== undefined && (
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded w-fit ${warnaStok(stokKartu)}`}>
                {labelStok(stokKartu)}
              </span>
            )}
            {inCart ? (
              <div className={`flex items-center space-x-1.5 ${pos ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'} border p-0.5 rounded-lg w-fit`}>
                <button
                  onClick={() => pos ? posUbahQty(prod.id, -1) : updateCartQty(prod.id, -1)}
                  className={`w-6 h-6 bg-white rounded font-bold ${pos ? 'text-emerald-700' : 'text-amber-700'} shadow-sm text-xs flex items-center justify-center`}
                >-</button>
                <span className="text-[11px] font-bold px-1.5">{inCart.qty}</span>
                <button
                  onClick={() => pos ? posUbahQty(prod.id, 1) : updateCartQty(prod.id, 1)}
                  disabled={sudahMaksimal}
                  title={sudahMaksimal ? 'Sudah mencapai sisa stok' : ''}
                  className={`w-6 h-6 ${pos ? 'bg-emerald-600' : 'bg-amber-600'} text-white rounded font-bold shadow-sm text-xs flex items-center justify-center disabled:bg-slate-300 disabled:cursor-not-allowed`}
                >+</button>
              </div>
            ) : (
              <button
                disabled={!bolehPesan}
                title={habis ? 'Stok habis' : bolehPesan ? '' : 'Periode pemesanan sedang ditutup'}
                onClick={() => {
                  if (hasVariants) { setVariantModal({ isOpen: true, product: prod, pos }); return; }
                  if (pos) {
                    posTambah({
                      key: prod.id, productId: prod.id, variantId: null,
                      name: parseAndCleanItem(prod.name), tenantName: tenant?.name || '',
                      tenantId: prod.tenantId,
                      stok: prod.stock ?? null,
                      price: Number(prod.priceOwner || 0) + Number(prod.priceOrganizer || 0),
                    });
                  } else {
                    addToCart(prod);
                  }
                }}
                className={`px-2.5 py-1.5 ${pos ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-slate-900 hover:bg-slate-800'} disabled:bg-slate-300 disabled:cursor-not-allowed disabled:hover:bg-slate-300 text-white rounded-lg text-[10px] sm:text-xs font-semibold flex items-center justify-center w-full shadow-sm transition-colors`}
              >
                {habis ? <>Habis</> : !bolehPesan ? <><Clock className="w-3 h-3 mr-1" /> Ditutup</> : hasVariants ? <><List className="w-3 h-3 mr-1" /> Pilih Varian</> : <><Plus className="w-3 h-3 mr-1" /> {pos ? 'Tambah' : 'Pesan'}</>}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  /**
   * Katalog produk: etalase per stand saat utuh, grid datar saat difilter.
   * Dipakai halaman pembeli maupun layar Kasir — aturan dan tombolnya sama,
   * yang berbeda hanya keranjang tujuannya.
   */
  const KatalogProduk = ({ pos = false }) => (
    <>
      {modeEtalase ? (
        <div className="space-y-6">
          {etalase.map(({ tenant, items }) => (
            <section key={tenant.id}>
              <div className="flex items-baseline justify-between gap-3 mb-2.5">
                <h3 className="font-black text-slate-900 text-sm sm:text-base leading-tight truncate">
                  {tenant.name}
                </h3>
                <span className="text-[10px] font-bold text-slate-400 whitespace-nowrap shrink-0">
                  {items.length} produk
                </span>
              </div>
              <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 snap-x scrollbar-none">
                {items.map((prod) => (
                  <div key={prod.id} className="w-40 sm:w-44 shrink-0 snap-start">
                    <KartuProduk prod={prod} tenant={tenant} showTenant={false} pos={pos} />
                  </div>
                ))}
              </div>
            </section>
          ))}

          {etalase.length === 0 && (
            <div className="py-12 flex flex-col items-center justify-center text-slate-400">
              <Store className="w-10 h-10 mb-2 opacity-20" />
              <p className="text-xs font-medium">
                {pos ? 'Belum ada produk offline dari stand peserta periode ini.'
                     : 'Belum ada stand yang ikut periode ini.'}
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {filteredProducts.map((prod) => (
            <KartuProduk
              key={prod.id}
              prod={prod}
              tenant={tenants.find((t) => t.id === prod.tenantId)}
              showTenant
              pos={pos}
            />
          ))}

          {filteredProducts.length === 0 && (
            <div className="col-span-2 md:col-span-3 lg:col-span-4 py-10 flex flex-col items-center justify-center text-slate-400">
              <Search className="w-10 h-10 mb-2 opacity-20" />
              <p className="text-xs font-medium">Tidak ada produk yang cocok dengan filter.</p>
            </div>
          )}
        </div>
      )}
    </>
  );

  return (
    <Fragment>
      <div className={`min-h-screen bg-slate-50 text-slate-800 font-sans pb-24 print:hidden`}>
        {toastMessage && (
          <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-2xl text-xs font-bold flex items-center space-x-2 animate-bounce">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{toastMessage}</span>
          </div>
        )}

        <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md shadow-sm border-b border-slate-200 flex flex-col transition-all">
          <div className="max-w-5xl w-full mx-auto px-4 py-2.5 flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 shrink-0 p-0.5 bg-amber-50 rounded-lg border border-amber-200 shadow-sm flex items-center justify-center">
                <LittleDarbiLogo className="w-7 h-7" />
              </div>
              <div>
                <h1 className="font-black text-sm leading-tight text-slate-900">Bazaar DANUS</h1>
                <p className="text-[10px] text-slate-500 font-medium">PTA Little Darbi</p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => fetchCloudData(false)}
                disabled={isCloudSyncing}
                className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs transition-colors"
                title="Refresh Data"
              >
                <RefreshCw className={`w-4 h-4 ${isCloudSyncing ? 'animate-spin text-indigo-600' : ''}`} />
              </button>

              <div className="relative">
                <button 
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg sm:hidden flex items-center gap-1 transition-colors"
                >
                  <Menu className="w-4 h-4" /> <span className="text-[10px] font-bold">Menu</span>
                </button>

                <div className={`sm:flex items-center bg-slate-100 p-1 rounded-xl transition-all ${isMobileMenuOpen ? 'absolute right-0 top-10 flex-col w-40 shadow-xl border border-slate-200 bg-white z-50' : 'hidden'}`}>
                  <button
                    onClick={() => { setActiveTab('shop'); setIsMobileMenuOpen(false); }}
                    className={`w-full px-3 py-2 sm:py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-2 ${
                      activeTab === 'shop' ? 'bg-white text-amber-600 shadow-sm' : 'text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <ShoppingBag className="w-4 h-4" /><span>Menu Pembeli</span>
                  </button>
                  {pendaftaran.isOpen && (
                    <button
                      onClick={() => { setActiveTab('daftar'); setIsMobileMenuOpen(false); }}
                      className={`w-full px-3 py-2 sm:py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-2 ${
                        activeTab === 'daftar' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      <Store className="w-4 h-4" /><span>Daftar Produk</span>
                    </button>
                  )}
                  <button
                    onClick={() => { setActiveTab('admin'); setIsMobileMenuOpen(false); }}
                    className={`w-full px-3 py-2 sm:py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-2 ${
                      activeTab === 'admin' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <Settings className="w-4 h-4" /><span>Panel Admin</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {activeTab === 'shop' && (
            <div className="max-w-5xl w-full mx-auto px-4 py-2.5 border-t border-slate-100 bg-slate-50/50 flex gap-2 items-center">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari makanan atau minuman..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-white rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-amber-500 shadow-sm transition-colors"
                />
              </div>
              <button
                onClick={() => setIsFilterModalOpen(true)}
                className="flex items-center justify-center gap-1.5 px-3 py-2 bg-white border border-slate-200 rounded-xl shadow-sm hover:bg-slate-50 text-slate-700 font-bold text-sm transition-colors relative"
              >
                <Filter className="w-4 h-4" />
                <span className="hidden sm:inline">Filter</span>
                {(selectedTenantFilter !== 'all' || selectedCategoryFilter !== 'all' || sortOrder !== 'default') && (
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 absolute -top-1 -right-1 border-2 border-white sm:static sm:border-0 sm:w-2 sm:h-2"></span>
                )}
              </button>
            </div>
          )}
        </header>

        {}
        {isCloudSyncing && products.length === 1 && products[0].id === 'p1' ? (
          <div className="flex flex-col items-center justify-center pt-32 space-y-4">
            <RefreshCw className="w-8 h-8 text-amber-500 animate-spin" />
            <p className="text-xs font-bold text-slate-500 animate-pulse">Menghubungkan ke Database...</p>
          </div>
        ) : activeTab === 'daftar' ? (
          <main className="max-w-5xl mx-auto px-4 pt-4">
            {pendaftaran.isOpen ? (
              <FormPendaftaran
                tenants={tenantsUrut}
                batchName={pendaftaran.batchName}
                onKembali={() => setActiveTab('shop')}
              />
            ) : (
              <div className="max-w-xs mx-auto bg-white rounded-2xl border p-6 shadow-sm mt-10 text-center">
                <Clock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="font-bold text-sm text-slate-700">Pendaftaran produk sedang ditutup</p>
                <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">
                  Panitia akan membuka pendaftaran lagi menjelang bazaar berikutnya.
                </p>
                <button
                  onClick={() => setActiveTab('shop')}
                  className="w-full py-2.5 mt-4 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl text-xs transition-colors"
                >Kembali ke Menu Pembeli</button>
              </div>
            )}
          </main>
        ) : activeTab === 'shop' ? (
          <main className="max-w-5xl mx-auto px-4 pt-5">
            {}
            {pendaftaran.isOpen && (
              <button
                onClick={() => setActiveTab('daftar')}
                className="w-full mb-4 bg-emerald-50 hover:bg-emerald-100 border-2 border-emerald-200 rounded-2xl p-3.5 flex items-center gap-3 text-left transition-colors"
              >
                <span className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center shrink-0">
                  <Store className="w-4.5 h-4.5 text-white" />
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block font-black text-sm text-emerald-900 leading-tight">Punya produk untuk dijual?</span>
                  <span className="block text-[10px] text-emerald-800 mt-0.5 leading-snug">
                    Pendaftaran produk bazaar <b>{pendaftaran.batchName}</b> sedang dibuka. Ketuk untuk mendaftar.
                  </span>
                </span>
                <span className="text-emerald-700 font-black text-lg shrink-0">&rsaquo;</span>
              </button>
            )}

            {}
            {activeBatch && !isOrderingOpen && (
              <div className="bg-rose-50 border-2 border-rose-200 text-rose-800 rounded-2xl p-4 shadow-sm mb-4 flex items-start gap-3">
                <Clock className="w-5 h-5 shrink-0 mt-0.5 text-rose-500" />
                <div>
                  <p className="font-black text-sm leading-tight">
                    {batchWindow === 'before' ? 'Periode pemesanan belum dibuka' : 'Periode pemesanan sudah ditutup'}
                  </p>
                  <p className="text-[11px] mt-1 leading-relaxed">
                    {batchWindow === 'before'
                      ? <>Periode <b>{activeBatch.name}</b> baru dibuka pada <b>{formatIndoDate(activeBatch.startDate)}</b>. Katalog bisa dilihat, tapi pemesanan belum bisa dilakukan.</>
                      : <>Periode <b>{activeBatch.name}</b> berakhir <b>{formatIndoDate(activeBatch.endDate)}</b>. Katalog masih bisa dilihat, tapi pemesanan sudah ditutup. Nantikan periode berikutnya ya!</>}
                  </p>
                </div>
              </div>
            )}
            {activeBatch && (
              <div className={`${isOrderingOpen ? 'bg-gradient-to-r from-amber-500 to-orange-500' : 'bg-gradient-to-r from-slate-400 to-slate-500'} text-white rounded-2xl p-4 shadow-sm mb-5 relative overflow-hidden`}>
                <div className="relative z-10">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="bg-white/20 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full">{activeBatch.name}</span>
                    <span className="text-[10px] text-amber-100">Batas: {formatIndoDate(activeBatch.endDate)}</span>
                  </div>
                  <h2 className="text-lg font-black leading-tight">Pesan Makanan & Souvenir</h2>
                  {activeBatch.readyDate && (
                    <p className="text-[11px] text-amber-100 mt-1 flex items-center">
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Ready: {formatIndoDate(activeBatch.readyDate)}
                    </p>
                  )}
                </div>
                <Store className="absolute -right-4 -bottom-4 w-24 h-24 text-white/10 rotate-12" />
              </div>
            )}

            <KatalogProduk />

            {cart.length > 0 && (
              <div className="fixed bottom-4 left-4 right-4 max-w-md mx-auto z-40 animate-in slide-in-from-bottom-6">
                <button onClick={() => setIsCartOpen(true)} className="w-full bg-amber-600 text-white p-3.5 rounded-2xl shadow-2xl flex items-center justify-between hover:bg-amber-700 transition-colors">
                  <div className="flex items-center space-x-3">
                    <div className="relative bg-white/20 p-2 rounded-xl">
                      <ShoppingCart className="w-5 h-5 text-white" />
                      <span className="absolute -top-1 -right-1 bg-red-500 text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center border-2 border-amber-600">
                        {cartSummary.totalItems}
                      </span>
                    </div>
                    <div className="text-left">
                      <p className="text-[10px] text-amber-100">{cartSummary.totalItems} Pesanan</p>
                      <p className="text-sm sm:text-base font-black">{formatRupiah(cartSummary.totalSellingPrice)}</p>
                    </div>
                  </div>
                  <span className="text-[10px] sm:text-xs font-bold bg-white text-amber-700 px-3 py-2 rounded-xl shadow-sm">Lihat Keranjang</span>
                </button>
              </div>
            )}
          </main>
        ) : (
          <main className="max-w-6xl mx-auto px-4 pt-4">
            {!isAdminLoggedIn ? (
              <div className="max-w-xs mx-auto bg-white rounded-2xl border p-6 shadow-xl mt-10">
                <div className="text-center mb-5">
                  <LittleDarbiLogo className="w-12 h-12 mx-auto mb-2" />
                  <h2 className="text-lg font-black text-slate-800">Login Admin</h2>
                </div>
                {loginError && <p className="mb-4 text-xs font-semibold text-red-600 text-center bg-red-50 p-2 rounded-lg border border-red-100">{loginError}</p>}
                <form onSubmit={handleAdminLogin} className="space-y-4 text-sm">
                  <input type="email" required autoComplete="username" placeholder="Email admin" value={loginForm.username} onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })} className="w-full px-4 py-2.5 border rounded-xl bg-slate-50 focus:outline-none focus:border-indigo-500" />
                  <input type="password" required autoComplete="current-password" placeholder="Password" value={loginForm.password} onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })} className="w-full px-4 py-2.5 border rounded-xl bg-slate-50 focus:outline-none focus:border-indigo-500" />
                  <button type="submit" disabled={isSubmitting} className="w-full py-3 bg-indigo-600 disabled:bg-slate-300 text-white font-bold rounded-xl shadow-md hover:bg-indigo-700 transition-colors">{isSubmitting ? 'Memproses...' : 'Masuk Panel'}</button>
                </form>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row sm:gap-4 items-stretch sm:items-start">
                <NavAdmin
                  aktif={adminSubTab}
                  pilih={setAdminSubTab}
                  menunggu={jumlahMenunggu}
                  onKeluar={handleAdminLogout}
                />

                <div className="flex-1 min-w-0 space-y-4">

                {}
                {adminSubTab === 'batch_reports' && (
                  <div className="space-y-4 animate-in fade-in duration-300">
                    <div className="bg-white p-4 rounded-xl border shadow-sm flex flex-col sm:flex-row gap-3 justify-between sm:items-center">
                      <div>
                        <h3 className="font-bold text-sm">Laporan Rekapitulasi Per Stand</h3>
                      </div>
                      <div className="flex gap-2 text-xs">
                        <select value={reportSelectedBatchId} onChange={(e) => setReportSelectedBatchId(e.target.value)} className="p-2 border rounded-lg bg-slate-50 font-semibold focus:outline-none focus:border-indigo-500">
                          <option value="">-- Pilih Batch --</option>
                          {batches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                        </select>
                        <select value={reportSelectedStatus} onChange={(e) => setReportSelectedStatus(e.target.value)} className="p-2 border rounded-lg bg-slate-50 font-semibold focus:outline-none focus:border-indigo-500">
                          <option value="Paid">Hanya Paid</option>
                          <option value="ALL">Semua Pesanan</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {batchReportData.map(tenantRep => {
                        const itemNames = Object.keys(tenantRep.itemTotalsMap);
                        if (itemNames.length === 0) return null;
                        const currentBatch = batches.find(b => b.id === reportSelectedBatchId);

                        return (
                          <div key={tenantRep.tenantId} className="bg-white rounded-xl border shadow-sm overflow-hidden">
                            <div className="p-3 sm:p-4 bg-slate-900 text-white flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                              <div>
                                <h4 className="font-bold text-sm sm:text-base">{tenantRep.tenantName}</h4>
                                <p className="text-[10px] sm:text-xs text-slate-300">{tenantRep.tenantDesc} {tenantRep.tenantPhone ? `(WA: ${tenantRep.tenantPhone})` : ''}</p>
                                {tenantRep.tenantBankAccount ? (
                                  <p className="text-[10px] sm:text-xs text-amber-300 font-bold mt-1">
                                    {tenantRep.tenantBankName} {tenantRep.tenantBankAccount}
                                    {tenantRep.tenantBankAccountName ? ` a.n. ${tenantRep.tenantBankAccountName}` : ''}
                                  </p>
                                ) : (
                                  <p className="text-[10px] text-slate-400 italic mt-1">Rekening belum diisi</p>
                                )}
                              </div>
                              <div className="flex gap-2">
                                <button 
                                  onClick={() => {
                                      let cleanPhone = tenantRep.tenantPhone ? String(tenantRep.tenantPhone).replace(/[^0-9]/g, '') : '';
                                      if (cleanPhone.startsWith('0')) cleanPhone = '62' + cleanPhone.slice(1);
                                      
                                      let text = `REKAP PESANAN - ${tenantRep.tenantName.toUpperCase()}\n`;
                                      if (tenantRep.tenantBankAccount) {
                                        text += `Rekening: ${tenantRep.tenantBankName} ${tenantRep.tenantBankAccount}` +
                                                `${tenantRep.tenantBankAccountName ? ' a.n. ' + tenantRep.tenantBankAccountName : ''}\n`;
                                      }
                                      text += `Periode: ${currentBatch?.name || '-'}\n`;
                                      text += `Tanggal ready: ${currentBatch?.readyDate ? formatIndoDate(currentBatch.readyDate) : '-'}\n\n`;
                                      
                                      Object.keys(tenantRep.itemTotalsMap).forEach((name) => {
                                          const item = tenantRep.itemTotalsMap[name];
                                          text += `* ${parseAndCleanItem(name)}: ${item.qty} pcs (${formatRupiah(item.priceOwner * item.qty)})\n`;
                                      });
                                      
                                      text += `\nTOTAL HARGA PRODUCT: ${formatRupiah(tenantRep.tenantTotalOwnerShare)}`;
                                      text += `\nTOTAL MARGIN JUAL: ${formatRupiah(tenantRep.tenantTotalMargin)}`;
                                      text += `\nNOMINAL TOTAL: ${formatRupiah(tenantRep.tenantTotalGross)}\n\n`;
                                      text += `Terima kasih!`;
                                      
                                      if(cleanPhone.length > 5) {
                                          setTimeout(() => {
                                            window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`, '_blank');
                                          }, 100);
                                      } else {
                                          showToast("Nomor WA tenant tidak valid.");
                                      }
                                  }}
                                  className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg flex items-center shadow-sm transition-colors"
                                >
                                  <MessageCircle className="w-4 h-4 mr-1.5" /> Kirim WA
                                </button>
                                <button 
                                  onClick={() => setPrintData({ tenantRep, currentBatch })}
                                  className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg flex items-center shadow-sm transition-colors"
                                >
                                  <Printer className="w-4 h-4 mr-1.5" /> Export PDF
                                </button>
                              </div>
                            </div>
                            
                            <div className="p-4 text-xs">
                              <h5 className="font-bold text-amber-800 border-b pb-1.5 mb-3">Ringkasan Dapur:</h5>
                              <div className="space-y-1.5 mb-4 border-l-2 border-amber-200 pl-3">
                                {itemNames.map(name => (
                                  <div key={name} className="flex justify-between font-medium">
                                    <span>{parseAndCleanItem(name)}</span>
                                    <span className="font-bold">{tenantRep.itemTotalsMap[name].qty} Pcs</span>
                                  </div>
                                ))}
                              </div>
                              <div className="flex gap-2 mb-2">
                                <div className="flex-1 bg-amber-50 border border-amber-100 rounded-lg p-2">
                                  <p className="text-[9px] font-bold text-amber-700 uppercase tracking-wide">Online</p>
                                  <p className="font-black text-amber-700 text-xs mt-0.5">{formatRupiah(tenantRep.grossOnline)}</p>
                                </div>
                                <div className="flex-1 bg-emerald-50 border border-emerald-100 rounded-lg p-2">
                                  <p className="text-[9px] font-bold text-emerald-700 uppercase tracking-wide">Offline (Kasir)</p>
                                  <p className="font-black text-emerald-700 text-xs mt-0.5">{formatRupiah(tenantRep.grossOffline)}</p>
                                </div>
                              </div>
                              <div className="flex justify-between font-bold text-emerald-800 bg-emerald-50 p-2.5 rounded-lg border border-emerald-100">
                                <span>Total Hak Vendor:</span>
                                <span className="text-sm">{formatRupiah(tenantRep.tenantTotalOwnerShare)}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {}
                {adminSubTab === 'orders' && (
                  <div className="space-y-3 animate-in fade-in duration-300">
                    {}
                    <div className="bg-white p-3 sm:p-4 rounded-xl border shadow-sm space-y-3">
                      <div className="flex flex-col lg:flex-row lg:items-center gap-2">
                        <div className="flex flex-wrap gap-2 text-xs flex-1">
                          <select value={orderFilterBatchId} onChange={(e) => setOrderFilterBatchId(e.target.value)} className="p-2 border rounded-lg bg-slate-50 font-semibold focus:outline-none focus:border-indigo-500">
                            <option value="ALL">Semua Batch</option>
                            {batches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                          </select>
                          <select value={orderFilterStatus} onChange={(e) => setOrderFilterStatus(e.target.value)} className="p-2 border rounded-lg bg-slate-50 font-semibold focus:outline-none focus:border-indigo-500">
                            <option value="ALL">Semua Status</option>
                            <option value="Paid">Paid</option>
                            <option value="Unpaid">Unpaid</option>
                          </select>
                          <select value={orderFilterChannel} onChange={(e) => setOrderFilterChannel(e.target.value)} className="p-2 border rounded-lg bg-slate-50 font-semibold focus:outline-none focus:border-indigo-500">
                            <option value="ALL">Online + Offline</option>
                            <option value="online">Online saja</option>
                            <option value="offline">Offline saja</option>
                          </select>
                          <div className="relative flex-1 min-w-[150px]">
                            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                              type="text" value={orderSearch} onChange={(e) => setOrderSearch(e.target.value)}
                              placeholder="Cari no order / nama anak / kelas / ortu"
                              className="w-full pl-8 pr-2 py-2 border rounded-lg bg-slate-50 font-semibold focus:outline-none focus:border-indigo-500"
                            />
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={handleExportOrdersExcel}
                            disabled={filteredOrders.length === 0}
                            className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-xs font-bold rounded-lg flex items-center shadow-sm transition-colors"
                          >
                            <Download className="w-4 h-4 mr-1.5" /> Export Excel
                          </button>
                          <button
                            onClick={() => {
                              if (filteredOrders.length === 0) { showToast('Tidak ada pesanan untuk dicetak.'); return; }
                              setPrintOrders({ list: filteredOrders, label: orderFilterLabel, summary: filteredOrdersSummary });
                            }}
                            disabled={filteredOrders.length === 0}
                            className="px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-xs font-bold rounded-lg flex items-center shadow-sm transition-colors"
                          >
                            <FileText className="w-4 h-4 mr-1.5" /> Print PDF
                          </button>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 text-[10px] font-bold pt-1 border-t">
                        <span className="bg-indigo-50 text-indigo-700 px-2 py-1 rounded">{filteredOrders.length} pesanan</span>
                        <span className="bg-emerald-50 text-emerald-700 px-2 py-1 rounded">{filteredOrdersSummary.paid} Paid</span>
                        <span className="bg-amber-50 text-amber-700 px-2 py-1 rounded">{filteredOrdersSummary.unpaid} Unpaid</span>
                        <span className="bg-slate-100 text-slate-700 px-2 py-1 rounded">{filteredOrdersSummary.items} item</span>
                        <span className="bg-amber-50 text-amber-700 px-2 py-1 rounded">{filteredOrdersSummary.online} online &middot; {formatRupiah(filteredOrdersSummary.grossOnline)}</span>
                        <span className="bg-emerald-50 text-emerald-700 px-2 py-1 rounded">{filteredOrdersSummary.offline} offline &middot; {formatRupiah(filteredOrdersSummary.grossOffline)}</span>
                        <span className="bg-slate-900 text-white px-2 py-1 rounded">Total {formatRupiah(filteredOrdersSummary.gross)}</span>
                      </div>
                      <p className="text-[10px] text-slate-400">
                        Mengganti status langsung tersimpan ke cloud. Klik barisnya untuk melihat
                        rincian item. Export &amp; Print mengikuti filter di atas.
                      </p>
                    </div>

                    {filteredOrders.length === 0 && (
                      <div className="bg-white p-8 rounded-xl border text-center text-xs text-slate-400">
                        Tidak ada pesanan yang cocok dengan filter.
                      </div>
                    )}

                    {filteredOrders.map((ord, idx) => {
                      if (!ord || typeof ord !== 'object') return null;
                      const cust = ord.customer && typeof ord.customer === 'object' ? ord.customer : {};
                      const offline = (ord.channel || 'online') === 'offline';
                      const nItem = (enrichOrderItems(ord) || []).reduce((n, i) => n + Number(i?.qty || 0), 0);
                      return (
                        <div
                          key={ord.orderId || idx}
                          className="bg-white rounded-xl border shadow-sm px-3 py-2.5 flex flex-col sm:flex-row sm:items-center gap-2 hover:border-indigo-300 transition-colors"
                        >
                          {}
                          <button
                            onClick={() => setOrderDetail(ord)}
                            className="flex-1 min-w-0 text-left"
                            title="Lihat rincian pesanan"
                          >
                            <span className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-black text-indigo-700 text-xs">{ord.orderId || '-'}</span>
                              {offline ? (
                                <span className="text-[9px] font-black bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded">
                                  OFFLINE{ord.paymentMethod ? ` \u00b7 ${ord.paymentMethod}` : ''}
                                </span>
                              ) : (
                                <span className="text-[9px] font-black bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">ONLINE</span>
                              )}
                            </span>
                            <span className="block font-bold text-slate-800 text-xs truncate mt-0.5">
                              {cust?.namaAnak || 'Unknown'}
                            </span>
                            <span className="block text-[10px] text-slate-500 truncate">
                              {cust?.kelas || '-'}{cust?.namaOrtu && cust.namaOrtu !== '-' ? ` \u00b7 ${cust.namaOrtu}` : ''}
                            </span>
                          </button>

                          {}
                          <button
                            onClick={() => setOrderDetail(ord)}
                            className="text-left sm:text-right shrink-0 sm:w-32"
                          >
                            <span className="block text-[10px] text-slate-400">{nItem} item</span>
                            <span className="block font-black text-amber-600 text-xs">{formatRupiah(ord.totalAmount || 0)}</span>
                          </button>

                          {}
                          <div className="flex items-center gap-1.5 shrink-0">
                            <select
                              value={ord.status || 'Unpaid'}
                              onChange={(e) => updateOrderStatusDirect(ord.orderId, e.target.value)}
                              className={`text-[11px] font-bold px-2 py-1.5 rounded-lg border focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
                                ord.status === 'Paid' ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                : ord.status === 'Unpaid' ? 'bg-amber-50 border-amber-200 text-amber-700'
                                : ord.status === 'Batal' ? 'bg-rose-50 border-rose-200 text-rose-700'
                                : 'bg-slate-50 border-slate-200 text-slate-700'}`}
                            >
                              <option value="Unpaid">Unpaid</option>
                              <option value="Paid">Paid</option>
                              <option value="Selesai">Selesai</option>
                              <option value="Batal">Batal</option>
                            </select>
                            <button
                              onClick={() => setOrderDetail(ord)}
                              className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-500 rounded-lg transition-colors"
                              title="Rincian"
                            >
                              <List className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {}
                {}
                {adminSubTab === 'kasir' && (
                  <div className="space-y-3 animate-in fade-in duration-300">
                    <div className="bg-emerald-600 text-white p-3 sm:p-4 rounded-xl shadow-sm">
                      <h3 className="font-bold text-sm">Kasir Bazaar Offline</h3>
                      <p className="text-[11px] text-emerald-50 mt-1 leading-relaxed">
                        Periode <b>{activeBatch?.name || '-'}</b>. Transaksi langsung berstatus Paid karena
                        bayar di tempat, dan ikut masuk ke Rekap Per Stand serta Semua Pesanan.
                      </p>
                    </div>

                    {posStruk && (
                      <div className="bg-white border-2 border-emerald-500 rounded-xl p-4 shadow-sm">
                        <div className="flex justify-between items-start gap-3">
                          <div className="min-w-0">
                            <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wide">Transaksi tersimpan</p>
                            <p className="font-black text-lg text-slate-900 mt-0.5">{posStruk.code}</p>
                            <p className="text-[11px] text-slate-500">{posStruk.pembeli} &middot; {posStruk.bayar}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="font-black text-lg text-emerald-700">{formatRupiah(posStruk.total)}</p>
                            <button onClick={() => setPosStruk(null)} className="text-[11px] font-bold text-slate-400 hover:text-slate-600 mt-1">Tutup</button>
                          </div>
                        </div>
                        <div className="mt-2.5 pt-2.5 border-t text-[11px] text-slate-600 space-y-0.5">
                          {posStruk.items.map((i) => (
                            <div key={i.key} className="flex justify-between gap-3">
                              <span className="truncate">{i.qty} &times; {i.name}</span>
                              <span className="font-bold whitespace-nowrap">{formatRupiah(i.price * i.qty)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {}
                    <div className="flex gap-2 items-center">
                      <div className="relative flex-1 min-w-0">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Cari produk..."
                          className="w-full pl-9 pr-3 py-2.5 border rounded-xl bg-white text-xs font-semibold focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                      <button
                        onClick={() => setIsFilterModalOpen(true)}
                        className="px-3 py-2.5 bg-white border rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 flex items-center gap-1.5 shrink-0 transition-colors"
                      >
                        <Filter className="w-3.5 h-3.5" /> Filter
                      </button>
                      {(selectedCategoryFilter !== 'all' || selectedTenantFilter !== 'all' || sortOrder !== 'default' || searchQuery) && (
                        <button
                          onClick={() => { setSearchQuery(''); setSelectedCategoryFilter('all'); setSelectedTenantFilter('all'); setSortOrder('default'); }}
                          className="px-3 py-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold text-slate-600 flex items-center gap-1.5 shrink-0 transition-colors"
                        >
                          <RotateCcw className="w-3.5 h-3.5" /> Reset
                        </button>
                      )}
                    </div>

                    {}
                    <div className={posCart.length > 0 ? 'pb-2' : ''}>
                      <KatalogProduk pos />
                    </div>

                    {}
                    {posCart.length > 0 && (
                      <div className="bg-white rounded-xl border-2 border-emerald-500 shadow-lg sticky bottom-3">
                        <div className="p-3 space-y-1.5 max-h-48 overflow-y-auto">
                          {posCart.map((i) => (
                            <div key={i.key} className="flex items-center gap-2 text-xs">
                              <div className="flex-1 min-w-0">
                                <p className="font-bold text-slate-900 truncate">{i.name}</p>
                                <p className="text-[10px] text-slate-400">{formatRupiah(i.price)} &times; {i.qty}</p>
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                <button onClick={() => posUbahQty(i.key, -1)} className="w-7 h-7 bg-slate-100 hover:bg-slate-200 rounded-lg font-bold text-slate-700">-</button>
                                <span className="w-6 text-center font-black tabular-nums">{i.qty}</span>
                                <button onClick={() => posUbahQty(i.key, 1)} className="w-7 h-7 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold">+</button>
                              </div>
                              <span className="w-20 text-right font-black text-slate-900 tabular-nums shrink-0">{formatRupiah(i.price * i.qty)}</span>
                            </div>
                          ))}
                        </div>

                        <div className="border-t p-3 space-y-2.5">
                          <div className="flex gap-2">
                            <input
                              type="text" value={posPembeli} onChange={(e) => setPosPembeli(e.target.value)}
                              placeholder="Nama pembeli (boleh kosong)"
                              className="flex-1 min-w-0 px-3 py-2 border rounded-lg text-xs font-semibold focus:outline-none focus:border-emerald-500"
                            />
                          </div>
                          <div className="flex gap-1.5">
                            {['Tunai', 'QRIS', 'Transfer'].map((m) => (
                              <button
                                key={m} onClick={() => setPosBayar(m)}
                                className={`flex-1 py-2 rounded-lg text-[11px] font-bold border transition-colors ${posBayar === m ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
                              >{m}</button>
                            ))}
                          </div>
                          <div className="flex justify-between items-center text-sm font-black">
                            <span className="text-slate-500">Total</span>
                            <span className="text-emerald-700 text-lg tabular-nums">{formatRupiah(posTotal)}</span>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => showConfirm('Kosongkan keranjang kasir?', posReset)}
                              className="px-3 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl text-xs"
                            >Batal</button>
                            <button
                              onClick={posSelesaikan} disabled={posSubmitting}
                              className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-black rounded-xl text-sm shadow-sm transition-colors"
                            >{posSubmitting ? 'Menyimpan...' : `Selesaikan \u2014 ${formatRupiah(posTotal)}`}</button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {adminSubTab === 'submissions' && (() => {
                  const urutan = { pending: 0, rejected: 1, approved: 2 };
                  const daftar = [...submissions].sort((a, b) =>
                    (urutan[a.status] - urutan[b.status]) || String(b.createdAt).localeCompare(String(a.createdAt)));
                  const namaStand = (s) => s.tenantId
                    ? (tenants.find((t) => t.id === s.tenantId)?.name || s.tenantId)
                    : `${s.tenantBaru} (stand baru)`;
                  return (
                    <div className="space-y-4 animate-in fade-in duration-300">
                      <div className="bg-white p-3 rounded-xl shadow-sm border">
                        <h3 className="font-bold text-sm">Pendaftaran Produk</h3>
                        <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">
                          Dikirim penjual lewat halaman depan. Produk <b>belum dijual</b> sampai
                          Anda setujui dan mengisi margin panitia.
                        </p>
                      </div>

                      {daftar.length === 0 && (
                        <div className="bg-white p-8 rounded-xl border text-center text-xs text-slate-400">
                          Belum ada pendaftaran masuk.
                        </div>
                      )}

                      {daftar.map((s) => {
                        const warna = s.status === 'pending' ? 'border-amber-300 bg-amber-50/40'
                          : s.status === 'approved' ? 'border-emerald-200 bg-emerald-50/30'
                          : 'border-slate-200 bg-slate-50';
                        return (
                          <div key={s.id} className={`rounded-xl border-2 shadow-sm p-3 ${warna}`}>
                            <div className="flex gap-3">
                              {s.imageUrl ? (
                                <img src={s.imageUrl} alt="foto" className="w-16 h-16 rounded-lg object-cover border cursor-pointer hover:opacity-80 shrink-0" onClick={() => setZoomedImage(s.imageUrl)} />
                              ) : (
                                <div className="w-16 h-16 bg-white rounded-lg flex items-center justify-center border shrink-0"><ImageIcon className="w-5 h-5 text-slate-300" /></div>
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2">
                                  <h4 className="font-bold text-sm text-slate-900 leading-tight">{s.name}</h4>
                                  <span className={`text-[9px] font-black px-1.5 py-0.5 rounded shrink-0 ${
                                    s.status === 'pending' ? 'bg-amber-500 text-white'
                                    : s.status === 'approved' ? 'bg-emerald-600 text-white' : 'bg-slate-400 text-white'}`}>
                                    {s.status === 'pending' ? 'MENUNGGU' : s.status === 'approved' ? 'DISETUJUI' : 'DITOLAK'}
                                  </span>
                                </div>
                                <p className="text-[10px] text-slate-600 mt-0.5">
                                  <span className={`font-black mr-1 px-1 py-0.5 rounded text-[8px] ${s.channel === 'offline' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                    {s.channel === 'offline' ? 'OFFLINE' : 'ONLINE'}
                                  </span>
                                  {s.code} &middot; {namaStand(s)}{s.category ? ` · ${s.category}` : ''}
                                </p>
                                <p className="text-[10px] text-slate-500">
                                  {s.sellerName} &middot; {s.sellerPhone}
                                </p>
                                {!s.tenantId && s.bankAccount && (
                                  <p className="text-[10px] text-slate-600 font-bold">
                                    {s.bankName} {s.bankAccount}
                                    {s.bankAccountName ? ` a.n. ${s.bankAccountName}` : ''}
                                  </p>
                                )}
                                {s.description && <p className="text-[10px] text-slate-500 italic mt-0.5">{s.description}</p>}

                                <div className="mt-1.5 flex flex-wrap gap-1.5 items-center">
                                  {s.variants.length === 0 ? (
                                    <>
                                      <span className="text-[10px] font-bold text-emerald-700 bg-white border border-emerald-200 px-1.5 py-0.5 rounded">
                                        Nett {formatRupiah(s.priceOwner)}
                                      </span>
                                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${warnaStok(s.stock)}`}>{labelStok(s.stock)}</span>
                                    </>
                                  ) : s.variants.map((v, i) => (
                                    <span key={i} className="text-[9px] bg-white border border-slate-200 px-1.5 py-0.5 rounded">
                                      <b>{v.name}</b> &middot; nett {formatRupiah(v.priceOwner)} &middot; {labelStok(v.stock)}
                                    </span>
                                  ))}
                                </div>

                                {s.status === 'pending' && (
                                  <p className="text-[9px] text-amber-700 font-bold mt-1.5">
                                    Margin panitia belum diisi.
                                  </p>
                                )}
                                {s.status === 'rejected' && s.reviewNote && (
                                  <p className="text-[9px] text-rose-700 mt-1.5">Alasan ditolak: {s.reviewNote}</p>
                                )}
                                {s.status === 'approved' && (
                                  <p className="text-[9px] text-emerald-700 mt-1.5">
                                    Sudah jadi produk offline{products.find((p) => p.id === s.productId) ? ` — ${products.find((p) => p.id === s.productId).name}` : ''}.
                                  </p>
                                )}
                              </div>
                            </div>

                            <div className="flex gap-2 mt-3">
                              {s.status === 'pending' && (
                                <>
                                  <button
                                    onClick={() => setReviewModal({ isOpen: true, item: s })}
                                    className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded-lg shadow-sm transition-colors"
                                  >Review &amp; Setujui</button>
                                  <button
                                    onClick={() => setTolakModal({ isOpen: true, item: s, note: '' })}
                                    className="px-3 py-2 bg-white border border-rose-200 hover:bg-rose-50 text-rose-600 text-[11px] font-bold rounded-lg transition-colors"
                                  >Tolak</button>
                                </>
                              )}
                              <button
                                onClick={() => showConfirm(
                                  `Hapus pendaftaran ${s.code} dari ${s.sellerName}? Jejaknya hilang permanen.`,
                                  () => hapusSubmission(s))}
                                className="px-3 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-500 rounded-lg transition-colors"
                                title="Hapus (untuk spam)"
                              ><Trash2 className="w-3.5 h-3.5" /></button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}

                {(adminSubTab === 'products' || adminSubTab === 'products_offline') && (() => {
                  const offline = adminSubTab === 'products_offline';
                  const groups = offline ? offlineByTenant : productsByTenant;
                  return (
                  <div className="space-y-4 animate-in fade-in duration-300">
                    <div className="flex justify-between items-center bg-white p-3 rounded-xl shadow-sm border gap-3">
                      <div className="min-w-0">
                        <h3 className="font-bold text-sm">{offline ? 'Produk Offline' : 'Produk Online'}</h3>
                        <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">
                          {offline
                            ? 'Hanya muncul di layar Kasir, tidak pernah tampil di halaman pembeli.'
                            : 'Tampil di halaman pembeli sesuai peserta batch.'}
                        </p>
                      </div>
                      <button
                        onClick={() => setProductModal({ isOpen: true, item: null, channel: offline ? 'offline' : 'online' })}
                        className={`px-3 py-2 ${offline ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-indigo-600 hover:bg-indigo-700'} text-white text-[11px] font-bold rounded-lg flex items-center shadow-sm transition-colors shrink-0`}
                      >
                        <Plus className="w-3.5 h-3.5 mr-1" /> Tambah
                      </button>
                    </div>

                    {groups.length === 0 && (
                      <div className="bg-white p-8 rounded-xl border text-center text-xs text-slate-400">
                        {offline ? 'Belum ada produk offline. Tambahkan dulu sebelum membuka Kasir.' : 'Belum ada produk.'}
                      </div>
                    )}

                    {groups.map(({ tenant, items }) => {
                      const kunci = (offline ? 'off-' : 'on-') + tenant.id;
                      return (
                      <div key={kunci} className="bg-white rounded-xl border shadow-sm overflow-hidden">
                        <button
                          onClick={() => setStandTertutup((prev) => ({ ...prev, [kunci]: !prev[kunci] }))}
                          className="w-full flex justify-between items-center gap-2 px-4 py-3 bg-slate-100 hover:bg-slate-200 transition-colors text-left"
                        >
                          <span className="font-bold text-sm text-slate-900">{tenant.name}</span>
                          <span className="flex items-center gap-2">
                            <span className="text-[10px] font-bold bg-white border text-slate-600 px-2 py-0.5 rounded-full">{items.length} produk</span>
                            <span className="text-slate-400 text-xs">{standTertutup[kunci] ? '\u25b8' : '\u25be'}</span>
                          </span>
                        </button>

                        {!standTertutup[kunci] && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3">
                            {items.map((p) => {
                              const hasVariants = Array.isArray(p.variants) && p.variants.length > 0;
                              const sPrice = hasVariants
                                ? Math.min(...p.variants.map((v) => Number(v.priceOwner) + Number(v.priceOrganizer)))
                                : Number(p.priceOwner) + Number(p.priceOrganizer);
                              return (
                                <div key={p.id} className="bg-white p-3 rounded-xl border flex gap-3 items-center shadow-sm">
                                  {p.imageUrl ? (
                                    <img src={p.imageUrl} alt="img" className="w-14 h-14 rounded-lg object-cover border cursor-pointer hover:opacity-80 transition-opacity" onClick={() => setZoomedImage(p.imageUrl)} />
                                  ) : (
                                    <div className="w-14 h-14 bg-slate-100 rounded-lg flex items-center justify-center border"><ImageIcon className="w-5 h-5 text-slate-400" /></div>
                                  )}
                                  <div className="flex-1 text-xs min-w-0">
                                    <h4 className="font-bold text-sm text-slate-900">{parseAndCleanItem(p.name)}</h4>
                                    <p className="text-[10px] text-slate-500">{tenant?.name} {p.category && `\u2022 ${p.category}`}</p>
                                    <p className={`font-black mt-1 ${offline ? 'text-emerald-600' : 'text-amber-600'}`}>{hasVariants ? 'Mulai ' : ''}{formatRupiah(sPrice)}</p>
                                    {!hasVariants && (
                                      <p className="text-[9px] text-slate-400 mt-0.5">
                                        Nett {formatRupiah(p.priceOwner)} + margin {formatRupiah(p.priceOrganizer)}
                                      </p>
                                    )}
                                    {hasVariants && <p className="text-[9px] bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded w-fit mt-1 font-bold">{p.variants.length} Varian</p>}

                                    {offline && (
                                      <div className="mt-1.5 pt-1.5 border-t border-slate-100 space-y-1">
                                        {!hasVariants ? (
                                          <BarisStok nama="Stok" stok={p.stock}
                                            onGeser={(d) => geserStok('product', p.id, d)} />
                                        ) : p.variants.map((v) => (
                                          <BarisStok key={v.id} nama={v.name} stok={v.stock}
                                            onGeser={(d) => geserStok('variant', v.id, d)} />
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex flex-col gap-1.5 shrink-0">
                                    <button onClick={() => setProductModal({ isOpen: true, item: p, channel: p.channel })} className="p-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition-colors"><Edit3 className="w-4 h-4" /></button>
                                    <button onClick={() => {
                                      showConfirm(`Hapus produk ${p.name}?`, () => deleteProduct(p.id));
                                    }} className="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                      );
                    })}
                  </div>
                  );
                })()}

                {}
                {adminSubTab === 'batches' && (
                  <div className="space-y-4 animate-in fade-in duration-300">

                    {}
                    <PengaturanPendaftaran
                      batches={batches}
                      regSettings={regSettings}
                      onSimpan={simpanPendaftaran}
                    />

                    {}
                    <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
                      <div className="p-3 sm:p-4 bg-slate-900 text-white">
                        <h3 className="font-bold text-sm">Peserta Batch</h3>
                        <p className="text-[10px] text-slate-300 mt-1 leading-relaxed">
                          Pilih stand yang ikut. Semua produk stand itu otomatis tampil, lalu hilangkan centang
                          produk yang tidak dijual periode ini. Produk tidak perlu dihapus.
                        </p>
                      </div>

                      <div className="p-3 border-b bg-slate-50 flex flex-wrap gap-2 items-center text-xs">
                        <span className="font-bold text-slate-600">Batch:</span>
                        <select
                          value={pesertaBatchId}
                          onChange={(e) => setPesertaBatchId(e.target.value)}
                          className="p-2 border rounded-lg bg-white font-semibold focus:outline-none focus:border-indigo-500"
                        >
                          {batches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                        </select>
                        {(() => {
                          const ikut = batchTenants[pesertaBatchId];
                          const nStand = ikut ? ikut.size : 0;
                          const nOn = products.filter((p) => p.channel === 'online' && produkIkutBatch(p, pesertaBatchId)).length;
                          const nOff = products.filter((p) => p.channel === 'offline' && produkIkutBatch(p, pesertaBatchId)).length;
                          return (
                            <>
                              <span className="bg-indigo-50 text-indigo-700 px-2 py-1 rounded font-bold">{nStand} stand ikut</span>
                              <span className="bg-amber-50 text-amber-700 px-2 py-1 rounded font-bold">{nOn} produk online</span>
                              <span className="bg-emerald-50 text-emerald-700 px-2 py-1 rounded font-bold">{nOff} produk offline</span>
                            </>
                          );
                        })()}
                      </div>

                      {!pesertaBatchId ? (
                        <p className="p-6 text-center text-xs text-slate-400">Pilih batch dulu.</p>
                      ) : (
                        <div className="divide-y max-h-[32rem] overflow-y-auto">
                          {semuaByTenant.map(({ tenant, items }) => {
                            const standIkut = !!batchTenants[pesertaBatchId]?.has(tenant.id);
                            return (
                              <div key={tenant.id} className={standIkut ? '' : 'bg-slate-50'}>
                                <label className="flex items-center gap-2.5 px-4 py-2.5 cursor-pointer hover:bg-slate-100 transition-colors">
                                  <input
                                    type="checkbox"
                                    checked={standIkut}
                                    onChange={(e) => toggleStandBatch(pesertaBatchId, tenant.id, e.target.checked)}
                                    className="w-4 h-4 accent-indigo-600 shrink-0"
                                  />
                                  <span className={`font-bold text-xs ${standIkut ? 'text-slate-900' : 'text-slate-400'}`}>{tenant.name}</span>
                                  <span className="text-[10px] text-slate-400 ml-auto">{items.length} produk</span>
                                </label>

                                {standIkut && (
                                  <div className="pl-10 pr-4 pb-3 space-y-2.5">
                                    {[
                                      { kanal: 'online',  label: 'Online',  warna: 'text-amber-700 bg-amber-50',   aksen: 'accent-amber-600' },
                                      { kanal: 'offline', label: 'Offline', warna: 'text-emerald-700 bg-emerald-50', aksen: 'accent-emerald-600' },
                                    ].map(({ kanal, label, warna, aksen }) => {
                                      const sub = items.filter((p) => p.channel === kanal);
                                      if (sub.length === 0) return null;
                                      return (
                                        <div key={kanal}>
                                          <p className={`text-[9px] font-black uppercase tracking-wide px-1.5 py-0.5 rounded w-fit mb-1 ${warna}`}>
                                            {label} &middot; {sub.length}
                                          </p>
                                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
                                            {sub.map((p) => {
                                              const tampil = !batchExclusions[pesertaBatchId]?.has(p.id);
                                              return (
                                                <label key={p.id} className="flex items-center gap-2 py-1 cursor-pointer text-[11px]">
                                                  <input
                                                    type="checkbox"
                                                    checked={tampil}
                                                    onChange={(e) => toggleProdukBatch(pesertaBatchId, p.id, e.target.checked)}
                                                    className={`w-3.5 h-3.5 ${aksen} shrink-0`}
                                                  />
                                                  <span className={tampil ? 'text-slate-700' : 'text-slate-400 line-through'}>
                                                    {parseAndCleanItem(p.name)}
                                                  </span>
                                                </label>
                                              );
                                            })}
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    <div className="flex justify-between items-center bg-white p-3 rounded-xl shadow-sm border">
                      <h3 className="font-bold text-sm">Kelola Batch Periode</h3>
                      <button onClick={() => setBatchModal({ isOpen: true, item: null })} className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold rounded-lg flex items-center shadow-sm transition-colors">
                        <Plus className="w-3.5 h-3.5 mr-1" /> Tambah Batch
                      </button>
                    </div>
                    {batches.map(b => (
                      <div key={b.id} className={`bg-white p-4 rounded-xl border shadow-sm ${b.isActive ? 'border-indigo-400 ring-1 ring-indigo-400' : ''}`}>
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-bold text-sm text-slate-900">{b.name} {b.isActive && <span className="bg-indigo-100 text-indigo-700 text-[9px] px-1.5 py-0.5 rounded ml-1 font-black">AKTIF</span>}</h4>
                            <p className="text-[10px] text-slate-500 mt-1">PO: {formatIndoDate(b.startDate)} s/d {formatIndoDate(b.endDate)}</p>
                            <p className="text-[10px] text-emerald-700 font-bold mt-0.5">Ready: {b.readyDate ? formatIndoDate(b.readyDate) : '-'}</p>
                          </div>
                          <div className="flex gap-2 text-xs">
                            <button onClick={() => setBatchModal({ isOpen: true, item: b })} className="text-blue-600 font-bold bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors">Edit</button>
                            {!b.isActive && (
                              <button onClick={() => {
                                saveBatch({ ...b, isActive: true }, b);
                              }} className="text-white font-bold bg-slate-800 hover:bg-slate-900 px-3 py-1.5 rounded-lg transition-colors">Set Aktif</button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {adminSubTab === 'classes' && (
                  <div className="space-y-4 animate-in fade-in duration-300">
                    <div className="flex justify-between items-center bg-white p-3 rounded-xl shadow-sm border">
                      <h3 className="font-bold text-sm">Routing WA PIC Kelas</h3>
                      <button onClick={() => setClassModal({ isOpen: true, item: null })} className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold rounded-lg flex items-center shadow-sm transition-colors">
                        <Plus className="w-3.5 h-3.5 mr-1" /> Tambah Kelas
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {classesList.map(c => (
                        <div key={c.id} className="bg-white p-3 rounded-xl border shadow-sm flex justify-between items-center">
                          <div>
                            <h4 className="font-bold text-sm text-slate-900">{c.name}</h4>
                            <p className="text-[10px] text-slate-500 font-medium mt-0.5">WA PIC: {c.phone}</p>
                          </div>
                          <div className="flex gap-1.5">
                            <button onClick={() => setClassModal({ isOpen: true, item: c })} className="p-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition-colors"><Edit3 className="w-4 h-4" /></button>
                            <button onClick={() => {
                                showConfirm(`Hapus kelas ${c.name}?`, () => deleteClass(c.id));
                              }} className="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {adminSubTab === 'tenants' && (
                  <div className="space-y-4 animate-in fade-in duration-300">
                    <div className="flex justify-between items-center bg-white p-3 rounded-xl shadow-sm border">
                      <h3 className="font-bold text-sm">Kelola Stand / Tenant</h3>
                      <button onClick={() => setTenantModal({ isOpen: true, item: null })} className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold rounded-lg flex items-center shadow-sm transition-colors">
                        <Plus className="w-3.5 h-3.5 mr-1" /> Tambah Stand
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-500 bg-slate-100 px-3 py-2 rounded-lg leading-relaxed">
                      Urutan di bawah ini menentukan urutan tampil di halaman pembeli. Yang paling atas muncul
                      paling dulu. Pakai tombol panah untuk menggesernya.
                    </p>

                    <div className="space-y-2">
                      {tenantsUrut.map((t, idx) => (
                        <div key={t.id} className="bg-white p-3 rounded-xl border shadow-sm flex items-center gap-3">
                          <div className="flex flex-col gap-0.5 shrink-0">
                            <button
                              onClick={() => moveTenant(t.id, -1)}
                              disabled={idx === 0}
                              aria-label={`Naikkan ${t.name}`}
                              className="w-7 h-6 bg-slate-100 hover:bg-slate-200 disabled:opacity-30 disabled:hover:bg-slate-100 text-slate-700 rounded text-[11px] font-bold leading-none transition-colors"
                            >↑</button>
                            <button
                              onClick={() => moveTenant(t.id, 1)}
                              disabled={idx === tenantsUrut.length - 1}
                              aria-label={`Turunkan ${t.name}`}
                              className="w-7 h-6 bg-slate-100 hover:bg-slate-200 disabled:opacity-30 disabled:hover:bg-slate-100 text-slate-700 rounded text-[11px] font-bold leading-none transition-colors"
                            >↓</button>
                          </div>

                          <span className="w-6 text-center text-[11px] font-black text-slate-400 tabular-nums shrink-0">{idx + 1}</span>

                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-sm text-slate-900 truncate">{t.name}</h4>
                            <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">{t.description}</p>
                            <p className="text-[10px] text-emerald-700 font-bold mt-1">WA: {t.phone}</p>
                            {t.bankAccount ? (
                              <p className="text-[10px] text-indigo-700 font-bold mt-0.5 truncate">
                                {t.bankName} {t.bankAccount}{t.bankAccountName ? ` a.n. ${t.bankAccountName}` : ''}
                              </p>
                            ) : (
                              <p className="text-[10px] text-slate-400 italic mt-0.5">Rekening belum diisi</p>
                            )}
                          </div>

                          <div className="flex gap-1.5 shrink-0">
                            <button onClick={() => setTenantModal({ isOpen: true, item: t })} className="p-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition-colors"><Edit3 className="w-4 h-4" /></button>
                            <button onClick={() => {
                                showConfirm(`Hapus stand ${t.name}?`, () => deleteTenant(t.id));
                              }} className="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                </div>
              </div>
            )}
          </main>
        )}

        {}
        {isCartOpen && (
          <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm print:hidden">
            <div className="w-full max-w-sm bg-white h-full flex flex-col shadow-2xl animate-in slide-in-from-right-4 duration-300">
              <div className="p-4 border-b flex justify-between items-center bg-slate-50">
                <h2 className="font-bold text-sm flex items-center text-slate-900"><ShoppingCart className="w-4 h-4 mr-2" /> Keranjang ({cartSummary.totalItems})</h2>
                <button onClick={() => setIsCartOpen(false)} className="p-1.5 bg-slate-200 hover:bg-slate-300 rounded-lg transition-colors"><X className="w-4 h-4 text-slate-600" /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50">
                {cart.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-xl text-xs shadow-sm">
                    <div>
                      <h4 className="font-bold line-clamp-1 text-slate-800">{parseAndCleanItem(item.name)}</h4>
                      <p className="text-[11px] text-amber-600 font-black mt-0.5">{formatRupiah((Number(item.priceOwner) + Number(item.priceOrganizer)) * item.qty)}</p>
                    </div>
                    <div className="flex items-center space-x-2 bg-slate-50 border p-1 rounded-lg">
                      <button onClick={() => updateCartQty(item.id, -1)} className="w-6 h-6 bg-white rounded shadow-sm text-xs font-bold text-slate-600 hover:bg-slate-100">-</button>
                      <span className="text-[11px] font-bold w-4 text-center">{item.qty}</span>
                      <button onClick={() => updateCartQty(item.id, 1)} className="w-6 h-6 bg-amber-500 hover:bg-amber-600 text-white rounded shadow-sm text-xs font-bold transition-colors">+</button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-4 border-t bg-white shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
                <div className="flex justify-between font-black text-sm mb-3 text-slate-800">
                  <span>Total:</span>
                  <span className="text-amber-600">{formatRupiah(cartSummary.totalSellingPrice)}</span>
                </div>
                <button disabled={!isOrderingOpen} onClick={() => { setIsCartOpen(false); setIsCheckoutModalOpen(true); }} className="w-full py-3 bg-amber-600 hover:bg-amber-700 disabled:bg-slate-300 disabled:cursor-not-allowed disabled:hover:bg-slate-300 text-white font-bold rounded-xl shadow-md text-sm flex items-center justify-center transition-colors">
                  {isOrderingOpen ? <>Lanjut Checkout <Send className="w-4 h-4 ml-2" /></> : <><Clock className="w-4 h-4 mr-2" /> Periode Ditutup</>}
                </button>
              </div>
            </div>
          </div>
        )}

        {isCheckoutModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm print:hidden">
            <div className="bg-white rounded-2xl w-full max-w-sm p-5 relative shadow-2xl animate-in zoom-in-95 duration-200">
              <button onClick={() => setIsCheckoutModalOpen(false)} className="absolute top-4 right-4 p-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-500 transition-colors"><X className="w-4 h-4" /></button>
              <h3 className="font-black text-base mb-1 text-slate-900">Data Pemesan</h3>
              <p className="text-xs text-slate-500 mb-4 pb-4 border-b">Pesanan dicatat untuk: {activeBatch?.name}</p>
              
              <form onSubmit={handleCheckoutSubmit} className="space-y-3.5 text-xs">
                <div>
                  <label className="block font-bold mb-1 text-slate-700">Nama Lengkap Anak <span className="text-red-500">*</span></label>
                  <input type="text" required value={checkoutData.namaAnak} onChange={(e) => setCheckoutData({ ...checkoutData, namaAnak: e.target.value })} className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:border-amber-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block font-bold mb-1 text-slate-700">Pilih Kelas Anak <span className="text-red-500">*</span></label>
                  <select value={checkoutData.kelas} onChange={(e) => setCheckoutData({ ...checkoutData, kelas: e.target.value })} className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:border-amber-500 focus:outline-none">
                    {classesList.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block font-bold mb-1 text-slate-700">Nama Ortu (Wajib) <span className="text-red-500">*</span></label>
                  <input type="text" required placeholder="Cth: Mama Budi" value={checkoutData.namaOrtu} onChange={(e) => setCheckoutData({ ...checkoutData, namaOrtu: e.target.value })} className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:border-amber-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block font-bold mb-1 text-slate-700">Catatan (Opsional)</label>
                  <input type="text" placeholder="Cth: Jangan pedas ya" value={checkoutData.catatan} onChange={(e) => setCheckoutData({ ...checkoutData, catatan: e.target.value })} className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:border-amber-500 focus:outline-none" />
                </div>
                
                <div className="bg-amber-50 rounded-xl p-3 border border-amber-100 flex justify-between font-black text-sm text-slate-900 my-2">
                  <span>Total Tagihan:</span>
                  <span className="text-amber-600">{formatRupiah(cartSummary.totalSellingPrice)}</span>
                </div>

                <button type="submit" disabled={isSubmitting} className="w-full py-3.5 mt-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md disabled:opacity-50 text-sm flex items-center justify-center transition-colors">
                  {isSubmitting ? 'Memproses Data...' : <><MessageCircle className="w-4 h-4 mr-2" /> Kirim Pesanan (WA)</>}
                </button>
              </form>
            </div>
          </div>
        )}

        {}
        {isFilterModalOpen && (
          <div className="fixed inset-0 z-[60] flex justify-end sm:items-center sm:justify-center bg-black/60 backdrop-blur-sm print:hidden">
            <div className="w-full sm:max-w-md bg-white h-auto max-h-[85vh] sm:rounded-2xl rounded-t-2xl flex flex-col shadow-2xl animate-in slide-in-from-bottom-4 sm:slide-in-from-bottom-0 sm:zoom-in-95 mt-auto sm:mt-0">
              <div className="p-4 border-b flex justify-between items-center bg-slate-50 sm:rounded-t-2xl rounded-t-2xl">
                <h2 className="font-bold text-sm flex items-center text-slate-900"><Filter className="w-4 h-4 mr-2" /> Filter & Urutkan</h2>
                <button onClick={() => setIsFilterModalOpen(false)} className="p-1.5 bg-slate-200 hover:bg-slate-300 rounded-lg transition-colors"><X className="w-4 h-4 text-slate-600" /></button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin">
                <div>
                  <h3 className="font-bold text-xs text-slate-500 uppercase tracking-wider mb-3">Urutkan Abjad</h3>
                  <div className="grid grid-cols-3 gap-2">
                     <button onClick={() => setSortOrder('default')} className={`py-2 rounded-xl text-xs font-bold border transition-colors ${sortOrder === 'default' ? 'bg-amber-100 border-amber-500 text-amber-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}>Default</button>
                     <button onClick={() => setSortOrder('az')} className={`py-2 rounded-xl text-xs font-bold border transition-colors ${sortOrder === 'az' ? 'bg-amber-100 border-amber-500 text-amber-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}>A - Z</button>
                     <button onClick={() => setSortOrder('za')} className={`py-2 rounded-xl text-xs font-bold border transition-colors ${sortOrder === 'za' ? 'bg-amber-100 border-amber-500 text-amber-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}>Z - A</button>
                  </div>
                </div>

                <div>
                  <h3 className="font-bold text-xs text-slate-500 uppercase tracking-wider mb-3">Pilih Kategori Produk</h3>
                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => setSelectedCategoryFilter('all')} className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${selectedCategoryFilter === 'all' ? 'bg-amber-600 border-amber-600 text-white shadow-sm' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300'}`}>Semua Kategori</button>
                    {availableCategories.map(c => (
                      <button key={c} onClick={() => setSelectedCategoryFilter(c)} className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${selectedCategoryFilter === c ? 'bg-amber-600 border-amber-600 text-white shadow-sm' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300'}`}>{c}</button>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-bold text-xs text-slate-500 uppercase tracking-wider mb-3">Pilih Stand / Tenant</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => setSelectedTenantFilter('all')} className={`text-left px-3 py-2.5 rounded-xl text-xs font-bold border transition-colors flex items-center justify-center ${selectedTenantFilter === 'all' ? 'bg-amber-100 border-amber-500 text-amber-800' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}>Semua Stand</button>
                    {tenants.map(t => (
                      <button key={t.id} onClick={() => setSelectedTenantFilter(t.id)} className={`text-left px-3 py-2 rounded-xl text-xs font-bold border transition-colors flex flex-col justify-center items-start ${selectedTenantFilter === t.id ? 'bg-amber-100 border-amber-500 text-amber-800' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                        <span className="line-clamp-1 w-full">{t.name}</span>
                        {t.description && <span className="font-normal text-[9px] text-slate-500 mt-0.5 line-clamp-1 w-full">{t.description}</span>}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-4 border-t bg-white shadow-md sm:rounded-b-2xl flex gap-2">
                <button 
                  onClick={() => { setSelectedCategoryFilter('all'); setSelectedTenantFilter('all'); setSortOrder('default'); }} 
                  className="px-4 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl text-sm transition-colors"
                >
                  <RotateCcw className="w-4 h-4 mx-auto" />
                </button>
                <button 
                  onClick={() => setIsFilterModalOpen(false)} 
                  className="flex-1 py-3.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shadow-md text-sm transition-colors"
                >
                  Terapkan Filter
                </button>
              </div>
            </div>
          </div>
        )}

        {}
        {variantModal.isOpen && (
          <VariantSelectionModal 
            pos={variantModal.pos}
            product={variantModal.product} 
            onClose={() => setVariantModal({ isOpen: false, product: null })}
            onAddToCart={(chosenProduct, qty) => {
               if (variantModal.pos) {
                 // Keranjang kasir memakai kunci yang sama: `${productId}|${variantId}`.
                 const [productId, variantId] = String(chosenProduct.id).split('|');
                 posTambah({
                   key: chosenProduct.id,
                   productId,
                   variantId: Number(variantId) || null,
                   name: chosenProduct.name,
                   tenantName: tenants.find((t) => t.id === chosenProduct.tenantId)?.name || '',
                   tenantId: chosenProduct.tenantId,
                   stok: chosenProduct.stok ?? null,
                   price: Number(chosenProduct.priceOwner) + Number(chosenProduct.priceOrganizer),
                 }, qty);
               } else {
                 addToCart(chosenProduct, qty);
               }
               setVariantModal({ isOpen: false, product: null });
            }}
            setGlobalZoom={setZoomedImage}
          />
        )}

        {productModal.isOpen && (
          <ModalProductForm
            item={productModal.item}
            tenants={tenants}
            onClose={() => setProductModal({ isOpen: false, item: null })}
            channel={productModal.channel || productModal.item?.channel || 'online'}
            sumberOnline={productsByTenant}
            kunciOffline={kunciOffline}
            onSave={(formData) => {
              saveProduct(formData, productModal.item);
              setProductModal({ isOpen: false, item: null });
            }}
          />
        )}

        {reviewModal.isOpen && reviewModal.item && (() => {
          const s = reviewModal.item;
          return (
            <ModalProductForm
              channel={s.channel}
              channelBisaDiubah
              isiMarginOtomatis
              judul={`Review Pendaftaran ${s.code}`}
              labelSimpan="Setujui & Masukkan ke Produk Offline"
              standBaru={s.tenantId ? '' : s.tenantBaru}
              item={{
                name: s.name,
                tenantId: s.tenantId || (s.tenantBaru ? STAND_BARU : ''),
                category: s.category || PREDEFINED_CATEGORIES[0],
                priceOwner: s.priceOwner || '',
                priceOrganizer: '',          // sengaja kosong: ini bagian admin
                imageUrl: s.imageUrl,
                description: s.description,
                stock: s.stock,
                variants: s.variants.map((v) => ({
                  name: v.name, priceOwner: v.priceOwner,
                  priceOrganizer: '', stock: v.stock,
                })),
              }}
              tenants={tenants}
              catatanAtas={(
                <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-[10px] leading-relaxed">
                  <p className="font-bold text-amber-900 text-xs mb-1">Dikirim oleh penjual</p>
                  <p className="text-amber-900">{s.sellerName} &middot; {s.sellerPhone}</p>
                  <p className="text-amber-800 mt-0.5">
                    {s.tenantId
                      ? `Stand: ${tenants.find((t) => t.id === s.tenantId)?.name || s.tenantId}`
                      : `Mengajukan stand baru: ${s.tenantBaru}`}
                    {' · '}{formatIndoDate(String(s.createdAt).slice(0, 10))}
                  </p>
                  <p className="text-amber-800 mt-0.5">
                    Diminta untuk: <b>{LABEL_KANAL[s.channel] || s.channel}</b>
                  </p>
                  {!s.tenantId && s.bankAccount && (
                    <p className="text-amber-900 mt-0.5">
                      Rekening stand baru: <b>{s.bankName} {s.bankAccount}</b>
                      {s.bankAccountName ? ` a.n. ${s.bankAccountName}` : ''}
                      <span className="block text-amber-700">Periksa dulu nomornya sebelum menyetujui &mdash; ini yang dipakai membayar hasil penjualannya.</span>
                    </p>
                  )}
                  <p className="mt-1.5 text-amber-900 font-bold">
                    Margin sudah diisi otomatis: 10% dengan harga jual dibulatkan ke atas ke
                    Rp 500. Periksa dan ubah kalau perlu.
                  </p>
                </div>
              )}
              onClose={() => setReviewModal({ isOpen: false, item: null })}
              onSave={(formData) => {
                approveSubmission(s, formData);
                setReviewModal({ isOpen: false, item: null });
              }}
            />
          );
        })()}

        {tolakModal.isOpen && tolakModal.item && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm print:hidden">
            <div className="bg-white rounded-2xl w-full max-w-xs p-5 shadow-xl">
              <h3 className="font-bold text-sm mb-1">Tolak pendaftaran {tolakModal.item.code}?</h3>
              <p className="text-[10px] text-slate-500 mb-3 leading-relaxed">
                Pendaftaran tidak dihapus, hanya ditandai ditolak beserta alasannya &mdash;
                supaya ada jejaknya kalau penjual bertanya.
              </p>
              <textarea
                rows={3} autoFocus
                placeholder="Alasan, misal: foto kurang jelas / harga belum masuk akal"
                value={tolakModal.note}
                onChange={(e) => setTolakModal((p) => ({ ...p, note: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-rose-400"
              />
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => setTolakModal({ isOpen: false, item: null, note: '' })}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors"
                >Batal</button>
                <button
                  onClick={() => {
                    rejectSubmission(tolakModal.item, tolakModal.note);
                    setTolakModal({ isOpen: false, item: null, note: '' });
                  }}
                  className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs transition-colors"
                >Tolak</button>
              </div>
            </div>
          </div>
        )}

        {orderDetail && (() => {
          // Dibaca ulang dari daftar, bukan dari salinan saat diklik: kalau
          // statusnya diganti dari dalam popup, yang tampil harus ikut berubah.
          const ord = orders.find((o) => o.orderId === orderDetail.orderId) || orderDetail;
          const cust = ord.customer && typeof ord.customer === 'object' ? ord.customer : {};
          const items = enrichOrderItems(ord) || [];
          const offline = (ord.channel || 'online') === 'offline';
          return (
            <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm print:hidden">
              <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-md shadow-2xl flex flex-col max-h-[88vh] animate-in slide-in-from-bottom-4 sm:slide-in-from-bottom-0 sm:zoom-in-95">
                <div className="p-4 border-b border-slate-100 shrink-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <span className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-black text-indigo-700 text-sm">{ord.orderId}</span>
                        {offline ? (
                          <span className="text-[9px] font-black bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded">
                            OFFLINE{ord.paymentMethod ? ` · ${ord.paymentMethod}` : ''}
                          </span>
                        ) : (
                          <span className="text-[9px] font-black bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">ONLINE</span>
                        )}
                      </span>
                      <p className="font-bold text-slate-900 text-sm mt-1 leading-tight">{cust?.namaAnak || 'Unknown'}</p>
                      <p className="text-[11px] text-slate-500">
                        {cust?.kelas || '-'}{cust?.namaOrtu && cust.namaOrtu !== '-' ? ` · Ortu: ${cust.namaOrtu}` : ''}
                      </p>
                      {ord.date && (
                        <p className="text-[10px] text-slate-400 mt-0.5">{formatIndoDate(String(ord.date).slice(0, 10))}</p>
                      )}
                    </div>
                    <button
                      onClick={() => setOrderDetail(null)}
                      className="p-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg shrink-0 transition-colors"
                    ><X className="w-4 h-4 text-slate-500" /></button>
                  </div>
                </div>

                <div className="p-4 overflow-y-auto flex-1 text-xs">
                  {items.map((i, idx) => (
                    <div key={idx} className="flex justify-between items-start gap-3 py-1.5 border-b border-slate-50">
                      <div className="min-w-0">
                        <p className="font-bold text-slate-800">{parseAndCleanItem(i?.name)} (x{i?.qty || 1})</p>
                        <p className="text-[9px] text-slate-400">{tenants.find((t) => t.id === i?.tenantId)?.name || 'Stand'}</p>
                      </div>
                      <span className="font-medium text-slate-600 shrink-0">{formatRupiah(i?.subtotal || 0)}</span>
                    </div>
                  ))}
                  {cust?.catatan && cust.catatan !== '-' && (
                    <p className="text-[10px] text-orange-600 font-medium italic mt-2">Catatan: {cust.catatan}</p>
                  )}
                  <div className="flex justify-between font-black text-slate-900 pt-3 mt-2 border-t">
                    <span>Total Nominal Pesanan</span>
                    <span className="text-amber-600">{formatRupiah(ord.totalAmount || 0)}</span>
                  </div>
                </div>

                <div className="p-4 border-t border-slate-100 flex items-center gap-2 shrink-0 bg-white rounded-b-2xl">
                  <select
                    value={ord.status || 'Unpaid'}
                    onChange={(e) => updateOrderStatusDirect(ord.orderId, e.target.value)}
                    className="flex-1 text-xs font-bold px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Unpaid">Unpaid</option>
                    <option value="Paid">Paid</option>
                    <option value="Selesai">Selesai</option>
                    <option value="Batal">Batal</option>
                  </select>
                  <button
                    onClick={() => {
                      showConfirm(`Yakin HAPUS pesanan ${ord.orderId}? Data akan terhapus permanen.`, () => {
                        setOrderDetail(null);
                        deleteOrder(ord.orderId);
                      });
                    }}
                    className="p-2.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl transition-colors"
                    title="Hapus pesanan"
                  ><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            </div>
          );
        })()}

        {tenantModal.isOpen && (
          <ModalTenantForm
            item={tenantModal.item}
            onClose={() => setTenantModal({ isOpen: false, item: null })}
            onSave={(formData) => {
              saveTenant(formData, tenantModal.item);
              setTenantModal({ isOpen: false, item: null });
            }}
          />
        )}

        {batchModal.isOpen && (
          <ModalBatchForm
            item={batchModal.item}
            onClose={() => setBatchModal({ isOpen: false, item: null })}
            onSave={(formData) => {
              saveBatch(formData, batchModal.item);
              setBatchModal({ isOpen: false, item: null });
            }}
          />
        )}

        {classModal.isOpen && (
          <ModalClassForm
            item={classModal.item}
            onClose={() => setClassModal({ isOpen: false, item: null })}
            onSave={(formData) => {
              saveClass(formData, classModal.item);
              setClassModal({ isOpen: false, item: null });
            }}
          />
        )}
      </div>

      {}
      {}
      {printOrders && (
        <div className="fixed inset-0 z-[9999] bg-slate-100 overflow-y-auto print:absolute print:inset-0 print:block print:w-full print:bg-white print:overflow-visible print:h-auto">
          <style>{`
            @media print {
              @page { size: A4 landscape; margin: 10mm 8mm; }
              body { margin: 0; background-color: white; }
              html, body { height: max-content !important; overflow: visible !important; }
              .no-print { display: none !important; }
              * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
              /* Kunci: tiap pesanan satu <tbody>, dan tbody tidak boleh dipotong.
                 Ini yang bikin baris Total tidak lagi nyangkut ke halaman berikutnya. */
              tbody.order-block { break-inside: avoid; page-break-inside: avoid; }
              tr { break-inside: avoid; page-break-inside: avoid; }
              thead { display: table-header-group; }
              tfoot { display: table-row-group; }   /* jangan diulang tiap halaman */
              .doc-summary { break-inside: avoid; page-break-inside: avoid; }
              .doc-header { break-after: avoid; page-break-after: avoid; }
            }
          `}</style>

          <div className="no-print sticky top-0 bg-slate-900 text-white p-4 shadow-md flex justify-between items-center z-50">
            <h2 className="font-bold text-sm">Cetak Daftar Pesanan — {printOrders.label}</h2>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => window.print()} className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded-lg text-xs font-bold transition-colors">
                Simpan sbg PDF
              </button>
              <button onClick={() => setPrintOrders(null)} className="px-3 py-1.5 bg-slate-700 hover:bg-slate-800 rounded-lg text-xs font-bold transition-colors">
                Tutup
              </button>
            </div>
          </div>

          <div className="p-6 max-w-6xl mx-auto bg-white text-black text-[9.5px] print:p-0 print:m-0 print:w-full print:max-w-none shadow-xl print:shadow-none my-8 print:my-0">
            <div className="doc-header border-b-2 border-slate-800 pb-2 mb-3">
              <h2 className="text-sm font-bold text-slate-900">Daftar Pesanan Bazaar DANUS — PTA Little Darbi</h2>
              <p className="text-[9.5px] text-slate-600 mt-0.5">
                Filter: {printOrders.label} &nbsp;|&nbsp; {printOrders.list.length} pesanan
                ({printOrders.summary.paid} Paid, {printOrders.summary.unpaid} Unpaid)
                &nbsp;|&nbsp; Dicetak: {new Date().toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' })}
              </p>
            </div>

            <table className="w-full border-collapse" style={{ tableLayout: 'fixed' }}>
              <colgroup>
                <col style={{ width: '8%' }} /><col style={{ width: '7%' }} /><col style={{ width: '15%' }} />
                <col style={{ width: '12%' }} /><col style={{ width: '9%' }} /><col style={{ width: '25%' }} />
                <col style={{ width: '4%' }} /><col style={{ width: '9%' }} />
                <col style={{ width: '7%' }} /><col style={{ width: '6%' }} />
              </colgroup>
              <thead>
                <tr className="bg-slate-800 text-white">
                  <th className="border border-slate-400 p-1 text-left">No Order</th>
                  <th className="border border-slate-400 p-1 text-left">Tanggal</th>
                  <th className="border border-slate-400 p-1 text-left">Nama Anak</th>
                  <th className="border border-slate-400 p-1 text-left">Kelas</th>
                  <th className="border border-slate-400 p-1 text-left">Ortu</th>
                  <th className="border border-slate-400 p-1 text-left">Produk</th>
                  <th className="border border-slate-400 p-1 text-center">Qty</th>
                  <th className="border border-slate-400 p-1 text-right">Subtotal</th>
                  <th className="border border-slate-400 p-1 text-center">Kanal</th>
                  <th className="border border-slate-400 p-1 text-center">Status</th>
                </tr>
              </thead>

              {printOrders.list.map((ord, oi) => {
                const c = ord.customer || {};
                const items = enrichOrderItems(ord);
                const rowCount = Math.max(items.length, 1);
                const orderTotal = items.reduce((n, it) => n + (Number(it.subtotal) || 0), 0);
                const tgl = ord.date ? new Date(ord.date) : null;
                const tglStr = tgl && !isNaN(tgl)
                  ? tgl.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: '2-digit' })
                  : '-';
                const isPaid = (ord.status || 'Unpaid') === 'Paid';
                const zebra = oi % 2 ? 'bg-slate-50' : '';
                const hasCatatan = c.catatan && String(c.catatan).trim() !== '' && String(c.catatan).trim() !== '-';
                return (
                  <tbody key={ord.orderId || oi} className="order-block">
                    {(items.length ? items : [null]).map((it, ii) => (
                      <tr key={ii} className={zebra}>
                        {ii === 0 && <td rowSpan={rowCount} className="border border-slate-400 p-1 font-bold align-top break-words">{ord.orderId || '-'}</td>}
                        {ii === 0 && <td rowSpan={rowCount} className="border border-slate-400 p-1 align-top">{tglStr}</td>}
                        {ii === 0 && <td rowSpan={rowCount} className="border border-slate-400 p-1 align-top break-words">{c.namaAnak || '-'}</td>}
                        {ii === 0 && <td rowSpan={rowCount} className="border border-slate-400 p-1 align-top break-words">{c.kelas || '-'}</td>}
                        {ii === 0 && <td rowSpan={rowCount} className="border border-slate-400 p-1 align-top break-words">{c.namaOrtu || '-'}</td>}
                        <td className="border border-slate-400 p-1 break-words">{it ? parseAndCleanItem(it.name) : '(tidak ada item)'}</td>
                        <td className="border border-slate-400 p-1 text-center">{it ? (it.qty || 1) : '-'}</td>
                        <td className="border border-slate-400 p-1 text-right whitespace-nowrap">{it ? formatRupiah(it.subtotal) : '-'}</td>
                        {ii === 0 && (
                          <td rowSpan={rowCount} className="border border-slate-400 p-1 text-center align-top text-[9px]">
                            {(ord.channel || 'online') === 'offline' ? 'Offline' : 'Online'}
                            {ord.paymentMethod ? <><br />{ord.paymentMethod}</> : null}
                          </td>
                        )}
                        {ii === 0 && (
                          <td rowSpan={rowCount} className={`border border-slate-400 p-1 text-center font-bold align-top ${isPaid ? 'text-emerald-700' : 'text-red-600'}`}>
                            {ord.status || 'Unpaid'}
                          </td>
                        )}
                      </tr>
                    ))}
                    <tr className="bg-slate-200">
                      <td colSpan={6} className="border border-slate-400 p-1 text-right font-bold">
                        Total {ord.orderId || '-'}
                        {hasCatatan && <span className="font-normal italic text-slate-600"> — Catatan: {c.catatan}</span>}
                      </td>
                      <td colSpan={3} className="border border-slate-400 p-1 text-right font-bold whitespace-nowrap">{formatRupiah(orderTotal)}</td>
                    </tr>
                  </tbody>
                );
              })}
            </table>

            {}
            <div className="doc-summary mt-4 border-t-2 border-slate-800 pt-3">
              <div className="flex justify-between items-center bg-slate-800 text-white px-3 py-2 rounded-t">
                <span className="font-bold">TOTAL KESELURUHAN — {printOrders.list.length} pesanan, {printOrders.summary.items} item</span>
                <span className="font-bold text-xs">{formatRupiah(printOrders.summary.gross)}</span>
              </div>
              <div className="grid grid-cols-3 border border-t-0 border-slate-400">
                <div className="p-2 border-r border-slate-400">
                  <div className="text-slate-500">Hak Vendor</div>
                  <div className="font-bold text-emerald-700 text-xs">{formatRupiah(printOrders.summary.owner)}</div>
                </div>
                <div className="p-2 border-r border-slate-400">
                  <div className="text-slate-500">Hak Panitia</div>
                  <div className="font-bold text-orange-700 text-xs">{formatRupiah(printOrders.summary.org)}</div>
                </div>
                <div className="p-2">
                  <div className="text-slate-500">Status</div>
                  <div className="font-bold text-slate-900 text-xs">{printOrders.summary.paid} Paid / {printOrders.summary.unpaid} Unpaid</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}


      {printData && (
        <div className="fixed inset-0 z-[9999] bg-slate-100 overflow-y-auto print:absolute print:inset-0 print:block print:w-full print:bg-white print:overflow-visible print:h-auto">
          <style>{`
            @media print {
              @page { size: auto; margin: 0mm; }
              body { margin: 10mm; background-color: white; }
              html, body { height: max-content !important; overflow: visible !important; }
              .no-print { display: none !important; }
              * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
              .page-break-inside-avoid { break-inside: avoid; page-break-inside: avoid; }
            }
          `}</style>
          
          <div className="no-print sticky top-0 bg-slate-900 text-white p-4 shadow-md flex justify-between items-center z-50">
             <h2 className="font-bold text-sm">Mode Export PDF & WA</h2>
             <div className="flex flex-wrap gap-2">
               <button onClick={() => window.print()} className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded-lg text-xs font-bold transition-colors">
                 1. Simpan sbg PDF
               </button>
               <button 
                 onClick={() => {
                   let cleanPhone = printData.tenantRep.tenantPhone ? String(printData.tenantRep.tenantPhone).replace(/[^0-9]/g, '') : '';
                   if (cleanPhone.startsWith('0')) cleanPhone = '62' + cleanPhone.slice(1);
                   let text = `Halo Ibu/Bapak, berikut kami lampirkan dokumen PDF Rekapitulasi Pesanan Bazaar DANUS untuk Stand ${printData.tenantRep.tenantName}. Terima Kasih!`;
                   if(cleanPhone.length > 5) {
                       setTimeout(() => {
                         window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`, '_blank');
                       }, 100);
                   } else {
                       showToast("Nomor WA tenant tidak valid.");
                   }
                 }} 
                 className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 rounded-lg text-xs font-bold transition-colors"
               >
                 2. Buka WA & Lampirkan PDF
               </button>
               <button onClick={() => setPrintData(null)} className="px-3 py-1.5 bg-slate-700 hover:bg-slate-800 rounded-lg text-xs font-bold transition-colors">
                 Tutup
               </button>
             </div>
          </div>
          
          <div className="p-6 max-w-4xl mx-auto bg-white text-black text-[10px] sm:text-[11px] print:p-0 print:m-0 print:w-full print:max-w-none shadow-xl print:shadow-none my-8 print:my-0 page-break-inside-avoid">
            <h1 className="text-lg font-black text-emerald-800 mb-0.5">Bazaar DANUS PTA Little Darbi</h1>
            <h2 className="text-sm font-bold text-slate-900">Rekapitulasi Dapur Stand: {printData.tenantRep?.tenantName || '-'}</h2>
            <p className="text-[10px] text-slate-500 mb-5 border-b border-slate-300 pb-2">
              Periode: {printData.currentBatch?.name || '-'} | Ready: {printData.currentBatch?.readyDate ? formatIndoDate(printData.currentBatch.readyDate) : '-'} | Deskripsi: {printData.tenantRep?.tenantDesc || '-'} ({printData.tenantRep?.tenantPhone || '-'})
            </p>
            <p className="text-[11px] mt-1 font-bold text-slate-900">
              Online {formatRupiah(printData.tenantRep?.grossOnline || 0)} &middot; Offline/Kasir {formatRupiah(printData.tenantRep?.grossOffline || 0)}
            </p>
            <p className="text-[11px] mt-1 font-bold text-slate-900">
              {printData.tenantRep?.tenantBankAccount
                ? <>Pembayaran ke: {printData.tenantRep.tenantBankName} {printData.tenantRep.tenantBankAccount}
                    {printData.tenantRep.tenantBankAccountName ? ` a.n. ${printData.tenantRep.tenantBankAccountName}` : ''}</>
                : <span className="font-normal italic text-slate-500">Rekening pembayaran belum diisi di Kelola Stand.</span>}
            </p>

            <h3 className="font-bold mt-5 mb-2 text-xs text-slate-800">1. Detail Pesanan Pembeli ({printData.tenantRep?.customerOrdersDetail?.length || 0})</h3>
            <table className="w-full border-collapse border border-slate-300 text-[10px] mb-6">
               <thead className="bg-slate-50 font-bold text-slate-700">
                 <tr>
                   <th className="border border-slate-300 p-2 w-8 text-center">No</th>
                   <th className="border border-slate-300 p-2">Nama Anak</th>
                   <th className="border border-slate-300 p-2">Kelas</th>
                   <th className="border border-slate-300 p-2">Nama Ortu</th>
                   <th className="border border-slate-300 p-2">Detail Pesanan</th>
                   <th className="border border-slate-300 p-2">Catatan</th>
                 </tr>
               </thead>
               <tbody>
                 {printData.tenantRep?.customerOrdersDetail?.map((cust, idx) => (
                   <tr key={idx}>
                     <td className="border border-slate-300 p-1.5 text-center">{idx + 1}</td>
                     <td className="border border-slate-300 p-1.5 font-bold text-slate-800">{cust.namaAnak}</td>
                     <td className="border border-slate-300 p-1.5">{cust.kelas}</td>
                     <td className="border border-slate-300 p-1.5">{cust.namaOrtu}</td>
                     <td className="border border-slate-300 p-1.5">
                        {cust.items?.map(it => `${parseAndCleanItem(it.name)} (x${it.qty || 1})`).join(', ')}
                     </td>
                     <td className="border border-slate-300 p-1.5 italic text-slate-500">{cust.catatan}</td>
                   </tr>
                 ))}
                 {(!printData.tenantRep?.customerOrdersDetail || printData.tenantRep.customerOrdersDetail.length === 0) && (
                   <tr><td colSpan="6" className="border border-slate-300 p-2 text-center italic text-slate-400">Tidak ada pesanan.</td></tr>
                 )}
               </tbody>
            </table>

            <h3 className="font-bold mt-4 mb-2 text-xs text-slate-800">2. Ringkasan Pesanan (Dapur)</h3>
            <table className="w-full border-collapse border border-slate-300 text-[11px] page-break-inside-avoid">
               <thead className="bg-slate-50 font-bold text-slate-700">
                 <tr>
                   <th className="border border-slate-300 p-2 text-left">Produk</th>
                   <th className="border border-slate-300 p-2 text-center">Qty</th>
                   <th className="border border-slate-300 p-2 text-right">Harga owner</th>
                   <th className="border border-slate-300 p-2 text-right">Margin Jual</th>
                   <th className="border border-slate-300 p-2 text-right">Nominal total</th>
                 </tr>
               </thead>
               <tbody>
                 {printData.tenantRep?.itemTotalsMap && Object.keys(printData.tenantRep.itemTotalsMap).map(name => {
                   const item = printData.tenantRep.itemTotalsMap[name];
                   if (!item) return null;
                   const ownerT = (Number(item.priceOwner) || 0) * (Number(item.qty) || 1);
                   const marginT = (Number(item.priceOrganizer) || 0) * (Number(item.qty) || 1);
                   const grossT = ownerT + marginT;
                   return (
                     <tr key={name}>
                       <td className="border border-slate-300 p-1.5 font-bold text-slate-800">{parseAndCleanItem(name)}</td>
                       <td className="border border-slate-300 p-1.5 text-center font-bold">{item.qty}</td>
                       <td className="border border-slate-300 p-1.5 text-right">{formatRupiah(ownerT)}</td>
                       <td className="border border-slate-300 p-1.5 text-right">{formatRupiah(marginT)}</td>
                       <td className="border border-slate-300 p-1.5 text-right font-black text-slate-800">{formatRupiah(grossT)}</td>
                     </tr>
                   )
                 })}
               </tbody>
               <tfoot className="bg-slate-100 font-black">
                 <tr>
                   <td colSpan={2} className="border border-slate-300 p-2.5 text-right text-emerald-800 uppercase">TOTAL KESELURUHAN:</td>
                   <td className="border border-slate-300 p-2.5 text-right text-emerald-600">{formatRupiah(printData.tenantRep?.tenantTotalOwnerShare || 0)}</td>
                   <td className="border border-slate-300 p-2.5 text-right text-orange-600">{formatRupiah(printData.tenantRep?.tenantTotalMargin || 0)}</td>
                   <td className="border border-slate-300 p-2.5 text-right text-slate-900 text-xs">{formatRupiah(printData.tenantRep?.tenantTotalGross || 0)}</td>
                 </tr>
               </tfoot>
            </table>
          </div>
        </div>
      )}

      {}
      {confirmDialog.isOpen && (
        <ConfirmModal 
          message={confirmDialog.msg} 
          onCancel={() => setConfirmDialog({ isOpen: false, msg: '', onConfirm: null })}
          onConfirm={() => {
            if (confirmDialog.onConfirm) confirmDialog.onConfirm();
            setConfirmDialog({ isOpen: false, msg: '', onConfirm: null });
          }}
        />
      )}

      {zoomedImage && (
        <div className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/90 backdrop-blur-sm print:hidden" onClick={() => setZoomedImage(null)}>
          <button onClick={() => setZoomedImage(null)} className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
          <img src={zoomedImage} alt="Zoomed Product" className="max-w-[95%] max-h-[90vh] object-contain rounded-xl shadow-2xl animate-in zoom-in-95 duration-300" onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </Fragment>
  );
}

function VariantSelectionModal({ product, onClose, onAddToCart, setGlobalZoom, pos = false }) {
  const [selectedVarIndex, setSelectedVarIndex] = useState(() => {
    // Hanya di kasir: varian yang habis tidak boleh jadi pilihan awal, kalau
    // tidak modal terbuka dengan tombol mati dan kasir bingung kenapa.
    if (!pos || !Array.isArray(product?.variants)) return 0;
    const i = product.variants.findIndex((v) => v.stock === null || v.stock === undefined || Number(v.stock) > 0);
    return i >= 0 ? i : 0;
  });
  const [qty, setQty] = useState(1);

  if (!product || !Array.isArray(product.variants) || product.variants.length === 0) return null;

  const selectedVariant = product.variants[selectedVarIndex];
  const stokVar = !pos ? null
    : (selectedVariant.stock === null || selectedVariant.stock === undefined
        ? null : Number(selectedVariant.stock));
  const varHabis = stokVar === 0;
  const unitPrice = Number(selectedVariant.priceOwner) + Number(selectedVariant.priceOrganizer);
  const total = unitPrice * qty;

  return (
    <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm print:hidden">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-sm flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 sm:slide-in-from-bottom-0 sm:zoom-in-95 max-h-[90vh]">
        <div className="relative h-32 sm:h-40 bg-slate-100 w-full shrink-0 group cursor-pointer overflow-hidden" onClick={() => product.imageUrl && setGlobalZoom(product.imageUrl)}>
          <button onClick={(e) => { e.stopPropagation(); onClose(); }} className="absolute top-3 right-3 p-1.5 bg-white/50 backdrop-blur rounded-full text-slate-800 z-10 hover:bg-white/80 transition-colors"><X className="w-5 h-5" /></button>
          {product.imageUrl ? (
            <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
          ) : (
             <div className="w-full h-full flex items-center justify-center text-slate-300"><ImageIcon className="w-8 h-8" /></div>
          )}
        </div>
        
        <div className="p-4 overflow-y-auto bg-white flex-1 scrollbar-thin">
          <h3 className="font-black text-lg text-slate-900 leading-tight mb-1">{parseAndCleanItem(product.name)}</h3>
          {product.description && <p className="text-xs text-slate-500 mb-4">{product.description}</p>}
          
          <h4 className="font-bold text-sm text-slate-800 mb-2">Pilih Varian <span className="text-red-500">*</span></h4>
          <div className="space-y-2 mb-4">
            {product.variants.map((v, idx) => {
              const vPrice = Number(v.priceOwner) + Number(v.priceOrganizer);
              const isSelected = selectedVarIndex === idx;
              const vStok = !pos ? null
                : (v.stock === null || v.stock === undefined ? null : Number(v.stock));
              const vHabis = vStok === 0;
              return (
                <div
                  key={idx}
                  onClick={() => { if (!vHabis) { setSelectedVarIndex(idx); setQty(1); } }}
                  className={`flex justify-between items-center gap-2 p-3 rounded-xl border-2 transition-all ${vHabis ? 'border-slate-100 bg-slate-50 opacity-60 cursor-not-allowed' : isSelected ? 'border-amber-500 bg-amber-50 cursor-pointer' : 'border-slate-100 hover:border-amber-200 cursor-pointer'}`}
                >
                   <span className={`font-bold text-sm ${isSelected && !vHabis ? 'text-amber-700' : 'text-slate-700'}`}>{v.name}</span>
                   <span className="flex items-center gap-2 shrink-0">
                     {pos && vStok !== null && (
                       <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${warnaStok(vStok)}`}>{labelStok(vStok)}</span>
                     )}
                     <span className={`font-black text-sm ${isSelected && !vHabis ? 'text-amber-700' : 'text-slate-600'}`}>{formatRupiah(vPrice)}</span>
                   </span>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between mt-2 pt-4 border-t border-slate-100">
             <span className="font-bold text-sm text-slate-700">Jumlah</span>
             <div className="flex items-center space-x-3 bg-slate-50 p-1 rounded-xl border border-slate-200">
               <button onClick={() => setQty(Math.max(1, qty - 1))} className="w-8 h-8 rounded-lg bg-white shadow-sm font-bold text-slate-600 flex items-center justify-center hover:bg-slate-100">-</button>
               <span className="font-bold w-6 text-center">{qty}</span>
               <button
                 onClick={() => setQty(stokVar !== null ? Math.min(stokVar, qty + 1) : qty + 1)}
                 disabled={stokVar !== null && qty >= stokVar}
                 title={stokVar !== null && qty >= stokVar ? 'Sudah mencapai sisa stok' : ''}
                 className="w-8 h-8 rounded-lg bg-amber-500 text-white shadow-sm font-bold flex items-center justify-center hover:bg-amber-600 transition-colors disabled:bg-slate-300 disabled:cursor-not-allowed"
               >+</button>
             </div>
          </div>
        </div>

        <div className="p-4 bg-white border-t border-slate-100 shadow-[0_-4px_10px_rgba(0,0,0,0.03)] shrink-0">
           <button 
             onClick={() => {
                const compositeProduct = {
                    // Pakai ID varian, bukan namanya: ID inilah yang dikirim
                    // ke create_order dan disimpan di order_items.
                    id: `${product.id}|${selectedVariant.id ?? selectedVariant.name}`,
                    name: `${parseAndCleanItem(product.name)} [${selectedVariant.name}]`,
                    tenantId: product.tenantId,
                    priceOwner: Number(selectedVariant.priceOwner),
                    priceOrganizer: Number(selectedVariant.priceOrganizer),
                    stok: stokVar
                };
                onAddToCart(compositeProduct, qty);
             }}
             disabled={varHabis}
             className={`w-full py-3.5 ${pos ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-amber-600 hover:bg-amber-700'} text-white rounded-xl font-bold flex justify-between items-center px-4 shadow-md transition-colors disabled:bg-slate-300 disabled:cursor-not-allowed`}
           >
             <span>{varHabis ? 'Varian Ini Habis' : pos ? 'Tambah ke Kasir' : 'Tambah Pesanan'}</span>
             <span>{varHabis ? '' : formatRupiah(total)}</span>
           </button>
        </div>
      </div>
    </div>
  );
}

function ConfirmModal({ message, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm print:hidden">
      <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl text-center space-y-4 animate-in zoom-in-95 duration-200">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
        <h3 className="font-bold text-sm text-slate-900">{message}</h3>
        <div className="flex gap-3 justify-center pt-2">
          <button onClick={onCancel} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors">Batal</button>
          <button onClick={onConfirm} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-md transition-colors">Ya, Lanjutkan</button>
        </div>
      </div>
    </div>
  );
}

function ModalClassForm({ item, onClose, onSave }) {
  const [name, setName] = useState(item?.name || '');
  const [phone, setPhone] = useState(item?.phone || '');
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm print:hidden">
      <div className="bg-white rounded-2xl w-full max-w-xs p-6 relative shadow-xl">
        <button onClick={onClose} className="absolute top-4 right-4 p-1.5 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"><X className="w-4 h-4 text-slate-500" /></button>
        <h3 className="font-bold text-base mb-4">{item ? 'Edit Kelas' : 'Tambah Kelas'}</h3>
        <form onSubmit={(e) => { e.preventDefault(); onSave({ name, phone }); }} className="space-y-4 text-xs font-medium">
          <div><label className="block mb-1">Nama Kelas</label><input type="text" required value={name} onChange={e => setName(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500" /></div>
          <div><label className="block mb-1">No WA (Cth: 628...)</label><input type="text" required value={phone} onChange={e => setPhone(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500" /></div>
          <button type="submit" className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md transition-colors">Simpan</button>
        </form>
      </div>
    </div>
  );
}

function ModalTenantForm({ item, onClose, onSave }) {
  const [name, setName] = useState(item?.name || '');
  const [description, setDescription] = useState(item?.description || item?.owner || '');
  const [phone, setPhone] = useState(item?.phone || '');
  const [bankName, setBankName] = useState(item?.bankName || '');
  const [bankAccount, setBankAccount] = useState(item?.bankAccount || '');
  const [bankAccountName, setBankAccountName] = useState(item?.bankAccountName || '');
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm print:hidden">
      <div className="bg-white rounded-2xl w-full max-w-xs p-6 relative shadow-xl max-h-[90vh] overflow-y-auto scrollbar-none">
        <button onClick={onClose} className="absolute top-4 right-4 p-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"><X className="w-4 h-4 text-slate-500" /></button>
        <h3 className="font-bold text-base mb-4">{item ? 'Edit Stand' : 'Tambah Stand'}</h3>
        <form onSubmit={(e) => { e.preventDefault(); onSave({ name, description, phone, bankName, bankAccount, bankAccountName }); }} className="space-y-4 text-xs font-medium">
          <div><label className="block mb-1">Nama Stand</label><input type="text" required value={name} onChange={e => setName(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500" /></div>
          <div><label className="block mb-1">Deskripsi Singkat</label><input type="text" placeholder="Misal: Minuman Dingin & Snack" required value={description} onChange={e => setDescription(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500" /></div>
          <div><label className="block mb-1">No WA (628...)</label><input type="text" required value={phone} onChange={e => setPhone(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500" /></div>

          <div className="pt-3 border-t">
            <p className="font-bold text-slate-700 mb-2">Rekening Pembayaran</p>
            <p className="text-[10px] text-slate-400 mb-2.5 leading-relaxed">Muncul di Rekap Per Stand dan ikut tercetak di PDF rekap. Boleh dikosongkan.</p>
            <div className="space-y-2.5">
              <div><label className="block mb-1">Nama Bank</label><input type="text" placeholder="BCA" value={bankName} onChange={e => setBankName(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500" /></div>
              <div><label className="block mb-1">No Rekening</label><input type="text" inputMode="numeric" placeholder="1234567890" value={bankAccount} onChange={e => setBankAccount(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500" /></div>
              <div><label className="block mb-1">Atas Nama</label><input type="text" placeholder="Nama pemilik rekening" value={bankAccountName} onChange={e => setBankAccountName(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500" /></div>
            </div>
          </div>

          <button type="submit" className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md transition-colors">Simpan</button>
        </form>
      </div>
    </div>
  );
}

function ModalBatchForm({ item, onClose, onSave }) {
  const [form, setForm] = useState({
    name: item?.name || '', 
    startDate: item?.startDate || new Date().toISOString().slice(0, 10), 
    endDate: item?.endDate || new Date().toISOString().slice(0, 10), 
    readyDate: item?.readyDate || '',
    description: item?.description || ''
  });
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm print:hidden">
      <div className="bg-white rounded-2xl w-full max-w-xs p-6 relative shadow-xl">
        <button onClick={onClose} className="absolute top-4 right-4 p-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"><X className="w-4 h-4 text-slate-500" /></button>
        <h3 className="font-bold text-base mb-4">{item ? 'Edit Batch' : 'Buat Batch'}</h3>
        <form onSubmit={(e) => { e.preventDefault(); onSave(form); }} className="space-y-4 text-xs font-medium">
          <div><label className="block mb-1">Nama Batch</label><input type="text" required value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500" /></div>
          <div><label className="block mb-1">Tgl Mulai PO</label><input type="date" required value={form.startDate} onChange={e => setForm({...form, startDate: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500" /></div>
          <div><label className="block mb-1">Tgl Tutup PO</label><input type="date" required value={form.endDate} onChange={e => setForm({...form, endDate: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500" /></div>
          <div><label className="block mb-1 text-emerald-700">Tgl Ready / Distribusi</label><input type="date" required value={form.readyDate} onChange={e => setForm({...form, readyDate: e.target.value})} className="w-full px-3 py-2 border border-emerald-300 rounded-xl bg-emerald-50 focus:outline-none" /></div>
          <button type="submit" className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md transition-colors">Simpan</button>
        </form>
      </div>
    </div>
  );
}

/**
 * Navigasi panel admin.
 *
 * Komponen ini sengaja di level modul, bukan di dalam App: kalau didefinisikan
 * ulang tiap render, state buka/tutup menu HP ikut hilang setiap kali ada
 * perubahan data, dan menunya menutup sendiri saat disentuh.
 */
function NavAdmin({ aktif, pilih, menunggu, onKeluar }) {
  const [buka, setBuka] = useState(false);
  const sekarang = semuaMenuAdmin().find((m) => m.id === aktif);
  const IkonAktif = IKON_MENU[aktif] || List;

  const Baris = ({ item, kompak = false }) => {
    const Ikon = IKON_MENU[item.id] || List;
    const dipilih = aktif === item.id;
    const n = item.badge === 'pendaftaran' ? menunggu : 0;
    return (
      <button
        onClick={() => { pilih(item.id); setBuka(false); }}
        className={`w-full flex items-center gap-2 px-3 ${kompak ? 'py-2.5' : 'py-2'} rounded-lg text-left text-xs font-bold transition-colors ${
          dipilih ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
        }`}
      >
        <Ikon className={`w-3.5 h-3.5 shrink-0 ${dipilih ? 'text-white' : 'text-slate-400'}`} />
        <span className="flex-1 truncate">{item.nama}</span>
        {n > 0 && (
          <span className={`min-w-[16px] h-4 px-1 text-[9px] font-black rounded-full flex items-center justify-center shrink-0 ${
            dipilih ? 'bg-white text-indigo-700' : 'bg-rose-500 text-white'}`}>{n}</span>
        )}
      </button>
    );
  };

  // Kasir dipisah dari grup lain: di hari bazaar ini satu-satunya layar yang
  // dipakai berjam-jam sambil berdiri, jadi tidak boleh ikut tenggelam.
  const TombolKasir = ({ kompak = false }) => (
    <button
      onClick={() => { pilih('kasir'); setBuka(false); }}
      className={`w-full flex items-center gap-2 px-3 ${kompak ? 'py-2.5' : 'py-2.5'} rounded-xl text-left text-xs font-black shadow-sm transition-colors ${
        aktif === 'kasir'
          ? 'bg-emerald-600 text-white'
          : 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
      }`}
    >
      <ShoppingCart className="w-4 h-4 shrink-0" />
      <span className="flex-1">Kasir Offline</span>
    </button>
  );

  const Grup = ({ kompak = false }) => (
    <>
      <TombolKasir kompak={kompak} />
      {MENU_ADMIN.map((g) => (
        <div key={g.label} className="pt-1">
          <p className="px-3 pt-2 pb-1 text-[9px] font-black uppercase tracking-wider text-slate-400">{g.label}</p>
          <div className="space-y-0.5">
            {g.items.map((item) => <Baris key={item.id} item={item} kompak={kompak} />)}
          </div>
        </div>
      ))}
      <div className="pt-2 mt-2 border-t border-slate-200">
        <button
          onClick={() => { setBuka(false); onKeluar(); }}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors"
        >
          <Lock className="w-3.5 h-3.5 shrink-0 text-rose-400" />
          <span className="flex-1">Keluar</span>
        </button>
      </div>
    </>
  );

  return (
    <>
      {}
      <nav className="hidden sm:block w-52 shrink-0 sticky top-20 self-start bg-white rounded-2xl border shadow-sm p-2">
        <Grup />
      </nav>

      {}
      <div className="sm:hidden relative mb-3">
        <button
          onClick={() => setBuka((b) => !b)}
          className="w-full flex items-center gap-2 px-3 py-3 bg-white border rounded-xl shadow-sm text-left"
        >
          <IkonAktif className="w-4 h-4 text-indigo-600 shrink-0" />
          <span className="flex-1 text-sm font-black text-slate-800 truncate">{sekarang?.nama || 'Panel Admin'}</span>
          {menunggu > 0 && aktif !== 'submissions' && (
            <span className="min-w-[18px] h-[18px] px-1 text-[9px] font-black rounded-full bg-rose-500 text-white flex items-center justify-center">{menunggu}</span>
          )}
          <span className={`text-slate-400 text-xs transition-transform ${buka ? 'rotate-180' : ''}`}>&#9662;</span>
        </button>

        {buka && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setBuka(false)} />
            <div className="absolute left-0 right-0 top-full mt-1 z-50 bg-white border rounded-xl shadow-xl p-2 max-h-[70vh] overflow-y-auto">
              <Grup kompak />
            </div>
          </>
        )}
      </div>
    </>
  );
}

/**
 * Kompres gambar di browser sebelum diunggah: maksimal 400px, JPEG 0,75.
 * Satu foto jadi sekitar 30 KB. Yang disimpan di database hanya URL-nya —
 * base64 di dalam baris produk pernah membengkakkan payload sampai ~1,5 MB
 * dan itulah asal bug varian yang hilang.
 */
const kompresGambar = (file, maxDim = 400, kualitas = 0.75) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onerror = () => reject(new Error('Gagal membaca berkas.'));
  reader.onload = (ev) => {
    const img = new Image();
    img.onerror = () => reject(new Error('Berkas itu sepertinya bukan gambar.'));
    img.onload = () => {
      let width = img.width, height = img.height;
      if (width > height) {
        if (width > maxDim) { height *= maxDim / width; width = maxDim; }
      } else if (height > maxDim) { width *= maxDim / height; height = maxDim; }
      const c = document.createElement('canvas');
      c.width = width; c.height = height;
      c.getContext('2d').drawImage(img, 0, 0, width, height);
      c.toBlob(
        (b) => (b ? resolve(b) : reject(new Error('Gagal mengompres gambar.'))),
        'image/jpeg', kualitas
      );
    };
    img.src = ev.target.result;
  };
  reader.readAsDataURL(file);
});

/**
 * Form pendaftaran produk untuk PENJUAL. Dibuka dari halaman depan, tanpa login.
 *
 * Tidak ada kolom margin panitia di sini, dan itu bukan sekadar disembunyikan:
 * fungsi submit_product di server memang tidak menerimanya, dan varian yang
 * dikirim disusun ulang di server supaya kolom asing dibuang.
 */
function FormPendaftaran({ tenants, batchName, onKembali }) {
  const [penjual, setPenjual] = useState({
    kode: '', nama: '', telp: '', tenantId: '', tenantBaru: '',
    bank: '', rekening: '', atasNama: '',
  });
  const kosongProduk = { name: '', category: PREDEFINED_CATEGORIES[0], description: '', priceOwner: '', stock: '', imageUrl: '' };
  const [kanal, setKanal] = useState('online');
  const [produk, setProduk] = useState(kosongProduk);
  const [varian, setVarian] = useState([]);
  const [unggahJalan, setUnggahJalan] = useState(false);
  const [kirimJalan, setKirimJalan] = useState(false);
  const [pesan, setPesan] = useState('');
  const [sukses, setSukses] = useState(null);

  const adaVarian = varian.length > 0;
  const standBaru = penjual.tenantId === STAND_BARU;

  const unggahFoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPesan(''); setUnggahJalan(true);
    try {
      const blob = await kompresGambar(file);
      // Folder submissions/ adalah satu-satunya tempat yang boleh ditulis tanpa
      // login, dan hanya menambah berkas — tidak menimpa. Karena itu namanya
      // dibuat acak dan upsert dimatikan.
      const path = `submissions/${Date.now()}-${Math.random().toString(36).slice(2, 10)}.jpg`;
      const { error } = await supabase.storage
        .from(IMAGE_BUCKET).upload(path, blob, { contentType: 'image/jpeg', upsert: false });
      if (error) throw error;
      const { data } = supabase.storage.from(IMAGE_BUCKET).getPublicUrl(path);
      setProduk((p) => ({ ...p, imageUrl: data.publicUrl }));
    } catch (err) {
      setPesan('Gagal mengunggah foto: ' + (err.message || 'coba lagi'));
    } finally {
      setUnggahJalan(false);
      e.target.value = '';
    }
  };

  const kirim = async (ev) => {
    ev.preventDefault();
    if (kirimJalan || unggahJalan) return;
    setPesan('');

    if (standBaru && penjual.tenantBaru.trim() === '') {
      setPesan('Isi dulu nama stand barunya.'); return;
    }
    if (standBaru && (penjual.bank.trim() === '' || penjual.rekening.replace(/[^0-9]/g, '').length < 6)) {
      setPesan('Bank dan nomor rekening wajib diisi untuk stand baru.'); return;
    }
    if (!penjual.tenantId) {
      setPesan('Pilih stand Anda dulu.'); return;
    }
    if (adaVarian && varian.some((v) => v.name.trim() === '' || v.priceOwner === '')) {
      setPesan('Setiap varian harus punya nama dan harga nett.'); return;
    }

    setKirimJalan(true);
    try {
      const { data, error } = await supabase.rpc('submit_product', {
        p_code: penjual.kode,
        p_channel: kanal,
        p_seller_name: penjual.nama,
        p_seller_phone: penjual.telp,
        p_tenant_id: standBaru ? null : penjual.tenantId,
        p_tenant_baru: standBaru ? penjual.tenantBaru : null,
        p_bank_name: standBaru ? penjual.bank : null,
        p_bank_account: standBaru ? penjual.rekening : null,
        p_bank_account_name: standBaru ? penjual.atasNama : null,
        p_name: produk.name,
        p_category: produk.category || null,
        p_description: produk.description || null,
        p_image_url: produk.imageUrl || null,
        p_price_owner: adaVarian ? 0 : (Number(produk.priceOwner) || 0),
        p_stock: (adaVarian || kanal !== 'offline') ? null : stokKeDb(produk.stock),
        p_variants: varian.map((v) => ({
          name: v.name.trim(),
          price_owner: Number(v.priceOwner) || 0,
          stock: (kanal !== 'offline' || v.stock === '') ? null : String(stokKeDb(v.stock)),
        })),
      });
      if (error) throw error;
      const hasil = Array.isArray(data) ? data[0] : data;
      // Simpan isiannya: kalau penjual mau produk yang sama juga dijual di
      // kanal sebelahnya, dia tidak perlu mengisi ulang semuanya.
      setSukses({
        code: hasil?.code || '', batch: hasil?.batch_name || batchName,
        kanal, produk, varian,
      });
      setProduk(kosongProduk);
      setVarian([]);
    } catch (err) {
      setPesan(err.message || 'Gagal mengirim. Periksa koneksi lalu coba lagi.');
    } finally {
      setKirimJalan(false);
    }
  };

  if (sukses) {
    const lain = sukses.kanal === 'online' ? 'offline' : 'online';
    return (
      <div className="max-w-sm mx-auto bg-white rounded-2xl border shadow-lg p-6 mt-8 text-center">
        <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
        <h2 className="font-black text-lg text-slate-900">Pendaftaran terkirim</h2>
        <p className="text-xs text-slate-500 mt-1 leading-relaxed">
          Produk Anda masuk antrean review panitia untuk <b>{LABEL_KANAL[sukses.kanal]}</b>.
          Panitia yang akan menentukan harga jualnya.
        </p>
        <div className="my-4 py-3 bg-slate-50 rounded-xl border border-dashed">
          <p className="text-[10px] text-slate-500 font-bold">NOMOR PENDAFTARAN</p>
          <p className="font-mono font-black text-xl text-slate-900 tracking-wider">{sukses.code}</p>
          <p className="text-[10px] text-slate-500 mt-1">Periode {sukses.batch}</p>
        </div>
        <p className="text-[10px] text-slate-500 mb-4 leading-relaxed">
          Simpan nomor ini. Sebutkan nomornya kalau Anda menghubungi panitia soal produk ini.
        </p>
        <button
          onClick={() => {
            // Produk yang sama, kanal sebelahnya. Harga nett sengaja TETAP
            // bisa diubah: harga offline sering memang dibedakan.
            setKanal(lain);
            setProduk(sukses.produk);
            setVarian(sukses.varian.map((v) => ({ ...v })));
            setSukses(null);
          }}
          className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm shadow-md transition-colors"
        >Daftarkan juga untuk {lain === 'online' ? 'Etalase Online' : 'Bazaar Offline'}</button>
        <button
          onClick={() => { setKanal(sukses.kanal); setSukses(null); }}
          className="w-full py-2.5 mt-2 bg-white border border-emerald-200 hover:bg-emerald-50 text-emerald-700 font-bold rounded-xl text-xs transition-colors"
        >Daftarkan Produk Lain</button>
        <button
          onClick={onKembali}
          className="w-full py-2.5 mt-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl text-xs transition-colors"
        >Selesai</button>
      </div>
    );
  }

  const inp = 'w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500';

  return (
    <form onSubmit={kirim} className="max-w-sm mx-auto space-y-4 mt-4 mb-10 text-xs font-medium">
      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
        <h2 className="font-black text-base text-emerald-900">Daftarkan Produk Bazaar</h2>

        <div className="grid grid-cols-2 gap-2 mt-3">
          {['online', 'offline'].map((k) => (
            <button
              key={k} type="button" onClick={() => setKanal(k)}
              className={`px-2 py-2.5 rounded-xl border-2 text-left transition-colors ${
                kanal === k ? 'border-emerald-600 bg-white shadow-sm' : 'border-emerald-200 bg-emerald-50/50 hover:bg-white'
              }`}
            >
              <span className={`block text-[11px] font-black leading-tight ${kanal === k ? 'text-emerald-800' : 'text-emerald-700'}`}>
                {k === 'online' ? 'Etalase Online' : 'Bazaar Offline'}
              </span>
              <span className="block text-[9px] text-emerald-700/80 mt-0.5 leading-snug">
                {k === 'online' ? 'Dipesan lewat web, diambil saat hari-H' : 'Dijual langsung di meja kasir'}
              </span>
            </button>
          ))}
        </div>

        <p className="text-[10px] text-emerald-800 mt-3 leading-relaxed">
          Untuk {kanal === 'online' ? 'etalase online' : 'bazaar offline'} periode <b>{batchName}</b>.
          Isi harga <b>nett</b> yang Anda terima; margin 10% dengan pembulatan harga jual ke
          atas ke Rp 500. Produk akan masuk ke{' '}
          {kanal === 'online' ? 'etalase online' : 'daftar jualan kasir'} setelah direview admin.
        </p>
      </div>

      <div className="bg-white rounded-2xl border shadow-sm p-4 space-y-3">
        <h3 className="font-bold text-sm text-slate-900">1. Data Penjual</h3>
        <div>
          <label className="block mb-1">Kode pendaftaran <span className="text-rose-500">*</span></label>
          <input
            type="text" required value={penjual.kode}
            onChange={(e) => setPenjual({ ...penjual, kode: e.target.value.toUpperCase() })}
            placeholder="Dari panitia"
            className={`${inp} font-mono font-bold tracking-wider`}
          />
        </div>
        <div>
          <label className="block mb-1">Nama Anda <span className="text-rose-500">*</span></label>
          <input type="text" required value={penjual.nama}
            onChange={(e) => setPenjual({ ...penjual, nama: e.target.value })} className={inp} />
        </div>
        <div>
          <label className="block mb-1">Nomor WhatsApp <span className="text-rose-500">*</span></label>
          <input type="tel" required value={penjual.telp} placeholder="08xxxxxxxxxx"
            onChange={(e) => setPenjual({ ...penjual, telp: e.target.value })} className={inp} />
        </div>
        <div>
          <label className="block mb-1">Stand <span className="text-rose-500">*</span></label>
          <select required value={penjual.tenantId}
            onChange={(e) => setPenjual({ ...penjual, tenantId: e.target.value })} className={inp}>
            <option value="">&mdash; Pilih stand &mdash;</option>
            {tenants.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            <option value={STAND_BARU}>Stand saya belum terdaftar</option>
          </select>
        </div>
        {standBaru && (
          <>
            <div>
              <label className="block mb-1">Nama stand baru <span className="text-rose-500">*</span></label>
              <input type="text" required value={penjual.tenantBaru}
                onChange={(e) => setPenjual({ ...penjual, tenantBaru: e.target.value })} className={inp} />
              <p className="text-[9px] text-slate-500 mt-1">Panitia akan membuatkan standnya saat review.</p>
            </div>

            {}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <p className="text-[10px] text-slate-600 leading-snug">
                Rekening ini dipakai panitia untuk membayarkan hasil penjualan Anda, dan hanya
                ditanyakan sekali saat stand baru dibuat.
              </p>
              <div className="flex gap-3">
                <div className="w-28 shrink-0">
                  <label className="block mb-1">Bank <span className="text-rose-500">*</span></label>
                  <input type="text" required value={penjual.bank} placeholder="BCA"
                    onChange={(e) => setPenjual({ ...penjual, bank: e.target.value })} className={inp} />
                </div>
                <div className="flex-1">
                  <label className="block mb-1">No. rekening <span className="text-rose-500">*</span></label>
                  <input type="text" inputMode="numeric" required value={penjual.rekening}
                    onChange={(e) => setPenjual({ ...penjual, rekening: e.target.value })} className={inp} />
                </div>
              </div>
              <div>
                <label className="block mb-1">Atas nama</label>
                <input type="text" value={penjual.atasNama}
                  placeholder={penjual.nama ? `Kosongkan = ${penjual.nama}` : 'Kosongkan = nama Anda'}
                  onChange={(e) => setPenjual({ ...penjual, atasNama: e.target.value })} className={inp} />
              </div>
            </div>
          </>
        )}
      </div>

      <div className="bg-white rounded-2xl border shadow-sm p-4 space-y-3">
        <h3 className="font-bold text-sm text-slate-900">2. Produk</h3>
        <div>
          <label className="block mb-1">Nama produk <span className="text-rose-500">*</span></label>
          <input type="text" required value={produk.name}
            onChange={(e) => setProduk({ ...produk, name: e.target.value })} className={inp} />
        </div>
        <div>
          <label className="block mb-1">Kategori</label>
          <select value={produk.category}
            onChange={(e) => setProduk({ ...produk, category: e.target.value })} className={inp}>
            {PREDEFINED_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="block mb-1">Keterangan singkat</label>
          <input type="text" value={produk.description} placeholder="Misal: isi 5 pcs, pedas"
            onChange={(e) => setProduk({ ...produk, description: e.target.value })} className={inp} />
        </div>

        {!adaVarian && (
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block mb-1 text-emerald-700">Harga nett <span className="text-rose-500">*</span></label>
              <input type="number" min="0" required={!adaVarian} value={produk.priceOwner}
                onChange={(e) => setProduk({ ...produk, priceOwner: e.target.value })} className={inp} />
            </div>
            {/* Jumlah hanya ditanyakan untuk bazaar offline. Pesanan online
                berjalan sebagai PO, jadi tidak ada batas yang perlu diisi. */}
            {kanal === 'offline' && (
              <div className="flex-1">
                <label className="block mb-1">Jumlah yang dibawa</label>
                <input type="number" min="0" value={produk.stock} placeholder="Opsional"
                  onChange={(e) => setProduk({ ...produk, stock: e.target.value })} className={inp} />
              </div>
            )}
          </div>
        )}

        <div className="border-t pt-3">
          <div className="flex justify-between items-center mb-2">
            <label className="font-bold text-slate-700">Varian (opsional)</label>
            <button type="button"
              onClick={() => setVarian([...varian, { name: '', priceOwner: '', stock: '' }])}
              className="text-[10px] bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold px-2 py-1 rounded-lg flex items-center transition-colors">
              <Plus className="w-3 h-3 mr-0.5" /> Varian
            </button>
          </div>
          <p className="text-[9px] text-slate-500 mb-2 leading-snug">
            Pakai ini kalau satu produk punya beberapa ukuran atau rasa dengan harga berbeda.
            Kalau ada varian, harga &amp; jumlah di atas tidak dipakai.
          </p>
          {varian.map((v, i) => (
            <div key={i} className="flex gap-2 items-start bg-slate-50 p-2.5 rounded-lg border mb-2">
              <div className="flex-1 space-y-2">
                <input type="text" required placeholder="Nama varian (misal: 250gr)" value={v.name}
                  onChange={(e) => { const n = [...varian]; n[i].name = e.target.value; setVarian(n); }}
                  className="w-full px-2 py-1.5 border border-slate-200 rounded bg-white focus:outline-none focus:border-emerald-500" />
                <div className="flex gap-2">
                  <input type="number" min="0" required placeholder="Harga nett" value={v.priceOwner}
                    onChange={(e) => { const n = [...varian]; n[i].priceOwner = e.target.value; setVarian(n); }}
                    className="w-full px-2 py-1.5 border border-slate-200 rounded bg-white text-emerald-700 font-bold focus:outline-none focus:border-emerald-500" />
                  {kanal === 'offline' && (
                    <input type="number" min="0" placeholder="Jumlah" value={v.stock}
                      onChange={(e) => { const n = [...varian]; n[i].stock = e.target.value; setVarian(n); }}
                      className="w-full px-2 py-1.5 border border-slate-200 rounded bg-white focus:outline-none focus:border-emerald-500" />
                  )}
                </div>
              </div>
              <button type="button" onClick={() => setVarian(varian.filter((_, x) => x !== i))}
                className="p-1.5 bg-red-50 hover:bg-red-100 text-red-500 rounded transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        <div className="border-t pt-3">
          <label className="block mb-1.5">Foto produk</label>
          {produk.imageUrl && (
            <img src={produk.imageUrl} alt="foto produk" className="w-20 h-20 object-cover rounded-xl border mb-2" />
          )}
          <input type="file" accept="image/*" onChange={unggahFoto} disabled={unggahJalan}
            className="w-full file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 cursor-pointer text-slate-500" />
          {unggahJalan && <p className="text-[10px] text-amber-600 font-bold mt-1.5 animate-pulse">Mengompres &amp; mengunggah foto...</p>}
          <p className="text-[9px] text-slate-500 mt-1">Fotonya otomatis dikecilkan, jadi tidak perlu diedit dulu.</p>
        </div>
      </div>

      {pesan && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-xl p-3 text-[11px] font-bold flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-px" /><span>{pesan}</span>
        </div>
      )}

      <button type="submit" disabled={kirimJalan || unggahJalan}
        className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-xl shadow-md text-sm transition-colors">
        {kirimJalan ? 'Mengirim...' : 'Kirim Pendaftaran'}
      </button>
      <button type="button" onClick={onKembali}
        className="w-full py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold rounded-xl text-xs transition-colors">
        Kembali ke Menu Pembeli
      </button>
    </form>
  );
}

/**
 * Buka / tutup pendaftaran produk beserta kodenya, per batch.
 * Kodenya hanya terlihat di sini — tabelnya tidak bisa dibaca tanpa login.
 */
function PengaturanPendaftaran({ batches, regSettings, onSimpan }) {
  const [batchId, setBatchId] = useState(() =>
    (batches.find((b) => b.isActive) || batches[0])?.id || '');
  const aktif = regSettings.find((r) => r.batchId === batchId);
  const [kode, setKode] = useState(aktif?.code || '');
  // Dikunci pada batch DAN kodenya: ganti batch menampilkan kode batch itu,
  // dan kode yang baru selesai dimuat dari server ikut muncul — tanpa ini,
  // panel yang sudah terbuka saat data datang akan menampilkan kolom kosong.
  const [terakhir, setTerakhir] = useState(`${batchId}|${aktif?.code || ''}`);
  const tanda = `${batchId}|${aktif?.code || ''}`;

  if (terakhir !== tanda) {
    setTerakhir(tanda);
    setKode(aktif?.code || '');
  }

  const buka = !!aktif?.isOpen;

  return (
    <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
      <div className="p-3 sm:p-4 bg-emerald-700 text-white">
        <h3 className="font-bold text-sm">Pendaftaran Produk oleh Penjual</h3>
        <p className="text-[10px] text-emerald-100 mt-1 leading-relaxed">
          Kalau dibuka, menu pendaftaran muncul di halaman depan. Penjual harus memasukkan
          kode di bawah ini untuk bisa mengirim. Kode dicocokkan di server, jadi tidak bisa
          dibaca dari halaman web.
        </p>
      </div>

      <div className="p-3 space-y-3 text-xs">
        <div className="flex flex-wrap gap-2 items-center">
          <span className="font-bold text-slate-600">Batch:</span>
          <select
            value={batchId}
            onChange={(e) => setBatchId(e.target.value)}
            className="p-2 border rounded-lg bg-white font-semibold focus:outline-none focus:border-emerald-500"
          >
            {batches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
          <span className={`px-2 py-1 rounded-full font-bold text-[10px] ${buka ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
            {buka ? 'Pendaftaran TERBUKA' : 'Pendaftaran tertutup'}
          </span>
        </div>

        <div>
          <label className="block mb-1 font-bold text-slate-600">Kode pendaftaran</label>
          <input
            type="text" value={kode}
            onChange={(e) => setKode(e.target.value.toUpperCase())}
            placeholder="Misal: DANUS2026"
            className="w-full sm:w-56 px-3 py-2 border border-slate-200 rounded-xl font-mono font-bold tracking-wider focus:outline-none focus:border-emerald-500"
          />
          <p className="text-[9px] text-slate-500 mt-1 leading-snug">
            Bagikan kode ini ke grup penjual. Minimal 4 karakter. Mengganti kode langsung
            membuat kode lama tidak berlaku.
          </p>
        </div>

        <div className="flex gap-2 pt-1">
          <button
            onClick={() => onSimpan(batchId, true, kode)}
            disabled={!batchId}
            className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-[11px] font-bold rounded-lg shadow-sm transition-colors"
          >{buka ? 'Simpan Kode' : 'Buka Pendaftaran'}</button>
          {buka && (
            <button
              onClick={() => onSimpan(batchId, false, kode)}
              className="px-3 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 text-[11px] font-bold rounded-lg transition-colors"
            >Tutup Pendaftaran</button>
          )}
        </div>
      </div>
    </div>
  );
}

function ModalProductForm({
  item, tenants, onClose, onSave, channel = 'online',
  sumberOnline = [], kunciOffline,
  judul, labelSimpan, standBaru = '', catatanAtas = null,
  channelBisaDiubah = false, isiMarginOtomatis = false,
}) {
  // Saat review pendaftaran, kanalnya boleh dipindah: penjual bisa salah pilih,
  // dan memperbaikinya di sini jauh lebih murah daripada menolak lalu meminta
  // dia mendaftar ulang.
  const [kanal, setKanal] = useState(channel);

  const marginAwal = (nett, sudahAda) => {
    if (sudahAda !== '' && sudahAda !== null && sudahAda !== undefined) return String(sudahAda);
    return isiMarginOtomatis && Number(nett) > 0 ? String(saranMargin(nett)) : '';
  };

  const [form, setForm] = useState({
    name: item?.name || '', tenantId: item?.tenantId || tenants[0]?.id || '',
    category: item?.category || PREDEFINED_CATEGORIES[0],
    priceOwner: item?.priceOwner || '',
    priceOrganizer: marginAwal(item?.priceOwner, item?.priceOrganizer),
    imageUrl: item?.imageUrl || '', description: item?.description || '',
    stock: item?.stock === null || item?.stock === undefined ? '' : String(item.stock)
  });

  const [isUploading, setIsUploading] = useState(false);

  const [variants, setVariants] = useState(() =>
     // FIX: tidak crash kalau JSON rusak. Stok dibawa sebagai teks supaya
     // kolom yang dikosongkan tetap berarti "tidak dibatasi", bukan nol.
     normalizeVariants(item?.variants).map((v) => ({
       ...v,
       priceOrganizer: marginAwal(v.priceOwner, v.priceOrganizer),
       stock: v.stock === null || v.stock === undefined ? '' : String(v.stock),
     })));

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if(!file) return;

    setIsUploading(true);
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (ev) => {
      const img = new Image();
      img.src = ev.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_DIMENSION = 400; 
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_DIMENSION) {
            height *= MAX_DIMENSION / width;
            width = MAX_DIMENSION;
          }
        } else {
          if (height > MAX_DIMENSION) {
            width *= MAX_DIMENSION / height;
            height = MAX_DIMENSION;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        // Gambar diunggah ke Supabase Storage, bukan lagi ditempel sebagai
        // base64 di dalam baris produk. Itu yang dulu membuat payload sync
        // membengkak sampai ~1,5 MB dan membuka celah race condition.
        canvas.toBlob(async (blob) => {
          if (!blob) { setIsUploading(false); return; }
          try {
            const path = `upload-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;
            const { error } = await supabase.storage
              .from(IMAGE_BUCKET)
              .upload(path, blob, { contentType: 'image/jpeg', upsert: true });
            if (error) throw error;
            const { data } = supabase.storage.from(IMAGE_BUCKET).getPublicUrl(path);
            setForm((f) => ({ ...f, imageUrl: data.publicUrl }));
          } catch (err) {
            console.error('Gagal unggah gambar:', err);
            alert('Gagal mengunggah gambar: ' + (err.message || 'coba lagi'));
          } finally {
            setIsUploading(false);
          }
        }, 'image/jpeg', 0.75);
      }
      img.onerror = () => setIsUploading(false);
    };
    reader.onerror = () => setIsUploading(false);
  };
  
  const hasVariants = variants.length > 0;

  // --------------------------------------------------------------------------
  //  Salin dari produk online.
  //  Hanya mengisi form. TIDAK memanggil onSave, jadi tidak ada apa pun yang
  //  tersimpan sampai tombol "Simpan Produk" ditekan sendiri.
  // --------------------------------------------------------------------------
  const [disalinDari, setDisalinDari] = useState(null);
  const bolehSalin = kanal === 'offline' && !item && sumberOnline.length > 0;

  /** Isi ulang semua margin dari harga nett yang sekarang ada di form. */
  const hitungMargin = () => {
    setForm((f) => ({ ...f, priceOrganizer: String(saranMargin(f.priceOwner)) }));
    setVariants((vs) => vs.map((v) => ({ ...v, priceOrganizer: String(saranMargin(v.priceOwner)) })));
  };

  const angkaKeInput = (n) => (n === 0 || n === null || n === undefined ? '' : String(n));

  const salinDariOnline = (id) => {
    const asal = sumberOnline.flatMap((g) => g.items).find((p) => p.id === id);
    if (!asal) return;
    setForm({
      name: asal.name || '',
      tenantId: asal.tenantId || tenants[0]?.id || '',
      category: asal.category || PREDEFINED_CATEGORIES[0],
      priceOwner: angkaKeInput(asal.priceOwner),
      priceOrganizer: angkaKeInput(asal.priceOrganizer),
      imageUrl: asal.imageUrl || '',
      description: asal.description || '',
      stock: '',   // stok offline diisi sendiri, bukan diwarisi dari produk online
    });
    setVariants(normalizeVariants(asal.variants).map((v) => ({
      name: v.name,
      priceOwner: angkaKeInput(v.priceOwner),
      priceOrganizer: angkaKeInput(v.priceOrganizer),
      stock: '',
    })));
    setDisalinDari(asal.name);
  };

  const kosongkanForm = () => {
    setForm({
      name: '', tenantId: tenants[0]?.id || '',
      category: PREDEFINED_CATEGORIES[0],
      priceOwner: '', priceOrganizer: '', imageUrl: '', description: '', stock: '',
    });
    setVariants([]);
    setDisalinDari(null);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm print:hidden">
      <div className="bg-white rounded-2xl w-full max-w-sm p-6 relative overflow-y-auto max-h-[90vh] shadow-xl scrollbar-none">
        <button onClick={onClose} disabled={isUploading} className="absolute top-4 right-4 p-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg disabled:opacity-50 transition-colors"><X className="w-4 h-4 text-slate-500" /></button>
        <h3 className="font-bold text-base mb-1">{judul || (item ? 'Edit Produk' : 'Tambah Produk')}</h3>
        {channelBisaDiubah ? (
          <div className="grid grid-cols-2 gap-2 mb-4">
            {['online', 'offline'].map((k) => (
              <button
                key={k} type="button" onClick={() => setKanal(k)}
                className={`px-2 py-1.5 rounded-lg border-2 text-[10px] font-bold transition-colors ${
                  kanal === k
                    ? (k === 'offline' ? 'border-emerald-600 bg-emerald-50 text-emerald-800' : 'border-amber-500 bg-amber-50 text-amber-800')
                    : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
                }`}
              >{k === 'offline' ? 'Produk Offline (Kasir)' : 'Produk Online (Etalase)'}</button>
            ))}
          </div>
        ) : (
          <p className={`text-[10px] font-bold mb-4 px-2 py-1 rounded w-fit ${kanal === 'offline' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
            {kanal === 'offline' ? 'Produk Offline \u2014 hanya untuk Kasir' : 'Produk Online \u2014 tampil di halaman pembeli'}
          </p>
        )}

        {catatanAtas}

        {bolehSalin && (
          <div className="mb-4 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium">
            <label className="block text-xs font-bold text-slate-700 mb-1">Salin dari produk online</label>
            <p className="text-[10px] text-slate-500 leading-snug mb-2">
              Isi form otomatis dari produk yang sudah ada, supaya tidak setup dua kali.
              Produk <b>belum tersimpan</b> &mdash; semua kolom, termasuk harga, masih bisa diubah.
            </p>
            <select
              value=""
              onChange={(e) => { if (e.target.value) salinDariOnline(e.target.value); }}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-emerald-500"
            >
              <option value="">&mdash; Pilih produk online &mdash;</option>
              {sumberOnline.map((g) => (
                <optgroup key={g.tenant.id} label={g.tenant.name}>
                  {g.items.map((p) => {
                    const sudah = kunciOffline?.has(
                      `${p.tenantId}|${String(p.name || '').trim().toLowerCase()}`
                    );
                    const jmlVarian = normalizeVariants(p.variants).length;
                    return (
                      <option key={p.id} value={p.id}>
                        {p.name}
                        {jmlVarian > 0 ? ` (${jmlVarian} varian)` : ''}
                        {sudah ? ' \u2014 sudah ada di kasir' : ''}
                      </option>
                    );
                  })}
                </optgroup>
              ))}
            </select>

            {disalinDari && (
              <div className="mt-2.5 flex items-start gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-px" />
                <p className="text-[10px] text-emerald-700 font-bold leading-snug flex-1">
                  Data &ldquo;{disalinDari}&rdquo; sudah dimuat. Sesuaikan harga nett &amp; margin
                  untuk harga offline, lalu tekan Simpan Produk.
                </p>
                <button
                  type="button"
                  onClick={kosongkanForm}
                  className="text-[10px] font-bold text-slate-500 hover:text-slate-700 flex items-center gap-0.5 shrink-0"
                >
                  <RotateCcw className="w-3 h-3" /> Kosongkan
                </button>
              </div>
            )}
          </div>
        )}

        <form
          onSubmit={(e) => { 
            e.preventDefault(); 
            // Stok varian ikut dibuang untuk kanal online: pesanan online PO,
            // jadi angka sisa dari pendaftaran tidak boleh menempel diam-diam.
            const finalVariants = variants.map(v => ({
              ...v,
              priceOwner: Number(v.priceOwner),
              priceOrganizer: Number(v.priceOrganizer),
              stock: kanal === 'offline' ? v.stock : '',
            }));
            onSave({
               ...form, 
               channel: kanal,
               stock: kanal === 'offline' ? form.stock : '',
               priceOwner: hasVariants ? 0 : Number(form.priceOwner),
               priceOrganizer: hasVariants ? 0 : Number(form.priceOrganizer),
               variants: finalVariants
            }); 
          }} 
          className="space-y-4 text-xs font-medium"
        >
          <div><label className="block mb-1">Nama Produk</label><input type="text" required value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500" /></div>
          
          <div>
             <label className="block mb-1">Kategori Produk</label>
             <select value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500">
               {PREDEFINED_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
             </select>
          </div>
          
          <div>
            <label className="block mb-1">Stand / Tenant</label>
            <select value={form.tenantId} onChange={e => setForm({...form, tenantId: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500">
              {standBaru && <option value={STAND_BARU}>{`Buat stand baru: "${standBaru}"`}</option>}
              {tenants.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
            {standBaru && form.tenantId === STAND_BARU && (
              <p className="text-[9px] text-amber-700 bg-amber-50 px-2 py-1 rounded mt-1 leading-snug">
                Stand <b>{standBaru}</b> akan dibuat sekarang dan langsung didaftarkan ikut
                periode ini. Kalau standnya sebenarnya sudah ada, pilih yang sudah ada saja.
              </p>
            )}
          </div>
          
          {!hasVariants && (
            <div className="flex gap-3">
              <div className="flex-1"><label className="block mb-1 text-emerald-700">Harga Nett</label><input type="number" required={!hasVariants} value={form.priceOwner} onChange={e => setForm({...form, priceOwner: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500" /></div>
              <div className="flex-1"><label className="block mb-1 text-indigo-700">Margin Panitia</label><input type="number" required={!hasVariants} value={form.priceOrganizer} onChange={e => setForm({...form, priceOrganizer: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500" /></div>
            </div>
          )}

          {kanal === 'offline' && !hasVariants && (
            <div>
              <label className="block mb-1">Stok</label>
              <input
                type="number" min="0" step="1" placeholder="Kosongkan kalau tidak dibatasi"
                value={form.stock}
                onChange={e => setForm({ ...form, stock: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500"
              />
              <p className="text-[9px] text-slate-500 mt-1 leading-snug">
                Kasir menolak penjualan kalau stok habis. <b>Dikosongkan</b> berarti tidak
                dibatasi. Tidak berlaku untuk produk online &mdash; pesanan online adalah PO.
              </p>
            </div>
          )}

          <button
            type="button" onClick={hitungMargin}
            className="w-full py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-lg text-[10px] leading-snug transition-colors"
          >
            Hitung margin otomatis &mdash; 10% dengan harga jual dibulatkan ke atas ke Rp 500
          </button>

          <div className="border-t border-slate-200 pt-4 mt-2">
             <div className="flex justify-between items-center mb-2">
                 <label className="font-bold text-slate-700">Multi-Varian (Opsional)</label>
                 <button type="button" onClick={() => setVariants([...variants, { name: '', priceOwner: '', priceOrganizer: '', stock: '' }])} className="text-[10px] bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold px-2 py-1 rounded-lg flex items-center transition-colors"><Plus className="w-3 h-3 mr-0.5"/> Varian</button>
             </div>
             
             {hasVariants && (
                <div className="space-y-2 mb-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
                    {variants.map((v, i) => (
                       <div key={i} className="flex gap-2 items-start bg-white p-2.5 rounded-lg border border-slate-200 shadow-sm">
                           <div className="flex-1 space-y-2">
                               <input type="text" placeholder="Nama Varian (Misal: 250gr)" value={v.name} required onChange={e => { const newV = [...variants]; newV[i].name = e.target.value; setVariants(newV); }} className="w-full px-2 py-1.5 border border-slate-200 rounded bg-slate-50 focus:bg-white focus:outline-none focus:border-amber-400" />
                               <div className="flex gap-2">
                                   <input type="number" placeholder="Harga Nett" value={v.priceOwner} required onChange={e => { const newV = [...variants]; newV[i].priceOwner = e.target.value; setVariants(newV); }} className="w-full px-2 py-1.5 border border-slate-200 rounded bg-slate-50 focus:bg-white text-emerald-700 font-bold focus:outline-none focus:border-emerald-500" />
                                   <input type="number" placeholder="Margin" value={v.priceOrganizer} required onChange={e => { const newV = [...variants]; newV[i].priceOrganizer = e.target.value; setVariants(newV); }} className="w-full px-2 py-1.5 border border-slate-200 rounded bg-slate-50 focus:bg-white text-indigo-700 font-bold focus:outline-none focus:border-indigo-500" />
                               </div>
                               {kanal === 'offline' && (
                                 <input type="number" min="0" step="1" placeholder="Stok (kosong = tidak dibatasi)" value={v.stock ?? ''} onChange={e => { const newV = [...variants]; newV[i].stock = e.target.value; setVariants(newV); }} className="w-full px-2 py-1.5 border border-slate-200 rounded bg-slate-50 focus:bg-white focus:outline-none focus:border-emerald-500" />
                               )}
                           </div>
                           <button type="button" onClick={() => setVariants(variants.filter((_, idx) => idx !== i))} className="p-1.5 bg-red-50 hover:bg-red-100 text-red-500 rounded transition-colors"><Trash2 className="w-4 h-4"/></button>
                       </div>
                    ))}
                    <p className="text-[9px] text-amber-600 font-bold italic mt-2 text-center">*Karena varian aktif, harga dasar utama (Hrg Owner & Mrgn Panitia) diabaikan.</p>
                </div>
             )}
          </div>

          <div><label className="block mb-1">Deskripsi Singkat (Opsional)</label><input type="text" value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500" /></div>
          
          <div>
            <label className="block mb-1.5">Upload Foto (Auto-Compress)</label>
            {form.imageUrl && <img src={form.imageUrl} alt="preview" className="w-16 h-16 object-cover rounded-xl border border-slate-200 mb-2 shadow-sm" />}
            
            <input type="file" accept="image/*" onChange={handleImageUpload} disabled={isUploading} className="w-full file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 cursor-pointer text-slate-500 mb-2" />
            
            <div className="flex items-center text-[10px] text-slate-400 mb-2 before:flex-1 before:border-t before:border-slate-200 before:mr-2 after:flex-1 after:border-t after:border-slate-200 after:ml-2">ATAU PASTE URL GOOGLE DRIVE</div>
            
            <input 
              type="url" 
              placeholder="Paste link Google Drive disini..." 
              value={form.imageUrl} 
              onChange={(e) => {
                let val = e.target.value;
                // Mengubah format menjadi uc?id= sesuai request Anda
                // Regex ini juga akan memperbaiki link lh3 atau thumbnail yang sudah terlanjur di-paste sebelumnya
                const gdMatch = val.match(/(?:file\/d\/|open\?id=|uc\?export=view&id=|uc\?id=|thumbnail\?id=|d\/)([\w-]+)/);
                if (gdMatch && gdMatch[1]) {
                    val = `https://drive.google.com/uc?id=${gdMatch[1]}`;
                }
                setForm({...form, imageUrl: val});
              }} 
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 text-[10px]" 
            />
            
            {isUploading && <p className="text-[10px] text-amber-600 font-bold mt-1.5 animate-pulse">Memproses kompresi gambar otomatis...</p>}
          </div>

          <button type="submit" disabled={isUploading} className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md mt-2 text-sm disabled:opacity-50 transition-colors">
            {isUploading ? 'Sedang Diproses...' : (labelSimpan || 'Simpan Produk')}
          </button>
        </form>
      </div>
    </div>
  );
}