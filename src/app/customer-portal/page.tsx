"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { 
  MessageCircle, Star, Sparkles, Filter, 
  ChevronRight, BadgeCheck, Loader2, Flower2,
  Gift, Crown, Zap, Info, MapPin
} from "lucide-react";
import Image from "next/image";

type Product = {
  id: number;
  name: string;
  type: string;
  selling_price: number;
  image_url: string | null;
  product_code: string;
};

const WA_NUMBER = "6282176171448";

export default function CustomerPortalPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [customer, setCustomer] = useState<any>(null);
  const [processingId, setProcessingId] = useState<number | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .in("type", ["Treatment", "Retail Produk"])
      .order("name");
    
    if (data) {
      setProducts(data);
      const types = [...new Set(data.map((p: Product) => p.type))];
      setCategories(types);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
    const stored = localStorage.getItem("lbqueen_customer");
    if (stored) setCustomer(JSON.parse(stored));
  }, [fetchData]);

  const handleOrder = async (product: Product) => {
    if (!customer) return;
    
    setProcessingId(product.id);
    try {
      // 1. Record the order in customer_orders
      await supabase.from("customer_orders").insert({
        customer_id: customer.id,
        customer_name: customer.name,
        product_id: product.id,
        product_name: product.name,
        status: "pending"
      });

      // 2. Format WA Message
      const message = `Halo LBQueen, saya ${customer.name}${customer.is_member ? " (Member)" : ""}.\n\nSaya ingin memesan/booking:\n📌 *${product.name}*\n💰 Harga: Rp ${product.selling_price.toLocaleString("id-ID")}\n\nMohon informasi selanjutnya. Terima kasih!`;
      const encodedMsg = encodeURIComponent(message);
      
      // 3. Redirect to WhatsApp
      window.open(`https://wa.me/${WA_NUMBER}?text=${encodedMsg}`, "_blank");
    } catch (err) {
      console.error("Gagal mencatat pesanan:", err);
    } finally {
      setProcessingId(null);
    }
  };

  const filtered = products.filter(p => 
    (activeCategory ? p.type === activeCategory : true)
  );

  return (
    <div className="bg-white min-h-screen">
      
      {/* ── GOJEK STYLE LOC BAR ── */}
      <div className="px-5 py-3 flex items-center gap-2 text-xs font-bold text-gray-400">
        <MapPin className="w-3 h-3 text-[#C94F78]" />
        <span>Klinik LBQueen, Utama</span>
        <ChevronRight className="w-3 h-3" />
      </div>

      {/* ── BANNER PROMO (CAROUSEL LOOKAHEAD) ── */}
      <section className="px-5 mb-6">
        <div className="relative rounded-2xl aspect-[21/9] overflow-hidden bg-gradient-to-r from-[#C94F78] to-[#FF85A2] shadow-lg shadow-pink-100">
          <div className="absolute inset-0 p-5 flex flex-col justify-center text-white z-10">
            <span className="bg-white/20 backdrop-blur-sm px-2 py-0.5 rounded text-[10px] font-bold uppercase w-fit mb-2">Promo Spesial</span>
            <h2 className="text-xl font-extrabold leading-tight mb-1">Diskon S.D 50%</h2>
            <p className="text-xs text-pink-50 opacity-90">Untuk Treatment Pilihan Pekan Ini!</p>
          </div>
          {/* Dekorasi bunga di banner */}
          <Flower2 className="absolute -bottom-4 -right-4 w-24 h-24 text-white/20 rotate-12" />
        </div>
      </section>

      {/* ── GOJEK STYLE QUICK ACTIONS ── */}
      <section className="px-5 mb-8">
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: "Treatment", icon: "✨", color: "bg-purple-100", type: "Treatment" },
            { label: "Skincare",  icon: "🧴", color: "bg-pink-100",   type: "Retail Produk" },
            { label: "Voucher",   icon: "🎟️", color: "bg-amber-100",  type: null },
            { label: "Bantuan",   icon: "💬", color: "bg-blue-100",   type: null },
          ].map(item => (
            <button key={item.label} 
              onClick={() => item.type && setActiveCategory(item.type)}
              className="flex flex-col items-center gap-2 group">
              <div className={`w-12 h-12 ${item.color} rounded-2xl flex items-center justify-center text-xl shadow-sm group-active:scale-95 transition-all`}>
                {item.icon}
              </div>
              <span className="text-[10px] font-bold text-gray-600">{item.label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* ── MEMBER CARD (MINI) ── */}
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
                <p className="text-sm font-extrabold text-gray-800">{customer.is_member ? "Member LBQueen ✦" : "Pelanggan Reguler"}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold text-gray-400 uppercase">Poin Kamu</p>
              <p className="text-sm font-extrabold text-[#C94F78]">1.250 Pts</p>
            </div>
          </div>
        </section>
      )}

      {/* ── CATALOG SECTION ── */}
      <section className="px-5 pb-20">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-extrabold text-gray-900 border-l-4 border-[#C94F78] pl-2">
            {activeCategory ? activeCategory : "Rekomendasi Terbaik"}
          </h3>
          {activeCategory && (
            <button onClick={() => setActiveCategory(null)} className="text-[10px] font-bold text-[#C94F78] uppercase underline">Lihat Semua</button>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="w-8 h-8 text-pink-200 animate-spin" />
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map(product => (
              <div key={product.id} className="bg-white border border-gray-100 rounded-2xl p-3 flex gap-4 shadow-sm active:bg-gray-50 transition-colors">
                {/* Product Image */}
                <div className="relative w-24 h-24 flex-shrink-0 bg-pink-50 rounded-xl overflow-hidden">
                  {product.image_url ? (
                    <Image src={product.image_url} alt={product.name} fill className="object-cover" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-pink-200">
                      <Flower2 className="w-8 h-8" />
                    </div>
                  )}
                  {product.type === "Treatment" && (
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
                      <span>4.9 (120+ Review)</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-[#C94F78]">Rp {product.selling_price.toLocaleString("id-ID")}</span>
                    <button 
                      onClick={() => handleOrder(product)}
                      disabled={processingId === product.id}
                      className="bg-[#C94F78] text-white p-2 rounded-xl shadow-lg shadow-pink-100 active:scale-90 transition-all disabled:opacity-50">
                      {processingId === product.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageCircle className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
              </div>
            ))}
            
            {filtered.length === 0 && (
              <div className="text-center py-10 text-gray-400 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                <Info className="w-10 h-10 mx-auto mb-2 opacity-20" />
                <p className="text-xs font-bold uppercase tracking-widest">Katalog Kosong</p>
              </div>
            )}
          </div>
        )}
      </section>

    </div>
  );
}
