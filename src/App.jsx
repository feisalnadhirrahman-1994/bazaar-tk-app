import React, { useState, useEffect, useMemo } from 'react';
import { 
  ShoppingBag, 
  ShoppingCart, 
  Plus, 
  Trash2, 
  Edit3, 
  CheckCircle2, 
  MessageCircle, 
  Store, 
  DollarSign, 
  Settings, 
  Search, 
  FileSpreadsheet, 
  X, 
  Send,
  User,
  School,
  PieChart,
  Calendar,
  Clock,
  Lock,
  Unlock,
  AlertCircle,
  Phone,
  Image as ImageIcon,
  Upload,
  Key,
  ShieldCheck,
  Ban,
  Filter,
  Users,
  Layers,
  Copy,
  Printer,
  Check,
  Save,
  Building,
  Download,
  FileText,
  Share2
} from 'lucide-react';

const INITIAL_TENANTS = [
  { id: 't1', name: 'Stand Snack & Es Ceria', owner: 'Mama Budi (TK A1)', phone: '6281234567891' },
  { id: 't2', name: 'Stand Dapur Bu Guru', owner: 'Ibu Ningsih', phone: '6281234567892' },
  { id: 't3', name: 'Souvenir & Mainan Edukasi', owner: 'Pak Hendra', phone: '6281234567893' }
];

const INITIAL_PRODUCTS = [
  { 
    id: 'p1', 
    tenantId: 't1', 
    name: 'Es Lilin Buah Segar', 
    priceOwner: 8000, 
    priceOrganizer: 2000, 
    description: 'Es lilin dari buah asli tanpa pemanis buatan',
    category: 'Minuman',
    imageUrl: 'https://images.unsplash.com/photo-1505252585461-04db1eb84625?auto=format&fit=crop&w=400&q=80',
    available: true
  },
  { 
    id: 'p2', 
    tenantId: 't1', 
    name: 'Donat Toping Cokelat & Keju', 
    priceOwner: 12000, 
    priceOrganizer: 3000, 
    description: '1 porsi isi 2 donat empuk',
    category: 'Makanan',
    imageUrl: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=400&q=80',
    available: true
  },
  { 
    id: 'p3', 
    tenantId: 't2', 
    name: 'Nasi Bento Chicken Katsu', 
    priceOwner: 20000, 
    priceOrganizer: 5000, 
    description: 'Nasi bento dengan katsu, sosis, dan sayur segar',
    category: 'Makanan',
    imageUrl: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=400&q=80',
    available: true
  },
  { 
    id: 'p4', 
    tenantId: 't2', 
    name: 'Sosis Ayam Bakar Jumbo', 
    priceOwner: 10000, 
    priceOrganizer: 2500, 
    description: 'Sosis ayam bakar dengan saus keju & meises',
    category: 'Makanan',
    imageUrl: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=400&q=80',
    available: true
  },
  { 
    id: 'p5', 
    tenantId: 't3', 
    name: 'Sticker Custom Nama Anak', 
    priceOwner: 15000, 
    priceOrganizer: 5000, 
    description: '1 lembar sticker anti air nama anak',
    category: 'Souvenir',
    imageUrl: 'https://images.unsplash.com/photo-1572375992501-4b0892d50c69?auto=format&fit=crop&w=400&q=80',
    available: true
  }
];

const INITIAL_BATCHES = [
  {
    id: 'b1',
    name: 'Batch 1 - Pre-Order Awal',
    startDate: '2026-08-01',
    endDate: '2026-08-15',
    isActive: true,
    description: 'Gelombang pertama pemesanan makanan bazaar'
  },
  {
    id: 'b2',
    name: 'Batch 2 - Pre-Order Susulan',
    startDate: '2026-08-16',
    endDate: '2026-08-25',
    isActive: false,
    description: 'Gelombang kedua penambahan pesanan'
  }
];

const INITIAL_CLASSES = [
  { id: 'c1', name: 'Little Owl', phone: '628123456781' },
  { id: 'c2', name: 'Playgroup / KB', phone: '628123456782' },
  { id: 'c3', name: 'TK A1', phone: '628123456783' },
  { id: 'c4', name: 'TK A2', phone: '628123456784' },
  { id: 'c5', name: 'TK B1', phone: '628123456785' },
  { id: 'c6', name: 'TK B2', phone: '628123456786' },
  { id: 'c7', name: 'Umum / Tamu', phone: '628123456780' }
];

const INITIAL_ORDERS = [
  {
    orderId: 'BZ-101101',
    batchId: 'b1',
    date: '2026-08-05T09:30:00.000Z',
    customer: { namaAnak: 'Kafaa', kelas: 'TK A1', namaOrtu: 'Mama Kafaa', catatan: '' },
    items: [
      { id: 'p4', name: 'Sosis Ayam Bakar Jumbo', tenantId: 't2', tenantName: 'Stand Dapur Bu Guru', priceOwner: 10000, priceOrganizer: 2500, sellingPrice: 12500, qty: 1, subtotal: 12500 },
      { id: 'p1', name: 'Es Lilin Buah Segar', tenantId: 't1', tenantName: 'Stand Snack & Es Ceria', priceOwner: 8000, priceOrganizer: 2000, sellingPrice: 10000, qty: 1, subtotal: 10000 }
    ],
    totalAmount: 22500,
    totalOwnerShare: 18000,
    totalOrganizerShare: 4500,
    status: 'Paid'
  },
  {
    orderId: 'BZ-101102',
    batchId: 'b1',
    date: '2026-08-06T11:15:00.000Z',
    customer: { namaAnak: 'Reza', kelas: 'Little Owl', namaOrtu: 'Mama Reza', catatan: 'Tanpa pedas' },
    items: [
      { id: 'p4', name: 'Sosis Ayam Bakar Jumbo', tenantId: 't2', tenantName: 'Stand Dapur Bu Guru', priceOwner: 10000, priceOrganizer: 2500, sellingPrice: 12500, qty: 2, subtotal: 25000 },
      { id: 'p2', name: 'Donat Toping Cokelat & Keju', tenantId: 't1', tenantName: 'Stand Snack & Es Ceria', priceOwner: 12000, priceOrganizer: 3000, sellingPrice: 15000, qty: 2, subtotal: 30000 }
    ],
    totalAmount: 55000,
    totalOwnerShare: 44000,
    totalOrganizerShare: 11000,
    status: 'Paid'
  }
];

export default function App() {
  const [activeTab, setActiveTab] = useState('shop');
  const [adminSubTab, setAdminSubTab] = useState('batch_reports');
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  
  // Login Form State
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState('');

  // Toast Notification State
  const [toastMessage, setToastMessage] = useState('');

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  // Persistent Auth Credentials
  const [adminAuth, setAdminAuth] = useState(() => {
    const saved = localStorage.getItem('ld_bazaar_admin_auth');
    return saved ? JSON.parse(saved) : { username: 'admin', password: 'admin123' };
  });

  // Persistent Settings
  const [adminPhone, setAdminPhone] = useState(() => {
    return localStorage.getItem('ld_bazaar_admin_phone') || '628123456780';
  });

  const [sheetWebhookUrl, setSheetWebhookUrl] = useState(() => {
    return localStorage.getItem('ld_bazaar_sheet_webhook') || '';
  });

  // Dynamic Custom Classes List
  const [classesList, setClassesList] = useState(() => {
    const saved = localStorage.getItem('ld_bazaar_classes');
    return saved ? JSON.parse(saved) : INITIAL_CLASSES;
  });

  // Persistent Core Data State
  const [tenants, setTenants] = useState(() => {
    const saved = localStorage.getItem('ld_bazaar_tenants');
    return saved ? JSON.parse(saved) : INITIAL_TENANTS;
  });

  const [products, setProducts] = useState(() => {
    const saved = localStorage.getItem('ld_bazaar_products');
    return saved ? JSON.parse(saved) : INITIAL_PRODUCTS;
  });

  const [batches, setBatches] = useState(() => {
    const saved = localStorage.getItem('ld_bazaar_batches');
    return saved ? JSON.parse(saved) : INITIAL_BATCHES;
  });

  const [orders, setOrders] = useState(() => {
    const saved = localStorage.getItem('ld_bazaar_orders');
    return saved ? JSON.parse(saved) : INITIAL_ORDERS;
  });

  // State Keranjang & Checkout
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

  // Modals Admin State
  const [productModal, setProductModal] = useState({ isOpen: false, item: null });
  const [tenantModal, setTenantModal] = useState({ isOpen: false, item: null });
  const [batchModal, setBatchModal] = useState({ isOpen: false, item: null });
  const [classModal, setClassModal] = useState({ isOpen: false, item: null });

  // Config Import / Export Modal
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importConfigJson, setImportConfigJson] = useState('');

  // Laporan Filters
  const [reportSelectedBatchId, setReportSelectedBatchId] = useState('b1');
  const [reportSelectedStatus, setReportSelectedStatus] = useState('Paid');

  useEffect(() => { localStorage.setItem('ld_bazaar_tenants', JSON.stringify(tenants)); }, [tenants]);
  useEffect(() => { localStorage.setItem('ld_bazaar_products', JSON.stringify(products)); }, [products]);
  useEffect(() => { localStorage.setItem('ld_bazaar_batches', JSON.stringify(batches)); }, [batches]);
  useEffect(() => { localStorage.setItem('ld_bazaar_orders', JSON.stringify(orders)); }, [orders]);
  useEffect(() => { localStorage.setItem('ld_bazaar_classes', JSON.stringify(classesList)); }, [classesList]);
  useEffect(() => { localStorage.setItem('ld_bazaar_admin_auth', JSON.stringify(adminAuth)); }, [adminAuth]);
  useEffect(() => { localStorage.setItem('ld_bazaar_admin_phone', adminPhone); }, [adminPhone]);
  useEffect(() => { localStorage.setItem('ld_bazaar_sheet_webhook', sheetWebhookUrl); }, [sheetWebhookUrl]);

  // Keep checkout default class valid
  useEffect(() => {
    if (classesList.length > 0 && !classesList.some(c => c.name === checkoutData.kelas)) {
      setCheckoutData(prev => ({ ...prev, kelas: classesList[0].name }));
    }
  }, [classesList]);

  const activeBatch = useMemo(() => {
    const explicitActive = batches.find((b) => b.isActive);
    if (explicitActive) return explicitActive;
    const todayStr = new Date().toISOString().slice(0, 10);
    return batches.find((b) => todayStr >= b.startDate && todayStr <= b.endDate) || null;
  }, [batches]);

  const orderStatusInfo = useMemo(() => {
    if (!activeBatch) {
      return { isOpen: false, reason: 'Saat ini belum ada Periode Batch Pemesanan yang dibuka oleh Admin.' };
    }
    const todayStr = new Date().toISOString().slice(0, 10);
    if (todayStr < activeBatch.startDate) {
      return { isOpen: false, reason: `Pemesanan ${activeBatch.name} baru dibuka pada ${activeBatch.startDate}.` };
    }
    if (todayStr > activeBatch.endDate) {
      return { isOpen: false, reason: `Pemesanan ${activeBatch.name} telah berakhir pada ${activeBatch.endDate}.` };
    }
    return { isOpen: true, reason: `Sedang Dibuka: ${activeBatch.name}` };
  }, [activeBatch]);

  const formatRupiah = (num) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num || 0);
  };

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
    if (!orderStatusInfo.isOpen) return;
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) => item.id === product.id ? { ...item, qty: item.qty + 1 } : item);
      }
      return [...prev, { ...product, qty: 1 }];
    });
  };

  const updateCartQty = (productId, delta) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.id === productId) {
            const newQty = item.qty + delta;
            return newQty > 0 ? { ...item, qty: newQty } : null;
          }
          return item;
        })
        .filter(Boolean)
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

  const handleCheckoutSubmit = async (e) => {
    e.preventDefault();
    if (!orderStatusInfo.isOpen || !activeBatch) return alert(orderStatusInfo.reason);
    if (!checkoutData.namaAnak.trim() || cart.length === 0) return;

    setIsSubmitting(true);
    const newOrderId = 'BZ-' + Math.floor(100000 + Math.random() * 900000);
    const orderDate = new Date().toISOString();

    const orderPayload = {
      orderId: newOrderId,
      batchId: activeBatch.id,
      date: orderDate,
      customer: { ...checkoutData },
      items: cart.map((item) => ({
        id: item.id,
        name: item.name,
        tenantId: item.tenantId,
        tenantName: tenants.find((t) => t.id === item.tenantId)?.name || 'Tenant',
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

    // Send payload to Google Sheets Webhook if available
    if (sheetWebhookUrl) {
      try {
        fetch(sheetWebhookUrl, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...orderPayload,
            formattedItemsText: orderPayload.items.map((i) => `${i.name} (x${i.qty})`).join(', ')
          })
        });
      } catch (err) {
        console.warn('Webhook error:', err);
      }
    }

    // Find class PIC phone number
    const targetClassObj = classesList.find((c) => c.name === checkoutData.kelas);
    const picPhoneForClass = targetClassObj?.phone || adminPhone;
    let cleanPhone = picPhoneForClass.replace(/[^0-9]/g, '');
    if (cleanPhone.startsWith('0')) cleanPhone = '62' + cleanPhone.slice(1);

    let waText = `*PEMESANAN BAZAAR DANUS PTA LITTLE DARBI (${activeBatch.name})*\n`;
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
    waText += `Halo PIC Kelas ${checkoutData.kelas}, mohon instruksi info rekening pembayaran. Terima kasih! 🙏`;

    const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(waText)}`;

    setCart([]);
    setIsCheckoutModalOpen(false);
    setIsCartOpen(false);
    setCheckoutData({ namaAnak: '', kelas: classesList[0]?.name || 'TK A1', namaOrtu: '', catatan: '' });
    setIsSubmitting(false);

    window.open(waUrl, '_blank');
  };

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchTenant = selectedTenantFilter === 'all' || p.tenantId === selectedTenantFilter;
      const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchTenant && matchSearch && p.available;
    });
  }, [products, selectedTenantFilter, searchQuery]);

  const batchReportData = useMemo(() => {
    let filtered = orders.filter((o) => o.batchId === reportSelectedBatchId);
    if (reportSelectedStatus !== 'ALL') {
      filtered = filtered.filter((o) => o.status === reportSelectedStatus);
    }

    const tenantReports = tenants.map((tenant) => {
      const customerOrdersDetail = [];
      const itemTotalsMap = {};
      let tenantTotalGross = 0;
      let tenantTotalOwnerShare = 0;

      filtered.forEach((ord) => {
        const tenantItemsInOrder = ord.items.filter((it) => it.tenantId === tenant.id);
        if (tenantItemsInOrder.length > 0) {
          customerOrdersDetail.push({
            orderId: ord.orderId,
            namaAnak: ord.customer.namaAnak,
            kelas: ord.customer.kelas,
            namaOrtu: ord.customer.namaOrtu || '-',
            catatan: ord.customer.catatan || '',
            items: tenantItemsInOrder
          });

          tenantItemsInOrder.forEach((it) => {
            if (!itemTotalsMap[it.name]) {
              itemTotalsMap[it.name] = 0;
            }
            itemTotalsMap[it.name] += it.qty;

            tenantTotalGross += it.subtotal;
            tenantTotalOwnerShare += it.priceOwner * it.qty;
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
        tenantTotalOwnerShare
      };
    });

    return tenantReports;
  }, [orders, reportSelectedBatchId, reportSelectedStatus, tenants]);

  const sendDirectWAToTenant = (tenantReport) => {
    if (!tenantReport.tenantPhone) {
      alert(`Nomor WhatsApp untuk ${tenantReport.tenantName} belum diisi. Silakan edit nomor HP di menu 'Kelola Stand / Tenant'.`);
      return;
    }

    let cleanPhone = tenantReport.tenantPhone.replace(/[^0-9]/g, '');
    if (cleanPhone.startsWith('0')) cleanPhone = '62' + cleanPhone.slice(1);

    const currentBatch = batches.find((b) => b.id === reportSelectedBatchId);
    let text = `*REKAP PESANAN BAZAAR DANUS PTA LITTLE DARBI - ${tenantReport.tenantName.toUpperCase()}*\n`;
    text += `*Periode:* ${currentBatch?.name || '-'}\n`;
    text += `*Filter Status:* ${reportSelectedStatus}\n`;
    text += `-----------------------------------\n\n`;

    text += `*📌 RINCIAN PESANAN PEMBELI:*\n`;
    if (tenantReport.customerOrdersDetail.length === 0) {
      text += `(Belum ada pesanan masuk)\n`;
    } else {
      tenantReport.customerOrdersDetail.forEach((cust, idx) => {
        text += `${idx + 1}. *${cust.namaAnak}* (${cust.kelas})\n`;
        if (cust.namaOrtu !== '-') text += `   Ortu: ${cust.namaOrtu}\n`;
        cust.items.forEach((it) => {
          text += `   - ${it.name} (x${it.qty})\n`;
        });
        if (cust.catatan) text += `   Catatan: _${cust.catatan}_\n`;
      });
    }

    text += `\n-----------------------------------\n`;
    text += `*📦 SUMMARY PRODUKSI (RINGKASAN DAPUR):*\n`;
    const itemNames = Object.keys(tenantReport.itemTotalsMap);
    if (itemNames.length === 0) {
      text += `(Kosong)\n`;
    } else {
      itemNames.forEach((name) => {
        text += `• *${name}*: ${tenantReport.itemTotalsMap[name]} pcs\n`;
      });
    }

    text += `-----------------------------------\n`;
    text += `*TOTAL HAK VENDOR: ${formatRupiah(tenantReport.tenantTotalOwnerShare)}*\n`;
    text += `-----------------------------------\n`;
    text += `Mohon dapat disiapkan sesuai ringkasan produksi di atas. Terima kasih! 🙏`;

    const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
    window.open(waUrl, '_blank');
  };

  const printTenantPDF = (tenantReport) => {
    const currentBatch = batches.find((b) => b.id === reportSelectedBatchId);
    const itemNames = Object.keys(tenantReport.itemTotalsMap);

    const printWindow = window.open('', '_blank');
    if (!printWindow) return alert('Popup terblokir oleh browser. Izinkan popup untuk mencetak PDF.');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Rekap Vendor - ${tenantReport.tenantName}</title>
        <style>
          body { font-family: 'Helvetica Neue', Arial, sans-serif; padding: 25px; color: #1e293b; line-height: 1.4; }
          .header { text-align: center; border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 20px; }
          .header h1 { margin: 0; font-size: 18px; color: #0f172a; text-transform: uppercase; }
          .header p { margin: 3px 0; font-size: 12px; color: #64748b; }
          .meta-grid { display: flex; justify-content: space-between; background: #f8fafc; border: 1px solid #e2e8f0; padding: 12px; border-radius: 8px; margin-bottom: 20px; font-size: 12px; }
          .meta-grid div strong { color: #0f172a; }
          .section-title { font-size: 13px; font-weight: bold; text-transform: uppercase; color: #334155; margin-top: 20px; margin-bottom: 8px; border-left: 4px solid #4f46e5; padding-left: 8px; }
          table { width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 15px; }
          th, td { border: 1px solid #cbd5e1; padding: 8px; text-align: left; }
          th { background: #f1f5f9; color: #334155; font-size: 11px; text-transform: uppercase; }
          .total-box { background: #f0fdf4; border: 1px solid #bbf7d0; padding: 12px; border-radius: 8px; font-size: 13px; display: flex; justify-content: space-between; font-weight: bold; color: #166534; margin-top: 15px; }
          .signatures { display: flex; justify-content: space-between; margin-top: 50px; text-align: center; font-size: 12px; }
          .sig-space { height: 60px; }
          @media print {
            body { padding: 0; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>LAPORAN REKAPITULASI PRODUKSI VENDOR</h1>
          <p>BAZAAR DANUS PTA LITTLE DARBI</p>
        </div>

        <div class="meta-grid">
          <div>
            <strong>Nama Stand:</strong> ${tenantReport.tenantName}<br>
            <strong>Pemilik Stand:</strong> ${tenantReport.tenantOwner} (${tenantReport.tenantPhone || '-'})
          </div>
          <div style="text-align: right;">
            <strong>Periode Batch:</strong> ${currentBatch?.name || '-'}<br>
            <strong>Filter Status:</strong> ${reportSelectedStatus} | <strong>Tanggal Cetak:</strong> ${new Date().toLocaleDateString('id-ID')}
          </div>
        </div>

        <div class="section-title">1. RINGKASAN TOTAL PRODUKSI (SUMMARY KITCHEN)</div>
        <table>
          <thead>
            <tr>
              <th style="width: 40px;">No</th>
              <th>Nama Produk / Menu</th>
              <th style="text-align: center; width: 120px;">Total Qty Terjual</th>
            </tr>
          </thead>
          <tbody>
            ${
              itemNames.length === 0
                ? '<tr><td colspan="3" style="text-align:center;">Belum ada item dipesan</td></tr>'
                : itemNames.map((name, i) => `
                    <tr>
                      <td>${i + 1}</td>
                      <td><strong>${name}</strong></td>
                      <td style="text-align: center; font-weight: bold;">${tenantReport.itemTotalsMap[name]} Pcs</td>
                    </tr>
                  `).join('')
            }
          </tbody>
        </table>

        <div class="section-title">2. RINCIAN PEMESANAN PER ANAK / KELAS</div>
        <table>
          <thead>
            <tr>
              <th style="width: 30px;">No</th>
              <th>Nama Anak & Kelas</th>
              <th>Ortu / Kontak</th>
              <th>Menu Dipesan</th>
              <th>Catatan Khusus</th>
            </tr>
          </thead>
          <tbody>
            ${
              tenantReport.customerOrdersDetail.length === 0
                ? '<tr><td colspan="5" style="text-align:center;">Belum ada transaksi</td></tr>'
                : tenantReport.customerOrdersDetail.map((cust, idx) => `
                    <tr>
                      <td>${idx + 1}</td>
                      <td><strong>${cust.namaAnak}</strong><br><small style="color:#64748b">${cust.kelas}</small></td>
                      <td>${cust.namaOrtu}</td>
                      <td>${cust.items.map(it => `${it.name} (x${it.qty})`).join('<br>')}</td>
                      <td><em>${cust.catatan || '-'}</em></td>
                    </tr>
                  `).join('')
            }
          </tbody>
        </table>

        <div class="total-box">
          <span>TOTAL HAK PEMBAYARAN VENDOR:</span>
          <span>${formatRupiah(tenantReport.tenantTotalOwnerShare)}</span>
        </div>

        <div class="signatures">
          <div>
            <p>Panitia Bazaar PTA,</p>
            <div class="sig-space"></div>
            <p>_______________________</p>
          </div>
          <div>
            <p>Pemilik Stand / Vendor,</p>
            <div class="sig-space"></div>
            <p><strong>(${tenantReport.tenantOwner})</strong></p>
          </div>
        </div>

        <script>
          window.onload = function() {
            window.print();
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const exportConfigJSON = () => {
    const configData = {
      adminAuth,
      adminPhone,
      sheetWebhookUrl,
      classesList,
      tenants,
      products,
      batches
    };
    const jsonStr = JSON.stringify(configData, null, 2);
    navigator.clipboard.writeText(jsonStr);
    showToast('Kode Konfigurasi telah disalin ke Clipboard! Siap Ditempel.');
  };

  const handleImportConfig = (e) => {
    e.preventDefault();
    try {
      const parsed = JSON.parse(importConfigJson);
      if (parsed.adminAuth) setAdminAuth(parsed.adminAuth);
      if (parsed.adminPhone) setAdminPhone(parsed.adminPhone);
      if (parsed.sheetWebhookUrl !== undefined) setSheetWebhookUrl(parsed.sheetWebhookUrl);
      if (parsed.classesList) setClassesList(parsed.classesList);
      if (parsed.tenants) setTenants(parsed.tenants);
      if (parsed.products) setProducts(parsed.products);
      if (parsed.batches) setBatches(parsed.batches);

      showToast('Konfigurasi & Data Berhasil Diimport!');
      setIsImportModalOpen(false);
      setImportConfigJson('');
    } catch (err) {
      alert('Format JSON Konfigurasi tidak valid! Pastikan menyalin teks kode konfigurasi yang benar.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans pb-24 relative">
      {/* Toast Banner Notification */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-2xl text-xs font-bold flex items-center space-x-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* HEADER UTAMA */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md shadow-sm border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-amber-500 text-white p-2 rounded-xl shadow-md">
              <School className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-extrabold text-base sm:text-lg leading-tight text-slate-900">
                Bazaar DANUS PTA Little Darbi
              </h1>
              <p className="text-xs text-slate-500">Pemesanan Online Stand & Produk</p>
            </div>
          </div>

          <div className="flex items-center bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('shop')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all ${
                activeTab === 'shop' ? 'bg-white text-amber-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Menu Pembeli</span>
            </button>
            <button
              onClick={() => setActiveTab('admin')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all ${
                activeTab === 'admin' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>Panel Admin</span>
            </button>
          </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* TAB 1: CATALOG CUSTOMER */}
      {/* ========================================================================= */}
      {activeTab === 'shop' && (
        <main className="max-w-5xl mx-auto px-4 pt-6">
          <div className="mb-6">
            {orderStatusInfo.isOpen && activeBatch ? (
              <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-2xl p-4 sm:p-5 shadow-md flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="bg-white/20 text-white text-[10px] uppercase font-extrabold tracking-wider px-2.5 py-0.5 rounded-full flex items-center">
                      <Layers className="w-3 h-3 mr-1" /> {activeBatch.name}
                    </span>
                    <span className="text-xs text-amber-100">
                      Batas: <strong>{formatIndoDate(activeBatch.startDate)}</strong> s/d <strong>{formatIndoDate(activeBatch.endDate)}</strong>
                    </span>
                  </div>
                  <h2 className="text-lg sm:text-xl font-black mt-1">Pesan Makanan & Souvenir Bazaar DANUS</h2>
                  <p className="text-amber-100 text-xs">Pesanan akan diproses sesuai periode {activeBatch.name}.</p>
                </div>
              </div>
            ) : (
              <div className="bg-red-500 text-white rounded-2xl p-4 sm:p-5 shadow-md flex items-center space-x-3">
                <div className="bg-white/20 p-2.5 rounded-xl">
                  <Lock className="w-6 h-6 text-white" />
                </div>
                <div>
                  <span className="bg-white/20 text-white text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full">
                    Pemesanan Ditutup
                  </span>
                  <h2 className="text-base sm:text-lg font-bold mt-1">Sistem Pemesanan Sedang Ditutup!</h2>
                  <p className="text-red-100 text-xs">{orderStatusInfo.reason}</p>
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Cari makanan, minuman, souvenir..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 shadow-sm"
              />
            </div>

            <div className="flex items-center space-x-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
              <button
                onClick={() => setSelectedTenantFilter('all')}
                className={`px-3.5 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                  selectedTenantFilter === 'all'
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                Semua Stand ({products.length})
              </button>
              {tenants.map((tenant) => (
                <button
                  key={tenant.id}
                  onClick={() => setSelectedTenantFilter(tenant.id)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                    selectedTenantFilter === tenant.id
                      ? 'bg-amber-600 text-white shadow-sm'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {tenant.name}
                </button>
              ))}
            </div>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-200">
              <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 font-medium text-sm">Belum ada produk yang cocok.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {filteredProducts.map((prod) => {
                const tenant = tenants.find((t) => t.id === prod.tenantId);
                const sellingPrice = prod.priceOwner + prod.priceOrganizer;
                const inCart = cart.find((item) => item.id === prod.id);

                return (
                  <div key={prod.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between overflow-hidden">
                    <div className="h-40 w-full bg-slate-100 relative overflow-hidden">
                      {prod.imageUrl ? (
                        <img src={prod.imageUrl} alt={prod.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-300">
                          <ImageIcon className="w-10 h-10" />
                        </div>
                      )}
                      <span className="absolute top-2 left-2 text-[10px] font-bold bg-white/95 text-slate-800 px-2 py-0.5 rounded-md shadow-xs">
                        {tenant ? tenant.name : 'Stand Bazaar'}
                      </span>
                    </div>

                    <div className="p-4 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-bold text-slate-900 text-base">{prod.name}</h3>
                          <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded font-medium">
                            {prod.category}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 line-clamp-2">{prod.description}</p>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] text-slate-400 block">Harga Jual</span>
                          <span className="text-base font-extrabold text-amber-600">{formatRupiah(sellingPrice)}</span>
                        </div>

                        {orderStatusInfo.isOpen ? (
                          inCart ? (
                            <div className="flex items-center space-x-2 bg-amber-50 border border-amber-200 p-1 rounded-xl">
                              <button onClick={() => updateCartQty(prod.id, -1)} className="w-7 h-7 bg-white rounded-lg font-bold text-amber-700 shadow-sm flex items-center justify-center text-xs">
                                -
                              </button>
                              <span className="text-xs font-bold px-1">{inCart.qty}</span>
                              <button onClick={() => updateCartQty(prod.id, 1)} className="w-7 h-7 bg-amber-600 text-white rounded-lg font-bold shadow-sm flex items-center justify-center text-xs">
                                +
                              </button>
                            </div>
                          ) : (
                            <button onClick={() => addToCart(prod)} className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold flex items-center space-x-1.5 shadow-sm">
                              <Plus className="w-4 h-4" />
                              <span>Pesan</span>
                            </button>
                          )
                        ) : (
                          <span className="text-[11px] font-semibold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-lg flex items-center">
                            <Lock className="w-3 h-3 mr-1" /> Ditutup
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {cart.length > 0 && orderStatusInfo.isOpen && (
            <div className="fixed bottom-4 left-4 right-4 max-w-md mx-auto z-40">
              <button onClick={() => setIsCartOpen(true)} className="w-full bg-amber-600 hover:bg-amber-700 text-white p-3.5 rounded-2xl shadow-xl flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="relative bg-white/20 p-2 rounded-xl">
                    <ShoppingCart className="w-5 h-5 text-white" />
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center border-2 border-amber-600">
                      {cartSummary.totalItems}
                    </span>
                  </div>
                  <div className="text-left">
                    <p className="text-xs text-amber-100 font-medium">{cartSummary.totalItems} Pesanan Ditambahkan</p>
                    <p className="text-base font-black">{formatRupiah(cartSummary.totalSellingPrice)}</p>
                  </div>
                </div>
                <div className="flex items-center text-xs font-bold bg-white text-amber-700 px-3 py-2 rounded-xl shadow-sm">
                  <span>Lihat Keranjang</span>
                </div>
              </button>
            </div>
          )}
        </main>
      )}

      {/* DRAWER KERANJANG */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white h-full flex flex-col justify-between shadow-2xl">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center space-x-2">
                <ShoppingCart className="w-5 h-5 text-amber-600" />
                <h2 className="font-bold text-slate-900">Keranjang Pesanan</h2>
              </div>
              <button onClick={() => setIsCartOpen(false)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {cart.map((item) => {
                const tenant = tenants.find((t) => t.id === item.tenantId);
                const sellingPrice = item.priceOwner + item.priceOrganizer;
                return (
                  <div key={item.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <div>
                      <span className="text-[10px] font-medium text-slate-400 block">{tenant?.name || 'Stand'}</span>
                      <h4 className="font-bold text-sm text-slate-800">{item.name}</h4>
                      <p className="text-xs text-amber-600 font-semibold mt-0.5">
                        {formatRupiah(sellingPrice)} x {item.qty} = {formatRupiah(sellingPrice * item.qty)}
                      </p>
                    </div>

                    <div className="flex items-center space-x-2 bg-white border border-slate-200 p-1 rounded-lg">
                      <button onClick={() => updateCartQty(item.id, -1)} className="w-6 h-6 rounded bg-slate-100 text-slate-600 font-bold flex items-center justify-center text-xs">-</button>
                      <span className="text-xs font-bold px-1">{item.qty}</span>
                      <button onClick={() => updateCartQty(item.id, 1)} className="w-6 h-6 rounded bg-amber-600 text-white font-bold flex items-center justify-center text-xs">+</button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="p-4 border-t border-slate-200 bg-white space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500 font-medium">Total Tagihan:</span>
                <span className="text-lg font-black text-amber-600">{formatRupiah(cartSummary.totalSellingPrice)}</span>
              </div>
              <button
                onClick={() => {
                  setIsCartOpen(false);
                  setIsCheckoutModalOpen(true);
                }}
                className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shadow-md flex items-center justify-center space-x-2"
              >
                <span>Lanjut Isi Data Anak</span>
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CHECKOUT */}
      {isCheckoutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <button onClick={() => setIsCheckoutModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold text-slate-900 mb-1">Form Data Pemesan</h3>
            <p className="text-xs text-slate-500 mb-4">
              Pesanan ini akan dicatat ke <strong>{activeBatch?.name}</strong>.
            </p>

            <form onSubmit={handleCheckoutSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center">
                  <User className="w-3.5 h-3.5 mr-1 text-amber-600" /> Nama Lengkap Anak <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Budi Santoso"
                  value={checkoutData.namaAnak}
                  onChange={(e) => setCheckoutData({ ...checkoutData, namaAnak: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center">
                  <School className="w-3.5 h-3.5 mr-1 text-amber-600" /> Pilih Kelas Anak <span className="text-red-500">*</span>
                </label>
                <select
                  value={checkoutData.kelas}
                  onChange={(e) => setCheckoutData({ ...checkoutData, kelas: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                >
                  {classesList.map((c) => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center">
                  <Phone className="w-3.5 h-3.5 mr-1 text-amber-600" /> Nama Ortu / No WA (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="Mama Budi / 08123456..."
                  value={checkoutData.namaOrtu}
                  onChange={(e) => setCheckoutData({ ...checkoutData, namaOrtu: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Catatan Pesanan (Opsional)</label>
                <textarea
                  rows={2}
                  placeholder="Contoh: Tanpa pedas"
                  value={checkoutData.catatan}
                  onChange={(e) => setCheckoutData({ ...checkoutData, catatan: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                />
              </div>

              <div className="bg-amber-50 rounded-xl p-3 border border-amber-200 text-xs space-y-1">
                <div className="flex justify-between font-medium text-amber-900">
                  <span>Batch Pemesanan:</span>
                  <span className="font-bold">{activeBatch?.name}</span>
                </div>
                <div className="flex justify-between font-bold text-amber-950 text-sm pt-1 border-t border-amber-200">
                  <span>Total Tagihan:</span>
                  <span>{formatRupiah(cartSummary.totalSellingPrice)}</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow-md flex items-center justify-center space-x-2 transition-all disabled:opacity-50"
              >
                <MessageCircle className="w-5 h-5 fill-current" />
                <span>{isSubmitting ? 'Memproses...' : 'Kirim Pesanan (WA PIC Kelas)'}</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: PANEL ADMIN & LAPORAN */}
      {/* ========================================================================= */}
      {activeTab === 'admin' && (
        <main className="max-w-5xl mx-auto px-4 pt-6">
          {!isAdminLoggedIn ? (
            <div className="max-w-md mx-auto bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xl mt-6">
              <div className="text-center mb-6">
                <div className="bg-indigo-100 text-indigo-700 w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-sm">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h2 className="text-xl font-black text-slate-900">Login Admin Panitia PTA</h2>
                <p className="text-xs text-slate-500 mt-1">Bazaar DANUS PTA Little Darbi</p>
              </div>

              {loginError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{loginError}</span>
                </div>
              )}

              <form onSubmit={handleAdminLogin} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Username</label>
                  <input
                    type="text"
                    required
                    placeholder="admin"
                    value={loginForm.username}
                    onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Password</label>
                  <input
                    type="password"
                    required
                    placeholder="admin123"
                    value={loginForm.password}
                    onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                  />
                </div>
                <button type="submit" className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md text-sm">
                  Masuk Panel Admin
                </button>
              </form>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex justify-between items-center bg-indigo-900 text-white p-4 rounded-2xl shadow-sm">
                <div className="flex items-center space-x-3">
                  <div className="bg-indigo-800 p-2 rounded-xl">
                    <User className="w-5 h-5 text-indigo-200" />
                  </div>
                  <div>
                    <span className="text-[10px] text-indigo-300 font-bold uppercase tracking-wider block">Sesi Login Aktif</span>
                    <h3 className="font-bold text-sm">Panel Admin DANUS PTA Little Darbi</h3>
                  </div>
                </div>
                <button onClick={() => setIsAdminLoggedIn(false)} className="px-3 py-1.5 bg-red-500/80 hover:bg-red-600 text-white rounded-xl text-xs font-semibold">
                  Logout
                </button>
              </div>

              <div className="flex items-center space-x-2 border-b border-slate-200 pb-3 overflow-x-auto scrollbar-none">
                <button
                  onClick={() => setAdminSubTab('batch_reports')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center space-x-1.5 whitespace-nowrap transition-all ${
                    adminSubTab === 'batch_reports' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-white text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Rekap Per Tenant & Batch</span>
                </button>

                <button
                  onClick={() => setAdminSubTab('tenants')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center space-x-1.5 whitespace-nowrap transition-all ${
                    adminSubTab === 'tenants' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-white text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <User className="w-4 h-4" />
                  <span>Kelola Stand / Tenant</span>
                </button>

                <button
                  onClick={() => setAdminSubTab('batches')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center space-x-1.5 whitespace-nowrap transition-all ${
                    adminSubTab === 'batches' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-white text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Layers className="w-4 h-4" />
                  <span>Kelola Batch Periode</span>
                </button>

                <button
                  onClick={() => setAdminSubTab('products')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center space-x-1.5 whitespace-nowrap transition-all ${
                    adminSubTab === 'products' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-white text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Store className="w-4 h-4" />
                  <span>Setup Produk & Harga</span>
                </button>

                <button
                  onClick={() => setAdminSubTab('orders')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center space-x-1.5 whitespace-nowrap transition-all ${
                    adminSubTab === 'orders' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-white text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>Semua Pesanan ({orders.length})</span>
                </button>

                <button
                  onClick={() => setAdminSubTab('class_pics')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center space-x-1.5 whitespace-nowrap transition-all ${
                    adminSubTab === 'class_pics' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-white text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  <span>Routing WA Kelas ({classesList.length})</span>
                </button>

                <button
                  onClick={() => setAdminSubTab('settings')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center space-x-1.5 whitespace-nowrap transition-all ${
                    adminSubTab === 'settings' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-white text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Settings className="w-4 h-4" />
                  <span>Integrasi Webhook & Sandi</span>
                </button>
              </div>

              {/* ------------------------------------------------------------- */}
              {/* SUBTAB 1: REKAPITULASI TENANT & BATCH REPORTS */}
              {/* ------------------------------------------------------------- */}
              {adminSubTab === 'batch_reports' && (
                <div className="space-y-6">
                  <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-4 justify-between sm:items-center">
                    <div>
                      <h3 className="font-bold text-slate-900 text-base">Laporan Rekapitulasi Per Stand</h3>
                      <p className="text-xs text-slate-500">Filter data pesanan per Gelombang Batch dan Status Pembayaran.</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-0.5">Pilih Batch</label>
                        <select
                          value={reportSelectedBatchId}
                          onChange={(e) => setReportSelectedBatchId(e.target.value)}
                          className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none"
                        >
                          {batches.map((b) => (
                            <option key={b.id} value={b.id}>{b.name}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-0.5">Filter Status</label>
                        <select
                          value={reportSelectedStatus}
                          onChange={(e) => setReportSelectedStatus(e.target.value)}
                          className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none"
                        >
                          <option value="Paid">Hanya Paid (Lunas)</option>
                          <option value="Unpaid">Hanya Unpaid (Belum Bayar)</option>
                          <option value="Selesai">Hanya Selesai</option>
                          <option value="ALL">Semua Status (Excl. Void)</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    {batchReportData.map((tenantRep) => {
                      const itemNames = Object.keys(tenantRep.itemTotalsMap);

                      return (
                        <div key={tenantRep.tenantId} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                          <div className="p-4 bg-slate-900 text-white flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                            <div>
                              <span className="text-[10px] bg-amber-500 text-white font-black px-2 py-0.5 rounded uppercase tracking-wider">
                                Stand / Tenant
                              </span>
                              <h4 className="text-lg font-black mt-1">{tenantRep.tenantName}</h4>
                              <p className="text-xs text-slate-300">
                                PJ: {tenantRep.tenantOwner} {tenantRep.tenantPhone && `(WA: ${tenantRep.tenantPhone})`}
                              </p>
                            </div>

                            <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
                              <button
                                onClick={() => sendDirectWAToTenant(tenantRep)}
                                className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center space-x-1.5 shadow-sm transition-all"
                              >
                                <MessageCircle className="w-4 h-4 fill-current" />
                                <span>Kirim WA ke Tenant</span>
                              </button>

                              <button
                                onClick={() => printTenantPDF(tenantRep)}
                                className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl flex items-center space-x-1.5 shadow-sm transition-all"
                              >
                                <Printer className="w-4 h-4" />
                                <span>Cetak / Download PDF</span>
                              </button>
                            </div>
                          </div>

                          <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="md:col-span-2 space-y-3">
                              <h5 className="font-bold text-xs uppercase tracking-wider text-slate-400">
                                📋 Detail Pesanan Masuk ({tenantRep.customerOrdersDetail.length} Pembeli)
                              </h5>

                              {tenantRep.customerOrdersDetail.length === 0 ? (
                                <p className="text-xs text-slate-400 italic py-4">Belum ada pesanan masuk untuk tenant ini di batch ini.</p>
                              ) : (
                                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                                  {tenantRep.customerOrdersDetail.map((cust, idx) => (
                                    <div key={idx} className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs space-y-1">
                                      <div className="flex justify-between font-bold text-slate-900">
                                        <span>{idx + 1}. {cust.namaAnak} ({cust.kelas})</span>
                                        {cust.namaOrtu !== '-' && <span className="text-slate-500 font-normal">Ortu: {cust.namaOrtu}</span>}
                                      </div>
                                      <div className="text-slate-600 space-y-0.5 pl-3 border-l-2 border-slate-300">
                                        {cust.items.map((it, iIdx) => (
                                          <div key={iIdx} className="flex justify-between">
                                            <span>{it.name}</span>
                                            <span className="font-bold">x{it.qty}</span>
                                          </div>
                                        ))}
                                      </div>
                                      {cust.catatan && (
                                        <p className="text-[10px] text-amber-700 italic">Catatan: {cust.catatan}</p>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>

                            <div className="bg-amber-50/70 p-4 rounded-xl border border-amber-200 flex flex-col justify-between">
                              <div>
                                <h5 className="font-bold text-xs uppercase tracking-wider text-amber-900 mb-3 flex items-center">
                                  <Store className="w-3.5 h-3.5 mr-1 text-amber-600" /> Ringkasan Dapur (Total Qty)
                                </h5>

                                {itemNames.length === 0 ? (
                                  <p className="text-xs text-amber-700/60 italic">Belum ada item dipesan.</p>
                                ) : (
                                  <div className="space-y-2">
                                    {itemNames.map((name) => (
                                      <div key={name} className="flex justify-between items-center bg-white p-2 rounded-lg border border-amber-200 text-xs shadow-2xs">
                                        <span className="font-medium text-slate-800">{name}</span>
                                        <span className="font-black text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
                                          {tenantRep.itemTotalsMap[name]} Pcs
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>

                              <div className="mt-4 pt-3 border-t border-amber-200 text-xs">
                                <div className="flex justify-between font-medium text-slate-600">
                                  <span>Subtotal Tagihan:</span>
                                  <span>{formatRupiah(tenantRep.tenantTotalGross)}</span>
                                </div>
                                <div className="flex justify-between font-bold text-emerald-700 text-sm mt-0.5">
                                  <span>Hak Vendor:</span>
                                  <span>{formatRupiah(tenantRep.tenantTotalOwnerShare)}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ------------------------------------------------------------- */}
              {/* SUBTAB 2: KELOLA STAND / TENANT */}
              {/* ------------------------------------------------------------- */}
              {adminSubTab === 'tenants' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-bold text-slate-900 text-base">Kelola Stand / Tenant & Kontak WA Vendor</h3>
                      <p className="text-xs text-slate-500">Pastikan nomor WhatsApp vendor terisi dengan benar (format: 628...).</p>
                    </div>
                    <button
                      onClick={() => setTenantModal({ isOpen: true, item: null })}
                      className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl flex items-center space-x-1 shadow-sm"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Tambah Stand Baru</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {tenants.map((t) => {
                      const countProduct = products.filter((p) => p.tenantId === t.id).length;
                      return (
                        <div key={t.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-bold text-slate-900 text-sm">{t.name}</h4>
                              <p className="text-xs text-slate-500 mt-0.5">PJ: {t.owner}</p>
                              <p className="text-xs font-semibold text-emerald-700 mt-0.5 flex items-center">
                                <Phone className="w-3 h-3 mr-1" /> WA: {t.phone || '(Belum diisi)'}
                              </p>
                            </div>
                            <span className="text-[10px] bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded-full">
                              {countProduct} Produk
                            </span>
                          </div>
                          <div className="pt-3 border-t border-slate-100 flex justify-end space-x-2">
                            <button onClick={() => setTenantModal({ isOpen: true, item: t })} className="px-2.5 py-1 text-xs text-blue-600 bg-blue-50 rounded-lg font-semibold flex items-center">
                              <Edit3 className="w-3 h-3 mr-1" /> Edit
                            </button>
                            <button onClick={() => setTenants(tenants.filter((item) => item.id !== t.id))} className="px-2.5 py-1 text-xs text-red-600 bg-red-50 rounded-lg font-semibold flex items-center">
                              <Trash2 className="w-3 h-3 mr-1" /> Hapus
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ------------------------------------------------------------- */}
              {/* SUBTAB 3: KELOLA BATCH PERIODE */}
              {/* ------------------------------------------------------------- */}
              {adminSubTab === 'batches' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-bold text-slate-900 text-base">Manajemen Batch Gelombang Pemesanan</h3>
                    <button onClick={() => setBatchModal({ isOpen: true, item: null })} className="px-3.5 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl flex items-center space-x-1">
                      <Plus className="w-4 h-4" />
                      <span>Buat Batch Baru</span>
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {batches.map((b) => (
                      <div key={b.id} className={`bg-white rounded-2xl p-4 border ${b.isActive ? 'border-indigo-500 ring-2 ring-indigo-500/10' : 'border-slate-200'}`}>
                        <div className="flex justify-between items-start">
                          <div>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${b.isActive ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-500'}`}>
                              {b.isActive ? 'BATCH AKTIF' : 'Non-Aktif'}
                            </span>
                            <h4 className="font-bold text-slate-900 text-base mt-1">{b.name}</h4>
                            <p className="text-xs text-slate-500">{b.description}</p>
                          </div>
                        </div>
                        <div className="mt-3 pt-3 border-t border-slate-100 flex justify-between items-center text-xs">
                          <span className="text-slate-500">Periode: <strong>{formatIndoDate(b.startDate)}</strong> - <strong>{formatIndoDate(b.endDate)}</strong></span>
                          <button onClick={() => setBatches(batches.map((item) => ({ ...item, isActive: item.id === b.id })))} className={`px-3 py-1 rounded-lg font-bold text-xs ${b.isActive ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700'}`}>
                            {b.isActive ? 'Aktif' : 'Set Aktif'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ------------------------------------------------------------- */}
              {/* SUBTAB 4: SETUP PRODUK & HARGA (FIXED RESPONSIVE TABLE & ACTIONS) */}
              {/* ------------------------------------------------------------- */}
              {adminSubTab === 'products' && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                    <div>
                      <h3 className="font-bold text-slate-900 text-base">Database Produk & Split Harga</h3>
                      <p className="text-xs text-slate-500">
                        Atur produk, foto thumbnail, serta 2 komponen harga (Harga Owner + Margin Panitia).
                      </p>
                    </div>
                    <button
                      onClick={() => setProductModal({ isOpen: true, item: null })}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl flex items-center justify-center space-x-1.5 shadow-md"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Tambah Produk Baru</span>
                    </button>
                  </div>

                  {/* Responsive Scrollable Table Wrapper */}
                  <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                    <div className="overflow-x-auto w-full">
                      <table className="w-full text-left text-xs min-w-[700px]">
                        <thead className="bg-slate-100 text-slate-600 uppercase text-[10px] tracking-wider">
                          <tr>
                            <th className="p-3.5 w-14">Foto</th>
                            <th className="p-3.5">Nama Produk</th>
                            <th className="p-3.5">Stand / Tenant</th>
                            <th className="p-3.5 text-emerald-700">Harga Owner</th>
                            <th className="p-3.5 text-indigo-700">Margin Panitia</th>
                            <th className="p-3.5 font-bold text-amber-700">Harga Jual</th>
                            <th className="p-3.5 text-center w-28 bg-slate-100">Aksi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {products.map((p) => {
                            const tenant = tenants.find((t) => t.id === p.tenantId);
                            const sellingPrice = p.priceOwner + p.priceOrganizer;
                            return (
                              <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                                <td className="p-3">
                                  {p.imageUrl ? (
                                    <img src={p.imageUrl} alt={p.name} className="w-10 h-10 object-cover rounded-lg border border-slate-200 shrink-0" />
                                  ) : (
                                    <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400 shrink-0">
                                      <ImageIcon className="w-5 h-5" />
                                    </div>
                                  )}
                                </td>
                                <td className="p-3 font-bold text-slate-900">
                                  <span className="block">{p.name}</span>
                                  <span className="text-[10px] text-slate-400 font-normal">{p.category}</span>
                                </td>
                                <td className="p-3 font-medium text-slate-600">{tenant?.name || '-'}</td>
                                <td className="p-3 text-emerald-700 font-semibold">{formatRupiah(p.priceOwner)}</td>
                                <td className="p-3 text-indigo-700 font-semibold">+ {formatRupiah(p.priceOrganizer)}</td>
                                <td className="p-3 font-black text-amber-600 text-sm">{formatRupiah(sellingPrice)}</td>
                                <td className="p-3 text-center">
                                  <div className="flex items-center justify-center space-x-1">
                                    <button
                                      onClick={() => setProductModal({ isOpen: true, item: p })}
                                      className="p-1.5 text-blue-600 hover:bg-blue-50 bg-blue-50/50 rounded-lg font-semibold flex items-center"
                                      title="Edit Produk"
                                    >
                                      <Edit3 className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={() => {
                                        if (confirm(`Yakin ingin menghapus produk "${p.name}"?`)) {
                                          setProducts(products.filter((item) => item.id !== p.id));
                                          showToast(`Produk "${p.name}" berhasil dihapus.`);
                                        }
                                      }}
                                      className="p-1.5 text-red-600 hover:bg-red-50 bg-red-50/50 rounded-lg font-semibold flex items-center"
                                      title="Hapus Produk"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* ------------------------------------------------------------- */}
              {/* SUBTAB 5: SEMUA PESANAN MASUK */}
              {/* ------------------------------------------------------------- */}
              {adminSubTab === 'orders' && (
                <div className="space-y-4">
                  <h3 className="font-bold text-slate-900 text-base">Semua Pesanan Masuk ({orders.length})</h3>
                  <div className="space-y-3">
                    {orders.map((ord) => (
                      <div key={ord.orderId} className="bg-white p-4 rounded-2xl border border-slate-200 text-xs space-y-2 shadow-sm">
                        <div className="flex justify-between font-bold">
                          <span className="text-indigo-700">{ord.orderId} - {ord.customer.namaAnak} ({ord.customer.kelas})</span>
                          <select
                            value={ord.status}
                            onChange={(e) => {
                              const newSt = e.target.value;
                              setOrders(orders.map((o) => (o.orderId === ord.orderId ? { ...o, status: newSt } : o)));
                            }}
                            className="bg-slate-100 font-bold px-2 py-1 rounded"
                          >
                            <option value="Unpaid">Unpaid</option>
                            <option value="Paid">Paid</option>
                            <option value="Selesai">Selesai</option>
                            <option value="Void">Void</option>
                          </select>
                        </div>
                        <div className="space-y-0.5 text-slate-600">
                          {ord.items.map((i, idx) => (
                            <div key={idx} className="flex justify-between">
                              <span>{i.name} (x{i.qty})</span>
                              <span>{formatRupiah(i.subtotal)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ------------------------------------------------------------- */}
              {/* SUBTAB 6: DYNAMIC CLASS MANAGEMENT & ROUTING WA KELAS */}
              {/* ------------------------------------------------------------- */}
              {adminSubTab === 'class_pics' && (
                <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-6 shadow-sm">
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                    <div>
                      <h3 className="font-bold text-base text-slate-900">Kelola Daftar Kelas & Routing WA PIC</h3>
                      <p className="text-xs text-slate-500">
                        Anda dapat menambah, mengubah nama kelas, atau menghapus kelas, serta mengatur nomor WA PIC/Wali Kelas.
                      </p>
                    </div>
                    <button
                      onClick={() => setClassModal({ isOpen: true, item: null })}
                      className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl flex items-center space-x-1 shadow-sm self-start sm:self-auto"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Tambah Kelas Baru</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    {classesList.map((c) => (
                      <div key={c.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-bold text-slate-900 text-sm flex items-center">
                              <School className="w-3.5 h-3.5 mr-1 text-amber-600" /> {c.name}
                            </span>
                            <div className="flex items-center space-x-1">
                              <button
                                onClick={() => setClassModal({ isOpen: true, item: c })}
                                className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                                title="Edit Kelas"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  if (classesList.length <= 1) return alert('Sistem harus memiliki minimal 1 kelas!');
                                  if (confirm(`Hapus kelas "${c.name}"?`)) {
                                    setClassesList(classesList.filter((item) => item.id !== c.id));
                                    showToast(`Kelas ${c.name} dihapus.`);
                                  }
                                }}
                                className="p-1 text-red-600 hover:bg-red-100 rounded"
                                title="Hapus Kelas"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] text-slate-500 font-bold block">No. WA PIC / Wali Kelas:</label>
                            <input
                              type="text"
                              placeholder="628123456789"
                              value={c.phone}
                              onChange={(e) => {
                                const newPhone = e.target.value;
                                setClassesList(classesList.map((item) => item.id === c.id ? { ...item, phone: newPhone } : item));
                              }}
                              className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ------------------------------------------------------------- */}
              {/* SUBTAB 7: INTEGRASI WEBHOOK & SAVE SETTINGS BUTTON */}
              {/* ------------------------------------------------------------- */}
              {adminSubTab === 'settings' && (
                <div className="space-y-6">
                  <div className="max-w-xl bg-white rounded-2xl border border-slate-200 p-6 space-y-5 shadow-sm text-xs">
                    <div>
                      <h3 className="font-bold text-base text-slate-900">Pengaturan Webhook & Akun Admin</h3>
                      <p className="text-slate-500">Sesuaikan kredensial login admin, nomor WA utama, dan webhook Google Sheet.</p>
                    </div>

                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        // Save directly to LocalStorage
                        localStorage.setItem('ld_bazaar_sheet_webhook', sheetWebhookUrl);
                        localStorage.setItem('ld_bazaar_admin_phone', adminPhone);
                        localStorage.setItem('ld_bazaar_admin_auth', JSON.stringify(adminAuth));
                        showToast('Semua Pengaturan Berhasil Disimpan!');
                      }}
                      className="space-y-4"
                    >
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Google Sheets Webhook URL</label>
                        <input
                          type="url"
                          placeholder="https://script.google.com/macros/s/.../exec"
                          value={sheetWebhookUrl}
                          onChange={(e) => setSheetWebhookUrl(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
                        />
                        <span className="text-[10px] text-slate-400 mt-1 block">
                          Setiap kali customer checkout, data pesanan otomatis terkirim ke spreadsheet ini.
                        </span>
                      </div>

                      <div className="pt-3 border-t border-slate-100">
                        <label className="block font-bold text-slate-700 mb-1">No. WA Admin Utama (Fallback)</label>
                        <input
                          type="text"
                          value={adminPhone}
                          onChange={(e) => setAdminPhone(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                        />
                      </div>

                      <div className="pt-3 border-t border-slate-100">
                        <label className="block font-bold text-slate-700 mb-1">Username Admin Login</label>
                        <input
                          type="text"
                          value={adminAuth.username}
                          onChange={(e) => setAdminAuth({ ...adminAuth, username: e.target.value })}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Password Admin Login</label>
                        <input
                          type="password"
                          value={adminAuth.password}
                          onChange={(e) => setAdminAuth({ ...adminAuth, password: e.target.value })}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                        />
                      </div>

                      {/* TOMBOL SIMPAN PENGATURAN EKSPLISIT */}
                      <button
                        type="submit"
                        className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md flex items-center justify-center space-x-2 text-sm transition-all"
                      >
                        <Save className="w-4 h-4" />
                        <span>Simpan Semua Pengaturan</span>
                      </button>
                    </form>
                  </div>

                  {/* CROSS-DEVICE CONFIGURATION BACKUP & SYNC TOOL */}
                  <div className="max-w-xl bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-sm text-xs">
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 flex items-center">
                        <Share2 className="w-4 h-4 mr-1.5 text-indigo-600" /> Transfer / Sync Konfigurasi ke Device / Browser Lain
                      </h4>
                      <p className="text-slate-500 mt-1">
                        Agar pengaturan (Webhook URL, Password Admin, Routing Kelas, & Produk) dapat digunakan di HP/Laptop lain, Anda dapat mengeksport kode konfigurasi lalu menempelkannya di device lain.
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={exportConfigJSON}
                        className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl font-bold flex items-center space-x-1.5 border border-indigo-200"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>Salin Teks Konfigurasi (Export)</span>
                      </button>

                      <button
                        onClick={() => setIsImportModalOpen(true)}
                        className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold flex items-center space-x-1.5 border border-slate-300"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Tempel Konfigurasi (Import)</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      )}

      {/* MODAL EDIT PRODUK */}
      {productModal.isOpen && (
        <ModalProductForm
          item={productModal.item}
          tenants={tenants}
          onClose={() => setProductModal({ isOpen: false, item: null })}
          onSave={(formData) => {
            if (productModal.item) {
              setProducts(products.map((p) => (p.id === productModal.item.id ? { ...p, ...formData } : p)));
              showToast('Produk berhasil diperbarui.');
            } else {
              setProducts([...products, { ...formData, id: 'p-' + Date.now(), available: true }]);
              showToast('Produk baru berhasil ditambahkan.');
            }
            setProductModal({ isOpen: false, item: null });
          }}
        />
      )}

      {/* MODAL TENANT */}
      {tenantModal.isOpen && (
        <ModalTenantForm
          item={tenantModal.item}
          onClose={() => setTenantModal({ isOpen: false, item: null })}
          onSave={(formData) => {
            if (tenantModal.item) {
              setTenants(tenants.map((t) => (t.id === tenantModal.item.id ? { ...t, ...formData } : t)));
              showToast('Data Stand diperbarui.');
            } else {
              setTenants([...tenants, { ...formData, id: 't-' + Date.now() }]);
              showToast('Stand baru ditambahkan.');
            }
            setTenantModal({ isOpen: false, item: null });
          }}
        />
      )}

      {/* MODAL BATCH */}
      {batchModal.isOpen && (
        <ModalBatchForm
          onClose={() => setBatchModal({ isOpen: false, item: null })}
          onSave={(formData) => {
            setBatches([...batches, { ...formData, id: 'b-' + Date.now(), isActive: false }]);
            showToast('Batch baru dibuat.');
            setBatchModal({ isOpen: false, item: null });
          }}
        />
      )}

      {/* MODAL EDIT / TAMBAH KELAS */}
      {classModal.isOpen && (
        <ModalClassForm
          item={classModal.item}
          onClose={() => setClassModal({ isOpen: false, item: null })}
          onSave={(formData) => {
            if (classModal.item) {
              setClassesList(classesList.map((c) => (c.id === classModal.item.id ? { ...c, ...formData } : c)));
              showToast('Data Kelas diperbarui.');
            } else {
              setClassesList([...classesList, { ...formData, id: 'c-' + Date.now() }]);
              showToast('Kelas baru ditambahkan.');
            }
            setClassModal({ isOpen: false, item: null });
          }}
        />
      )}

      {/* MODAL IMPORT CONFIG */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl relative text-xs space-y-3">
            <button onClick={() => setIsImportModalOpen(false)} className="absolute top-4 right-4 text-slate-400">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-base font-bold text-slate-900">Import Konfigurasi / Sync Device</h3>
            <p className="text-slate-500">Tempelkan teks kode JSON konfigurasi dari device lain di bawah ini:</p>

            <form onSubmit={handleImportConfig} className="space-y-3">
              <textarea
                rows={6}
                required
                placeholder='{"adminPhone": "628...", ...}'
                value={importConfigJson}
                onChange={(e) => setImportConfigJson(e.target.value)}
                className="w-full p-3 bg-slate-50 border rounded-xl font-mono text-[10px]"
              />
              <button type="submit" className="w-full py-2.5 bg-indigo-600 text-white font-bold rounded-xl shadow-md">
                Terapkan Konfigurasi
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function ModalClassForm({ item, onClose, onSave }) {
  const [name, setName] = useState(item?.name || '');
  const [phone, setPhone] = useState(item?.phone || '');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl relative text-xs space-y-3">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400">
          <X className="w-5 h-5" />
        </button>
        <h3 className="text-base font-bold text-slate-900">
          {item ? 'Edit Kelas' : 'Tambah Kelas Baru'}
        </h3>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSave({ name, phone });
          }}
          className="space-y-3"
        >
          <div>
            <label className="block font-semibold mb-1">Nama Kelas</label>
            <input
              type="text"
              required
              placeholder="Contoh: TK A3 / Little Owl 2"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border rounded-xl"
            />
          </div>

          <div>
            <label className="block font-semibold mb-1">No. WA PIC Kelas</label>
            <input
              type="text"
              required
              placeholder="Contoh: 628123456789"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border rounded-xl"
            />
          </div>

          <button type="submit" className="w-full py-2.5 bg-indigo-600 text-white font-bold rounded-xl shadow-md">
            Simpan Kelas
          </button>
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl relative text-xs space-y-3">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400">
          <X className="w-5 h-5" />
        </button>
        <h3 className="text-base font-bold text-slate-900">
          {item ? 'Edit Stand/Tenant' : 'Tambah Stand Baru'}
        </h3>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSave({ name, owner, phone });
          }}
          className="space-y-3"
        >
          <div>
            <label className="block font-semibold mb-1">Nama Stand / Tenant</label>
            <input
              type="text"
              required
              placeholder="Contoh: Stand Snack Bu Ningsih"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border rounded-xl"
            />
          </div>

          <div>
            <label className="block font-semibold mb-1">Nama Pemilik Stand</label>
            <input
              type="text"
              required
              placeholder="Contoh: Mama Budi (TK A1)"
              value={owner}
              onChange={(e) => setOwner(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border rounded-xl"
            />
          </div>

          <div>
            <label className="block font-semibold mb-1 text-emerald-700">No WhatsApp Pemilik Stand</label>
            <input
              type="text"
              required
              placeholder="Contoh: 628123456789"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-emerald-200 rounded-xl"
            />
          </div>

          <button type="submit" className="w-full py-2.5 bg-indigo-600 text-white font-bold rounded-xl shadow-md">
            Simpan Stand
          </button>
        </form>
      </div>
    </div>
  );
}

function ModalProductForm({ item, tenants, onClose, onSave }) {
  const [form, setForm] = useState({
    name: item?.name || '',
    tenantId: item?.tenantId || tenants[0]?.id || '',
    priceOwner: item?.priceOwner || 0,
    priceOrganizer: item?.priceOrganizer || 0,
    category: item?.category || 'Makanan',
    description: item?.description || '',
    imageUrl: item?.imageUrl || ''
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl relative text-xs space-y-3">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400">
          <X className="w-5 h-5" />
        </button>
        <h3 className="text-base font-bold text-slate-900">
          {item ? 'Edit Produk' : 'Setup Produk Baru'}
        </h3>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSave({ ...form, priceOwner: Number(form.priceOwner), priceOrganizer: Number(form.priceOrganizer) });
          }}
          className="space-y-3"
        >
          <div>
            <label className="block font-semibold mb-1">Nama Produk</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border rounded-xl"
            />
          </div>

          <div>
            <label className="block font-semibold mb-1">Stand / Tenant</label>
            <select
              value={form.tenantId}
              onChange={(e) => setForm({ ...form, tenantId: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border rounded-xl"
            >
              {tenants.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1">Harga Owner (Rp)</label>
              <input
                type="number"
                required
                value={form.priceOwner}
                onChange={(e) => setForm({ ...form, priceOwner: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border rounded-xl"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Margin Panitia (Rp)</label>
              <input
                type="number"
                required
                value={form.priceOrganizer}
                onChange={(e) => setForm({ ...form, priceOrganizer: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border rounded-xl"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold mb-1">URL Foto Produk</label>
            <input
              type="url"
              value={form.imageUrl}
              onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border rounded-xl"
            />
          </div>

          <button type="submit" className="w-full py-2.5 bg-indigo-600 text-white font-bold rounded-xl shadow-md">
            Simpan Produk
          </button>
        </form>
      </div>
    </div>
  );
}

function ModalBatchForm({ onClose, onSave }) {
  const [form, setForm] = useState({
    name: '',
    startDate: new Date().toISOString().slice(0, 10),
    endDate: new Date().toISOString().slice(0, 10),
    description: ''
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl relative text-xs space-y-3">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400">
          <X className="w-5 h-5" />
        </button>
        <h3 className="text-base font-bold text-slate-900">Buat Batch Periode Baru</h3>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSave(form);
          }}
          className="space-y-3"
        >
          <div>
            <label className="block font-semibold mb-1">Nama Batch</label>
            <input
              type="text"
              required
              placeholder="Contoh: Batch 3 - Pre Order Agustus"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border rounded-xl"
            />
          </div>

          <div>
            <label className="block font-semibold mb-1">Tanggal Mulai</label>
            <input
              type="date"
              required
              value={form.startDate}
              onChange={(e) => setForm({ ...form, startDate: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border rounded-xl"
            />
          </div>

          <div>
            <label className="block font-semibold mb-1">Tanggal Selesai</label>
            <input
              type="date"
              required
              value={form.endDate}
              onChange={(e) => setForm({ ...form, endDate: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border rounded-xl"
            />
          </div>

          <button type="submit" className="w-full py-2.5 bg-indigo-600 text-white font-bold rounded-xl shadow-md">
            Simpan Batch
          </button>
        </form>
      </div>
    </div>
  );
}