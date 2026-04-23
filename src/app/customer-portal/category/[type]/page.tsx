"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import {
  ChevronLeft, Loader2, Plus, Minus, ShoppingBag, ArrowRight, Search as SearchIcon
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";

type ProductVariant = {
  id: number; product_id: number; variant_name: string; price: number; stock: number;
};

type Product = {
  id: number; name: string; type: string; selling_price: number;
  image_url: string | null; product_code: string; is_set: boolean;
  sub_category?: string; voucher_discount?: number; variants?: ProductVariant[];
};

const WA_NUMBER = "6282176171448";

export default function CategoryPage() {
  const params = useParams();
  const router = useRouter();
  const decodedType = decodeURIComponent(params.type as string);
  
  const { cart, addToCart } = useCart();
  const [products,       setProducts]       = useState<Product[]>([]);
  const [loading,        setLoading]        = useState(true);
  const [customer,       setCustomer]       = useState<any>(null);
  const [searchQuery,    setSearchQuery]    = useState("");
  
  const [activeSubCat,   setActiveSubCat]   = useState<string | null>(null);
  const [activeTab,      setActiveTab]      = useState<"semua" | "promo" | "set">("semua");

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [selectionQty,    setSelectionQty]    = useState(1);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [{ data: prods }, { data: vouchs }, { data: vars }] = await Promise.all([
      supabase.from("products").select("*").eq("type", decodedType).order("name"),
      supabase.from("vouchers").select("product_id, discount_amount").eq("is_active", true),
      supabase.from("product_variants").select("*").eq("is_active", true),
    ]);
    
    if (prods) {
      setProducts(prods.map((p: any) => {
        const v = vouchs?.find((v: any) => v.product_id === p.id);
        const pVars = vars?.filter((v: any) => v.product_id === p.id) || [];
        return { ...p, voucher_discount: v ? v.discount_amount : 0, variants: pVars };
      }));
    }
    setLoading(false);
  }, [decodedType]);

  useEffect(() => {
    fetchData();
    const stored = localStorage.getItem("lbqueen_customer");
    if (stored) { try { setCustomer(JSON.parse(stored)); } catch {} }
  }, [fetchData]);

  const filtered = useMemo(() => {
    return products.filter(p => {
      const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchSub = activeSubCat ? p.sub_category === activeSubCat : true;
      let matchTab = true;
      if (activeTab === "promo") matchTab = (p.voucher_discount ?? 0) > 0;
      if (activeTab === "set")   matchTab = p.is_set;
      return matchSearch && matchSub && matchTab;
    });
  }, [products, searchQuery, activeSubCat, activeTab]);

  const subCats = useMemo(() => {
    const cats = new Set<string>();
    products.forEach(p => { if (p.sub_category) cats.add(p.sub_category); });
    return Array.from(cats);
  }, [products]);

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
      {/* ── HEADER ── */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100 px-5 pt-12 pb-4 flex items-center gap-4">
        <button onClick={() => router.push("/customer-portal")} className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:text-[#C94F78] transition-all">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <div>
          <h1 className="text-lg font-bold text-gray-900 leading-tight">{decodedType}</h1>
          <p className="text-[11px] font-semibold text-gray-400 capitalize tracking-widest">{products.length} Produk Ditemukan</p>
        </div>
      </header>

      <div className="px-5 mt-6">
        {/* Search */}
        <div className="relative mb-6">
           <SearchIcon className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
           <input 
             type="text" 
             placeholder="Cari perawatan..." 
             className="w-full bg-white border border-gray-100 rounded-2xl py-4 pl-12 pr-4 text-sm font-medium text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-[#C94F78] focus:ring-4 focus:ring-rose-50 transition-all"
             value={searchQuery}
             onChange={(e) => setSearchQuery(e.target.value)}
           />
        </div>

        {/* Sub Categories Chips */}
        {subCats.length > 0 && (
          <div className="mb-6 flex gap-2 overflow-x-auto no-scrollbar py-1">
             <button 
                onClick={() => setActiveSubCat(null)}
                className={`whitespace-nowrap px-4 py-2 rounded-full text-[11px] font-semibold capitalize tracking-tight transition-all ${
                  !activeSubCat ? "bg-[#C94F78] text-white shadow-md shadow-rose-100" : "bg-white text-gray-400 border border-gray-100"
                }`}
             >
                Semua
             </button>
             {subCats.map(sub => (
               <button 
                 key={sub}
                 onClick={() => setActiveSubCat(activeSubCat === sub ? null : sub)}
                 className={`whitespace-nowrap px-4 py-2 rounded-full text-[11px] font-semibold capitalize tracking-tight transition-all ${
                   activeSubCat === sub ? "bg-[#C94F78] text-white shadow-md shadow-rose-100" : "bg-white text-gray-400 border border-gray-100"
                 }`}
               >
                 {sub}
               </button>
             ))}
          </div>
        )}

        {/* STICKY TAB FILTER */}
        <div className="sticky top-[88px] z-40 bg-[#FDFCFD]/90 backdrop-blur-md -mx-5 px-5 py-3 mb-6 flex items-center gap-2 overflow-x-auto no-scrollbar border-b border-gray-50/50">
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

        {/* PRODUCT GRID */}
        {loading ? (
          <div className="py-20 flex flex-col items-center gap-4">
             <Loader2 className="w-8 h-8 text-[#C94F78] animate-spin" />
             <p className="text-xs font-semibold text-gray-400 capitalize tracking-widest">Memuat...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center flex flex-col items-center gap-4">
             <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center">
                <SearchIcon className="w-6 h-6 text-gray-200" />
             </div>
             <p className="text-sm font-semibold text-gray-300 capitalize tracking-widest">Produk tidak ditemukan</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-4 gap-y-6">
             {filtered.map(product => {
               const hasPromo = (product.voucher_discount || 0) > 0;
               const displayPrice = product.selling_price - (product.voucher_discount || 0);
               return (
                 <div key={product.id} onClick={() => handleOpenSelection(product)}
                   className="bg-white rounded-[28px] border border-gray-50 p-2.5 flex flex-col group active:scale-[0.98] transition-all shadow-sm hover:shadow-md cursor-pointer">
                    <div className="aspect-square rounded-[22px] overflow-hidden relative bg-rose-50 mb-3">
                      {product.image_url ? (
                        <Image src={product.image_url} alt={product.name} fill className="object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-rose-200 opacity-20 italic font-semibold text-4xl">LB</div>
                      )}
                      {hasPromo && (
                         <div className="absolute top-2.5 left-2.5 bg-emerald-500 text-white text-[9px] font-semibold px-2.5 py-1 rounded-lg">PROMO</div>
                      )}
                    </div>
                    
                    <div className="px-1 flex-1 flex flex-col justify-between">
                      <div>
                         <p className="text-[12px] font-semibold text-gray-800 line-clamp-2 mb-1 leading-tight h-8">{product.name}</p>
                         <p className="text-[10px] font-semibold text-gray-400 mb-2 truncate capitalize tracking-tighter">{product.sub_category || "Umum"}</p>
                      </div>
                      
                      <div className="flex items-center justify-between">
                         <div>
                            {hasPromo && <p className="text-[10px] text-gray-300 line-through leading-none mb-0.5">Rp {product.selling_price.toLocaleString("id-ID")}</p>}
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
                     <button onClick={() => setSelectionQty(Math.max(1, selectionQty - 1))} className="text-gray-400 active:scale-125 transition-all"><Minus className="w-4 h-4" /></button>
                     <span className="text-base font-semibold text-gray-900 w-6 text-center">{selectionQty}</span>
                     <button onClick={() => setSelectionQty(Math.min(10, selectionQty + 1))} className="text-gray-400 active:scale-125 transition-all"><Plus className="w-4 h-4" /></button>
                  </div>
               </div>
            </div>

            {/* Bottom Buttons */}
            <div className="pt-8 mt-4 grid grid-cols-[1fr_2.5fr] gap-4">
               <button onClick={handleAddToCart} className="h-[64px] border-2 border-[#C94F78] text-[#C94F78] rounded-[24px] font-semibold text-[12px] tracking-widest flex items-center justify-center gap-2 active:scale-[0.98] transition-all">
                  <ShoppingBag className="w-5 h-5" /> CART
               </button>
               <button onClick={handleBuyNow} className="h-[64px] bg-[#C94F78] text-white rounded-[24px] font-semibold text-[12px] tracking-widest flex items-center justify-center gap-3 shadow-xl shadow-rose-100 active:scale-[0.98] transition-all">
                  BELI SEKARANG <ArrowRight className="w-5 h-5" />
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
