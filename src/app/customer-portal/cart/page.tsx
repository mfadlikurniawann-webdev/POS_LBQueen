"use client";

import { useCart } from "@/context/CartContext";
import { 
  ChevronLeft, ShoppingBag, Trash2, Plus, Minus, 
  ArrowRight, Loader2, Sparkles, User, Ticket
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

const WA_NUMBER = "6282176171448";

export default function CartPage() {
  const { cart, removeFromCart, updateQty, clearCart, totalItems } = useCart();
  const [customer, setCustomer] = useState<any>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("lbqueen_customer");
    if (stored) {
      try {
        setCustomer(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse customer data", e);
      }
    }
  }, []);

  const cartTotal = cart.reduce((a, i) => a + (i.price - (i.voucher_discount || 0)) * i.qty, 0);

  const handleWAOrder = async () => {
    if (!customer || cart.length === 0) return;
    setProcessing(true);
    try {
      await supabase.from("customer_orders").insert(
        cart.map(item => ({
          customer_id: customer.id,
          customer_name: customer.name,
          product_id: item.id,
          product_name: `${item.name} ${item.variant_name ? `(${item.variant_name})` : ""} (x${item.qty})`,
          status: "pending",
        }))
      );

      let msg = `Halo LBQueen! Saya *${customer.name}*${customer.is_member ? " (Member)" : ""}.\n\nPesanan saya:\n\n`;
      cart.forEach((item, i) => {
        const lineTotal = (item.price - (item.voucher_discount || 0)) * item.qty;
        msg += `${i + 1}. *${item.name}*${item.variant_name ? ` - ${item.variant_name}` : ""} (x${item.qty})\n   Rp ${lineTotal.toLocaleString("id-ID")}\n`;
      });
      msg += `\n*Total: Rp ${cartTotal.toLocaleString("id-ID")}*\n\nMohon konfirmasi. Terima kasih!`;
      
      clearCart();
      window.open(`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(msg)}`, "_blank");
    } catch (e) {
      console.error(e);
    } finally {
      setProcessing(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-[#FDFCFD] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-24 h-24 bg-rose-50 rounded-full flex items-center justify-center mb-6">
          <ShoppingBag className="w-10 h-10 text-[#C94F78]" />
        </div>
        <h2 className="text-xl font-black text-gray-900 mb-2">Keranjang Kosong</h2>
        <p className="text-sm text-gray-400 mb-8 max-w-[240px]">Sepertinya Anda belum memilih perawatan premium hari ini.</p>
        <Link href="/customer-portal" className="bg-[#C94F78] text-white px-8 py-3 rounded-full font-black text-sm tracking-widest shadow-lg shadow-rose-100 uppercase transition-all active:scale-95">
          Mulai Belanja
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFCFD] pb-32">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white border-b border-gray-100 px-5 pt-12 pb-4 flex items-center gap-4">
        <Link href="/customer-portal" className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 active:scale-90 transition-all">
          <ChevronLeft className="w-6 h-6" />
        </Link>
        <div>
          <h1 className="text-lg font-black text-gray-900 leading-tight">Keranjang Saya</h1>
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">{totalItems} Item • Checkout via WhatsApp</p>
        </div>
      </div>

      <div className="p-5 space-y-6">
        {/* Item List */}
        <div className="space-y-4">
          {cart.map((item, idx) => (
            <div key={`${item.id}-${item.variant_id || idx}`} className="bg-white rounded-[24px] p-4 border border-gray-100 shadow-sm flex gap-4">
              <div className="w-20 h-20 rounded-[20px] bg-rose-50 border border-rose-100 overflow-hidden shrink-0 relative">
                {item.image_url ? (
                  <Image src={item.image_url} alt={item.name} fill className="object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[#C94F78] text-xs font-black opacity-20 italic">LB</div>
                )}
              </div>
              
              <div className="flex-1 flex flex-col justify-between py-1">
                <div>
                  <h3 className="text-[14px] font-black text-gray-800 line-clamp-1 leading-tight mb-1">{item.name}</h3>
                  {item.variant_name && (
                    <span className="inline-block px-2 py-0.5 bg-rose-50 text-[#C94F78] text-[9px] font-black rounded-lg mb-2">
                       {item.variant_name}
                    </span>
                  )}
                  <p className="text-[14px] font-black text-[#C94F78]">Rp {((item.price - (item.voucher_discount || 0))).toLocaleString("id-ID")}</p>
                </div>
                
                <div className="flex items-center justify-between mt-3">
                   <div className="flex items-center gap-4 bg-gray-50 rounded-xl px-3 py-1.5 border border-gray-100">
                      <button 
                        onClick={() => item.qty === 1 ? removeFromCart(item.id, item.variant_id) : updateQty(item.id, item.qty - 1, item.variant_id)}
                        className="text-gray-400 active:scale-125 transition-transform"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="text-sm font-black text-gray-800 w-4 text-center">{item.qty}</span>
                      <button 
                        onClick={() => updateQty(item.id, item.qty + 1, item.variant_id)}
                        className="text-gray-400 active:scale-125 transition-transform"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                   </div>
                   
                   <button onClick={() => removeFromCart(item.id, item.variant_id)} className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center text-red-500 active:scale-90 transition-all border border-red-100">
                      <Trash2 className="w-4 h-4" />
                   </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Promo Code placeholder (Shopee/Tokopedia style) */}
        <div className="bg-white rounded-[24px] p-4 border border-gray-100 shadow-sm flex items-center justify-between">
           <div className="flex items-center gap-3 text-gray-800">
              <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center text-[#C94F78]">
                <Ticket className="w-5 h-5" />
              </div>
              <div>
                 <p className="text-[13px] font-black">Voucher LBQueen</p>
                 <p className="text-[11px] font-bold text-gray-400">Hemat hingga Rp 50rb</p>
              </div>
           </div>
           <button className="text-[12px] font-black text-[#C94F78] px-3 py-1.5 rounded-lg border border-[#C94F78]/20 bg-rose-50">Gunakan</button>
        </div>

        {/* Totals Section */}
        <div className="bg-white rounded-[32px] p-6 border border-gray-100 shadow-sm space-y-4">
           <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-4">Ringkasan Pesanan</h3>
           <div className="flex justify-between items-center text-sm font-bold text-gray-400">
              <span>Subtotal</span>
              <span>Rp {cartTotal.toLocaleString("id-ID")}</span>
           </div>
           <div className="flex justify-between items-center text-sm font-bold text-gray-400">
              <span>Promo Diskon</span>
              <span className="text-emerald-500">- Rp 0</span>
           </div>
           <div className="pt-4 border-t border-dashed border-gray-200 flex justify-between items-center">
              <span className="text-base font-black text-gray-900">Total Pembayaran</span>
              <span className="text-xl font-black text-[#C94F78]">Rp {cartTotal.toLocaleString("id-ID")}</span>
           </div>
        </div>
      </div>

      {/* Checkout Bar */}
      <div className="fixed bottom-24 left-0 right-0 px-5 z-50">
         <button 
           onClick={handleWAOrder}
           disabled={processing}
           className="w-full bg-[#C94F78] h-[72px] rounded-3xl text-white font-black text-[14px] tracking-widest shadow-2xl shadow-rose-200 flex items-center justify-between px-8 active:scale-[0.98] transition-all disabled:opacity-50"
         >
           <div className="flex items-center gap-3">
              {processing ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShoppingBag className="w-5 h-5" />}
              <span>KONFIRMASI VIA WA</span>
           </div>
           <div className="flex items-center gap-2 bg-white/20 py-2.5 px-4 rounded-2xl">
              <span className="text-[12px] opacity-80">Total</span>
              <ArrowRight className="w-4 h-4" />
           </div>
         </button>
      </div>

      {/* Decorative Spacer */}
      <div className="h-20" />
    </div>
  );
}
