// ... existing code ...
const INITIAL_CLASSES = [
  { id: 'c1', name: 'Little Owl', phone: '628123456781' },
  { id: 'c2', name: 'Playgroup / KB', phone: '628123456782' },
  { id: 'c3', name: 'TK A1', phone: '628123456783' },
  { id: 'c4', name: 'TK A2', phone: '628123456784' },
  { id: 'c5', name: 'TK B1', phone: '628123456785' },
  { id: 'c6', name: 'TK B2', phone: '628123456786' },
  { id: 'c7', name: 'Umum / Tamu', phone: '628123456780' }
];

const parseAndCleanItem = (rawItem, productsList = [], tenantsList = []) => {
  let rawName = String(rawItem.name || '');
  let qty = Number(rawItem.qty) || 1;

  // Hapus & Ekstrak quantity secara presisi untuk menghindari duplikasi (x3) (x1)
  const matches = rawName.match(/\(x(\d+)\)/g);
  if (matches && matches.length > 0) {
    const extractedNum = parseInt(matches[0].replace(/[^0-9]/g, ''), 10);
    if (extractedNum) qty = extractedNum;
  }

  // Bersihkan sisa tag pada nama produk
  let cleanName = rawName.replace(/\(x\d+\)/g, '').replace(/\[.*?\]/g, '').trim();
  cleanName = cleanName.replace(/^[-,]+|[-,\s]+$/g, '').trim(); // Hapus sisa koma jika ada

  // Temukan relasi produk
  const matchedProd = productsList.find(
    (p) => p.id === rawItem.id || (p.name || '').toLowerCase() === cleanName.toLowerCase()
  );

  const priceOwner = matchedProd ? Number(matchedProd.priceOwner || 0) : Number(rawItem.priceOwner || 0);
  const priceOrganizer = matchedProd ? Number(matchedProd.priceOrganizer || 0) : Number(rawItem.priceOrganizer || 0);
  const unitSellingPrice = priceOwner + priceOrganizer;

  const tenantId = matchedProd ? matchedProd.tenantId : (rawItem.tenantId || tenantsList[0]?.id || 't1');
  const tenantObj = tenantsList.find((t) => t.id === tenantId);
  const tenantName = tenantObj?.name || rawItem.tenantName || 'Stand Bazaar';

  return {
    ...rawItem,
    name: cleanName || 'Produk Bazaar',
    qty,
    priceOwner,
    priceOrganizer,
    unitSellingPrice,
    tenantId,
    tenantName,
    subtotal: unitSellingPrice * qty
  };
};

function LittleDarbiLogo({ className = "w-10 h-10" }) {
// ... existing code ...
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
    if (!orderStatusInfo.isOpen || !activeBatch) {
      showToast(orderStatusInfo.reason);
      return;
    }
    if (!checkoutData.namaAnak.trim() || cart.length === 0) return;

    try {
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

      const targetClassObj = classesList.find((c) => c.name === checkoutData.kelas);
      
      // BUG FIX: Dibungkus dengan String() untuk menghindari crash tipe data Integer dari Google Sheets
      const picPhoneForClass = String(targetClassObj?.phone || adminPhone || '628123456780');
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
      waText += `Halo PIC Kelas ${checkoutData.kelas}, mohon instruksi info rekening pembayaran. Terima kasih! 😊`;

      const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(waText)}`;

      // Fire non-blocking background fetch to Google Sheets
      const targetUrl = sheetWebhookUrl || DEFAULT_WEBHOOK_URL;
      if (targetUrl) {
        fetch(targetUrl, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'checkout',
            ...orderPayload
          })
        }).catch((err) => console.warn('Webhook background fetch warning:', err));
      }

      setCart([]);
      setIsCheckoutModalOpen(false);
      setIsCartOpen(false);
      setCheckoutData({ namaAnak: '', kelas: classesList[0]?.name || 'TK A1', namaOrtu: '', catatan: '' });
      setIsSubmitting(false);

      // Open WhatsApp URL immediately tanpa tertahan pop-up blocker
      window.open(waUrl, '_blank');
      
    } catch (error) {
      console.error("Checkout Error:", error);
      showToast("Terjadi kesalahan, pesanan disimpan secara lokal.");
      setIsSubmitting(false);
    }
  };

  const filteredProducts = useMemo(() => {
// ... existing code ...
                            <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
                              <button
                                onClick={() => handlePrintTenantReport(tenantRep)}
                                className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl flex items-center space-x-1.5 shadow-sm"
                              >
                                <Printer className="w-4 h-4" />
                                <span>Cetak / Export PDF</span>
                              </button>

                              <button
                                onClick={() => {
                                  // BUG FIX: Dibungkus dengan String()
                                  const targetPhone = String(tenantRep.tenantPhone || adminPhone || '');
                                  let cleanPhone = targetPhone.replace(/[^0-9]/g, '');
                                  if (cleanPhone.startsWith('0')) cleanPhone = '62' + cleanPhone.slice(1);
                                  if (!cleanPhone) {
                                    showToast('Nomor WA Stand belum diisi! Silakan isi di tab Kelola Stand.');
                                    return;
                                  }
                                  const currentBatch = batches.find((b) => b.id === reportSelectedBatchId);
                                  let text = `*REKAP PESANAN BAZAAR DANUS - ${tenantRep.tenantName.toUpperCase()}*\n`;
                                  text += `*Periode:* ${currentBatch?.name || '-'}\n\n`;
                                  itemNames.forEach((name) => {
                                    const agg = tenantRep.itemAggregatesMap[name];
                                    text += `• *${agg.name}*: ${agg.qty} pcs (${formatRupiah(agg.totalOwnerShare)})\n`;
                                  });
                                  text += `\n*TOTAL HAK VENDOR: ${formatRupiah(tenantRep.tenantTotalOwnerShare)}*\n\nTerima kasih! 😊`;
                                  window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`, '_blank');
                                }}
                                className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center space-x-1.5 shadow-sm"
                              >
                                <MessageCircle className="w-4 h-4 fill-current" />
                                <span>Kirim WA ke Tenant</span>
                              </button>
                            </div>
// ... existing code ...
                            <div className="space-y-1.5 text-slate-600 bg-slate-50/70 p-3 rounded-xl border border-slate-100">
                              {parsedItems.map((i, idx) => (
                                <div key={idx} className="flex justify-between items-center text-xs border-b border-slate-200/50 pb-1 mb-1 last:border-0 last:pb-0 last:mb-0">
                                  <span>
                                    <strong className="text-slate-800">{i.name}</strong> (x{i.qty})
                                    <span className="text-slate-500 font-medium ml-1">@{formatRupiah(i.unitSellingPrice)}</span>
                                    <span className="text-slate-400 text-[10px] ml-1">[{i.tenantName}]</span>
                                  </span>
                                  <span className="font-bold text-slate-900">{formatRupiah(i.subtotal)}</span>
                                </div>
                              ))}
                              {ord.customer?.catatan && (
                                <p className="text-[11px] text-amber-700 italic pt-1 border-t border-slate-200/50">Catatan: {ord.customer.catatan}</p>
                              )}
                            </div>

                            <div className="flex justify-between items-center font-bold text-slate-900 text-xs pt-1">
// ... existing code ...
```

### 📋 Cara Pengaplikasian:
1. Simpan perbaruan di dalam file `src/App.jsx`.
2. Jalankan perintah di terminal komputer Anda:
```bash
git add .
git commit -m "Fix integer replace bug in WA buttons, clean up item parsing and UI format"
git push
```

*(Catatan untuk Cetak PDF: Karena fungsi grup produk dan tabel PDF di atas sebenarnya telah tersusun dalam bentuk Tabel presisi pada update sebelumnya, maka PDF Export sekarang dipastikan akan berbentuk tabel sesuai *attachment* nomor dua Anda secara otomatis berkat parsing produk `cleanName` yang sudah bersih.)*