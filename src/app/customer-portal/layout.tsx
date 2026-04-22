"use client";
import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Home, ShoppingBag, LogOut, Ticket, Star } from "lucide-react";
import Link from "next/link";
import { CartProvider, useCart } from "@/context/CartContext";

function InnerLayout({ children, customer, handleLogout, pathname }: {
  children: React.ReactNode;
  customer: any;
  handleLogout: () => void;
  pathname: string;
}) {
  const { totalItems } = useCart();

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans selection:bg-rose-100 selection:text-lb-pink">

      {/* ── CONTENT ── */}
      <main className="flex-1 w-full pb-32">
        {children}
      </main>

      {/* ── BOTTOM NAV (Gojek Minimal Style) ── */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 h-[72px] flex items-center z-50 safe-area-bottom px-6">
        <Link href="/customer-portal"
          className={`flex-1 flex flex-col items-center justify-center gap-1 ${pathname === "/customer-portal" ? "text-[#C94F78]" : "text-gray-400"}`}>
          <div className={`p-1 rounded-lg ${pathname === "/customer-portal" ? "bg-rose-50" : ""}`}>
             <Home className="w-6 h-6" />
          </div>
          <span className="text-[10px] font-semibold">Home</span>
        </Link>
        
        <Link href="/customer-portal?tab=promo"
          className={`flex-1 flex flex-col items-center justify-center gap-1 ${pathname === "/customer-portal?tab=promo" ? "text-[#C94F78]" : "text-gray-400"}`}>
          <div className="p-1 rounded-lg">
             <Star className="w-6 h-6" />
          </div>
          <span className="text-[10px] font-semibold">Promo</span>
        </Link>

        <div className="flex-1 flex flex-col items-center justify-center gap-1 text-gray-400 relative">
          <div className="p-1 rounded-lg relative">
            <ShoppingBag className="w-6 h-6" />
            {totalItems > 0 && (
              <span className="absolute -top-1 -right-1 bg-[#C94F78] text-white text-[9px] w-4 h-4 flex items-center justify-center rounded-full font-bold border-2 border-white">
                {totalItems}
              </span>
            )}
          </div>
          <span className="text-[10px] font-semibold">Pesanan</span>
        </div>

        <button onClick={handleLogout}
          className="flex-1 flex flex-col items-center justify-center gap-1 text-gray-400">
          <div className="p-1 rounded-lg">
             <LogOut className="w-6 h-6" />
          </div>
          <span className="text-[10px] font-semibold">Exit</span>
        </button>
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
    <div className="min-h-screen flex items-center justify-center bg-white">
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
