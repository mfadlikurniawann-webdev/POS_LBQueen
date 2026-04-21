"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { ShoppingCart, Package, Users, FileText, LogOut, TrendingUp } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

type PageMeta = { title: string; subtitle: string; Icon: React.ElementType };

const PAGE_META: Record<string, PageMeta> = {
  "/":          { title: "Terminal Kasir",       subtitle: "Pilih produk & proses pembayaran",         Icon: ShoppingCart },
  "/stok":      { title: "Manajemen Inventaris", subtitle: "Kelola produk, layanan & aset klinik",     Icon: Package      },
  "/pelanggan": { title: "Pelanggan & Member",   subtitle: "Database pelanggan & voucher eksklusif",   Icon: Users        },
  "/laporan":   { title: "Laporan Keuangan",     subtitle: "Rekap transaksi & omzet penjualan",        Icon: TrendingUp   },
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
    { Icon: ShoppingCart, label: "Kasir",       href: "/"          },
    { Icon: Package,      label: "Stok Barang", href: "/stok"      },
    { Icon: Users,        label: "Pelanggan",   href: "/pelanggan" },
    { Icon: FileText,     label: "Laporan",     href: "/laporan"   },
  ];

  const meta = PAGE_META[pathname] ?? PAGE_META["/"];

  if (!user) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 rounded-full border-4 border-pink-200 border-t-[#C94F78] animate-spin" />
        <p className="text-sm text-gray-400 font-medium">Memuat…</p>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col md:flex-row h-screen bg-gray-50 overflow-hidden font-sans">

      {/* ── SIDEBAR (Desktop) ──────────────────────────────────────── */}
      <div className="hidden md:flex w-64 bg-white border-r border-gray-100 flex-col justify-between shadow-sm z-20 shrink-0">
        <div>
          <div className="h-20 flex items-center px-6 border-b border-gray-50">
            <div className="w-11 h-11 rounded-xl overflow-hidden bg-white border border-pink-100 shrink-0 flex items-center justify-center">
              <Image src="/lbqueen_logo.png" alt="LBQueen" width={44} height={44} priority
                style={{ width: "100%", height: "100%", objectFit: "contain" }} />
            </div>
            <div className="ml-3">
              <p className="font-extrabold text-[#C94F78] text-lg leading-tight tracking-tight">LBQueen</p>
              <p className="text-[11px] text-pink-300 font-semibold tracking-wide">Point of Sale</p>
            </div>
          </div>

          <nav className="p-4 space-y-1 mt-1">
            <div className="mb-3 px-3 text-[10px] font-bold tracking-widest text-gray-400 uppercase">Menu Utama</div>
            {navItems.map(({ Icon, label, href }) => {
              const active = pathname === href;
              return (
                <Link key={href} href={href}
                  className={`flex items-center gap-3 p-3 rounded-2xl transition-all font-medium
                    ${active
                      ? "bg-gradient-to-r from-[#C94F78] to-[#A83E60] text-white shadow-md shadow-pink-200"
                      : "text-gray-500 hover:bg-pink-50 hover:text-[#C94F78]"
                    }`}>
                  <Icon className="w-5 h-5 shrink-0" />
                  <span>{label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User + Logout */}
        <div className="p-4 m-4 mt-0 bg-gray-50/60 rounded-3xl border border-gray-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-white shadow-sm border border-gray-100
              flex items-center justify-center text-[#C94F78] font-bold text-lg shrink-0">
              {user.name.charAt(0)}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-bold text-gray-800 truncate">{user.name}</p>
              <p className="text-xs text-gray-400 capitalize truncate">{user.role?.replace("_", " ")}</p>
            </div>
          </div>
          <button onClick={handleLogout}
            className="flex items-center gap-2 w-full py-2.5 px-3 rounded-xl bg-white border border-red-100
              text-red-500 hover:bg-red-50 hover:text-red-600 font-semibold text-sm transition-all justify-center shadow-sm">
            <LogOut className="w-4 h-4" /> Keluar
          </button>
        </div>
      </div>

      {/* ── MAIN CONTENT AREA ──────────────────────────────────────── */}
      <div className="flex-1 flex flex-col h-[calc(100vh-70px)] md:h-screen w-full z-10 overflow-hidden">

        {/* ── GRADIENT PAGE HEADER (all viewports) ─── */}
        <div className="relative overflow-hidden shrink-0"
          style={{ background: "linear-gradient(135deg, #D4507E 0%, #C94F78 30%, #A83E60 65%, #8B2E4E 100%)" }}>

          {/* Decorative blobs */}
          <div className="absolute -top-10 -right-10 w-52 h-52 rounded-full"
            style={{ background: "radial-gradient(circle, rgba(255,255,255,0.18) 0%, transparent 70%)" }} />
          <div className="absolute -bottom-8 -left-6 w-40 h-40 rounded-full"
            style={{ background: "radial-gradient(circle, rgba(255,255,255,0.12) 0%, transparent 70%)" }} />
          <div className="absolute top-3 right-28 w-20 h-20 rounded-full"
            style={{ background: "radial-gradient(circle, rgba(255,180,210,0.25) 0%, transparent 70%)" }} />

          {/* Header content */}
          <div className="relative z-10 flex items-center justify-between px-5 py-4">
            {/* Left: Icon + Title */}
            <div className="flex items-center gap-3">
              <div className="bg-white/20 backdrop-blur-sm p-2.5 rounded-2xl shadow-inner border border-white/10">
                <meta.Icon className="w-5 h-5 text-white drop-shadow" />
              </div>
              <div>
                <h1 className="text-white font-extrabold text-[17px] leading-tight tracking-tight drop-shadow-sm">
                  {meta.title}
                </h1>
                <p className="text-white/65 text-[11px] font-medium mt-0.5">{meta.subtitle}</p>
              </div>
            </div>

            {/* Right: User chip (desktop) */}
            <div className="hidden md:flex items-center gap-2">
              <div className="bg-white/15 border border-white/20 px-3 py-1.5 rounded-xl">
                <p className="text-white text-xs font-semibold">{user.name}</p>
                <p className="text-white/55 text-[10px] capitalize">{user.role?.replace("_", " ")}</p>
              </div>
              <div className="w-9 h-9 rounded-full bg-white/25 border border-white/30
                flex items-center justify-center font-extrabold text-white text-sm shadow-inner">
                {user.name.charAt(0)}
              </div>
            </div>

            {/* Right: User avatar (mobile) */}
            <div className="md:hidden w-8 h-8 rounded-full bg-white/25 border border-white/30
              flex items-center justify-center font-bold text-white text-sm">
              {user.name.charAt(0)}
            </div>
          </div>

          {/* Bottom wave — blends into content */}
          <svg viewBox="0 0 1440 28" preserveAspectRatio="none"
            className="absolute bottom-0 left-0 w-full" style={{ height: 28 }}>
            <path d="M0,14 C240,28 480,0 720,16 C960,28 1200,4 1440,14 L1440,28 L0,28 Z"
              fill="white" fillOpacity="0.1" />
            <path d="M0,20 C320,8 640,28 960,18 C1140,12 1300,24 1440,20 L1440,28 L0,28 Z"
              fill="white" fillOpacity="0.07" />
          </svg>
        </div>
        {/* ─────────────────────────────────────────── */}

        {/* Page content */}
        <main className="flex-1 overflow-hidden relative">
          {children}
        </main>
      </div>

      {/* ── BOTTOM NAV (Mobile) ────────────────────────────────────── */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 h-[70px] bg-white border-t border-gray-100
        flex justify-around items-center z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.04)]">
        {navItems.map(({ Icon, label, href }) => {
          const active = pathname === href;
          return (
            <Link key={href} href={href} className="flex flex-col items-center justify-center w-full h-full gap-1">
              <div className={`p-1.5 rounded-xl transition-all ${active ? "bg-pink-100 text-[#C94F78]" : "text-gray-400"}`}>
                <Icon className="w-5 h-5" />
              </div>
              <span className={`text-[10px] font-semibold ${active ? "text-[#C94F78]" : "text-gray-400"}`}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
