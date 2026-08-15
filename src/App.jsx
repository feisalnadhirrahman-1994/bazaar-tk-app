import React, { useState, useEffect, useMemo } from 'react';
import { 
  ShoppingBag, ShoppingCart, Plus, Trash2, Edit3, CheckCircle2, 
  MessageCircle, Store, Settings, Search, FileSpreadsheet, X, 
  Send, User, School, Layers, Lock, AlertCircle, Phone, 
  Image as ImageIcon, Share2, Save, RefreshCw, Printer, Upload
} from 'lucide-react';

// URL Webhook Baru sesuai deployment terakhir
const DEFAULT_WEBHOOK_URL = 'https://script.google.com/macros/s/AKfycbwMORs9RhRXNQhQf5s0NhxKkT-IDiyu4NcOSXpcHkU3175JdLo5E-l_9166sznyL9U/exec';

// Unicode Emojis (Mencegah corrupted encode di Windows/CMD)
const WA_SMILE = '\uD83D\uDE0A';
const WA_PRAY = '\uD83D\uDE4F';

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

const parseAndCleanItem = (rawItem, productsList = [], tenantsList = []) => {
  let rawName = String(rawItem.name || '');
  let qty = Number(rawItem.qty) || 1;

  // Ekstrak quantity secara presisi untuk menghindari duplikasi (x3) (x1)
  const matches = rawName.match(/\(x(\d+)\)/g);
  if (matches && matches.length > 0) {
    const extractedNum = parseInt(matches[0].replace(/[^0-9]/g, ''), 10);
    if (extractedNum) qty = extractedNum;
  }

  let cleanName = rawName.replace(/\(x\d+\)/g, '').replace(/\[.*?\]/g, '').trim();
  cleanName = cleanName.replace(/^[-,]+|[-,\s]+$/g, '').trim();

  const matchedProd = productsList.find(
    (p) => p.id === rawItem.id || (p.name || '').toLowerCase() === cleanName.toLowerCase()
  );

  const priceOwner = matchedProd ? Number(matchedProd.priceOwner || 0) : Number(rawItem.priceOwner || 0);
  const priceOrganizer = matchedProd ? Number(matchedProd.priceOrganizer || 0) : Number(rawItem.priceOrganizer || 0);
  const unitSellingPrice = priceOwner + priceOrganizer;
  const tenantId = matchedProd ? matchedProd.tenantId : (rawItem.tenantId || tenantsList[0]?.id || 't1');
  const tenantObj = tenantsList.find((t) => t.id === tenantId);

  return {
    ...rawItem,
    name: cleanName || 'Produk Bazaar',
    qty,
    priceOwner,
    priceOrganizer,
    unitSellingPrice,
    tenantId,
    tenantName: tenantObj?.name || rawItem.tenantName || 'Stand Bazaar',
    subtotal: unitSellingPrice * qty
  };
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
      <text x="200" y="310" textAnchor="middle" fontSize="26" fontFamily="Georgia, serif" fontWeight="bold" fill="#000000">Parent Teacher</text>
      <text x="200" y="348" textAnchor="middle" fontSize="30" fontFamily="Georgia, serif" fontWeight="bold" fill="#000000">Association</text>
    </svg>
  );
}

export default function App() {
  const [activeTab, setActiveTab] = useState('shop');
  const [adminSubTab, setAdminSubTab] = useState('batch_reports');
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  
  const [loginForm, setLoginForm] = useState({ username: '', password: '', webhookUrl: '' });
  const [loginError, setLoginError] = useState('');
  const [toastMessage, setToastMessage] = useState('');
  const [isCloudSyncing, setIsCloudSyncing] = useState(false);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: null });

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  const [adminAuth, setAdminAuth] = useState(() => {
    const saved = localStorage.getItem('ld_bazaar_admin_auth');
    return saved ? JSON.parse(saved) : { username: 'admin', password: '123' };
  });

  const [adminPhone, setAdminPhone] = useState(() => localStorage.getItem('ld_bazaar_admin_phone') || '628123456780');
  const [sheetWebhookUrl, setSheetWebhookUrl] = useState(() => {
    const saved = localStorage.getItem('ld_bazaar_sheet_webhook');
    return (saved && saved.trim() !== '') ? saved : DEFAULT_WEBHOOK_URL;
  });

  const [classesList, setClassesList] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [products, setProducts] = useState([]);
  const [batches, setBatches] = useState([]);
  const [orders, setOrders] = useState([]);

  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedTenantFilter, setSelectedTenantFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [checkoutData, setCheckoutData] = useState({ namaAnak: '', kelas: '', namaOrtu: '', catatan: '' });
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);

  const [productModal, setProductModal] = useState({ isOpen: false, item: null });
  const [tenantModal, setTenantModal] = useState({ isOpen: false, item: null });
  const [batchModal, setBatchModal] = useState({ isOpen: false, item: null });
  const [classModal, setClassModal] = useState({ isOpen: false, item: null });
  
  const [reportSelectedBatchId, setReportSelectedBatchId] = useState('');
  const [reportSelectedStatus, setReportSelectedStatus] = useState('Paid');

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const urlSheet = urlParams.get('sheet') || urlParams.get('s');
    if (urlSheet) {
      setSheetWebhookUrl(urlSheet);
      localStorage.setItem('ld_bazaar_sheet_webhook', urlSheet);
      showToast('URL Webhook Cloud Teridentifikasi!');
    }
    fetchCloudData(true);
  }, []);

  const fetchCloudData = async (silent = false) => {
    const targetUrl = sheetWebhookUrl || DEFAULT_WEBHOOK_URL;
    if (!targetUrl) {
      setIsInitialLoad(false);
      return;
    }
    setIsCloudSyncing(true);
    try {
      const res = await fetch(targetUrl);
      const json = await res.json();
      if (json.status === 'success' && json.data) {
        if (json.data.products?.length > 0) setProducts(json.data.products);
        if (json.data.tenants?.length > 0) setTenants(json.data.tenants);
        if (json.data.batches?.length > 0) {
          setBatches(json.data.batches);
          if (!reportSelectedBatchId) setReportSelectedBatchId(json.data.batches[0].id);
        }
        if (json.data.classes?.length > 0) {
          setClassesList(json.data.classes);
          setCheckoutData(prev => ({ ...prev, kelas: json.data.classes[0]?.name || '' }));
        }
        if (json.data.orders) setOrders(json.data.orders);
        
        if (json.data.settings) {
          if (json.data.settings.adminPhone) setAdminPhone(json.data.settings.adminPhone);
          if (json.data.settings.adminAuth) {
            try { setAdminAuth(typeof json.data.settings.adminAuth === 'string' ? JSON.parse(json.data.settings.adminAuth) : json.data.settings.adminAuth); } catch(e) {}
          }
        }
        if (!silent) showToast('Data Disinkronkan dari Cloud!');
      }
    } catch (e) {
      console.warn('Google Sheets Fetch Error:', e);
      if (!silent) showToast('Gagal terhubung ke Google Sheets.');
    } finally {
      setIsInitialLoad(false);
      setIsCloudSyncing(false);
    }
  };

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
        settings: { adminPhone, adminAuth }
      };

      await fetch(targetUrl, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      showToast('Perubahan Tersimpan ke Cloud!');
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
    return batches.find((b) => todayStr >= b.startDate && todayStr <= b.endDate) || null;
  }, [batches]);

  const orderStatusInfo = useMemo(() => {
    if (!activeBatch) return { isOpen: false, reason: 'Belum ada Periode Pemesanan yang dibuka.' };
    const todayStr = new Date().toISOString().slice(0, 10);
    if (todayStr < activeBatch.startDate) return { isOpen: false, reason: `Pemesanan baru dibuka pada ${formatIndoDate(activeBatch.startDate)}.` };
    if (todayStr > activeBatch.endDate) return { isOpen: false, reason: `Pemesanan telah berakhir pada ${formatIndoDate(activeBatch.endDate)}.` };
    return { isOpen: true, reason: `Sedang Dibuka: ${activeBatch.name}` };
  }, [activeBatch]);

  const addToCart = (product) => {
    if (!orderStatusInfo.isOpen) return;
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) return prev.map((item) => item.id === product.id ? { ...item, qty: item.qty + 1 } : item);
      return [...prev, { ...product, qty: 1 }];
    });
  };

  const updateCartQty = (productId, delta) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.id === productId) {
          const newQty = item.qty + delta;
          return newQty > 0 ? { ...item, qty: newQty } : null;
        }
        return item;
      }).filter(Boolean)
    );
  };

  const cartSummary = useMemo(() => {
    return cart.reduce(
      (acc, item) => {
        const itemSellingPrice = item.priceOwner + item.priceOrganizer;
        acc.totalSellingPrice += itemSellingPrice * item.qty;
        acc.totalOwnerPrice += item.priceOwner * item.qty;
        acc.totalOrganizerPrice += item.priceOrganizer * item.qty;
        acc.totalItems += item.qty;
        return acc;
      },
      { totalSellingPrice: 0, totalOwnerPrice: 0, totalOrganizerPrice: 0, totalItems: 0 }
    );
  }, [cart]);

  const handleCheckoutSubmit = (e) => {
    e.preventDefault();
    if (!orderStatusInfo.isOpen || !activeBatch) return showToast(orderStatusInfo.reason);
    if (!checkoutData.namaAnak.trim() || cart.length === 0) return;
    
    const newOrderId = 'BZ-' + Math.floor(100000 + Math.random() * 900000);
    const orderDate = new Date().toISOString();
    
    const targetClassObj = classesList.find((c) => c.name === checkoutData.kelas);
    const targetPhone = String(targetClassObj?.phone || adminPhone || '628123456780');
    let cleanPhone = targetPhone.replace(/[^0-9]/g, '');
    if (cleanPhone.startsWith('0')) cleanPhone = '62' + cleanPhone.slice(1);

    const orderPayload = {
      orderId: newOrderId,
      batchId: activeBatch.id,
      date: orderDate,
      customer: { ...checkoutData },
      items: cart.map((item) => ({
        id: item.id,
        name: item.name,
        tenantId: item.tenantId,
        tenantName: tenants.find((t) => t.id === item.tenantId)?.name || 'Stand',
        priceOwner: item.priceOwner,
        priceOrganizer: item.priceOrganizer,
        sellingPrice: item.priceOwner + item.priceOrganizer,
        qty: item.qty,
        subtotal: (item.priceOwner + item.priceOrganizer) * item.qty
      })),
      totalAmount: cartSummary.totalSellingPrice,
      totalOwnerShare: cartSummary.totalOwnerPrice,
      totalOrganizerShare: cartSummary.totalOrganizerPrice,
      status: 'Unpaid'
    };

    setOrders((prev) => [orderPayload, ...prev]);

    let waText = `*PEMESANAN BAZAAR DANUS PTA LITTLE DARBI (${activeBatch.name})*\n`;
    if (activeBatch.readyDate) waText += `*Tgl Distribusi/Ready:* ${formatIndoDate(activeBatch.readyDate)}\n`;
    waText += `-----------------------------------\n`;
    waText += `*No. Pesanan:* ${newOrderId}\n`;
    waText += `*Nama Anak:* ${checkoutData.namaAnak}\n`;
    waText += `*Kelas:* ${checkoutData.kelas}\n`;
    if (checkoutData.namaOrtu) waText += `*Nama Ortu/WA:* ${checkoutData.namaOrtu}\n`;
    if (checkoutData.catatan) waText += `*Catatan:* ${checkoutData.catatan}\n`;
    waText += `*Status:* UNPAID (Belum Bayar)\n`;
    waText += `-----------------------------------\n`;
    waText += `*Rincian Pesanan:*\n`;

    orderPayload.items.forEach((item, index) => {
      waText += `${index + 1}. *${item.name}* (x${item.qty}) - ${formatRupiah(item.subtotal)}\n   _[${item.tenantName}]_\n`;
    });

    waText += `-----------------------------------\n`;
    waText += `*TOTAL TAGIHAN: ${formatRupiah(orderPayload.totalAmount)}*\n`;
    waText += `-----------------------------------\n`;
    waText += `Halo PIC Kelas ${checkoutData.kelas}, mohon instruksi info rekening pembayaran. Terima kasih! ${WA_PRAY}`;

    const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(waText)}`;

    const targetUrl = sheetWebhookUrl || DEFAULT_WEBHOOK_URL;
    fetch(targetUrl, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'checkout', ...orderPayload }) }).catch(err => console.warn(err));

    setCart([]);
    setIsCheckoutModalOpen(false);
    setIsCartOpen(false);
    setCheckoutData({ namaAnak: '', kelas: classesList[0]?.name || '', namaOrtu: '', catatan: '' });
    
    // Redirect instantly
    window.open(waUrl, '_blank');
  };

  const batchReportData = useMemo(() => {
    let filtered = orders.filter((o) => o.batchId === reportSelectedBatchId);
    if (reportSelectedStatus !== 'ALL') {
      filtered = filtered.filter((o) => o.status === reportSelectedStatus);
    }

    return tenants.map((tenant) => {
      const customerOrdersDetail = [];
      const itemAggregatesMap = {};
      let tenantTotalGross = 0;
      let tenantTotalOwnerShare = 0;

      filtered.forEach((ord) => {
        const parsedItems = ord.items.map(it => parseAndCleanItem(it, products, tenants));
        const tenantItemsInOrder = parsedItems.filter((it) => it.tenantId === tenant.id);
        
        if (tenantItemsInOrder.length > 0) {
          customerOrdersDetail.push({
            orderId: ord.orderId,
            namaAnak: ord.customer?.namaAnak,
            kelas: ord.customer?.kelas,
            namaOrtu: ord.customer?.namaOrtu || '-',
            catatan: ord.customer?.catatan || '',
            items: tenantItemsInOrder
          });

          tenantItemsInOrder.forEach((it) => {
            if (!itemAggregatesMap[it.name]) {
              itemAggregatesMap[it.name] = { name: it.name, qty: 0, totalOwnerShare: 0, totalOrganizerShare: 0, totalNominal: 0 };
            }
            itemAggregatesMap[it.name].qty += it.qty;
            itemAggregatesMap[it.name].totalOwnerShare += (it.priceOwner * it.qty);
            itemAggregatesMap[it.name].totalOrganizerShare += (it.priceOrganizer * it.qty);
            itemAggregatesMap[it.name].totalNominal += (it.unitSellingPrice * it.qty);
            
            tenantTotalGross += it.subtotal;
            tenantTotalOwnerShare += (it.priceOwner * it.qty);
          });
        }
      });

      return {
        tenantId: tenant.id,
        tenantName: tenant.name,
        tenantOwner: tenant.owner,
        tenantPhone: tenant.phone || '',
        customerOrdersDetail,
        itemAggregatesMap,
        tenantTotalGross,
        tenantTotalOwnerShare
      };
    }).filter(t => Object.keys(t.itemAggregatesMap).length > 0);
  }, [orders, reportSelectedBatchId, reportSelectedStatus, tenants, products]);

  const handlePrintTenantReport = (tenantRep) => {
    const currentBatch = batches.find((b) => b.id === reportSelectedBatchId);
    const printWindow = window.open('', '_blank');

    let html = `
      <html>
      <head>
        <title>Rekapitulasi Dapur - ${tenantRep.tenantName}</title>
        <style>
          body { font-family: sans-serif; padding: 20px; color: #333; }
          h2 { color: #007A37; margin-bottom: 5px; }
          h3 { color: #333; margin-top: 0; }
          .info { font-size: 12px; color: #666; margin-bottom: 20px; border-bottom: 2px solid #007A37; padding-bottom: 10px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 30px; font-size: 12px; }
          th, td { border: 1px solid #ccc; padding: 8px; text-align: left; vertical-align: top; }
          th { background-color: #f0f8ff; color: #333; font-weight: bold; }
          .text-right { text-align: right; }
          .text-center { text-align: center; }
          .total-row { font-weight: bold; background-color: #f9f9f9; }
          .highlight { color: #d97706; }
        </style>
      </head>
      <body>
        <h2>Bazaar DANUS PTA Little Darbi</h2>
        <h3>Rekapitulasi Dapur Stand: ${tenantRep.tenantName}</h3>
        <div class="info">
          Periode: ${currentBatch?.name || '-'} ${currentBatch?.readyDate ? `(Tgl Ready: ${formatIndoDate(currentBatch.readyDate)})` : ''} | PJ: ${tenantRep.tenantOwner} (${tenantRep.tenantPhone})
        </div>

        <h4>Detail Pesanan Pembeli (${tenantRep.customerOrdersDetail.length} Pembeli)</h4>
        <table>
          <thead>
            <tr>
              <th width="5%" class="text-center">No</th>
              <th width="20%">Nama Anak</th>
              <th width="15%">Kelas</th>
              <th width="15%">Nama Ortu</th>
              <th width="35%">Detail Pesanan</th>
              <th width="10%">Catatan</th>
            </tr>
          </thead>
          <tbody>
    `;

    tenantRep.customerOrdersDetail.forEach((cust, idx) => {
      const itemsList = cust.items.map(it => `${it.name} (x${it.qty})`).join(',<br/>');
      html += `
        <tr>
          <td class="text-center">${idx + 1}</td>
          <td><strong>${cust.namaAnak}</strong></td>
          <td>${cust.kelas}</td>
          <td>${cust.namaOrtu}</td>
          <td>${itemsList}</td>
          <td>${cust.catatan || '-'}</td>
        </tr>
      `;
    });

    html += `
          </tbody>
        </table>

        <h4>Ringkasan Pesanan:</h4>
        <table>
          <thead>
            <tr>
              <th>Produk</th>
              <th class="text-center">Qty</th>
              <th class="text-right">Harga owner</th>
              <th class="text-right">Margin Jual</th>
              <th class="text-right">Nominal total</th>
            </tr>
          </thead>
          <tbody>
    `;

    let grandTotalOwner = 0; let grandTotalMargin = 0; let grandTotalNominal = 0; let grandTotalQty = 0;

    Object.keys(tenantRep.itemAggregatesMap).forEach(key => {
      const agg = tenantRep.itemAggregatesMap[key];
      grandTotalOwner += agg.totalOwnerShare;
      grandTotalMargin += agg.totalOrganizerShare;
      grandTotalNominal += agg.totalNominal;
      grandTotalQty += agg.qty;

      html += `
        <tr>
          <td><strong>${agg.name}</strong></td>
          <td class="text-center">${agg.qty}</td>
          <td class="text-right">${formatRupiah(agg.totalOwnerShare)}</td>
          <td class="text-right">${formatRupiah(agg.totalOrganizerShare)}</td>
          <td class="text-right highlight"><strong>${formatRupiah(agg.totalNominal)}</strong></td>
        </tr>
      `;
    });

    html += `
            <tr class="total-row">
              <td class="text-right"><strong>TOTAL KESELURUHAN</strong></td>
              <td class="text-center">${grandTotalQty}</td>
              <td class="text-right">${formatRupiah(grandTotalOwner)}</td>
              <td class="text-right">${formatRupiah(grandTotalMargin)}</td>
              <td class="text-right highlight"><strong>${formatRupiah(grandTotalNominal)}</strong></td>
            </tr>
          </tbody>
        </table>
        <p style="text-align: right; font-size: 14px;"><strong>Total Hak Vendor yang dibayarkan: <span style="color:#007A37">${formatRupiah(grandTotalOwner)}</span></strong></p>
        
        <script>
          window.onload = function() { window.print(); }
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans pb-24 relative">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-2xl text-xs font-bold flex items-center space-x-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900">{confirmModal.title}</h3>
            <p className="text-sm text-slate-600">{confirmModal.message}</p>
            <div className="flex space-x-3 pt-2">
              <button onClick={() => setConfirmModal({ isOpen: false })} className="flex-1 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl">Batal</button>
              <button onClick={confirmModal.onConfirm} className="flex-1 py-2.5 bg-red-600 text-white font-bold rounded-xl">Ya, Lanjutkan</button>
            </div>
          </div>
        </div>
      )}

      {/* Header Utama */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md shadow-sm border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 shrink-0 p-0.5 bg-white rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-center overflow-hidden">
              <LittleDarbiLogo className="w-full h-full object-contain" />
            </div>
            <div>
              <h1 className="font-black text-base sm:text-lg leading-tight text-slate-900 tracking-tight">
                Bazaar DANUS PTA Little Darbi
              </h1>
              <p className="text-[11px] text-slate-500 font-medium">Pemesanan Online Stand & Produk</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button onClick={() => fetchCloudData(false)} disabled={isCloudSyncing} className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center space-x-1 shadow-2xs">
              <RefreshCw className={`w-4 h-4 ${isCloudSyncing ? 'animate-spin text-indigo-600' : ''}`} />
              <span className="hidden sm:inline">Sync Cloud</span>
            </button>
            <div className="flex items-center bg-slate-100 p-1 rounded-xl">
              <button onClick={() => setActiveTab('shop')} className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all ${activeTab === 'shop' ? 'bg-white text-amber-600 shadow-sm' : 'text-slate-600'}`}>
                <ShoppingBag className="w-4 h-4" /> <span>Menu Pembeli</span>
              </button>
              <button onClick={() => setActiveTab('admin')} className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all ${activeTab === 'admin' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600'}`}>
                <Settings className="w-4 h-4" /> <span>Panel Admin</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {}
      {activeTab === 'shop' && (
        <main className="max-w-5xl mx-auto px-4 pt-6">
          {isInitialLoad ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 animate-pulse">
              {[1, 2, 3].map(n => (
                <div key={n} className="bg-white h-64 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="h-32 bg-slate-200 rounded-t-2xl"></div>
                  <div className="p-4 space-y-3">
                    <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                    <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                    <div className="h-8 bg-slate-200 rounded w-full mt-4"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <>
              <div className="mb-6">
                {orderStatusInfo.isOpen && activeBatch ? (
                  <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-2xl p-4 sm:p-5 shadow-md flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="bg-white/20 text-white text-[10px] uppercase font-extrabold tracking-wider px-2.5 py-0.5 rounded-full flex items-center">
                          <Layers className="w-3 h-3 mr-1" /> {activeBatch.name}
                        </span>
                        <span className="text-xs text-amber-100">Batas: <strong>{formatIndoDate(activeBatch.startDate)}</strong> s/d <strong>{formatIndoDate(activeBatch.endDate)}</strong></span>
                      </div>
                      <h2 className="text-lg sm:text-xl font-black mt-1">Pesan Makanan & Souvenir Bazaar</h2>
                      <p className="text-amber-100 text-xs">Pesanan akan diproses sesuai periode {activeBatch.name}.</p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-red-500 text-white rounded-2xl p-4 sm:p-5 shadow-md flex items-center space-x-3">
                    <div className="bg-white/20 p-2.5 rounded-xl"><Lock className="w-6 h-6 text-white" /></div>
                    <div>
                      <span className="bg-white/20 text-white text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-full">Ditutup</span>
                      <h2 className="text-base sm:text-lg font-bold mt-1">Sistem Pemesanan Sedang Ditutup!</h2>
                      <p className="text-red-100 text-xs">{orderStatusInfo.reason}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-3 mb-6">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                  <input type="text" placeholder="Cari makanan, minuman..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-white rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-amber-500/20" />
                </div>
                <div className="flex items-center space-x-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
                  <button onClick={() => setSelectedTenantFilter('all')} className={`px-3.5 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${selectedTenantFilter === 'all' ? 'bg-amber-600 text-white' : 'bg-white text-slate-600 border'}`}>Semua Stand</button>
                  {tenants.map((t) => (
                    <button key={t.id} onClick={() => setSelectedTenantFilter(t.id)} className={`px-3.5 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${selectedTenantFilter === t.id ? 'bg-amber-600 text-white' : 'bg-white text-slate-600 border'}`}>{t.name}</button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {products.filter(p => (selectedTenantFilter === 'all' || p.tenantId === selectedTenantFilter) && p.available && p.name.toLowerCase().includes(searchQuery.toLowerCase())).map((prod) => {
                  const tenant = tenants.find((t) => t.id === prod.tenantId);
                  const sellingPrice = Number(prod.priceOwner || 0) + Number(prod.priceOrganizer || 0);
                  const inCart = cart.find((item) => item.id === prod.id);

                  return (
                    <div key={prod.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between overflow-hidden hover:shadow-md">
                      <div className="h-40 w-full bg-slate-100 relative overflow-hidden flex items-center justify-center">
                        {prod.imageUrl ? (
                          <img src={prod.imageUrl} alt={prod.name} className="w-full h-full object-cover" />
                        ) : (
                          <ImageIcon className="w-10 h-10 text-slate-300" />
                        )}
                        <span className="absolute top-2 left-2 text-[10px] font-bold bg-white/95 text-slate-800 px-2 py-0.5 rounded-md">{tenant?.name || 'Stand'}</span>
                      </div>
                      <div className="p-4 flex-1 flex flex-col justify-between">
                        <div>
                          <h3 className="font-bold text-slate-900">{prod.name}</h3>
                          <p className="text-xs text-slate-500 line-clamp-2 mt-1">{prod.description}</p>
                        </div>
                        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                          <div>
                            <span className="text-[10px] text-slate-400 block">Harga Jual</span>
                            <span className="text-base font-extrabold text-amber-600">{formatRupiah(sellingPrice)}</span>
                          </div>
                          {orderStatusInfo.isOpen ? (
                            inCart ? (
                              <div className="flex items-center space-x-2 bg-amber-50 border border-amber-200 p-1 rounded-xl">
                                <button onClick={() => updateCartQty(prod.id, -1)} className="w-7 h-7 bg-white rounded-lg font-bold text-amber-700">-</button>
                                <span className="text-xs font-bold px-1">{inCart.qty}</span>
                                <button onClick={() => updateCartQty(prod.id, 1)} className="w-7 h-7 bg-amber-600 text-white rounded-lg font-bold">+</button>
                              </div>
                            ) : (
                              <button onClick={() => addToCart(prod)} className="px-3.5 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold flex items-center space-x-1.5"><Plus className="w-4 h-4" /><span>Pesan</span></button>
                            )
                          ) : (
                            <span className="text-[11px] font-semibold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-lg"><Lock className="w-3 h-3 inline mr-1" /> Ditutup</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {}
          {cart.length > 0 && orderStatusInfo.isOpen && (
            <div className="fixed bottom-4 left-4 right-4 max-w-md mx-auto z-40">
              <button onClick={() => setIsCartOpen(true)} className="w-full bg-amber-600 hover:bg-amber-700 text-white p-3.5 rounded-2xl shadow-xl flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="relative bg-white/20 p-2 rounded-xl">
                    <ShoppingCart className="w-5 h-5" />
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">{cartSummary.totalItems}</span>
                  </div>
                  <div className="text-left">
                    <p className="text-xs text-amber-100 font-medium">{cartSummary.totalItems} Pesanan</p>
                    <p className="text-base font-black">{formatRupiah(cartSummary.totalSellingPrice)}</p>
                  </div>
                </div>
                <div className="bg-white text-amber-700 px-3 py-2 rounded-xl text-xs font-bold shadow-sm">Lihat Keranjang</div>
              </button>
            </div>
          )}
        </main>
      )}

      {}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white h-full flex flex-col justify-between shadow-2xl">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h2 className="font-bold text-slate-900 flex items-center"><ShoppingCart className="w-5 h-5 text-amber-600 mr-2" /> Keranjang</h2>
              <button onClick={() => setIsCartOpen(false)} className="p-1.5 text-slate-400"><X className="w-5 h-5" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {cart.map((item) => {
                const tenant = tenants.find((t) => t.id === item.tenantId);
                const sellingPrice = Number(item.priceOwner || 0) + Number(item.priceOrganizer || 0);
                return (
                  <div key={item.id} className="flex items-center justify-between p-3 bg-slate-50 border rounded-xl">
                    <div>
                      <span className="text-[10px] text-slate-400 block">{tenant?.name || 'Stand'}</span>
                      <h4 className="font-bold text-sm">{item.name}</h4>
                      <p className="text-xs text-amber-600 font-semibold">{formatRupiah(sellingPrice)} x {item.qty}</p>
                    </div>
                    <div className="flex space-x-2 bg-white border p-1 rounded-lg">
                      <button onClick={() => updateCartQty(item.id, -1)} className="w-6 h-6 bg-slate-100 font-bold">-</button>
                      <span className="text-xs font-bold px-1 py-1">{item.qty}</span>
                      <button onClick={() => updateCartQty(item.id, 1)} className="w-6 h-6 bg-amber-600 text-white font-bold">+</button>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="p-4 border-t border-slate-200 bg-white space-y-3">
              <div className="flex justify-between items-center"><span className="text-slate-500">Total:</span><span className="text-lg font-black text-amber-600">{formatRupiah(cartSummary.totalSellingPrice)}</span></div>
              <button onClick={() => { setIsCartOpen(false); setIsCheckoutModalOpen(true); }} className="w-full py-3 bg-amber-600 text-white font-bold rounded-xl flex justify-center items-center space-x-2"><span>Isi Data Pemesan</span><Send className="w-4 h-4" /></button>
            </div>
          </div>
        </div>
      )}

      {}
      {isCheckoutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <button onClick={() => setIsCheckoutModalOpen(false)} className="absolute top-4 right-4 text-slate-400"><X className="w-5 h-5" /></button>
            <h3 className="text-lg font-bold text-slate-900 mb-1">Data Pemesan</h3>
            <p className="text-xs text-slate-500 mb-4">Batch: {activeBatch?.name}</p>
            <form onSubmit={handleCheckoutSubmit} className="space-y-4">
              <div><label className="block text-xs font-semibold text-slate-700 mb-1">Nama Anak <span className="text-red-500">*</span></label><input type="text" required value={checkoutData.namaAnak} onChange={(e) => setCheckoutData({ ...checkoutData, namaAnak: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border rounded-xl" /></div>
              <div><label className="block text-xs font-semibold text-slate-700 mb-1">Pilih Kelas <span className="text-red-500">*</span></label><select value={checkoutData.kelas} onChange={(e) => setCheckoutData({ ...checkoutData, kelas: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border rounded-xl">{classesList.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}</select></div>
              <div><label className="block text-xs font-semibold text-slate-700 mb-1">Nama Ortu / WA</label><input type="text" value={checkoutData.namaOrtu} onChange={(e) => setCheckoutData({ ...checkoutData, namaOrtu: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border rounded-xl" /></div>
              <div><label className="block text-xs font-semibold text-slate-700 mb-1">Catatan</label><textarea rows={2} value={checkoutData.catatan} onChange={(e) => setCheckoutData({ ...checkoutData, catatan: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border rounded-xl" /></div>
              <button type="submit" className="w-full py-3 bg-green-600 text-white font-bold rounded-xl flex items-center justify-center space-x-2"><MessageCircle className="w-5 h-5 fill-current" /><span>Kirim ke WA PIC Kelas</span></button>
            </form>
          </div>
        </div>
      )}

      {}
      {activeTab === 'admin' && (
        <main className="max-w-5xl mx-auto px-4 pt-6">
          {!isAdminLoggedIn ? (
            <div className="max-w-md mx-auto bg-white rounded-2xl border p-6 sm:p-8 shadow-xl mt-6">
              <div className="text-center mb-6">
                <LittleDarbiLogo className="w-12 h-12 mx-auto mb-3" />
                <h2 className="text-xl font-black text-slate-900">Login Admin PTA</h2>
              </div>
              {loginError && <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-xl text-xs flex items-center"><AlertCircle className="w-4 h-4 mr-2" />{loginError}</div>}
              <form onSubmit={(e) => {
                e.preventDefault();
                if (loginForm.username === adminAuth.username && loginForm.password === adminAuth.password) {
                  if (loginForm.webhookUrl && loginForm.webhookUrl !== sheetWebhookUrl) {
                    setSheetWebhookUrl(loginForm.webhookUrl);
                    localStorage.setItem('ld_bazaar_sheet_webhook', loginForm.webhookUrl);
                  }
                  setIsAdminLoggedIn(true); setLoginError(''); setLoginForm({ username: '', password: '', webhookUrl: '' });
                  showToast('Login Admin Berhasil!');
                } else {
                  setLoginError('Username atau Password salah!');
                }
              }} className="space-y-4 text-xs">
                <div><label className="block font-bold text-slate-700 mb-1">Username</label><input type="text" required value={loginForm.username} onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })} className="w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl" /></div>
                <div><label className="block font-bold text-slate-700 mb-1">Password</label><input type="password" required value={loginForm.password} onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })} className="w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl" /></div>
                <div><label className="block font-bold text-slate-700 mb-1 text-indigo-700">Webhook URL (Hanya jika belum sync)</label><input type="url" placeholder="Opsional jika sudah sync" value={loginForm.webhookUrl} onChange={(e) => setLoginForm({ ...loginForm, webhookUrl: e.target.value })} className="w-full px-3.5 py-2.5 bg-indigo-50 border border-indigo-200 rounded-xl" /></div>
                <button type="submit" className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-md">Masuk Panel Admin</button>
              </form>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center space-x-2 border-b border-slate-200 pb-3 overflow-x-auto scrollbar-none">
                {[{id:'batch_reports', label:'Rekap Per Tenant', icon:FileSpreadsheet}, {id:'tenants', label:'Kelola Stand', icon:User}, {id:'batches', label:'Kelola Batch', icon:Layers}, {id:'products', label:'Produk & Harga', icon:Store}, {id:'orders', label:`Semua Pesanan (${orders.length})`, icon:ShoppingBag}, {id:'class_pics', label:'Routing WA Kelas', icon:School}, {id:'settings', label:'Integrasi Webhook', icon:Settings}].map(tab => (
                  <button key={tab.id} onClick={() => setAdminSubTab(tab.id)} className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center space-x-1.5 whitespace-nowrap ${adminSubTab === tab.id ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-100'}`}><tab.icon className="w-4 h-4" /><span>{tab.label}</span></button>
                ))}
              </div>

              {}
              {adminSubTab === 'batch_reports' && (
                <div className="space-y-6">
                  <div className="bg-white p-4 rounded-2xl border flex gap-4 justify-between items-center">
                    <div><h3 className="font-bold text-slate-900 text-base">Laporan Rekapitulasi Per Stand</h3></div>
                    <div className="flex gap-2">
                      <select value={reportSelectedBatchId} onChange={(e) => setReportSelectedBatchId(e.target.value)} className="px-3 py-1.5 bg-slate-50 border rounded-xl text-xs font-bold">{batches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}</select>
                      <select value={reportSelectedStatus} onChange={(e) => setReportSelectedStatus(e.target.value)} className="px-3 py-1.5 bg-slate-50 border rounded-xl text-xs font-bold"><option value="Paid">Hanya Paid</option><option value="Unpaid">Hanya Unpaid</option><option value="Selesai">Hanya Selesai</option><option value="ALL">Semua Status</option></select>
                    </div>
                  </div>
                  <div className="space-y-6">
                    {batchReportData.map((tenantRep) => (
                      <div key={tenantRep.tenantId} className="bg-white rounded-2xl border overflow-hidden shadow-sm">
                        <div className="p-4 bg-slate-900 text-white flex justify-between items-center">
                          <div>
                            <h4 className="text-lg font-black">{tenantRep.tenantName}</h4>
                            <p className="text-xs text-slate-300">PJ: {tenantRep.tenantOwner} (WA: {tenantRep.tenantPhone})</p>
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => handlePrintTenantReport(tenantRep)} className="px-3 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl flex items-center"><Printer className="w-4 h-4 mr-1.5" /> Cetak PDF</button>
                            <button onClick={() => {
                              let cleanPhone = String(tenantRep.tenantPhone).replace(/[^0-9]/g, '');
                              if (cleanPhone.startsWith('0')) cleanPhone = '62' + cleanPhone.slice(1);
                              if (!cleanPhone) return showToast('Nomor WA belum valid!');
                              const currentBatch = batches.find((b) => b.id === reportSelectedBatchId);
                              let text = `*REKAP PESANAN - ${tenantRep.tenantName.toUpperCase()}*\nPeriode: ${currentBatch?.name}\n`;
                              if (currentBatch?.readyDate) text += `Tgl Ready/Distribusi: ${formatIndoDate(currentBatch.readyDate)}\n`;
                              text += `\n`;
                              Object.keys(tenantRep.itemAggregatesMap).forEach((name) => {
                                const agg = tenantRep.itemAggregatesMap[name];
                                text += `• *${agg.name}*: ${agg.qty} pcs (${formatRupiah(agg.totalOwnerShare)})\n`;
                              });
                              text += `\n*TOTAL HAK VENDOR: ${formatRupiah(tenantRep.tenantTotalOwnerShare)}*\n\nTerima kasih! ${WA_PRAY}`;
                              window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`, '_blank');
                            }} className="px-3 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl flex items-center"><MessageCircle className="w-4 h-4 mr-1.5 fill-current" /> WA Tenant</button>
                          </div>
                        </div>
                        <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div className="md:col-span-2 space-y-3">
                            <h5 className="font-bold text-xs uppercase text-slate-400">Detail Pesanan Masuk</h5>
                            <div className="space-y-2 max-h-72 overflow-y-auto">
                              {tenantRep.customerOrdersDetail.map((cust, idx) => (
                                <div key={idx} className="p-3 bg-slate-50 border rounded-xl text-xs space-y-1">
                                  <div className="flex justify-between font-bold text-slate-900">
                                    <span>{idx + 1}. {cust.namaAnak} ({cust.kelas})</span>
                                  </div>
                                  <div className="text-slate-600 pl-3 border-l-2 border-slate-300">
                                    {cust.items.map((it, iIdx) => <div key={iIdx}>- {it.name} <span className="font-bold">(x{it.qty})</span></div>)}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                          <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 flex flex-col justify-between">
                            <div>
                              <h5 className="font-bold text-xs uppercase text-amber-900 mb-3 flex items-center"><Store className="w-3.5 h-3.5 mr-1" /> Ringkasan Dapur</h5>
                              {Object.keys(tenantRep.itemAggregatesMap).map((name) => (
                                <div key={name} className="flex justify-between items-center bg-white p-2 rounded-lg border border-amber-200 text-xs mb-1">
                                  <span className="font-medium">{name}</span><span className="font-black text-amber-700 bg-amber-100 px-2 py-0.5 rounded">{tenantRep.itemAggregatesMap[name].qty} Pcs</span>
                                </div>
                              ))}
                            </div>
                            <div className="mt-4 pt-3 border-t border-amber-200 flex justify-between font-bold text-emerald-700 text-sm"><span>Hak Vendor:</span><span>{formatRupiah(tenantRep.tenantTotalOwnerShare)}</span></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {}
              {adminSubTab === 'orders' && (
                <div className="space-y-4">
                  <h3 className="font-bold text-slate-900 text-base">Semua Pesanan Masuk ({orders.length})</h3>
                  <div className="space-y-3">
                    {orders.map((ord) => {
                      const cleanItems = ord.items.map(it => parseAndCleanItem(it, products, tenants));
                      const recalculateTotal = cleanItems.reduce((sum, item) => sum + item.subtotal, 0);
                      
                      return (
                        <div key={ord.orderId} className="bg-white p-4 rounded-2xl border text-xs shadow-sm">
                          <div className="flex justify-between items-center mb-3">
                            <span className="font-bold text-indigo-700 text-sm">{ord.orderId} - {ord.customer?.namaAnak} ({ord.customer?.kelas})</span>
                            <div className="flex items-center space-x-2">
                              <select value={ord.status} onChange={(e) => {
                                const newOrders = orders.map(o => o.orderId === ord.orderId ? { ...o, status: e.target.value } : o);
                                setOrders(newOrders);
                              }} className="bg-slate-100 font-bold px-2 py-1.5 rounded border outline-none">
                                <option value="Unpaid">Unpaid</option><option value="Paid">Paid</option><option value="Selesai">Selesai</option><option value="Void">Void (Batal)</option>
                              </select>
                              <button onClick={() => {
                                fetch(sheetWebhookUrl || DEFAULT_WEBHOOK_URL, { method: 'POST', mode: 'no-cors', headers: {'Content-Type':'application/json'}, body: JSON.stringify({action:'updateOrderStatus', orderId: ord.orderId, status: ord.status}) });
                                showToast(`Status pesanan ${ord.orderId} disave ke Cloud!`);
                              }} className="p-1.5 bg-indigo-100 text-indigo-700 hover:bg-indigo-200 rounded-lg flex items-center font-bold px-2"><Save className="w-3.5 h-3.5 mr-1"/> Simpan Status</button>
                              <button onClick={() => {
                                setConfirmModal({
                                  isOpen: true, title: 'Hapus Pesanan', message: `Yakin ingin hapus pesanan ${ord.orderId}?`,
                                  onConfirm: () => {
                                    const updated = orders.filter(o => o.orderId !== ord.orderId);
                                    setOrders(updated);
                                    fetch(sheetWebhookUrl || DEFAULT_WEBHOOK_URL, { method: 'POST', mode: 'no-cors', headers: {'Content-Type':'application/json'}, body: JSON.stringify({action:'updateOrderStatus', orderId: ord.orderId, status: 'Void'}) });
                                    setConfirmModal({isOpen: false});
                                    showToast('Pesanan dihapus dari daftar');
                                  }
                                });
                              }} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                            </div>
                          </div>
                          <div className="space-y-1.5 text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                            {cleanItems.map((i, idx) => (
                              <div key={idx} className="flex justify-between items-center border-b border-slate-200/50 pb-1 mb-1 last:border-0 last:pb-0 last:mb-0">
                                <span><strong className="text-slate-800">{i.name} (x{i.qty})</strong> <span className="text-slate-400 text-[10px] ml-1">[{i.tenantName}]</span></span>
                                <span className="font-bold text-slate-900">{formatRupiah(i.subtotal)}</span>
                              </div>
                            ))}
                            {ord.customer?.catatan && <p className="text-[11px] text-amber-700 italic border-t pt-1">Catatan: {ord.customer.catatan}</p>}
                          </div>
                          <div className="flex justify-between font-bold text-slate-900 text-xs mt-3 px-1"><span>Total Nominal Pesanan:</span><span className="text-amber-600 text-sm">{formatRupiah(recalculateTotal)}</span></div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {}
              {adminSubTab === 'products' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-bold text-slate-900 text-base">Setup Produk & Harga</h3>
                    <button onClick={() => setProductModal({ isOpen: true, item: null })} className="px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl flex items-center space-x-1"><Plus className="w-4 h-4" /><span>Tambah Produk</span></button>
                  </div>
                  <div className="bg-white rounded-2xl border overflow-x-auto">
                    <table className="w-full text-left text-xs min-w-[700px]">
                      <thead className="bg-slate-100 text-slate-600 uppercase text-[10px]">
                        <tr><th className="p-3.5 w-14">Foto</th><th className="p-3.5">Nama Produk</th><th className="p-3.5">Stand</th><th className="p-3.5">Harga Owner</th><th className="p-3.5">Margin Panitia</th><th className="p-3.5">Harga Jual</th><th className="p-3.5 text-center">Aksi</th></tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {products.map((p) => {
                          const tenant = tenants.find((t) => t.id === p.tenantId);
                          return (
                            <tr key={p.id}>
                              <td className="p-3">{p.imageUrl ? <img src={p.imageUrl} alt={p.name} className="w-10 h-10 object-cover rounded-lg border" /> : <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400"><ImageIcon className="w-5 h-5" /></div>}</td>
                              <td className="p-3 font-bold">{p.name}</td>
                              <td className="p-3 text-slate-600">{tenant?.name || '-'}</td>
                              <td className="p-3 text-emerald-700">{formatRupiah(p.priceOwner)}</td>
                              <td className="p-3 text-indigo-700">+ {formatRupiah(p.priceOrganizer)}</td>
                              <td className="p-3 font-black text-amber-600">{formatRupiah(Number(p.priceOwner)+Number(p.priceOrganizer))}</td>
                              <td className="p-3 text-center">
                                <button onClick={() => setProductModal({ isOpen: true, item: p })} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"><Edit3 className="w-4 h-4" /></button>
                                <button onClick={() => {
                                  setConfirmModal({isOpen: true, title: 'Hapus Produk', message: `Hapus ${p.name}?`, onConfirm: () => {
                                    const updated = products.filter(item => item.id !== p.id);
                                    setProducts(updated); syncPushToCloud({ products: updated }); setConfirmModal({isOpen:false}); showToast('Produk dihapus');
                                  }});
                                }} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              
              {}
              {adminSubTab === 'batches' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-bold text-slate-900 text-base">Kelola Batch Periode</h3>
                    <button onClick={() => setBatchModal({ isOpen: true, item: null })} className="px-3.5 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl flex items-center space-x-1"><Plus className="w-4 h-4" /><span>Buat Batch Baru</span></button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {batches.map((b) => (
                      <div key={b.id} className={`bg-white rounded-2xl p-4 border ${b.isActive ? 'border-indigo-500 ring-2 ring-indigo-500/10' : 'border-slate-200'}`}>
                        <div className="flex justify-between items-start">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${b.isActive ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-500'}`}>{b.isActive ? 'BATCH AKTIF' : 'Non-Aktif'}</span>
                          <div className="flex space-x-1">
                            <button onClick={() => setBatchModal({ isOpen: true, item: b })} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"><Edit3 className="w-4 h-4" /></button>
                            <button onClick={() => setConfirmModal({isOpen:true, title:'Hapus Batch', message:`Hapus ${b.name}?`, onConfirm: () => {
                              const updated = batches.filter(item => item.id !== b.id); setBatches(updated); syncPushToCloud({ batches: updated }); setConfirmModal({isOpen:false});
                            }})} className="p-1.5 text-red-600 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button>
                          </div>
                        </div>
                        <h4 className="font-bold text-slate-900 text-base mt-1">{b.name}</h4>
                        <div className="mt-2 space-y-1 text-xs">
                          <p className="text-slate-500">Pesan: {formatIndoDate(b.startDate)} - {formatIndoDate(b.endDate)}</p>
                          {b.readyDate && <p className="text-emerald-600 font-bold">Ready: {formatIndoDate(b.readyDate)}</p>}
                        </div>
                        <div className="mt-3 pt-3 border-t flex justify-end">
                          <button onClick={() => {
                            const updated = batches.map((item) => ({ ...item, isActive: item.id === b.id }));
                            setBatches(updated); syncPushToCloud({ batches: updated });
                          }} className={`px-3 py-1.5 rounded-lg font-bold text-xs ${b.isActive ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700'}`}>{b.isActive ? 'Aktif Saat Ini' : 'Set Aktif'}</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {}
              {adminSubTab === 'tenants' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-bold text-slate-900 text-base">Kelola Stand / Tenant</h3>
                    <button onClick={() => setTenantModal({ isOpen: true, item: null })} className="px-3.5 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl flex items-center space-x-1"><Plus className="w-4 h-4" /><span>Tambah Stand Baru</span></button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {tenants.map((t) => (
                      <div key={t.id} className="bg-white p-4 rounded-2xl border shadow-sm space-y-2">
                        <h4 className="font-bold text-slate-900 text-sm">{t.name}</h4>
                        <p className="text-xs text-slate-500">PJ: {t.owner}</p>
                        <p className="text-xs font-semibold text-emerald-700 flex items-center"><Phone className="w-3 h-3 mr-1" /> WA: {t.phone || '(Belum diisi)'}</p>
                        <div className="pt-2 border-t flex justify-end space-x-2">
                          <button onClick={() => setTenantModal({ isOpen: true, item: t })} className="px-2.5 py-1 text-xs text-blue-600 bg-blue-50 rounded-lg font-semibold">Edit</button>
                          <button onClick={() => setConfirmModal({isOpen:true, title:'Hapus Stand', message:`Hapus ${t.name}?`, onConfirm: () => {
                            const updated = tenants.filter(item => item.id !== t.id); setTenants(updated); syncPushToCloud({ tenants: updated }); setConfirmModal({isOpen:false});
                          }})} className="px-2.5 py-1 text-xs text-red-600 bg-red-50 rounded-lg font-semibold">Hapus</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {adminSubTab === 'class_pics' && (
                <div className="bg-white p-6 rounded-2xl border space-y-4 shadow-sm">
                  <div className="flex justify-between items-center">
                    <h3 className="font-bold text-base text-slate-900">Kelola Kelas & Routing WA PIC</h3>
                    <button onClick={() => setClassModal({ isOpen: true, item: null })} className="px-3.5 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl flex items-center space-x-1"><Plus className="w-4 h-4" /><span>Tambah Kelas Baru</span></button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    {classesList.map((c) => (
                      <div key={c.id} className="p-3 bg-slate-50 border rounded-xl space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-slate-900">{c.name}</span>
                          <div className="flex space-x-1">
                            <button onClick={() => setClassModal({ isOpen: true, item: c })} className="text-blue-600 hover:bg-blue-50 p-1 rounded"><Edit3 className="w-4 h-4" /></button>
                            <button onClick={() => setConfirmModal({isOpen:true, title:'Hapus Kelas', message:`Hapus ${c.name}?`, onConfirm: () => {
                              const updated = classesList.filter(item => item.id !== c.id); setClassesList(updated); syncPushToCloud({ classes: updated }); setConfirmModal({isOpen:false});
                            }})} className="text-red-600 hover:bg-red-50 p-1 rounded"><Trash2 className="w-4 h-4" /></button>
                          </div>
                        </div>
                        <input type="text" placeholder="No WA PIC (628...)" value={c.phone} onChange={(e) => {
                          const updated = classesList.map(item => item.id === c.id ? { ...item, phone: e.target.value } : item);
                          setClassesList(updated);
                        }} onBlur={() => syncPushToCloud()} className="w-full p-2 bg-white border rounded-lg text-xs" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {}
              {adminSubTab === 'settings' && (
                <div className="max-w-xl bg-white rounded-2xl border p-6 space-y-4 shadow-sm text-xs">
                  <h3 className="font-bold text-base text-slate-900">Pengaturan Webhook & Cloud Sync</h3>
                  <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl space-y-2">
                    <span className="font-bold text-indigo-900 block">Link Auto-Sync Semua Perangkat:</span>
                    <button type="button" onClick={() => {
                      const shareUrl = `${window.location.origin}${window.location.pathname}?sheet=${encodeURIComponent(sheetWebhookUrl)}`;
                      navigator.clipboard.writeText(shareUrl); showToast('Link Auto-Sync Berhasil Disalin!');
                    }} className="w-full py-2 bg-indigo-600 text-white font-bold rounded-xl flex items-center justify-center space-x-1.5 shadow-sm"><Share2 className="w-4 h-4" /><span>Salin Link Web Auto-Sync Panitia</span></button>
                  </div>
                  <form onSubmit={(e) => {
                    e.preventDefault();
                    localStorage.setItem('ld_bazaar_sheet_webhook', sheetWebhookUrl);
                    localStorage.setItem('ld_bazaar_admin_phone', adminPhone);
                    localStorage.setItem('ld_bazaar_admin_auth', JSON.stringify(adminAuth));
                    syncPushToCloud();
                  }} className="space-y-3">
                    <div><label className="block font-bold mb-1">Google Sheets Webhook URL</label><input type="url" value={sheetWebhookUrl} onChange={(e) => setSheetWebhookUrl(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border rounded-xl font-mono text-xs" /></div>
                    <div><label className="block font-bold mb-1">No. WA Admin Utama</label><input type="text" value={adminPhone} onChange={(e) => setAdminPhone(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border rounded-xl" /></div>
                    <div><label className="block font-bold mb-1">Username Admin Login</label><input type="text" value={adminAuth.username} onChange={(e) => setAdminAuth({ ...adminAuth, username: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border rounded-xl" /></div>
                    <div><label className="block font-bold mb-1">Password Admin Login</label><input type="password" value={adminAuth.password} onChange={(e) => setAdminAuth({ ...adminAuth, password: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border rounded-xl" /></div>
                    <button type="submit" disabled={isCloudSyncing} className="w-full py-3 bg-emerald-600 text-white font-bold rounded-xl shadow-md flex justify-center items-center space-x-2 transition-all"><Save className="w-4 h-4" /><span>Simpan Pengaturan</span></button>
                  </form>
                </div>
              )}
            </div>
          )}
        </main>
      )}

      {}
      {productModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl relative text-xs space-y-3">
            <button onClick={() => setProductModal({isOpen: false, item: null})} className="absolute top-4 right-4 text-slate-400"><X className="w-5 h-5" /></button>
            <h3 className="text-base font-bold text-slate-900">{productModal.item ? 'Edit Produk' : 'Setup Produk Baru'}</h3>
            <form onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.target);
              const formObj = Object.fromEntries(fd.entries());
              formObj.priceOwner = Number(formObj.priceOwner);
              formObj.priceOrganizer = Number(formObj.priceOrganizer);
              formObj.available = true;
              
              // Prevent overriding image if an upload was just converted to base64 in state
              const finalImageUrl = productModal.item?.tempImageUrl || formObj.imageUrl || '';
              delete formObj.imageUrlInput; // exclude file input from saving
              formObj.imageUrl = finalImageUrl;

              let updated;
              if (productModal.item && !productModal.item.isNew) {
                updated = products.map((p) => (p.id === productModal.item.id ? { ...p, ...formObj } : p));
              } else {
                updated = [...products, { ...formObj, id: 'p-' + Date.now() }];
              }
              setProducts(updated); syncPushToCloud({ products: updated }); setProductModal({ isOpen: false, item: null });
            }} className="space-y-3 max-h-[80vh] overflow-y-auto pr-1">
              <div><label className="block font-semibold mb-1">Nama Produk</label><input type="text" name="name" required defaultValue={productModal.item?.name || ''} className="w-full px-3 py-2 bg-slate-50 border rounded-xl" /></div>
              <div><label className="block font-semibold mb-1">Stand / Tenant</label><select name="tenantId" defaultValue={productModal.item?.tenantId || tenants[0]?.id || ''} className="w-full px-3 py-2 bg-slate-50 border rounded-xl">{tenants.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block font-semibold mb-1">Harga Owner (Rp)</label><input type="number" name="priceOwner" required defaultValue={productModal.item?.priceOwner || 0} className="w-full px-3 py-2 bg-slate-50 border rounded-xl" /></div>
                <div><label className="block font-semibold mb-1">Margin Panitia (Rp)</label><input type="number" name="priceOrganizer" required defaultValue={productModal.item?.priceOrganizer || 0} className="w-full px-3 py-2 bg-slate-50 border rounded-xl" /></div>
              </div>
              
              <div className="border border-dashed border-slate-300 p-3 rounded-xl bg-slate-50 space-y-2">
                <label className="block font-semibold mb-1">Upload Foto / URL Foto</label>
                {productModal.item?.tempImageUrl || productModal.item?.imageUrl ? (
                  <div className="relative w-20 h-20 rounded-lg overflow-hidden border border-slate-200">
                    <img src={productModal.item?.tempImageUrl || productModal.item?.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                    <button type="button" onClick={() => setProductModal({ ...productModal, item: { ...productModal.item, tempImageUrl: '', imageUrl: '' } })} className="absolute top-1 right-1 bg-red-500 text-white rounded p-0.5"><X className="w-3 h-3"/></button>
                  </div>
                ) : (
                  <>
                    <input type="text" name="imageUrl" placeholder="Paste link URL gambar (opsional)" className="w-full px-3 py-2 bg-white border rounded-xl text-xs mb-2" />
                    <div className="flex items-center space-x-2">
                      <span className="text-slate-400 font-bold mx-2">ATAU</span>
                      <label className="flex-1 px-3 py-2 bg-white border border-slate-300 rounded-xl text-center cursor-pointer hover:bg-slate-100 flex items-center justify-center space-x-1 font-bold text-slate-600">
                        <Upload className="w-4 h-4"/> <span>Pilih dari Galeri</span>
                        <input type="file" name="imageUrlInput" accept="image/*" className="hidden" onChange={(e) => {
                          const file = e.target.files[0];
                          if (!file) return;
                          const reader = new FileReader();
                          reader.onload = (event) => {
                            const img = new Image();
                            img.onload = () => {
                              const canvas = document.createElement('canvas');
                              const MAX_WIDTH = 500;
                              const scaleSize = MAX_WIDTH / img.width;
                              canvas.width = MAX_WIDTH;
                              canvas.height = img.height * scaleSize;
                              const ctx = canvas.getContext('2d');
                              ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                              const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
                              setProductModal({ ...productModal, item: { ...productModal.item, tempImageUrl: dataUrl, isNew: !productModal.item } });
                            };
                            img.src = event.target.result;
                          };
                          reader.readAsDataURL(file);
                        }} />
                      </label>
                    </div>
                  </>
                )}
              </div>
              <button type="submit" className="w-full py-2.5 bg-indigo-600 text-white font-bold rounded-xl shadow-md">Simpan Produk</button>
            </form>
          </div>
        </div>
      )}

      {}
      {tenantModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl relative text-xs space-y-3">
            <button onClick={() => setTenantModal({isOpen: false, item: null})} className="absolute top-4 right-4 text-slate-400"><X className="w-5 h-5" /></button>
            <h3 className="text-base font-bold">{tenantModal.item ? 'Edit Stand' : 'Tambah Stand Baru'}</h3>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formObj = Object.fromEntries(new FormData(e.target).entries());
              let updated = tenantModal.item ? tenants.map(t => t.id === tenantModal.item.id ? { ...t, ...formObj } : t) : [...tenants, { ...formObj, id: 't-' + Date.now() }];
              setTenants(updated); syncPushToCloud({ tenants: updated }); setTenantModal({isOpen:false, item:null});
            }} className="space-y-3">
              <div><label className="block font-semibold mb-1">Nama Stand</label><input type="text" name="name" required defaultValue={tenantModal.item?.name || ''} className="w-full px-3 py-2 bg-slate-50 border rounded-xl" /></div>
              <div><label className="block font-semibold mb-1">Nama Pemilik</label><input type="text" name="owner" required defaultValue={tenantModal.item?.owner || ''} className="w-full px-3 py-2 bg-slate-50 border rounded-xl" /></div>
              <div><label className="block font-semibold mb-1 text-emerald-700">No WhatsApp</label><input type="text" name="phone" required defaultValue={tenantModal.item?.phone || ''} className="w-full px-3 py-2 bg-slate-50 border border-emerald-200 rounded-xl" /></div>
              <button type="submit" className="w-full py-2.5 bg-indigo-600 text-white font-bold rounded-xl">Simpan Stand</button>
            </form>
          </div>
        </div>
      )}

      {batchModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl relative text-xs space-y-3">
            <button onClick={() => setBatchModal({isOpen: false, item: null})} className="absolute top-4 right-4 text-slate-400"><X className="w-5 h-5" /></button>
            <h3 className="text-base font-bold">{batchModal.item ? 'Edit Batch' : 'Buat Batch Baru'}</h3>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formObj = Object.fromEntries(new FormData(e.target).entries());
              let updated = batchModal.item ? batches.map(b => b.id === batchModal.item.id ? { ...b, ...formObj } : b) : [...batches, { ...formObj, id: 'b-' + Date.now(), isActive: false }];
              setBatches(updated); syncPushToCloud({ batches: updated }); setBatchModal({isOpen:false, item:null});
            }} className="space-y-3">
              <div><label className="block font-semibold mb-1">Nama Batch</label><input type="text" name="name" required defaultValue={batchModal.item?.name || ''} className="w-full px-3 py-2 bg-slate-50 border rounded-xl" /></div>
              <div><label className="block font-semibold mb-1">Tanggal Mulai Pemesanan</label><input type="date" name="startDate" required defaultValue={batchModal.item?.startDate || new Date().toISOString().slice(0, 10)} className="w-full px-3 py-2 bg-slate-50 border rounded-xl" /></div>
              <div><label className="block font-semibold mb-1">Tanggal Selesai Pemesanan</label><input type="date" name="endDate" required defaultValue={batchModal.item?.endDate || new Date().toISOString().slice(0, 10)} className="w-full px-3 py-2 bg-slate-50 border rounded-xl" /></div>
              <div><label className="block font-semibold mb-1 text-emerald-700">Tanggal Distribusi / Ready (Opsional)</label><input type="date" name="readyDate" defaultValue={batchModal.item?.readyDate || ''} className="w-full px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-xl" /></div>
              <button type="submit" className="w-full py-2.5 bg-indigo-600 text-white font-bold rounded-xl">Simpan Batch</button>
            </form>
          </div>
        </div>
      )}

      {classModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl relative text-xs space-y-3">
            <button onClick={() => setClassModal({isOpen: false, item: null})} className="absolute top-4 right-4 text-slate-400"><X className="w-5 h-5" /></button>
            <h3 className="text-base font-bold">{classModal.item ? 'Edit Kelas' : 'Tambah Kelas Baru'}</h3>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formObj = Object.fromEntries(new FormData(e.target).entries());
              let updated = classModal.item ? classesList.map(c => c.id === classModal.item.id ? { ...c, ...formObj } : c) : [...classesList, { ...formObj, id: 'c-' + Date.now() }];
              setClassesList(updated); syncPushToCloud({ classes: updated }); setClassModal({isOpen:false, item:null});
            }} className="space-y-3">
              <div><label className="block font-semibold mb-1">Nama Kelas</label><input type="text" name="name" required defaultValue={classModal.item?.name || ''} className="w-full px-3 py-2 bg-slate-50 border rounded-xl" /></div>
              <div><label className="block font-semibold mb-1">No. WA PIC Kelas</label><input type="text" name="phone" required defaultValue={classModal.item?.phone || ''} className="w-full px-3 py-2 bg-slate-50 border rounded-xl" /></div>
              <button type="submit" className="w-full py-2.5 bg-indigo-600 text-white font-bold rounded-xl">Simpan Kelas</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}