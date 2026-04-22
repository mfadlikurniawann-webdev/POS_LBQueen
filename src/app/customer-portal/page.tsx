"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { 
  MessageCircle, Star, Sparkles, Filter, 
  ChevronRight, BadgeCheck, Loader2, Flower2,
  Gift, Crown, Zap, Info, MapPin, Package,
  Ticket, MessageSquare, Plus, Minus, ShoppingBag,
  X, CheckCircle2, AlertCircle, AlertTriangle, User, Heart
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

export default function CustomerPortalPage() {
  const { cart, addToCart, removeFromCart, updateQty, clearCart, totalItems } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [customer, setCustomer] = useState<any>(null);
  const [showCart, setShowCart] = useState(false);
  const [processingOrder, setProcessingOrder] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    // Fetch products AND vouchers to see if any products have discounts
    const [{ data: prods }, { data: vouchs }] = await Promise.all([
      supabase.from("products").select("*").in("type", ["Treatment Care & Beauty", "Product Care & Beauty", "Treatment", "Retail Produk"]).order("name"),
      supabase.from("vouchers").select("product_id, discount_amount").eq("is_active", true)
    ]);
    
    if (prods) {
      const prodsWithVouchers = prods.map((p: any) => {
        const v = vouchs?.find(v => v.product_id === p.id);
        return { ...p, voucher_discount: v ? v.discount_amount : 0 };
      });
      setProducts(prodsWithVouchers);
      const types = [...new Set(prods.map((p: any) => p.type))];
      setCategories(types as string[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
    const stored = localStorage.getItem("lbqueen_customer");
    if (stored) setCustomer(JSON.parse(stored));
  }, [fetchData]);

  const handleWAOrder = async () => {
    if (!customer || cart.length === 0) return;
    
    setProcessingOrder(true);
    try {
      // 1. Record each order item in customer_orders
      const ordersToInsert = cart.map(item => ({
        customer_id: customer.id,
        customer_name: customer.name,
        product_id: item.id,
        product_name: `${item.name} (x${item.qty})`,
        status: "pending"
      }));

      await supabase.from("customer_orders").insert(ordersToInsert);

      // 2. Format WA Message
      let message = `Halo LBQueen, saya *${customer.name}*${customer.is_member ? " (Member)" : ""}.\n\nSaya ingin memesan:\n\n`;
      
      let grandTotal = 0;
      cart.forEach((item, idx) => {
        const lineTotal = (item.price - item.voucher_discount) * item.qty;
        const priceLabel = `Rp ${lineTotal.toLocaleString("id-ID")}`;
        
        grandTotal += lineTotal;

        message += `${idx + 1}. *${item.name}*\n`;
        message += `   Qty: ${item.qty}\n`;
        message += `   Subtotal: ${priceLabel}\n`;
        if (item.voucher_discount > 0) {
          message += `   _Diskon Produk diterapkan_\n`;
        }
        message += `\n`;
      });
      
      message += `━━━━━━━━━━━━━━━\n`;
      message += `*Total Estimasi:* Rp ${grandTotal.toLocaleString("id-ID")}\n`;
      message += `━━━━━━━━━━━━━━━\n\n`;
      message += `Mohon informasi selanjutnya. Terima kasih!`;

      const encodedMsg = encodeURIComponent(message);
      
      // 3. Clear cart and redirect
      clearCart();
      setShowCart(false);
      window.open(`https://wa.me/${WA_NUMBER}?text=${encodedMsg}`, "_blank");
    } catch (err) {
      console.error("Gagal mencatat pesanan:", err);
    } finally {
      setProcessingOrder(false);
    }
  };

  const filtered = products.filter(p => 
    (activeCategory ? p.type === activeCategory : true)
  );

  const cartTotal = cart.reduce((acc, item) => {
    return acc + (item.price - item.voucher_discount) * item.qty;
  }, 0);

  return (
    <div className="min-h-screen bg-white">
      {/* ── LOCATION BAR ── */}
      <div className="px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">
          <MapPin className="w-3.5 h-3.5 text-lb-rose" />
          <span>Klinik LBQueen, Utama</span>
          <ChevronRight className="w-3 h-3" />
        </div>
        <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100">
           <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
           <span className="text-[9px] font-black uppercase tracking-tighter">Buka Sekarang</span>
        </div>
      </div>

      {/* ── PREMIUM HERO BILLBOARD ── */}
      <section className="px-6 mb-10">
        <div className="relative rounded-[40px] aspect-[21/9] md:aspect-[21/6] overflow-hidden bg-gray-900 shadow-premium group">
          <div className="absolute inset-0 bg-gradient-to-r from-lb-rose-dark/80 via-lb-rose/40 to-transparent z-10" />
          <Image src="https://images.unsplash.com/photo-1570172619666-114317a402f6?auto=format&fit=crop&q=80&w=1200" alt="Special Offer" fill className="object-cover transition-transform duration-1000 group-hover:scale-110 opacity-60" />
          
          <div className="absolute inset-0 p-8 md:p-12 flex flex-col justify-center text-white z-20">
            <div className="flex items-center gap-2 mb-4">
               <span className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-[0.2em] w-fit border border-white/10 italic">
                 Limited Edition
               </span>
            </div>
            <h2 className="text-3xl md:text-5xl font-black leading-none mb-3 italic tracking-tighter">GLOWING<br/>PACKAGE</h2>
            <p className="text-[10px] md:text-xs font-bold text-white/70 uppercase tracking-[0.3em]">Disc. Until 50% • Member Only</p>
            
            <button className="mt-8 flex items-center gap-3 bg-white text-gray-900 px-6 py-3 rounded-2xl w-fit font-black text-[10px] uppercase tracking-widest hover:bg-lb-rose hover:text-white transition-all shadow-xl">
               Claim Reward <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <Sparkles className="absolute -bottom-6 -right-6 w-32 h-32 text-white/10 rotate-12" />
        </div>
      </section>

      {/* ── BOUTIQUE CATEGORIES (ICONS) ── */}
      <section className="px-6 mb-12">
        <div className="grid grid-cols-4 gap-6">
          {[
            { label: "Treatments", icon: <Sparkles className="w-6 h-6" />, color: "bg-white text-lb-rose border-rose-50", type: "Treatment Care & Beauty" },
            { label: "Products", icon: <Package className="w-6 h-6" />, color: "bg-white text-gray-800 border-gray-100", type: "Product Care & Beauty" },
            { label: "Loyalty", icon: <Ticket className="w-6 h-6" />, color: "bg-white text-amber-500 border-amber-50", type: null },
            { label: "Consult", icon: <MessageSquare className="w-6 h-6" />, color: "bg-white text-emerald-500 border-emerald-50", type: null },
          ].map(item => (
            <button key={item.label} 
              onClick={() => item.type && setActiveCategory(item.type)}
              className="flex flex-col items-center gap-4 group">
              <div className={`w-16 h-16 ${item.color} rounded-3xl flex items-center justify-center shadow-premium border-2 transition-all group-hover:-translate-y-2 group-active:scale-90`}>
                {item.icon}
              </div>
              <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest group-hover:text-lb-rose transition-colors">{item.label}</span>
            </button>
          ))}
        </div>
      </section>      {/* ── LOYALTY CARD ── */}
      {customer && (
        <section className="px-6 mb-12">
          <div className="bg-gradient-to-br from-gray-900 to-black text-white rounded-[40px] p-8 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-40 h-40 bg-lb-rose/20 rounded-bl-full transition-transform group-hover:scale-110" />
            
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-center gap-5">
                <div className={`w-16 h-16 rounded-[24px] flex items-center justify-center shadow-lg transition-transform group-hover:rotate-6 ${
                  customer.is_member ? "bg-gradient-to-br from-amber-400 to-orange-500 shadow-amber-900/20" : "bg-gray-700"
                }`}>
                  {customer.is_member ? <Crown className="w-8 h-8 text-white" /> : <User className="w-8 h-8 text-gray-400" />}
                </div>
                <div>
                  <p className="text-[10px] font-black text-white/50 uppercase tracking-[0.2em] mb-1">Loyalty Account</p>
                  <p className="text-xl font-black flex items-center gap-2 italic">
                    {customer.name}
                    {customer.is_member && <BadgeCheck className="w-5 h-5 text-amber-400 fill-amber-400" />}
                  </p>
                  <p className="text-[10px] font-bold text-lb-rose uppercase tracking-widest mt-1">
                    {customer.is_member ? "Exclusive Gold Member" : "Registered Regular"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4 bg-white/5 backdrop-blur-md px-6 py-4 rounded-3xl border border-white/10">
                <div className="text-right">
                  <p className="text-[9px] font-black text-white/40 uppercase tracking-widest mb-1">Your Balance</p>
                  <p className="text-lg font-black text-amber-400 tracking-tighter">1,250 <span className="text-[10px] text-white/50">Pts</span></p>
                </div>
                <div className="w-px h-8 bg-white/10" />
                <Gift className="w-6 h-6 text-lb-rose" />
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── PREMIUM CATALOG ── */}
      <section className="px-6 pb-32">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
             <div className="w-2 h-8 bg-lb-rose rounded-full" />
             <h3 className="font-black text-gray-900 uppercase tracking-widest text-sm italic">
               {activeCategory ? activeCategory : "Featured Treatments"}
             </h3>
          </div>
          {activeCategory && (
            <button onClick={() => setActiveCategory(null)} className="text-[10px] font-black text-lb-rose uppercase tracking-widest border-b-2 border-lb-rose/30 hover:border-lb-rose transition-all">View All</button>
          )}
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-12 h-12 rounded-2xl border-4 border-rose-50 border-t-lb-rose animate-spin" />
            <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Preparing Selections…</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {filtered.map(product => {
              const inCart = cart.find(i => i.id === product.id);
              return (
                <div key={product.id} className={`group bg-white rounded-[40px] p-4 shadow-sm hover:shadow-premium border border-gray-100 transition-all duration-300 relative flex flex-col ${product.is_set ? " ring-2 ring-amber-100 bg-amber-50/10" : ""}`}>
                  
                  {/* Product Image Wrapper */}
                  <div className="relative aspect-square rounded-[32px] overflow-hidden bg-gray-50 mb-4 group-hover:scale-[1.02] transition-transform shadow-inner">
                    {product.image_url ? (
                      <Image src={product.image_url} alt={product.name} fill className="object-cover" />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-rose-100">
                        <Flower2 className="w-12 h-12 opacity-30" />
                      </div>
                    )}
                    
                    {/* Badges */}
                    <div className="absolute top-3 left-3 flex flex-col gap-2">
                       {product.is_set && (
                          <div className="bg-amber-400/90 backdrop-blur-md text-white text-[8px] font-black px-3 py-1 rounded-full shadow-lg uppercase tracking-widest">LUXURY SET</div>
                       )}
                       {product.voucher_discount! > 0 && (
                          <div className="bg-emerald-500/90 backdrop-blur-md text-white text-[8px] font-black px-3 py-1 rounded-full shadow-lg uppercase tracking-widest">PROMO</div>
                       )}
                    </div>

                    <button className="absolute bottom-3 right-3 p-2 bg-white/80 backdrop-blur-md rounded-2xl text-gray-400 hover:text-lb-rose transition-all shadow-xl opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0">
                       <Heart className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Details */}
                  <div className="flex-1 flex flex-col">
                    <div className="mb-4 flex-1">
                      <div className="flex items-center gap-1.5 mb-2">
                         <div className="flex items-center gap-0.5">
                            {[1,2,3,4,5].map(star => <Star key={star} className="w-2.5 h-2.5 text-amber-400 fill-amber-400" />)}
                         </div>
                         <span className="text-[10px] font-bold text-gray-400">(128)</span>
                      </div>
                      <h4 className="font-black text-gray-800 text-sm leading-tight italic line-clamp-2">{product.name}</h4>
                    </div>
                    
                    <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-50">
                      <div className="flex flex-col">
                        <span className="text-[9px] font-black text-gray-300 uppercase tracking-tighter">Starting At</span>
                        <span className="font-black text-lb-rose text-base tracking-tighter italic">Rp {product.selling_price.toLocaleString("id-ID")}</span>
                      </div>

                      {inCart ? (
                        <div className="flex items-center gap-3 bg-rose-50 border border-rose-100 rounded-2xl px-2 py-1.5">
                          <button onClick={() => updateQty(product.id, Math.max(0, inCart.qty - 1))} className="text-lb-rose hover:scale-125 transition-transform">
                            {inCart.qty === 1 ? <X className="w-3.5 h-3.5" onClick={() => removeFromCart(product.id)} /> : <Minus className="w-3.5 h-3.5" />}
                          </button>
                          <span className="text-xs font-black text-lb-rose w-4 text-center tabular-nums">{inCart.qty}</span>
                          <button onClick={() => updateQty(product.id, inCart.qty + 1)} className="text-lb-rose hover:scale-125 transition-transform">
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button 
                          onClick={() => addToCart(product, 1)}
                          className="w-10 h-10 bg-gray-900 group-hover:bg-lb-rose text-white rounded-2xl shadow-xl flex items-center justify-center transition-all hover:scale-110 active:scale-95">
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
      </section>

      {/* ── FLOATING CART PILL ── */}
      {totalItems > 0 && (
        <div className="fixed bottom-32 left-1/2 -translate-x-1/2 w-[92%] max-w-lg z-50 animate-in fade-in slide-in-from-bottom-10 duration-700">
           <button 
            onClick={() => setShowCart(true)}
            className="w-full bg-gray-900 group-hover:bg-black text-white p-6 rounded-[32px] shadow-[0_20px_50px_rgba(0,0,0,0.3)] flex items-center justify-between group active:scale-95 transition-all border border-white/10">
              <div className="flex items-center gap-6">
                <div className="relative">
                  <div className="w-12 h-12 bg-lb-rose rounded-2xl flex items-center justify-center shadow-lg shadow-rose-900/40">
                     <ShoppingBag className="w-6 h-6" />
                  </div>
                  <span className="absolute -top-2 -right-2 bg-white text-gray-900 text-[10px] font-black w-6 h-6 flex items-center justify-center rounded-xl shadow-lg">
                    {totalItems}
                  </span>
                </div>
                <div className="text-left">
                   <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-1">Items in basket</p>
                   <p className="text-lg font-black tracking-tighter italic">Rp {cartTotal.toLocaleString("id-ID")}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-white/10 px-4 py-2 rounded-2xl group-hover:bg-lb-rose transition-colors">
                 <span className="text-[10px] font-black uppercase tracking-widest">Review</span>
                 <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
           </button>
        </div>
      )}

      {/* ── PREMIUM CART DRAWER ── */}
      {showCart && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/60 backdrop-blur-md px-6">
           <div className="bg-white w-full max-w-2xl rounded-[48px] p-10 shadow-huge animate-in zoom-in-95 duration-300 relative overflow-hidden border border-gray-100">
              <div className="absolute top-0 right-0 w-64 h-64 bg-rose-50 rounded-bl-full -z-0 opacity-50" />
              
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-10">
                   <div>
                      <div className="flex items-center gap-3 mb-2">
                         <div className="w-1.5 h-6 bg-lb-rose rounded-full" />
                         <h3 className="text-2xl font-black text-gray-900 italic tracking-tighter uppercase">Your Rituals</h3>
                      </div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Review your selections carefully</p>
                   </div>
                   <button onClick={() => setShowCart(false)} className="p-4 bg-gray-50 hover:bg-rose-50 rounded-3xl text-gray-400 hover:text-lb-rose transition-all">
                      <X className="w-6 h-6" />
                   </button>
                </div>

                <div className="max-h-[45vh] overflow-auto mb-10 space-y-6 pr-4 custom-scrollbar">
                   {cart.map(item => (
                     <div key={item.id} className="flex gap-6 items-center group">
                        <div className="w-20 h-20 bg-gray-50 rounded-3xl shrink-0 relative overflow-hidden shadow-inner border border-gray-100">
                          {item.image_url ? <Image src={item.image_url} alt={item.name} fill className="object-cover" /> : <Flower2 className="w-8 h-8 text-rose-100 m-6" />}
                        </div>
                        <div className="flex-1">
                           <div className="flex justify-between items-start mb-1">
                              <h4 className="font-black text-base text-gray-800 leading-tight italic">{item.name}</h4>
                              <button onClick={() => removeFromCart(item.id)} className="text-[9px] font-black text-gray-300 hover:text-red-400 uppercase tracking-widest transition-colors">Remove</button>
                           </div>
                           <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Professional Care</p>
                           <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4 bg-gray-50 rounded-2xl px-4 py-2 border border-gray-100">
                                 <button onClick={() => updateQty(item.id, Math.max(0, item.qty - 1))} className="text-gray-400 hover:text-lb-rose transition-colors"><Minus className="w-4 h-4" /></button>
                                 <span className="text-sm font-black w-6 text-center tabular-nums">{item.qty}</span>
                                 <button onClick={() => updateQty(item.id, item.qty + 1)} className="text-gray-400 hover:text-lb-rose transition-colors"><Plus className="w-4 h-4" /></button>
                              </div>
                              <span className="text-base font-black text-lb-rose italic tracking-tighter">Rp {((item.price - item.voucher_discount) * item.qty).toLocaleString("id-ID")}</span>
                           </div>
                        </div>
                     </div>
                   ))}
                   
                   {cart.length === 0 && (
                     <div className="text-center py-20 text-gray-200">
                        <ShoppingBag className="w-20 h-20 mx-auto mb-6 opacity-10" />
                        <p className="font-black uppercase tracking-[0.2em] text-xs">Your basket is empty</p>
                     </div>
                   )}
                </div>

                {/* SETTLEMENT BOARD */}
                <div className="bg-gray-50 rounded-[40px] p-8 mb-10 border border-gray-100">
                   <div className="flex justify-between items-center mb-4">
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Base Services</span>
                      <span className="text-sm font-black text-gray-900 tabular-nums">Rp {cartTotal.toLocaleString("id-ID")}</span>
                   </div>
                   <div className="flex justify-between items-center mb-8 border-b border-gray-200 pb-6">
                      <span className="flex items-center gap-2 text-[10px] font-black text-emerald-600 uppercase tracking-widest"><Ticket className="w-4 h-4"/> Platinum Discount</span>
                      <span className="text-sm font-black text-emerald-600">Applied!</span>
                   </div>
                   <div className="flex justify-between items-center">
                      <span className="text-sm font-black text-lb-rose uppercase tracking-[0.2em] italic">Total Estimate</span>
                      <div className="text-right">
                         <span className="text-3xl font-black text-gray-900 tabular-nums tracking-tighter italic">Rp {cartTotal.toLocaleString("id-ID")}</span>
                         <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1">Tax & Fees Included</p>
                      </div>
                   </div>
                </div>

                <button 
                  onClick={handleWAOrder}
                  disabled={processingOrder || cart.length === 0}
                  className="w-full bg-gray-900 hover:bg-black text-white py-6 rounded-3xl font-black shadow-2xl flex items-center justify-center gap-4 active:scale-95 transition-all disabled:opacity-50 group">
                   {processingOrder ? <Loader2 className="w-6 h-6 animate-spin text-lb-rose" /> : <MessageCircle className="w-6 h-6 text-emerald-400" />}
                   <span className="uppercase tracking-[0.2em] text-xs">Finalize Order via WhatsApp</span>
                </button>
              </div>
           </div>
        </div>
      )}

    </div>
  );
}
