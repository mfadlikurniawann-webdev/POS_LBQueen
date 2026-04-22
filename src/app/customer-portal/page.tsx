"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import {
  MessageCircle, Sparkles, ChevronRight, BadgeCheck, Loader2, Flower2,
  Crown, Gift, Package, Ticket, MessageSquare,
  Plus, Minus, ShoppingBag, X, Star, Paintbrush2, Eye, Gem,
} from "lucide-react";
import Image from "next/image";
import { useCart } from "@/context/CartContext";

type Product = {
  id: number;
  name: string;
  type: string;
  selling_price: number;
  image_url: string | null;
  product_code: string;
  is_set: boolean;
  voucher_discount?: number;
};

const WA_NUMBER = "6282176171448";

const SELLABLE_TYPES = [
  "Treatment Care & Beauty",
  "Product Care & Beauty",
  "Treatment",
  "Retail Nail",
  "Retail Eyelash",
  "Retail Beauty",
];

const CATEGORY_CONFIG = [
  {
    label: "Treatment",
    icon: <Sparkles className="w-5 h-5" />,
    bg: "bg-rose-50",
    iconColor: "text-[#C94F78]",
    type: "Treatment Care & Beauty",
  },
  {
    label: "Skincare",
    icon: <Gem className="w-5 h-5" />,
    bg: "bg-purple-50",
    iconColor: "text-purple-500",
    type: "Product Care & Beauty",
  },
  {
    label: "Nail Art",
    icon: <Paintbrush2 className="w-5 h-5" />,
    bg: "bg-red-50",
    iconColor: "text-red-400",
    type: "Retail Nail",
  },
  {
    label: "Eyelash",
    icon: <Eye className="w-5 h-5" />,
    bg: "bg-violet-50",
    iconColor: "text-violet-400",
    type: "Retail Eyelash",
  },
  {
    label: "Beauty",
    icon: <Flower2 className="w-5 h-5" />,
    bg: "bg-pink-50",
    iconColor: "text-pink-400",
    type: "Retail Beauty",
  },
  {
    label: "Konsultasi",
    icon: <MessageSquare className="w-5 h-5" />,
    bg: "bg-emerald-50",
    iconColor: "text-emerald-500",
    type: null,
  },
];

export default function CustomerPortalPage() {
  const { cart, addToCart, removeFromCart, updateQty, clearCart, totalItems } = useCart();
  const [products,       setProducts]       = useState<Product[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [loading,        setLoading]        = useState(true);
  const [customer,       setCustomer]       = useState<any>(null);
  const [showCart,       setShowCart]       = useState(false);
  const [processing,     setProcessing]     = useState(false);
  const [activeTab,      setActiveTab]      = useState<"semua" | "promo" | "set">("semua");

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [{ data: prods }, { data: vouchs }] = await Promise.all([
      supabase.from("products").select("*").in("type", SELLABLE_TYPES).order("name"),
      supabase.from("vouchers").select("product_id, discount_amount").eq("is_active", true),
    ]);
    if (prods) {
      setProducts(prods.map((p: any) => {
        const v = vouchs?.find((v: any) => v.product_id === p.id);
        return { ...p, voucher_discount: v ? v.discount_amount : 0 };
      }));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
    const stored = localStorage.getItem("lbqueen_customer");
    if (stored) { try { setCustomer(JSON.parse(stored)); } catch {} }
  }, [fetchData]);

  const handleWAOrder = async () => {
    if (!customer || cart.length === 0) return;
    setProcessing(true);
    try {
      await supabase.from("customer_orders").insert(
        cart.map(item => ({
          customer_id: customer.id, customer_name: customer.name,
          product_id: item.id, product_name: `${item.name} (x${item.qty})`, status: "pending",
        }))
      );
      let grandTotal = 0;
      let msg = `Halo LBQueen! Saya *${customer.name}*${customer.is_member ? " (Member)" : ""}.\n\nPesanan saya:\n\n`;
      cart.forEach((item, i) => {
        const lineTotal = (item.price - (item.voucher_discount || 0)) * item.qty;
        grandTotal += lineTotal;
        msg += `${i + 1}. *${item.name}* (x${item.qty})\n   Rp ${lineTotal.toLocaleString("id-ID")}\n`;
      });
      msg += `\n*Total: Rp ${grandTotal.toLocaleString("id-ID")}*\n\nMohon konfirmasi. Terima kasih!`;
      clearCart(); setShowCart(false);
      window.open(`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(msg)}`, "_blank");
    } catch (e) { console.error(e); }
    finally { setProcessing(false); }
  };

  const cartTotal = cart.reduce((a, i) => a + (i.price - (i.voucher_discount || 0)) * i.qty, 0);

  const filtered = products.filter(p => {
    const matchCat = activeCategory ? p.type === activeCategory : true;
    if (activeTab === "promo") return matchCat && (p.voucher_discount ?? 0) > 0;
    if (activeTab === "set")   return matchCat && p.is_set;
    return matchCat;
  });

  return (
    <div className="min-h-screen bg-[#F5F5F5] font-sans pb-24">

      {/* ── GREETING BANNER (Gojek-style pink gradient) ── */}
      <section className="bg-gradient-to-br from-[#C94F78] to-[#A83E60] px-5 pt-5 pb-16 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-40 h-40 bg-white/5 rounded-bl-full" />
        <div className="absolute right-8 bottom-0 w-24 h-24 bg-white/5 rounded-full" />

        {/* Welcome text */}
        <div className="relative z-10 mb-4">
          <p className="text-white/70 text-xs font-medium mb-1">
            Hai, {customer?.name?.split(" ")[0] || "Pelanggan"} 👋
          </p>
          <h2 className="text-white text-[18px] font-bold leading-snug">
            Mau perawatan apa<br />hari ini?
          </h2>
        </div>

        {/* Search bar */}
        <div className="relative z-10">
          <div className="bg-white rounded-xl px-4 py-3 flex items-center gap-3 shadow-md">
            <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <span className="text-sm text-gray-400">Cari layanan atau produk...</span>
          </div>
        </div>
      </section>

      {/* ── MAIN CONTENT ── (negative margin to overlap banner) */}
      <div className="px-4 -mt-8 relative z-10">

        {/* ── PROMO BANNER CARD ── */}
        <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 mb-4">
          <div className="relative aspect-[16/6] bg-gradient-to-r from-[#C94F78] to-[#8B2E4E] overflow-hidden">
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1570172619666-114317a402f6?auto=format&fit=crop&q=80&w=800')] bg-cover bg-center opacity-20" />
            <div className="absolute inset-0 flex items-center justify-between px-6">
              <div>
                <span className="bg-white/20 text-white text-[9px] font-semibold px-2 py-0.5 rounded-full inline-block mb-2">
                  Spesial Member
                </span>
                <h3 className="text-white text-lg font-bold leading-tight">Glowing<br />Package</h3>
                <p className="text-white/70 text-[10px] mt-1">Disc. s/d 50% • Member Only</p>
              </div>
              <button className="bg-white text-[#C94F78] text-[11px] font-semibold px-4 py-2 rounded-xl flex items-center gap-1 shadow-sm">
                Lihat <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>

        {/* ── CATEGORY ICONS (Gojek-style) ── */}
        <div className="bg-white rounded-2xl p-4 mb-4 shadow-sm border border-gray-100">
          <div className="grid grid-cols-3 gap-4">
            {CATEGORY_CONFIG.map(cat => {
              const active = activeCategory === cat.type;
              return (
                <button key={cat.label}
                  onClick={() => setActiveCategory(active ? null : cat.type)}
                  className="flex flex-col items-center gap-2">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
                    active ? "bg-[#C94F78] shadow-lg shadow-rose-200" : cat.bg
                  }`}>
                    <span className={active ? "text-white" : cat.iconColor}>{cat.icon}</span>
                  </div>
                  <span className={`text-[10px] font-medium ${active ? "text-[#C94F78]" : "text-gray-500"}`}>
                    {cat.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── MEMBER CARD ── */}
        {customer && (
          <div className="bg-white rounded-2xl p-4 mb-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                customer.is_member ? "bg-amber-400" : "bg-slate-200"
              }`}>
                {customer.is_member
                  ? <Crown className="w-5 h-5 text-white" />
                  : <span className="text-white text-sm font-bold">{customer.name.charAt(0)}</span>
                }
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-[13px] font-semibold text-gray-800 truncate">{customer.name}</p>
                  {customer.is_member && <BadgeCheck className="w-4 h-4 text-amber-400 shrink-0" />}
                </div>
                <p className="text-[11px] text-[#C94F78] font-medium mt-0.5">
                  {customer.is_member ? "Gold Member" : "Pelanggan Reguler"}
                </p>
              </div>
              <div className="flex items-center gap-2 bg-rose-50 border border-rose-100 px-3 py-2 rounded-xl">
                <Gift className="w-4 h-4 text-[#C94F78]" />
                <div>
                  <p className="text-[9px] text-gray-400 leading-none">Points</p>
                  <p className="text-[12px] font-bold text-[#C94F78]">1.250</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── PRODUCT LIST ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Tab bar */}
          <div className="flex border-b border-gray-100">
            {[
              { key: "semua", label: "Semua" },
              { key: "promo", label: "Promo" },
              { key: "set",   label: "Paket Set" },
            ].map(tab => (
              <button key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`flex-1 py-3 text-[12px] font-medium transition-colors border-b-2 ${
                  activeTab === tab.key
                    ? "border-[#C94F78] text-[#C94F78]"
                    : "border-transparent text-gray-400 hover:text-gray-600"
                }`}>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Product grid */}
          <div className="p-3">
            {loading ? (
              <div className="py-16 flex flex-col items-center gap-3">
                <Loader2 className="w-6 h-6 text-rose-300 animate-spin" />
                <p className="text-xs text-gray-400">Memuat produk...</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="py-16 flex flex-col items-center gap-2 text-gray-300">
                <ShoppingBag className="w-10 h-10" strokeWidth={1} />
                <p className="text-xs">Tidak ada produk</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {filtered.map(product => {
                  const inCart = cart.find(i => i.id === product.id);
                  const finalPrice = product.selling_price - (product.voucher_discount || 0);
                  const hasDiscount = (product.voucher_discount || 0) > 0;
                  return (
                    <div key={product.id} className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
                      {/* Image */}
                      <div className="aspect-square bg-rose-50 relative overflow-hidden">
                        {product.image_url ? (
                          <Image src={product.image_url} alt={product.name} fill className="object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-rose-200">
                            <Flower2 className="w-10 h-10 opacity-30" />
                          </div>
                        )}
                        {/* Badges */}
                        <div className="absolute top-2 left-2 flex flex-col gap-1">
                          {product.is_set && (
                            <span className="bg-amber-400 text-white text-[8px] font-semibold px-2 py-0.5 rounded-full">Set</span>
                          )}
                          {hasDiscount && (
                            <span className="bg-[#C94F78] text-white text-[8px] font-semibold px-2 py-0.5 rounded-full">Promo</span>
                          )}
                        </div>
                      </div>
                      {/* Info */}
                      <div className="p-3">
                        <p className="text-[12px] font-medium text-gray-700 leading-tight line-clamp-2 mb-1.5">
                          {product.name}
                        </p>
                        {/* Rating placeholder */}
                        <div className="flex items-center gap-1 mb-2">
                          <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                          <span className="text-[10px] text-gray-400 font-medium">5.0</span>
                        </div>
                        <div className="flex items-end justify-between">
                          <div>
                            {hasDiscount && (
                              <p className="text-[10px] text-gray-300 line-through leading-none mb-0.5">
                                Rp {product.selling_price.toLocaleString("id-ID")}
                              </p>
                            )}
                            <p className="text-[13px] font-bold text-[#C94F78]">
                              Rp {finalPrice.toLocaleString("id-ID")}
                            </p>
                          </div>

                          {inCart ? (
                            <div className="flex items-center gap-2 bg-rose-50 border border-rose-100 rounded-xl px-1.5 py-1">
                              <button onClick={() => inCart.qty === 1 ? removeFromCart(product.id) : updateQty(product.id, inCart.qty - 1)}
                                className="w-5 h-5 flex items-center justify-center text-[#C94F78]">
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="text-[12px] font-bold text-[#C94F78] w-4 text-center">{inCart.qty}</span>
                              <button onClick={() => updateQty(product.id, inCart.qty + 1)}
                                className="w-5 h-5 flex items-center justify-center text-[#C94F78]">
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                          ) : (
                            <button onClick={() => addToCart(product, 1)}
                              className="w-8 h-8 bg-[#C94F78] text-white rounded-xl flex items-center justify-center shadow-sm hover:bg-[#A83E60] transition-colors active:scale-95">
                              <Plus className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── FLOATING CART BUTTON (Gojek-style) ── */}
      {totalItems > 0 && !showCart && (
        <div className="fixed bottom-20 left-0 right-0 px-4 z-50">
          <button onClick={() => setShowCart(true)}
            className="w-full bg-[#C94F78] text-white px-5 py-4 rounded-2xl shadow-lg shadow-rose-200
              flex items-center justify-between active:scale-[0.98] transition-all">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 bg-white/20 rounded-lg flex items-center justify-center relative">
                <ShoppingBag className="w-4 h-4" />
                <span className="absolute -top-1.5 -right-1.5 bg-white text-[#C94F78] text-[9px] font-bold w-4 h-4 flex items-center justify-center rounded-full">
                  {totalItems}
                </span>
              </div>
              <span className="text-sm font-semibold">{totalItems} item dipilih</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold">Rp {cartTotal.toLocaleString("id-ID")}</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </button>
        </div>
      )}

      {/* ── CART SHEET (Gojek bottom sheet style) ── */}
      {showCart && (
        <div className="fixed inset-0 z-[100] flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowCart(false)} />
          <div className="relative bg-white rounded-t-3xl shadow-2xl max-h-[85vh] flex flex-col">
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-4 shrink-0">
              <div className="w-10 h-1 bg-gray-200 rounded-full" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 pb-4 border-b border-gray-100 shrink-0">
              <h3 className="text-[15px] font-semibold text-gray-800">Keranjang Saya</h3>
              <button onClick={() => setShowCart(false)}
                className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-500">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-auto px-5 py-3 space-y-3">
              {cart.length === 0 ? (
                <div className="py-16 flex flex-col items-center gap-3 text-gray-300">
                  <ShoppingBag className="w-12 h-12" strokeWidth={1} />
                  <p className="text-sm">Keranjang masih kosong</p>
                </div>
              ) : cart.map(item => (
                <div key={item.id} className="flex gap-3 items-start">
                  <div className="w-14 h-14 rounded-xl overflow-hidden bg-rose-50 border border-rose-100 shrink-0">
                    {item.image_url
                      ? <Image src={item.image_url} alt={item.name} width={56} height={56} className="object-cover w-full h-full" />
                      : <div className="w-full h-full flex items-center justify-center text-rose-200"><Flower2 className="w-5 h-5" /></div>
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium text-gray-700 leading-tight">{item.name}</p>
                    <p className="text-[12px] font-semibold text-[#C94F78] mt-1">
                      Rp {((item.price - (item.voucher_discount || 0)) * item.qty).toLocaleString("id-ID")}
                    </p>
                    <div className="flex items-center gap-3 mt-2">
                      <div className="flex items-center gap-2 border border-gray-200 rounded-xl px-2 py-1 bg-white">
                        <button onClick={() => item.qty === 1 ? removeFromCart(item.id) : updateQty(item.id, item.qty - 1)}
                          className="text-gray-400 hover:text-[#C94F78] transition-colors">
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-[13px] font-semibold text-gray-700 w-5 text-center">{item.qty}</span>
                        <button onClick={() => updateQty(item.id, item.qty + 1)}
                          className="text-gray-400 hover:text-[#C94F78] transition-colors">
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <button onClick={() => removeFromCart(item.id)} className="text-xs text-gray-400 hover:text-red-400 transition-colors">
                        Hapus
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="px-5 py-4 border-t border-gray-100 shrink-0">
              <div className="flex justify-between items-center mb-4">
                <span className="text-[13px] text-gray-500">Total Estimasi</span>
                <span className="text-[16px] font-bold text-gray-800">Rp {cartTotal.toLocaleString("id-ID")}</span>
              </div>
              <button onClick={handleWAOrder} disabled={processing || cart.length === 0}
                className="w-full bg-[#C94F78] text-white py-4 rounded-2xl text-sm font-semibold flex items-center justify-center gap-2 transition-all hover:bg-[#A83E60] disabled:opacity-50 shadow-lg shadow-rose-200 active:scale-[0.98]">
                {processing
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <MessageCircle className="w-4 h-4" />
                }
                Pesan via WhatsApp
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
