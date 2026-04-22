"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import {
  Search, ShoppingCart, Trash2, Package, CreditCard, UserCheck, X,
  Loader2, Flower2, Plus, Minus, CheckCircle2, Tag, Crown,
  Paintbrush2, Eye, Gem, Sparkles,
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

const RETAIL_TYPES   = ["Retail Nail", "Retail Eyelash", "Retail Beauty"];
const SELLABLE_TYPES = ["Treatment Care & Beauty", "Product Care & Beauty", "Treatment", ...RETAIL_TYPES];

const TYPE_ICON: Record<string, React.ReactNode> = {
  "Treatment":               <Sparkles className="w-3 h-3" />,
  "Treatment Care & Beauty": <Flower2 className="w-3 h-3" />,
  "Product Care & Beauty":   <Package className="w-3 h-3" />,
  "Retail Nail":             <Paintbrush2 className="w-3 h-3" />,
  "Retail Eyelash":          <Eye className="w-3 h-3" />,
  "Retail Beauty":           <Gem className="w-3 h-3" />,
};

const PINK = "#d4508a";

export default function KasirPage() {
  const [products,         setProducts]         = useState<Product[]>([]);
  const [customers,        setCustomers]        = useState<Customer[]>([]);
  const [vouchers,         setVouchers]         = useState<Voucher[]>([]);
  const [categories,       setCategories]       = useState<string[]>([]);
  const [activeCategory,   setActiveCategory]   = useState<string | null>(null);
  const [search,           setSearch]           = useState("");
  const [cart,             setCart]             = useState<CartItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedVoucher,  setSelectedVoucher]  = useState<Voucher | null>(null);
  const [showCustomerModal,  setShowCustomerModal]  = useState(false);
  const [showPaymentModal,   setShowPaymentModal]   = useState(false);
  const [showVariantModal,   setShowVariantModal]   = useState(false);
  const [variantTarget,      setVariantTarget]      = useState<Product | null>(null);
  const [paymentAmount,    setPaymentAmount]    = useState("");
  const [loading,    setLoading]    = useState(true);
  const [processing, setProcessing] = useState(false);
  const [toastMsg,   setToastMsg]   = useState("");

  const showToast = (msg: string) => { setToastMsg(msg); setTimeout(() => setToastMsg(""), 3500); };

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [{ data: prods }, { data: custs }, { data: vouchs }] = await Promise.all([
      supabase.from("products").select("*, variants:product_variants(*)").in("type", SELLABLE_TYPES).order("name"),
      supabase.from("customers").select("*").order("name"),
      supabase.from("vouchers").select("*").eq("is_active", true),
    ]);
    setProducts(prods || []);
    setCustomers(custs || []);
    setVouchers(vouchs || []);
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
      return [...prev, { id: p.id, name: p.name, type: p.type, selling_price: price,
        stock: p.stock, unit: p.unit, image_url: p.image_url, qty: 1,
        variant_id: vid, variant_name: vname, cartKey: key }];
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
  const discount = selectedVoucher && selectedCustomer?.is_member && subtotal >= selectedVoucher.min_purchase
    ? selectedVoucher.discount_amount : 0;
  const total  = Math.max(0, subtotal - discount);
  const change = Math.max(0, (parseFloat(paymentAmount) || 0) - total);

  const handleCheckout = async () => {
    if (!cart.length) return;
    const paid = parseFloat(paymentAmount);
    if (!paid || paid < total) { showToast("Jumlah bayar kurang!"); return; }
    setProcessing(true);
    try {
      const inv = `INV-${Date.now()}`;
      const { data: txn, error } = await supabase.from("transactions").insert({
        invoice_number: inv, customer_id: selectedCustomer?.id || null,
        voucher_id: selectedVoucher?.id || null, subtotal,
        discount_applied: discount, total_amount: total, payment: paid, change_amount: change,
      }).select().single();
      if (error) throw error;

      await supabase.from("transaction_details").insert(
        cart.map(i => ({ transaction_id: txn.id, product_id: i.id, quantity: i.qty,
          price: i.selling_price, subtotal: i.selling_price * i.qty,
          variant_id: i.variant_id || null, variant_name: i.variant_name || null }))
      );

      for (const item of cart) {
        if (RETAIL_TYPES.includes(item.type)) {
          if (item.variant_id) {
            const v = products.find(p => p.id === item.id)?.variants?.find(v => v.id === item.variant_id);
            if (v) await supabase.from("product_variants").update({ stock: v.stock - item.qty }).eq("id", item.variant_id);
          } else {
            const p = products.find(p => p.id === item.id);
            if (p) await supabase.from("products").update({ stock: p.stock - item.qty }).eq("id", p.id);
          }
        }
      }

      setCart([]); setSelectedCustomer(null); setSelectedVoucher(null);
      setPaymentAmount(""); setShowPaymentModal(false);
      showToast(`Transaksi ${inv} berhasil`);
      fetchData();
    } catch { showToast("Gagal menyimpan transaksi."); }
    finally { setProcessing(false); }
  };

  const filtered = products.filter(p =>
    (activeCategory ? p.type === activeCategory : true) &&
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex h-full overflow-hidden bg-[#fdfcfc]">

      {/* Toast */}
      {toastMsg && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-2.5
          bg-white border border-[#f0ecec] shadow-soft px-5 py-3 rounded-xl text-[12px] text-[#3d3939]
          animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="w-4 h-4 text-[#d4508a] shrink-0" />
          {toastMsg}
        </div>
      )}

      {/* ── LEFT: Products ── */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">

        {/* Search */}
        <div className="px-6 pt-5 pb-3 shrink-0">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#ccc8c8]" />
            <input type="text" placeholder="Cari produk atau perawatan..."
              value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 bg-white border border-[#f0ecec] rounded-xl
                text-sm text-[#3d3939] placeholder:text-[#ccc8c8]
                focus:outline-none focus:border-[#e8719a] transition-colors" />
          </div>
        </div>

        {/* Category Filter */}
        <div className="px-6 pb-3 flex gap-2 overflow-x-auto scrollbar-hide shrink-0">
          {["Semua", ...categories].map(cat => {
            const active = cat === "Semua" ? !activeCategory : activeCategory === cat;
            return (
              <button key={cat} onClick={() => setActiveCategory(cat === "Semua" ? null : cat)}
                className={`whitespace-nowrap flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-[11px] transition-all ${
                  active
                    ? "bg-[#fff0f5] text-[#d4508a] border border-[#ffd6e7] font-medium"
                    : "text-[#a8a4a4] border border-transparent hover:text-[#d4508a] hover:bg-[#fff8fb]"
                }`}>
                {TYPE_ICON[cat] && <span className="opacity-70">{TYPE_ICON[cat]}</span>}
                {cat}
              </button>
            );
          })}
        </div>

        {/* Product Grid */}
        <div className="flex-1 overflow-auto px-6 pb-24 md:pb-6 scrollbar-hide">
          {loading ? (
            <div className="h-full flex items-center justify-center">
              <Loader2 className="w-6 h-6 text-[#e8b4c8] animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center gap-2 text-[#d4c8cc]">
              <Package className="w-10 h-10" strokeWidth={1} />
              <p className="text-sm">Produk tidak ditemukan</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 pt-1">
              {filtered.map(p => {
                const activeV = (p.variants || []).filter(v => v.is_active);
                const hasV    = activeV.length > 0;
                const minPrice = hasV ? Math.min(...activeV.map(v => v.price)) : p.selling_price;
                return (
                  <button key={p.id} onClick={() => handleProductClick(p)}
                    className="group bg-white border border-[#f5f2f2] rounded-2xl overflow-hidden
                      text-left transition-all duration-200 hover:border-[#ffd6e7] hover:shadow-card-hover
                      active:scale-[0.98]">
                    {/* Image */}
                    <div className="aspect-square bg-[#fff8fb] relative overflow-hidden">
                      {p.image_url ? (
                        <Image src={p.image_url} alt={p.name} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[#f5d0e0]">
                          {TYPE_ICON[p.type] ? <span className="scale-[3.5] opacity-40">{TYPE_ICON[p.type]}</span> : <Flower2 className="w-8 h-8 opacity-30" />}
                        </div>
                      )}
                      {/* Type badge */}
                      <div className="absolute top-2 left-2">
                        <span className="flex items-center gap-1 bg-white/90 backdrop-blur-sm
                          text-[#d4508a] text-[9px] font-medium px-2 py-0.5 rounded-md border border-[#ffd6e7]">
                          {TYPE_ICON[p.type]}
                          {p.type.split(" ")[0]}
                        </span>
                      </div>
                      {hasV && (
                        <div className="absolute bottom-2 right-2">
                          <span className="flex items-center gap-1 bg-[#d4508a] text-white text-[9px] px-2 py-0.5 rounded-md">
                            <Tag className="w-2.5 h-2.5" /> {activeV.length}
                          </span>
                        </div>
                      )}
                    </div>
                    {/* Info */}
                    <div className="p-3">
                      <p className="text-[13px] text-[#3d3939] leading-snug line-clamp-2 mb-2 font-normal group-hover:text-[#d4508a] transition-colors">
                        {p.name}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-[13px] font-semibold text-[#d4508a]">
                          Rp {minPrice.toLocaleString("id-ID")}
                          {hasV && <span className="text-[10px] font-normal text-[#ccc8c8]">+</span>}
                        </span>
                        <div className="w-7 h-7 rounded-lg bg-[#fff0f5] flex items-center justify-center
                          group-hover:bg-[#d4508a] transition-colors">
                          {hasV
                            ? <Tag className="w-3 h-3 text-[#e8b4c8] group-hover:text-white transition-colors" />
                            : <Plus className="w-3 h-3 text-[#e8b4c8] group-hover:text-white transition-colors" />
                          }
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
      <div className="hidden md:flex w-[340px] bg-white border-l border-[#f5f2f2] flex-col shrink-0">

        {/* Cart Header */}
        <div className="px-5 py-4 border-b border-[#f5f2f2] flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#fff0f5] flex items-center justify-center">
            <ShoppingCart className="w-4 h-4 text-[#d4508a]" />
          </div>
          <div>
            <p className="text-[13px] font-semibold text-[#2d2820]">Keranjang</p>
            <p className="text-[10px] text-[#ccc8c8]">{cart.length} item</p>
          </div>
        </div>

        {/* Customer Selector */}
        <div className="px-4 py-3 border-b border-[#f5f2f2]">
          {!selectedCustomer ? (
            <button onClick={() => setShowCustomerModal(true)}
              className="w-full flex items-center gap-2 py-2 px-3 rounded-lg border border-dashed
                border-[#ffd6e7] text-[#d4508a] text-[12px] hover:bg-[#fff8fb] transition-colors">
              <UserCheck className="w-4 h-4" />
              <span>Pilih pelanggan / member</span>
            </button>
          ) : (
            <div className="flex items-center gap-3 px-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium shrink-0 ${selectedCustomer.is_member ? "bg-amber-400" : "bg-[#d4c8cc]"}`}>
                {selectedCustomer.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[12px] text-[#3d3939] font-medium truncate">{selectedCustomer.name}</p>
                {selectedCustomer.is_member && <p className="text-[10px] text-amber-500">Member</p>}
              </div>
              <button onClick={() => { setSelectedCustomer(null); setSelectedVoucher(null); }}
                className="text-[#ccc8c8] hover:text-[#d4508a] transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-auto scrollbar-hide px-4 py-3 space-y-2">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center gap-3 text-[#d4c8cc] pb-8">
              <ShoppingCart className="w-8 h-8" strokeWidth={1} />
              <p className="text-[12px]">Keranjang kosong</p>
            </div>
          ) : cart.map(item => (
            <div key={item.cartKey}
              className="flex gap-3 p-2.5 rounded-xl hover:bg-[#fff8fb] transition-colors group">
              <div className="w-12 h-12 rounded-xl overflow-hidden bg-[#fff0f5] shrink-0 border border-[#f5d8e8]">
                {item.image_url
                  ? <Image src={item.image_url} alt={item.name} width={48} height={48} className="object-cover w-full h-full" />
                  : <div className="w-full h-full flex items-center justify-center text-[#f5c0d8]"><Flower2 className="w-5 h-5" /></div>
                }
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[12px] text-[#3d3939] leading-tight truncate mb-0.5">{item.name}</p>
                {item.variant_name && (
                  <p className="text-[10px] text-[#d4508a] flex items-center gap-1 mb-1">
                    <Tag className="w-2.5 h-2.5" />{item.variant_name}
                  </p>
                )}
                <p className="text-[12px] font-medium text-[#d4508a]">Rp {item.selling_price.toLocaleString("id-ID")}</p>
                <div className="flex items-center justify-between mt-1.5">
                  <div className="flex items-center gap-2 border border-[#f0ecec] rounded-lg px-2 py-0.5 bg-white">
                    <button onClick={() => updateQty(item.cartKey, -1)} className="text-[#ccc8c8] hover:text-[#d4508a] transition-colors p-0.5">
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="text-[12px] text-[#3d3939] w-4 text-center">{item.qty}</span>
                    <button onClick={() => updateQty(item.cartKey, 1)} className="text-[#ccc8c8] hover:text-[#d4508a] transition-colors p-0.5">
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                  <button onClick={() => removeFromCart(item.cartKey)}
                    className="text-[#e0d8d8] hover:text-rose-400 transition-colors p-1">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Summary + Checkout */}
        <div className="p-4 border-t border-[#f5f2f2] space-y-3">
          <div className="space-y-1.5 text-[12px]">
            <div className="flex justify-between text-[#a8a4a4]">
              <span>Subtotal</span>
              <span>Rp {subtotal.toLocaleString("id-ID")}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-emerald-500">
                <span>Diskon member</span>
                <span>- Rp {discount.toLocaleString("id-ID")}</span>
              </div>
            )}
          </div>
          <div className="flex justify-between items-center py-2 border-t border-[#f5f2f2]">
            <span className="text-[11px] text-[#a8a4a4] uppercase tracking-wider">Total</span>
            <span className="text-xl font-semibold text-[#d4508a]">Rp {total.toLocaleString("id-ID")}</span>
          </div>
          <button onClick={() => setShowPaymentModal(true)} disabled={!cart.length}
            className={`w-full py-3 rounded-xl text-[12px] font-medium flex items-center justify-center gap-2 transition-all ${
              cart.length
                ? "bg-[#d4508a] text-white hover:bg-[#b83b72] shadow-pink"
                : "bg-[#f5f2f2] text-[#ccc8c8] cursor-not-allowed"
            }`}>
            <CreditCard className="w-4 h-4" /> Proses Pembayaran
          </button>
        </div>
      </div>

      {/* ── VARIANT MODAL ── */}
      {showVariantModal && variantTarget && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-[2px] z-[70] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-soft border border-[#f0ecec] animate-in zoom-in-95">
            <div className="p-5 border-b border-[#f5f2f2] flex items-start justify-between">
              <div className="flex items-start gap-3 min-w-0">
                {variantTarget.image_url && (
                  <div className="w-12 h-12 rounded-xl overflow-hidden bg-[#fff0f5] shrink-0">
                    <Image src={variantTarget.image_url} alt={variantTarget.name} width={48} height={48} className="object-cover w-full h-full" />
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-[10px] text-[#ccc8c8] mb-0.5">{variantTarget.type}</p>
                  <p className="text-[14px] font-medium text-[#2d2820] leading-tight">{variantTarget.name}</p>
                </div>
              </div>
              <button onClick={() => { setShowVariantModal(false); setVariantTarget(null); }}
                className="text-[#ccc8c8] hover:text-[#3d3939] transition-colors ml-3 shrink-0">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-2">
              <p className="text-[10px] text-[#a8a4a4] mb-3">Pilih varian</p>
              {(variantTarget.variants || []).filter(v => v.is_active).map(v => (
                <button key={v.id} onClick={() => selectVariant(v)}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-xl
                    border border-[#f5f2f2] hover:border-[#ffd6e7] hover:bg-[#fff8fb] transition-all group">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#fff0f5] flex items-center justify-center group-hover:bg-[#ffd6e7] transition-colors">
                      <Tag className="w-3.5 h-3.5 text-[#d4508a]" />
                    </div>
                    <div className="text-left">
                      <p className="text-[13px] text-[#3d3939]">{v.variant_name}</p>
                      <p className="text-[10px] text-[#ccc8c8]">Stok: {v.stock}</p>
                    </div>
                  </div>
                  <span className="text-[13px] font-medium text-[#d4508a]">Rp {v.price.toLocaleString("id-ID")}</span>
                </button>
              ))}
              <button onClick={() => { addToCartDirect(variantTarget, null, null, variantTarget.selling_price); setShowVariantModal(false); setVariantTarget(null); }}
                className="w-full py-2.5 text-[11px] text-[#a8a4a4] border border-dashed border-[#e5e1e1] rounded-xl hover:text-[#3d3939] hover:border-[#ccc8c8] transition-all mt-1">
                Tanpa varian — Rp {variantTarget.selling_price.toLocaleString("id-ID")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── CUSTOMER MODAL ── */}
      {showCustomerModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-[2px] z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-soft border border-[#f0ecec] animate-in zoom-in-95">
            <div className="p-5 border-b border-[#f5f2f2] flex items-center justify-between">
              <p className="text-[14px] font-medium text-[#2d2820]">Pilih Pelanggan</p>
              <button onClick={() => setShowCustomerModal(false)} className="text-[#ccc8c8] hover:text-[#3d3939] transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-3 max-h-80 overflow-auto scrollbar-hide space-y-1">
              {customers.map(c => (
                <button key={c.id} onClick={() => { setSelectedCustomer(c); setShowCustomerModal(false); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[#fff8fb] transition-colors group text-left">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm shrink-0 ${c.is_member ? "bg-amber-400" : "bg-[#d4c8cc]"}`}>
                    {c.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] text-[#3d3939] group-hover:text-[#d4508a] transition-colors">{c.name}</p>
                    <p className="text-[10px] text-[#ccc8c8]">{c.phone}</p>
                  </div>
                  {c.is_member && <Crown className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── PAYMENT MODAL ── */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-[2px] z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-xs shadow-soft border border-[#f0ecec] animate-in zoom-in-95 p-6">
            <div className="flex items-center justify-between mb-5">
              <p className="text-[14px] font-medium text-[#2d2820]">Pembayaran</p>
              <button onClick={() => setShowPaymentModal(false)} className="text-[#ccc8c8] hover:text-[#3d3939]">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="bg-[#fff8fb] border border-[#ffd6e7] rounded-xl p-4 mb-4">
              <p className="text-[10px] text-[#ccc8c8] mb-1">Total tagihan</p>
              <p className="text-2xl font-semibold text-[#d4508a]">Rp {total.toLocaleString("id-ID")}</p>
            </div>
            <div className="mb-4">
              <label className="label-form">Jumlah bayar (Rp)</label>
              <input type="number" value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)}
                autoFocus placeholder="0"
                className="w-full px-4 py-3 border border-[#f0ecec] rounded-xl text-lg font-medium text-[#3d3939]
                  focus:outline-none focus:border-[#e8719a] transition-colors" />
              {parseFloat(paymentAmount) >= total && (
                <div className="flex justify-between mt-3 text-[12px]">
                  <span className="text-[#a8a4a4]">Kembalian</span>
                  <span className="text-emerald-500 font-medium">Rp {change.toLocaleString("id-ID")}</span>
                </div>
              )}
            </div>
            <button onClick={handleCheckout}
              disabled={processing || !paymentAmount || parseFloat(paymentAmount) < total}
              className="w-full py-3 bg-[#d4508a] text-white rounded-xl text-[12px] font-medium
                hover:bg-[#b83b72] transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-pink">
              {processing ? "Memproses..." : "Konfirmasi Transaksi"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
