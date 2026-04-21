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
            <div className="w-11 h-11 rounded-2xl overflow-hidden bg-white border border-rose-100 shrink-0 flex items-center justify-center shadow-sm">
              <Image src="/lbqueen_logo.png" alt="LBQueen" width={44} height={44} priority
                style={{ width: "100%", height: "100%", objectFit: "contain" }} />
            </div>
            <div className="ml-3">
              <p className="font-black text-lb-rose text-xl leading-none tracking-tighter italic">LBQueen</p>
              <p className="text-[10px] text-rose-300 font-bold tracking-widest uppercase mt-1">Care & Beauty</p>
            </div>
          </div>

          <nav className="p-4 space-y-1 mt-1">
            <div className="mb-3 px-3 text-[10px] font-bold tracking-widest text-gray-400 uppercase">Menu Utama</div>
            {navItems.map(({ Icon, label, href }) => {
              const active = pathname === href;
              return (
                <Link key={href} href={href}
                  className={`flex items-center gap-3 p-3.5 rounded-2xl transition-all font-bold text-sm
                    ${active
                      ? "bg-gradient-to-r from-lb-rose to-lb-rose-dark text-white shadow-lg shadow-rose-200 scale-[1.02]"
                      : "text-gray-400 hover:bg-rose-50 hover:text-lb-rose"
                    }`}>
                  <Icon className={`w-5 h-5 shrink-0 ${active ? "text-white" : "text-gray-300 group-hover:text-lb-rose"}`} />
                  <span>{label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User + Logout */}
        <div className="p-4 m-4 mt-0 bg-lb-rose-light/30 rounded-[32px] border border-rose-100/50">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-white shadow-sm border border-rose-100
              flex items-center justify-center text-lb-rose font-black text-lg shrink-0">
              {user.name.charAt(0)}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-black text-gray-800 truncate">{user.name}</p>
              <p className="text-[10px] text-lb-rose font-bold uppercase tracking-wider truncate">{user.role?.replace("_", " ")}</p>
            </div>
          </div>
          <button onClick={handleLogout}
            className="flex items-center gap-2 w-full py-3 px-3 rounded-2xl bg-white border border-rose-100
              text-rose-600 hover:bg-rose-50 hover:text-rose-700 font-bold text-xs transition-all justify-center shadow-sm uppercase tracking-widest">
            <LogOut className="w-4 h-4" /> Keluar admin
          </button>
        </div>
      </div>

      {/* ── MAIN CONTENT AREA ──────────────────────────────────────── */}
      <div className="flex-1 flex flex-col h-[calc(100vh-70px)] md:h-screen w-full z-10 overflow-hidden">

        {/* ── Page Header (Responsive) ─── */}
        <div className="relative overflow-hidden shrink-0"
          style={{ background: "linear-gradient(135deg, #E86A92 0%, #C94F78 40%, #A83E60 100%)" }}>

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
            <div className="hidden md:flex items-center gap-3">
              <div className="text-right">
                <p className="text-white text-xs font-black tracking-tight">{user.name}</p>
                <p className="text-white/60 text-[9px] font-bold uppercase tracking-widest">{user.role?.replace("_", " ")}</p>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-white/20 border border-white/30 backdrop-blur-sm
                flex items-center justify-center font-black text-white text-sm shadow-lg">
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

      {/* ── Mobile Nav ── */}
      <div className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 w-[92%] h-16 glass rounded-[24px]
        flex justify-around items-center z-50 shadow-2xl border border-rose-100/20 px-2 overflow-hidden">
        {navItems.map(({ Icon, label, href }) => {
          const active = pathname === href;
          return (
            <Link key={href} href={href} className="flex flex-col items-center justify-center w-full h-full gap-1">
              <div className={`p-2 rounded-xl transition-all duration-300 ${active ? "bg-lb-rose text-white shadow-lg shadow-rose-200" : "text-gray-400"}`}>
                <Icon className={`${active ? "w-5 h-5" : "w-5 h-5"}`} />
              </div>
              <span className={`text-[9px] font-black uppercase tracking-tighter ${active ? "text-lb-rose" : "text-gray-300"}`}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
