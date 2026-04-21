"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { 
  MessageCircle, Star, Sparkles, Filter, 
  ChevronRight, BadgeCheck, Loader2, Flower2,
  Gift, Crown, Zap, Info, MapPin, Package,
  Ticket, MessageSquare, Plus, Minus, ShoppingBag,
  X, CheckCircle2, AlertCircle, AlertTriangle
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
    <div className="bg-white min-h-screen relative">
      
      {/* ── LOCATION BAR ── */}
      <div className="px-5 py-3 flex items-center gap-2 text-xs font-bold text-gray-400">
        <MapPin className="w-3 h-3 text-[#C94F78]" />
        <span>Klinik LBQueen, Utama</span>
        <ChevronRight className="w-3 h-3" />
      </div>

      {/* ── HERO BANNER ── */}
      <section className="px-5 mb-6">
        <div className="relative rounded-2xl aspect-[21/9] overflow-hidden bg-gradient-to-r from-[#C94F78] to-[#FF85A2] shadow-lg shadow-pink-100">
          <div className="absolute inset-0 p-5 flex flex-col justify-center text-white z-10">
            <span className="bg-white/20 backdrop-blur-sm px-2 py-0.5 rounded text-[10px] font-bold uppercase w-fit mb-2">Promo Spesial</span>
            <h2 className="text-xl font-extrabold leading-tight mb-1">Diskon S.D 50%</h2>
            <p className="text-xs text-pink-50 opacity-90">Untuk Treatment Pilihan Pekan Ini!</p>
          </div>
          <Flower2 className="absolute -bottom-4 -right-4 w-24 h-24 text-white/20 rotate-12" />
        </div>
      </section>

      {/* ── QUICK ACTIONS (ICONS ONLY) ── */}
      <section className="px-5 mb-8">
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: "Treatment", icon: <Sparkles className="w-5 h-5 text-purple-600" />, color: "bg-purple-100", type: "Treatment Care & Beauty" },
            { label: "Produk",    icon: <Package className="w-5 h-5 text-pink-600" />,   color: "bg-pink-100",   type: "Product Care & Beauty" },
            { label: "Voucher",   icon: <Ticket className="w-5 h-5 text-amber-600" />,    color: "bg-amber-100",  type: null },
            { label: "Bantuan",   icon: <MessageSquare className="w-5 h-5 text-blue-600" />, color: "bg-blue-100",   type: null },
          ].map(item => (
            <button key={item.label} 
              onClick={() => item.type && setActiveCategory(item.type)}
              className="flex flex-col items-center gap-2 group">
              <div className={`w-12 h-12 ${item.color} rounded-2xl flex items-center justify-center shadow-sm group-active:scale-95 transition-all`}>
                {item.icon}
              </div>
              <span className="text-[10px] font-bold text-gray-600 tabular-nums">{item.label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* ── MEMBER CARD ── */}
      {customer && (
        <section className="px-5 mb-8">
          <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-inner ${
                customer.is_member ? "bg-gradient-to-br from-amber-400 to-orange-400" : "bg-gray-200"
              }`}>
                {customer.is_member ? <Crown className="w-5 h-5 text-white" /> : <BadgeCheck className="w-5 h-5 text-gray-400" />}
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase">Loyalty Status</p>
                <p className="text-sm font-extrabold text-gray-800 flex items-center gap-1.5">
                  {customer.is_member ? "Member LBQueen" : "Pelanggan Reguler"}
                  {customer.is_member && <Crown className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold text-gray-400 uppercase">Poin Kamu</p>
              <p className="text-sm font-extrabold text-[#C94F78]">1.250 Pts</p>
            </div>
          </div>
        </section>
      )}

      {/* ── CATALOG ── */}
      <section className="px-5 pb-32">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-extrabold text-gray-900 border-l-4 border-[#C94F78] pl-2 capitalize">
            {activeCategory ? activeCategory : "Rekomendasi Terbaik"}
          </h3>
          {activeCategory && (
            <button onClick={() => setActiveCategory(null)} className="text-[10px] font-bold text-[#C94F78] uppercase underline decoration-2 underline-offset-4">Lihat Semua</button>
          )}
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="w-8 h-8 text-pink-200 animate-spin" />
            <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">Menyiapkan Perawatan…</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map(product => {
              const inCart = cart.find(i => i.id === product.id);
              return (
                <div key={product.id} className={`bg-white border rounded-2xl p-3 flex gap-4 transition-all ${product.is_set ? "border-amber-200 bg-amber-50/20" : "border-gray-100"}`}>
                  {/* Product Image */}
                  <div className="relative w-24 h-24 flex-shrink-0 bg-pink-50 rounded-xl overflow-hidden shadow-inner">
                    {product.image_url ? (
                      <Image src={product.image_url} alt={product.name} fill className="object-cover" />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-pink-200">
                        <Flower2 className="w-8 h-8" />
                      </div>
                    )}
                    {product.is_set && (
                       <div className="absolute top-0 left-0 bg-amber-400 text-white text-[8px] font-extrabold px-1.5 py-0.5 rounded-br-lg shadow-sm">PAKET SET</div>
                    )}
                    {product.type.includes("Treatment") && (
                       <div className="absolute top-0 right-0 p-1">
                          <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
                       </div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1 flex flex-col justify-between py-1">
                    <div>
                      <h4 className="font-bold text-gray-900 text-sm leading-tight mb-1">{product.name}</h4>
                      <div className="flex items-center gap-1 text-[10px] text-gray-400 font-bold mb-2">
                        <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                        <span>4.9 (120+)</span>
                        {product.voucher_discount! > 0 && (
                          <span className="ml-2 text-emerald-500 px-1 bg-emerald-50 rounded italic whitespace-nowrap">Potongan Tersedia!</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="font-extrabold text-[#C94F78]">Rp {product.selling_price.toLocaleString("id-ID")}</span>
                        {product.voucher_discount! > 0 && (
                          <span className="text-[9px] text-emerald-600 font-bold">Diskon: −Rp {product.voucher_discount!.toLocaleString("id-ID")}</span>
                        )}
                      </div>

                      {inCart ? (
                        <div className="flex items-center gap-3 bg-pink-50 border border-pink-100 rounded-xl px-2 py-1">
                          <button onClick={() => updateQty(product.id, Math.max(0, inCart.qty - 1))} className="text-[#C94F78] hover:scale-110 active:scale-95 transition-all">
                            {inCart.qty === 1 ? <X className="w-4 h-4" onClick={() => removeFromCart(product.id)} /> : <Minus className="w-4 h-4" />}
                          </button>
                          <span className="text-sm font-extrabold text-[#C94F78] w-4 text-center tabular-nums">{inCart.qty}</span>
                          <button onClick={() => updateQty(product.id, inCart.qty + 1)} className="text-[#C94F78] hover:scale-110 active:scale-95 transition-all">
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <button 
                          onClick={() => addToCart(product, 1)}
                          className="bg-[#C94F78] text-white px-3 py-1.5 rounded-xl shadow-lg shadow-pink-100 active:scale-90 transition-all flex items-center gap-1.5 font-bold text-xs">
                          <Plus className="w-3.5 h-3.5" /> Keranjang
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

      {/* ── FLOATING CART BUTTON ── */}
      {totalItems > 0 && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 w-[90%] max-w-sm z-50 animate-in fade-in slide-in-from-bottom-5">
           <button 
            onClick={() => setShowCart(true)}
            className="w-full bg-[#C94F78] text-white p-4 rounded-2xl shadow-xl shadow-pink-200 flex items-center justify-between group active:scale-95 transition-all">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <ShoppingBag className="w-6 h-6" />
                  <span className="absolute -top-1 -right-1 bg-white text-[#C94F78] text-[9px] font-black w-4 h-4 flex items-center justify-center rounded-full">
                    {totalItems}
                  </span>
                </div>
                <div className="text-left">
                   <p className="text-[10px] font-bold text-pink-100 uppercase leading-none">Cek Keranjang</p>
                   <p className="text-sm font-black">Estimasi: Rp {cartTotal.toLocaleString("id-ID")}</p>
                </div>
              </div>
              <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
           </button>
        </div>
      )}

      {/* ── CART MODAL ── */}
      {showCart && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40 backdrop-blur-sm px-4 pb-4">
           <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl animate-in slide-in-from-bottom-full duration-300">
              <div className="flex items-center justify-between mb-6">
                 <div>
                    <h3 className="text-xl font-black text-gray-900 italic">Pesanan Kamu</h3>
                    <p className="text-xs font-bold text-gray-400">Tinjau kembali sebelum pesan via WA</p>
                 </div>
                 <button onClick={() => setShowCart(false)} className="p-2 bg-gray-100 rounded-full text-gray-400 active:scale-90 transition-all">
                    <X className="w-5 h-5" />
                 </button>
              </div>

              <div className="max-h-[50vh] overflow-auto mb-6 space-y-4 pr-1">
                 {cart.map(item => (
                   <div key={item.id} className="flex gap-4 items-start border-b border-gray-50 pb-4">
                      <div className="w-12 h-12 bg-gray-50 rounded-lg shrink-0 relative overflow-hidden">
                        {item.image_url ? <Image src={item.image_url} alt={item.name} fill className="object-cover" /> : <Flower2 className="w-6 h-6 text-pink-200 m-3" />}
                      </div>
                      <div className="flex-1">
                         <h4 className="font-bold text-sm text-gray-800 leading-tight">{item.name}</h4>
                         <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs font-black text-[#C94F78]">Rp {((item.price - item.voucher_discount) * item.qty).toLocaleString("id-ID")}</span>
                         </div>
                         <div className="flex items-center gap-3 mt-2">
                           <div className="flex items-center gap-3 bg-gray-50 rounded-lg px-2 py-1">
                              <button onClick={() => updateQty(item.id, Math.max(0, item.qty - 1))} className="text-gray-400"><Minus className="w-3 h-3" /></button>
                              <span className="text-xs font-black w-4 text-center">{item.qty}</span>
                              <button onClick={() => updateQty(item.id, item.qty + 1)} className="text-gray-400"><Plus className="w-3 h-3" /></button>
                           </div>
                           <button onClick={() => removeFromCart(item.id)} className="text-[10px] font-bold text-gray-300 underline uppercase">Hapus</button>
                         </div>
                      </div>
                   </div>
                 ))}
                 
                 {cart.length === 0 && (
                   <div className="text-center py-10 text-gray-400">
                      <ShoppingBag className="w-10 h-10 mx-auto mb-2 opacity-20" />
                      <p className="text-xs font-bold uppercase">Keranjang Kosong</p>
                   </div>
                 )}
              </div>

              {/* ESTIMATED TOTAL */}
              <div className="bg-gray-50 rounded-2xl p-4 mb-6">
                 <div className="flex justify-between items-center mb-1 text-gray-500">
                    <span className="text-xs font-bold">Subtotal Pelayanan</span>
                    <span className="text-sm font-bold tabular-nums">Rp {cartTotal.toLocaleString("id-ID")}</span>
                 </div>
                 <div className="flex justify-between items-center text-xs font-bold text-emerald-600 mb-3 border-b border-gray-200 pb-3">
                    <span className="flex items-center gap-1 uppercase tracking-tighter"><Ticket className="w-3 h-3"/> Produk Diskon</span>
                    <span>Tersimpan!</span>
                 </div>
                 <div className="flex justify-between items-center text-[#C94F78]">
                    <span className="font-black italic">ESTIMASI TOTAL</span>
                    <span className="text-xl font-black tabular-nums">Rp {cartTotal.toLocaleString("id-ID")}</span>
                 </div>
              </div>

              <button 
                onClick={handleWAOrder}
                disabled={processingOrder || cart.length === 0}
                className="w-full bg-[#C94F78] text-white py-4 rounded-2xl font-black shadow-lg shadow-pink-100 flex items-center justify-center gap-3 active:scale-95 transition-all disabled:opacity-50">
                 {processingOrder ? <Loader2 className="w-5 h-5 animate-spin" /> : <MessageCircle className="w-5 h-5" />}
                 PESAN VIA WHATSAPP
              </button>
           </div>
        </div>
      )}

    </div>
  );
}
