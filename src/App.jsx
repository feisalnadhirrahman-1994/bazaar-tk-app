import React, { useState, useEffect, useMemo } from 'react';
import { 
  ShoppingBag, ShoppingCart, Plus, Trash2, Edit3, CheckCircle2, 
  MessageCircle, Store, Settings, Search, FileSpreadsheet, X, Send,
  User, School, Lock, AlertCircle, Phone, Image as ImageIcon, 
  Upload, Users, Layers, Share2, Printer, Save, RefreshCw
} from 'lucide-react';

// URL Endpoint Google Sheets yang baru
const DEFAULT_WEBHOOK_URL = 'https://script.google.com/macros/s/AKfycbwMORs9RhRXNQhQf5s0NhxKkT-IDiyu4NcOSXpcHkU3175JdLo5E-l_9166sznyL9U/exec';

const formatIndoDate = (dateStr) => {
  if (!dateStr) return '-';
  try { return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }); }
  catch (e) { return dateStr; }
};

const formatRupiah = (num) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num || 0);
};

// Fungsi pembersih imbuhan "(x1)" bawaan dari Cloud
const parseAndCleanItem = (itemString) => {
  let name = itemString;
  let qty = 1;
  const match = itemString.match(/\(x(\d+)\)/g);
  if (match && match.length > 0) {
    qty = parseInt(match[0].replace(/[^0-9]/g, ''));
    name = itemString.replace(/\s*\(x\d+\)\s*/g, '').trim();
  }
  return { name, qty };
};

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
      <text x="75" y="240" fontSize="42" fontFamily="Arial, sans-serif" fontWeight="900" fill="#3A3A3C" transform="rotate(-15, 75, 240)">l</text>
      <text x="90" y="235" fontSize="42" fontFamily="Arial, sans-serif" fontWeight="900" fill="#ED1C24" transform="rotate(-12, 90, 235)">i</text>
      <text x="102" y="230" fontSize="42" fontFamily="Arial, sans-serif" fontWeight="900" fill="#F58220" transform="rotate(-9, 102, 230)">t</text>
      <text x="118" y="226" fontSize="42" fontFamily="Arial, sans-serif" fontWeight="900" fill="#FFC20E" transform="rotate(-6, 118, 226)">t</text>
      <text x="134" y="223" fontSize="42" fontFamily="Arial, sans-serif" fontWeight="900" fill="#007A37" transform="rotate(-3, 134, 223)">l</text>
      <text x="150" y="221" fontSize="42" fontFamily="Arial, sans-serif" fontWeight="900" fill="#00AEEF" transform="rotate(-1, 150, 221)">e</text>
      <text x="195" y="221" fontSize="46" fontFamily="Arial, sans-serif" fontWeight="900" fill="#007A37" transform="rotate(2, 195, 221)">d</text>
      <text x="225" y="224" fontSize="46" fontFamily="Arial, sans-serif" fontWeight="900" fill="#F58220" transform="rotate(5, 225, 224)">a</text>
      <text x="252" y="228" fontSize="46" fontFamily="Arial, sans-serif" fontWeight="900" fill="#2E3192" transform="rotate(8, 252, 228)">r</text>
      <text x="274" y="233" fontSize="46" fontFamily="Arial, sans-serif" fontWeight="900" fill="#ED1C24" transform="rotate(12, 274, 233)">b</text>
      <text x="302" y="240" fontSize="46" fontFamily="Arial, sans-serif" fontWeight="900" fill="#8C2685" transform="rotate(16, 302, 240)">i</text>
      <text x="200" y="310" textAnchor="middle" fontSize="26" fontFamily="Georgia, serif" fontWeight="bold" fill="#000000">Parent Teacher</text>
      <text x="200" y="348" textAnchor="middle" fontSize="30" fontFamily="Georgia, serif" fontWeight="bold" fill="#000000">Association</text>
    </svg>
  );
}

export default function App() {
  const [activeTab, setActiveTab] = useState('shop');
  const [adminSubTab, setAdminSubTab] = useState('batch_reports');
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [isCloudSyncing, setIsCloudSyncing] = useState(true);
  const [toastMessage, setToastMessage] = useState('');
  
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  const [adminAuth, setAdminAuth] = useState(() => {
    const saved = localStorage.getItem('ld_bazaar_admin_auth');
    return saved ? JSON.parse(saved) : { username: 'admin', password: 'admin123' };
  });

  const [sheetWebhookUrl, setSheetWebhookUrl] = useState(() => {
    const saved = localStorage.getItem('ld_bazaar_sheet_webhook');
    return saved && saved.trim() !== '' ? saved : DEFAULT_WEBHOOK_URL;
  });

  const [classesList, setClassesList] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [products, setProducts] = useState([]);
  const [batches, setBatches] = useState([]);
  const [orders, setOrders] = useState([]);

  // Modals & Forms
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [checkoutData, setCheckoutData] = useState({ namaAnak: '', kelas: '', namaOrtu: '', catatan: '' });
  const [selectedTenantFilter, setSelectedTenantFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [printData, setPrintData] = useState(null);

  const [productModal, setProductModal] = useState({ isOpen: false, item: null });
  const [tenantModal, setTenantModal] = useState({ isOpen: false, item: null });
  const [batchModal, setBatchModal] = useState({ isOpen: false, item: null });
  const [classModal, setClassModal] = useState({ isOpen: false, item: null });
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: null });

  const fetchCloudData = async (silent = false) => {
    const targetUrl = sheetWebhookUrl || DEFAULT_WEBHOOK_URL;
    if (!targetUrl) return;
    setIsCloudSyncing(true);
    try {
      const res = await fetch(targetUrl);
      const json = await res.json();
      if (json.status === 'success' && json.data) {
        if (json.data.products?.length > 0) setProducts(json.data.products);
        if (json.data.tenants?.length > 0) setTenants(json.data.tenants);
        if (json.data.batches?.length > 0) setBatches(json.data.batches);
        if (json.data.classes?.length > 0) setClassesList(json.data.classes);
        if (json.data.orders?.length > 0) setOrders(json.data.orders);
        if (json.data.settings?.adminAuth) {
          try { setAdminAuth(typeof json.data.settings.adminAuth === 'string' ? JSON.parse(json.data.settings.adminAuth) : json.data.settings.adminAuth); } catch(e) {}
        }
        if (!silent) showToast('Data tersinkronisasi dari Cloud!');
      }
    } catch (e) {
      console.warn('Sync Error:', e);
    } finally {
      setIsCloudSyncing(false);
    }
  };

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const urlSheet = urlParams.get('sheet');
    if (urlSheet) {
      setSheetWebhookUrl(urlSheet);
      localStorage.setItem('ld_bazaar_sheet_webhook', urlSheet);
      showToast('Webhook Auto-Sync Aktif!');
    }
    fetchCloudData(true);
  }, []);

  const syncPushToCloud = async (overrideData = {}) => {
    const targetUrl = sheetWebhookUrl || DEFAULT_WEBHOOK_URL;
    if (!targetUrl) return;
    setIsCloudSyncing(true);
    try {
      const payload = {
        action: 'syncAll',
        products: overrideData.products || products,
        tenants: overrideData.tenants || tenants,
        batches: overrideData.batches || batches,
        classes: overrideData.classes || classesList,
        settings: { adminAuth }
      };
      await fetch(targetUrl, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      showToast('Perubahan Disimpan ke Cloud!');
    } catch (err) {
      console.warn('Push Error:', err);
    } finally {
      setIsCloudSyncing(false);
    }
  };

  const activeBatch = useMemo(() => {
    return batches.find((b) => b.isActive) || batches[0] || null;
  }, [batches]);

  const addToCart = (product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) return prev.map((item) => item.id === product.id ? { ...item, qty: item.qty + 1 } : item);
      return [...prev, { ...product, qty: 1 }];
    });
  };

  const updateCartQty = (productId, delta) => {
    setCart((prev) => prev.map((item) => {
      if (item.id === productId) {
        const newQty = item.qty + delta;
        return newQty > 0 ? { ...item, qty: newQty } : null;
      }
      return item;
    }).filter(Boolean));
  };

  const cartSummary = useMemo(() => {
    return cart.reduce((acc, item) => {
      const sp = Number(item.priceOwner) + Number(item.priceOrganizer);
      acc.totalSellingPrice += sp * item.qty;
      acc.totalOwnerPrice += item.priceOwner * item.qty;
      acc.totalOrganizerPrice += item.priceOrganizer * item.qty;
      acc.totalItems += item.qty;
      return acc;
    }, { totalSellingPrice: 0, totalOwnerPrice: 0, totalOrganizerPrice: 0, totalItems: 0 });
  }, [cart]);

  const handleCheckoutSubmit = (e) => {
    e.preventDefault();
    if (!activeBatch) return;
    if (!checkoutData.namaAnak.trim() || !checkoutData.namaOrtu.trim() || cart.length === 0) return;

    setIsSubmitting(true);
    const newOrderId = 'BZ-' + Math.floor(100000 + Math.random() * 900000);
    const targetClassObj = classesList.find((c) => c.name === checkoutData.kelas) || classesList[0];
    
    let cleanPhone = targetClassObj?.phone ? targetClassObj.phone.replace(/[^0-9]/g, '') : '';
    if (cleanPhone.startsWith('0')) cleanPhone = '62' + cleanPhone.slice(1);

    const orderPayload = {
      orderId: newOrderId,
      batchId: activeBatch.id,
      date: new Date().toISOString(),
      customer: { ...checkoutData, kelas: targetClassObj?.name || '-' },
      items: cart.map(item => ({
        id: item.id,
        name: item.name,
        tenantId: item.tenantId,
        priceOwner: item.priceOwner,
        priceOrganizer: item.priceOrganizer,
        qty: item.qty,
        subtotal: (Number(item.priceOwner) + Number(item.priceOrganizer)) * item.qty
      })),
      totalAmount: cartSummary.totalSellingPrice,
      totalOwnerShare: cartSummary.totalOwnerPrice,
      totalOrganizerShare: cartSummary.totalOrganizerPrice,
      status: 'Unpaid'
    };

    // Update Local & Background Sync
    const newOrders = [orderPayload, ...orders];
    setOrders(newOrders);
    if (sheetWebhookUrl) {
      fetch(sheetWebhookUrl, {
        method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'checkout', ...orderPayload })
      }).catch(e => console.warn(e));
    }

    // Prepare WA Text (NO EMOJIS)
    let waText = `PEMESANAN BAZAAR DANUS PTA LITTLE DARBI\n`;
    waText += `Periode: ${activeBatch.name}\n`;
    waText += `-----------------------------------\n`;
    waText += `No. Pesanan: ${newOrderId}\n`;
    waText += `Nama Anak: ${checkoutData.namaAnak}\n`;
    waText += `Kelas: ${targetClassObj?.name || '-'}\n`;
    waText += `Nama Ortu: ${checkoutData.namaOrtu}\n`;
    if (checkoutData.catatan) waText += `Catatan: ${checkoutData.catatan}\n`;
    waText += `Status: UNPAID (Belum Lunas)\n`;
    waText += `-----------------------------------\n`;
    waText += `Rincian Pesanan:\n`;

    orderPayload.items.forEach((item, index) => {
      const tenant = tenants.find((t) => t.id === item.tenantId);
      waText += `${index + 1}. ${item.name} (x${item.qty})\n   [${tenant ? tenant.name : 'Stand'}] - ${formatRupiah(item.subtotal)}\n`;
    });

    waText += `-----------------------------------\n`;
    waText += `TOTAL TAGIHAN: ${formatRupiah(orderPayload.totalAmount)}\n`;
    waText += `-----------------------------------\n`;
    waText += `Halo PIC Kelas ${targetClassObj?.name || '-'}, mohon info instruksi rekening pembayaran. Terima kasih!`;

    const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(waText)}`;

    // Reset Form
    setCart([]);
    setIsCheckoutModalOpen(false);
    setIsCartOpen(false);
    setCheckoutData({ namaAnak: '', kelas: classesList[0]?.name || '', namaOrtu: '', catatan: '' });
    setIsSubmitting(false);

    // Buka WA Langsung (Sinkron)
    window.open(waUrl, '_blank');
  };

  const [reportSelectedBatchId, setReportSelectedBatchId] = useState('');
  const [reportSelectedStatus, setReportSelectedStatus] = useState('Paid');

  useEffect(() => {
    if (batches.length > 0 && !reportSelectedBatchId) {
      setReportSelectedBatchId(batches[0].id);
    }
  }, [batches, reportSelectedBatchId]);

  const batchReportData = useMemo(() => {
    let filtered = orders.filter((o) => o.batchId === reportSelectedBatchId);
    if (reportSelectedStatus !== 'ALL') filtered = filtered.filter((o) => o.status === reportSelectedStatus);

    return tenants.map((tenant) => {
      const customerOrdersDetail = [];
      const itemTotalsMap = {};
      let tenantTotalGross = 0;
      let tenantTotalOwnerShare = 0;
      let tenantTotalMargin = 0;

      filtered.forEach((ord) => {
        const tenantItemsInOrder = ord.items.filter((it) => it.tenantId === tenant.id);
        if (tenantItemsInOrder.length > 0) {
          customerOrdersDetail.push({
            orderId: ord.orderId,
            namaAnak: ord.customer?.namaAnak || 'Unknown',
            kelas: ord.customer?.kelas || '-',
            namaOrtu: ord.customer?.namaOrtu || '-',
            catatan: ord.customer?.catatan || '-',
            items: tenantItemsInOrder.map(it => ({
              ...it,
              cleanName: parseAndCleanItem(it.name).name,
              qty: parseAndCleanItem(it.name).qty * (it.qty || 1)
            }))
          });

          tenantItemsInOrder.forEach((it) => {
            const cleanObj = parseAndCleanItem(it.name);
            const finalQty = cleanObj.qty * (it.qty || 1);
            if (!itemTotalsMap[cleanObj.name]) {
              itemTotalsMap[cleanObj.name] = { qty: 0, priceOwner: Number(it.priceOwner || 0), priceOrganizer: Number(it.priceOrganizer || 0) };
            }
            itemTotalsMap[cleanObj.name].qty += finalQty;
            tenantTotalGross += (Number(it.priceOwner) + Number(it.priceOrganizer)) * finalQty;
            tenantTotalOwnerShare += Number(it.priceOwner) * finalQty;
            tenantTotalMargin += Number(it.priceOrganizer) * finalQty;
          });
        }
      });

      return {
        tenantId: tenant.id, tenantName: tenant.name, tenantOwner: tenant.owner, tenantPhone: tenant.phone || '',
        customerOrdersDetail, itemTotalsMap, tenantTotalGross, tenantTotalOwnerShare, tenantTotalMargin
      };
    });
  }, [orders, reportSelectedBatchId, reportSelectedStatus, tenants]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchTenant = selectedTenantFilter === 'all' || p.tenantId === selectedTenantFilter;
      const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchTenant && matchSearch && p.available !== false;
    });
  }, [products, selectedTenantFilter, searchQuery]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans pb-24 relative">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-2xl text-xs font-bold flex items-center space-x-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md shadow-sm border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center space-x-2 sm:space-x-3">
            <div className="w-9 h-9 sm:w-11 sm:h-11 shrink-0 bg-white rounded-2xl border border-slate-200 shadow-sm flex items-center justify-center p-0.5 overflow-hidden">
              <LittleDarbiLogo className="w-full h-full" />
            </div>
            <div>
              <h1 className="font-black text-sm sm:text-lg leading-tight text-slate-900 tracking-tight">Bazaar DANUS PTA</h1>
              <p className="text-[10px] sm:text-[11px] text-slate-500 font-medium">Pemesanan Online</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button onClick={() => fetchCloudData(false)} disabled={isCloudSyncing} className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl">
              <RefreshCw className={`w-4 h-4 ${isCloudSyncing ? 'animate-spin text-indigo-600' : ''}`} />
            </button>
            <div className="bg-slate-100 p-1 rounded-xl flex">
              <button onClick={() => setActiveTab('shop')} className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center ${activeTab === 'shop' ? 'bg-white text-amber-600 shadow-sm' : 'text-slate-600'}`}>
                <ShoppingBag className="w-3.5 h-3.5 sm:mr-1.5" /> <span className="hidden sm:inline">Menu Pembeli</span>
              </button>
              <button onClick={() => setActiveTab('admin')} className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center ${activeTab === 'admin' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600'}`}>
                <Settings className="w-3.5 h-3.5 sm:mr-1.5" /> <span className="hidden sm:inline">Panel Admin</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {}
      {activeTab === 'shop' && (
        <main className="max-w-5xl mx-auto px-4 pt-6">
          {isCloudSyncing && products.length === 0 ? (
            <div className="text-center py-20"><RefreshCw className="w-8 h-8 animate-spin mx-auto text-amber-500 mb-4" /><p className="text-sm font-bold text-slate-500">Memuat Menu Terbaru...</p></div>
          ) : (
            <>
              {/* Batch Active Info */}
              <div className="mb-6">
                {activeBatch ? (
                  <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-2xl p-4 sm:p-5 shadow-md">
                    <span className="bg-white/20 text-white text-[10px] uppercase font-extrabold px-2.5 py-0.5 rounded-full inline-flex mb-2">{activeBatch.name}</span>
                    <h2 className="text-lg font-black">Pesan Makanan & Souvenir Bazaar</h2>
                    <p className="text-amber-100 text-xs">Pemesanan dibuka sampai {formatIndoDate(activeBatch.endDate)}.</p>
                  </div>
                ) : (
                  <div className="bg-red-500 text-white rounded-2xl p-4 shadow-md flex items-center space-x-3">
                    <Lock className="w-6 h-6" />
                    <div><h2 className="font-bold">Pemesanan Ditutup</h2><p className="text-xs">Saat ini tidak ada periode pemesanan yang aktif.</p></div>
                  </div>
                )}
              </div>

              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-3 mb-6">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                  <input type="text" placeholder="Cari makanan..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-white rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-amber-500/20" />
                </div>
                <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none">
                  <button onClick={() => setSelectedTenantFilter('all')} className={`px-3.5 py-2 rounded-xl text-xs font-medium whitespace-nowrap ${selectedTenantFilter === 'all' ? 'bg-amber-600 text-white' : 'bg-white border text-slate-600'}`}>Semua Stand</button>
                  {tenants.map((t) => (
                    <button key={t.id} onClick={() => setSelectedTenantFilter(t.id)} className={`px-3.5 py-2 rounded-xl text-xs font-medium whitespace-nowrap ${selectedTenantFilter === t.id ? 'bg-amber-600 text-white' : 'bg-white border text-slate-600'}`}>{t.name}</button>
                  ))}
                </div>
              </div>

              {/* Products Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
                {filteredProducts.map((prod) => {
                  const tenant = tenants.find((t) => t.id === prod.tenantId);
                  const sellingPrice = Number(prod.priceOwner || 0) + Number(prod.priceOrganizer || 0);
                  const inCart = cart.find((item) => item.id === prod.id);

                  return (
                    <div key={prod.id} className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
                      <div className="h-28 sm:h-36 w-full bg-slate-100 relative">
                        {prod.imageUrl ? <img src={prod.imageUrl} alt={prod.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex justify-center items-center"><ImageIcon className="w-8 h-8 text-slate-300"/></div>}
                        <span className="absolute top-2 left-2 text-[9px] font-bold bg-white/90 px-1.5 py-0.5 rounded shadow-xs truncate max-w-[90%]">{tenant?.name || 'Stand'}</span>
                      </div>
                      <div className="p-3 flex-1 flex flex-col justify-between">
                        <div>
                          <h3 className="font-bold text-slate-900 text-xs sm:text-sm leading-tight line-clamp-2">{prod.name}</h3>
                          <span className="text-amber-600 font-black text-xs sm:text-sm mt-1 block">{formatRupiah(sellingPrice)}</span>
                        </div>
                        <div className="mt-3">
                          {activeBatch ? (
                            inCart ? (
                              <div className="flex items-center justify-between bg-amber-50 border border-amber-200 p-1 rounded-lg">
                                <button onClick={() => updateCartQty(prod.id, -1)} className="w-6 h-6 bg-white rounded font-bold text-amber-700 shadow-sm">-</button>
                                <span className="text-xs font-bold">{inCart.qty}</span>
                                <button onClick={() => updateCartQty(prod.id, 1)} className="w-6 h-6 bg-amber-600 text-white rounded font-bold shadow-sm">+</button>
                              </div>
                            ) : (
                              <button onClick={() => addToCart(prod)} className="w-full py-1.5 bg-slate-900 text-white rounded-lg text-xs font-semibold flex justify-center items-center space-x-1"><Plus className="w-3.5 h-3.5"/><span>Pesan</span></button>
                            )
                          ) : (
                            <div className="text-[10px] text-center bg-slate-100 text-slate-400 py-1.5 rounded-lg font-bold">Ditutup</div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Floating Cart */}
              {cart.length > 0 && activeBatch && (
                <div className="fixed bottom-4 left-4 right-4 max-w-md mx-auto z-40">
                  <button onClick={() => setIsCartOpen(true)} className="w-full bg-amber-600 hover:bg-amber-700 text-white p-3.5 rounded-2xl shadow-xl flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="relative bg-white/20 p-2 rounded-xl"><ShoppingCart className="w-5 h-5"/></div>
                      <div className="text-left">
                        <p className="text-[10px] text-amber-100 font-medium">{cartSummary.totalItems} Items</p>
                        <p className="text-sm font-black">{formatRupiah(cartSummary.totalSellingPrice)}</p>
                      </div>
                    </div>
                    <div className="text-xs font-bold bg-white text-amber-700 px-3 py-2 rounded-xl">Lanjut</div>
                  </button>
                </div>
              )}
            </>
          )}
        </main>
      )}

      {}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white h-full flex flex-col shadow-2xl">
            <div className="p-4 border-b flex justify-between items-center bg-slate-50"><h2 className="font-bold flex items-center"><ShoppingCart className="w-4 h-4 mr-2 text-amber-600"/>Keranjang</h2><button onClick={() => setIsCartOpen(false)}><X className="w-5 h-5"/></button></div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {cart.map((item) => (
                <div key={item.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border">
                  <div>
                    <h4 className="font-bold text-sm text-slate-800">{item.name}</h4>
                    <p className="text-xs text-amber-600 font-semibold">{formatRupiah(Number(item.priceOwner) + Number(item.priceOrganizer))}</p>
                  </div>
                  <div className="flex items-center space-x-2 bg-white border p-1 rounded-lg">
                    <button onClick={() => updateCartQty(item.id, -1)} className="w-6 h-6 bg-slate-100 rounded font-bold text-xs">-</button>
                    <span className="text-xs font-bold w-4 text-center">{item.qty}</span>
                    <button onClick={() => updateCartQty(item.id, 1)} className="w-6 h-6 bg-amber-600 text-white rounded font-bold text-xs">+</button>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4 border-t bg-white">
              <div className="flex justify-between mb-3"><span className="text-sm font-medium">Total:</span><span className="text-lg font-black text-amber-600">{formatRupiah(cartSummary.totalSellingPrice)}</span></div>
              <button onClick={() => { setIsCartOpen(false); setIsCheckoutModalOpen(true); }} className="w-full py-3 bg-amber-600 text-white font-bold rounded-xl flex justify-center items-center space-x-2"><span>Isi Data Anak</span><Send className="w-4 h-4"/></button>
            </div>
          </div>
        </div>
      )}

      {isCheckoutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <button onClick={() => setIsCheckoutModalOpen(false)} className="absolute top-4 right-4"><X className="w-5 h-5 text-slate-400"/></button>
            <h3 className="text-lg font-bold mb-1">Form Pemesanan</h3>
            <p className="text-xs text-slate-500 mb-4">Akan dicatat ke Batch: <strong>{activeBatch?.name}</strong></p>
            <form onSubmit={handleCheckoutSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold mb-1">Nama Lengkap Anak <span className="text-red-500">*</span></label>
                <input type="text" required value={checkoutData.namaAnak} onChange={(e) => setCheckoutData({...checkoutData, namaAnak: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-sm" />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1">Pilih Kelas <span className="text-red-500">*</span></label>
                <select value={checkoutData.kelas} onChange={(e) => setCheckoutData({...checkoutData, kelas: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-sm">
                  <option value="">-- Pilih Kelas --</option>
                  {classesList.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold mb-1">Nama Ortu <span className="text-red-500">*</span></label>
                <input type="text" required value={checkoutData.namaOrtu} onChange={(e) => setCheckoutData({...checkoutData, namaOrtu: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-sm" />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1">Catatan (Opsional)</label>
                <textarea rows="2" value={checkoutData.catatan} onChange={(e) => setCheckoutData({...checkoutData, catatan: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-sm" />
              </div>
              <button type="submit" className="w-full py-3 bg-green-600 text-white font-bold rounded-xl flex justify-center items-center mt-2 shadow-md">
                <MessageCircle className="w-4 h-4 mr-2" />Kirim via WhatsApp
              </button>
            </form>
          </div>
        </div>
      )}

      {}
      {activeTab === 'admin' && (
        <main className="max-w-5xl mx-auto px-4 pt-6">
          {!isAdminLoggedIn ? (
            <div className="max-w-sm mx-auto bg-white rounded-2xl border p-6 shadow-xl">
              <h2 className="text-xl font-black text-center mb-4">Login Admin PTA</h2>
              <form onSubmit={(e) => {
                e.preventDefault();
                if (e.target.user.value === adminAuth.username && e.target.pass.value === adminAuth.password) { setIsAdminLoggedIn(true); showToast('Login Berhasil!'); }
                else showToast('Username/Password Salah!');
              }} className="space-y-3">
                <input name="user" type="text" required placeholder="Username" className="w-full px-3 py-2 border rounded-xl text-sm" />
                <input name="pass" type="password" required placeholder="Password" className="w-full px-3 py-2 border rounded-xl text-sm" />
                <button type="submit" className="w-full py-2.5 bg-indigo-600 text-white font-bold rounded-xl shadow-md text-sm">Masuk</button>
              </form>
            </div>
          ) : (
            <div className="space-y-4 sm:space-y-6">
              {/* Admin Navigation Mobile Friendly */}
              <div className="bg-white rounded-xl shadow-sm border p-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center space-x-2 px-2">
                  <User className="w-4 h-4 text-indigo-600" /><span className="text-xs font-bold">Admin Active</span>
                </div>
                <div className="flex flex-wrap gap-2 overflow-x-auto scrollbar-none">
                  {[{id:'batch_reports', label:'Rekap Per Tenant'}, {id:'tenants', label:'Kelola Stand'}, {id:'batches', label:'Kelola Batch'}, {id:'products', label:'Produk'}, {id:'orders', label:`Pesanan (${orders.length})`}, {id:'class_pics', label:'Kelas'}, {id:'settings', label:'Pengaturan'}].map(tab => (
                    <button key={tab.id} onClick={() => setAdminSubTab(tab.id)} className={`px-3 py-1.5 rounded-lg text-[10px] sm:text-xs font-semibold whitespace-nowrap ${adminSubTab === tab.id ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                      {tab.label}
                    </button>
                  ))}
                  <button onClick={() => setIsAdminLoggedIn(false)} className="px-3 py-1.5 rounded-lg text-[10px] sm:text-xs font-semibold bg-red-100 text-red-600">Logout</button>
                </div>
              </div>

              {/* SubTabs Data */}
              {adminSubTab === 'batch_reports' && (
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-2 items-end">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">Pilih Batch</label>
                      <select value={reportSelectedBatchId} onChange={e => setReportSelectedBatchId(e.target.value)} className="px-3 py-2 bg-white border rounded-lg text-xs font-bold">
                        {batches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">Status</label>
                      <select value={reportSelectedStatus} onChange={e => setReportSelectedStatus(e.target.value)} className="px-3 py-2 bg-white border rounded-lg text-xs font-bold">
                        <option value="Paid">Paid (Lunas)</option>
                        <option value="Unpaid">Unpaid</option>
                        <option value="ALL">Semua</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {batchReportData.map((tenantRep) => (
                      <div key={tenantRep.tenantId} className="bg-white rounded-xl border shadow-sm p-4">
                        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b pb-3 mb-3">
                          <div>
                            <h4 className="font-bold text-slate-900 text-lg">{tenantRep.tenantName}</h4>
                            <p className="text-xs text-slate-500">PJ: {tenantRep.tenantOwner} | WA: {tenantRep.tenantPhone}</p>
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => {
                              const currBatch = batches.find(b => b.id === reportSelectedBatchId);
                              setPrintData({
                                ...tenantRep,
                                batchName: currBatch?.name || '-',
                                readyDate: currBatch?.readyDate || ''
                              });
                            }} className="px-3 py-1.5 bg-slate-800 text-white text-xs font-bold rounded-lg flex items-center space-x-1.5"><Printer className="w-3.5 h-3.5"/><span>Cetak / Export PDF</span></button>
                          </div>
                        </div>

                        {/* Summary View in Screen */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="text-xs space-y-1">
                            <p className="font-bold text-slate-400 uppercase mb-2">Ringkasan Item:</p>
                            {Object.keys(tenantRep.itemTotalsMap).map(k => (
                              <div key={k} className="flex justify-between border-b border-dashed pb-1">
                                <span>{k}</span><span className="font-bold">{tenantRep.itemTotalsMap[k].qty} Pcs</span>
                              </div>
                            ))}
                          </div>
                          <div className="text-xs bg-emerald-50 border border-emerald-100 p-3 rounded-lg space-y-2">
                            <div className="flex justify-between text-emerald-800"><span>Total Hak Vendor:</span><span className="font-bold">{formatRupiah(tenantRep.tenantTotalOwnerShare)}</span></div>
                            <div className="flex justify-between text-amber-800"><span>Total Margin Jual:</span><span className="font-bold">{formatRupiah(tenantRep.tenantTotalMargin)}</span></div>
                            <div className="flex justify-between text-slate-900 font-black border-t border-emerald-200 pt-2"><span>Total Omset Stand:</span><span>{formatRupiah(tenantRep.tenantTotalGross)}</span></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {adminSubTab === 'products' && (
                <div className="space-y-4">
                  <div className="flex justify-between"><h3 className="font-bold">Produk</h3><button onClick={() => setProductModal({isOpen:true, item:null})} className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-lg">+ Tambah</button></div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {products.map(p => (
                      <div key={p.id} className="bg-white p-3 rounded-xl border flex items-center space-x-3">
                        <img src={p.imageUrl || ''} alt="" className="w-12 h-12 rounded-lg bg-slate-100 object-cover" />
                        <div className="flex-1 text-xs">
                          <h4 className="font-bold">{p.name}</h4>
                          <p className="text-slate-500">{tenants.find(t=>t.id===p.tenantId)?.name}</p>
                          <p className="font-bold text-amber-600 mt-1">{formatRupiah(Number(p.priceOwner) + Number(p.priceOrganizer))}</p>
                        </div>
                        <div className="flex flex-col space-y-1">
                          <button onClick={()=>setProductModal({isOpen:true, item:p})} className="p-1.5 bg-blue-50 text-blue-600 rounded"><Edit3 className="w-3.5 h-3.5"/></button>
                          <button onClick={()=>setConfirmModal({isOpen:true, title:'Hapus Produk', message:`Hapus ${p.name}?`, onConfirm: () => { const n = products.filter(x=>x.id!==p.id); setProducts(n); syncPushToCloud({products:n}); }})} className="p-1.5 bg-red-50 text-red-600 rounded"><Trash2 className="w-3.5 h-3.5"/></button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {adminSubTab === 'batches' && (
                <div className="space-y-4">
                  <div className="flex justify-between"><h3 className="font-bold">Kelola Batch</h3><button onClick={() => setBatchModal({isOpen:true, item:null})} className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-lg">+ Tambah</button></div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {batches.map(b => (
                      <div key={b.id} className={`bg-white p-4 rounded-xl border ${b.isActive?'border-indigo-500':'border-slate-200'}`}>
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-bold">{b.name} <span className="text-[10px] ml-2 text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">{b.isActive?'Aktif':''}</span></h4>
                          <div className="flex gap-1">
                            <button onClick={()=>setBatchModal({isOpen:true, item:b})} className="p-1 text-blue-600"><Edit3 className="w-4 h-4"/></button>
                            <button onClick={()=>setConfirmModal({isOpen:true, title:'Hapus Batch', message:'Yakin hapus?', onConfirm:()=>{const n=batches.filter(x=>x.id!==b.id); setBatches(n); syncPushToCloud({batches:n})}})} className="p-1 text-red-600"><Trash2 className="w-4 h-4"/></button>
                          </div>
                        </div>
                        <p className="text-xs text-slate-500">Pesan: {formatIndoDate(b.startDate)} - {formatIndoDate(b.endDate)}</p>
                        <p className="text-xs text-slate-500">Distribusi/Ready: {formatIndoDate(b.readyDate)}</p>
                        {!b.isActive && <button onClick={()=>{const n=batches.map(x=>({...x,isActive:x.id===b.id})); setBatches(n); syncPushToCloud({batches:n})}} className="mt-3 px-3 py-1 bg-slate-100 text-xs font-bold rounded-lg w-full">Set Aktif</button>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {adminSubTab === 'tenants' && (
                <div className="space-y-4">
                  <div className="flex justify-between"><h3 className="font-bold">Kelola Stand</h3><button onClick={() => setTenantModal({isOpen:true, item:null})} className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-lg">+ Tambah</button></div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {tenants.map(t => (
                      <div key={t.id} className="bg-white p-3 rounded-xl border flex justify-between items-center text-xs">
                        <div><h4 className="font-bold">{t.name}</h4><p className="text-slate-500">PJ: {t.owner} - {t.phone}</p></div>
                        <div className="flex gap-1">
                          <button onClick={()=>setTenantModal({isOpen:true, item:t})} className="p-1.5 bg-blue-50 text-blue-600 rounded"><Edit3 className="w-4 h-4"/></button>
                          <button onClick={()=>setConfirmModal({isOpen:true, title:'Hapus Stand', message:'Yakin?', onConfirm:()=>{const n=tenants.filter(x=>x.id!==t.id); setTenants(n); syncPushToCloud({tenants:n})}})} className="p-1.5 bg-red-50 text-red-600 rounded"><Trash2 className="w-4 h-4"/></button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {adminSubTab === 'class_pics' && (
                <div className="space-y-4">
                  <div className="flex justify-between"><h3 className="font-bold">Routing Kelas WA</h3><button onClick={() => setClassModal({isOpen:true, item:null})} className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-lg">+ Tambah</button></div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {classesList.map(c => (
                      <div key={c.id} className="bg-white p-3 rounded-xl border flex justify-between items-center text-xs">
                        <div><h4 className="font-bold">{c.name}</h4><p className="text-slate-500">WA: {c.phone}</p></div>
                        <div className="flex gap-1">
                          <button onClick={()=>setClassModal({isOpen:true, item:c})} className="p-1.5 bg-blue-50 text-blue-600 rounded"><Edit3 className="w-4 h-4"/></button>
                          <button onClick={()=>setConfirmModal({isOpen:true, title:'Hapus Kelas', message:'Yakin?', onConfirm:()=>{const n=classesList.filter(x=>x.id!==c.id); setClassesList(n); syncPushToCloud({classes:n})}})} className="p-1.5 bg-red-50 text-red-600 rounded"><Trash2 className="w-4 h-4"/></button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {adminSubTab === 'orders' && (
                <div className="space-y-3">
                  <h3 className="font-bold text-slate-900 text-sm">Semua Pesanan ({orders.length})</h3>
                  {orders.map((ord) => (
                    <div key={ord.orderId} className="bg-white p-3 sm:p-4 rounded-xl border text-xs shadow-sm">
                      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 mb-2 border-b pb-2">
                        <div>
                          <span className="font-black text-indigo-700">{ord.orderId}</span>
                          <span className="font-bold ml-2">{ord.customer?.namaAnak} ({ord.customer?.kelas})</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <select value={ord.status} onChange={(e)=>{
                            const newStatus = e.target.value;
                            const n = orders.map(o => o.orderId === ord.orderId ? {...o, status: newStatus} : o);
                            setOrders(n);
                            if(sheetWebhookUrl) fetch(sheetWebhookUrl, {method:'POST',mode:'no-cors',body:JSON.stringify({action:'updateOrderStatus',orderId:ord.orderId,status:newStatus})});
                            showToast('Status Disimpan!');
                          }} className="bg-slate-50 border px-2 py-1 rounded font-bold">
                            <option value="Paid">Paid</option>
                            <option value="Unpaid">Unpaid</option>
                            <option value="Void">Void</option>
                          </select>
                          <button onClick={()=>setConfirmModal({isOpen:true, title:'Hapus Pesanan', message:`Hapus ${ord.orderId}?`, onConfirm:()=>{const n=orders.filter(o=>o.orderId!==ord.orderId); setOrders(n);}})} className="p-1 text-red-500 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4"/></button>
                        </div>
                      </div>
                      <div className="space-y-1 text-slate-600">
                        {ord.items.map((it, idx) => {
                          const cleanObj = parseAndCleanItem(it.name);
                          const sp = Number(it.priceOwner || 0) + Number(it.priceOrganizer || 0);
                          return (
                            <div key={idx} className="flex justify-between">
                              <span>{cleanObj.name} (x{cleanObj.qty * (it.qty||1)}) @ {formatRupiah(sp)}</span>
                              <span className="font-bold text-slate-800">{formatRupiah(sp * cleanObj.qty * (it.qty||1))}</span>
                            </div>
                          )
                        })}
                      </div>
                      <div className="mt-2 pt-2 border-t flex justify-between font-black text-amber-700 text-sm">
                        <span>TOTAL</span><span>{formatRupiah(ord.totalAmount)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {adminSubTab === 'settings' && (
                <div className="max-w-md bg-white rounded-xl border p-4 space-y-4 text-xs">
                  <h3 className="font-bold text-sm">Integrasi Database & Sandi</h3>
                  <div className="bg-indigo-50 p-3 rounded-lg border border-indigo-100">
                    <p className="font-bold text-indigo-900 mb-2">Sync Otomatis ke HP Panitia Lain</p>
                    <button onClick={()=>{navigator.clipboard.writeText(`${window.location.origin}${window.location.pathname}?sheet=${encodeURIComponent(sheetWebhookUrl)}`);showToast('Link Disalin!');}} className="w-full py-2 bg-indigo-600 text-white rounded-lg flex justify-center font-bold"><Share2 className="w-3.5 h-3.5 mr-1"/> Salin Link Sync Web</button>
                  </div>
                  <form onSubmit={e => {e.preventDefault(); localStorage.setItem('ld_bazaar_sheet_webhook', sheetWebhookUrl); syncPushToCloud();}} className="space-y-3">
                    <div><label className="font-bold mb-1 block">Google Sheets Webhook URL</label><input type="url" value={sheetWebhookUrl} onChange={e=>setSheetWebhookUrl(e.target.value)} className="w-full p-2 border rounded-lg" /></div>
                    <div><label className="font-bold mb-1 block">Username Admin</label><input type="text" value={adminAuth.username} onChange={e=>setAdminAuth({...adminAuth, username: e.target.value})} className="w-full p-2 border rounded-lg" /></div>
                    <div><label className="font-bold mb-1 block">Password Admin</label><input type="text" value={adminAuth.password} onChange={e=>setAdminAuth({...adminAuth, password: e.target.value})} className="w-full p-2 border rounded-lg" /></div>
                    <button type="submit" className="w-full py-2.5 bg-emerald-600 text-white font-bold rounded-lg flex items-center justify-center"><Save className="w-4 h-4 mr-1"/> Simpan Pengaturan</button>
                  </form>
                </div>
              )}
            </div>
          )}
        </main>
      )}

      {}
      {printData && (
        <div className="fixed inset-0 z-50 bg-white overflow-y-auto print:bg-white">
          <div className="print:hidden sticky top-0 z-50 bg-slate-900 text-white p-4 shadow-xl border-b-4 border-amber-500 flex flex-wrap justify-between items-center gap-3">
            <div><h2 className="font-bold">Mode Export PDF / WA</h2><p className="text-xs text-slate-300">WA tidak bisa kirim file otomatis. 1: Simpan PDF, 2: Buka WA & Lampirkan manual.</p></div>
            <div className="flex gap-2">
              <button onClick={() => setPrintData(null)} className="px-3 py-2 bg-slate-700 text-xs font-bold rounded-lg">Kembali</button>
              <button onClick={() => window.print()} className="px-3 py-2 bg-emerald-600 text-xs font-bold rounded-lg flex items-center"><Printer className="w-3.5 h-3.5 mr-1"/> 1. Cetak / Simpan PDF</button>
              <button onClick={() => {
                let clean = printData.tenantPhone.replace(/[^0-9]/g, '');
                if (clean.startsWith('0')) clean = '62' + clean.slice(1);
                
                // Text WA Tenant Tanpa Emoji, ada Tanggal Ready
                let text = `REKAP PESANAN - ${printData.tenantName.toUpperCase()}\n`;
                text += `Periode: ${printData.batchName}\n`;
                if(printData.readyDate) text += `Tanggal ready: ${formatIndoDate(printData.readyDate)}\n`;
                text += `\n`;
                
                Object.keys(printData.itemTotalsMap).forEach((name) => {
                  const o = printData.itemTotalsMap[name];
                  text += `* ${name}: ${o.qty} pcs (${formatRupiah(o.priceOwner * o.qty)})\n`;
                });
                
                text += `\nTOTAL HARGA PRODUCT: ${formatRupiah(printData.tenantTotalOwnerShare)}`;
                text += `\nTOTAL MARGIN JUAL: ${formatRupiah(printData.tenantTotalMargin)}`;
                text += `\nNOMINAL TOTAL: ${formatRupiah(printData.tenantTotalGross)}\n\n`;
                text += `Terima kasih! (Mohon cek file PDF terlampir)`;
                
                window.open(`https://wa.me/${clean}?text=${encodeURIComponent(text)}`, '_blank');
              }} className="px-3 py-2 bg-blue-600 text-xs font-bold rounded-lg flex items-center"><Send className="w-3.5 h-3.5 mr-1"/> 2. Buka WA & Lampirkan</button>
            </div>
          </div>

          <div className="p-8 max-w-5xl mx-auto text-black text-xs print:p-0">
            <h1 className="text-xl font-black text-emerald-800 mb-1">Bazaar DANUS PTA Little Darbi</h1>
            <h2 className="text-base font-bold text-slate-800">Rekapitulasi Dapur Stand: {printData.tenantName}</h2>
            <p className="text-slate-500 mb-6">Periode: {printData.batchName} | Ready: {formatIndoDate(printData.readyDate)} | PJ: {printData.tenantOwner} ({printData.tenantPhone})</p>

            <h3 className="font-bold mb-2">1. Detail Pesanan Pembeli ({printData.customerOrdersDetail.length})</h3>
            <table className="w-full border-collapse border border-slate-300 mb-8">
              <thead><tr className="bg-slate-100 text-left"><th className="border p-2">No</th><th className="border p-2">Nama Anak</th><th className="border p-2">Kelas</th><th className="border p-2">Nama Ortu</th><th className="border p-2">Detail Pesanan</th><th className="border p-2">Catatan</th></tr></thead>
              <tbody>
                {printData.customerOrdersDetail.map((c, i) => (
                  <tr key={i}><td className="border p-2">{i+1}</td><td className="border p-2 font-bold">{c.namaAnak}</td><td className="border p-2">{c.kelas}</td><td className="border p-2">{c.namaOrtu}</td>
                    <td className="border p-2">{c.items.map(it => `${it.cleanName} (x${it.qty})`).join(', ')}</td><td className="border p-2 italic">{c.catatan}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <h3 className="font-bold mb-2">2. Ringkasan Pesanan (Dapur)</h3>
            <table className="w-full border-collapse border border-slate-300">
              <thead><tr className="bg-slate-100 text-left"><th className="border p-2">Produk</th><th className="border p-2 text-center">Qty</th><th className="border p-2 text-right">Harga owner</th><th className="border p-2 text-right">Margin Jual</th><th className="border p-2 text-right">Nominal total</th></tr></thead>
              <tbody>
                {Object.keys(printData.itemTotalsMap).map((k, i) => {
                  const o = printData.itemTotalsMap[k];
                  return (
                    <tr key={i}><td className="border p-2 font-bold">{k}</td><td className="border p-2 text-center font-bold">{o.qty}</td><td className="border p-2 text-right">{formatRupiah(o.priceOwner * o.qty)}</td><td className="border p-2 text-right">{formatRupiah(o.priceOrganizer * o.qty)}</td><td className="border p-2 text-right font-bold text-slate-800">{formatRupiah((o.priceOwner + o.priceOrganizer) * o.qty)}</td></tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-emerald-50 font-black"><td colSpan={2} className="border p-2 text-right text-emerald-800">TOTAL KESELURUHAN:</td><td className="border p-2 text-right text-emerald-700">{formatRupiah(printData.tenantTotalOwnerShare)}</td><td className="border p-2 text-right text-amber-700">{formatRupiah(printData.tenantTotalMargin)}</td><td className="border p-2 text-right text-slate-900">{formatRupiah(printData.tenantTotalGross)}</td></tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl max-w-xs w-full p-5 text-center shadow-2xl">
            <h3 className="font-bold text-lg mb-2">{confirmModal.title}</h3><p className="text-sm text-slate-500 mb-5">{confirmModal.message}</p>
            <div className="flex gap-2 justify-center">
              <button onClick={()=>setConfirmModal({isOpen:false})} className="px-4 py-2 bg-slate-100 rounded-lg text-sm font-bold">Batal</button>
              <button onClick={()=>{confirmModal.onConfirm();setConfirmModal({isOpen:false});}} className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-bold">Ya, Lanjutkan</button>
            </div>
          </div>
        </div>
      )}

      {productModal.isOpen && (
        <ModalProductForm item={productModal.item} tenants={tenants} onClose={()=>setProductModal({isOpen:false})} onSave={(d)=>{
          const n = productModal.item ? products.map(p=>p.id===d.id?d:p) : [...products, {...d, id:'p-'+Date.now(), available:true}];
          setProducts(n); syncPushToCloud({products:n}); setProductModal({isOpen:false});
        }} />
      )}
      
      {tenantModal.isOpen && (
        <ModalTenantForm item={tenantModal.item} onClose={()=>setTenantModal({isOpen:false})} onSave={(d)=>{
          const n = tenantModal.item ? tenants.map(t=>t.id===d.id?d:t) : [...tenants, {...d, id:'t-'+Date.now()}];
          setTenants(n); syncPushToCloud({tenants:n}); setTenantModal({isOpen:false});
        }} />
      )}

      {batchModal.isOpen && (
        <ModalBatchForm item={batchModal.item} onClose={()=>setBatchModal({isOpen:false})} onSave={(d)=>{
          const n = batchModal.item ? batches.map(b=>b.id===d.id?d:b) : [...batches, {...d, id:'b-'+Date.now(), isActive:false}];
          setBatches(n); syncPushToCloud({batches:n}); setBatchModal({isOpen:false});
        }} />
      )}

      {classModal.isOpen && (
        <ModalClassForm item={classModal.item} onClose={()=>setClassModal({isOpen:false})} onSave={(d)=>{
          const n = classModal.item ? classesList.map(c=>c.id===d.id?d:c) : [...classesList, {...d, id:'c-'+Date.now()}];
          setClassesList(n); syncPushToCloud({classes:n}); setClassModal({isOpen:false});
        }} />
      )}
    </div>
  );
}

function ModalProductForm({ item, tenants, onClose, onSave }) {
  const [form, setForm] = useState(item || { name:'', tenantId:tenants[0]?.id||'', priceOwner:0, priceOrganizer:0, imageUrl:'' });
  const [isCompressing, setIsCompressing] = useState(false);
  
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if(!file) return;
    setIsCompressing(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 400; const scaleSize = MAX_WIDTH / img.width;
        canvas.width = MAX_WIDTH; canvas.height = img.height * scaleSize;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        setForm({...form, imageUrl: canvas.toDataURL('image/jpeg', 0.6)});
        setIsCompressing(false);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-xl max-w-sm w-full p-5 shadow-2xl relative text-xs">
        <button onClick={onClose} className="absolute top-4 right-4"><X className="w-5 h-5 text-slate-400"/></button>
        <h3 className="font-bold text-sm mb-3">{item?'Edit Produk':'Produk Baru'}</h3>
        <form onSubmit={e => {e.preventDefault(); onSave(form)}} className="space-y-3">
          <div><label className="font-bold mb-1 block">Nama</label><input required value={form.name} onChange={e=>setForm({...form,name:e.target.value})} className="w-full p-2 border rounded-lg" /></div>
          <div><label className="font-bold mb-1 block">Stand</label><select value={form.tenantId} onChange={e=>setForm({...form,tenantId:e.target.value})} className="w-full p-2 border rounded-lg">{tenants.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}</select></div>
          <div className="grid grid-cols-2 gap-2">
            <div><label className="font-bold mb-1 block">Harga Owner</label><input type="number" required value={form.priceOwner} onChange={e=>setForm({...form,priceOwner:e.target.value})} className="w-full p-2 border rounded-lg" /></div>
            <div><label className="font-bold mb-1 block">Margin</label><input type="number" required value={form.priceOrganizer} onChange={e=>setForm({...form,priceOrganizer:e.target.value})} className="w-full p-2 border rounded-lg" /></div>
          </div>
          <div>
            <label className="font-bold mb-1 block">Foto (Pilih dari Galeri)</label>
            <div className="flex items-center space-x-2">
              <label className="flex-1 py-2 bg-slate-100 border-2 border-dashed rounded-lg text-center font-bold text-slate-600 cursor-pointer hover:bg-slate-200">
                {isCompressing ? 'Memproses...' : '+ Pilih Foto'}
                <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
              </label>
              {form.imageUrl && <img src={form.imageUrl} alt="" className="w-10 h-10 object-cover rounded-lg border" />}
            </div>
          </div>
          <button type="submit" className="w-full py-2.5 bg-indigo-600 text-white font-bold rounded-lg">Simpan</button>
        </form>
      </div>
    </div>
  );
}

function ModalTenantForm({ item, onClose, onSave }) {
  const [form, setForm] = useState(item || { name:'', owner:'', phone:'' });
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-xl max-w-sm w-full p-5 shadow-2xl relative text-xs">
        <button onClick={onClose} className="absolute top-4 right-4"><X className="w-5 h-5 text-slate-400"/></button>
        <h3 className="font-bold text-sm mb-3">{item?'Edit Stand':'Stand Baru'}</h3>
        <form onSubmit={e => {e.preventDefault(); onSave(form)}} className="space-y-3">
          <input required placeholder="Nama Stand" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} className="w-full p-2 border rounded-lg" />
          <input required placeholder="Nama PJ" value={form.owner} onChange={e=>setForm({...form,owner:e.target.value})} className="w-full p-2 border rounded-lg" />
          <input required placeholder="WA (628...)" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} className="w-full p-2 border rounded-lg" />
          <button type="submit" className="w-full py-2.5 bg-indigo-600 text-white font-bold rounded-lg">Simpan</button>
        </form>
      </div>
    </div>
  );
}

function ModalBatchForm({ item, onClose, onSave }) {
  const d = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState(item || { name:'', startDate:d, endDate:d, readyDate:d });
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-xl max-w-sm w-full p-5 shadow-2xl relative text-xs">
        <button onClick={onClose} className="absolute top-4 right-4"><X className="w-5 h-5 text-slate-400"/></button>
        <h3 className="font-bold text-sm mb-3">{item?'Edit Batch':'Batch Baru'}</h3>
        <form onSubmit={e => {e.preventDefault(); onSave(form)}} className="space-y-3">
          <div><label className="font-bold mb-1 block">Nama Batch</label><input required value={form.name} onChange={e=>setForm({...form,name:e.target.value})} className="w-full p-2 border rounded-lg" /></div>
          <div className="grid grid-cols-2 gap-2">
            <div><label className="font-bold mb-1 block">Tgl Buka</label><input type="date" required value={form.startDate} onChange={e=>setForm({...form,startDate:e.target.value})} className="w-full p-2 border rounded-lg" /></div>
            <div><label className="font-bold mb-1 block">Tgl Tutup</label><input type="date" required value={form.endDate} onChange={e=>setForm({...form,endDate:e.target.value})} className="w-full p-2 border rounded-lg" /></div>
          </div>
          <div><label className="font-bold text-emerald-700 mb-1 block">Tanggal Ready / Distribusi</label><input type="date" required value={form.readyDate} onChange={e=>setForm({...form,readyDate:e.target.value})} className="w-full p-2 border-emerald-200 bg-emerald-50 rounded-lg" /></div>
          <button type="submit" className="w-full py-2.5 bg-indigo-600 text-white font-bold rounded-lg">Simpan</button>
        </form>
      </div>
    </div>
  );
}

function ModalClassForm({ item, onClose, onSave }) {
  const [form, setForm] = useState(item || { name:'', phone:'' });
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-xl max-w-sm w-full p-5 shadow-2xl relative text-xs">
        <button onClick={onClose} className="absolute top-4 right-4"><X className="w-5 h-5 text-slate-400"/></button>
        <h3 className="font-bold text-sm mb-3">{item?'Edit Kelas':'Kelas Baru'}</h3>
        <form onSubmit={e => {e.preventDefault(); onSave(form)}} className="space-y-3">
          <input required placeholder="Nama Kelas" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} className="w-full p-2 border rounded-lg" />
          <input required placeholder="WA PIC (628...)" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} className="w-full p-2 border rounded-lg" />
          <button type="submit" className="w-full py-2.5 bg-indigo-600 text-white font-bold rounded-lg">Simpan</button>
        </form>
      </div>
    </div>
  );
}