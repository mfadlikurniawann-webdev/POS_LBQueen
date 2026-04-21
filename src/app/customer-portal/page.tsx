"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { 
  Search, MessageCircle, Star, Sparkles, Filter, 
  ChevronRight, BadgeCheck, Loader2, Flower2 
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
  const [search, setSearch] = useState("");
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
    (activeCategory ? p.type === activeCategory : true) &&
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Hero Section */}
      <section className="relative rounded-3xl overflow-hidden bg-emerald-900 text-white p-8 md:p-12 shadow-xl">
        <div className="absolute top-0 right-0 w-1/2 h-full opacity-10 pointer-events-none">
          <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="w-full h-full scale-150">
            <path fill="#FFFFFF" d="M47.5,-59.2C59.1,-51.7,64.7,-34.5,67.1,-17.1C69.5,0.3,68.7,17.9,61.4,32.2C54.1,46.5,40.3,57.5,24.8,62.8C9.3,68.1,-7.9,67.7,-24.1,62.2C-40.3,56.7,-55.5,46.1,-63.9,31.4C-72.3,16.7,-73.9,-2.1,-68.8,-18.8C-63.7,-35.5,-51.9,-50.1,-38,-56.9C-24.1,-63.7,-8,-62.7,8.8,-75C25.6,-87.3,43.2,-112.9,47.5,-59.2Z" transform="translate(100 100)" />
          </svg>
        </div>

        <div className="relative z-10 max-w-2xl">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-emerald-400" />
            <span className="text-emerald-400 font-bold tracking-widest text-xs uppercase">Welcome to LBQueen</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold mb-4 leading-tight">
            Hai, {customer?.name?.split(" ")[0]}! 👋
          </h1>
          <p className="text-emerald-100 text-lg mb-8 opacity-90">
            Temukan perawatan dan produk kecantikan terbaik khusus untuk Anda. Pesan sekarang melalui WhatsApp dengan satu klik.
          </p>
          
          <div className="flex flex-wrap gap-4">
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl px-6 py-3 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white shadow-inner ${
                customer?.is_member ? "bg-gradient-to-br from-amber-400 to-orange-500" : "bg-emerald-700"
              }`}>
                {customer?.name?.charAt(0)}
              </div>
              <div>
                <p className="text-xs text-emerald-200 font-medium">Status Anda</p>
                <div className="flex items-center gap-1">
                  <p className="font-bold text-white">{customer?.is_member ? "Member Premium" : "Pelanggan Reguler"}</p>
                  {customer?.is_member && <BadgeCheck className="w-4 h-4 text-amber-400" />}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Product List */}
      <section className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Star className="w-5 h-5 text-emerald-600 fill-emerald-600" />
            <h2 className="text-2xl font-bold text-gray-900">Menu & Katalog</h2>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                type="text" 
                placeholder="Cari perawatan..." 
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full sm:w-64 pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-100 outline-none" 
              />
            </div>
            <div className="flex gap-1 bg-white border border-gray-200 p-1 rounded-xl overflow-x-auto scrollbar-hide">
              <button 
                onClick={() => setActiveCategory(null)}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                  !activeCategory ? "bg-emerald-600 text-white shadow-md shadow-emerald-200" : "text-gray-500 hover:text-emerald-600"
                }`}
              >
                Semua
              </button>
              {categories.map(cat => (
                <button 
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                    activeCategory === cat ? "bg-emerald-600 text-white shadow-md shadow-emerald-200" : "text-gray-500 hover:text-emerald-600"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-10 h-10 text-emerald-200 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-100">
            <Filter className="w-12 h-12 text-gray-200 mx-auto mb-4" />
            <p className="text-gray-400 font-medium">Tidak ada produk yang ditemukan.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filtered.map(product => (
              <div key={product.id} className="group bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col">
                {/* Product Image */}
                <div className="relative aspect-[4/3] bg-emerald-50">
                  {product.image_url ? (
                    <Image src={product.image_url} alt={product.name} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-emerald-100">
                      <Flower2 className="w-12 h-12 mb-2" />
                      <p className="text-[10px] font-bold tracking-widest uppercase">No Photo</p>
                    </div>
                  )}
                  <div className="absolute top-4 left-4">
                    <span className={`text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider backdrop-blur-md border ${
                      product.type === "Treatment" 
                        ? "bg-purple-500/10 text-purple-600 border-purple-200" 
                        : "bg-emerald-500/10 text-emerald-600 border-emerald-200"
                    }`}>
                      {product.type}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 flex-1 flex flex-col">
                  <h3 className="text-lg font-bold text-gray-900 group-hover:text-emerald-700 transition-colors line-clamp-1 mb-2">
                    {product.name}
                  </h3>
                  <div className="flex items-center gap-2 mb-6">
                    <span className="text-xl font-extrabold text-emerald-600">
                      Rp {product.selling_price.toLocaleString("id-ID")}
                    </span>
                  </div>

                  <button 
                    onClick={() => handleOrder(product)}
                    disabled={processingId === product.id}
                    className="mt-auto w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-600/10 active:scale-95 disabled:opacity-50"
                  >
                    {processingId === product.id ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <MessageCircle className="w-5 h-5" />
                        Pesan via WhatsApp
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Promotions Footer */}
      <section className="bg-white border border-emerald-100 rounded-3xl p-8 flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden relative">
        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-emerald-50 rounded-full opacity-50 transition-transform duration-1000 group-hover:scale-150" />
        <div className="relative z-10 space-y-2 text-center md:text-left">
          <h4 className="text-xl font-bold text-gray-900">Ingin Promo Menarik?</h4>
          <p className="text-gray-500 text-sm max-w-sm">Dapatkan diskon khusus Member dan info promo terbaru langsung di portal Anda.</p>
        </div>
        <button className="relative z-10 px-8 py-3 bg-white border-2 border-emerald-600 text-emerald-600 font-bold rounded-2xl hover:bg-emerald-50 transition-all flex items-center gap-2 group">
          Hubungi Customer Service
          <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </button>
      </section>

      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fadeIn 0.6s ease-out forwards;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
