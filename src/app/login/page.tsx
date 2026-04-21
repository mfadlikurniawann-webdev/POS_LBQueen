"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Eye, EyeOff, Loader2, Sparkles } from "lucide-react";
import Image from "next/image";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      const { data, error } = await supabase.from("users").select("*").eq("username", username).eq("password", password).single();
      if (error || !data) {
        if (username === "admin" && password === "adminlbqueen") {
          localStorage.setItem("lbqueen_user", JSON.stringify({ id: 1, name: "Super Admin", role: "admin", username: "admin" }));
          router.push("/"); return;
        }
        setError("Username atau password salah.");
      } else {
        localStorage.setItem("lbqueen_user", JSON.stringify(data));
        router.push("/");
      }
    } catch {
      if (username === "admin" && password === "adminlbqueen") {
        localStorage.setItem("lbqueen_user", JSON.stringify({ id: 1, name: "Super Admin", role: "admin", username: "admin" }));
        router.push("/"); return;
      }
      setError("Gagal menghubungi server. Coba lagi.");
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex bg-white">

      {/* === Panel Kiri (Desktop) === */}
      <div className="hidden lg:flex w-[45%] relative flex-col overflow-hidden" style={{ background: "linear-gradient(145deg, #C94F78 0%, #8B2252 60%, #5C1437 100%)" }}>
        {/* Dekorasi lingkaran */}
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full opacity-10 bg-white" />
        <div className="absolute -bottom-20 -left-20 w-72 h-72 rounded-full opacity-10 bg-white" />
        <div className="absolute top-1/2 -translate-y-1/2 right-0 w-64 h-64 rounded-full opacity-[0.06] bg-white" />

        <div className="relative z-10 flex flex-col h-full justify-between p-12">
          {/* Logo */}
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-xl shadow-black/20 p-1.5">
              <Image src="/lbqueen_logo.png" alt="LBQueen" width={40} height={40} style={{ width: "auto", height: "auto" }} className="rounded-xl" />
            </div>
            <div>
              <h3 className="font-extrabold text-white text-xl leading-none">LBQueen</h3>
              <p className="text-white/60 text-xs font-semibold tracking-wider uppercase">Care Beauty</p>
            </div>
          </div>

          {/* Main Text */}
          <div>
            <div className="flex items-center gap-2 mb-5">
              <Sparkles className="w-5 h-5 text-white/60" />
              <span className="text-white/60 text-sm font-semibold tracking-wider uppercase">Point of Sale System</span>
            </div>
            <h1 className="text-5xl font-extrabold text-white leading-tight mb-6">
              Kelola Klinik<br />& Toko Lebih<br />
              <span className="text-white/50">Mudah.</span>
            </h1>
            <p className="text-white/70 text-lg leading-relaxed mb-8">
              Platform terpusat untuk kelola transaksi kasir, stok produk, data pelanggan, dan laporan omzet.
            </p>

            <div className="space-y-3">
              {["Kasir Cepat & Cetak Struk Otomatis", "Manajemen Stok & Treatment Real-time", "Member Loyalty & Voucher Custom", "Laporan Omzet PDF & Excel"].map(f => (
                <div key={f} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-white/80 text-sm font-medium">{f}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <p className="text-white/30 text-xs">© {new Date().getFullYear()} LBQueen Care Beauty. All rights reserved.</p>
        </div>
      </div>

      {/* === Panel Kanan (Form) === */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-gray-50">
        <div className="w-full max-w-md">
          {/* Logo Mobile */}
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex items-center gap-3">
              <Image src="/lbqueen_logo.png" alt="LBQueen" width={48} height={48} style={{ width: "auto", height: "auto" }} className="rounded-2xl shadow-lg" />
              <div className="text-left">
                <p className="font-extrabold text-2xl text-gray-900 leading-none">LBQueen</p>
                <p className="text-xs text-gray-400 font-semibold tracking-wider uppercase">Care Beauty POS</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.06)] border border-gray-100 p-8 lg:p-10">
            <div className="mb-8">
              <h2 className="text-3xl font-extrabold text-gray-900 mb-2">Selamat Datang 👋</h2>
              <p className="text-gray-400 text-sm font-medium">Masuk ke akun Anda untuk mengakses sistem</p>
            </div>

            {error && (
              <div className="mb-6 bg-red-50 border border-red-100 text-red-600 rounded-xl px-4 py-3 text-sm font-medium flex items-center gap-2">
                <span className="text-red-400">⚠</span> {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Username</label>
                <input type="text" required value={username} onChange={e => setUsername(e.target.value)}
                  placeholder="Masukkan username..."
                  className="w-full px-4 py-3.5 bg-gray-50 border-2 border-gray-100 rounded-xl text-sm font-medium focus:bg-white focus:border-[#C94F78] focus:ring-4 focus:ring-[#C94F78]/10 outline-none transition-all" />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Password</label>
                <div className="relative">
                  <input type={showPass ? "text" : "password"} required value={password} onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-3.5 bg-gray-50 border-2 border-gray-100 rounded-xl text-sm font-medium focus:bg-white focus:border-[#C94F78] focus:ring-4 focus:ring-[#C94F78]/10 outline-none transition-all pr-12" />
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={loading}
                className="w-full py-4 bg-[#C94F78] hover:bg-[#A83E60] text-white font-extrabold rounded-xl flex items-center justify-center gap-2 transition-all duration-300 shadow-lg shadow-[#C94F78]/30 hover:shadow-xl hover:shadow-[#C94F78]/40 disabled:opacity-60 text-base mt-2">
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
                {loading ? "Memverifikasi..." : "Masuk ke Sistem"}
              </button>
            </form>

            <div className="mt-8 pt-5 border-t border-gray-100 text-center">
              <p className="text-sm text-gray-500 font-medium">Customer LBQueen? </p>
              <a href="/customer-portal/login" className="inline-block mt-2 text-emerald-600 font-bold hover:underline flex items-center justify-center gap-1">
                Akses Portal Pelanggan →
              </a>
            </div>

            <p className="text-center text-[10px] text-gray-300 mt-4 font-medium uppercase tracking-widest">Demo: admin / adminlbqueen</p>
          </div>
        </div>
      </div>
    </div>
  );
}
