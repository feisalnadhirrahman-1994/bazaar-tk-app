import React, { useState, useEffect, useMemo } from 'react';
import { 
  ShoppingBag, ShoppingCart, Plus, Trash2, Edit3, CheckCircle2, 
  MessageCircle, Store, Settings, Search, FileSpreadsheet, X, Send,
  User, School, Lock, Phone, Image as ImageIcon, Upload, 
  AlertCircle, RefreshCw, Layers, Printer, Save, Share2, Menu
} from 'lucide-react';

const DEFAULT_WEBHOOK_URL = 'https://script.google.com/macros/s/AKfycbwMORs9RhRXNQhQf5s0NhxKkT-IDiyu4NcOSXpcHkU3175JdLo5E-l_9166sznyL9U/exec';

const formatIndoDate = (dateStr) => {
  if (!dateStr) return '-';
  try {
    return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch (e) {
    return dateStr;
  }
};

const formatRupiah = (num) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num || 0);
};

// --- INITIAL DATA (Fallbacks) ---
const INITIAL_TENANTS = [
  { id: 't1', name: 'Stand Snack & Es Ceria', owner: 'Mama Budi (TK A1)', phone: '6281234567891' },
];

const INITIAL_PRODUCTS = [
  { 
    id: 'p1', tenantId: 't1', name: 'Es Lilin Buah Segar', 
    priceOwner: 8000, priceOrganizer: 2000, 
    description: 'Es lilin dari buah asli tanpa pemanis buatan',
    category: 'Minuman', imageUrl: '', available: true
  }
];

const INITIAL_BATCHES = [
  {
    id: 'b1', name: 'Batch 1 - Pre-Order Awal',
    startDate: '2026-08-01', endDate: '2026-08-15', readyDate: '2026-08-20',
    isActive: true, description: 'Gelombang pertama pemesanan makanan bazaar'
  }
];

const INITIAL_CLASSES = [
  { id: 'c1', name: 'Little Owl', phone: '628123456781' },
  { id: 'c3', name: 'TK A1', phone: '628123456783' },
];

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

// Helper to clean duplicate item names from the sheet
const cleanItemName = (name) => {
  if (!name) return '';
  return name.replace(/\(x\d+\)$/g, '').trim();
};

export default function App() {
  const [activeTab, setActiveTab] = useState('shop');
  const [adminSubTab, setAdminSubTab] = useState('batch_reports');
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [toastMessage, setToastMessage] = useState('');
  const [isCloudSyncing, setIsCloudSyncing] = useState(true); // Default true for initial load

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  const [adminAuth, setAdminAuth] = useState(() => {
    const saved = localStorage.getItem('ld_bazaar_admin_auth');
    return saved ? JSON.parse(saved) : { username: 'admin', password: '123' };
  });

  const [sheetWebhookUrl, setSheetWebhookUrl] = useState(() => {
    const saved = localStorage.getItem('ld_bazaar_sheet_webhook');
    return saved && saved.trim() !== '' ? saved : DEFAULT_WEBHOOK_URL;
  });

  const [classesList, setClassesList] = useState(() => JSON.parse(localStorage.getItem('ld_bazaar_classes')) || INITIAL_CLASSES);
  const [tenants, setTenants] = useState(() => JSON.parse(localStorage.getItem('ld_bazaar_tenants')) || INITIAL_TENANTS);
  const [products, setProducts] = useState(() => JSON.parse(localStorage.getItem('ld_bazaar_products')) || INITIAL_PRODUCTS);
  const [batches, setBatches] = useState(() => JSON.parse(localStorage.getItem('ld_bazaar_batches')) || INITIAL_BATCHES);
  const [orders, setOrders] = useState(() => JSON.parse(localStorage.getItem('ld_bazaar_orders')) || []);

  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedTenantFilter, setSelectedTenantFilter] = useState('all');
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

  const [reportSelectedBatchId, setReportSelectedBatchId] = useState('');
  const [reportSelectedStatus, setReportSelectedStatus] = useState('ALL');

  useEffect(() => { localStorage.setItem('ld_bazaar_tenants', JSON.stringify(tenants)); }, [tenants]);
  useEffect(() => { localStorage.setItem('ld_bazaar_products', JSON.stringify(products)); }, [products]);
  useEffect(() => { localStorage.setItem('ld_bazaar_batches', JSON.stringify(batches)); }, [batches]);
  useEffect(() => { localStorage.setItem('ld_bazaar_orders', JSON.stringify(orders)); }, [orders]);
  useEffect(() => { localStorage.setItem('ld_bazaar_classes', JSON.stringify(classesList)); }, [classesList]);
  useEffect(() => { localStorage.setItem('ld_bazaar_admin_auth', JSON.stringify(adminAuth)); }, [adminAuth]);
  useEffect(() => { localStorage.setItem('ld_bazaar_sheet_webhook', sheetWebhookUrl); }, [sheetWebhookUrl]);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const urlSheet = urlParams.get('sheet') || urlParams.get('s');
    if (urlSheet) {
      setSheetWebhookUrl(urlSheet);
      localStorage.setItem('ld_bazaar_sheet_webhook', urlSheet);
      showToast('URL Webhook Berhasil Diidentifikasi!');
    }
  }, []);

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
        if (json.data.batches?.length > 0) {
          setBatches(json.data.batches);
          setReportSelectedBatchId(json.data.batches[0].id); // Auto select first batch
        }
        if (json.data.classes?.length > 0) setClassesList(json.data.classes);
        if (json.data.orders?.length > 0) setOrders(json.data.orders);
        if (json.data.settings?.adminAuth) {
          try {
            setAdminAuth(typeof json.data.settings.adminAuth === 'string' ? JSON.parse(json.data.settings.adminAuth) : json.data.settings.adminAuth);
          } catch(e) {}
        }
        if (!silent) showToast('Data Tersinkronisasi dari Cloud!');
      }
    } catch (e) {
      console.warn('Sync Fetch Error:', e);
    } finally {
      setIsCloudSyncing(false);
    }
  };

  useEffect(() => {
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

      await fetch(targetUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      showToast('Perubahan Disimpan ke Cloud!');
    } catch (err) {
      console.warn('Sync Push Error:', err);
    } finally {
      setIsCloudSyncing(false);
    }
  };

  const activeBatch = useMemo(() => {
    const explicitActive = batches.find((b) => b.isActive);
    if (explicitActive) return explicitActive;
    const todayStr = new Date().toISOString().slice(0, 10);
    return batches.find((b) => todayStr >= b.startDate && todayStr <= b.endDate) || batches[0];
  }, [batches]);

  const handleAdminLogin = (e) => {
    e.preventDefault();
    if (loginForm.username.trim() === adminAuth.username && loginForm.password.trim() === adminAuth.password) {
      setIsAdminLoggedIn(true);
      setLoginError('');
      setLoginForm({ username: '', password: '' });
      showToast('Login Admin Berhasil!');
    } else {
      setLoginError('Username atau Password salah!');
    }
  };

  const addToCart = (product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) => item.id === product.id ? { ...item, qty: item.qty + 1 } : item);
      }
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

  const handleCheckoutSubmit = async (e) => {
    e.preventDefault();
    if (!activeBatch || !checkoutData.namaAnak.trim() || !checkoutData.namaOrtu.trim() || cart.length === 0) return;

    setIsSubmitting(true);
    const newOrderId = 'BZ-' + Math.floor(100000 + Math.random() * 900000);
    
    // Formatting detailed items safely without emojis
    let formattedItemsText = cart.map(item => `${item.name} (x${item.qty})`).join(', ');

    const orderPayload = {
      orderId: newOrderId,
      batchId: activeBatch.id,
      date: new Date().toISOString(),
      customer: { ...checkoutData },
      items: cart.map((item) => ({
        id: item.id,
        name: item.name,
        tenantId: item.tenantId,
        priceOwner: Number(item.priceOwner),
        priceOrganizer: Number(item.priceOrganizer),
        qty: item.qty,
        subtotal: (Number(item.priceOwner) + Number(item.priceOrganizer)) * item.qty
      })),
      totalAmount: cartSummary.totalSellingPrice,
      totalOwnerShare: cartSummary.totalOwnerPrice,
      totalOrganizerShare: cartSummary.totalOrganizerPrice,
      status: 'Unpaid',
      formattedItemsText: formattedItemsText
    };

    setOrders((prev) => [orderPayload, ...prev]);

    const targetUrl = sheetWebhookUrl || DEFAULT_WEBHOOK_URL;
    if (targetUrl) {
      try {
        // Fire and forget, don't await to avoid stalling
        fetch(targetUrl, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'checkout', ...orderPayload })
        });
      } catch (err) {
        console.warn('Webhook error:', err);
      }
    }

    const targetClassObj = classesList.find((c) => c.name === checkoutData.kelas);
    const picPhoneForClass = targetClassObj?.phone || '';
    let cleanPhone = picPhoneForClass ? picPhoneForClass.replace(/[^0-9]/g, '') : '';
    if (cleanPhone.startsWith('0')) cleanPhone = '62' + cleanPhone.slice(1);

    let waText = `*PEMESANAN BAZAAR DANUS PTA LITTLE DARBI*\n`;
    waText += `Periode: ${activeBatch.name}\n`;
    waText += `-----------------------------------\n`;
    waText += `*No. Pesanan:* ${newOrderId}\n`;
    waText += `*Nama Anak:* ${checkoutData.namaAnak}\n`;
    waText += `*Kelas:* ${checkoutData.kelas}\n`;
    waText += `*Nama Ortu/WA:* ${checkoutData.namaOrtu}\n`;
    if (checkoutData.catatan) waText += `*Catatan:* ${checkoutData.catatan}\n`;
    waText += `*Status:* UNPAID (Belum Lunas)\n`;
    waText += `-----------------------------------\n`;
    waText += `*Rincian Pesanan:*\n`;

    cart.forEach((item, index) => {
      const tenant = tenants.find(t => t.id === item.tenantId);
      const tenantName = tenant ? tenant.name : 'Stand';
      const itemSubtotal = (Number(item.priceOwner) + Number(item.priceOrganizer)) * item.qty;
      waText += `${index + 1}. *${item.name}* (x${item.qty}) - ${formatRupiah(itemSubtotal)}\n   _[${tenantName}]_\n`;
    });

    waText += `-----------------------------------\n`;
    waText += `*TOTAL TAGIHAN: ${formatRupiah(orderPayload.totalAmount)}*\n`;
    waText += `-----------------------------------\n`;
    waText += `Halo PIC Kelas ${checkoutData.kelas}, mohon instruksi info rekening pembayaran. Terima kasih!`;

    const encodedWaText = encodeURIComponent(waText);
    const waUrl = `https://wa.me/${cleanPhone}?text=${encodedWaText}`;

    setCart([]);
    setIsCheckoutModalOpen(false);
    setIsCartOpen(false);
    setCheckoutData({ namaAnak: '', kelas: classesList[0]?.name || 'TK A1', namaOrtu: '', catatan: '' });
    setIsSubmitting(false);

    // FIX: Use setTimeout to guarantee window.open doesn't get blocked or stalled
    setTimeout(() => {
      window.open(waUrl, '_blank');
    }, 100);
  };

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchTenant = selectedTenantFilter === 'all' || p.tenantId === selectedTenantFilter;
      const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchTenant && matchSearch && p.available;
    });
  }, [products, selectedTenantFilter, searchQuery]);

  const batchReportData = useMemo(() => {
    let filtered = orders.filter((o) => o.batchId === reportSelectedBatchId);
    if (reportSelectedStatus !== 'ALL') {
      filtered = filtered.filter((o) => o.status === reportSelectedStatus);
    }

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
            namaAnak: ord.customer.namaAnak,
            kelas: ord.customer.kelas,
            namaOrtu: ord.customer.namaOrtu || '-',
            catatan: ord.customer.catatan || '-',
            items: tenantItemsInOrder
          });

          tenantItemsInOrder.forEach((it) => {
            const cleanNameLocal = cleanItemName(it.name);
            if (!itemTotalsMap[cleanNameLocal]) {
              itemTotalsMap[cleanNameLocal] = {
                qty: 0,
                priceOwner: Number(it.priceOwner) || 0,
                priceOrganizer: Number(it.priceOrganizer) || 0,
              };
            }
            itemTotalsMap[cleanNameLocal].qty += it.qty;
            tenantTotalOwnerShare += (Number(it.priceOwner) || 0) * it.qty;
            tenantTotalMargin += (Number(it.priceOrganizer) || 0) * it.qty;
            tenantTotalGross += ((Number(it.priceOwner) || 0) + (Number(it.priceOrganizer) || 0)) * it.qty;
          });
        }
      });

      return {
        tenantId: tenant.id,
        tenantName: tenant.name,
        tenantOwner: tenant.owner,
        tenantPhone: tenant.phone || '',
        customerOrdersDetail,
        itemTotalsMap,
        tenantTotalGross,
        tenantTotalOwnerShare,
        tenantTotalMargin
      };
    });
  }, [orders, reportSelectedBatchId, reportSelectedStatus, tenants]);

  // Main Print Wrapper
  // We apply `print:hidden` to the entire main app wrapper when `printData` is active
  // so the browser only sees the print container.

  return (
    <div className={`min-h-screen bg-slate-50 text-slate-800 font-sans pb-24 ${printData ? 'print:hidden' : ''}`}>
      {toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-2xl text-xs font-bold flex items-center space-x-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* HEADER COMPACT (Mobile Friendly) */}
      <header className="sticky top-0 z-30 bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 py-2 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 shrink-0 p-0.5 bg-amber-50 rounded-lg border border-amber-200 shadow-sm flex items-center justify-center">
              <LittleDarbiLogo className="w-7 h-7" />
            </div>
            <div>
              <h1 className="font-black text-sm leading-tight text-slate-900">Bazaar DANUS</h1>
              <p className="text-[9px] text-slate-500 font-medium">PTA Little Darbi</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => fetchCloudData(false)}
              disabled={isCloudSyncing}
              className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs"
              title="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 ${isCloudSyncing ? 'animate-spin text-indigo-600' : ''}`} />
            </button>

            {/* Mobile Menu Toggle */}
            <div className="relative">
              <button 
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg sm:hidden"
              >
                <Menu className="w-4 h-4" />
              </button>

              <div className={`sm:flex items-center bg-slate-100 p-1 rounded-xl ${isMobileMenuOpen ? 'absolute right-0 top-10 flex-col w-36 shadow-lg border border-slate-200 bg-white z-50' : 'hidden'}`}>
                <button
                  onClick={() => { setActiveTab('shop'); setIsMobileMenuOpen(false); }}
                  className={`w-full px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 ${
                    activeTab === 'shop' ? 'bg-white text-amber-600 shadow-sm' : 'text-slate-600'
                  }`}
                >
                  <ShoppingBag className="w-4 h-4" /><span>Beli</span>
                </button>
                <button
                  onClick={() => { setActiveTab('admin'); setIsMobileMenuOpen(false); }}
                  className={`w-full px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 ${
                    activeTab === 'admin' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600'
                  }`}
                >
                  <Settings className="w-4 h-4" /><span>Admin</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* LOADING SKELETON */}
      {isCloudSyncing && products.length === 1 && products[0].id === 'p1' ? (
        <div className="flex flex-col items-center justify-center pt-20 space-y-4">
          <RefreshCw className="w-8 h-8 text-amber-500 animate-spin" />
          <p className="text-xs font-bold text-slate-500 animate-pulse">Menghubungkan ke Google Sheets...</p>
        </div>
      ) : activeTab === 'shop' ? (
        <main className="max-w-5xl mx-auto px-4 pt-4">
          {activeBatch && (
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-2xl p-4 shadow-sm mb-4">
              <div className="flex items-center space-x-2 mb-1">
                <span className="bg-white/20 text-[9px] uppercase font-bold px-2 py-0.5 rounded-full">{activeBatch.name}</span>
                <span className="text-[10px] text-amber-100">Batas: {formatIndoDate(activeBatch.endDate)}</span>
              </div>
              <h2 className="text-base sm:text-lg font-black leading-tight">Pesan Makanan & Souvenir</h2>
              {activeBatch.readyDate && (
                <p className="text-xs text-amber-100 mt-1 flex items-center">
                  <CheckCircle2 className="w-3 h-3 mr-1" /> Ready: {formatIndoDate(activeBatch.readyDate)}
                </p>
              )}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-2 mb-4">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Cari makanan..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-white rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-amber-500"
              />
            </div>
            <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none">
              <button
                onClick={() => setSelectedTenantFilter('all')}
                className={`px-3 py-2 rounded-xl text-[11px] font-bold whitespace-nowrap transition-all ${
                  selectedTenantFilter === 'all' ? 'bg-amber-600 text-white' : 'bg-white text-slate-600 border'
                }`}
              >
                Semua Stand
              </button>
              {tenants.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setSelectedTenantFilter(t.id)}
                  className={`px-3 py-2 rounded-xl text-[11px] font-bold whitespace-nowrap transition-all ${
                    selectedTenantFilter === t.id ? 'bg-amber-600 text-white' : 'bg-white text-slate-600 border'
                  }`}
                >
                  {t.name}
                </button>
              ))}
            </div>
          </div>

          {/* 2-COLUMN GRID FOR MOBILE */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {filteredProducts.map((prod) => {
              const tenant = tenants.find((t) => t.id === prod.tenantId);
              const sellingPrice = Number(prod.priceOwner || 0) + Number(prod.priceOrganizer || 0);
              const inCart = cart.find((item) => item.id === prod.id);

              return (
                <div key={prod.id} className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
                  <div className="h-28 sm:h-40 w-full bg-slate-100 relative">
                    {prod.imageUrl ? (
                      <img src={prod.imageUrl} alt={prod.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-300">
                        <ImageIcon className="w-6 h-6" />
                      </div>
                    )}
                    <span className="absolute top-1 left-1 text-[8px] font-bold bg-white/90 px-1.5 py-0.5 rounded shadow-sm">
                      {tenant?.name || 'Stand'}
                    </span>
                  </div>
                  <div className="p-2 sm:p-3 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="font-bold text-slate-900 text-[11px] sm:text-sm line-clamp-2 leading-tight">{prod.name}</h3>
                      <p className="text-[9px] sm:text-xs text-slate-500 line-clamp-2 mt-0.5">{prod.description}</p>
                    </div>
                    <div className="mt-2 pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <span className="text-xs sm:text-sm font-black text-amber-600">{formatRupiah(sellingPrice)}</span>
                      {inCart ? (
                        <div className="flex items-center space-x-1.5 bg-amber-50 border border-amber-200 p-0.5 rounded-lg w-fit">
                          <button onClick={() => updateCartQty(prod.id, -1)} className="w-6 h-6 bg-white rounded font-bold text-amber-700 shadow-sm text-xs">-</button>
                          <span className="text-[11px] font-bold px-1">{inCart.qty}</span>
                          <button onClick={() => updateCartQty(prod.id, 1)} className="w-6 h-6 bg-amber-600 text-white rounded font-bold shadow-sm text-xs">+</button>
                        </div>
                      ) : (
                        <button onClick={() => addToCart(prod)} className="px-2 py-1.5 bg-slate-900 text-white rounded-lg text-[10px] sm:text-xs font-semibold flex items-center justify-center w-full sm:w-auto">
                          <Plus className="w-3 h-3 mr-0.5" /> Pesan
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {cart.length > 0 && (
            <div className="fixed bottom-4 left-4 right-4 max-w-md mx-auto z-40">
              <button onClick={() => setIsCartOpen(true)} className="w-full bg-amber-600 text-white p-3 rounded-2xl shadow-xl flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="relative bg-white/20 p-2 rounded-xl">
                    <ShoppingCart className="w-5 h-5 text-white" />
                    <span className="absolute -top-1 -right-1 bg-red-500 text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center border border-amber-600">
                      {cartSummary.totalItems}
                    </span>
                  </div>
                  <div className="text-left">
                    <p className="text-[10px] text-amber-100">{cartSummary.totalItems} Pesanan</p>
                    <p className="text-sm font-black">{formatRupiah(cartSummary.totalSellingPrice)}</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold bg-white text-amber-700 px-3 py-1.5 rounded-lg">Keranjang</span>
              </button>
            </div>
          )}
        </main>
      ) : (
        // ADMIN PANEL
        <main className="max-w-5xl mx-auto px-4 pt-4">
          {!isAdminLoggedIn ? (
            <div className="max-w-xs mx-auto bg-white rounded-2xl border p-6 shadow-sm mt-10">
              <div className="text-center mb-4">
                <LittleDarbiLogo className="w-10 h-10 mx-auto mb-2" />
                <h2 className="text-base font-black">Login Admin</h2>
              </div>
              {loginError && <p className="mb-3 text-[10px] text-red-600 text-center bg-red-50 p-2 rounded-lg">{loginError}</p>}
              <form onSubmit={handleAdminLogin} className="space-y-3 text-xs">
                <input type="text" required placeholder="Username" value={loginForm.username} onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })} className="w-full px-3 py-2 border rounded-xl" />
                <input type="password" required placeholder="Password" value={loginForm.password} onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })} className="w-full px-3 py-2 border rounded-xl" />
                <button type="submit" className="w-full py-2.5 bg-indigo-600 text-white font-bold rounded-xl">Masuk</button>
              </form>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex overflow-x-auto gap-2 pb-2 scrollbar-none border-b">
                <button onClick={() => setAdminSubTab('batch_reports')} className={`px-3 py-1.5 rounded-lg text-[11px] font-bold whitespace-nowrap ${adminSubTab === 'batch_reports' ? 'bg-indigo-600 text-white' : 'bg-white border text-slate-600'}`}>Rekap Tenant</button>
                <button onClick={() => setAdminSubTab('orders')} className={`px-3 py-1.5 rounded-lg text-[11px] font-bold whitespace-nowrap ${adminSubTab === 'orders' ? 'bg-indigo-600 text-white' : 'bg-white border text-slate-600'}`}>Pesanan Masuk</button>
                <button onClick={() => setAdminSubTab('products')} className={`px-3 py-1.5 rounded-lg text-[11px] font-bold whitespace-nowrap ${adminSubTab === 'products' ? 'bg-indigo-600 text-white' : 'bg-white border text-slate-600'}`}>Menu Produk</button>
                <button onClick={() => setAdminSubTab('batches')} className={`px-3 py-1.5 rounded-lg text-[11px] font-bold whitespace-nowrap ${adminSubTab === 'batches' ? 'bg-indigo-600 text-white' : 'bg-white border text-slate-600'}`}>Kelola Batch</button>
                <button onClick={() => setAdminSubTab('tenants')} className={`px-3 py-1.5 rounded-lg text-[11px] font-bold whitespace-nowrap ${adminSubTab === 'tenants' ? 'bg-indigo-600 text-white' : 'bg-white border text-slate-600'}`}>Stand Vendor</button>
                <button onClick={() => setAdminSubTab('classes')} className={`px-3 py-1.5 rounded-lg text-[11px] font-bold whitespace-nowrap ${adminSubTab === 'classes' ? 'bg-indigo-600 text-white' : 'bg-white border text-slate-600'}`}>Kelas & PIC</button>
              </div>

              {adminSubTab === 'batch_reports' && (
                <div className="space-y-4">
                  <div className="bg-white p-3 rounded-xl border flex flex-col sm:flex-row gap-2 justify-between">
                    <div>
                      <h3 className="font-bold text-sm">Rekapitulasi Dapur</h3>
                    </div>
                    <div className="flex gap-2 text-xs">
                      <select value={reportSelectedBatchId} onChange={(e) => setReportSelectedBatchId(e.target.value)} className="p-1.5 border rounded-lg bg-slate-50">
                        <option value="">-- Pilih Batch --</option>
                        {batches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                      </select>
                      <select value={reportSelectedStatus} onChange={(e) => setReportSelectedStatus(e.target.value)} className="p-1.5 border rounded-lg bg-slate-50">
                        <option value="Paid">Lunas Saja</option>
                        <option value="ALL">Semua Pesanan</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {batchReportData.map(tenantRep => {
                      const itemNames = Object.keys(tenantRep.itemTotalsMap);
                      if (itemNames.length === 0) return null; // Hide empty tenants
                      const currentBatch = batches.find(b => b.id === reportSelectedBatchId);

                      return (
                        <div key={tenantRep.tenantId} className="bg-white rounded-xl border shadow-sm">
                          <div className="p-3 bg-slate-900 text-white flex flex-col sm:flex-row justify-between sm:items-center gap-2 rounded-t-xl">
                            <div>
                              <h4 className="font-bold text-sm">{tenantRep.tenantName}</h4>
                              <p className="text-[10px] text-slate-300">PJ: {tenantRep.tenantOwner}</p>
                            </div>
                            <div className="flex gap-2">
                              <button 
                                onClick={() => setPrintData({ tenantRep, currentBatch })}
                                className="px-2 py-1.5 bg-blue-600 text-white text-[10px] font-bold rounded-lg flex items-center"
                              >
                                <Printer className="w-3 h-3 mr-1" /> Cetak PDF
                              </button>
                              <button
                                onClick={() => {
                                  let cleanPhone = tenantRep.tenantPhone ? tenantRep.tenantPhone.replace(/[^0-9]/g, '') : '';
                                  if (cleanPhone.startsWith('0')) cleanPhone = '62' + cleanPhone.slice(1);
                                  
                                  let text = `REKAP PESANAN - ${tenantRep.tenantName.toUpperCase()}\n`;
                                  text += `Periode: ${currentBatch?.name || '-'}\n`;
                                  if (currentBatch?.readyDate) text += `Tanggal ready: ${formatIndoDate(currentBatch.readyDate)}\n`;
                                  text += `\n`;
                                  
                                  itemNames.forEach((name) => {
                                      const o = tenantRep.itemTotalsMap[name];
                                      text += `* ${name}: ${o.qty} pcs (${formatRupiah(o.priceOwner * o.qty)})\n`;
                                  });
                                  
                                  text += `\nTOTAL HARGA PRODUCT: ${formatRupiah(tenantRep.tenantTotalOwnerShare)}`;
                                  text += `\nTOTAL MARGIN JUAL: ${formatRupiah(tenantRep.tenantTotalMargin)}`;
                                  text += `\nNOMINAL TOTAL: ${formatRupiah(tenantRep.tenantTotalGross)}\n\n`;
                                  text += `Terima kasih!`;
                                  
                                  const encodedText = encodeURIComponent(text);
                                  const waUrl = `https://wa.me/${cleanPhone}?text=${encodedText}`;
                                  
                                  // Timeout to prevent blocking
                                  setTimeout(() => {
                                    window.open(waUrl, '_blank');
                                  }, 100);
                                }}
                                className="px-2 py-1.5 bg-emerald-600 text-white text-[10px] font-bold rounded-lg flex items-center"
                              >
                                <MessageCircle className="w-3 h-3 mr-1" /> WA Vendor
                              </button>
                            </div>
                          </div>
                          
                          <div className="p-3 text-xs">
                            <h5 className="font-bold text-amber-800 border-b pb-1 mb-2">Ringkasan Dapur</h5>
                            <div className="space-y-1 mb-3">
                              {itemNames.map(name => (
                                <div key={name} className="flex justify-between">
                                  <span>{name}</span>
                                  <span className="font-bold">{tenantRep.itemTotalsMap[name].qty} Pcs</span>
                                </div>
                              ))}
                            </div>
                            <div className="flex justify-between font-bold text-emerald-700 bg-emerald-50 p-2 rounded-lg">
                              <span>Hak Vendor:</span>
                              <span>{formatRupiah(tenantRep.tenantTotalOwnerShare)}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {adminSubTab === 'orders' && (
                <div className="space-y-3">
                  <h3 className="font-bold text-sm">Pesanan Masuk ({orders.length})</h3>
                  {orders.map((ord) => (
                    <div key={ord.orderId} className="bg-white p-3 rounded-xl border text-xs shadow-sm">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-2 gap-2">
                        <div>
                          <span className="font-bold text-indigo-700">{ord.orderId}</span>
                          <span className="font-semibold block">{ord.customer.namaAnak} ({ord.customer.kelas})</span>
                          <span className="text-[10px] text-slate-500">Ortu: {ord.customer.namaOrtu || '-'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <select
                            value={ord.status}
                            onChange={(e) => {
                              const newStatus = e.target.value;
                              const updatedOrders = orders.map(o => o.orderId === ord.orderId ? { ...o, status: newStatus } : o);
                              setOrders(updatedOrders);
                              syncPushToCloud({ orders: updatedOrders });
                            }}
                            className="bg-slate-50 font-bold px-2 py-1.5 rounded-lg border focus:outline-none"
                          >
                            <option value="Unpaid">Unpaid</option>
                            <option value="Paid">Paid</option>
                            <option value="Selesai">Selesai</option>
                            <option value="Batal">Batal</option>
                          </select>
                          <button 
                            onClick={() => {
                              if(confirm(`Hapus pesanan ${ord.orderId}?`)) {
                                const updated = orders.filter(o => o.orderId !== ord.orderId);
                                setOrders(updated);
                                syncPushToCloud({ orders: updated });
                              }
                            }}
                            className="p-1.5 bg-red-50 text-red-600 rounded-lg"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <div className="space-y-0.5 text-slate-600 bg-slate-50 p-2 rounded-lg">
                        {ord.items.map((i, idx) => {
                          const cName = cleanItemName(i.name);
                          const sub = (Number(i.priceOwner) + Number(i.priceOrganizer)) * i.qty;
                          return (
                            <div key={idx} className="flex justify-between text-[10px]">
                              <span>{cName} (x{i.qty})</span>
                              <span className="font-medium">{formatRupiah(sub)}</span>
                            </div>
                          )
                        })}
                        <div className="flex justify-between font-bold text-slate-800 pt-1 border-t mt-1">
                          <span>Total Tagihan:</span>
                          <span>{formatRupiah(ord.totalAmount)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {adminSubTab === 'products' && (
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <h3 className="font-bold text-sm">Produk Menu</h3>
                    <button onClick={() => setProductModal({ isOpen: true, item: null })} className="px-3 py-1.5 bg-indigo-600 text-white text-[10px] font-bold rounded-lg flex items-center">
                      <Plus className="w-3 h-3 mr-1" /> Tambah
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {products.map(p => {
                      const t = tenants.find(x => x.id === p.tenantId);
                      return (
                        <div key={p.id} className="bg-white p-3 rounded-xl border flex gap-3 items-center shadow-sm">
                          {p.imageUrl ? (
                            <img src={p.imageUrl} alt="img" className="w-12 h-12 rounded object-cover" />
                          ) : (
                            <div className="w-12 h-12 bg-slate-100 rounded flex items-center justify-center"><ImageIcon className="w-4 h-4 text-slate-400" /></div>
                          )}
                          <div className="flex-1 text-xs">
                            <h4 className="font-bold text-sm">{p.name}</h4>
                            <p className="text-[10px] text-slate-500">{t?.name}</p>
                            <p className="font-bold text-amber-600 mt-1">{formatRupiah(Number(p.priceOwner) + Number(p.priceOrganizer))}</p>
                          </div>
                          <div className="flex flex-col gap-1">
                            <button onClick={() => setProductModal({ isOpen: true, item: p })} className="p-1.5 bg-blue-50 text-blue-600 rounded"><Edit3 className="w-3.5 h-3.5" /></button>
                            <button onClick={() => {
                              const up = products.filter(x => x.id !== p.id);
                              setProducts(up); syncPushToCloud({ products: up });
                            }} className="p-1.5 bg-red-50 text-red-600 rounded"><Trash2 className="w-3.5 h-3.5" /></button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {adminSubTab === 'batches' && (
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <h3 className="font-bold text-sm">Periode Batch</h3>
                    <button onClick={() => setBatchModal({ isOpen: true, item: null })} className="px-3 py-1.5 bg-indigo-600 text-white text-[10px] font-bold rounded-lg flex items-center">
                      <Plus className="w-3 h-3 mr-1" /> Buat
                    </button>
                  </div>
                  {batches.map(b => (
                    <div key={b.id} className={`bg-white p-3 rounded-xl border ${b.isActive ? 'border-indigo-400' : ''}`}>
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-bold text-sm">{b.name} {b.isActive && <span className="bg-indigo-100 text-indigo-700 text-[9px] px-1.5 py-0.5 rounded ml-1">AKTIF</span>}</h4>
                          <p className="text-[10px] text-slate-500 mt-0.5">Order: {formatIndoDate(b.startDate)} - {formatIndoDate(b.endDate)}</p>
                          <p className="text-[10px] text-emerald-600 font-bold">Ready: {formatIndoDate(b.readyDate)}</p>
                        </div>
                        <div className="flex gap-2 text-xs">
                          <button onClick={() => setBatchModal({ isOpen: true, item: b })} className="text-blue-600 font-bold">Edit</button>
                          {!b.isActive && (
                            <button onClick={() => {
                              const up = batches.map(x => ({ ...x, isActive: x.id === b.id }));
                              setBatches(up); syncPushToCloud({ batches: up });
                            }} className="text-indigo-600 font-bold bg-indigo-50 px-2 py-1 rounded">Set Aktif</button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {adminSubTab === 'classes' && (
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <h3 className="font-bold text-sm">Kelas & PIC</h3>
                    <button onClick={() => setClassModal({ isOpen: true, item: null })} className="px-3 py-1.5 bg-indigo-600 text-white text-[10px] font-bold rounded-lg flex items-center">
                      <Plus className="w-3 h-3 mr-1" /> Tambah
                    </button>
                  </div>
                  {classesList.map(c => (
                    <div key={c.id} className="bg-white p-3 rounded-xl border flex justify-between items-center">
                      <div>
                        <h4 className="font-bold text-sm">{c.name}</h4>
                        <p className="text-[10px] text-slate-500">WA PIC: {c.phone}</p>
                      </div>
                      <div className="flex gap-1">
                         <button onClick={() => setClassModal({ isOpen: true, item: c })} className="p-1.5 bg-blue-50 text-blue-600 rounded"><Edit3 className="w-3.5 h-3.5" /></button>
                         <button onClick={() => {
                            const up = classesList.filter(x => x.id !== c.id);
                            setClassesList(up); syncPushToCloud({ classes: up });
                          }} className="p-1.5 bg-red-50 text-red-600 rounded"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {adminSubTab === 'tenants' && (
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <h3 className="font-bold text-sm">Stand / Tenant</h3>
                    <button onClick={() => setTenantModal({ isOpen: true, item: null })} className="px-3 py-1.5 bg-indigo-600 text-white text-[10px] font-bold rounded-lg flex items-center">
                      <Plus className="w-3 h-3 mr-1" /> Tambah
                    </button>
                  </div>
                  {tenants.map(t => (
                    <div key={t.id} className="bg-white p-3 rounded-xl border flex justify-between items-center">
                      <div>
                        <h4 className="font-bold text-sm">{t.name}</h4>
                        <p className="text-[10px] text-slate-500">PJ: {t.owner} ({t.phone})</p>
                      </div>
                      <div className="flex gap-1">
                         <button onClick={() => setTenantModal({ isOpen: true, item: t })} className="p-1.5 bg-blue-50 text-blue-600 rounded"><Edit3 className="w-3.5 h-3.5" /></button>
                         <button onClick={() => {
                            const up = tenants.filter(x => x.id !== t.id);
                            setTenants(up); syncPushToCloud({ tenants: up });
                          }} className="p-1.5 bg-red-50 text-red-600 rounded"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

            </div>
          )}
        </main>
      )}

      {/* MODALS */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60">
          <div className="w-full max-w-sm bg-white h-full flex flex-col shadow-2xl">
            <div className="p-4 border-b flex justify-between items-center bg-slate-50">
              <h2 className="font-bold text-sm flex items-center"><ShoppingCart className="w-4 h-4 mr-2" /> Keranjang</h2>
              <button onClick={() => setIsCartOpen(false)} className="p-1"><X className="w-5 h-5 text-slate-500" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {cart.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-2 bg-white border rounded-xl text-xs">
                  <div>
                    <h4 className="font-bold line-clamp-1">{item.name}</h4>
                    <p className="text-[10px] text-amber-600 font-semibold">{formatRupiah((Number(item.priceOwner) + Number(item.priceOrganizer)) * item.qty)}</p>
                  </div>
                  <div className="flex items-center space-x-2 bg-slate-50 border p-0.5 rounded-lg">
                    <button onClick={() => updateCartQty(item.id, -1)} className="w-5 h-5 bg-white rounded shadow-sm text-xs font-bold">-</button>
                    <span className="text-[10px] font-bold w-3 text-center">{item.qty}</span>
                    <button onClick={() => updateCartQty(item.id, 1)} className="w-5 h-5 bg-amber-500 text-white rounded shadow-sm text-xs font-bold">+</button>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4 border-t bg-white">
              <button onClick={() => { setIsCartOpen(false); setIsCheckoutModalOpen(true); }} className="w-full py-3 bg-amber-600 text-white font-bold rounded-xl shadow-md text-xs">
                Lanjut Checkout ({formatRupiah(cartSummary.totalSellingPrice)})
              </button>
            </div>
          </div>
        </div>
      )}

      {isCheckoutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className="bg-white rounded-2xl w-full max-w-sm p-5 relative shadow-2xl">
            <button onClick={() => setIsCheckoutModalOpen(false)} className="absolute top-4 right-4"><X className="w-4 h-4 text-slate-400" /></button>
            <h3 className="font-bold text-sm mb-4">Data Pemesan</h3>
            <form onSubmit={handleCheckoutSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1 text-slate-600">Nama Lengkap Anak <span className="text-red-500">*</span></label>
                <input type="text" required value={checkoutData.namaAnak} onChange={(e) => setCheckoutData({ ...checkoutData, namaAnak: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border rounded-xl" />
              </div>
              <div>
                <label className="block font-semibold mb-1 text-slate-600">Pilih Kelas Anak <span className="text-red-500">*</span></label>
                <select value={checkoutData.kelas} onChange={(e) => setCheckoutData({ ...checkoutData, kelas: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border rounded-xl">
                  {classesList.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block font-semibold mb-1 text-slate-600">Nama Ortu / Pemesan <span className="text-red-500">*</span></label>
                <input type="text" required placeholder="Wajib diisi" value={checkoutData.namaOrtu} onChange={(e) => setCheckoutData({ ...checkoutData, namaOrtu: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border rounded-xl" />
              </div>
              <div>
                <label className="block font-semibold mb-1 text-slate-600">Catatan (Opsional)</label>
                <input type="text" placeholder="Cth: Jangan pedas" value={checkoutData.catatan} onChange={(e) => setCheckoutData({ ...checkoutData, catatan: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border rounded-xl" />
              </div>
              <button type="submit" disabled={isSubmitting} className="w-full py-3 mt-2 bg-emerald-600 text-white font-bold rounded-xl shadow-md disabled:opacity-50">
                {isSubmitting ? 'Memproses...' : 'Kirim WA & Pesan'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Admin Modals remain modular and fully functional */}
      {classModal.isOpen && (
        <ModalClassForm 
          item={classModal.item} 
          onClose={() => setClassModal({ isOpen: false, item: null })} 
          onSave={(data) => {
            let up;
            if (classModal.item) up = classesList.map(c => c.id === classModal.item.id ? { ...c, ...data } : c);
            else up = [...classesList, { ...data, id: 'c-' + Date.now() }];
            setClassesList(up); syncPushToCloud({ classes: up });
            setClassModal({ isOpen: false, item: null });
          }} 
        />
      )}

      {tenantModal.isOpen && (
        <ModalTenantForm 
          item={tenantModal.item} 
          onClose={() => setTenantModal({ isOpen: false, item: null })} 
          onSave={(data) => {
            let up;
            if (tenantModal.item) up = tenants.map(t => t.id === tenantModal.item.id ? { ...t, ...data } : t);
            else up = [...tenants, { ...data, id: 't-' + Date.now() }];
            setTenants(up); syncPushToCloud({ tenants: up });
            setTenantModal({ isOpen: false, item: null });
          }} 
        />
      )}

      {batchModal.isOpen && (
        <ModalBatchForm 
          item={batchModal.item}
          onClose={() => setBatchModal({ isOpen: false, item: null })} 
          onSave={(data) => {
            let up;
            if (batchModal.item) up = batches.map(b => b.id === batchModal.item.id ? { ...b, ...data } : b);
            else up = [...batches, { ...data, id: 'b-' + Date.now(), isActive: false }];
            setBatches(up); syncPushToCloud({ batches: up });
            setBatchModal({ isOpen: false, item: null });
          }} 
        />
      )}

      {productModal.isOpen && (
        <ModalProductForm 
          item={productModal.item} tenants={tenants} 
          onClose={() => setProductModal({ isOpen: false, item: null })} 
          onSave={(data) => {
            let up;
            if (productModal.item) up = products.map(p => p.id === productModal.item.id ? { ...p, ...data } : p);
            else up = [...products, { ...data, id: 'p-' + Date.now(), available: true }];
            setProducts(up); syncPushToCloud({ products: up });
            setProductModal({ isOpen: false, item: null });
          }} 
        />
      )}

      {/* PRINT VIEW CONTAINER - Only visible during printing via CSS classes */}
      {printData && (
        <div className="fixed inset-0 z-50 bg-white overflow-y-auto print:absolute print:inset-0 print:block print:bg-white print:z-[9999] print:h-auto print:overflow-visible print:m-0 print:p-0">
          <div className="print:hidden sticky top-0 bg-slate-900 text-white p-4 shadow flex justify-between items-center z-50">
             <h2 className="font-bold text-sm">Mode Cetak PDF</h2>
             <div className="flex gap-2">
               <button onClick={() => window.print()} className="px-3 py-1.5 bg-blue-600 rounded-lg text-xs font-bold">Simpan PDF</button>
               <button onClick={() => setPrintData(null)} className="px-3 py-1.5 bg-slate-700 rounded-lg text-xs font-bold">Tutup</button>
             </div>
          </div>
          
          <div className="p-8 max-w-4xl mx-auto text-black text-[10px] sm:text-xs print:p-0 print:m-0 print:w-full print:max-w-none bg-white">
            <h1 className="text-lg font-black text-emerald-800 mb-1">Bazaar DANUS PTA Little Darbi</h1>
            <h2 className="text-sm font-bold text-slate-800">Rekapitulasi Dapur Stand: {printData.tenantRep.tenantName}</h2>
            <p className="text-[10px] text-slate-500 mb-4 border-b pb-2">
              Periode: {printData.currentBatch?.name} | Ready: {formatIndoDate(printData.currentBatch?.readyDate)} | PJ: {printData.tenantRep.tenantOwner} ({printData.tenantRep.tenantPhone})
            </p>

            <h3 className="font-bold mt-4 mb-2 text-xs">1. Detail Pesanan Pembeli ({printData.tenantRep.customerOrdersDetail.length})</h3>
            <table className="w-full border-collapse border border-slate-300 text-[9px] mb-6">
               <thead className="bg-slate-100 font-bold">
                 <tr>
                   <th className="border p-1.5 w-6 text-center">No</th>
                   <th className="border p-1.5">Nama Anak</th>
                   <th className="border p-1.5">Kelas</th>
                   <th className="border p-1.5">Nama Ortu</th>
                   <th className="border p-1.5">Detail Pesanan</th>
                   <th className="border p-1.5">Catatan</th>
                 </tr>
               </thead>
               <tbody>
                 {printData.tenantRep.customerOrdersDetail.map((cust, idx) => (
                   <tr key={idx}>
                     <td className="border p-1.5 text-center">{idx + 1}</td>
                     <td className="border p-1.5 font-bold">{cust.namaAnak}</td>
                     <td className="border p-1.5">{cust.kelas}</td>
                     <td className="border p-1.5">{cust.namaOrtu}</td>
                     <td className="border p-1.5">
                        {cust.items.map(it => `${cleanItemName(it.name)} (x${it.qty})`).join(', ')}
                     </td>
                     <td className="border p-1.5">{cust.catatan}</td>
                   </tr>
                 ))}
               </tbody>
            </table>

            <h3 className="font-bold mt-4 mb-2 text-xs">2. Ringkasan Pesanan (Dapur)</h3>
            <table className="w-full border-collapse border border-slate-300 text-[10px]">
               <thead className="bg-slate-100 font-bold">
                 <tr>
                   <th className="border p-1.5 text-left">Produk</th>
                   <th className="border p-1.5 text-center">Qty</th>
                   <th className="border p-1.5 text-right">Harga owner</th>
                   <th className="border p-1.5 text-right">Margin Jual</th>
                   <th className="border p-1.5 text-right">Nominal total</th>
                 </tr>
               </thead>
               <tbody>
                 {Object.keys(printData.tenantRep.itemTotalsMap).map(name => {
                   const item = printData.tenantRep.itemTotalsMap[name];
                   const ownerT = item.priceOwner * item.qty;
                   const marginT = item.priceOrganizer * item.qty;
                   const grossT = ownerT + marginT;
                   return (
                     <tr key={name}>
                       <td className="border p-1.5 font-bold">{name}</td>
                       <td className="border p-1.5 text-center">{item.qty}</td>
                       <td className="border p-1.5 text-right">{formatRupiah(ownerT)}</td>
                       <td className="border p-1.5 text-right">{formatRupiah(marginT)}</td>
                       <td className="border p-1.5 text-right font-bold">{formatRupiah(grossT)}</td>
                     </tr>
                   )
                 })}
               </tbody>
               <tfoot className="bg-slate-50 font-black">
                 <tr>
                   <td colSpan={2} className="border p-1.5 text-right text-emerald-800">TOTAL KESELURUHAN:</td>
                   <td className="border p-1.5 text-right text-emerald-600">{formatRupiah(printData.tenantRep.tenantTotalOwnerShare)}</td>
                   <td className="border p-1.5 text-right text-orange-600">{formatRupiah(printData.tenantRep.tenantTotalMargin)}</td>
                   <td className="border p-1.5 text-right text-slate-800">{formatRupiah(printData.tenantRep.tenantTotalGross)}</td>
                 </tr>
               </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// Modal Components
function ModalClassForm({ item, onClose, onSave }) {
  const [name, setName] = useState(item?.name || '');
  const [phone, setPhone] = useState(item?.phone || '');
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60">
      <div className="bg-white rounded-xl w-full max-w-xs p-5 relative">
        <button onClick={onClose} className="absolute top-4 right-4"><X className="w-4 h-4" /></button>
        <h3 className="font-bold text-sm mb-3">{item ? 'Edit Kelas' : 'Tambah Kelas'}</h3>
        <form onSubmit={(e) => { e.preventDefault(); onSave({ name, phone }); }} className="space-y-3 text-xs">
          <input type="text" required placeholder="Nama Kelas" value={name} onChange={e => setName(e.target.value)} className="w-full px-3 py-2 border rounded-lg" />
          <input type="text" required placeholder="No WA (Cth: 628...)" value={phone} onChange={e => setPhone(e.target.value)} className="w-full px-3 py-2 border rounded-lg" />
          <button type="submit" className="w-full py-2 bg-indigo-600 text-white font-bold rounded-lg">Simpan</button>
        </form>
      </div>
    </div>
  );
}

function ModalTenantForm({ item, onClose, onSave }) {
  const [name, setName] = useState(item?.name || '');
  const [owner, setOwner] = useState(item?.owner || '');
  const [phone, setPhone] = useState(item?.phone || '');
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60">
      <div className="bg-white rounded-xl w-full max-w-xs p-5 relative">
        <button onClick={onClose} className="absolute top-4 right-4"><X className="w-4 h-4" /></button>
        <h3 className="font-bold text-sm mb-3">{item ? 'Edit Stand' : 'Tambah Stand'}</h3>
        <form onSubmit={(e) => { e.preventDefault(); onSave({ name, owner, phone }); }} className="space-y-3 text-xs">
          <input type="text" required placeholder="Nama Stand" value={name} onChange={e => setName(e.target.value)} className="w-full px-3 py-2 border rounded-lg" />
          <input type="text" required placeholder="PJ / Owner" value={owner} onChange={e => setOwner(e.target.value)} className="w-full px-3 py-2 border rounded-lg" />
          <input type="text" required placeholder="No WA (628...)" value={phone} onChange={e => setPhone(e.target.value)} className="w-full px-3 py-2 border rounded-lg" />
          <button type="submit" className="w-full py-2 bg-indigo-600 text-white font-bold rounded-lg">Simpan</button>
        </form>
      </div>
    </div>
  );
}

function ModalBatchForm({ item, onClose, onSave }) {
  const [form, setForm] = useState({
    name: item?.name || '', startDate: item?.startDate || '', endDate: item?.endDate || '', readyDate: item?.readyDate || ''
  });
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60">
      <div className="bg-white rounded-xl w-full max-w-xs p-5 relative">
        <button onClick={onClose} className="absolute top-4 right-4"><X className="w-4 h-4" /></button>
        <h3 className="font-bold text-sm mb-3">{item ? 'Edit Batch' : 'Buat Batch'}</h3>
        <form onSubmit={(e) => { e.preventDefault(); onSave(form); }} className="space-y-3 text-xs">
          <input type="text" required placeholder="Nama Batch" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full px-3 py-2 border rounded-lg" />
          <div><label className="text-[10px] font-bold text-slate-500">Tgl Mulai PO</label><input type="date" required value={form.startDate} onChange={e => setForm({...form, startDate: e.target.value})} className="w-full px-3 py-2 border rounded-lg" /></div>
          <div><label className="text-[10px] font-bold text-slate-500">Tgl Tutup PO</label><input type="date" required value={form.endDate} onChange={e => setForm({...form, endDate: e.target.value})} className="w-full px-3 py-2 border rounded-lg" /></div>
          <div><label className="text-[10px] font-bold text-emerald-600">Tgl Ready / Distribusi</label><input type="date" required value={form.readyDate} onChange={e => setForm({...form, readyDate: e.target.value})} className="w-full px-3 py-2 border border-emerald-300 rounded-lg" /></div>
          <button type="submit" className="w-full py-2 bg-indigo-600 text-white font-bold rounded-lg">Simpan</button>
        </form>
      </div>
    </div>
  );
}

function ModalProductForm({ item, tenants, onClose, onSave }) {
  const [form, setForm] = useState({
    name: item?.name || '', tenantId: item?.tenantId || tenants[0]?.id || '',
    priceOwner: item?.priceOwner || 0, priceOrganizer: item?.priceOrganizer || 0,
    imageUrl: item?.imageUrl || '', description: item?.description || ''
  });

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if(!file) return;
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (ev) => {
      const img = new Image();
      img.src = ev.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 400;
        const scale = img.width > MAX_WIDTH ? MAX_WIDTH / img.width : 1;
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        setForm({...form, imageUrl: canvas.toDataURL('image/jpeg', 0.6)});
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60">
      <div className="bg-white rounded-xl w-full max-w-xs p-5 relative overflow-y-auto max-h-[90vh]">
        <button onClick={onClose} className="absolute top-4 right-4"><X className="w-4 h-4" /></button>
        <h3 className="font-bold text-sm mb-3">{item ? 'Edit Produk' : 'Tambah Produk'}</h3>
        <form onSubmit={(e) => { e.preventDefault(); onSave(form); }} className="space-y-3 text-xs">
          <input type="text" required placeholder="Nama Produk" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full px-3 py-2 border rounded-lg" />
          <select value={form.tenantId} onChange={e => setForm({...form, tenantId: e.target.value})} className="w-full px-3 py-2 border rounded-lg">
            {tenants.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
          <div className="flex gap-2">
            <div><label className="text-[10px] font-bold text-emerald-600">Hrg Owner</label><input type="number" required value={form.priceOwner} onChange={e => setForm({...form, priceOwner: e.target.value})} className="w-full px-3 py-2 border rounded-lg" /></div>
            <div><label className="text-[10px] font-bold text-indigo-600">Mrgn Panitia</label><input type="number" required value={form.priceOrganizer} onChange={e => setForm({...form, priceOrganizer: e.target.value})} className="w-full px-3 py-2 border rounded-lg" /></div>
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-500 mb-1 block">Upload Foto (Opsional)</label>
            {form.imageUrl && <img src={form.imageUrl} alt="preview" className="w-16 h-16 object-cover rounded-lg mb-2 border" />}
            <input type="file" accept="image/*" onChange={handleImageUpload} className="w-full text-[10px]" />
          </div>
          <button type="submit" className="w-full py-2 bg-indigo-600 text-white font-bold rounded-lg">Simpan</button>
        </form>
      </div>
    </div>
  );
}