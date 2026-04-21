"use client";
import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Home, ShoppingBag, Heart, LogOut, User, Search as SearchIcon, ShoppingCart } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { CartProvider, useCart } from "@/context/CartContext";

function CartBadge() {
  const { totalItems } = useCart();
  if (totalItems === 0) return null;
  return (
    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[8px] font-bold w-4 h-4 flex items-center justify-center rounded-full animate-pulse">
      {totalItems}
    </span>
  );
}

export default function CustomerPortalLayout({ children }: { children: React.ReactNode }) {
  const router   = useRouter();
  const pathname = usePathname();
  const [customer, setCustomer] = useState<any>(null);

  const isLoginPage = pathname === "/customer-portal/login";

  useEffect(() => {
    if (isLoginPage) return;

    const stored = localStorage.getItem("lbqueen_customer");
    if (!stored) {
      window.location.href = "/customer-portal/login";
    } else {
      try {
        setCustomer(JSON.parse(stored));
      } catch (e) {
        localStorage.removeItem("lbqueen_customer");
        window.location.href = "/customer-portal/login";
      }
    }
  }, [isLoginPage]);

  const handleLogout = () => {
    localStorage.removeItem("lbqueen_customer");
    window.location.href = "/customer-portal/login";
  };

  if (isLoginPage) return <>{children}</>;

  if (!customer) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 rounded-full border-4 border-pink-200 border-t-[#C94F78] animate-spin" />
        <p className="text-sm text-gray-400 font-medium">Memuat Portal…</p>
      </div>
    </div>
  );

  return (
    <CartProvider>
      <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-900 selection:bg-rose-100 selection:text-lb-rose">
        {/* Responsive Header (Glassmorphism) */}
        <header className="bg-white/80 backdrop-blur-xl border-b border-rose-50 sticky top-0 z-40 transition-all shadow-sm">
          <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between gap-6">
            <Link href="/customer-portal" className="shrink-0 group">
               <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl overflow-hidden bg-white border border-rose-100 flex items-center justify-center shadow-premium group-hover:scale-105 transition-transform">
                     <Image src="/lbqueen_logo.png" alt="LBQueen" width={32} height={32} className="object-contain" />
                  </div>
                  <div className="hidden sm:block">
                     <h1 className="text-sm font-black tracking-tighter text-gray-900 leading-none">LBQUEEN</h1>
                     <p className="text-[10px] font-bold text-lb-rose uppercase tracking-widest mt-1">Care & Beauty</p>
                  </div>
               </div>
            </Link>
            
            <div className="flex-1 max-w-xl relative group">
              <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-lb-rose transition-colors" />
              <input 
                type="text" 
                placeholder="Cari perawatan premium..." 
                className="w-full bg-gray-100/50 border-2 border-transparent rounded-2xl py-3 pl-11 pr-4 text-xs font-bold focus:bg-white focus:border-lb-rose focus:ring-4 focus:ring-rose-50 outline-none transition-all"
              />
            </div>

            <div className="flex items-center gap-2">
               <button className="hidden sm:flex items-center gap-2 p-2 bg-white border border-gray-100 rounded-2xl text-gray-500 hover:text-lb-rose hover:border-lb-rose shadow-sm transition-all">
                 <User className="w-5 h-5" />
                 <span className="text-[10px] font-black uppercase tracking-widest px-1">{customer?.name?.split(' ')[0]}</span>
               </button>
               <button className="sm:hidden p-3 bg-white border border-gray-100 rounded-2xl text-gray-500">
                 <User className="w-5 h-5" />
               </button>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 max-w-6xl mx-auto w-full pb-32">
          {children}
        </main>

        {/* Bottom Navigation (Floating Boutique Pill) */}
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[92%] max-w-xl bg-gray-900/90 backdrop-blur-2xl h-20 flex items-center justify-around px-8 z-50 rounded-[32px] shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-white/10">
          <Link href="/customer-portal" className="flex flex-col items-center gap-1.5 group">
            <div className={`p-2.5 rounded-2xl transition-all ${pathname === "/customer-portal" ? "bg-lb-rose text-white shadow-lg shadow-rose-900/20 scale-110" : "text-gray-500 group-hover:text-white"}`}>
              <Home className="w-5 h-5" />
            </div>
            <span className={`text-[9px] font-black uppercase tracking-widest ${pathname === "/customer-portal" ? "text-lb-rose" : "text-gray-500"}`}>Home</span>
          </Link>
          
          <button className="flex flex-col items-center gap-1.5 group relative">
            <div className="p-2.5 rounded-2xl text-gray-500 group-hover:text-white transition-all">
              <ShoppingBag className="w-5 h-5" />
              <CartBadge />
            </div>
            <span className="text-[9px] font-black uppercase tracking-widest text-gray-500">Cart</span>
          </button>

          <button className="flex flex-col items-center gap-1.5 group">
            <div className="p-2.5 rounded-2xl text-gray-500 group-hover:text-white transition-all">
              <Heart className="w-5 h-5" />
            </div>
            <span className="text-[9px] font-black uppercase tracking-widest text-gray-500">Likes</span>
          </button>

          <button onClick={handleLogout} className="flex flex-col items-center gap-1.5 group">
            <div className="p-2.5 rounded-2xl text-gray-500 group-hover:text-red-400 transition-all">
              <LogOut className="w-5 h-5" />
            </div>
            <span className="text-[9px] font-black uppercase tracking-widest text-gray-500">Exit</span>
          </button>
        </div>
      </div>
    </CartProvider>
  );
}
