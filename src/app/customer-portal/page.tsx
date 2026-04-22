"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import {
  MessageCircle, Sparkles, ChevronRight, BadgeCheck, Loader2, Flower2,
  Crown, Gift, Package, Ticket, MessageSquare,
  Plus, Minus, ShoppingBag, X, Star, Paintbrush2, Eye, Gem,
  CreditCard, History, MoreHorizontal, Search as SearchIcon, User,
  ArrowRight, Heart
} from "lucide-react";
import Image from "next/image";
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
  { label: "Treatment", icon: <Sparkles className="w-6 h-6" />, bg: "bg-rose-50", iconColor: "text-[#C94F78]", type: "Treatment Care & Beauty" },
  { label: "Skincare", icon: <Gem className="w-6 h-6" />, bg: "bg-purple-50", iconColor: "text-purple-500", type: "Product Care & Beauty" },
  { label: "Nail Art", icon: <Paintbrush2 className="w-6 h-6" />, bg: "bg-red-50", iconColor: "text-red-400", type: "Retail Nail" },
  { label: "Eyelash", icon: <Eye className="w-6 h-6" />, bg: "bg-violet-50", iconColor: "text-violet-400", type: "Retail Eyelash" },
  { label: "Beauty", icon: <Flower2 className="w-6 h-6" />, bg: "bg-pink-50", iconColor: "text-pink-400", type: "Retail Beauty" },
  { label: "Promo", icon: <Ticket className="w-6 h-6" />, bg: "bg-amber-50", iconColor: "text-amber-500", type: "promo_tab" },
];

export default function CustomerPortalPage() {
  const { cart, addToCart, totalItems } = useCart();
  const [products,       setProducts]       = useState<Product[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [loading,        setLoading]        = useState(true);
  const [customer,       setCustomer]       = useState<any>(null);
  const [activeTab,      setActiveTab]      = useState<"semua" | "promo" | "set">("semua");
  const [searchQuery,    setSearchQuery]    = useState("");

  // Variant Selection State
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [selectionQty,    setSelectionQty]    = useState(1);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [{ data: prods }, { data: vouchs }, { data: vars }] = await Promise.all([
      supabase.from("products").select("*").in("type", SELLABLE_TYPES).order("name"),
      supabase.from("vouchers").select("product_id, discount_amount").eq("is_active", true),
      supabase.from("product_variants").select("*").eq("is_active", true),
    ]);
    
    if (prods) {
      setProducts(prods.map((p: any) => {
        const v = vouchs?.find((v: any) => v.product_id === p.id);
        const pVars = vars?.filter((v: any) => v.product_id === p.id) || [];
        return { 
          ...p, 
          voucher_discount: v ? v.discount_amount : 0,
          variants: pVars
        };
      }));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
    const stored = localStorage.getItem("lbqueen_customer");
    if (stored) { try { setCustomer(JSON.parse(stored)); } catch {} }
  }, [fetchData]);

  const filtered = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchCat = activeCategory ? p.type === activeCategory : true;
    let matchTab = true;
    if (activeTab === "promo") matchTab = (p.voucher_discount ?? 0) > 0;
    if (activeTab === "set")   matchTab = p.is_set;
    return matchSearch && matchCat && matchTab;
  });

  const handleOpenSelection = (product: Product) => {
    setSelectedProduct(product);
    setSelectedVariant(product.variants && product.variants.length > 0 ? product.variants[0] : null);
    setSelectionQty(1);
  };

  const handleAddToCart = () => {
    if (!selectedProduct) return;
    addToCart(selectedProduct, selectionQty, selectedVariant);
    setSelectedProduct(null);
  };

  const handleBuyNow = () => {
    if (!selectedProduct) return;
    const price = selectedVariant ? selectedVariant.price : selectedProduct.selling_price;
    const finalPrice = price - (selectedProduct.voucher_discount || 0);
    const variantName = selectedVariant ? ` - ${selectedVariant.variant_name}` : "";
    
    const msg = `Halo LBQueen! Saya *${customer?.name || "Customer"}*.\n\nSaya ingin memesan:\n*${selectedProduct.name}*${variantName} (x${selectionQty})\nTotal: Rp ${(finalPrice * selectionQty).toLocaleString("id-ID")}\n\nMohon konfirmasi. Terima kasih!`;
    window.open(`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(msg)}`, "_blank");
    setSelectedProduct(null);
  };

  return (
    <div className="min-h-screen bg-[#FDFCFD] font-sans pb-32">

      {/* ── SHOPEE-STYLE HEADER ── */}
      <header className="bg-white px-5 pt-12 pb-6 sticky top-0 z-50 border-b border-gray-50 flex flex-col gap-4">
        <div className="flex items-center justify-between">
           <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center overflow-hidden shrink-0">
                 {customer?.name ? (
                   <span className="text-[#C94F78] font-black text-sm">{customer.name.charAt(0)}</span>
                 ) : <User className="w-5 h-5 text-gray-300" />}
              </div>
              <div>
                 <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">Selamat Datang,</p>
                 <h2 className="text-[15px] font-black text-gray-900 leading-tight">{customer?.name || "Pelanggan Setia"}</h2>
              </div>
           </div>
           <div className="flex items-center gap-2">
              <button onClick={() => window.open(`https://wa.me/${WA_NUMBER}`, "_blank")} className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center text-[#C94F78]">
                 <MessageCircle className="w-5 h-5" />
              </button>
           </div>
        </div>

        {/* Search Bar */}
        <div className="bg-gray-50 rounded-2xl px-4 py-3 flex items-center gap-3 border border-gray-100 focus-within:border-rose-200 transition-all">
           <SearchIcon className="w-4 h-4 text-gray-400" />
           <input 
             type="text" 
             placeholder="Cari perawatan premium..." 
             className="bg-transparent border-none outline-none text-sm text-gray-800 placeholder:text-gray-400 w-full font-medium"
             value={searchQuery}
             onChange={(e) => setSearchQuery(e.target.value)}
           />
        </div>
      </header>

      <div className="px-5 mt-6">
        
        {/* ── CATEGORY GRID (Shopee Style) ── */}
        <div className="grid grid-cols-3 gap-4 mb-8">
           {CATEGORY_CONFIG.map((cat, i) => (
             <button 
               key={i} 
               onClick={() => {
                 if (cat.type === "promo_tab") {
                   setActiveTab("promo");
                   setActiveCategory(null);
                 } else {
                   setActiveCategory(cat.type);
                   setActiveTab("semua");
                 }
               }}
               className={`flex flex-col items-center gap-2 p-3 rounded-[24px] transition-all ${
                 (activeCategory === cat.type || (cat.type === "promo_tab" && activeTab === "promo"))
                   ? "bg-rose-50 border border-rose-100 scale-105" 
                   : "bg-white border border-gray-50 hover:bg-gray-50"
               }`}
             >
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${cat.bg} ${cat.iconColor} shadow-sm`}>
                   {cat.icon}
                </div>
                <span className="text-[11px] font-black text-gray-600 uppercase tracking-tight">{cat.label}</span>
             </button>
           ))}
        </div>

        {/* ── FEATURED BANNER ── */}
        <div className="mb-10">
           <div className="relative rounded-[32px] aspect-[16/9] overflow-hidden shadow-xl shadow-rose-100 group">
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-10" />
              <Image src="https://images.unsplash.com/photo-1570172619666-114317a402f6?auto=format&fit=crop&q=80&w=800" alt="Banner" fill className="object-cover group-hover:scale-105 transition-transform duration-700" />
              
              <div className="absolute bottom-6 left-7 right-7 z-20">
                 <div className="flex items-center gap-1.5 text-white/90 text-[10px] font-black mb-2 uppercase tracking-widest">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" /> Top Rated Treatment
                 </div>
                 <h4 className="text-white text-[22px] font-black leading-tight mb-2">LBQueen Signature Glow</h4>
                 <p className="text-white/70 text-[12px] mb-5 line-clamp-1 font-medium">Pengalaman mewah untuk kesehatan kulit Anda.</p>
                 <button className="bg-white text-[#C94F78] px-6 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-[#C94F78] hover:text-white transition-all shadow-lg active:scale-95">
                    Pelajari
                 </button>
              </div>

              <div className="absolute top-5 left-5 z-20 flex items-center gap-1.5 bg-[#C94F78] text-white text-[10px] font-black px-4 py-1.5 rounded-full shadow-xl">
                 <Crown className="w-3.5 h-3.5" /> REKOMENDASI
              </div>
           </div>
        </div>

        {/* ── STICKY TAB FILTER ── */}
        <div className="sticky top-[180px] z-40 bg-[#FDFCFD]/80 backdrop-blur-md -mx-5 px-5 py-4 mb-4 flex items-center gap-2 overflow-x-auto no-scrollbar">
           {["semua", "promo", "set"].map((tab) => (
             <button 
               key={tab}
               onClick={() => setActiveTab(tab as any)}
               className={`whitespace-nowrap px-6 py-2 rounded-full text-[12px] font-black uppercase tracking-widest transition-all ${
                 activeTab === tab 
                   ? "bg-[#C94F78] text-white shadow-lg shadow-rose-100" 
                   : "bg-white text-gray-400 border border-gray-100"
               }`}
             >
               {tab}
             </button>
           ))}
           <div className="h-6 w-px bg-gray-200 mx-2" />
           <button 
             onClick={() => setActiveCategory(null)}
             className={`whitespace-nowrap px-6 py-2 rounded-full text-[12px] font-black uppercase tracking-widest transition-all ${
               !activeCategory ? "hidden" : "bg-gray-100 text-gray-500"
             }`}
           >
             Hapus Filter
           </button>
        </div>

        {/* ── PRODUCT GRID ── */}
        <div>
           {loading ? (
             <div className="py-20 flex flex-col items-center gap-4">
                <Loader2 className="w-8 h-8 text-[#C94F78] animate-spin" />
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Menyiapkan Layanan Terbaik...</p>
             </div>
           ) : filtered.length === 0 ? (
             <div className="py-20 text-center">
                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                   <SearchIcon className="w-8 h-8 text-gray-200" />
                </div>
                <p className="text-sm font-bold text-gray-400">Tidak ada produk yang ditemukan.</p>
             </div>
           ) : (
             <div className="grid grid-cols-2 gap-x-4 gap-y-6">
                {filtered.map(product => {
                  const hasPromo = (product.voucher_discount || 0) > 0;
                  const displayPrice = product.selling_price - (product.voucher_discount || 0);
                  
                  return (
                    <div 
                      key={product.id} 
                      onClick={() => handleOpenSelection(product)}
                      className="bg-white rounded-[28px] border border-gray-50 p-2.5 flex flex-col group active:scale-[0.98] transition-all shadow-sm hover:shadow-md"
                    >
                       <div className="aspect-square rounded-[22px] overflow-hidden relative bg-rose-50 mb-3">
                         {product.image_url ? (
                           <Image src={product.image_url} alt={product.name} fill className="object-cover" />
                         ) : (
                           <div className="w-full h-full flex items-center justify-center text-rose-200 opacity-20 italic font-black text-4xl">LB</div>
                         )}
                         {hasPromo && (
                            <div className="absolute top-2.5 left-2.5 bg-emerald-500 text-white text-[9px] font-black px-2.5 py-1 rounded-lg shadow-lg">
                               DISKON
                            </div>
                         )}
                         <button className="absolute bottom-2.5 right-2.5 w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center text-gray-400 hover:text-rose-500 transition-colors">
                            <Heart className="w-4 h-4" />
                         </button>
                       </div>
                       
                       <div className="px-1 flex-1 flex flex-col justify-between">
                         <div>
                            <p className="text-[13px] font-black text-gray-800 line-clamp-2 mb-1.5 leading-tight h-8">{product.name}</p>
                            <div className="flex items-center gap-1 mb-3">
                               <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                               <span className="text-[10px] text-gray-400 font-black tracking-tight">4.9 · 100+ Terjual</span>
                            </div>
                         </div>
                         
                         <div className="flex items-center justify-between">
                            <div>
                               {hasPromo && (
                                 <p className="text-[10px] text-gray-300 line-through leading-none mb-0.5">Rp {product.selling_price.toLocaleString("id-ID")}</p>
                               )}
                               <p className="text-[15px] font-black text-[#C94F78]">Rp {displayPrice.toLocaleString("id-ID")}</p>
                            </div>
                            <div className="w-9 h-9 rounded-xl bg-rose-50 flex items-center justify-center text-[#C94F78] group-hover:bg-[#C94F78] group-hover:text-white transition-all">
                               <Plus className="w-5 h-5" />
                            </div>
                         </div>
                       </div>
                    </div>
                  );
                })}
             </div>
           )}
        </div>
      </div>

      {/* ── VARIANT SELECTION SHEET ── */}
      {selectedProduct && (
        <div className="fixed inset-0 z-[100] flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedProduct(null)} />
          <div className="relative bg-white rounded-t-[40px] shadow-2xl max-h-[90vh] flex flex-col p-8 animate-in slide-in-from-bottom-20 duration-300">
            <div className="flex justify-center mb-8">
              <div className="w-16 h-1.5 bg-gray-100 rounded-full" />
            </div>
            
            <div className="flex gap-6 mb-8 pb-8 border-b border-gray-50">
               <div className="w-32 h-32 rounded-[28px] overflow-hidden bg-rose-50 border border-rose-100 shrink-0 relative shadow-lg">
                  {selectedProduct.image_url ? (
                    <Image src={selectedProduct.image_url} alt={selectedProduct.name} fill className="object-cover" />
                  ) : <div className="w-full h-full flex items-center justify-center text-rose-200 italic font-black text-4xl opacity-30">LB</div>}
               </div>
               <div className="flex-1 pt-2">
                  <p className="text-[14px] font-bold text-[#C94F78] uppercase tracking-widest mb-1">{selectedProduct.type}</p>
                  <h3 className="text-xl font-black text-gray-900 leading-tight mb-4">{selectedProduct.name}</h3>
                  <div className="flex items-baseline gap-2">
                     <span className="text-2xl font-black text-[#C94F78]">
                        Rp {((selectedVariant ? selectedVariant.price : selectedProduct.selling_price) - (selectedProduct.voucher_discount || 0)).toLocaleString("id-ID")}
                     </span>
                     {selectedProduct.voucher_discount ? (
                       <span className="text-sm font-bold text-gray-300 line-through">
                          Rp {(selectedVariant ? selectedVariant.price : selectedProduct.selling_price).toLocaleString("id-ID")}
                       </span>
                     ) : null}
                  </div>
               </div>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar space-y-8">
               {/* Variants */}
               {selectedProduct.variants && selectedProduct.variants.length > 0 && (
                 <div>
                    <h4 className="text-[13px] font-black text-gray-900 uppercase tracking-widest mb-4">Pilih Varian</h4>
                    <div className="flex flex-wrap gap-3">
                       {selectedProduct.variants.map((v) => (
                         <button 
                           key={v.id}
                           onClick={() => setSelectedVariant(v)}
                           className={`px-5 py-3 rounded-2xl text-[12px] font-black transition-all border ${
                             selectedVariant?.id === v.id 
                               ? "bg-[#C94F78] text-white border-[#C94F78] shadow-lg shadow-rose-100 scale-105" 
                               : "bg-white text-gray-500 border-gray-100 hover:border-rose-200"
                           }`}
                         >
                           {v.variant_name}
                         </button>
                       ))}
                    </div>
                 </div>
               )}

               {/* Quantity */}
               <div className="flex items-center justify-between">
                  <h4 className="text-[13px] font-black text-gray-900 uppercase tracking-widest">Jumlah</h4>
                  <div className="flex items-center gap-6 bg-gray-50 rounded-2xl px-5 py-2.5 border border-gray-100">
                     <button 
                       onClick={() => setSelectionQty(Math.max(1, selectionQty - 1))}
                       className="text-gray-400 hover:text-[#C94F78] active:scale-125 transition-all"
                     >
                        <Minus className="w-5 h-5" />
                     </button>
                     <span className="text-lg font-black text-gray-900 w-6 text-center">{selectionQty}</span>
                     <button 
                       onClick={() => setSelectionQty(Math.min(10, selectionQty + 1))}
                       className="text-gray-400 hover:text-[#C94F78] active:scale-125 transition-all"
                     >
                        <Plus className="w-5 h-5" />
                     </button>
                  </div>
               </div>
            </div>

            {/* Bottom Buttons */}
            <div className="pt-8 mt-4 grid grid-cols-[1fr_2fr] gap-4">
               <button 
                 onClick={handleAddToCart}
                 className="h-[64px] border-2 border-[#C94F78] text-[#C94F78] rounded-[24px] font-black text-[13px] tracking-widest flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
               >
                  <ShoppingBag className="w-5 h-5" />
                  CART
               </button>
               <button 
                 onClick={handleBuyNow}
                 className="h-[64px] bg-[#C94F78] text-white rounded-[24px] font-black text-[13px] tracking-widest flex items-center justify-center gap-3 shadow-xl shadow-rose-100 active:scale-[0.98] transition-all"
               >
                  BELI SEKARANG
                  <ArrowRight className="w-5 h-5" />
               </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
