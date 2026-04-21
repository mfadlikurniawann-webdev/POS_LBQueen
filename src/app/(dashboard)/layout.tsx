"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { ShoppingCart, Package, Users, FileText, LogOut } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

type PageMeta = { title: string; subtitle: string; Icon: React.ElementType };

const PAGE_META: Record<string, PageMeta> = {
  "/": { title: "Terminal Kasir", subtitle: "Pilih produk & proses pembayaran", Icon: ShoppingCart },
  "/stok": { title: "Manajemen Inventaris", subtitle: "Kelola produk & layanan klinik", Icon: Package },
  "/pelanggan": { title: "Pelanggan & Member", subtitle: "Database pelanggan & loyalty", Icon: Users },
  "/laporan": { title: "Laporan Keuangan", subtitle: "Rekap transaksi & omzet", Icon: FileText },
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const stored = localStorage.getItem("lbqueen_user");
    if (!stored) {
      router.push("/login");
    } else {
      setUser(JSON.parse(stored));
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("lbqueen_user");
    router.push("/login");
  };

  const navItems = [
    { Icon: ShoppingCart, label: "Beranda", href: "/" },
    { Icon: Package, label: "Inventori", href: "/stok" },
    { Icon: Users, label: "Pelanggan", href: "/pelanggan" },
    { Icon: FileText, label: "Laporan", href: "/laporan" },
  ];

  const meta = PAGE_META[pathname] ?? PAGE_META["/"];

  if (!user) return (
    <div className="min-h-screen flex items-center justify-center bg-white uppercase tracking-[0.2em] font-bold text-[10px] text-slate-300">
      Memuat Sistem...
    </div>
  );

  return (
    <div className="flex flex-col md:flex-row h-screen bg-white overflow-hidden font-sans">

      {/* ── SIDEBAR (Desktop) ──────────────────────────────────────── */}
      <div className="hidden md:flex w-72 bg-white border-r border-slate-100 flex-col justify-between z-20 shrink-0 font-sans">
        <div className="p-6">
          {/* Logo Area (Ref Image 1 style) */}
          <div className="flex items-center gap-4 mb-10 px-2 mt-2">
            <div className="w-12 h-12 rounded-[20px] bg-white border border-rose-50 flex items-center justify-center shadow-premium group hover:scale-105 transition-transform duration-500">
              <Image src="/lbqueen_logo.png" alt="LBQueen" width={32} height={32} priority className="object-contain" />
            </div>
            <div>
              <p className="font-bold text-[#C94F78] text-xl leading-none tracking-tight">LBQueen</p>
              <p className="text-[10px] text-pink-300 font-semibold tracking-widest mt-1.5 uppercase">Point of Sale</p>
            </div>
          </div>

          <nav className="space-y-2">
            <div className="mb-6 px-4 text-[10px] font-bold tracking-[0.25em] text-slate-300 uppercase">Menu Utama</div>
            {navItems.map(({ Icon, label, href }) => {
              const active = pathname === href;
              return (
                <Link key={href} href={href}
                  className={`flex items-center gap-4 py-4 px-6 rounded-[24px] transition-all duration-300 font-semibold text-sm group
                    ${active
                      ? "bg-[#C94F78] text-white shadow-luxury-pink scale-[1.02]"
                      : "text-slate-400 hover:bg-rose-50/30 hover:text-[#C94F78]"
                    }`}>
                  <Icon className={`w-5 h-5 ${active ? "text-white" : "text-slate-200 group-hover:text-[#C94F78]"}`} />
                  <span className="tracking-tight">{label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Card (Ref Image 1 variant) */}
        <div className="p-6">
          <div className="bg-slate-50/50 rounded-[32px] p-6 border border-slate-100 group">
            <div className="flex items-center gap-4 mb-5 px-1">
              <div className="w-12 h-12 rounded-full bg-white shadow-sm border border-slate-100 flex items-center justify-center font-bold text-[#C94F78] text-lg shrink-0">
                {user.name.charAt(0)}
              </div>
              <div className="min-w-0">
                <p className="font-bold text-slate-900 text-sm leading-none truncate">{user.name}</p>
                <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-1.5 truncate">{user.role || 'Admin'}</p>
              </div>
            </div>
            <button onClick={handleLogout}
              className="w-full py-3.5 bg-white border border-rose-100 rounded-[18px] flex items-center justify-center gap-3 text-rose-500 font-bold text-[11px] uppercase tracking-widest hover:bg-rose-500 hover:text-white transition-all duration-500 shadow-sm shadow-rose-100/50">
              <LogOut className="w-4 h-4" /> Keluar
            </button>
          </div>
        </div>
      </div>

      {/* ── MAIN CONTENT AREA ──────────────────────────────────────── */}
      <div className="flex-1 flex flex-col h-[calc(100vh-70px)] md:h-screen w-full z-10 overflow-hidden">

        {/* ── GRADIENT PAGE HEADER (Refined for Luxury) ─── */}
        <div className="relative overflow-hidden shrink-0 h-[84px] flex items-center"
          style={{ background: "linear-gradient(135deg, #D4507E 0%, #C94F78 30%, #A83E60 65%, #8B2E4E 100%)" }}>

          {/* Decorative blobs */}
          <div className="absolute -top-10 -right-10 w-52 h-52 rounded-full"
            style={{ background: "radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 70%)" }} />
          <div className="absolute -bottom-8 -left-6 w-40 h-40 rounded-full"
            style={{ background: "radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)" }} />

          {/* Header content */}
          <div className="relative z-10 w-full flex items-center justify-between px-8">
            {/* Left: Icon + Title */}
            <div className="flex items-center gap-4">
              <div className="bg-white/10 backdrop-blur-md p-2.5 rounded-2xl border border-white/10 shadow-inner">
                <meta.Icon className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-white font-bold text-lg leading-none tracking-tight">
                  {meta.title}
                </h1>
                <p className="text-white/60 text-[11px] font-medium mt-1.5">{meta.subtitle}</p>
              </div>
            </div>

            {/* Right: User chip (desktop) */}
            <div className="hidden md:flex items-center gap-3">
              <div className="text-right">
                <p className="text-white text-xs font-bold leading-none">{user.name}</p>
                <p className="text-white/40 text-[9px] uppercase tracking-widest mt-1">{user.role || 'Admin'}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-white/20 border border-white/20
                flex items-center justify-center font-bold text-white text-sm shadow-inner backdrop-blur-sm">
                {user.name.charAt(0)}
              </div>
            </div>
          </div>
        </div>
        {/* ─────────────────────────────────────────── */}

        {/* Page content */}
        <main className="flex-1 overflow-hidden relative bg-white">
          <div className="h-full overflow-auto scrollbar-hide">
            {children}
          </div>
        </main>
      </div>

      {/* ── BOTTOM NAV (Mobile) ────────────────────────────────────── */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 h-[70px] bg-white border-t border-slate-100
        flex justify-around items-center z-50 shadow-[0_-10px_30px_rgba(0,0,0,0.03)]">
        {navItems.map(({ Icon, label, href }) => {
          const active = pathname === href;
          return (
            <Link key={href} href={href} className="flex flex-col items-center justify-center w-full h-full gap-1 group">
              <div className={`p-2.5 rounded-[18px] transition-all duration-300 ${active ? "bg-[#C94F78] text-white shadow-luxury-pink -translate-y-1" : "text-slate-300 hover:text-slate-400"}`}>
                <Icon className="w-5.5 h-5.5" />
              </div>
              <span className={`text-[9px] font-bold tracking-widest uppercase transition-colors duration-300 ${active ? "text-[#C94F78]" : "text-slate-300"}`}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}