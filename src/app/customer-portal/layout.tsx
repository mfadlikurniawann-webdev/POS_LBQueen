"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { User, LogOut, ShoppingBag, Heart } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

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
    router.push("/customer-portal/login");
  };

  if (isLoginPage) return <>{children}</>;

  if (!customer) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 rounded-full border-4 border-emerald-200 border-t-emerald-600 animate-spin" />
        <p className="text-sm text-gray-400 font-medium">Memuat Portal…</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/customer-portal" className="flex items-center gap-2">
            <div className="w-9 h-9 bg-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-600/20">
              <Image src="/lbqueen_logo.png" alt="LBQueen" width={32} height={32} className="brightness-0 invert p-1" />
            </div>
            <div>
              <p className="font-bold text-gray-900 leading-none">LBQueen</p>
              <p className="text-[10px] text-emerald-600 font-bold tracking-wider uppercase">Portal Pelanggan</p>
            </div>
          </Link>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex flex-col items-end mr-2">
              <p className="text-sm font-bold text-gray-800">{customer.name}</p>
              <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-widest ${
                customer.is_member ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-500"
              }`}>
                {customer.is_member ? "✦ Member ✦" : "Reguler"}
              </span>
            </div>
            
            <div className="flex items-center gap-1 bg-gray-50 border border-gray-200 p-1 rounded-2xl">
              <button className="p-2 text-gray-400 hover:text-emerald-600 transition-colors">
                <User className="w-5 h-5" />
              </button>
              <button 
                onClick={handleLogout}
                className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                title="Log Keluar"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-8">
        {children}
      </main>

      {/* Bottom Nav Mobile */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 h-16 flex items-center justify-around px-4 z-40 shadow-[0_-4px_15px_rgba(0,0,0,0.03)]">
        <Link href="/customer-portal" className="flex flex-col items-center gap-1 text-emerald-600">
          <ShoppingBag className="w-5 h-5" />
          <span className="text-[10px] font-bold">Produk</span>
        </Link>
        <button className="flex flex-col items-center gap-1 text-gray-400">
          <Heart className="w-5 h-5" />
          <span className="text-[10px] font-bold">Favorit</span>
        </button>
        <button className="flex flex-col items-center gap-1 text-gray-400">
          <User className="w-5 h-5" />
          <span className="text-[10px] font-bold">Profil</span>
        </button>
      </div>
      
      <div className="md:hidden h-16" /> {/* Spacer for mobile nav */}
    </div>
  );
}
