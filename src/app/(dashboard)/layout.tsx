"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { ShoppingCart, Package, Clock, Users, FileText, LogOut } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("lbqueen_user");
    if (!storedUser) {
      router.push("/login");
    } else {
      setUser(JSON.parse(storedUser));
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("lbqueen_user");
    router.push("/login");
  };

  const navItems = [
    { icon: ShoppingCart, label: "Kasir", href: "/" },
    { icon: Package, label: "Stok Barang", href: "/stok" },
    { icon: Users, label: "Pelanggan", href: "/pelanggan" },
    { icon: FileText, label: "Laporan", href: "/laporan" },
  ];

  if (!user) return <div className="min-h-screen flex items-center justify-center">Memuat...</div>;

  return (
    <div className="flex flex-col md:flex-row h-screen bg-gray-50 overflow-hidden font-sans">
      
      {/* SIDEBAR (Desktop Only) */}
      <div className="hidden md:flex w-64 bg-white border-r border-gray-100 flex-col justify-between shadow-sm z-20 shrink-0">
        <div>
          <div className="h-20 flex items-center px-6 border-b border-gray-50 bg-white">
            <Image src="/lbqueen_logo.png" alt="LBQueen Logo" width={40} height={40} priority style={{ width: "auto", height: "auto" }} className="rounded-xl shadow-sm border border-pink-50" />
            <span className="ml-3 font-bold text-gray-800 text-xl tracking-tight">LBQueen <span className="text-lb-pink font-light">POS</span></span>
          </div>
          <nav className="p-4 space-y-1">
            <div className="mb-4 px-3 text-xs font-bold tracking-wider text-gray-400 uppercase">Menu Utama</div>
            {navItems.map((item, i) => {
              const active = pathname === item.href;
              return (
                <Link key={i} href={item.href} className={`flex items-center gap-4 p-3 rounded-2xl cursor-pointer transition-all ${active ? 'bg-gradient-to-r from-lb-pink to-lb-pink-dark text-white shadow-md shadow-pink-200' : 'text-gray-500 hover:bg-pink-50 hover:text-lb-pink font-medium'}`}>
                  <item.icon className={`w-5 h-5 ${active ? 'text-white' : ''}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
        
        <div className="p-4 border-t border-gray-50 bg-gray-50/50 m-4 rounded-3xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-white shadow-sm border border-gray-100 flex items-center justify-center text-lb-pink font-bold text-lg">
              {user.name.charAt(0)}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-bold text-gray-800 truncate">{user.name}</p>
              <p className="text-xs text-gray-400 capitalize truncate">{user.role.replace('_', ' ')}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-3 p-2.5 w-full rounded-xl text-red-500 hover:bg-red-50 hover:text-red-600 font-medium transition-all justify-center bg-white border border-red-100 shadow-sm">
            <LogOut className="w-4 h-4" />
            <span>Keluar</span>
          </button>
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col h-[calc(100vh-70px)] md:h-screen w-full relative z-10 bg-gray-50">
        {/* Mobile Top Header (Shows only on mobile) */}
        <div className="md:hidden h-16 bg-white border-b border-gray-100 flex items-center px-4 justify-between shrink-0 shadow-sm z-20">
          <div className="flex items-center gap-2">
			<Image src="/lbqueen_logo.png" alt="LBQueen" width={32} height={32} priority style={{ width: "auto", height: "auto" }} className="rounded-lg shadow-sm" />
            <span className="font-bold text-gray-800 text-lg">LBQueen <span className="text-lb-pink font-light">POS</span></span>
          </div>
          <div className="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center text-lb-pink font-bold border border-pink-200">
             {user.name.charAt(0)}
          </div>
        </div>

        {/* Content Wrapper */}
        <main className="flex-1 overflow-hidden relative">
          {children}
        </main>
      </div>

      {/* BOTTOM NAVIGATION BAR (Mobile Only) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 h-[70px] bg-white border-t border-gray-100 flex justify-around items-center z-50 pb-safe shadow-[0_-5px_20px_rgba(0,0,0,0.03)]">
        {navItems.map((item, i) => {
          const active = pathname === item.href;
          return (
            <Link key={i} href={item.href} className="flex flex-col items-center justify-center w-full h-full gap-1">
              <div className={`p-1.5 rounded-xl transition-all ${active ? 'bg-pink-100 text-lb-pink' : 'text-gray-400'}`}>
                <item.icon className="w-5 h-5" />
              </div>
              <span className={`text-[10px] font-semibold ${active ? 'text-lb-pink' : 'text-gray-400'}`}>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
