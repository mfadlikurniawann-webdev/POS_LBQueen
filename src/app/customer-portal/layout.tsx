"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { Home, ShoppingBag, LogOut, Ticket, Star, User, ClipboardList, Menu } from "lucide-react";
import Link from "next/link";
import { CartProvider, useCart } from "@/context/CartContext";

function InnerLayout({ children, customer, handleLogout, pathname }: {
  children: React.ReactNode;
  customer: any;
  handleLogout: () => void;
  pathname: string;
}) {
  const { totalItems } = useCart();

  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-transparent flex flex-col font-sans selection:bg-rose-100 selection:text-lb-pink md:bg-[#FDFCFD]">

      {/* ── DESKTOP HEADER & BURGER MENU ── */}
      <header className="hidden md:flex items-center justify-between px-8 py-4 bg-white border-b border-gray-100 sticky top-0 z-[60]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center overflow-hidden p-1.5 border border-rose-100 shadow-sm">
            <Image src="/lbqueen_logo.png" alt="LBQueen" width={30} height={30} className="object-contain" />
          </div>
          <span className="font-bold text-[#C94F78] text-lg tracking-widest">LBQueen</span>
        </div>

        <button onClick={() => setMenuOpen(!menuOpen)} className="p-2 text-slate-500 hover:text-[#C94F78] transition-colors">
          <Menu className="w-6 h-6" />
        </button>

        {/* Desktop Slide-out Menu */}
        {menuOpen && (
          <div className="absolute top-[73px] right-8 w-64 bg-white border border-gray-100 shadow-2xl rounded-2xl p-4 flex flex-col gap-2">
             <Link href="/customer-portal" onClick={() => setMenuOpen(false)} className={`flex items-center gap-3 p-3 rounded-xl transition-all ${pathname === "/customer-portal" ? "bg-rose-50 text-[#C94F78]" : "text-slate-500 hover:bg-slate-50"}`}>
               <Home className="w-5 h-5" /> <span className="text-sm font-semibold">Home</span>
             </Link>
             <Link href="/customer-portal/promo" onClick={() => setMenuOpen(false)} className={`flex items-center gap-3 p-3 rounded-xl transition-all ${pathname === "/customer-portal/promo" ? "bg-rose-50 text-[#C94F78]" : "text-slate-500 hover:bg-slate-50"}`}>
               <Star className="w-5 h-5" /> <span className="text-sm font-semibold">Promo</span>
             </Link>
             <Link href="/customer-portal/cart" onClick={() => setMenuOpen(false)} className={`flex items-center gap-3 p-3 rounded-xl transition-all ${pathname === "/customer-portal/cart" ? "bg-rose-50 text-[#C94F78]" : "text-slate-500 hover:bg-slate-50"}`}>
               <ShoppingBag className="w-5 h-5" /> <span className="text-sm font-semibold">Keranjang</span>
             </Link>
             <Link href="/customer-portal/orders" onClick={() => setMenuOpen(false)} className={`flex items-center gap-3 p-3 rounded-xl transition-all ${pathname === "/customer-portal/orders" ? "bg-rose-50 text-[#C94F78]" : "text-slate-500 hover:bg-slate-50"}`}>
               <ClipboardList className="w-5 h-5" /> <span className="text-sm font-semibold">Pesanan</span>
             </Link>
             <Link href="/customer-portal/profile" onClick={() => setMenuOpen(false)} className={`flex items-center gap-3 p-3 rounded-xl transition-all ${pathname === "/customer-portal/profile" ? "bg-rose-50 text-[#C94F78]" : "text-slate-500 hover:bg-slate-50"}`}>
               <User className="w-5 h-5" /> <span className="text-sm font-semibold">Profil</span>
             </Link>
          </div>
        )}
      </header>

      {/* ── CONTENT ── */}
      <main className="flex-1 w-full pb-24 md:pb-8 max-w-[1920px] mx-auto">
        {children}
      </main>

      {/* ── BOTTOM NAV (Hidden on Desktop) ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 h-[72px] flex items-center z-50 safe-area-bottom px-6">
        <Link href="/customer-portal"
          className={`flex-1 flex flex-col items-center justify-center gap-1 ${pathname === "/customer-portal" ? "text-[#C94F78]" : "text-gray-400"}`}>
          <div className={`p-1 rounded-lg ${pathname === "/customer-portal" ? "bg-rose-50" : ""}`}>
             <Home className="w-6 h-6" />
          </div>
          <span className="text-[10px] font-semibold">Home</span>
        </Link>
        
        <Link href="/customer-portal/promo"
          className={`flex-1 flex flex-col items-center justify-center gap-1 ${pathname === "/customer-portal/promo" ? "text-[#C94F78]" : "text-gray-400"}`}>
          <div className={`p-1 rounded-lg ${pathname === "/customer-portal/promo" ? "bg-rose-50" : ""}`}>
             <Star className="w-6 h-6" />
          </div>
          <span className="text-[10px] font-semibold">Promo</span>
        </Link>

        <Link href="/customer-portal/cart"
          className={`flex-1 flex flex-col items-center justify-center gap-1 ${pathname === "/customer-portal/cart" ? "text-[#C94F78]" : "text-gray-400"}`}>
          <div className={`p-1 rounded-lg relative ${pathname === "/customer-portal/cart" ? "bg-rose-50" : ""}`}>
            <ShoppingBag className="w-6 h-6" />
            {totalItems > 0 && (
              <span className="absolute -top-1 -right-1 bg-[#C94F78] text-white text-[9px] w-4 h-4 flex items-center justify-center rounded-full font-semibold border-2 border-white">
                {totalItems}
              </span>
            )}
          </div>
          <span className="text-[10px] font-semibold">Keranjang</span>
        </Link>

        <Link href="/customer-portal/orders"
          className={`flex-1 flex flex-col items-center justify-center gap-1 ${pathname === "/customer-portal/orders" ? "text-[#C94F78]" : "text-gray-400"}`}>
          <div className={`p-1 rounded-lg relative ${pathname === "/customer-portal/orders" ? "bg-rose-50" : ""}`}>
            <ClipboardList className="w-6 h-6" />
          </div>
          <span className="text-[10px] font-semibold">Pesanan</span>
        </Link>

        <Link href="/customer-portal/profile"
          className={`flex-1 flex flex-col items-center justify-center gap-1 ${pathname === "/customer-portal/profile" ? "text-[#C94F78]" : "text-gray-400"}`}>
          <div className={`p-1 rounded-lg ${pathname === "/customer-portal/profile" ? "bg-rose-50" : ""}`}>
             <User className="w-6 h-6" />
          </div>
          <span className="text-[10px] font-semibold">Profil</span>
        </Link>
      </nav>
    </div>
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
    if (!stored) { window.location.href = "/customer-portal/login"; return; }
    try { setCustomer(JSON.parse(stored)); }
    catch { localStorage.removeItem("lbqueen_customer"); window.location.href = "/customer-portal/login"; }
  }, [isLoginPage]);

  const handleLogout = () => {
    localStorage.removeItem("lbqueen_customer");
    window.location.href = "/customer-portal/login";
  };

  if (isLoginPage) return <CartProvider>{children}</CartProvider>;

  if (!customer) return (
    <div className="min-h-screen flex items-center justify-center bg-transparent">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-rose-200 border-t-[#C94F78] animate-spin" />
        <p className="text-xs text-slate-400">Memuat...</p>
      </div>
    </div>
  );

  return (
    <CartProvider>
      <InnerLayout customer={customer} handleLogout={handleLogout} pathname={pathname}>
        {children}
      </InnerLayout>
    </CartProvider>
  );
}
