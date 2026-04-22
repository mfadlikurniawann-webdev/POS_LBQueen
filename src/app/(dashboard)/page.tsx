"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import {
  Search, ShoppingCart, Trash2, Package, CreditCard, Tag, UserCheck, X,
  Loader2, Flower2, Crown, Plus, Minus, CheckCircle2, Paintbrush2, Eye, Gem, Sparkles,
} from "lucide-react";
import Image from "next/image";

type ProductVariant = {
  id: number;
  product_id: number;
  variant_name: string;
  price: number;
  stock: number;
  is_active: boolean;
};

type Product = {
  id: number;
  name: string;
  type: string;
  selling_price: number;
  stock: number;
  unit: string;
  image_url: string | null;
  variants?: ProductVariant[];
};

type Customer = { id: number; name: string; phone: string; is_member: boolean };
type Voucher = { id: number; code: string; name: string; discount_amount: number; min_purchase: number };

type CartItem = {
  id: number;             // product id
  name: string;
  type: string;
  selling_price: number;  // effective price (variant price if chosen)
  stock: number;
  unit: string;
  image_url: string | null;
  qty: number;
  variant_id?: number | null;
  variant_name?: string | null;
  cartKey: string;        // unique key: productId + variantId
};

const RETAIL_TYPES = ["Retail Nail", "Retail Eyelash", "Retail Beauty"];
const SELLABLE_TYPES = ["Treatment Care & Beauty", "Product Care & Beauty", "Treatment", ...RETAIL_TYPES];

const typeIconMap: Record<string, React.ReactNode> = {
  "Treatment":               <Sparkles className="w-3 h-3" />,
  "Treatment Care & Beauty": <Flower2 className="w-3 h-3" />,
  "Product Care & Beauty":   <Package className="w-3 h-3" />,
  "Retail Nail":             <Paintbrush2 className="w-3 h-3" />,
  "Retail Eyelash":          <Eye className="w-3 h-3" />,
  "Retail Beauty":           <Gem className="w-3 h-3" />,
};

export default function KasirPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedVoucher, setSelectedVoucher] = useState<Voucher | null>(null);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showVariantModal, setShowVariantModal] = useState(false);
  const [variantTarget, setVariantTarget] = useState<Product | null>(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [toastMsg, setToastMsg] = useState("");

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 3500);
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [{ data: prods }, { data: custs }, { data: vouchs }] = await Promise.all([
      supabase
        .from("products")
        .select("*, variants:product_variants(*)")
        .in("type", SELLABLE_TYPES)
        .order("name"),
      supabase.from("customers").select("*").order("name"),
      supabase.from("vouchers").select("*").eq("is_active", true),
    ]);
    setProducts(prods || []);
    setCustomers(custs || []);
    setVouchers(vouchs || []);
    const types = [...new Set((prods || []).map((p: Product) => p.type))];
    setCategories(types);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Click product card
  const handleProductClick = (product: Product) => {
    const activeVariants = (product.variants || []).filter(v => v.is_active);
    if (activeVariants.length > 0) {
      // Has variants — show selector modal
      setVariantTarget(product);
      setShowVariantModal(true);
    } else {
      // No variants — add directly
      addToCartDirect(product, null, null, product.selling_price);
    }
  };

  const addToCartDirect = (product: Product, variantId: number | null, variantName: string | null, effectivePrice: number) => {
    const cartKey = `${product.id}-${variantId ?? "base"}`;
    setCart(prev => {
      const existing = prev.find(i => i.cartKey === cartKey);
      if (existing) return prev.map(i => i.cartKey === cartKey ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, {
        id: product.id,
        name: product.name,
        type: product.type,
        selling_price: effectivePrice,
        stock: product.stock,
        unit: product.unit,
        image_url: product.image_url,
        qty: 1,
        variant_id: variantId,
        variant_name: variantName,
        cartKey,
      }];
    });
  };

  const selectVariant = (variant: ProductVariant) => {
    if (!variantTarget) return;
    addToCartDirect(variantTarget, variant.id, variant.variant_name, variant.price);
    setShowVariantModal(false);
    setVariantTarget(null);
  };

  const updateQty = (cartKey: string, delta: number) => {
    setCart(prev => prev.map(i => i.cartKey === cartKey ? { ...i, qty: Math.max(1, i.qty + delta) } : i));
  };

  const removeFromCart = (cartKey: string) => setCart(prev => prev.filter(i => i.cartKey !== cartKey));

  const subtotal = cart.reduce((acc, i) => acc + i.selling_price * i.qty, 0);
  const discount = (selectedVoucher && selectedCustomer?.is_member && subtotal >= selectedVoucher.min_purchase)
    ? selectedVoucher.discount_amount : 0;
  const total = Math.max(0, subtotal - discount);
  const change = Math.max(0, (parseFloat(paymentAmount) || 0) - total);

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    const paid = parseFloat(paymentAmount);
    if (!paid || paid < total) { showToast("Jumlah bayar kurang!"); return; }
    setProcessing(true);
    try {
      const invoiceNumber = `INV-${Date.now()}`;
      const { data: txn, error: txnErr } = await supabase.from("transactions").insert({
        invoice_number: invoiceNumber,
        customer_id: selectedCustomer?.id || null,
        voucher_id: selectedVoucher?.id || null,
        subtotal, discount_applied: discount, total_amount: total,
        payment: paid, change_amount: change,
      }).select().single();

      if (txnErr) throw txnErr;

      const details = cart.map(i => ({
        transaction_id: txn.id,
        product_id: i.id,
        quantity: i.qty,
        price: i.selling_price,
        subtotal: i.selling_price * i.qty,
        variant_id: i.variant_id || null,
        variant_name: i.variant_name || null,
      }));
      await supabase.from("transaction_details").insert(details);

      // Update stock untuk Retail products & variannya
      for (const item of cart) {
        if (RETAIL_TYPES.includes(item.type)) {
          if (item.variant_id) {
            // Update stok varian
            const variant = products
              .find(p => p.id === item.id)
              ?.variants?.find(v => v.id === item.variant_id);
            if (variant) {
              await supabase.from("product_variants").update({ stock: variant.stock - item.qty }).eq("id", item.variant_id);
            }
          } else {
            // Update stok produk langsung
            const prod = products.find(p => p.id === item.id);
            if (prod) {
              await supabase.from("products").update({ stock: prod.stock - item.qty }).eq("id", item.id);
            }
          }
        }
      }

      setCart([]); setSelectedCustomer(null); setSelectedVoucher(null);
      setPaymentAmount(""); setShowPaymentModal(false);
      showToast(`Transaksi ${invoiceNumber} berhasil!`);
      fetchData();
    } catch (e: any) {
      showToast("Gagal menyimpan transaksi. Periksa koneksi.");
    } finally { setProcessing(false); }
  };

  const filtered = products.filter(p =>
    (activeCategory ? p.type === activeCategory : true) &&
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const categoryLabel = (cat: string) => {
    const shortMap: Record<string, string> = {
      "Treatment Care & Beauty": "Treatment C&B",
      "Product Care & Beauty": "Product C&B",
    };
    return shortMap[cat] || cat;
  };

  return (
    <div className="flex h-full overflow-hidden bg-white font-sans">
      {/* TOAST */}
      {toastMsg && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[100] bg-slate-900 text-white px-8 py-4 rounded-[20px] text-[11px] font-bold uppercase tracking-widest shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-6">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" /> {toastMsg}
        </div>
      )}

      {/* === PRODUK AREA (Kiri) === */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative bg-white">
        {/* Toolbar: Search */}
        <div className="px-8 pt-8 pb-4 shrink-0">
          <div className="relative group">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 transition-colors group-focus-within:text-[#C94F78]" />
            <input type="text" placeholder="Cari perawatan atau produk..." value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-14 pr-7 py-4.5 bg-slate-50 border border-transparent rounded-[24px] text-sm font-semibold text-slate-700 focus:bg-white focus:border-rose-100 outline-none transition-all shadow-inner" />
          </div>
        </div>

        {/* Categories */}
        <div className="px-8 pb-4 overflow-x-auto scrollbar-hide flex gap-3 shrink-0">
          {["Semua", ...categories].map(cat => {
            const active = (cat === "Semua" && !activeCategory) || activeCategory === cat;
            return (
              <button key={cat} onClick={() => setActiveCategory(cat === "Semua" ? null : cat)}
                className={`whitespace-nowrap px-5 py-2.5 rounded-full text-[10px] font-bold uppercase tracking-[0.12em] transition-all border flex items-center gap-1.5 ${
                  active
                    ? "bg-[#C94F78] border-[#C94F78] text-white shadow-luxury-pink scale-[1.02]"
                    : "bg-transparent border-slate-100 text-slate-400 hover:bg-[#C94F78] hover:border-[#C94F78] hover:text-white hover:shadow-luxury-pink"
                }`}>
                {typeIconMap[cat] && <span className="opacity-70">{typeIconMap[cat]}</span>}
                {categoryLabel(cat)}
              </button>
            );
          })}
        </div>

        {/* Product Grid */}
        <div className="flex-1 overflow-auto px-8 py-6 scrollbar-hide mb-20 md:mb-0">
          {loading ? (
            <div className="h-full flex items-center justify-center"><Loader2 className="w-8 h-8 text-[#C94F78] animate-spin opacity-20" /></div>
          ) : filtered.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-200">
              <Package className="w-32 h-32 opacity-20 mb-8" strokeWidth={1.5} />
              <p className="font-bold text-xl tracking-tight text-slate-400">Belum ada produk</p>
              <p className="text-xs text-slate-300 mt-2 uppercase tracking-widest font-semibold font-sans">Coba kata kunci lain</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-8">
              {filtered.map(p => {
                const activeVariants = (p.variants || []).filter(v => v.is_active);
                const hasVariants = activeVariants.length > 0;
                return (
                  <button key={p.id} onClick={() => handleProductClick(p)}
                    className="group bg-white rounded-[32px] p-3.5 border border-transparent hover:border-rose-50 shadow-premium hover:shadow-luxury-pink transition-all duration-500 text-left relative flex flex-col scale-100 active:scale-[0.98]">
                    <div className="aspect-square rounded-[24px] bg-rose-50/30 overflow-hidden mb-5 relative">
                      {p.image_url ? (
                        <Image src={p.image_url} alt={p.name} fill className="object-cover group-hover:scale-110 transition-transform duration-700" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center opacity-30">
                          {typeIconMap[p.type] ? (
                            <span className="text-[#C94F78] scale-[3]">{typeIconMap[p.type]}</span>
                          ) : (
                            <Flower2 className="w-10 h-10 text-[#C94F78]" />
                          )}
                        </div>
                      )}
                      <div className="absolute top-3 right-3 bg-white/80 backdrop-blur-md rounded-xl px-2.5 py-1.5 shadow-sm border border-white/20">
                        <p className="text-[8px] font-bold text-[#C94F78] uppercase tracking-wider">{p.type.split(' ')[0]}</p>
                      </div>
                      {hasVariants && (
                        <div className="absolute bottom-3 left-3 bg-[#C94F78]/90 backdrop-blur-md rounded-lg px-2 py-1 text-white">
                          <p className="text-[8px] font-bold uppercase tracking-wider flex items-center gap-1">
                            <Tag className="w-2.5 h-2.5" /> {activeVariants.length} Varian
                          </p>
                        </div>
                      )}
                    </div>
                    <div className="px-1.5 flex-1 flex flex-col">
                      <h4 className="font-semibold text-slate-800 text-sm leading-tight line-clamp-2 mb-4 group-hover:text-[#C94F78] transition-colors">{p.name}</h4>
                      <div className="mt-auto flex items-center justify-between">
                        <div>
                          {hasVariants ? (
                            <p className="font-bold text-[#C94F78] text-xs tracking-tight">
                              Rp {Math.min(...activeVariants.map(v => v.price)).toLocaleString("id-ID")}
                              <span className="text-slate-400 font-medium"> ↑</span>
                            </p>
                          ) : (
                            <p className="font-bold text-[#C94F78] text-base tracking-tight">Rp {p.selling_price.toLocaleString("id-ID")}</p>
                          )}
                        </div>
                        <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center group-hover:bg-[#C94F78] transition-all duration-300">
                          {hasVariants
                            ? <Tag className="w-4 h-4 text-slate-300 group-hover:text-white" />
                            : <Plus className="w-4 h-4 text-slate-300 group-hover:text-white" />
                          }
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* === CART SIDEBAR (Kanan) === */}
      <div className="hidden md:flex w-[400px] bg-white border-l border-slate-100 flex-col shrink-0 relative z-40 shadow-[-20px_0_60px_rgba(0,0,0,0.015)]">
        {/* Cart Header */}
        <div className="p-10 border-b border-slate-50 flex items-center gap-5">
          <div className="w-12 h-12 rounded-[20px] bg-slate-50 flex items-center justify-center border border-slate-100">
            <ShoppingCart className="w-5 h-5 text-slate-400" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-lg leading-none">Keranjang</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-2.5">{cart.length} ITEM DIPILIH</p>
          </div>
        </div>

        {/* Customer Selector */}
        <div className="p-8">
          {!selectedCustomer ? (
            <button onClick={() => setShowCustomerModal(true)}
              className="w-full flex items-center justify-center gap-4 py-4.5 rounded-[24px] border-1.5 border-rose-50 text-[#C94F78] font-bold text-xs hover:bg-rose-50/50 hover:shadow-luxury-pink transition-all">
              <UserCheck className="w-5 h-5" /> Pilih Pelanggan / Cek Member
            </button>
          ) : (
            <div className="bg-slate-50/50 border border-slate-100 p-5 rounded-[28px] flex items-center justify-between group px-6">
              <div className="flex items-center gap-4">
                <div className={`w-11 h-11 rounded-full flex items-center justify-center font-bold text-white shadow-sm ${selectedCustomer.is_member ? "bg-orange-400" : "bg-slate-300"}`}>
                  {selectedCustomer.name.charAt(0)}
                </div>
                <div>
                  <p className="font-bold text-slate-800 text-sm">{selectedCustomer.name}</p>
                  {selectedCustomer.is_member && <p className="text-[9px] font-bold text-orange-500 uppercase tracking-widest mt-1">Premium Member</p>}
                </div>
              </div>
              <button onClick={() => { setSelectedCustomer(null); setSelectedVoucher(null); }} className="text-slate-300 hover:text-rose-500 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-auto px-8 space-y-5 scrollbar-hide py-2">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center px-12 pb-12">
              <div className="w-24 h-24 rounded-full bg-slate-50 flex items-center justify-center mb-8 border border-slate-100 opacity-50">
                <ShoppingCart className="w-10 h-10 text-slate-300" />
              </div>
              <p className="font-bold text-base text-slate-900 mb-2.5">Keranjang Masih Kosong</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">Pilih produk di kiri untuk menambahkan pesanan</p>
            </div>
          ) : cart.map(item => (
            <div key={item.cartKey} className="flex gap-5 p-3 group hover:bg-slate-50/70 rounded-[24px] transition-all duration-300">
              <div className="w-15 h-15 rounded-[18px] bg-rose-50/50 overflow-hidden shrink-0 border border-rose-50">
                {item.image_url
                  ? <Image src={item.image_url} alt={item.name} width={60} height={60} className="object-cover w-full h-full" />
                  : <div className="w-full h-full flex items-center justify-center text-pink-200"><Flower2 className="w-7 h-7" /></div>
                }
              </div>
              <div className="flex-1 min-w-0 flex flex-col justify-center">
                <p className="font-semibold text-slate-900 text-sm truncate mb-0.5">{item.name}</p>
                {item.variant_name && (
                  <p className="text-[10px] font-bold text-[#C94F78] flex items-center gap-1 mb-1">
                    <Tag className="w-2.5 h-2.5" />{item.variant_name}
                  </p>
                )}
                <p className="text-[11px] font-bold text-[#C94F78] mb-3">Rp {item.selling_price.toLocaleString("id-ID")}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 bg-white border border-slate-100 rounded-xl px-2.5 py-1">
                    <button onClick={() => updateQty(item.cartKey, -1)} className="text-slate-400 font-bold p-1 hover:text-slate-900 transition-colors"> <Minus className="w-3.5 h-3.5" /> </button>
                    <span className="text-xs font-bold text-slate-800 w-5 text-center">{item.qty}</span>
                    <button onClick={() => updateQty(item.cartKey, 1)} className="text-slate-400 font-bold p-1 hover:text-slate-900 transition-colors"> <Plus className="w-3.5 h-3.5" /> </button>
                  </div>
                  <button onClick={() => removeFromCart(item.cartKey)} className="text-slate-200 hover:text-rose-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer Area */}
        <div className="p-10 bg-white border-t border-slate-50">
          <div className="space-y-4 mb-10">
            <div className="flex justify-between text-[11px] font-bold text-slate-400 uppercase tracking-widest">
              <span>Subtotal</span>
              <span className="text-slate-600 font-bold">Rp {subtotal.toLocaleString("id-ID")}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-[11px] font-bold text-emerald-500 uppercase tracking-widest">
                <span>Diskon Member</span>
                <span>- Rp {discount.toLocaleString("id-ID")}</span>
              </div>
            )}
            <div className="flex justify-between items-baseline pt-6 border-t border-slate-50">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">TOTAL TAGIHAN</span>
              <span className="text-3xl font-bold text-[#C94F78] tracking-tight">Rp {total.toLocaleString("id-ID")}</span>
            </div>
          </div>
          <button onClick={() => setShowPaymentModal(true)} disabled={cart.length === 0}
            className={`w-full py-5.5 rounded-[24px] font-bold text-[11px] uppercase tracking-[0.25em] transition-all flex items-center justify-center gap-4 shadow-xl 
               ${cart.length === 0 ? "bg-slate-100 text-slate-300 shadow-none cursor-not-allowed" : "bg-slate-900 text-white hover:bg-rose-600 hover:shadow-luxury-pink active:scale-[0.98]"}`}>
            <CreditCard className="w-5 h-5 text-rose-300" /> Konfirmasi Pembayaran
          </button>
        </div>
      </div>

      {/* ===== VARIANT SELECTION MODAL ===== */}
      {showVariantModal && variantTarget && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
          <div className="bg-white rounded-[40px] p-8 w-full max-w-md shadow-2xl animate-in zoom-in-95 max-h-[85vh] overflow-auto">
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-start gap-4 flex-1 min-w-0">
                {variantTarget.image_url && (
                  <div className="w-16 h-16 rounded-[20px] overflow-hidden bg-rose-50 shrink-0 border border-rose-100">
                    <Image src={variantTarget.image_url} alt={variantTarget.name} width={64} height={64} className="object-cover w-full h-full" />
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{variantTarget.type}</p>
                  <h3 className="text-lg font-extrabold text-gray-900 leading-tight">{variantTarget.name}</h3>
                  <p className="text-[10px] font-bold text-[#C94F78] mt-1 uppercase tracking-widest">
                    {(variantTarget.variants?.filter(v => v.is_active) || []).length} Varian Tersedia
                  </p>
                </div>
              </div>
              <button onClick={() => { setShowVariantModal(false); setVariantTarget(null); }}
                className="w-10 h-10 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400 shrink-0 ml-4">
                <X />
              </button>
            </div>

            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Pilih Varian</p>

            <div className="space-y-3">
              {(variantTarget.variants || []).filter(v => v.is_active).map(variant => (
                <button key={variant.id} onClick={() => selectVariant(variant)}
                  className="w-full flex items-center justify-between p-5 rounded-[24px] border-2 border-gray-50 bg-gray-50/50 hover:bg-white hover:border-[#C94F78] hover:shadow-luxury-pink transition-all group">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-2xl bg-rose-50 flex items-center justify-center group-hover:bg-[#C94F78] transition-all">
                      <Tag className="w-4 h-4 text-[#C94F78] group-hover:text-white transition-colors" />
                    </div>
                    <div className="text-left">
                      <p className="font-black text-gray-800 text-sm group-hover:text-[#C94F78] transition-colors">{variant.variant_name}</p>
                      <p className="text-[10px] text-gray-400 font-bold mt-0.5">Stok: {variant.stock} {variantTarget.unit}</p>
                    </div>
                  </div>
                  <p className="font-black text-[#C94F78] text-base">Rp {variant.price.toLocaleString("id-ID")}</p>
                </button>
              ))}
            </div>

            {/* Option: add without variant (use base price) */}
            <button onClick={() => { addToCartDirect(variantTarget, null, null, variantTarget.selling_price); setShowVariantModal(false); setVariantTarget(null); }}
              className="w-full mt-4 py-3.5 border-2 border-dashed border-gray-200 rounded-[24px] text-xs font-bold text-gray-400 hover:text-gray-600 hover:border-gray-300 transition-all">
              Tambah Tanpa Varian (Harga Default: Rp {variantTarget.selling_price.toLocaleString("id-ID")})
            </button>
          </div>
        </div>
      )}

      {/* Customer Modal */}
      {showCustomerModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-[40px] p-8 w-full max-w-md shadow-2xl animate-in zoom-in-95 overflow-hidden">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-black text-gray-900">Pilih Pelanggan</h3>
              <button onClick={() => setShowCustomerModal(false)} className="w-10 h-10 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400"><X /></button>
            </div>
            <div className="space-y-3 max-h-96 overflow-auto scrollbar-hide">
              {customers.map(c => (
                <button key={c.id} onClick={() => { setSelectedCustomer(c); setShowCustomerModal(false); }}
                  className="w-full flex items-center justify-between p-5 rounded-[24px] border border-gray-50 bg-gray-50/50 hover:bg-white hover:border-pink-200 hover:shadow-lg transition-all group">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-white ${c.is_member ? "bg-orange-400" : "bg-gray-300"}`}>
                      {c.name.charAt(0)}
                    </div>
                    <div className="text-left">
                      <p className="font-black text-gray-800 text-sm group-hover:text-[#C94F78]">{c.name}</p>
                      <p className="text-[10px] text-gray-400 font-bold uppercase mt-1">{c.phone}</p>
                    </div>
                  </div>
                  {c.is_member && <Crown className="w-4 h-4 text-orange-400" />}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-[40px] p-10 w-full max-w-sm shadow-2xl animate-in zoom-in-95">
            <h3 className="text-2xl font-black text-gray-900 mb-8">Pembayaran</h3>
            <div className="bg-gray-50 p-6 rounded-[24px] mb-8 border border-gray-100">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Tagihan Total</p>
              <p className="text-3xl font-black text-[#C94F78] tracking-tighter">Rp {total.toLocaleString("id-ID")}</p>
            </div>
            <div className="mb-8">
              <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest block mb-3">Jumlah Bayar (Tunai)</label>
              <input type="number" value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)}
                className="w-full px-6 py-4 rounded-2xl bg-gray-100 border-2 border-transparent focus:bg-white focus:border-[#C94F78] text-xl font-black outline-none transition-all"
                placeholder="0" autoFocus />
              {parseFloat(paymentAmount) >= total && (
                <div className="mt-4 flex justify-between items-center px-2">
                  <span className="text-[11px] font-black text-emerald-500 uppercase tracking-widest">Kembalian</span>
                  <span className="text-lg font-black text-emerald-600">Rp {change.toLocaleString("id-ID")}</span>
                </div>
              )}
            </div>
            <div className="flex flex-col gap-3">
              <button onClick={handleCheckout} disabled={processing || !paymentAmount || parseFloat(paymentAmount) < total}
                className="w-full py-5 bg-gray-900 text-white rounded-[24px] font-black text-xs uppercase tracking-widest hover:bg-[#C94F78] transition-all disabled:opacity-20 shadow-xl shadow-gray-100">
                Konfirmasi Transaksi
              </button>
              <button onClick={() => setShowPaymentModal(false)} className="w-full py-4 text-gray-400 font-bold text-xs uppercase tracking-widest">Batal</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
