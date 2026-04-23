"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import {
  MessageCircle, Sparkles, ChevronRight, BadgeCheck, Loader2, Flower2,
  Crown, Gift, Package, Ticket, MessageSquare,
  Plus, Minus, ShoppingBag, X, Star, Paintbrush2, Eye, Gem,
  CreditCard, History, MoreHorizontal, Search as SearchIcon, User,
  ArrowRight, Heart, Filter
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
  sub_category?: string;
  voucher_discount?: number;
  variants?: ProductVariant[];
};

const WA_NUMBER = "6282176171448";

const MAIN_CATEGORIES = [
  { 
    id: "treatment", 
    label: "Treatment Care & Beauty", 
    type: "Treatment Care & Beauty",
    desc: "Perawatan kulit & tubuh",
    bg: "bg-gradient-to-br from-[#D95F87] to-[#A83E60] shadow-rose-200",
    icon: Sparkles
  },
  { 
    id: "product", 
    label: "Product Care & Beauty", 
    type: "Product Care & Beauty",
    desc: "Skincare eksklusif",
    bg: "bg-gradient-to-br from-[#E88EAA] to-[#C94F78] shadow-pink-200",
    icon: Package
  }
];

const BANNERS = [
  { id: 1, image: "/banner_facial.png", title: "Premium Facial Treatment", subtitle: "Wujudkan kulit impian Anda hari ini." },
  { id: 2, image: "/banner_eyelash.png", title: "Luxury Eyelash & Nails", subtitle: "Tampil mempesona di setiap kesempatan." },
];

export default function CustomerPortalPage() {
  const { cart, addToCart, totalItems } = useCart();
  const [products,       setProducts]       = useState<Product[]>([]);
  const [loading,        setLoading]        = useState(true);
  const [customer,       setCustomer]       = useState<any>(null);
  const [searchQuery,    setSearchQuery]    = useState("");
  
  // Filtering states
  const [activeTab,      setActiveTab]      = useState<"semua" | "promo" | "set">("semua");

  // Variant Selection State
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [selectionQty,    setSelectionQty]    = useState(1);
  
  // Banner state
  const [bannerIdx, setBannerIdx] = useState(0);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const ALLOWED_TYPES = ["Treatment Care & Beauty", "Product Care & Beauty"];
    const [{ data: prods }, { data: vouchs }, { data: vars }] = await Promise.all([
      supabase.from("products").select("*").in("type", ALLOWED_TYPES).order("name"),
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
    
    // Banner auto-scroll
    const timer = setInterval(() => setBannerIdx(p => (p + 1) % BANNERS.length), 5000);
    return () => clearInterval(timer);
  }, [fetchData]);

  const filtered = useMemo(() => {
    return products.filter(p => {
      const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
      
      let matchTab = true;
      if (activeTab === "promo") matchTab = (p.voucher_discount ?? 0) > 0;
      if (activeTab === "set")   matchTab = p.is_set;
      
      return matchSearch && matchTab;
    });
  }, [products, searchQuery, activeTab]);

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
    <div className="min-h-screen bg-transparent font-sans pb-32 max-w-7xl mx-auto md:px-8">

      {/* ── HEADER (Pink Wave Gradient) ── */}
      <header className="relative bg-gradient-to-r from-[#D95F87] via-[#C94F78] to-[#A83E60] px-5 pt-12 pb-6 sticky top-0 z-50 rounded-b-[32px] md:rounded-b-[48px] md:mt-4 md:rounded-t-[48px] shadow-lg shadow-rose-200/50 flex flex-col gap-4 overflow-hidden">
        {/* Wave Decoration */}
        <svg className="absolute bottom-0 left-0 w-full h-auto opacity-20 pointer-events-none" viewBox="0 0 1440 200" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
          <path fill="#ffffff" d="M0,96L48,112C96,128,192,160,288,154.7C384,149,480,107,576,96C672,85,768,107,864,122.7C960,139,1056,149,1152,144C1248,139,1344,117,1392,106.7L1440,96L1440,200L1392,200C1344,200,1248,200,1152,200C1056,200,960,200,864,200C768,200,672,200,576,200C480,200,384,200,288,200C192,200,96,200,48,200L0,200Z"></path>
        </svg>
        <div className="absolute -bottom-8 -left-10 w-40 h-24 bg-white/10 rounded-[100%] blur-xl pointer-events-none" />

        <div className="relative z-10 flex items-center justify-between">
           <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 border border-white/30 backdrop-blur-sm flex items-center justify-center overflow-hidden shrink-0 shadow-sm p-1">
                 <Image src="/lbqueen_logo.png" alt="LBQueen" width={32} height={32} className="object-contain drop-shadow-lg" />
              </div>
              <div>
                 <p className="text-[10px] font-semibold text-white/70 capitalize tracking-widest leading-none mb-1">Ritual Kecantikan,</p>
                 <h2 className="text-[15px] font-semibold text-white leading-tight">{customer?.name || "Pelanggan Setia"}</h2>
              </div>
           </div>
           <div className="flex items-center gap-2">
              <button onClick={() => window.open(`https://wa.me/${WA_NUMBER}`, "_blank")} className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white active:scale-90 transition-all border border-white/30 shadow-sm">
                 <MessageCircle className="w-5 h-5" />
              </button>
           </div>
        </div>

        {/* Search Bar */}
        <div className="relative z-10 bg-white/20 backdrop-blur-md rounded-2xl px-4 py-3 flex items-center gap-3 border border-white/30 focus-within:bg-white transition-all group">
           <SearchIcon className="w-4 h-4 text-white group-focus-within:text-[#C94F78]" />
           <input 
             type="text" 
             placeholder="Cari perawatan premium..." 
             className="bg-transparent border-none outline-none text-sm text-white placeholder:text-white/70 group-focus-within:text-slate-800 group-focus-within:placeholder:text-slate-400 w-full font-medium"
             value={searchQuery}
             onChange={(e) => setSearchQuery(e.target.value)}
           />
        </div>
      </header>

      {/* ── BANNER CAROUSEL ── */}
      <div className="px-5 mt-6 mb-8">
        <div className="relative rounded-[32px] overflow-hidden aspect-[21/9] shadow-xl shadow-rose-100 group">
          {BANNERS.map((b, idx) => (
            <div key={b.id} className={`absolute inset-0 transition-opacity duration-1000 ${idx === bannerIdx ? "opacity-100 z-10" : "opacity-0 z-0"}`}>
               <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent z-10" />
               <Image src={b.image} alt={b.title} fill className="object-cover" />
               <div className="absolute bottom-4 left-6 right-6 z-20">
                  <h4 className="text-white text-[18px] font-semibold leading-tight mb-1">{b.title}</h4>
                  <p className="text-white/70 text-[10px] font-medium capitalize tracking-widest">{b.subtitle}</p>
               </div>
            </div>
          ))}
          <div className="absolute bottom-4 right-6 z-20 flex gap-1.5">
            {BANNERS.map((_, idx) => (
              <div key={idx} className={`h-1.5 rounded-full transition-all duration-300 ${idx === bannerIdx ? "w-6 bg-[#C94F78]" : "w-1.5 bg-white/40"}`} />
            ))}
          </div>
        </div>
      </div>

      <div className="px-5">
        
        {/* ── GRID CATEGORY FILTER (App Store Style) ── */}
        <div className="mb-8">
           <h3 className="text-sm font-semibold text-gray-800 capitalize tracking-widest mb-4 flex items-center gap-2">
             <Filter className="w-4 h-4 text-[#C94F78]" /> Telusuri Kategori
           </h3>
           <div className="grid grid-cols-2 gap-3 md:gap-4">
              {MAIN_CATEGORIES.map((cat) => (
                <Link 
                  key={cat.id} 
                  href={`/customer-portal/category/${encodeURIComponent(cat.type)}`}
                  className={`relative h-28 md:h-32 rounded-[24px] overflow-hidden transition-all duration-300 text-left p-4 md:p-5 group ${cat.bg} shadow-md hover:shadow-xl hover:scale-[1.02]`}
                >
                   {/* Decorative Elements */}
                   <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none group-hover:bg-white/30 transition-all duration-500" />
                   <div className="absolute bottom-0 left-0 w-24 h-24 bg-black/5 rounded-full blur-xl -ml-10 -mb-10 pointer-events-none" />
                   
                   <div className="relative z-10 flex flex-col h-full justify-between">
                      <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white shadow-sm border border-white/30 group-hover:scale-110 transition-transform duration-300">
                        <cat.icon className="w-5 h-5 md:w-6 md:h-6" strokeWidth={2.5} />
                      </div>
                      <div>
                         <span className="text-white text-[13px] md:text-[15px] font-bold leading-tight tracking-tight drop-shadow-sm block mb-0.5">
                           {cat.label}
                         </span>
                         <span className="text-white/80 text-[10px] md:text-[11px] font-medium tracking-wide drop-shadow-sm block">
                           {cat.desc}
                         </span>
                      </div>
                   </div>
                </Link>
              ))}
           </div>
        </div>

        {/* ── STICKY TAB FILTER ── */}
        <div className="sticky top-[184px] z-40 bg-[#FDFCFD]/80 backdrop-blur-md -mx-5 px-5 py-3 mb-6 flex items-center gap-2 overflow-x-auto no-scrollbar">
           {["semua", "promo", "set"].map((tab) => (
             <button 
               key={tab}
               onClick={() => setActiveTab(tab as any)}
               className={`whitespace-nowrap px-6 py-2 rounded-full text-[11px] font-semibold capitalize tracking-widest transition-all ${
                 activeTab === tab 
                   ? "bg-rose-50 text-[#C94F78] border border-rose-100" 
                   : "bg-white text-gray-400 border border-gray-100"
               }`}
             >
               {tab}
             </button>
           ))}
        </div>

        {/* ── PRODUCT GRID ── */}
        <div>
           {loading ? (
             <div className="py-20 flex flex-col items-center gap-4">
                <Loader2 className="w-8 h-8 text-[#C94F78] animate-spin" />
                <p className="text-xs font-semibold text-gray-400 capitalize tracking-widest">Memuat Layanan terbaik...</p>
             </div>
           ) : filtered.length === 0 ? (
             <div className="py-20 text-center flex flex-col items-center gap-4">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center">
                   <SearchIcon className="w-6 h-6 text-gray-200" />
                </div>
                <p className="text-sm font-semibold text-gray-300 capitalize tracking-widest">Produk tidak ditemukan</p>
                <button onClick={() => { setActiveTab("semua"); setSearchQuery(""); }} className="text-[11px] font-semibold text-[#C94F78] underline capitalize mt-2">Reset Filter</button>
             </div>
           ) : (
             <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-4 gap-y-6">
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
                           <div className="w-full h-full flex items-center justify-center text-rose-200 opacity-20 italic font-semibold text-4xl">LB</div>
                         )}
                         {hasPromo && (
                            <div className="absolute top-2.5 left-2.5 bg-emerald-500 text-white text-[9px] font-semibold px-2.5 py-1 rounded-lg">
                               PROMO
                            </div>
                         )}
                       </div>
                       
                       <div className="px-1 flex-1 flex flex-col justify-between">
                         <div>
                            <p className="text-[12px] font-semibold text-gray-800 line-clamp-2 mb-1 leading-tight h-8">{product.name}</p>
                            <p className="text-[10px] font-semibold text-gray-400 mb-2 truncate capitalize tracking-tighter">{product.sub_category || "Umum"}</p>
                         </div>
                         
                         <div className="flex items-center justify-between">
                            <div>
                               {hasPromo && (
                                 <p className="text-[10px] text-gray-300 line-through leading-none mb-0.5">Rp {product.selling_price.toLocaleString("id-ID")}</p>
                               )}
                               <p className="text-[14px] font-semibold text-[#C94F78]">Rp {displayPrice.toLocaleString("id-ID")}</p>
                            </div>
                            <div className="w-8 h-8 rounded-xl bg-rose-50 flex items-center justify-center text-[#C94F78] group-hover:bg-[#C94F78] group-hover:text-white transition-all shadow-sm">
                               <Plus className="w-4 h-4" />
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
               <div className="w-32 h-32 rounded-[28px] overflow-hidden bg-rose-50 border border-rose-100 shrink-0 relative">
                  {selectedProduct.image_url ? (
                    <Image src={selectedProduct.image_url} alt={selectedProduct.name} fill className="object-cover" />
                  ) : <div className="w-full h-full flex items-center justify-center text-rose-200 italic font-semibold text-4xl opacity-30">LB</div>}
               </div>
               <div className="flex-1 pt-2">
                  <p className="text-[12px] font-semibold text-[#C94F78] capitalize tracking-widest mb-1">{selectedProduct.type}</p>
                  <h3 className="text-lg font-semibold text-gray-900 leading-tight mb-4">{selectedProduct.name}</h3>
                  <div className="flex items-baseline gap-2">
                     <span className="text-xl font-semibold text-[#C94F78]">
                        Rp {((selectedVariant ? selectedVariant.price : selectedProduct.selling_price) - (selectedProduct.voucher_discount || 0)).toLocaleString("id-ID")}
                     </span>
                  </div>
               </div>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar space-y-8">
               {/* Variants */}
               {selectedProduct.variants && selectedProduct.variants.length > 0 && (
                 <div>
                    <h4 className="text-[12px] font-semibold text-gray-900 capitalize tracking-widest mb-4">Pilih Varian</h4>
                    <div className="flex flex-wrap gap-3">
                       {selectedProduct.variants.map((v) => (
                         <button 
                           key={v.id}
                           onClick={() => setSelectedVariant(v)}
                           className={`px-5 py-3 rounded-2xl text-[11px] font-semibold transition-all border ${
                             selectedVariant?.id === v.id 
                               ? "bg-[#C94F78] text-white border-[#C94F78] shadow-lg shadow-rose-100" 
                               : "bg-white text-gray-400 border-gray-100"
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
                  <h4 className="text-[12px] font-semibold text-gray-900 capitalize tracking-widest">Jumlah</h4>
                  <div className="flex items-center gap-6 bg-gray-50 rounded-2xl px-5 py-2.5 border border-gray-100">
                     <button 
                       onClick={() => setSelectionQty(Math.max(1, selectionQty - 1))}
                       className="text-gray-400 active:scale-125 transition-all"
                     >
                        <Minus className="w-4 h-4" />
                     </button>
                     <span className="text-base font-semibold text-gray-900 w-6 text-center">{selectionQty}</span>
                     <button 
                       onClick={() => setSelectionQty(Math.min(10, selectionQty + 1))}
                       className="text-gray-400 active:scale-125 transition-all"
                     >
                        <Plus className="w-4 h-4" />
                     </button>
                  </div>
               </div>
            </div>

            {/* Bottom Buttons */}
            <div className="pt-8 mt-4 grid grid-cols-[1fr_2.5fr] gap-4">
               <button 
                 onClick={handleAddToCart}
                 className="h-[64px] border-2 border-[#C94F78] text-[#C94F78] rounded-[24px] font-semibold text-[12px] tracking-widest flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
               >
                  <ShoppingBag className="w-5 h-5" />
                  CART
               </button>
               <button 
                 onClick={handleBuyNow}
                 className="h-[64px] bg-[#C94F78] text-white rounded-[24px] font-semibold text-[12px] tracking-widest flex items-center justify-center gap-3 shadow-xl shadow-rose-100 active:scale-[0.98] transition-all"
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
