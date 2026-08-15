import React, { useState, useEffect, useMemo, Fragment } from 'react';
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
  Menu
} from 'lucide-react';

const DEFAULT_WEBHOOK_URL = 'https://script.google.com/macros/s/AKfycbxlNd5nsvlgfoXSj5xeNW9qhhZtauefW0x_1EGqKTYtJnij0ESwflbJRxT46zraBsXd/exec';

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

const formatRupiah = (num) => {
  const validNum = Number(num) || 0;
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(validNum);
};

const parseAndCleanItem = (rawName) => {
  if (!rawName) return '';
  return String(rawName).replace(/\(x\s*\d+\)/gi, '').trim();
};

const INITIAL_TENANTS = [{ id: 't1', name: 'Stand Snack', owner: 'PIC', phone: '628123456789' }];
const INITIAL_PRODUCTS = [{ id: 'p1', tenantId: 't1', name: 'Produk A', priceOwner: 5000, priceOrganizer: 1000, category: 'Makanan', imageUrl: '', available: true, description: '' }];
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
  const [reportSelectedStatus, setReportSelectedStatus] = useState('Paid');

  // Persistence
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
      showToast('URL Webhook Tersimpan!');
    }
  }, []);

  const fetchCloudData = async (silent = false) => {
    const targetUrl = sheetWebhookUrl || DEFAULT_WEBHOOK_URL;
    if (!targetUrl) return;
    setIsCloudSyncing(true);
    try {
      const noCacheUrl = `${targetUrl}?t=${new Date().getTime()}`;
      const res = await fetch(noCacheUrl, { cache: 'no-store' });
      const json = await res.json();
      
      if (json.status === 'success' && json.data) {
        if (json.data.products !== undefined) setProducts(json.data.products);
        if (json.data.tenants !== undefined) setTenants(json.data.tenants);
        if (json.data.classes !== undefined) setClassesList(json.data.classes);
        
        if (json.data.orders !== undefined) {
          const productsData = (json.data.products && json.data.products.length > 0) ? json.data.products : products;
          
          if (Array.isArray(json.data.orders)) {
            const parsedOrders = json.data.orders.map(o => {
              try {
                if (!o || typeof o !== 'object') return null;

                const getVal = (possibleKeys) => {
                  const key = Object.keys(o).find(k => 
                    possibleKeys.some(pk => String(k).toLowerCase().replace(/[^a-z0-9]/g, '') === String(pk).toLowerCase().replace(/[^a-z0-9]/g, ''))
                  );
                  return key ? o[key] : undefined;
                };

                let orderId = getVal(['Order ID', 'orderId']);
                // PENCEGAHAN FATAL: Jika ID pesanan kosong, hiraukan data ini! (Menghindari render Blank Putih)
                if (!orderId || String(orderId).trim() === '') return null;

                const namaAnak = getVal(['Nama Anak', 'namaAnak', 'customer']) || 'Unknown';
                const kelas = getVal(['Kelas', 'kelasAnak']) || '-';
                const namaOrtu = getVal(['Nama Ortu', 'namaOrtu']) || '-';
                const catatan = getVal(['Catatan', 'catatanPesanan']) || '-';
                
                let parsedCust = { namaAnak, kelas, namaOrtu, catatan };
                let parsedItems = [];
                
                let batchId = getVal(['Batch ID', 'batchId']) || '-';
                let status = getVal(['Status', 'statusOrder']) || 'Unpaid';
                let totalAmount = Number(getVal(['Total Tagihan', 'totalAmount', 'total'])) || 0;

                const rincianText = String(getVal(['Rincian Items', 'items', 'formattedItemsText', 'Rincian']) || '');
                if (rincianText && rincianText !== 'undefined' && rincianText !== '-') {
                  const itemStrings = rincianText.split(',');
                  itemStrings.forEach(itemStr => {
                    const match = itemStr.trim().match(/^(.*?)\s*\(x(\d+)\)$/i);
                    if (match) {
                      const name = match[1].trim();
                      const qty = parseInt(match[2], 10);
                      const product = productsData.find(p => String(p.name || '').toLowerCase() === name.toLowerCase());
                      
                      if (product) {
                        parsedItems.push({
                          id: product.id, name: product.name, tenantId: product.tenantId,
                          priceOwner: Number(product.priceOwner) || 0, priceOrganizer: Number(product.priceOrganizer) || 0,
                          qty: qty, subtotal: (Number(product.priceOwner || 0) + Number(product.priceOrganizer || 0)) * qty
                        });
                      } else {
                        parsedItems.push({
                          id: 'p-unknown', name: name, tenantId: 't-unknown', priceOwner: 0, priceOrganizer: 0, qty: qty, subtotal: 0
                        });
                      }
                    } else if (itemStr.trim()) {
                       parsedItems.push({
                          id: 'p-unknown', name: itemStr.trim(), tenantId: 't-unknown', priceOwner: 0, priceOrganizer: 0, qty: 1, subtotal: 0
                        });
                    }
                  });
                }

                return {
                  ...o, orderId, batchId, status, totalAmount, customer: parsedCust, items: parsedItems
                };
              } catch (parseError) {
                console.warn('Skipping malformed row:', parseError);
                return null;
              }
            }).filter(Boolean);
            setOrders(parsedOrders);
          }
        }
        
        if (json.data.batches !== undefined) {
          // Memastikan readyDate tetap terjaga meskipun tidak ada atau null
          const mappedBatches = json.data.batches.map(b => ({
            ...b,
            readyDate: b.readyDate || b.readydate || '' 
          }));
          setBatches(mappedBatches);
          const activeBatch = mappedBatches.find(b => b.isActive) || mappedBatches[0];
          if (activeBatch) setReportSelectedBatchId(activeBatch.id);
        }
        
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const syncPushToCloud = (overrideData = {}) => {
    const targetUrl = sheetWebhookUrl || DEFAULT_WEBHOOK_URL;
    if (!targetUrl) return;
    
    const payload = {
      action: 'syncAll',
      products: overrideData.products || products,
      tenants: overrideData.tenants || tenants,
      batches: overrideData.batches || batches,
      classes: overrideData.classes || classesList,
      settings: { adminAuth }
    };

    // MENGGUNAKAN text/plain AGAR AMAN DI NO-CORS DAN TIDAK DI-STRIP OLEH BROWSER
    fetch(targetUrl, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload)
    }).then(() => showToast('Disimpan ke Google Sheets!')).catch(err => console.warn(err));
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

  const handleCheckoutSubmit = (e) => {
    e.preventDefault();
    if (!activeBatch || !checkoutData.namaAnak.trim() || !checkoutData.namaOrtu.trim() || cart.length === 0) return;
    if (isSubmitting) return; 
    
    setIsSubmitting(true);

    const newOrderId = 'BZ-' + Math.floor(100000 + Math.random() * 900000);
    const dateNow = new Date().toISOString();
    const formattedItemsText = cart.map(item => `${parseAndCleanItem(item.name)} (x${item.qty})`).join(', ');

    const orderPayload = {
      orderId: newOrderId,
      batchId: activeBatch.id,
      date: dateNow,
      customer: { ...checkoutData },
      items: cart.map((item) => ({
        id: item.id,
        name: parseAndCleanItem(item.name),
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

    const targetClassObj = classesList.find((c) => c.name === checkoutData.kelas);
    const picPhoneRaw = targetClassObj?.phone || '';
    
    let cleanPhone = String(picPhoneRaw).replace(/[^0-9]/g, '');
    if (cleanPhone.startsWith('0')) cleanPhone = '62' + cleanPhone.slice(1);

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
      const tenant = tenants.find(t => t.id === item.tenantId);
      const tenantName = tenant ? tenant.name : 'Stand';
      const itemSubtotal = (Number(item.priceOwner) + Number(item.priceOrganizer)) * item.qty;
      waText += `${index + 1}. *${parseAndCleanItem(item.name)}* (x${item.qty}) - ${formatRupiah(itemSubtotal)}\n   _[${tenantName}]_\n`;
    });

    waText += `-----------------------------------\n`;
    waText += `*TOTAL TAGIHAN: ${formatRupiah(orderPayload.totalAmount)}*\n`;
    waText += `-----------------------------------\n`;
    waText += `Halo PIC Kelas ${checkoutData.kelas}, mohon instruksi info rekening pembayaran. Terima kasih!`;

    const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(waText)}`;

    if (cleanPhone && cleanPhone.length > 5) {
      window.open(waUrl, '_blank');
    } else {
      alert("Pesanan berhasil dicatat, namun gagal membuka WhatsApp karena Nomor PIC Kelas belum diatur oleh admin.");
    }

    const updatedOrders = [orderPayload, ...orders];
    setOrders(updatedOrders);
    
    const targetUrl = sheetWebhookUrl || DEFAULT_WEBHOOK_URL;
    if (targetUrl) {
      fetch(targetUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'checkout', ...orderPayload })
      }).catch(err => console.warn(err));
    }

    setCart([]);
    setIsCheckoutModalOpen(false);
    setIsCartOpen(false);
    setCheckoutData({ namaAnak: '', kelas: classesList[0]?.name || 'TK A1', namaOrtu: '', catatan: '' });
    setIsSubmitting(false);
  };

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchTenant = selectedTenantFilter === 'all' || p.tenantId === selectedTenantFilter;
      const matchSearch = String(p.name || '').toLowerCase().includes(searchQuery.toLowerCase());
      return matchTenant && matchSearch && p.available;
    });
  }, [products, selectedTenantFilter, searchQuery]);

  const enrichOrderItems = (ord) => {
    if (!ord || !ord.items || !Array.isArray(ord.items)) return [];
    return ord.items.map(it => {
      if (!it) return null;
      const dbProduct = products.find(p => p.id === it.id);
      if (dbProduct) {
        return {
          ...it,
          priceOwner: Number(dbProduct.priceOwner) || 0,
          priceOrganizer: Number(dbProduct.priceOrganizer) || 0,
          subtotal: (Number(dbProduct.priceOwner || 0) + Number(dbProduct.priceOrganizer || 0)) * (it.qty || 1),
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

  const batchReportData = useMemo(() => {
    let filtered = orders.filter((o) => o?.batchId === reportSelectedBatchId);
    if (reportSelectedStatus !== 'ALL') {
      filtered = filtered.filter((o) => o?.status === reportSelectedStatus);
    }

    return tenants.map((tenant) => {
      const customerOrdersDetail = [];
      const itemTotalsMap = {};
      let tenantTotalGross = 0;
      let tenantTotalOwnerShare = 0;
      let tenantTotalMargin = 0;

      filtered.forEach((ord) => {
        if (!ord) return;
        const enrichedItems = enrichOrderItems(ord);
        const tenantItemsInOrder = enrichedItems.filter((it) => it?.tenantId === tenant.id);
        
        if (tenantItemsInOrder.length > 0) {
          customerOrdersDetail.push({
            orderId: ord.orderId,
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
  }, [orders, reportSelectedBatchId, reportSelectedStatus, tenants, products]);

  const updateOrderStatusDirect = (orderId, newStatus) => {
    const updated = orders.map(o => o.orderId === orderId ? { ...o, status: newStatus } : o);
    setOrders(updated);
    
    const targetUrl = sheetWebhookUrl || DEFAULT_WEBHOOK_URL;
    fetch(targetUrl, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: 'updateOrderStatus', orderId: orderId, status: newStatus })
    }).catch(e => console.warn(e));
  };

  return (
    <Fragment>
      <div className={`min-h-screen bg-slate-50 text-slate-800 font-sans pb-24 ${printData ? 'hidden' : 'block'}`}>
        {toastMessage && (
          <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-2xl text-xs font-bold flex items-center space-x-2 animate-bounce">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{toastMessage}</span>
          </div>
        )}

        <header className="sticky top-0 z-30 bg-white shadow-sm border-b border-slate-200">
          <div className="max-w-5xl mx-auto px-4 py-2.5 flex items-center justify-between">
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
                className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs"
                title="Refresh Data"
              >
                <RefreshCw className={`w-4 h-4 ${isCloudSyncing ? 'animate-spin text-indigo-600' : ''}`} />
              </button>

              <div className="relative">
                <button 
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg sm:hidden flex items-center gap-1"
                >
                  <Menu className="w-4 h-4" /> <span className="text-[10px] font-bold">Menu</span>
                </button>

                <div className={`sm:flex items-center bg-slate-100 p-1 rounded-xl ${isMobileMenuOpen ? 'absolute right-0 top-10 flex-col w-40 shadow-xl border border-slate-200 bg-white z-50' : 'hidden'}`}>
                  <button
                    onClick={() => { setActiveTab('shop'); setIsMobileMenuOpen(false); }}
                    className={`w-full px-3 py-2 sm:py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-2 ${
                      activeTab === 'shop' ? 'bg-white text-amber-600 shadow-sm' : 'text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <ShoppingBag className="w-4 h-4" /><span>Menu Pembeli</span>
                  </button>
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
        </header>

        {isCloudSyncing && products.length === 1 && products[0].id === 'p1' ? (
          <div className="flex flex-col items-center justify-center pt-32 space-y-4">
            <RefreshCw className="w-8 h-8 text-amber-500 animate-spin" />
            <p className="text-xs font-bold text-slate-500 animate-pulse">Menghubungkan ke Database...</p>
          </div>
        ) : activeTab === 'shop' ? (
          <main className="max-w-5xl mx-auto px-4 pt-5">
            {activeBatch && (
              <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-2xl p-4 shadow-sm mb-5">
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
            )}

            <div className="flex flex-col sm:flex-row gap-3 mb-5">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari makanan atau minuman..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-white rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-amber-500 shadow-sm"
                />
              </div>
              <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-none">
                <button
                  onClick={() => setSelectedTenantFilter('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all shadow-sm ${
                    selectedTenantFilter === 'all' ? 'bg-amber-600 text-white' : 'bg-white text-slate-600 border'
                  }`}
                >
                  Semua Stand
                </button>
                {tenants.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setSelectedTenantFilter(t.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all shadow-sm ${
                      selectedTenantFilter === t.id ? 'bg-amber-600 text-white' : 'bg-white text-slate-600 border'
                    }`}
                  >
                    {t.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {filteredProducts.map((prod) => {
                const tenant = tenants.find((t) => t.id === prod.tenantId);
                const sellingPrice = Number(prod.priceOwner || 0) + Number(prod.priceOrganizer || 0);
                const inCart = cart.find((item) => item.id === prod.id);
                const cleanName = parseAndCleanItem(prod.name);

                return (
                  <div key={prod.id} className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
                    <div className="h-28 sm:h-36 w-full bg-slate-100 relative">
                      {prod.imageUrl ? (
                        <img src={prod.imageUrl} alt={cleanName} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-300">
                          <ImageIcon className="w-6 h-6 sm:w-8 sm:h-8" />
                        </div>
                      )}
                      <span className="absolute top-1.5 left-1.5 text-[9px] font-bold bg-white/90 px-1.5 py-0.5 rounded shadow-sm text-slate-700">
                        {tenant?.name || 'Stand'}
                      </span>
                    </div>
                    <div className="p-2.5 flex-1 flex flex-col justify-between">
                      <div>
                        <h3 className="font-bold text-slate-900 text-xs sm:text-sm line-clamp-2 leading-tight">{cleanName}</h3>
                        {prod.description && <p className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">{prod.description}</p>}
                      </div>
                      <div className="mt-2 pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                        <span className="text-xs sm:text-sm font-black text-amber-600">{formatRupiah(sellingPrice)}</span>
                        {inCart ? (
                          <div className="flex items-center space-x-1.5 bg-amber-50 border border-amber-200 p-0.5 rounded-lg w-fit">
                            <button onClick={() => updateCartQty(prod.id, -1)} className="w-6 h-6 bg-white rounded font-bold text-amber-700 shadow-sm text-xs flex items-center justify-center">-</button>
                            <span className="text-[11px] font-bold px-1.5">{inCart.qty}</span>
                            <button onClick={() => updateCartQty(prod.id, 1)} className="w-6 h-6 bg-amber-600 text-white rounded font-bold shadow-sm text-xs flex items-center justify-center">+</button>
                          </div>
                        ) : (
                          <button onClick={() => addToCart(prod)} className="px-2 py-1.5 bg-slate-900 text-white rounded-lg text-[10px] sm:text-xs font-semibold flex items-center justify-center w-full sm:w-auto shadow-sm">
                            <Plus className="w-3 h-3 mr-1" /> Pesan
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
                <button onClick={() => setIsCartOpen(true)} className="w-full bg-amber-600 text-white p-3.5 rounded-2xl shadow-2xl flex items-center justify-between">
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
                  <span className="text-[10px] sm:text-xs font-bold bg-white text-amber-700 px-3 py-2 rounded-xl shadow-sm">Keranjang</span>
                </button>
              </div>
            )}
          </main>
        ) : (
          <main className="max-w-5xl mx-auto px-4 pt-4">
            {!isAdminLoggedIn ? (
              <div className="max-w-xs mx-auto bg-white rounded-2xl border p-6 shadow-xl mt-10">
                <div className="text-center mb-5">
                  <LittleDarbiLogo className="w-12 h-12 mx-auto mb-2" />
                  <h2 className="text-lg font-black text-slate-800">Login Admin</h2>
                </div>
                {loginError && <p className="mb-4 text-xs font-semibold text-red-600 text-center bg-red-50 p-2 rounded-lg border border-red-100">{loginError}</p>}
                <form onSubmit={handleAdminLogin} className="space-y-4 text-sm">
                  <input type="text" required placeholder="Username" value={loginForm.username} onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })} className="w-full px-4 py-2.5 border rounded-xl bg-slate-50" />
                  <input type="password" required placeholder="Password" value={loginForm.password} onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })} className="w-full px-4 py-2.5 border rounded-xl bg-slate-50" />
                  <button type="submit" className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-md">Masuk Panel</button>
                </form>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex overflow-x-auto gap-2 pb-2 scrollbar-none border-b">
                  <button onClick={() => setAdminSubTab('batch_reports')} className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap shadow-sm ${adminSubTab === 'batch_reports' ? 'bg-indigo-600 text-white' : 'bg-white border text-slate-600'}`}>Rekap Per Tenant</button>
                  <button onClick={() => setAdminSubTab('orders')} className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap shadow-sm ${adminSubTab === 'orders' ? 'bg-indigo-600 text-white' : 'bg-white border text-slate-600'}`}>Semua Pesanan</button>
                  <button onClick={() => setAdminSubTab('products')} className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap shadow-sm ${adminSubTab === 'products' ? 'bg-indigo-600 text-white' : 'bg-white border text-slate-600'}`}>Produk & Harga</button>
                  <button onClick={() => setAdminSubTab('batches')} className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap shadow-sm ${adminSubTab === 'batches' ? 'bg-indigo-600 text-white' : 'bg-white border text-slate-600'}`}>Kelola Batch</button>
                  <button onClick={() => setAdminSubTab('tenants')} className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap shadow-sm ${adminSubTab === 'tenants' ? 'bg-indigo-600 text-white' : 'bg-white border text-slate-600'}`}>Kelola Stand</button>
                  <button onClick={() => setAdminSubTab('classes')} className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap shadow-sm ${adminSubTab === 'classes' ? 'bg-indigo-600 text-white' : 'bg-white border text-slate-600'}`}>Routing WA Kelas</button>
                </div>

                {/* TAB ADMIN: REKAP TENANT */}
                {adminSubTab === 'batch_reports' && (
                  <div className="space-y-4">
                    <div className="bg-white p-4 rounded-xl border shadow-sm flex flex-col sm:flex-row gap-3 justify-between sm:items-center">
                      <div>
                        <h3 className="font-bold text-sm">Laporan Rekapitulasi Per Stand</h3>
                      </div>
                      <div className="flex gap-2 text-xs">
                        <select value={reportSelectedBatchId} onChange={(e) => setReportSelectedBatchId(e.target.value)} className="p-2 border rounded-lg bg-slate-50 font-semibold">
                          <option value="">-- Pilih Batch --</option>
                          {batches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                        </select>
                        <select value={reportSelectedStatus} onChange={(e) => setReportSelectedStatus(e.target.value)} className="p-2 border rounded-lg bg-slate-50 font-semibold">
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
                          <div key={tenantRep.tenantId} className="bg-white rounded-xl border shadow-sm">
                            <div className="p-3 sm:p-4 bg-slate-900 text-white flex flex-col sm:flex-row justify-between sm:items-center gap-3 rounded-t-xl">
                              <div>
                                <h4 className="font-bold text-sm sm:text-base">{tenantRep.tenantName}</h4>
                                <p className="text-[10px] sm:text-xs text-slate-300">PJ: {tenantRep.tenantOwner} {tenantRep.tenantPhone ? `(${tenantRep.tenantPhone})` : ''}</p>
                              </div>
                              <div className="flex gap-2">
                                <button 
                                  onClick={() => {
                                      let cleanPhone = tenantRep.tenantPhone ? String(tenantRep.tenantPhone).replace(/[^0-9]/g, '') : '';
                                      if (cleanPhone.startsWith('0')) cleanPhone = '62' + cleanPhone.slice(1);
                                      
                                      let text = `REKAP PESANAN - ${tenantRep.tenantName.toUpperCase()}\n`;
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
                                      
                                      const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
                                      if(cleanPhone.length > 5) {
                                          window.open(waUrl, '_blank');
                                      } else {
                                          alert("Nomor WA tenant tidak valid.");
                                      }
                                  }}
                                  className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg flex items-center shadow-sm"
                                >
                                  <MessageCircle className="w-4 h-4 mr-1.5" /> Kirim WA
                                </button>
                                <button 
                                  onClick={() => setPrintData({ tenantRep, currentBatch })}
                                  className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg flex items-center shadow-sm"
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

                {/* TAB ADMIN: SEMUA PESANAN MASUK */}
                {adminSubTab === 'orders' && (
                  <div className="space-y-3">
                    <div className="bg-white p-3 rounded-xl border shadow-sm mb-2 text-xs text-slate-500 flex justify-between items-center">
                      <span>Klik "Simpan Status" untuk memperbarui status pesanan ke cloud.</span>
                      <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-1 rounded">Total: {orders.length}</span>
                    </div>
                    {orders.map((ord, idx) => {
                      if (!ord) return null;
                      const enrichedItems = enrichOrderItems(ord) || [];
                      return (
                        <div key={ord.orderId || idx} className="bg-white p-4 rounded-xl border text-xs shadow-sm flex flex-col gap-3">
                          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 border-b pb-3">
                            <div>
                              <span className="font-black text-indigo-700 text-sm">{ord.orderId || '-'}</span>
                              <span className="font-bold block mt-0.5 text-slate-800">{ord?.customer?.namaAnak || 'Unknown'} ({ord?.customer?.kelas || '-'})</span>
                              <span className="text-[10px] text-slate-500 block">Ortu: {ord?.customer?.namaOrtu || '-'}</span>
                            </div>
                            <div className="flex items-center gap-2 self-end sm:self-auto">
                              <select
                                value={ord.status || 'Unpaid'}
                                onChange={(e) => {
                                  const newOrders = orders.map(o => o.orderId === ord.orderId ? { ...o, status: e.target.value } : o);
                                  setOrders(newOrders);
                                }}
                                className="bg-slate-50 font-bold px-2.5 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                              >
                                <option value="Unpaid">Unpaid</option>
                                <option value="Paid">Paid</option>
                                <option value="Selesai">Selesai</option>
                                <option value="Batal">Batal</option>
                              </select>
                              <button 
                                onClick={() => {
                                  updateOrderStatusDirect(ord.orderId, ord.status);
                                  showToast('Status Tersimpan!');
                                }}
                                className="px-3 py-2 bg-indigo-600 text-white font-bold rounded-lg flex items-center shadow-sm"
                              >
                                <Save className="w-3.5 h-3.5 mr-1" /> Simpan
                              </button>
                              <button 
                                onClick={() => {
                                  if(window.confirm(`Yakin HAPUS pesanan ${ord.orderId}? Data akan terhapus dari sistem.`)) {
                                    const updated = orders.filter(o => o.orderId !== ord.orderId);
                                    setOrders(updated);
                                    const targetUrl = sheetWebhookUrl || DEFAULT_WEBHOOK_URL;
                                    fetch(targetUrl, {
                                      method: 'POST',
                                      mode: 'no-cors',
                                      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                                      body: JSON.stringify({ action: 'deleteOrder', orderId: ord.orderId })
                                    }).catch(e => console.warn(e));
                                    showToast('Pesanan dihapus dari Cloud.');
                                  }
                                }}
                                className="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg"
                                title="Hapus Pesanan"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                          <div className="space-y-1 text-slate-700 pl-1">
                            {enrichedItems.map((i, iIdx) => {
                              const cName = parseAndCleanItem(i?.name);
                              const tName = tenants.find(t => t.id === i?.tenantId)?.name || 'Stand';
                              return (
                                <div key={iIdx} className="flex justify-between items-center text-[11px] border-b border-slate-50 pb-1">
                                  <div>
                                    <span className="font-bold">{cName} (x{i?.qty || 1})</span>
                                    <span className="text-[9px] text-slate-400 ml-1">[{tName}]</span>
                                  </div>
                                  <span className="font-medium text-slate-600">{formatRupiah(i?.subtotal || 0)}</span>
                                </div>
                              )
                            })}
                            {ord?.customer?.catatan && (
                              <p className="text-[10px] text-orange-600 font-medium italic mt-1 pt-1">Catatan: {ord.customer.catatan}</p>
                            )}
                            <div className="flex justify-between font-black text-slate-900 pt-2 mt-2">
                              <span>Total Nominal Pesanan:</span>
                              <span className="text-amber-600">{formatRupiah(ord.totalAmount || 0)}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* TAB ADMIN: MENU PRODUK */}
                {adminSubTab === 'products' && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center bg-white p-3 rounded-xl shadow-sm border">
                      <h3 className="font-bold text-sm">Produk & Harga</h3>
                      <button onClick={() => setProductModal({ isOpen: true, item: null })} className="px-3 py-2 bg-indigo-600 text-white text-[11px] font-bold rounded-lg flex items-center shadow-sm">
                        <Plus className="w-3.5 h-3.5 mr-1" /> Tambah Produk
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {products.map(p => {
                        const t = tenants.find(x => x.id === p.tenantId);
                        const sPrice = Number(p.priceOwner) + Number(p.priceOrganizer);
                        return (
                          <div key={p.id} className="bg-white p-3 rounded-xl border flex gap-3 items-center shadow-sm">
                            {p.imageUrl ? (
                              <img src={p.imageUrl} alt="img" className="w-14 h-14 rounded-lg object-cover border" />
                            ) : (
                              <div className="w-14 h-14 bg-slate-100 rounded-lg flex items-center justify-center border"><ImageIcon className="w-5 h-5 text-slate-400" /></div>
                            )}
                            <div className="flex-1 text-xs">
                              <h4 className="font-bold text-sm text-slate-900">{parseAndCleanItem(p.name)}</h4>
                              <p className="text-[10px] text-slate-500">{t?.name}</p>
                              <p className="font-black text-amber-600 mt-1">{formatRupiah(sPrice)}</p>
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <button onClick={() => setProductModal({ isOpen: true, item: p })} className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Edit3 className="w-4 h-4" /></button>
                              <button onClick={() => {
                                if(window.confirm(`Hapus produk ${p.name}?`)) {
                                  const up = products.filter(x => x.id !== p.id);
                                  setProducts(up); syncPushToCloud({ products: up });
                                }
                              }} className="p-2 bg-red-50 text-red-600 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* TAB ADMIN: KELOLA BATCH */}
                {adminSubTab === 'batches' && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center bg-white p-3 rounded-xl shadow-sm border">
                      <h3 className="font-bold text-sm">Kelola Batch Periode</h3>
                      <button onClick={() => setBatchModal({ isOpen: true, item: null })} className="px-3 py-2 bg-indigo-600 text-white text-[11px] font-bold rounded-lg flex items-center shadow-sm">
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
                            <button onClick={() => setBatchModal({ isOpen: true, item: b })} className="text-blue-600 font-bold bg-blue-50 px-3 py-1.5 rounded-lg">Edit</button>
                            {!b.isActive && (
                              <button onClick={() => {
                                const up = batches.map(x => ({ ...x, isActive: x.id === b.id }));
                                setBatches(up); syncPushToCloud({ batches: up });
                              }} className="text-white font-bold bg-slate-800 hover:bg-slate-900 px-3 py-1.5 rounded-lg">Set Aktif</button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* TAB ADMIN: KELOLA KELAS */}
                {adminSubTab === 'classes' && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center bg-white p-3 rounded-xl shadow-sm border">
                      <h3 className="font-bold text-sm">Routing WA PIC Kelas</h3>
                      <button onClick={() => setClassModal({ isOpen: true, item: null })} className="px-3 py-2 bg-indigo-600 text-white text-[11px] font-bold rounded-lg flex items-center shadow-sm">
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
                            <button onClick={() => setClassModal({ isOpen: true, item: c })} className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Edit3 className="w-4 h-4" /></button>
                            <button onClick={() => {
                                if(window.confirm(`Hapus kelas ${c.name}?`)){
                                  const up = classesList.filter(x => x.id !== c.id);
                                  setClassesList(up); syncPushToCloud({ classes: up });
                                }
                              }} className="p-2 bg-red-50 text-red-600 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* TAB ADMIN: KELOLA TENANT */}
                {adminSubTab === 'tenants' && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center bg-white p-3 rounded-xl shadow-sm border">
                      <h3 className="font-bold text-sm">Kelola Stand / Tenant</h3>
                      <button onClick={() => setTenantModal({ isOpen: true, item: null })} className="px-3 py-2 bg-indigo-600 text-white text-[11px] font-bold rounded-lg flex items-center shadow-sm">
                        <Plus className="w-3.5 h-3.5 mr-1" /> Tambah Stand
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {tenants.map(t => (
                        <div key={t.id} className="bg-white p-3 rounded-xl border shadow-sm flex justify-between items-center">
                          <div>
                            <h4 className="font-bold text-sm text-slate-900">{t.name}</h4>
                            <p className="text-[10px] text-slate-500 mt-0.5">PJ: {t.owner}</p>
                            <p className="text-[10px] text-emerald-700 font-bold">WA: {t.phone}</p>
                          </div>
                          <div className="flex gap-1.5">
                            <button onClick={() => setTenantModal({ isOpen: true, item: t })} className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Edit3 className="w-4 h-4" /></button>
                            <button onClick={() => {
                                if(window.confirm(`Hapus stand ${t.name}?`)){
                                  const up = tenants.filter(x => x.id !== t.id);
                                  setTenants(up); syncPushToCloud({ tenants: up });
                                }
                              }} className="p-2 bg-red-50 text-red-600 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </main>
        )}

        {/* CART MOBILE / KANAN */}
        {isCartOpen && (
          <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm">
            <div className="w-full max-w-sm bg-white h-full flex flex-col shadow-2xl">
              <div className="p-4 border-b flex justify-between items-center bg-slate-50">
                <h2 className="font-bold text-sm flex items-center text-slate-900"><ShoppingCart className="w-4 h-4 mr-2" /> Keranjang ({cartSummary.totalItems})</h2>
                <button onClick={() => setIsCartOpen(false)} className="p-1.5 bg-slate-200 hover:bg-slate-300 rounded-lg"><X className="w-4 h-4 text-slate-600" /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50">
                {cart.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-xl text-xs shadow-sm">
                    <div>
                      <h4 className="font-bold line-clamp-1 text-slate-800">{parseAndCleanItem(item.name)}</h4>
                      <p className="text-[11px] text-amber-600 font-black mt-0.5">{formatRupiah((Number(item.priceOwner) + Number(item.priceOrganizer)) * item.qty)}</p>
                    </div>
                    <div className="flex items-center space-x-2 bg-slate-50 border p-1 rounded-lg">
                      <button onClick={() => updateCartQty(item.id, -1)} className="w-6 h-6 bg-white rounded shadow-sm text-xs font-bold text-slate-600">-</button>
                      <span className="text-[11px] font-bold w-4 text-center">{item.qty}</span>
                      <button onClick={() => updateCartQty(item.id, 1)} className="w-6 h-6 bg-amber-500 text-white rounded shadow-sm text-xs font-bold">+</button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-4 border-t bg-white shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
                <div className="flex justify-between font-black text-sm mb-3 text-slate-800">
                  <span>Total:</span>
                  <span className="text-amber-600">{formatRupiah(cartSummary.totalSellingPrice)}</span>
                </div>
                <button onClick={() => { setIsCartOpen(false); setIsCheckoutModalOpen(true); }} className="w-full py-3 bg-amber-600 text-white font-bold rounded-xl shadow-md text-sm flex items-center justify-center">
                  Lanjut Checkout <Send className="w-4 h-4 ml-2" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL CHECKOUT */}
        {isCheckoutModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-sm p-5 relative shadow-2xl">
              <button onClick={() => setIsCheckoutModalOpen(false)} className="absolute top-4 right-4 p-1.5 bg-slate-100 rounded-lg text-slate-500"><X className="w-4 h-4" /></button>
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

                <button type="submit" disabled={isSubmitting} className="w-full py-3.5 mt-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md disabled:opacity-50 text-sm flex items-center justify-center">
                  {isSubmitting ? 'Memproses Data...' : <><MessageCircle className="w-4 h-4 mr-2" /> Kirim Pesanan (WA)</>}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* MODAL ADMIN */}
        {productModal.isOpen && (
          <ModalProductForm
            item={productModal.item}
            tenants={tenants}
            onClose={() => setProductModal({ isOpen: false, item: null })}
            onSave={(formData) => {
              let updated;
              if (productModal.item) updated = products.map((p) => (p.id === productModal.item.id ? { ...p, ...formData } : p));
              else updated = [...products, { ...formData, id: 'p-' + Date.now(), available: true }];
              setProducts(updated); syncPushToCloud({ products: updated }); setProductModal({ isOpen: false, item: null });
            }}
          />
        )}

        {tenantModal.isOpen && (
          <ModalTenantForm
            item={tenantModal.item}
            onClose={() => setTenantModal({ isOpen: false, item: null })}
            onSave={(formData) => {
              let updated;
              if (tenantModal.item) updated = tenants.map((t) => (t.id === tenantModal.item.id ? { ...t, ...formData } : t));
              else updated = [...tenants, { ...formData, id: 't-' + Date.now() }];
              setTenants(updated); syncPushToCloud({ tenants: updated }); setTenantModal({ isOpen: false, item: null });
            }}
          />
        )}

        {batchModal.isOpen && (
          <ModalBatchForm
            item={batchModal.item}
            onClose={() => setBatchModal({ isOpen: false, item: null })}
            onSave={(formData) => {
              let updated;
              if (batchModal.item) updated = batches.map((b) => (b.id === batchModal.item.id ? { ...b, ...formData } : b));
              else updated = [...batches, { ...formData, id: 'b-' + Date.now(), isActive: false }];
              setBatches(updated); syncPushToCloud({ batches: updated }); setBatchModal({ isOpen: false, item: null });
            }}
          />
        )}

        {classModal.isOpen && (
          <ModalClassForm
            item={classModal.item}
            onClose={() => setClassModal({ isOpen: false, item: null })}
            onSave={(formData) => {
              let updated;
              if (classModal.item) updated = classesList.map((c) => (c.id === classModal.item.id ? { ...c, ...formData } : c));
              else updated = [...classesList, { ...formData, id: 'c-' + Date.now() }];
              setClassesList(updated); syncPushToCloud({ classes: updated }); setClassModal({ isOpen: false, item: null });
            }}
          />
        )}
      </div>

      {/* RENDER PDF KELUAR DARI FLOW BIASA */}
      {printData && (
        <div className="fixed inset-0 z-[9999] bg-slate-100 overflow-y-auto print:static print:block print:w-full print:bg-white print:overflow-visible">
          <style>{`
            @media print {
              @page { size: auto; margin: 0mm; }
              body { margin: 10mm; }
              html, body { height: max-content !important; overflow: visible !important; }
              .no-print { display: none !important; }
              * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
              .page-break-inside-avoid { break-inside: avoid; page-break-inside: avoid; }
            }
          `}</style>
          
          <div className="no-print sticky top-0 bg-slate-900 text-white p-4 shadow-md flex justify-between items-center z-50">
             <h2 className="font-bold text-sm">Mode Export PDF</h2>
             <div className="flex flex-wrap gap-2">
               <button onClick={() => window.print()} className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded-lg text-xs font-bold transition-colors">
                 Simpan sbg PDF
               </button>
               <button 
                 onClick={() => {
                   let cleanPhone = printData.tenantRep.tenantPhone ? String(printData.tenantRep.tenantPhone).replace(/[^0-9]/g, '') : '';
                   if (cleanPhone.startsWith('0')) cleanPhone = '62' + cleanPhone.slice(1);
                   let text = `Halo Ibu/Bapak, berikut kami lampirkan dokumen PDF Rekapitulasi Pesanan Bazaar DANUS untuk Stand ${printData.tenantRep.tenantName}. Terima Kasih!`;
                   const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
                   if(cleanPhone.length > 5) {
                       window.open(waUrl, '_blank');
                   } else {
                       alert("Nomor WA tenant tidak valid.");
                   }
                 }} 
                 className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 rounded-lg text-xs font-bold transition-colors"
               >
                 Buka WA (Kirim Manual)
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
              Periode: {printData.currentBatch?.name || '-'} | Ready: {printData.currentBatch?.readyDate ? formatIndoDate(printData.currentBatch.readyDate) : '-'} | PJ: {printData.tenantRep?.tenantOwner || '-'} ({printData.tenantRep?.tenantPhone || '-'})
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
    </Fragment>
  );
}

function ModalClassForm({ item, onClose, onSave }) {
  const [name, setName] = useState(item?.name || '');
  const [phone, setPhone] = useState(item?.phone || '');
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-xs p-6 relative shadow-xl">
        <button onClick={onClose} className="absolute top-4 right-4 p-1.5 bg-slate-100 rounded-lg"><X className="w-4 h-4 text-slate-500" /></button>
        <h3 className="font-bold text-base mb-4">{item ? 'Edit Kelas' : 'Tambah Kelas'}</h3>
        <form onSubmit={(e) => { e.preventDefault(); onSave({ name, phone }); }} className="space-y-4 text-xs font-medium">
          <div><label className="block mb-1">Nama Kelas</label><input type="text" required value={name} onChange={e => setName(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500" /></div>
          <div><label className="block mb-1">No WA (Cth: 628...)</label><input type="text" required value={phone} onChange={e => setPhone(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500" /></div>
          <button type="submit" className="w-full py-2.5 bg-indigo-600 text-white font-bold rounded-xl shadow-md">Simpan</button>
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
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-xs p-6 relative shadow-xl">
        <button onClick={onClose} className="absolute top-4 right-4 p-1.5 bg-slate-100 rounded-lg"><X className="w-4 h-4 text-slate-500" /></button>
        <h3 className="font-bold text-base mb-4">{item ? 'Edit Stand' : 'Tambah Stand'}</h3>
        <form onSubmit={(e) => { e.preventDefault(); onSave({ name, owner, phone }); }} className="space-y-4 text-xs font-medium">
          <div><label className="block mb-1">Nama Stand</label><input type="text" required value={name} onChange={e => setName(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-xl" /></div>
          <div><label className="block mb-1">PJ / Owner</label><input type="text" required value={owner} onChange={e => setOwner(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-xl" /></div>
          <div><label className="block mb-1">No WA (628...)</label><input type="text" required value={phone} onChange={e => setPhone(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-xl" /></div>
          <button type="submit" className="w-full py-2.5 bg-indigo-600 text-white font-bold rounded-xl shadow-md">Simpan</button>
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
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-xs p-6 relative shadow-xl">
        <button onClick={onClose} className="absolute top-4 right-4 p-1.5 bg-slate-100 rounded-lg"><X className="w-4 h-4 text-slate-500" /></button>
        <h3 className="font-bold text-base mb-4">{item ? 'Edit Batch' : 'Buat Batch'}</h3>
        <form onSubmit={(e) => { e.preventDefault(); onSave(form); }} className="space-y-4 text-xs font-medium">
          <div><label className="block mb-1">Nama Batch</label><input type="text" required value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-xl" /></div>
          <div><label className="block mb-1">Tgl Mulai PO</label><input type="date" required value={form.startDate} onChange={e => setForm({...form, startDate: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-xl" /></div>
          <div><label className="block mb-1">Tgl Tutup PO</label><input type="date" required value={form.endDate} onChange={e => setForm({...form, endDate: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-xl" /></div>
          <div><label className="block mb-1 text-emerald-700">Tgl Ready / Distribusi</label><input type="date" required value={form.readyDate} onChange={e => setForm({...form, readyDate: e.target.value})} className="w-full px-3 py-2 border border-emerald-300 rounded-xl bg-emerald-50 focus:outline-none" /></div>
          <button type="submit" className="w-full py-2.5 bg-indigo-600 text-white font-bold rounded-xl shadow-md">Simpan</button>
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
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-sm p-6 relative overflow-y-auto max-h-[90vh] shadow-xl">
        <button onClick={onClose} className="absolute top-4 right-4 p-1.5 bg-slate-100 rounded-lg"><X className="w-4 h-4 text-slate-500" /></button>
        <h3 className="font-bold text-base mb-4">{item ? 'Edit Produk' : 'Tambah Produk'}</h3>
        <form onSubmit={(e) => { e.preventDefault(); onSave(form); }} className="space-y-4 text-xs font-medium">
          <div><label className="block mb-1">Nama Produk</label><input type="text" required value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-xl" /></div>
          <div><label className="block mb-1">Stand / Tenant</label><select value={form.tenantId} onChange={e => setForm({...form, tenantId: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-xl">{tenants.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select></div>
          <div className="flex gap-3">
            <div className="flex-1"><label className="block mb-1 text-emerald-700">Hrg Owner</label><input type="number" required value={form.priceOwner} onChange={e => setForm({...form, priceOwner: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-xl" /></div>
            <div className="flex-1"><label className="block mb-1 text-indigo-700">Mrgn Panitia</label><input type="number" required value={form.priceOrganizer} onChange={e => setForm({...form, priceOrganizer: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-xl" /></div>
          </div>
          <div><label className="block mb-1">Deskripsi Singkat (Opsional)</label><input type="text" value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-xl" /></div>
          <div>
            <label className="block mb-1.5">Upload Foto (Auto-Compress)</label>
            {form.imageUrl && <img src={form.imageUrl} alt="preview" className="w-16 h-16 object-cover rounded-xl border border-slate-200 mb-2 shadow-sm" />}
            <input type="file" accept="image/*" onChange={handleImageUpload} className="w-full file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 cursor-pointer text-slate-500" />
          </div>
          <button type="submit" className="w-full py-2.5 bg-indigo-600 text-white font-bold rounded-xl shadow-md mt-2">Simpan Produk</button>
        </form>
      </div>
    </div>
  );
}