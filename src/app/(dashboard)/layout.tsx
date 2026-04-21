"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { ShoppingCart, Package, Users, FileText, LogOut, Bell } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

type PageMeta = { title: string; subtitle: string; Icon: React.ElementType };

const PAGE_META: Record<string, PageMeta> = {
  "/":          { title: "Terminal Kasir",       subtitle: "Pilih produk & proses pembayaran",         Icon: ShoppingCart },
  "/stok":      { title: "Manajemen Inventaris", subtitle: "Kelola produk & layanan klinik",           Icon: Package      },
  "/pelanggan": { title: "Pelanggan & Member",   subtitle: "Database pelanggan & loyalty",             Icon: Users        },
  "/laporan":   { title: "Laporan Keuangan",     subtitle: "Rekap transaksi & omzet",                  Icon: FileText     },
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router   = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const stored = localStorage.getItem("lbqueen_user");
    if (!stored) { router.push("/login"); }
    else { setUser(JSON.parse(stored)); }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("lbqueen_user");
    router.push("/login");
  };

  const navItems = [
    { Icon: ShoppingCart, label: "Beranda",     href: "/"          },
    { Icon: Package,      label: "Inventori",   href: "/stok"      },
    { Icon: Users,        label: "Pelanggan",   href: "/pelanggan" },
    { Icon: FileText,     label: "Laporan",     href: "/laporan"   },
  ];

  const meta = PAGE_META[pathname] ?? PAGE_META["/"];

  if (!user) return (
    <div className="min-h-screen flex items-center justify-center bg-white font-sans">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-full border-4 border-pink-100 border-t-[#A83E60] animate-spin" />
        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest animate-pulse">Memuat Sistem...</p>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col md:flex-row h-screen bg-gray-50/50 overflow-hidden font-sans">

      {/* ── SIDEBAR (Desktop) ──────────────────────────────────────── */}
      <div className="hidden md:flex w-64 bg-white border-r border-gray-100 flex-col justify-between z-30 shrink-0">
        <div>
          <div className="h-24 flex flex-col items-center justify-center border-b border-gray-50 mb-4">
            <div className="flex items-center gap-3">
              <Image src="/lbqueen_logo.png" alt="LBQueen" width={32} height={32} priority />
              <div>
                <p className="font-black text-[#A83E60] text-lg leading-none tracking-tighter italic">LBQueen</p>
                <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Care & Beauty</p>
              </div>
            </div>
          </div>

          <nav className="px-3 space-y-1">
            {navItems.map(({ Icon, label, href }) => {
              const active = pathname === href;
              return (
                <Link key={href} href={href}
                  className={`flex items-center gap-4 py-3.5 px-4 rounded-xl transition-all relative group
                    ${active
                      ? "bg-pink-50/50 text-[#A83E60]"
                      : "text-gray-400 hover:bg-gray-50 hover:text-gray-600"
                    }`}>
                  <Icon className={`w-5 h-5 shrink-0 ${active ? "text-[#A83E60]" : "text-gray-300"}`} />
                  <span className={`text-sm font-bold ${active ? "opacity-100" : "opacity-80"}`}>{label}</span>
                  {active && <div className="absolute right-0 top-2 bottom-2 w-1 bg-[#A83E60] rounded-l-full shadow-[0_0_8px_rgba(168,62,96,0.5)]" />}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer (User) */}
        <div className="p-4 border-t border-gray-50">
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-gray-50/50 mb-3">
            <div className="w-10 h-10 rounded-xl bg-white border border-gray-100 flex items-center justify-center text-[#A83E60] font-black shadow-sm">
              {user.name.charAt(0)}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-bold text-gray-800 truncate">{user.name}</p>
              <p className="text-[9px] text-[#A83E60] font-black uppercase tracking-widest truncate">{user.role}</p>
            </div>
          </div>
          <button onClick={handleLogout}
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-white border border-gray-100
              text-[#A83E60] hover:bg-red-50 hover:text-red-600 hover:border-red-100 font-bold text-[10px] uppercase tracking-widest transition-all">
            <LogOut className="w-3.5 h-3.5" /> Log Out
          </button>
        </div>
      </div>

      {/* ── MAIN AREA ────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col h-full w-full overflow-hidden relative">

        {/* ── Header Background (Magenta Pattern) ── */}
        <div className="h-48 bg-[#A83E60] relative shrink-0 overflow-hidden">
          {/* Waves / Decorative Blobs */}
          <div className="absolute inset-0 opacity-10">
             <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                <path d="M0,50 C20,20 40,80 60,50 C80,20 100,50 100,50 L100,100 L0,100 Z" fill="white" />
                <circle cx="10" cy="10" r="10" fill="white" />
                <circle cx="80" cy="20" r="5" fill="white" />
                <circle cx="90" cy="80" r="15" fill="white" />
             </svg>
          </div>
          
          <div className="relative z-10 flex items-center justify-between px-8 py-6">
             <div className="flex items-center gap-4">
                <div className="md:hidden w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-md">
                   <Image src="/lbqueen_logo.png" alt="L" width={24} height={24} className="brightness-0 invert" />
                </div>
                <div>
                   <h1 className="text-white text-xl font-black tracking-tight leading-none uppercase italic">LBQueen POS</h1>
                   <p className="text-white/60 text-[10px] font-bold uppercase tracking-widest mt-1">Point of Sale System</p>
                </div>
             </div>
             <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md px-3 py-2 rounded-2xl border border-white/10">
                <Bell className="w-4 h-4 text-white hover:text-pink-200 transition-colors cursor-pointer" />
                <div className="w-[1px] h-4 bg-white/10 mx-1" />
                <div className="w-8 h-8 rounded-lg bg-[#A83E60] border border-white/20 flex items-center justify-center text-[10px] font-black text-white">
                   {user.name?.charAt(0)}
                </div>
             </div>
          </div>
        </div>

        {/* ── Floating Greeting Card ── */}
        <div className="relative z-20 px-8 -mt-20 shrink-0">
          <div className="bg-white rounded-[32px] p-6 shadow-xl border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-5">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-pink-50 to-pink-100/50 flex items-center justify-center text-[#A83E60] font-black text-xl shadow-inner border border-white">
                {user.name?.charAt(0)}
              </div>
              <div>
                <h2 className="text-xl font-black text-gray-900 tracking-tight leading-none">Hai, {user.name}!</h2>
                <div className="mt-2 flex items-center gap-2">
                   <span className="bg-amber-100 text-amber-600 text-[9px] font-black px-2 py-1 rounded-full border border-amber-200 uppercase tracking-widest">Active Access</span>
                   <span className="text-gray-400 text-[10px] font-medium">• Selamat datang di sistem LBQueen</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
               <div className="h-10 pl-4 pr-6 bg-gray-50/50 rounded-2xl border border-gray-100 flex items-center gap-3">
                  <meta.Icon className="w-4 h-4 text-[#A83E60]" />
                  <div>
                    <p className="text-[10px] font-black text-gray-800 uppercase leading-none">{meta.title}</p>
                    <p className="text-[9px] text-gray-400 font-medium whitespace-nowrap">{meta.subtitle}</p>
                  </div>
               </div>
            </div>
          </div>
        </div>

        {/* ── Main Content Area ── */}
        <main className="flex-1 overflow-hidden relative z-10 p-2 md:p-0">
          <div className="h-full w-full overflow-auto scrollbar-hide">
            {children}
          </div>
        </main>
      </div>

      {/* ── MOBILE NAV (Floating) ── */}
      <div className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 w-[92%] h-18 bg-white/95 backdrop-blur-md rounded-[28px] border border-gray-100 shadow-2xl flex items-center justify-around px-4 z-[100]">
         {navItems.map(({ Icon, label, href }) => {
            const active = pathname === href;
            return (
              <Link key={href} href={href} className="flex flex-col items-center justify-center group flex-1">
                <div className={`p-2.5 rounded-2xl transition-all duration-300 ${active ? "bg-[#A83E60] text-white shadow-lg shadow-pink-200 -mt-8" : "text-gray-300 group-hover:text-gray-500"}`}>
                   <Icon className="w-5 h-5" />
                </div>
                <span className={`text-[8px] font-black uppercase tracking-widest mt-1.5 transition-all ${active ? "text-[#A83E60]" : "text-gray-300"}`}>
                   {label}
                </span>
              </Link>
            );
         })}
      </div>
    </div>
  );
}


