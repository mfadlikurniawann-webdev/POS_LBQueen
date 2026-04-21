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
      <div className="min-h-screen bg-white flex flex-col font-sans text-gray-900">
        {/* Search Header (Sticky like Gojek) */}
        <header className="bg-white border-b border-gray-100 sticky top-0 z-40 transition-all">
          <div className="max-w-md mx-auto px-5 h-16 flex items-center justify-between gap-4">
            <Link href="/customer-portal" className="shrink-0">
               <div className="w-8 h-8 rounded-lg overflow-hidden bg-white border border-pink-100 flex items-center justify-center">
                  <Image src="/lbqueen_logo.png" alt="LBQueen" width={28} height={28} className="object-contain" />
               </div>
            </Link>
            <div className="flex-1 relative">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                type="text" 
                placeholder="Cari perawatan kecantikan..." 
                className="w-full bg-gray-100 border-none rounded-full py-2 pl-9 pr-4 text-xs font-medium focus:ring-2 focus:ring-pink-200 outline-none"
              />
            </div>
            <button className="p-1.5 bg-gray-50 rounded-full text-gray-500 hover:text-[#C94F78]">
              <User className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 max-w-md mx-auto w-full pb-24">
          {children}
        </main>

        {/* Bottom Navigation (Floating Gojek Style) */}
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[90%] max-w-sm bg-white/90 backdrop-blur-md border border-gray-100 h-16 flex items-center justify-around px-4 z-50 rounded-3xl shadow-[0_8px_30px_rgba(0,0,0,0.12)]">
          <Link href="/customer-portal" className="flex flex-col items-center gap-1 group">
            <div className={`p-1.5 rounded-xl transition-all ${pathname === "/customer-portal" ? "bg-pink-100 text-[#C94F78]" : "text-gray-400 group-hover:text-pink-400"}`}>
              <Home className="w-5 h-5" />
            </div>
            <span className={`text-[10px] font-bold ${pathname === "/customer-portal" ? "text-[#C94F78]" : "text-gray-400"}`}>Beranda</span>
          </Link>
          <button className="flex flex-col items-center gap-1 group relative">
            <div className="p-1.5 rounded-xl text-gray-400 group-hover:text-pink-400">
              <ShoppingBag className="w-5 h-5" />
              <CartBadge />
            </div>
            <span className="text-[10px] font-bold text-gray-400">Keranjang</span>
          </button>
          <button className="flex flex-col items-center gap-1 group">
            <div className="p-1.5 rounded-xl text-gray-400 group-hover:text-pink-400">
              <Heart className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold text-gray-400">Favorit</span>
          </button>
          <button onClick={handleLogout} className="flex flex-col items-center gap-1 group text-red-400">
            <div className="p-1.5 rounded-xl text-gray-300 group-hover:text-red-400">
              <LogOut className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold text-gray-300">Keluar</span>
          </button>
        </div>
      </div>
    </CartProvider>
  );
}
