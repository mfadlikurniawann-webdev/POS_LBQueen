"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { Search, ShoppingCart, Trash2, Package, CreditCard, Tag, UserCheck, X, Loader2, CheckCircle, Flower2 } from "lucide-react";
import PageHeader from "@/components/PageHeader";
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
      supabase.from("products").select("*").in("type", ["Treatment", "Retail Produk"]).order("name"),
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
      showToast(`✨ Transaksi ${invoiceNumber} berhasil!`);
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
        {/* Header */}
        <PageHeader title="Terminal Kasir" icon={<ShoppingCart className="w-6 h-6" />} />

        {/* Search Bar */}
        <div className="px-6 pt-4 pb-2 shrink-0">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Cari produk..." value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium focus:border-pink-300 focus:ring-2 focus:ring-pink-100 outline-none transition-all shadow-sm" />
          </div>
        </div>

        {/* Kategori */}
        <div className="px-6 pt-5 pb-2 flex gap-2 overflow-x-auto shrink-0 scrollbar-hide">
          {["Semua", ...categories].map(cat => (
            <button key={cat} onClick={() => setActiveCategory(cat === "Semua" ? null : cat)}
              className={`whitespace-nowrap px-5 py-2 rounded-xl text-sm font-bold transition-all border shadow-sm ${
                (cat === "Semua" && !activeCategory) || activeCategory === cat
                  ? "bg-[#C94F78] text-white border-[#C94F78] shadow-pink-200"
                  : "bg-white text-gray-600 border-gray-200 hover:border-pink-300 hover:text-[#C94F78]"
              }`}>
              {cat}
            </button>
          ))}
        </div>

        {/* Grid Produk */}
        <div className="flex-1 overflow-auto px-6 py-4">
          {loading ? (
            <div className="h-full flex items-center justify-center">
              <Loader2 className="w-10 h-10 text-pink-300 animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 pb-20 md:pb-4">
              {filtered.map(product => (
                <button key={product.id} onClick={() => addToCart(product)} className="group text-left bg-white rounded-2xl border border-gray-100 hover:border-pink-200 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden flex flex-col">
                  {/* Gambar Produk */}
                  <div className="relative w-full aspect-[4/3] bg-gradient-to-br from-pink-50 via-rose-50 to-fuchsia-50 overflow-hidden">
                    {product.image_url ? (
                      <Image src={product.image_url} alt={product.name} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                        <Flower2 className="w-8 h-8 text-pink-200" />
                        <p className="text-[10px] text-pink-200 font-semibold tracking-wide uppercase">No Image</p>
                      </div>
                    )}
                    <div className="absolute top-2 right-2">
                      <span className={`text-[9px] font-extrabold px-2 py-1 rounded-full uppercase tracking-wider ${
                        product.type === "Treatment" ? "bg-purple-100 text-purple-600" : "bg-emerald-100 text-emerald-600"
                      }`}>{product.type}</span>
                    </div>
                  </div>
                  {/* Info */}
                  <div className="p-3 flex-1 flex flex-col">
                    <h3 className="font-bold text-gray-800 text-sm leading-tight mb-1 line-clamp-2">{product.name}</h3>
                    <div className="mt-auto flex items-end justify-between">
                      <span className="font-extrabold text-[#C94F78] text-sm">Rp {product.selling_price.toLocaleString("id-ID")}</span>
                      {product.type === "Retail Produk" && (
                        <span className="text-[10px] text-gray-400 font-semibold">Stok: {product.stock}</span>
                      )}
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

      {/* CART */}
      <div className="hidden md:flex w-[360px] lg:w-[400px] flex-col bg-white border-l border-gray-100 h-full shrink-0">
        {/* Cart Header */}
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-[#C94F78] to-[#A83E60]">
          <h2 className="font-bold text-white flex items-center gap-2 text-lg">
            <ShoppingCart className="w-5 h-5" /> Keranjang
          </h2>
          <span className="bg-white/20 text-white text-xs font-bold px-3 py-1 rounded-full">{cart.length} Item</span>
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
                  <p className="font-bold text-gray-800 text-sm">{selectedCustomer.name}</p>
                  {selectedCustomer.is_member && <span className="text-[10px] font-extrabold text-amber-600 tracking-wider uppercase">✦ Member Aktif</span>}
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
        <div className="p-4 border-t border-gray-100 bg-white">
          <div className="space-y-1.5 mb-4 text-sm">
            <div className="flex justify-between text-gray-500"><span>Subtotal</span><span>Rp {subtotal.toLocaleString("id-ID")}</span></div>
            {discount > 0 && (
              <div className="flex justify-between text-emerald-600 font-semibold bg-emerald-50 px-2 py-1 rounded-lg -mx-2">
                <span className="flex items-center gap-1"><Tag className="w-3 h-3"/> Diskon {selectedVoucher?.code}</span>
                <span>− Rp {discount.toLocaleString("id-ID")}</span>
              </div>
            )}
            <div className="flex justify-between font-extrabold text-gray-900 text-base pt-2 border-t border-gray-100">
              <span>Total</span>
              <span className="text-[#C94F78] text-xl">Rp {total.toLocaleString("id-ID")}</span>
            </div>
          </div>
          <button onClick={() => setShowPaymentModal(true)} disabled={cart.length === 0}
            className="w-full py-3.5 bg-gray-900 hover:bg-[#C94F78] text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed">
            <CreditCard className="w-5 h-5" /> Proses Pembayaran
          </button>
        </div>
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
                  {c.is_member && <span className="text-[10px] bg-amber-100 text-amber-700 font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">✦ Member</span>}
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
