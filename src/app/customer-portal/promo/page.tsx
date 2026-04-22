"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { 
  ChevronLeft, Sparkles, Loader2, Star, Plus, 
  ShoppingBag, ArrowRight, Ticket, Flame,
  Clock, Gem
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/context/CartContext";

type ProductVariant = {
  id: number;
  product_id: number;
  variant_name: string;
  price: number;
  stock: number;
};

type Product = {
  id: number;
  name: string;
  type: string;
  selling_price: number;
  image_url: string | null;
  product_code: string;
  is_set: boolean;
  voucher_discount?: number;
  variants?: ProductVariant[];
};

export default function PromoPage() {
  const { addToCart } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [{ data: prods }, { data: vouchs }, { data: vars }] = await Promise.all([
      supabase.from("products").select("*").order("name"),
      supabase.from("vouchers").select("product_id, discount_amount").eq("is_active", true),
      supabase.from("product_variants").select("*").eq("is_active", true),
    ]);
    
    if (prods && vouchs) {
      // Only keep products with active vouchers
      const promoProducts = prods
        .map((p: any) => {
          const v = vouchs.find((v: any) => v.product_id === p.id);
          const pVars = vars?.filter((v: any) => v.product_id === p.id) || [];
          return { 
            ...p, 
            voucher_discount: v ? v.discount_amount : 0,
            variants: pVars
          };
        })
        .filter(p => p.voucher_discount > 0);
      
      setProducts(promoProducts);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="min-h-screen bg-[#FDFCFD] pb-32">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-[#C94F78] px-5 pt-12 pb-6 border-b border-[#C94F78]/10 text-white">
        <div className="flex items-center gap-4 mb-4">
           <Link href="/customer-portal" className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white active:scale-90 transition-all">
             <ChevronLeft className="w-6 h-6" />
           </Link>
           <h1 className="text-xl font-black leading-tight flex items-center gap-2">
             <Ticket className="w-6 h-6" /> Promo Spesial
           </h1>
        </div>
        <p className="text-[11px] font-bold opacity-80 uppercase tracking-widest pl-14">Penawaran Eksklusif LBQueen</p>
      </div>

      <div className="p-5">
        {loading ? (
          <div className="py-20 flex flex-col items-center gap-4">
             <Loader2 className="w-8 h-8 text-[#C94F78] animate-spin" />
             <p className="text-xs font-bold text-gray-300 uppercase tracking-widest">Mencari Diskon Terbaik...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="py-20 text-center flex flex-col items-center gap-6">
             <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto text-gray-200">
                <Ticket className="w-12 h-12" />
             </div>
             <div>
                <p className="text-base font-black text-gray-900 mb-1">Belum Ada Promo</p>
                <p className="text-sm text-gray-400 mb-8 max-w-[240px] mx-auto">Nantikan promo menarik lainnya di media sosial kami.</p>
                <Link href="/customer-portal" className="bg-[#C94F78] text-white px-8 py-3 rounded-full font-black text-sm tracking-widest uppercase shadow-lg">
                   Eksplor Layanan
                </Link>
             </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {products.map(product => {
              const discount = product.voucher_discount || 0;
              const originalPrice = product.selling_price;
              const finalPrice = originalPrice - discount;
              const discountPercent = Math.round((discount / originalPrice) * 100);

              return (
                <div key={product.id} className="bg-white rounded-[32px] overflow-hidden border border-gray-50 shadow-md group active:scale-[0.98] transition-all">
                   <div className="relative aspect-[16/8] overflow-hidden">
                      {product.image_url ? (
                        <Image src={product.image_url} alt={product.name} fill className="object-cover group-hover:scale-110 transition-transform duration-700" />
                      ) : (
                        <div className="w-full h-full bg-rose-50 flex items-center justify-center text-[#C94F78] italic font-black text-4xl opacity-20">LB</div>
                      )}
                      <div className="absolute top-4 left-4 bg-[#C94F78] text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg flex items-center gap-2">
                         <Flame className="w-3 h-3" /> BEST DEAL
                      </div>
                      <div className="absolute top-4 right-4 bg-emerald-500 text-white px-3 py-1.5 rounded-xl font-black text-[12px] shadow-lg">
                         -{discountPercent}%
                      </div>
                   </div>
                   
                   <div className="p-6">
                      <div className="flex justify-between items-start mb-4">
                         <div>
                            <h3 className="text-base font-black text-gray-900 mb-1 line-clamp-1">{product.name}</h3>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{product.type}</p>
                         </div>
                         <div className="flex items-center gap-1 text-amber-400">
                            <Star className="w-4 h-4 fill-amber-400" />
                            <span className="text-xs font-black text-gray-900">4.9</span>
                         </div>
                      </div>

                      <div className="flex items-end justify-between">
                         <div>
                            <p className="text-xs font-bold text-gray-300 line-through mb-0.5">Rp {originalPrice.toLocaleString("id-ID")}</p>
                            <p className="text-xl font-black text-[#C94F78]">Rp {finalPrice.toLocaleString("id-ID")}</p>
                         </div>
                         <Link href={`/customer-portal`} className="h-12 px-6 bg-[#C94F78] text-white rounded-2xl font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg shadow-rose-100">
                            Pesan Sekarang <ArrowRight className="w-4 h-4" />
                         </Link>
                      </div>
                   </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Decorative Grid Background */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] z-[-1]" style={{ backgroundImage: 'radial-gradient(#C94F78 1px, transparent 0)', backgroundSize: '24px 24px' }} />
    </div>
  );
}
