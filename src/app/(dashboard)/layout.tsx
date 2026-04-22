"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { ShoppingCart, Package, Users, FileText, LogOut } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

type PageMeta = { title: string; subtitle: string; Icon: React.ElementType };

const PAGE_META: Record<string, PageMeta> = {
  "/":          { title: "Kasir",      subtitle: "Terminal transaksi",       Icon: ShoppingCart },
  "/stok":      { title: "Inventori",  subtitle: "Stok & layanan klinik",    Icon: Package },
  "/pelanggan": { title: "Pelanggan",  subtitle: "Member & loyalitas",       Icon: Users },
  "/laporan":   { title: "Laporan",    subtitle: "Rekap keuangan & omzet",   Icon: FileText },
};

const navItems = [
  { Icon: ShoppingCart, label: "Kasir",     href: "/" },
  { Icon: Package,      label: "Inventori", href: "/stok" },
  { Icon: Users,        label: "Pelanggan", href: "/pelanggan" },
  { Icon: FileText,     label: "Laporan",   href: "/laporan" },
];

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

  const meta = PAGE_META[pathname] ?? PAGE_META["/"];

  if (!user) return (
    <div className="min-h-screen flex items-center justify-center bg-[#fdfcfc]">
      <div className="flex items-center gap-3 text-[#d4c8cc]">
        <div className="w-4 h-4 rounded-full border-2 border-[#e8719a] border-t-transparent animate-spin" />
        <span className="text-xs tracking-widest uppercase font-medium">Memuat...</span>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col md:flex-row h-screen bg-[#fdfcfc] overflow-hidden" style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>

      {/* ── SIDEBAR (Desktop) ──────────────────────────── */}
      <aside className="hidden md:flex w-60 bg-white border-r border-[#f0ecec] flex-col justify-between shrink-0 z-20">

        {/* Logo */}
        <div className="px-5 pt-7 pb-4">
          <div className="flex items-center gap-3 mb-8 px-1">
            <div className="w-9 h-9 rounded-xl bg-[#fff0f5] border border-[#ffd6e7] flex items-center justify-center">
              <Image src="/lbqueen_logo.png" alt="LBQueen" width={22} height={22} className="object-contain" />
            </div>
            <div>
              <p className="font-semibold text-[#b83b72] text-[15px] leading-none tracking-tight">LBQueen</p>
              <p className="text-[10px] text-[#e8b4c8] font-normal mt-1 tracking-[0.12em] uppercase">Care Beauty</p>
            </div>
          </div>

          {/* Nav */}
          <p className="text-[10px] text-[#ccc8c8] uppercase tracking-[0.18em] font-medium px-2 mb-3">Menu</p>
          <nav className="space-y-1">
            {navItems.map(({ Icon, label, href }) => {
              const active = pathname === href;
              return (
                <Link key={href} href={href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 ${
                    active
                      ? "bg-[#fff0f5] text-[#d4508a] font-medium"
                      : "text-[#a8a4a4] hover:text-[#d4508a] hover:bg-[#fff8fb] font-normal"
                  }`}>
                  <Icon className={`w-4 h-4 shrink-0 ${active ? "text-[#d4508a]" : "text-[#d4c8cc]"}`} />
                  <span>{label}</span>
                  {active && <div className="ml-auto w-1 h-4 rounded-full bg-[#d4508a] opacity-60" />}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User */}
        <div className="p-4 border-t border-[#f5f2f2]">
          <div className="flex items-center gap-3 px-2 mb-3">
            <div className="w-8 h-8 rounded-full bg-[#fff0f5] border border-[#ffd6e7] flex items-center justify-center text-[#d4508a] text-sm font-medium shrink-0">
              {user.name.charAt(0)}
            </div>
            <div className="min-w-0">
              <p className="text-[13px] text-[#3d3939] font-medium truncate leading-tight">{user.name}</p>
              <p className="text-[10px] text-[#a8a4a4] capitalize mt-0.5">{user.role || "Admin"}</p>
            </div>
          </div>
          <button onClick={handleLogout}
            className="w-full py-2 rounded-xl flex items-center justify-center gap-2 text-[#a8a4a4] text-[11px] font-medium hover:text-[#b83b72] hover:bg-[#fff0f5] transition-all">
            <LogOut className="w-3.5 h-3.5" /> Keluar
          </button>
        </div>
      </aside>

      {/* ── MAIN CONTENT ───────────────────────────────── */}
      <div className="flex-1 flex flex-col h-[calc(100vh-64px)] md:h-screen w-full overflow-hidden">

        {/* Page Header — minimal pink strip */}
        <header className="shrink-0 flex items-center justify-between px-6 border-b border-[#f0ecec] bg-white"
          style={{ height: 56 }}>
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-[#fff0f5] flex items-center justify-center">
              <meta.Icon className="w-3.5 h-3.5 text-[#d4508a]" />
            </div>
            <div>
              <h1 className="text-[14px] font-semibold text-[#2d2820] leading-none">{meta.title}</h1>
              <p className="text-[10px] text-[#c4b8bb] mt-0.5">{meta.subtitle}</p>
            </div>
          </div>

          {/* Right: user chip */}
          <div className="hidden md:flex items-center gap-2">
            <p className="text-[12px] text-[#a8a4a4]">{user.name}</p>
            <div className="w-7 h-7 rounded-full bg-[#fff0f5] border border-[#ffd6e7] flex items-center justify-center text-[#d4508a] text-[11px] font-medium">
              {user.name.charAt(0)}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-hidden bg-[#fdfcfc]">
          <div className="h-full overflow-auto scrollbar-hide">
            {children}
          </div>
        </main>
      </div>

      {/* ── BOTTOM NAV (Mobile) ─────────────────────────── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-[#f0ecec]
        flex items-center z-50">
        {navItems.map(({ Icon, label, href }) => {
          const active = pathname === href;
          return (
            <Link key={href} href={href}
              className="flex-1 flex flex-col items-center justify-center gap-1 h-full">
              <div className={`p-1.5 rounded-lg transition-all ${active ? "bg-[#fff0f5]" : ""}`}>
                <Icon className={`w-5 h-5 ${active ? "text-[#d4508a]" : "text-[#ccc8c8]"}`} />
              </div>
              <span className={`text-[9px] tracking-wide ${active ? "text-[#d4508a] font-medium" : "text-[#ccc8c8]"}`}>
                {label}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}