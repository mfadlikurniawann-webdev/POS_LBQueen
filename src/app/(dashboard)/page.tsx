"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import {
  Search, ShoppingCart, Trash2, Package, CreditCard, UserCheck, X,
  Loader2, Flower2, Plus, Minus, CheckCircle2, Tag, Crown,
  Paintbrush2, Eye, Gem, Sparkles, Heart,
} from "lucide-react";
import Image from "next/image";

type ProductVariant = {
  id: number; product_id: number; variant_name: string;
  price: number; stock: number; is_active: boolean;
};
type Product = {
  id: number; name: string; type: string;
  selling_price: number; stock: number; unit: string;
  image_url: string | null; variants?: ProductVariant[];
};
type Customer = { id: number; name: string; phone: string; is_member: boolean };
type Voucher  = { id: number; code: string; name: string; discount_amount: number; min_purchase: number };
type CartItem = {
  id: number; name: string; type: string; selling_price: number;
  stock: number; unit: string; image_url: string | null;
  qty: number; variant_id?: number | null; variant_name?: string | null;
  cartKey: string;
};

const SELLABLE_TYPES = ["Treatment Care & Beauty", "Product Care & Beauty"];

const TYPE_ICON: Record<string, React.ReactNode> = {
  "Treatment Care & Beauty": <Sparkles className="w-3 h-3" />,
  "Product Care & Beauty": <Package className="w-3 h-3" />,
};

export default function KasirPage() {
  const [products,         setProducts]         = useState<Product[]>([]);
  const [customers,        setCustomers]        = useState<Customer[]>([]);
  const [categories,       setCategories]       = useState<string[]>([]);
  const [activeCategory,   setActiveCategory]   = useState<string | null>(null);
  const [search,           setSearch]           = useState("");
  const [cart,             setCart]             = useState<CartItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showCustomerModal,  setShowCustomerModal]  = useState(false);
  const [showPaymentModal,   setShowPaymentModal]   = useState(false);
  const [showVariantModal,   setShowVariantModal]   = useState(false);
  const [showCartModal,      setShowCartModal]      = useState(false);
  const [variantTarget,      setVariantTarget]      = useState<Product | null>(null);
  const [paymentAmount,    setPaymentAmount]    = useState("");
  const [loading,    setLoading]    = useState(true);
  const [processing, setProcessing] = useState(false);
  const [toastMsg,   setToastMsg]   = useState("");
  const [successTxnId, setSuccessTxnId] = useState<number | null>(null);

  const showToast = (msg: string) => { setToastMsg(msg); setTimeout(() => setToastMsg(""), 3000); };

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [{ data: prods }, { data: custs }] = await Promise.all([
      supabase.from("products").select("*, variants:product_variants(*)").in("type", SELLABLE_TYPES).order("name"),
      supabase.from("customers").select("*").order("name"),
    ]);
    setProducts(prods || []);
    setCustomers(custs || []);
    setCategories([...new Set((prods || []).map((p: Product) => p.type))]);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleProductClick = (product: Product) => {
    const active = (product.variants || []).filter(v => v.is_active);
    if (active.length > 0) { setVariantTarget(product); setShowVariantModal(true); }
    else addToCartDirect(product, null, null, product.selling_price);
  };

  const addToCartDirect = (p: Product, vid: number | null, vname: string | null, price: number) => {
    const key = `${p.id}-${vid ?? "base"}`;
    setCart(prev => {
      const ex = prev.find(i => i.cartKey === key);
      if (ex) return prev.map(i => i.cartKey === key ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, {
        id: p.id, name: p.name, type: p.type, selling_price: price,
        stock: p.stock, unit: p.unit, image_url: p.image_url,
        qty: 1, variant_id: vid, variant_name: vname, cartKey: key,
      }];
    });
  };

  const selectVariant = (v: ProductVariant) => {
    if (!variantTarget) return;
    addToCartDirect(variantTarget, v.id, v.variant_name, v.price);
    setShowVariantModal(false); setVariantTarget(null);
  };

  const updateQty      = (k: string, d: number) => setCart(p => p.map(i => i.cartKey === k ? { ...i, qty: Math.max(1, i.qty + d) } : i));
  const removeFromCart = (k: string)             => setCart(p => p.filter(i => i.cartKey !== k));

  const subtotal = cart.reduce((a, i) => a + i.selling_price * i.qty, 0);
  const total    = subtotal;
  const change   = Math.max(0, (parseFloat(paymentAmount) || 0) - total);

  const handleCheckout = async () => {
    if (!cart.length) return;
    const paid = parseFloat(paymentAmount);
    if (!paid || paid < total) { showToast("Jumlah bayar kurang!"); return; }
    setProcessing(true);
    try {
      const inv = `INV-${Date.now()}`;
      const { data: txn, error } = await supabase.from("transactions").insert({
        invoice_number: inv, customer_id: selectedCustomer?.id || null,
        subtotal, discount_applied: 0, total_amount: total, payment: paid, change_amount: change,
      }).select().single();
      if (error) throw error;

      await supabase.from("transaction_details").insert(
        cart.map(i => ({
          transaction_id: txn.id, product_id: i.id, quantity: i.qty,
          price: i.selling_price, subtotal: i.selling_price * i.qty,
          variant_id: i.variant_id || null, variant_name: i.variant_name || null,
        }))
      );

      // The new structure only has Treatment Care & Beauty, and Kasir only sells this.
      // So all products sold here are not retail materials, but if they are treatments,
      // we don't reduce stock. If they have stock, we could reduce it if needed.
      // But the user said Kasir sells treatments and they might have infinite stock.
      // We will leave the stock reduction logic based on variant or product if they have finite stock.
      for (const item of cart) {
        if (item.variant_id) {
          const v = products.find(p => p.id === item.id)?.variants?.find(v => v.id === item.variant_id);
          if (v && v.stock > 0) await supabase.from("product_variants").update({ stock: v.stock - item.qty }).eq("id", item.variant_id);
        } else {
          const pr = products.find(p => p.id === item.id);
          if (pr && pr.stock > 0) await supabase.from("products").update({ stock: pr.stock - item.qty }).eq("id", pr.id);
        }
      }

      setCart([]); setSelectedCustomer(null); setPaymentAmount("");
      setShowPaymentModal(false);
      setSuccessTxnId(txn.id);
      fetchData();
    } catch { showToast("Gagal menyimpan transaksi."); }
    finally { setProcessing(false); }
  };

  const filtered = products.filter(p =>
    (activeCategory ? p.type === activeCategory : true) &&
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex h-full bg-white overflow-hidden font-sans">

      {/* Toast */}
      {toastMsg && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[100] bg-slate-900 text-white
          px-5 py-3 rounded-xl text-xs font-medium shadow-lg flex items-center gap-2 animate-in fade-in slide-in-from-top-3">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> {toastMsg}
        </div>
      )}

      {/* ── LEFT: Products ── */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-white">

        {/* Search + Filter */}
        <div className="px-5 pt-4 pb-3 border-b border-slate-100">
          <div className="relative mb-3">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
            <input type="text" placeholder="Cari produk atau layanan..."
              value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl
                text-sm text-slate-700 placeholder:text-slate-300 focus:outline-none
                focus:border-[#C94F78] focus:bg-white transition-all" />
          </div>
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {["Semua", ...categories].map(cat => {
              const active = cat === "Semua" ? !activeCategory : activeCategory === cat;
              return (
                <button key={cat} onClick={() => setActiveCategory(cat === "Semua" ? null : cat)}
                  className={`whitespace-nowrap flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all ${
                    active
                      ? "bg-[#C94F78] text-white"
                      : "bg-slate-100 text-slate-500 hover:bg-rose-50 hover:text-[#C94F78]"
                  }`}>
                  {TYPE_ICON[cat]} {cat}
                </button>
              );
            })}
          </div>
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-auto p-5 pb-24 md:pb-5 scrollbar-hide">
          {loading ? (
            <div className="h-full flex items-center justify-center">
              <Loader2 className="w-6 h-6 text-rose-200 animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center gap-2 text-slate-300">
              <Package className="w-10 h-10" strokeWidth={1} />
              <p className="text-sm">Produk tidak ditemukan</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {filtered.map(p => {
                const activeV  = (p.variants || []).filter(v => v.is_active);
                const hasV     = activeV.length > 0;
                const minPrice = hasV ? Math.min(...activeV.map(v => v.price)) : p.selling_price;
                return (
                  <button key={p.id} onClick={() => handleProductClick(p)}
                    className="group bg-white border border-slate-100 rounded-2xl overflow-hidden text-left
                      hover:border-rose-200 hover:shadow-card transition-all duration-200 active:scale-[0.97]">
                    <div className="aspect-square bg-rose-50/40 relative overflow-hidden">
                      {p.image_url ? (
                        <Image src={p.image_url} alt={p.name} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-rose-200">
                          {TYPE_ICON[p.type]
                            ? <span className="scale-[4] opacity-30">{TYPE_ICON[p.type]}</span>
                            : <Flower2 className="w-8 h-8 opacity-30" />}
                        </div>
                      )}
                      <div className="absolute top-2 left-2 bg-white/90 text-[#C94F78] text-[9px] font-medium
                        px-2 py-0.5 rounded-md border border-rose-100 flex items-center gap-1">
                        {TYPE_ICON[p.type]} {p.type.split(" ")[0]}
                      </div>
                      {hasV && (
                        <div className="absolute bottom-2 right-2 bg-[#C94F78] text-white text-[9px]
                          font-medium px-2 py-0.5 rounded-md flex items-center gap-1">
                          <Tag className="w-2.5 h-2.5" /> {activeV.length} varian
                        </div>
                      )}
                    </div>
                    <div className="p-3">
                      <p className="text-[12px] text-slate-700 leading-snug line-clamp-2 mb-1.5
                        group-hover:text-[#C94F78] transition-colors">{p.name}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-[13px] font-semibold text-[#C94F78]">
                          Rp {minPrice.toLocaleString("id-ID")}
                          {hasV && <span className="text-[10px] font-normal text-slate-400">+</span>}
                        </span>
                        <div className="w-6 h-6 rounded-lg bg-rose-50 flex items-center justify-center
                          group-hover:bg-[#C94F78] transition-colors">
                          <Plus className="w-3 h-3 text-[#C94F78] group-hover:text-white transition-colors" />
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── RIGHT: Cart ── */}
      <aside className="hidden md:flex w-[320px] bg-white border-l border-slate-100 flex-col shrink-0">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
          <ShoppingCart className="w-4 h-4 text-[#C94F78]" />
          <div>
            <p className="text-[13px] font-semibold text-slate-800">Keranjang</p>
            <p className="text-[10px] text-slate-400">{cart.length} item</p>
          </div>
        </div>

        {/* Customer */}
        <div className="px-4 py-3 border-b border-slate-50">
          {!selectedCustomer ? (
            <button onClick={() => setShowCustomerModal(true)}
              className="w-full flex items-center gap-2 py-2 px-3 rounded-lg border border-dashed border-rose-200
                text-[#C94F78] text-[12px] hover:bg-rose-50 transition-colors">
              <UserCheck className="w-4 h-4" /> Pilih pelanggan
            </button>
          ) : (
            <div className="flex items-center gap-2.5 px-1">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-medium shrink-0 ${selectedCustomer.is_member ? "bg-orange-400" : "bg-slate-300"}`}>
                {selectedCustomer.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-medium text-slate-700 truncate">{selectedCustomer.name}</p>
                {selectedCustomer.is_member && <p className="text-[10px] text-orange-400">Member</p>}
              </div>
              <button onClick={() => setSelectedCustomer(null)} className="text-slate-300 hover:text-[#C94F78] transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Items */}
        <div className="flex-1 overflow-auto scrollbar-hide p-4 space-y-2">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center gap-2 text-slate-300 pb-8">
              <ShoppingCart className="w-8 h-8" strokeWidth={1} />
              <p className="text-xs">Keranjang kosong</p>
            </div>
          ) : cart.map(item => (
            <div key={item.cartKey} className="flex gap-3 p-2 rounded-xl hover:bg-slate-50 transition-colors">
              <div className="w-11 h-11 rounded-xl overflow-hidden bg-rose-50 shrink-0 border border-rose-100">
                {item.image_url
                  ? <Image src={item.image_url} alt={item.name} width={44} height={44} className="object-cover w-full h-full" />
                  : <div className="w-full h-full flex items-center justify-center text-rose-200"><Flower2 className="w-4 h-4" /></div>}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[12px] text-slate-700 leading-tight truncate">{item.name}</p>
                {item.variant_name && (
                  <p className="text-[10px] text-[#C94F78] flex items-center gap-1 mt-0.5">
                    <Tag className="w-2.5 h-2.5" /> {item.variant_name}
                  </p>
                )}
                <p className="text-[12px] font-semibold text-[#C94F78] mt-0.5">Rp {item.selling_price.toLocaleString("id-ID")}</p>
                <div className="flex items-center justify-between mt-1.5">
                  <div className="flex items-center gap-2 border border-slate-100 rounded-lg px-2 py-0.5 bg-white">
                    <button onClick={() => updateQty(item.cartKey, -1)} className="text-slate-400 hover:text-[#C94F78] p-0.5 transition-colors">
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="text-[12px] text-slate-700 w-4 text-center">{item.qty}</span>
                    <button onClick={() => updateQty(item.cartKey, 1)} className="text-slate-400 hover:text-[#C94F78] p-0.5 transition-colors">
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                  <button onClick={() => removeFromCart(item.cartKey)}
                    className="text-slate-200 hover:text-rose-400 transition-colors p-1">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Total + Button */}
        <div className="p-4 border-t border-slate-100 space-y-3">
          <div className="flex justify-between text-[12px] text-slate-500">
            <span>Subtotal</span>
            <span className="font-medium text-slate-700">Rp {subtotal.toLocaleString("id-ID")}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[11px] text-slate-400 capitalize tracking-wider">Total</span>
            <span className="text-lg font-semibold text-[#C94F78]">Rp {total.toLocaleString("id-ID")}</span>
          </div>
          <button onClick={() => setShowPaymentModal(true)} disabled={!cart.length}
            className={`w-full py-3 rounded-xl text-[12px] font-semibold flex items-center justify-center gap-2 transition-all ${
              cart.length
                ? "bg-[#C94F78] text-white hover:bg-[#A83E60] shadow-pink-sm"
                : "bg-slate-100 text-slate-300 cursor-not-allowed"
            }`}>
            <CreditCard className="w-4 h-4" /> Proses Pembayaran
          </button>
        </div>
      </aside>

      {/* ── VARIANT MODAL ── */}
      {showVariantModal && variantTarget && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm border border-slate-100 shadow-lg animate-in zoom-in-95">
            <div className="p-5 border-b border-slate-50 flex items-start gap-3">
              {variantTarget.image_url && (
                <div className="w-12 h-12 rounded-xl overflow-hidden bg-rose-50 shrink-0">
                  <Image src={variantTarget.image_url} alt={variantTarget.name} width={48} height={48} className="object-cover w-full h-full" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-slate-400 mb-0.5">{variantTarget.type}</p>
                <p className="text-[14px] font-semibold text-slate-800 leading-tight">{variantTarget.name}</p>
              </div>
              <button onClick={() => { setShowVariantModal(false); setVariantTarget(null); }}
                className="text-slate-300 hover:text-slate-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-2">
              <p className="text-[11px] text-slate-400 mb-3">Pilih varian</p>
              {(variantTarget.variants || []).filter(v => v.is_active).map(v => (
                <button key={v.id} onClick={() => selectVariant(v)}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-slate-100
                    hover:border-[#C94F78] hover:bg-rose-50 transition-all group">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center group-hover:bg-[#C94F78] transition-colors">
                      <Tag className="w-3.5 h-3.5 text-[#C94F78] group-hover:text-white transition-colors" />
                    </div>
                    <div className="text-left">
                      <p className="text-[13px] text-slate-700">{v.variant_name}</p>
                      <p className="text-[10px] text-slate-400">Stok: {v.stock}</p>
                    </div>
                  </div>
                  <span className="text-[13px] font-semibold text-[#C94F78]">Rp {v.price.toLocaleString("id-ID")}</span>
                </button>
              ))}
              <button onClick={() => { addToCartDirect(variantTarget, null, null, variantTarget.selling_price); setShowVariantModal(false); setVariantTarget(null); }}
                className="w-full py-2.5 text-[11px] text-slate-400 border border-dashed border-slate-200 rounded-xl hover:border-slate-300 transition-all">
                Tanpa varian — Rp {variantTarget.selling_price.toLocaleString("id-ID")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── CUSTOMER MODAL ── */}
      {showCustomerModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm border border-slate-100 shadow-lg animate-in zoom-in-95">
            <div className="p-5 border-b border-slate-50 flex items-center justify-between">
              <p className="text-[14px] font-semibold text-slate-800">Pilih Pelanggan</p>
              <button onClick={() => setShowCustomerModal(false)} className="text-slate-300 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-3 max-h-72 overflow-auto scrollbar-hide space-y-1">
              {customers.map(c => (
                <button key={c.id} onClick={() => { setSelectedCustomer(c); setShowCustomerModal(false); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-rose-50 transition-colors text-left group">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs shrink-0 ${c.is_member ? "bg-orange-400" : "bg-slate-300"}`}>
                    {c.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] text-slate-700 group-hover:text-[#C94F78] transition-colors">{c.name}</p>
                    <p className="text-[10px] text-slate-400">{c.phone}</p>
                  </div>
                  {c.is_member && <Crown className="w-3.5 h-3.5 text-orange-400 shrink-0" />}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── PAYMENT MODAL ── */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-xs border border-slate-100 shadow-lg animate-in zoom-in-95 p-6">
            <div className="flex items-center justify-between mb-5">
              <p className="text-[14px] font-semibold text-slate-800">Pembayaran</p>
              <button onClick={() => setShowPaymentModal(false)} className="text-slate-300 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="bg-rose-50 border border-rose-100 rounded-xl p-4 mb-4">
              <p className="text-[10px] text-slate-400 mb-1 capitalize tracking-wider">Total Tagihan</p>
              <p className="text-2xl font-semibold text-[#C94F78]">Rp {total.toLocaleString("id-ID")}</p>
            </div>
            <div className="mb-4">
              <label className="label-form">Jumlah Bayar (Rp)</label>
              <input type="number" value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)}
                autoFocus placeholder="0"
                className="w-full px-4 py-3 border-2 border-slate-100 rounded-xl text-lg font-semibold text-slate-700
                  focus:outline-none focus:border-[#C94F78] transition-colors" />
              {parseFloat(paymentAmount) >= total && (
                <div className="flex justify-between mt-3 text-[12px]">
                  <span className="text-slate-400">Kembalian</span>
                  <span className="text-emerald-500 font-semibold">Rp {change.toLocaleString("id-ID")}</span>
                </div>
              )}
            </div>
            <button onClick={handleCheckout}
              disabled={processing || !paymentAmount || parseFloat(paymentAmount) < total}
              className="w-full py-3 bg-[#C94F78] text-white rounded-xl text-[13px] font-semibold
                hover:bg-[#A83E60] transition-colors disabled:opacity-40 shadow-pink-sm">
              {processing ? "Memproses..." : "Konfirmasi Transaksi"}
            </button>
          </div>
        </div>
      )}

      {/* ── SUCCESS TXN MODAL ── */}
      {successTxnId && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[80] flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] w-full max-w-sm shadow-2xl p-8 flex flex-col items-center text-center animate-in zoom-in-95">
            <div className="w-20 h-20 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center mb-6 shadow-inner">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h2 className="text-xl font-semibold text-slate-800 mb-2">Transaksi Berhasil!</h2>
            <p className="text-sm text-slate-500 mb-8">Pembayaran telah diterima dan stok sudah diperbarui.</p>
            
            <div className="w-full flex flex-col gap-3">
              <button onClick={() => {
                  window.open(`/invoice/${successTxnId}`, "_blank");
                  setSuccessTxnId(null);
                }}
                className="w-full py-3.5 bg-[#C94F78] hover:bg-[#A83E60] text-white rounded-xl text-[14px] font-semibold flex items-center justify-center gap-2 transition-all shadow-pink-sm"
              >
                Cetak Invoice Thermal
              </button>
              <button onClick={() => setSuccessTxnId(null)}
                className="w-full py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-[14px] font-semibold transition-all"
              >
                Tutup & Transaksi Baru
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── FLOATING CART (MOBILE) ── */}
      {!showCartModal && !showVariantModal && !showCustomerModal && !showPaymentModal && (
        <button onClick={() => setShowCartModal(true)}
          className="md:hidden fixed bottom-20 left-4 right-4 z-40 bg-[#C94F78] text-white rounded-2xl p-4 flex items-center justify-between shadow-lg animate-in slide-in-from-bottom-4 active:scale-95 transition-transform">
          <div className="flex items-center gap-3">
            <div className="relative">
              <ShoppingCart className="w-5 h-5" />
              <span className="absolute -top-1.5 -right-1.5 bg-white text-[#C94F78] text-[9px] font-semibold w-4 h-4 flex items-center justify-center rounded-full">
                {cart.length}
              </span>
            </div>
            <div className="text-left">
              <p className="text-[10px] opacity-90">Total</p>
              <p className="text-[13px] font-semibold">Rp {total.toLocaleString("id-ID")}</p>
            </div>
          </div>
          <span className="text-[12px] font-semibold flex items-center gap-1">
            Lihat Keranjang
          </span>
        </button>
      )}

      {/* ── MOBILE CART MODAL ── */}
      {showCartModal && (
        <div className="md:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] flex items-end">
          <div className="bg-white w-full rounded-t-3xl max-h-[85vh] flex flex-col animate-in slide-in-from-bottom shadow-2xl">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-rose-50 flex items-center justify-center">
                  <ShoppingCart className="w-4 h-4 text-[#C94F78]" />
                </div>
                <div>
                  <p className="font-semibold text-slate-800 text-[14px]">Keranjang</p>
                  <p className="text-[10px] text-slate-400">{cart.length} item</p>
                </div>
              </div>
              <button onClick={() => setShowCartModal(false)} className="text-slate-400 hover:text-slate-600 p-1 bg-slate-50 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-auto p-5 space-y-4">
              {!selectedCustomer ? (
                <button onClick={() => { setShowCartModal(false); setShowCustomerModal(true); }}
                  className="w-full flex items-center gap-2 py-3 px-4 rounded-xl border border-dashed border-rose-200
                    text-[#C94F78] text-[13px] hover:bg-rose-50 transition-colors font-medium">
                  <UserCheck className="w-4 h-4" /> Pilih Pelanggan
                </button>
              ) : (
                <div className="flex items-center gap-3 p-3 bg-rose-50 rounded-xl border border-rose-100">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-semibold shrink-0 ${selectedCustomer.is_member ? "bg-orange-400" : "bg-slate-300"}`}>
                    {selectedCustomer.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-slate-700 truncate">{selectedCustomer.name}</p>
                    {selectedCustomer.is_member && <p className="text-[10px] text-orange-400 font-medium flex items-center gap-1"><Crown className="w-3 h-3" /> Member</p>}
                  </div>
                  <button onClick={() => setSelectedCustomer(null)} className="text-rose-400 hover:text-rose-600 p-1">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              <div className="space-y-3">
                {cart.map(item => (
                  <div key={item.cartKey} className="flex gap-3 p-3 rounded-xl border border-slate-100 bg-white shadow-sm">
                    <div className="w-14 h-14 rounded-xl overflow-hidden bg-rose-50 shrink-0 border border-rose-100 relative">
                      {item.image_url ? (
                        <Image src={item.image_url} alt={item.name} fill className="object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-rose-200">
                          <Flower2 className="w-5 h-5" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <p className="text-[13px] font-medium text-slate-800 leading-tight truncate">{item.name}</p>
                        {item.variant_name && (
                          <p className="text-[10px] text-[#C94F78] flex items-center gap-1 mt-0.5">
                            <Tag className="w-2.5 h-2.5" /> {item.variant_name}
                          </p>
                        )}
                        <p className="text-[13px] font-semibold text-[#C94F78] mt-1">Rp {item.selling_price.toLocaleString("id-ID")}</p>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-2 border border-slate-100 rounded-lg px-2 py-1 bg-slate-50">
                          <button onClick={() => updateQty(item.cartKey, -1)} className="text-slate-400 hover:text-[#C94F78] p-0.5"><Minus className="w-3 h-3" /></button>
                          <span className="text-[13px] font-medium text-slate-700 w-5 text-center">{item.qty}</span>
                          <button onClick={() => updateQty(item.cartKey, 1)} className="text-slate-400 hover:text-[#C94F78] p-0.5"><Plus className="w-3 h-3" /></button>
                        </div>
                        <button onClick={() => removeFromCart(item.cartKey)} className="text-slate-300 hover:text-rose-500 p-1.5"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-5 border-t border-slate-100 bg-white">
              <div className="flex justify-between items-end mb-4">
                <span className="text-[12px] font-medium text-slate-500">Total Pembayaran</span>
                <span className="text-xl font-semibold text-[#C94F78]">Rp {total.toLocaleString("id-ID")}</span>
              </div>
              <button onClick={() => { setShowCartModal(false); setShowPaymentModal(true); }}
                className="w-full py-3.5 bg-[#C94F78] text-white rounded-xl text-[14px] font-semibold flex items-center justify-center gap-2 hover:bg-[#A83E60] transition-colors shadow-pink-sm">
                <CreditCard className="w-5 h-5" /> Proses Pembayaran
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
