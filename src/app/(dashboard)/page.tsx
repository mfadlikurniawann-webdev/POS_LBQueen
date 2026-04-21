"use client";

import { useEffect, useState } from "react";
import { Search, ShoppingCart, Trash2, Package, CreditCard, Tag, UserCheck, X } from "lucide-react";

export default function KasirPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<any[]>([]);
  
  // Fitur Member & Voucher
  const [customers, setCustomers] = useState<any[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [vouchers, setVouchers] = useState<any[]>([]);
  const [selectedVoucher, setSelectedVoucher] = useState<any>(null);
  const [showCustomerModal, setShowCustomerModal] = useState(false);

  useEffect(() => {
    // Dummy Data untuk Demo Kasir POS Modern
    setCategories(["Treatment", "Retail Produk"]);
    setProducts([
      { id: 1, name: "Facial Wash Glowing", type: "Retail Produk", selling_price: 85000, stock: 45, image: "🌸" },
      { id: 2, name: "Acne Serum Extra", type: "Retail Produk", selling_price: 120000, stock: 12, image: "✨" },
      { id: 3, name: "Laser Rejuvenation", type: "Treatment", selling_price: 450000, stock: 999, image: "⚡" },
      { id: 4, name: "Korean BB Glow", type: "Treatment", selling_price: 350000, stock: 999, image: "💉" },
      { id: 5, name: "Body Lotion Premium", type: "Retail Produk", selling_price: 95000, stock: 30, image: "🧴" },
    ]);
    
    setCustomers([
      { id: 1, name: "Ayu Lestari", phone: "0812345678", is_member: true },
      { id: 2, name: "Bunga", phone: "0898765432", is_member: false },
    ]);
    
    setVouchers([
      { id: 1, code: "MEMBER50", name: "Diskon Member 50Rb", discount_amount: 50000, min_purchase: 200000 },
      { id: 2, code: "SPECIAL100", name: "Spesial Treatment", discount_amount: 100000, min_purchase: 500000 },
    ]);
  }, []);

  const addToCart = (product: any) => {
    const isExist = cart.find(item => item.id === product.id);
    if(isExist) {
      setCart(cart.map(item => item.id === product.id ? {...item, qty: item.qty + 1} : item));
    } else {
      setCart([...cart, {...product, qty: 1}]);
    }
  };

  const removeFromCart = (id: number) => setCart(cart.filter(item => item.id !== id));

  const subtotal = cart.reduce((acc, item) => acc + (item.selling_price * item.qty), 0);
  
  // Validasi Voucher
  let discount = 0;
  if(selectedVoucher && subtotal >= selectedVoucher.min_purchase && selectedCustomer?.is_member) {
      discount = selectedVoucher.discount_amount;
  } else if (selectedVoucher && subtotal < selectedVoucher.min_purchase) {
      discount = 0; // Invalid condition handled gracefully
  } else if (selectedVoucher && !selectedCustomer?.is_member) {
      discount = 0;
  }

  const totalAmount = Math.max(0, subtotal - discount);

  const filteredProducts = products.filter(p => 
    (activeCategory ? p.type === activeCategory : true) &&
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex h-full overflow-hidden flex-col md:flex-row">
      {/* MAIN CONTENT Area (KASIR PRODUCTS) */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-gray-50 border-r border-gray-100">
        <header className="h-[75px] bg-white border-b border-gray-100 px-6 flex items-center justify-between shrink-0 shadow-sm z-10">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 tracking-tight">Terminal Kasir</h1>
            <p className="text-sm text-gray-500">Pilih layanan atau produk</p>
          </div>
          <div className="relative w-64 md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input 
              type="text" 
              placeholder="Cari produk..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 bg-gray-100/80 border border-transparent rounded-2xl focus:bg-white focus:border-lb-pink/30 focus:ring-4 focus:ring-lb-pink/10 outline-none transition-all text-sm font-medium"
            />
          </div>
        </header>

        <div className="flex-1 overflow-auto p-6 md:p-8">
          <div className="flex gap-3 mb-8 overflow-x-auto pb-2 scrollbar-hide">
            <button 
              onClick={() => setActiveCategory(null)}
              className={`whitespace-nowrap px-6 py-2.5 rounded-2xl font-bold transition-all text-sm border ${activeCategory === null ? 'bg-gray-900 border-gray-900 text-white shadow-md' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`}
            >
              Semua
            </button>
            {categories.map(cat => (
              <button 
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`whitespace-nowrap px-6 py-2.5 rounded-2xl font-bold transition-all text-sm border ${activeCategory === cat ? 'bg-lb-pink border-lb-pink text-white shadow-md shadow-pink-200' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-5 pb-20 md:pb-0">
            {filteredProducts.map(product => (
              <div 
                key={product.id} 
                onClick={() => addToCart(product)}
                className="bg-white rounded-xl p-4 border border-gray-200 hover:border-lb-pink/50 shadow-sm hover:shadow-md cursor-pointer transition-all flex flex-col group"
              >
                <div className="aspect-square bg-gray-50 rounded-lg mb-3 flex items-center justify-center text-4xl group-hover:scale-105 transition-transform duration-300">
                  {product.image}
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-800 leading-tight text-sm md:text-base mb-1">{product.name}</h3>
                  <p className="text-[10px] uppercase font-bold tracking-wider text-gray-400 mb-3">{product.type}</p>
                </div>
                <div className="flex justify-between items-end mt-auto pt-2 border-t border-gray-50">
                  <span className="font-extrabold text-lb-pink text-sm md:text-base">Rp {product.selling_price.toLocaleString('id-ID')}</span>
                  {product.type === 'Retail Produk' && (
                    <span className="text-[10px] font-bold px-2 py-1 bg-gray-100 text-gray-600 rounded-lg">Stok: {product.stock}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CART / CHECKOUT SECTION */}
      <div className="w-full md:w-[350px] lg:w-[400px] bg-white border-l border-gray-200 flex flex-col h-full shadow-lg relative z-20 shrink-0">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
          <h2 className="font-bold text-lg flex items-center gap-2 text-gray-800">
            <ShoppingCart className="w-4 h-4 text-lb-pink" />Keranjang Transaksi
          </h2>
          <span className="bg-lb-pink text-white text-xs font-bold px-2.5 py-1 rounded-md">{cart.length} Item</span>
        </div>

        {/* Customer Select / Membership Input */}
        <div className="p-4 border-b border-gray-100 bg-white shrink-0">
          {!selectedCustomer ? (
            <button onClick={() => setShowCustomerModal(true)} className="w-full bg-gray-50 border border-gray-300 p-3 rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-100 transition-all flex items-center justify-center gap-2">
              <UserCheck className="w-4 h-4" /> Pilih Pelanggan & Member
            </button>
          ) : (
            <div className="bg-gray-50 border border-gray-200 p-3 rounded-lg relative">
              <button 
                onClick={() => { setSelectedCustomer(null); setSelectedVoucher(null); }} 
                className="absolute top-3 right-3 text-gray-400 hover:text-red-500"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white shadow-sm ${selectedCustomer.is_member ? 'bg-gradient-to-br from-yellow-400 to-yellow-600' : 'bg-gray-300'}`}>
                  {selectedCustomer.name.charAt(0)}
                </div>
                <div>
                  <h4 className="font-bold text-gray-800 text-sm">{selectedCustomer.name}</h4>
                  <p className="text-xs font-medium text-gray-500">{selectedCustomer.phone}</p>
                </div>
              </div>
              {selectedCustomer.is_member && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <p className="text-xs font-bold text-lb-pink mb-2 flex items-center gap-1"><Tag className="w-3 h-3"/> Pilih Voucher Member Aktif:</p>
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {vouchers.map(v => (
                       <button
                         key={v.id}
                         onClick={() => setSelectedVoucher(selectedVoucher?.id === v.id ? null : v)}
                         className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${selectedVoucher?.id === v.id ? 'bg-lb-pink text-white border-lb-pink' : 'bg-pink-50 text-lb-pink border-pink-100'}`}
                       >
                         {v.code} (-Rp{(v.discount_amount/1000).toFixed(0)}k)
                       </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Cart Items List */}
        <div className="flex-1 overflow-auto p-4 space-y-3 bg-gray-50/50">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400">
              <Package className="w-16 h-16 opacity-30 mb-4" />
              <p className="font-medium text-sm">Keranjang masih kosong</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.id} className="flex gap-3 p-3 bg-white rounded-xl border border-gray-200 relative group transition-all">
                <div className="w-12 h-12 bg-gray-50 rounded-lg flex items-center justify-center text-xl border border-gray-100">
                  {item.image}
                </div>
                <div className="flex-1 pr-6 tracking-tight">
                  <h4 className="font-bold text-gray-800 text-sm mb-0.5 line-clamp-1">{item.name}</h4>
                  <p className="text-lb-pink font-extrabold text-xs">Rp {item.selling_price.toLocaleString('id-ID')}</p>
                  
                  <div className="flex items-center gap-3 mt-2">
                    <div className="flex items-center gap-1 bg-gray-50 rounded-lg p-0.5 border border-gray-200">
                      <button onClick={(e) => { e.stopPropagation(); setCart(cart.map(c => c.id === item.id ? {...c, qty: Math.max(1, c.qty - 1)} : c))}} className="w-6 h-6 flex items-center justify-center text-gray-500 hover:text-gray-800 hover:bg-white rounded-md transition-colors" disabled={item.qty <= 1}>-</button>
                      <span className="text-xs font-bold w-4 text-center">{item.qty}</span>
                      <button onClick={(e) => { e.stopPropagation(); setCart(cart.map(c => c.id === item.id ? {...c, qty: c.qty + 1} : c))}} className="w-6 h-6 flex items-center justify-center text-gray-500 hover:text-gray-800 hover:bg-white rounded-md transition-colors">+</button>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => removeFromCart(item.id)}
                  className="absolute top-3 right-3 p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Checkout Footer */}
        <div className="p-4 bg-white border-t border-gray-200 shrink-0">
          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-gray-600 text-sm font-medium">
              <span>Subtotal</span>
              <span>Rp {subtotal.toLocaleString('id-ID')}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-green-600 text-sm font-bold bg-green-50 px-2 py-1 -mx-2 rounded-md">
                <span className="flex items-center gap-1"><Tag className="w-3 h-3"/> Diskon Member</span>
                <span>- Rp {discount.toLocaleString('id-ID')}</span>
              </div>
            )}
            <div className="pt-3 border-t border-gray-200 flex justify-between items-end mt-2">
              <span className="text-gray-800 font-bold">Total Bayar</span>
              <span className="text-2xl font-black text-lb-pink tracking-tight">Rp {totalAmount.toLocaleString('id-ID')}</span>
            </div>
          </div>
          
          <button 
            disabled={cart.length === 0}
            onClick={() => {
              if (selectedVoucher && subtotal < selectedVoucher.min_purchase) {
                alert(`Subtotal belum mencapai batas minimal (Rp ${selectedVoucher.min_purchase.toLocaleString()})`);
                return;
              }
              alert("Menu Pembayaran akan Terhubung!");
            }}
            className="w-full bg-gray-900 hover:bg-black disabled:opacity-50 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
          >
            <CreditCard className="w-5 h-5" />
            Proses Pembayaran
          </button>
        </div>
      </div>

      {/* Pelanggan Modal (Simple Mock) */}
      {showCustomerModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">Pilih Pelanggan</h3>
              <button onClick={() => setShowCustomerModal(false)}><X className="text-gray-400"/></button>
            </div>
            <div className="space-y-3">
              {customers.map(c => (
                <div key={c.id} onClick={() => { setSelectedCustomer(c); setShowCustomerModal(false); }} className="p-4 border rounded-2xl flex items-center justify-between cursor-pointer hover:border-lb-pink transition-all group">
                   <div>
                     <p className="font-bold text-gray-800 group-hover:text-lb-pink">{c.name}</p>
                     <p className="text-sm text-gray-500">{c.phone}</p>
                   </div>
                   {c.is_member && <span className="bg-yellow-100 text-yellow-700 text-xs font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">MEMBER</span>}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
