"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { Search, ShoppingCart, Trash2, Package, CreditCard, Tag, UserCheck, X, Loader2, CheckCircle, Flower2, Crown, Sparkles, Plus, Minus, ChevronRight, Zap, CheckCircle2 } from "lucide-react";
import Image from "next/image";

type Product = {
  id: number; name: string; type: string;
  selling_price: number; stock: number; unit: string; image_url: string | null;
};
type Customer = { id: number; name: string; phone: string; is_member: boolean };
type Voucher = { id: number; code: string; name: string; discount_amount: number; min_purchase: number };
type CartItem = Product & { qty: number };

export default function KasirPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedVoucher, setSelectedVoucher] = useState<Voucher | null>(null);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [toastMsg, setToastMsg] = useState("");

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 3500);
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [{ data: prods }, { data: custs }, { data: vouchs }] = await Promise.all([
      supabase.from("products").select("*").in("type", ["Treatment Care & Beauty", "Product Care & Beauty", "Treatment", "Retail Produk"]).order("name"),
      supabase.from("customers").select("*").order("name"),
      supabase.from("vouchers").select("*").eq("is_active", true),
    ]);
    setProducts(prods || []);
    setCustomers(custs || []);
    setVouchers(vouchs || []);
    const types = [...new Set((prods || []).map((p: Product) => p.type))];
    setCategories(types);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === product.id);
      if (existing) return prev.map(i => i.id === product.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { ...product, qty: 1 }];
    });
  };

  const updateQty = (id: number, delta: number) => {
    setCart(prev => prev.map(i => i.id === id ? { ...i, qty: Math.max(1, i.qty + delta) } : i));
  };

  const removeFromCart = (id: number) => setCart(prev => prev.filter(i => i.id !== id));

  const subtotal = cart.reduce((acc, i) => acc + i.selling_price * i.qty, 0);
  const discount = (selectedVoucher && selectedCustomer?.is_member && subtotal >= selectedVoucher.min_purchase)
    ? selectedVoucher.discount_amount : 0;
  const total = Math.max(0, subtotal - discount);
  const change = Math.max(0, (parseFloat(paymentAmount) || 0) - total);

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    const paid = parseFloat(paymentAmount);
    if (!paid || paid < total) { showToast("Jumlah bayar kurang!"); return; }
    setProcessing(true);
    try {
      const invoiceNumber = `INV-${Date.now()}`;
      const { data: txn, error: txnErr } = await supabase.from("transactions").insert({
        invoice_number: invoiceNumber,
        customer_id: selectedCustomer?.id || null,
        voucher_id: selectedVoucher?.id || null,
        subtotal, discount_applied: discount, total_amount: total,
        payment: paid, change_amount: change,
      }).select().single();

      if (txnErr) throw txnErr;

      const details = cart.map(i => ({
        transaction_id: txn.id, product_id: i.id,
        quantity: i.qty, price: i.selling_price, subtotal: i.selling_price * i.qty,
      }));
      await supabase.from("transaction_details").insert(details);

      // Update stock untuk Retail Produk saja
      for (const item of cart) {
        if (item.type === "Retail Produk") {
          await supabase.from("products").update({ stock: item.stock - item.qty }).eq("id", item.id);
        }
      }

      setCart([]); setSelectedCustomer(null); setSelectedVoucher(null);
      setPaymentAmount(""); setShowPaymentModal(false);
      showToast(`Transaksi ${invoiceNumber} berhasil!`);
      fetchData();
    } catch (e: any) {
      showToast("Gagal menyimpan transaksi. Periksa koneksi.");
    } finally { setProcessing(false); }
  };

  const filtered = products.filter(p =>
    (activeCategory ? p.type === activeCategory : true) &&
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex h-full overflow-hidden">
      {/* TOAST */}
      {toastMsg && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[999] bg-gray-900 text-white px-6 py-3 rounded-2xl text-sm font-semibold shadow-2xl flex items-center gap-2 animate-fade-in">
          <CheckCircle className="w-4 h-4 text-green-400" /> {toastMsg}
        </div>
      )}

      {/* PRODUK */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Toolbar: Search + Kategori */}
        <div className="px-5 pt-5 pb-3 bg-white border-b border-gray-100 shrink-0 space-y-4">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-lb-rose transition-colors" />
            <input type="text" placeholder="Cari perawatan atau produk..." value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold focus:bg-white focus:border-lb-rose focus:ring-4 focus:ring-rose-50 outline-none transition-all" />
          </div>
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
            {["Semua", ...categories].map(cat => (
              <button key={cat} onClick={() => setActiveCategory(cat === "Semua" ? null : cat)}
                className={`whitespace-nowrap px-5 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all border ${
                  (cat === "Semua" && !activeCategory) || activeCategory === cat
                    ? "bg-lb-rose text-white border-lb-rose shadow-lg shadow-rose-200 scale-105"
                    : "bg-white text-gray-400 border-gray-100 hover:border-lb-rose hover:text-lb-rose"
                }`}>
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Grid Produk */}
        <div className="flex-1 overflow-auto px-6 py-4">
          {loading ? (
            <div className="h-full flex items-center justify-center">
              <Loader2 className="w-10 h-10 text-pink-300 animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 pb-32 md:pb-6">
              {filtered.map(product => (
                <button key={product.id} onClick={() => addToCart(product)} 
                  className="group relative bg-white rounded-3xl border border-gray-100/50 p-2.5 hover:border-lb-rose/30 shadow-premium hover:shadow-rose transition-all duration-300 flex flex-col text-left active:scale-[0.98]">
                  {/* Gambar Produk */}
                  <div className="relative w-full aspect-[4/3] rounded-2xl bg-rose-50 overflow-hidden mb-3">
                    {product.image_url ? (
                      <Image src={product.image_url} alt={product.name} fill className="object-cover group-hover:scale-110 transition-transform duration-700" />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                        <Flower2 className="w-8 h-8 text-rose-200" />
                      </div>
                    )}
                    <div className="absolute top-2 right-2 flex flex-col gap-1">
                      <span className={`text-[8px] font-black px-2 py-1 rounded-full uppercase tracking-widest shadow-sm ${
                        product.type.includes("Treatment") ? "bg-purple-100 text-purple-600" : "bg-emerald-100 text-emerald-600"
                      }`}>{product.type.split(' ')[0]}</span>
                    </div>
                  </div>
                  {/* Info */}
                  <div className="px-1.5 pb-1.5 flex flex-col flex-1">
                    <h3 className="font-black text-gray-800 text-sm leading-tight mb-2 line-clamp-2 h-9">{product.name}</h3>
                    <div className="mt-auto flex items-end justify-between">
                      <div className="flex flex-col">
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">Harga</span>
                        <span className="font-extrabold text-lb-rose text-base leading-none">Rp {product.selling_price.toLocaleString("id-ID")}</span>
                      </div>
                      <div className="w-8 h-8 bg-gray-50 group-hover:bg-lb-rose text-gray-300 group-hover:text-white rounded-xl flex items-center justify-center transition-all duration-300">
                        <Plus className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                </button>
              ))}
              {filtered.length === 0 && !loading && (
                <div className="col-span-full py-16 text-center text-gray-400">
                  <Package className="w-14 h-14 mx-auto mb-3 opacity-20" />
                  <p className="font-medium">Belum ada produk</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* CART (Desktop Sidebar) */}
      <div className="hidden md:flex w-[340px] lg:w-[380px] flex-col bg-white border-l border-gray-100 h-full shrink-0 shadow-2xl relative z-20">
        {/* Cart Header */}
        <div className="px-6 py-5 border-b border-gray-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-lb-rose-light text-lb-rose rounded-2xl flex items-center justify-center shadow-inner">
               <ShoppingCart className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-black text-gray-900 text-base leading-none">Keranjang</h2>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-1">{cart.length} Produk dipilih</p>
            </div>
          </div>
        </div>

        {/* Pilih Pelanggan */}
        <div className="p-4 border-b border-gray-100 bg-pink-50/40">
          {!selectedCustomer ? (
            <button onClick={() => setShowCustomerModal(true)} className="w-full flex items-center justify-center gap-2 text-sm font-semibold text-pink-500 bg-white border border-pink-200 py-2.5 rounded-xl hover:bg-pink-50 transition-all">
              <UserCheck className="w-4 h-4" /> Pilih Pelanggan / Cek Member
            </button>
          ) : (
            <div className="bg-white border border-pink-200 rounded-xl p-3 flex items-start justify-between gap-2">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-white text-sm shrink-0 ${selectedCustomer.is_member ? "bg-gradient-to-br from-amber-400 to-orange-500" : "bg-gray-300"}`}>
                  {selectedCustomer.name.charAt(0)}
                </div>
                  <div>
                    <p className="font-black text-gray-800 text-sm tracking-tight">{selectedCustomer.name}</p>
                    {selectedCustomer.is_member && (
                      <span className="text-[10px] font-black text-lb-gold tracking-widest uppercase flex items-center gap-1.5 mt-0.5">
                        <div className="w-1 h-1 bg-lb-gold rounded-full" /> Member Aktif
                      </span>
                    )}
                  </div>
              </div>
              <button onClick={() => { setSelectedCustomer(null); setSelectedVoucher(null); }} className="text-gray-300 hover:text-red-400 transition-colors mt-0.5">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
          {/* Voucher List */}
          {selectedCustomer?.is_member && vouchers.length > 0 && (
            <div className="mt-3">
              <p className="text-[11px] font-bold text-pink-500 mb-2 tracking-wider uppercase flex items-center gap-1"><Tag className="w-3 h-3"/> Voucher Member</p>
              <div className="flex gap-2 flex-wrap">
                {vouchers.map(v => (
                  <button key={v.id} onClick={() => setSelectedVoucher(selectedVoucher?.id === v.id ? null : v)}
                    className={`text-xs px-3 py-1.5 rounded-lg font-bold border transition-all ${selectedVoucher?.id === v.id ? "bg-[#C94F78] text-white border-[#C94F78]" : "bg-white text-pink-500 border-pink-200 hover:border-pink-400"}`}>
                    {v.code} (Rp {(v.discount_amount / 1000).toFixed(0)}rb)
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-auto p-4 space-y-3">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-300">
              <div className="w-20 h-20 rounded-full bg-pink-50 flex items-center justify-center mb-4">
                <ShoppingCart className="w-9 h-9 text-pink-200" />
              </div>
              <p className="font-semibold text-sm">Keranjang Masih Kosong</p>
              <p className="text-xs mt-1 text-gray-300">Klik produk untuk menambahkan</p>
            </div>
          ) : cart.map(item => (
            <div key={item.id} className="bg-gray-50 rounded-xl p-3 flex gap-3">
              <div className="w-12 h-12 rounded-lg bg-white border border-gray-100 overflow-hidden flex items-center justify-center shrink-0">
                {item.image_url
                  ? <Image src={item.image_url} alt={item.name} width={48} height={48} className="object-cover w-full h-full" />
                  : <Flower2 className="w-6 h-6 text-pink-200" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-800 truncate">{item.name}</p>
                <p className="text-xs text-[#C94F78] font-bold">Rp {item.selling_price.toLocaleString("id-ID")}</p>
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg overflow-hidden">
                    <button onClick={() => updateQty(item.id, -1)} disabled={item.qty <= 1} className="px-2 py-1 text-gray-500 hover:text-gray-800 text-sm font-bold disabled:opacity-40">−</button>
                    <span className="px-2 text-sm font-extrabold text-gray-800">{item.qty}</span>
                    <button onClick={() => updateQty(item.id, 1)} className="px-2 py-1 text-gray-500 hover:text-gray-800 text-sm font-bold">+</button>
                  </div>
                  <button onClick={() => removeFromCart(item.id)} className="text-gray-300 hover:text-red-400 transition-colors p-1">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Total & Checkout */}
        <div className="p-4 border-t border-gray-100 bg-white shadow-[0_-10px_40px_rgba(0,0,0,0.02)]">
          <div className="space-y-1.5 mb-5 text-sm">
            <div className="flex justify-between text-gray-400 font-bold px-1"><span>Subtotal</span><span>Rp {subtotal.toLocaleString("id-ID")}</span></div>
            {discount > 0 && (
              <div className="flex justify-between text-lb-rose font-black bg-rose-50 px-3 py-2 rounded-xl">
                <span className="flex items-center gap-2"><Tag className="w-3.5 h-3.5"/> Promo {selectedVoucher?.code}</span>
                <span>− Rp {discount.toLocaleString("id-ID")}</span>
              </div>
            )}
            <div className="flex justify-between font-black text-gray-900 text-lg pt-4 border-t border-gray-100 px-1">
              <span className="italic tracking-tighter">TOTAL</span>
              <span className="text-lb-rose text-2xl tracking-tighter">Rp {total.toLocaleString("id-ID")}</span>
            </div>
          </div>
          <button onClick={() => setShowPaymentModal(true)} disabled={cart.length === 0}
            className="w-full py-4.5 bg-gray-900 hover:bg-lb-rose text-white font-black rounded-[24px] flex items-center justify-center gap-3 transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed shadow-xl shadow-gray-200 uppercase tracking-widest text-[11px]">
            <CreditCard className="w-5 h-5 text-rose-300" /> Proses Pembayaran
          </button>
        </div>
      </div>

      {/* MOBILE FLOATING CART BUTTON */}
      <div className="md:hidden fixed bottom-24 right-6 left-6 z-40">
        <button onClick={() => setShowPaymentModal(true)} disabled={cart.length === 0}
          className="w-full h-16 bg-lb-rose text-white rounded-[28px] shadow-2xl flex items-center justify-between px-6 active:scale-95 transition-all disabled:opacity-50">
          <div className="flex items-center gap-3">
            <div className="relative">
              <ShoppingCart className="w-6 h-6" />
              <span className="absolute -top-2 -right-2 bg-white text-lb-rose text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full shadow-lg">
                {cart.length}
              </span>
            </div>
            <div className="text-left leading-none">
              <p className="text-[10px] font-bold text-rose-200 uppercase tracking-widest">Total Bayar</p>
              <p className="text-sm font-black mt-1">Rp {total.toLocaleString("id-ID")}</p>
            </div>
          </div>
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>

      {/* Modal Pilih Pelanggan */}
      {showCustomerModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowCustomerModal(false)}>
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-xl font-extrabold text-gray-900">Pilih Pelanggan</h3>
              <button onClick={() => setShowCustomerModal(false)} className="text-gray-400 hover:text-gray-600"><X /></button>
            </div>
            <div className="space-y-2 max-h-80 overflow-auto">
              {customers.map(c => (
                <div key={c.id} onClick={() => { setSelectedCustomer(c); setSelectedVoucher(null); setShowCustomerModal(false); }}
                  className="flex items-center justify-between p-4 border border-gray-100 rounded-2xl cursor-pointer hover:border-pink-300 hover:bg-pink-50 transition-all group">
                  <div>
                    <p className="font-bold text-gray-800 group-hover:text-[#C94F78]">{c.name}</p>
                    <p className="text-sm text-gray-400">{c.phone}</p>
                  </div>
                  {c.is_member && (
                    <span className="text-[10px] bg-amber-100 text-amber-700 font-extrabold px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1">
                      <Crown className="w-3 h-3 fill-amber-700" /> Member
                    </span>
                  )}
                </div>
              ))}
              {customers.length === 0 && <p className="text-center text-gray-400 py-6 text-sm">Belum ada data pelanggan.</p>}
            </div>
          </div>
        </div>
      )}

      {/* Modal Pembayaran */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => !processing && setShowPaymentModal(false)}>
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-extrabold mb-5 text-gray-900">Konfirmasi Pembayaran</h3>
            <div className="bg-pink-50 border border-pink-100 rounded-2xl p-4 mb-5 space-y-2 text-sm">
              <div className="flex justify-between text-gray-600"><span>Total Bayar</span><span className="font-extrabold text-[#C94F78] text-lg">Rp {total.toLocaleString("id-ID")}</span></div>
              {discount > 0 && <div className="flex justify-between text-emerald-600"><span>Diskon</span><span>− Rp {discount.toLocaleString("id-ID")}</span></div>}
            </div>
            <div className="mb-4">
              <label className="block text-sm font-bold text-gray-700 mb-2">Jumlah Diterima (Rp)</label>
              <input type="number" value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)}
                placeholder="Masukkan nominal..."
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-lg font-bold focus:border-[#C94F78] outline-none transition-all"
                autoFocus />
              {parseFloat(paymentAmount) >= total && (
                <p className="mt-2 text-emerald-600 font-bold text-sm">Kembalian: Rp {change.toLocaleString("id-ID")}</p>
              )}
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowPaymentModal(false)} className="flex-1 py-3 border-2 border-gray-200 rounded-xl font-bold text-gray-600 hover:border-gray-300 transition-all">Batal</button>
              <button onClick={handleCheckout} disabled={processing || !paymentAmount || parseFloat(paymentAmount) < total}
                className="flex-1 py-3 bg-[#C94F78] hover:bg-[#A83E60] text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50">
                {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                {processing ? "Memproses..." : "Bayar Sekarang"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
