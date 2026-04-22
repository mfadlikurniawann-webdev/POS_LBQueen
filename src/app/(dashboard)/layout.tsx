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
        <span className="text-xs tracking-widest uppercase">Memuat...</span>
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
        {/* Top bar */}
        <header className="bg-white border-b border-slate-100 px-6 h-14 flex items-center justify-between shrink-0">
          <h1 className="text-[14px] font-semibold text-slate-800">{pageTitle}</h1>
          <div className="hidden md:flex items-center gap-3">
            <span className="text-[11px] text-slate-400">{user.name}</span>
            <div className="w-7 h-7 rounded-full bg-rose-100 border border-rose-200 flex items-center justify-center text-[#C94F78] text-xs font-semibold">
              {user.name.charAt(0)}
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-hidden bg-transparent">
          <div className="h-full overflow-auto scrollbar-hide">
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