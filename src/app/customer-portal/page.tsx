"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import {
  MessageCircle, Sparkles, ChevronRight, BadgeCheck, Loader2, Flower2,
  Crown, Gift, Package, Ticket, MessageSquare,
  Plus, Minus, ShoppingBag, X, Star, Paintbrush2, Eye, Gem,
  CreditCard, History, MoreHorizontal, Search as SearchIcon, User
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
  { label: "Treatment", icon: <Sparkles className="w-5 h-5" />, bg: "bg-rose-50", iconColor: "text-[#C94F78]", type: "Treatment Care & Beauty" },
  { label: "Skincare", icon: <Gem className="w-5 h-5" />, bg: "bg-purple-50", iconColor: "text-purple-500", type: "Product Care & Beauty" },
  { label: "Nail Art", icon: <Paintbrush2 className="w-5 h-5" />, bg: "bg-red-50", iconColor: "text-red-400", type: "Retail Nail" },
  { label: "Eyelash", icon: <Eye className="w-5 h-5" />, bg: "bg-violet-50", iconColor: "text-violet-400", type: "Retail Eyelash" },
  { label: "Beauty", icon: <Flower2 className="w-5 h-5" />, bg: "bg-pink-50", iconColor: "text-pink-400", type: "Retail Beauty" },
  { label: "Consult", icon: <MessageSquare className="w-5 h-5" />, bg: "bg-emerald-50", iconColor: "text-emerald-500", type: null },
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
    <div className="min-h-screen bg-[#F5F5F5] font-sans pb-32">

      {/* ── GOJEK-STYLE TOP NAVIGATION STRIP ── */}
      <nav className="bg-[#C94F78] px-6 pt-4 pb-14 flex items-center gap-6 sticky top-0 z-50">
        <button className="flex items-center gap-2 px-4 py-2 bg-white/20 rounded-full text-white text-xs font-bold">
          <Ticket className="w-4 h-4" /> Promo
        </button>
        <button className="flex items-center gap-2 px-4 py-2 bg-white rounded-full text-[#C94F78] text-xs font-bold shadow-sm">
          <Sparkles className="w-4 h-4 text-[#C94F78]" /> Home
        </button>
        <button onClick={() => window.open(`https://wa.me/${WA_NUMBER}`, "_blank")} className="flex items-center gap-2 px-4 py-2 bg-white/20 rounded-full text-white text-xs font-bold ml-auto">
          <MessageCircle className="w-4 h-4" /> Chat
        </button>
      </nav>

      <div className="px-5 -mt-10 relative z-40">
        
        {/* ── SEARCH CONTAINER ── */}
        <div className="bg-white rounded-[24px] p-3 shadow-gojek-lg flex items-center gap-3 mb-4">
          <div className="flex-1 bg-gray-50 rounded-xl px-4 py-2.5 flex items-center gap-3">
             <SearchIcon className="w-4 h-4 text-gray-400" />
             <span className="text-sm text-gray-400">Cari perawatan premium...</span>
          </div>
          <div className="w-10 h-10 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center overflow-hidden shrink-0">
             {customer?.name ? (
               <span className="text-[#C94F78] font-bold text-sm">{customer.name.charAt(0)}</span>
             ) : <User className="w-5 h-5 text-gray-300" />}
          </div>
        </div>

        {/* ── LB-PAY (LOYALTY CARD) ── */}
        {customer && (
          <div className="bg-white rounded-[24px] p-4 shadow-gojek flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-rose-50 rounded-xl flex items-center justify-center p-2 border border-rose-100">
                <Image src="/lbqueen_logo.png" alt="LB" width={24} height={24} className="opacity-80" />
              </div>
              <div>
                 <p className="text-[14px] font-black text-gray-900 leading-tight">
                    {customer.is_member ? "LB-Member" : "LB-Guest"}
                 </p>
                 <p className="text-[13px] font-bold text-gray-500 mt-0.5">
                   {customer.is_member ? "1.250 Pts" : "Bergabung Member?"}
                 </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
               <button className="flex flex-col items-center gap-1 group">
                 <div className="w-9 h-9 bg-rose-50 rounded-xl flex items-center justify-center text-[#C94F78] group-hover:bg-[#C94F78] group-hover:text-white transition-all">
                    <Gift className="w-5 h-5" />
                 </div>
                 <span className="text-[9px] font-bold text-gray-400">Redeem</span>
               </button>
               <button className="flex flex-col items-center gap-1 group">
                 <div className="w-9 h-9 bg-rose-50 rounded-xl flex items-center justify-center text-[#C94F78] group-hover:bg-[#C94F78] group-hover:text-white transition-all">
                    <History className="w-5 h-5" />
                 </div>
                 <span className="text-[9px] font-bold text-gray-400">History</span>
               </button>
               <button className="flex flex-col items-center gap-1 group">
                 <div className="w-9 h-9 bg-rose-50 rounded-xl flex items-center justify-center text-[#C94F78] group-hover:bg-[#C94F78] group-hover:text-white transition-all">
                    <MoreHorizontal className="w-5 h-5" />
                 </div>
                 <span className="text-[9px] font-bold text-gray-400">More</span>
               </button>
            </div>
          </div>
        )}

        {/* ── CATEGORY PILLS (Horizontal Scroll) ── */}
        <div className="mb-6 flex gap-2 overflow-x-auto scrollbar-hide -mx-5 px-5">
           {["Semua", ...CATEGORY_CONFIG.map(c => c.label)].map(label => {
             const active = label === "Semua" ? !activeCategory : activeCategory === label;
             const config = CATEGORY_CONFIG.find(c => c.label === label);
             return (
               <button key={label}
                 onClick={() => label === "Semua" ? setActiveCategory(null) : config?.type && setActiveCategory(config.type)}
                 className={`whitespace-nowrap px-4 py-1.5 rounded-full text-[13px] font-bold transition-all border ${
                   active ? "bg-[#C94F78] text-white border-[#C94F78]" : "bg-white text-gray-500 border-gray-100 hover:border-[#C94F78] hover:text-[#C94F78]"
                 }`}>
                 {label}
               </button>
             );
           })}
        </div>

        {/* ── FEATURED BANNER ── */}
        <div className="mb-8">
           <h3 className="text-[17px] font-black text-gray-900 mb-4 tracking-tight">Top picks for you</h3>
           <div className="relative rounded-[28px] aspect-[16/8] overflow-hidden shadow-gojek hover:scale-[1.02] transition-all duration-300 group">
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-10" />
              <Image src="https://images.unsplash.com/photo-1570172619666-114317a402f6?auto=format&fit=crop&q=80&w=800" alt="Banner" fill className="object-cover group-hover:scale-105 transition-transform duration-700" />
              
              <div className="absolute bottom-5 left-6 right-6 z-20">
                 <div className="flex items-center gap-1 text-white/80 text-[10px] font-bold mb-1">
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" /> 4.9(1k+) • Treatment
                 </div>
                 <h4 className="text-white text-[18px] font-black leading-tight mb-2">LBQueen Glowing Package</h4>
                 <p className="text-white/60 text-[11px] mb-4 line-clamp-1">Wujudkan kulit wajah impian dengan ritual premium kami.</p>
                 <button className="bg-white text-gray-900 px-6 py-2 rounded-xl text-[11px] font-black uppercase tracking-wider hover:bg-[#C94F78] hover:text-white transition-all shadow-lg active:scale-95">
                   Proceed
                 </button>
              </div>

              {/* Tag */}
              <div className="absolute top-4 left-4 z-20 flex items-center gap-1 bg-[#C94F78] text-white text-[10px] font-black px-3 py-1 rounded-full shadow-lg">
                 <Crown className="w-3 h-3" /> BEST SELLER
              </div>
           </div>
        </div>

        {/* ── PRODUCT GRID ── */}
        <div>
           <div className="flex items-center justify-between mb-4">
              <h3 className="text-[17px] font-black text-gray-900 tracking-tight">Discover more</h3>
              <button onClick={() => setActiveCategory(null)} className="text-[12px] font-bold text-[#C94F78]">View all</button>
           </div>
           
           {loading ? (
             <div className="py-12 flex items-center justify-center"><Loader2 className="w-6 h-6 text-[#C94F78] animate-spin" /></div>
           ) : (
             <div className="grid grid-cols-2 gap-4">
               {filtered.slice(0, 8).map(product => {
                 const inCart = cart.find(i => i.id === product.id);
                 const hasPromo = (product.voucher_discount || 0) > 0;
                 return (
                   <div key={product.id} className="bg-white rounded-[24px] border border-gray-100 p-2 text-left group hover:border-rose-100 transition-all active:scale-[0.98]">
                      <div className="aspect-square rounded-[20px] overflow-hidden relative bg-rose-50 mb-2">
                        {product.image_url ? (
                          <Image src={product.image_url} alt={product.name} fill className="object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-rose-200 opacity-30 italic font-black text-4xl">
                             LB
                          </div>
                        )}
                        {hasPromo && (
                           <div className="absolute top-2 left-2 bg-emerald-500 text-white text-[9px] font-black px-2 py-0.5 rounded-lg shadow-sm">
                              PROMO
                           </div>
                        )}
                      </div>
                      <div className="px-1">
                        <p className="text-[13px] font-bold text-gray-800 line-clamp-1 mb-1 leading-tight">{product.name}</p>
                        <div className="flex items-center gap-1 mb-2">
                           <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                           <span className="text-[11px] text-gray-400 font-bold">4.8</span>
                        </div>
                        <div className="flex items-center justify-between">
                           <div>
                              {hasPromo && (
                                <p className="text-[10px] text-gray-300 line-through leading-none">Rp {product.selling_price.toLocaleString("id-ID")}</p>
                              )}
                              <p className="text-[14px] font-black text-[#C94F78]">Rp {(product.selling_price - (product.voucher_discount || 0)).toLocaleString("id-ID")}</p>
                           </div>
                           
                           {inCart ? (
                              <div className="flex items-center gap-2 bg-rose-50 rounded-lg px-1.5 py-1">
                                <button onClick={() => inCart.qty === 1 ? removeFromCart(product.id) : updateQty(product.id, inCart.qty - 1)}
                                  className="text-[#C94F78]"><Minus className="w-4 h-4" /></button>
                                <span className="text-[12px] font-black text-[#C94F78] w-4 text-center">{inCart.qty}</span>
                                <button onClick={() => updateQty(product.id, inCart.qty + 1)}
                                  className="text-[#C94F78]"><Plus className="w-4 h-4" /></button>
                              </div>
                           ) : (
                              <button onClick={() => addToCart(product, 1)}
                                className="w-8 h-8 rounded-lg bg-[#C94F78] text-white flex items-center justify-center hover:bg-[#A83E60] transition-colors shadow-sm">
                                <Plus className="w-5 h-5" />
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

      {/* ── GOJEK-STYLE FLOATING PILL MENU ── */}
      <div className="fixed bottom-24 left-1/2 -translate-x-1/2 w-[90%] max-w-sm z-50 animate-in slide-in-from-bottom-10 fade-in duration-500">
         <div className="bg-white rounded-full p-2.5 shadow-gojek-lg border border-gray-100 flex items-center justify-between gap-1 overflow-x-auto scrollbar-hide no-scrollbar">
            {CATEGORY_CONFIG.slice(0, 4).map((cat, i) => (
              <button key={i} onClick={() => cat.type && setActiveCategory(cat.type)}
                className="flex items-center gap-2 px-4 py-2 rounded-full hover:bg-rose-50 transition-all shrink-0">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${cat.bg} ${cat.iconColor}`}>
                   {cat.icon}
                </div>
                <span className="text-[11px] font-black text-gray-600 uppercase tracking-tight">{cat.label}</span>
              </button>
            ))}
         </div>
      </div>

      {/* ── FLOATING CART PILL (Overlays the service pill if items exist) ── */}
      {totalItems > 0 && !showCart && (
        <div className="fixed bottom-36 right-6 z-50">
           <button onClick={() => setShowCart(true)}
             className="w-16 h-16 bg-[#C94F78] rounded-2xl shadow-xl shadow-rose-200 flex flex-col items-center justify-center text-white active:scale-95 transition-all">
              <ShoppingBag className="w-6 h-6 mb-0.5" />
              <span className="text-[12px] font-black">{totalItems}</span>
           </button>
        </div>
      )}

      {/* ── CART SHEET ── */}
      {showCart && (
        <div className="fixed inset-0 z-[100] flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowCart(false)} />
          <div className="relative bg-white rounded-t-[32px] shadow-2xl max-h-[85vh] flex flex-col p-6 pb-12 animate-in slide-in-from-bottom-10">
            <div className="flex justify-center mb-6">
              <div className="w-12 h-1.5 bg-gray-200 rounded-full" />
            </div>
            
            <div className="flex items-center justify-between mb-8">
               <div>
                  <h3 className="text-xl font-black text-gray-900 tracking-tight">Your Selections</h3>
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Ritual Belanja Premium</p>
               </div>
               <button onClick={() => setShowCart(false)} className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center text-gray-400">
                  <X className="w-6 h-6" />
               </button>
            </div>

            <div className="flex-1 overflow-auto space-y-4 pr-2 mb-8 no-scrollbar scrollbar-hide">
              {cart.map(item => (
                <div key={item.id} className="flex gap-4 items-center">
                   <div className="w-16 h-16 rounded-2xl bg-gray-50 border border-gray-100 overflow-hidden shrink-0">
                      {item.image_url ? <Image src={item.image_url} alt={item.name} width={64} height={64} className="object-cover" /> : <Flower2 className="w-8 h-8 text-rose-100 m-4" />}
                   </div>
                   <div className="flex-1">
                      <p className="text-[14px] font-bold text-gray-800 line-clamp-1">{item.name}</p>
                      <p className="text-[13px] font-black text-[#C94F78]">Rp {((item.price - (item.voucher_discount || 0)) * item.qty).toLocaleString("id-ID")}</p>
                      <div className="flex items-center gap-4 mt-2">
                         <div className="flex items-center gap-3 bg-gray-50 rounded-lg px-3 py-1">
                            <button onClick={() => item.qty === 1 ? removeFromCart(item.id) : updateQty(item.id, item.qty - 1)} className="text-gray-400"><Minus className="w-4 h-4" /></button>
                            <span className="text-[13px] font-black">{item.qty}</span>
                            <button onClick={() => updateQty(item.id, item.qty + 1)} className="text-gray-400"><Plus className="w-4 h-4" /></button>
                         </div>
                         <button onClick={() => removeFromCart(item.id)} className="text-[11px] font-bold text-red-400 uppercase tracking-widest">Hapus</button>
                      </div>
                   </div>
                </div>
              ))}
            </div>

            <div className="border-t border-gray-100 pt-6">
               <div className="flex justify-between items-center mb-6">
                  <span className="text-gray-500 font-bold">Total Estimasi</span>
                  <span className="text-2xl font-black text-[#C94F78]">Rp {cartTotal.toLocaleString("id-ID")}</span>
               </div>
               <button onClick={handleWAOrder} disabled={processing || cart.length === 0}
                className="w-full bg-[#C94F78] text-white py-5 rounded-[20px] font-black text-sm tracking-widest flex items-center justify-center gap-3 active:scale-95 transition-all shadow-xl shadow-rose-100 disabled:opacity-50">
                {processing ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShoppingBag className="w-5 h-5" />}
                CHECKOUT VIA WHATSAPP
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
