"use client";
import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Home, ShoppingBag, LogOut, User } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { CartProvider, useCart } from "@/context/CartContext";

function CartBadge() {
  const { totalItems } = useCart();
  if (totalItems === 0) return null;
  return (
    <span className="absolute -top-1 -right-1 bg-[#C94F78] text-white text-[8px] font-bold w-4 h-4 flex items-center justify-center rounded-full">
      {totalItems}
    </span>
  );
}

function InnerLayout({ children, customer, handleLogout, pathname }: {
  children: React.ReactNode;
  customer: any;
  handleLogout: () => void;
  pathname: string;
}) {
  const { totalItems } = useCart();

  return (
    <div className="min-h-screen bg-[#FDF8FA] flex flex-col font-sans">

      {/* ── HEADER ── */}
      <header className="bg-white border-b border-rose-100 sticky top-0 z-40 shadow-[0_1px_8px_rgba(201,79,120,0.06)]">
        <div className="max-w-5xl mx-auto px-5 h-16 flex items-center justify-between gap-4">

          {/* Logo */}
          <Link href="/customer-portal" className="flex items-center gap-3 shrink-0">
            <div className="w-8 h-8 rounded-xl overflow-hidden bg-rose-50 border border-rose-100 flex items-center justify-center">
              <Image src="/lbqueen_logo.png" alt="LBQueen" width={22} height={22} className="object-contain" />
            </div>
            <div className="hidden sm:block">
              <p className="text-[13px] font-bold text-[#C94F78] leading-none">LBQueen</p>
              <p className="text-[9px] text-rose-300 tracking-widest uppercase mt-0.5">Care Beauty</p>
            </div>
          </Link>

          {/* Right */}
          <div className="flex items-center gap-3">
            {/* Cart icon */}
            <div className="relative">
              <div className="w-9 h-9 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center">
                <ShoppingBag className="w-4 h-4 text-[#C94F78]" />
                {totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 bg-[#C94F78] text-white text-[8px] font-bold w-4 h-4 flex items-center justify-center rounded-full">
                    {totalItems}
                  </span>
                )}
              </div>
            </div>

            {/* User */}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-rose-50 border border-rose-100 rounded-xl">
              <div className="w-6 h-6 rounded-full bg-[#C94F78] flex items-center justify-center text-white text-[10px] font-semibold">
                {customer?.name?.charAt(0)}
              </div>
              <span className="text-[11px] font-medium text-slate-700 hidden sm:block">
                {customer?.name?.split(" ")[0]}
              </span>
            </div>

            {/* Logout */}
            <button onClick={handleLogout}
              className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 hover:bg-rose-50 hover:text-[#C94F78] transition-all">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* ── CONTENT ── */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-6 pb-28">
        {children}
      </main>

      {/* ── BOTTOM NAV (Mobile) ── */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-rose-100 h-16 flex items-center z-50 safe-area-bottom">
        <Link href="/customer-portal"
          className={`flex-1 flex flex-col items-center justify-center gap-1 ${pathname === "/customer-portal" ? "text-[#C94F78]" : "text-slate-300"}`}>
          <Home className="w-5 h-5" />
          <span className="text-[9px] font-medium">Home</span>
        </Link>
        <div className="flex-1 flex flex-col items-center justify-center gap-1 text-slate-300">
          <div className="relative">
            <ShoppingBag className="w-5 h-5" />
            {totalItems > 0 && (
              <span className="absolute -top-1 -right-1 bg-[#C94F78] text-white text-[8px] w-3.5 h-3.5 flex items-center justify-center rounded-full font-bold">
                {totalItems}
              </span>
            )}
          </div>
          <span className="text-[9px] font-medium">Keranjang</span>
        </div>
        <button onClick={handleLogout}
          className="flex-1 flex flex-col items-center justify-center gap-1 text-slate-300">
          <LogOut className="w-5 h-5" />
          <span className="text-[9px] font-medium">Keluar</span>
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
    <div className="min-h-screen flex items-center justify-center bg-[#FDF8FA]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-rose-200 border-t-[#C94F78] animate-spin" />
        <p className="text-xs text-slate-400">Memuat portal...</p>
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
