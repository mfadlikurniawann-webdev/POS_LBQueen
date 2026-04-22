"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { ShoppingCart, Package, Users, FileText, LogOut } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

const navItems = [
  { Icon: ShoppingCart, label: "Kasir",     href: "/" },
  { Icon: Package,      label: "Inventori", href: "/stok" },
  { Icon: Users,        label: "Pelanggan", href: "/pelanggan" },
  { Icon: FileText,     label: "Laporan",   href: "/laporan" },
];

const PAGE_TITLE: Record<string, string> = {
  "/":          "Terminal Kasir",
  "/stok":      "Inventori Produk",
  "/pelanggan": "Pelanggan & Member",
  "/laporan":   "Laporan Keuangan",
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router   = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const stored = localStorage.getItem("lbqueen_user");
    if (!stored) router.push("/login");
    else setUser(JSON.parse(stored));
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("lbqueen_user");
    router.push("/login");
  };

  if (!user) return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="flex items-center gap-2 text-slate-300">
        <div className="w-4 h-4 rounded-full border-2 border-[#C94F78] border-t-transparent animate-spin" />
        <span className="text-xs tracking-widest capitalize">Memuat...</span>
      </div>
    </div>
  );

  const pageTitle = PAGE_TITLE[pathname] ?? "Dashboard";

  return (
    <div className="flex h-screen bg-transparent overflow-hidden font-sans">

      {/* ── SIDEBAR ── */}
      <aside className="hidden md:flex w-56 bg-white border-r border-slate-100 flex-col shrink-0">

        {/* Brand */}
        <div className="px-5 pt-6 pb-2">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-8 h-8 rounded-lg bg-rose-50 border border-rose-100 flex items-center justify-center overflow-hidden">
              <Image src="/lbqueen_logo.png" alt="LBQueen" width={20} height={20} className="object-contain" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#C94F78] leading-none">LBQueen</p>
              <p className="text-[10px] text-rose-300 mt-0.5 tracking-wider">POS System</p>
            </div>
          </div>

          {/* Nav Links */}
          <nav className="space-y-0.5">
            {navItems.map(({ Icon, label, href }) => {
              const active = pathname === href;
              return (
                <Link key={href} href={href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] transition-all ${
                    active
                      ? "bg-[#C94F78] text-white font-medium"
                      : "text-slate-500 hover:bg-rose-50 hover:text-[#C94F78]"
                  }`}>
                  <Icon className={`w-4 h-4 shrink-0 ${active ? "text-white" : "text-slate-300"}`} />
                  {label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User section */}
        <div className="mt-auto p-4 border-t border-slate-100">
          <div className="flex items-center gap-2.5 px-1 mb-3">
            <div className="w-7 h-7 rounded-full bg-rose-100 flex items-center justify-center text-[#C94F78] text-xs font-semibold shrink-0">
              {user.name.charAt(0)}
            </div>
            <div className="min-w-0">
              <p className="text-[12px] font-medium text-slate-700 truncate">{user.name}</p>
              <p className="text-[10px] text-slate-400 capitalize">{user.role}</p>
            </div>
          </div>
          <button onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-[11px] text-slate-400 hover:text-[#C94F78] hover:bg-rose-50 transition-all">
            <LogOut className="w-3.5 h-3.5" /> Keluar
          </button>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {/* Top bar (Pink Gradient Header) */}
        <div className="px-0 md:px-4 pt-0 md:pt-4 shrink-0 bg-white">
          <header className="relative bg-gradient-to-r from-[#D95F87] via-[#C94F78] to-[#A83E60] h-16 md:h-[72px] flex items-center justify-center rounded-b-[24px] md:rounded-[24px] shadow-lg shadow-rose-200/50 overflow-hidden">
            {/* Wave Decoration */}
            <svg className="absolute bottom-0 left-0 w-full h-auto opacity-20 pointer-events-none" viewBox="0 0 1440 200" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
              <path fill="#ffffff" d="M0,96L48,112C96,128,192,160,288,154.7C384,149,480,107,576,96C672,85,768,107,864,122.7C960,139,1056,149,1152,144C1248,139,1344,117,1392,106.7L1440,96L1440,200L1392,200C1344,200,1248,200,1152,200C1056,200,960,200,864,200C768,200,672,200,576,200C480,200,384,200,288,200C192,200,96,200,48,200L0,200Z"></path>
            </svg>
            <div className="absolute -bottom-8 -left-10 w-40 h-24 bg-white/10 rounded-[100%] blur-xl pointer-events-none" />

            <div className="relative z-10 flex items-center gap-2">
              {(() => {
                const navItem = navItems.find(n => n.href === pathname);
                const IconComponent = navItem?.Icon || ShoppingCart;
                return <IconComponent className="w-[18px] h-[18px] md:w-5 md:h-5 text-white" strokeWidth={2.5} />;
              })()}
              <h1 className="text-[15px] md:text-[17px] font-semibold text-white tracking-wide">{pageTitle}</h1>
            </div>

            <div className="hidden md:flex items-center gap-3 absolute right-6 z-10">
              <span className="text-[11px] text-white/90 font-medium">{user.name}</span>
              <div className="w-8 h-8 rounded-full bg-white/20 border border-white/30 flex items-center justify-center text-white text-xs font-semibold backdrop-blur-sm shadow-sm">
                {user.name.charAt(0)}
              </div>
            </div>
          </header>
        </div>

        {/* Content */}
        <main className="flex-1 overflow-hidden bg-transparent">
          <div className="h-full overflow-auto scrollbar-hide pb-24 md:pb-0">
            {children}
          </div>
        </main>
      </div>

      {/* ── MOBILE BOTTOM NAV ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-slate-100 flex z-50">
        {navItems.map(({ Icon, label, href }) => {
          const active = pathname === href;
          return (
            <Link key={href} href={href}
              className="flex-1 flex flex-col items-center justify-center gap-1">
              <div className={`p-1.5 rounded-lg ${active ? "bg-[#C94F78]" : ""}`}>
                <Icon className={`w-5 h-5 ${active ? "text-white" : "text-slate-300"}`} />
              </div>
              <span className={`text-[9px] ${active ? "text-[#C94F78] font-medium" : "text-slate-300"}`}>{label}</span>
            </Link>
          );
        })}
        <button onClick={handleLogout}
          className="flex-1 flex flex-col items-center justify-center gap-1 active:bg-rose-50 transition-colors">
          <div className="p-1.5 rounded-lg">
            <LogOut className="w-5 h-5 text-slate-300" />
          </div>
          <span className="text-[9px] text-slate-300">Keluar</span>
        </button>
      </nav>
    </div>
  );
}