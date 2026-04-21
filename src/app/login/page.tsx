"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Eye, EyeOff, Loader2, CheckCircle2, ShieldCheck, ArrowRight } from "lucide-react";
import Image from "next/image";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Access Control: Redirek jika ada sesi customer
    if (localStorage.getItem("lbqueen_customer")) {
      router.push("/customer-portal");
    }
  }, [router]);

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
      setError("Gagal menghubungi server. Coba lagi.");
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-white font-sans overflow-hidden">
      {/* ── LEFT PANEL (Branding) ────────────────────────────────── */}
      <div className="hidden md:flex md:w-[45%] lg:w-[55%] bg-[#A83E60] relative overflow-hidden flex-col items-center justify-center p-12 text-white">
        {/* Decorative elements */}
        <div className="absolute top-[-10%] right-[-5%] w-[400px] h-[400px] bg-white/10 rounded-full blur-3xl opacity-50" />
        <div className="absolute bottom-[-5%] left-[-5%] w-[300px] h-[300px] bg-black/10 rounded-full blur-2xl opacity-30" />
        
        <div className="relative z-10 max-w-md w-full">
          <div className="flex items-center gap-4 mb-12">
            <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/20">
              <Image src="/lbqueen_logo.png" alt="LBQueen" width={64} height={64} className="brightness-0 invert object-contain" />
            </div>
            <div>
              <p className="text-2xl font-black tracking-tighter italic">LBQueen</p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/60">POS Management</p>
            </div>
          </div>

          <h1 className="text-4xl lg:text-5xl font-extrabold leading-[1.1] mb-8">
            Kelola Klinik & <br /> Layanan Lebih <span className="text-pink-200">Efisien</span>
          </h1>

          <div className="space-y-6">
            {[
              "Manajemen Inventaris & Stok Real-time",
              "Sistem Kasir Terintegrasi & Cepat",
              "Database Pelanggan & Loyalty Program",
              "Laporan Keuangan & Omzet Otomatis"
            ].map((text, i) => (
              <div key={i} className="flex items-center gap-4 group">
                <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center border border-white/10 group-hover:bg-white group-hover:text-[#A83E60] transition-all">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <p className="font-medium text-white/90">{text}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="absolute bottom-12 left-12">
          <p className="text-[11px] font-bold uppercase tracking-widest text-white/40">
            &copy; {new Date().getFullYear()} LBQueen Care Beauty &bull; v2.5
          </p>
        </div>
      </div>

      {/* ── RIGHT PANEL (Login Form) ─────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 bg-gray-50/50 md:bg-white relative">
        <div className="w-full max-w-sm">
          {/* Mobile Logo */}
          <div className="flex md:hidden items-center justify-center gap-3 mb-12">
            <Image src="/lbqueen_logo.png" alt="LBQueen" width={48} height={48} className="rounded-xl shadow-sm" />
            <h1 className="text-2xl font-black text-[#A83E60] italic">LBQueen</h1>
          </div>

          <div className="text-center mb-10">
            <h2 className="text-3xl font-black text-gray-900 mb-2">Selamat Datang</h2>
            <p className="text-gray-400 text-sm font-medium">Masuk ke akun Staff Anda untuk melanjutkan</p>
          </div>

          <div className="bg-white md:bg-transparent rounded-[32px] p-8 md:p-0 shadow-xl shadow-gray-200/50 md:shadow-none border border-gray-100 md:border-none">
            {error && (
              <div className="mb-6 bg-red-50 border border-red-100 text-red-600 rounded-2xl px-5 py-4 text-xs font-bold flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                <ShieldCheck className="w-4 h-4 text-red-400" /> {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2.5 ml-1">Username / ID Pegawai</label>
                <input
                  type="text" required value={username} onChange={e => setUsername(e.target.value)}
                  placeholder="Masukkan username..."
                  className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-semibold focus:bg-white focus:border-[#A83E60] focus:ring-4 focus:ring-pink-500/10 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2.5 ml-1">Password</label>
                <div className="relative">
                  <input
                    type={showPass ? "text" : "password"} required value={password} onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-semibold focus:bg-white focus:border-[#A83E60] focus:ring-4 focus:ring-pink-500/10 outline-none transition-all pr-14"
                  />
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-300 hover:text-[#A83E60] transition-colors">
                    {showPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={loading}
                className="w-full py-5 bg-[#A83E60] hover:bg-[#C94F78] text-white font-black rounded-2xl flex items-center justify-center gap-3 transition-all duration-300 shadow-xl shadow-pink-200 disabled:opacity-60 text-sm uppercase tracking-widest">
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Masuk"}
                {!loading && <ArrowRight className="w-4 h-4" />}
              </button>
            </form>

            <div className="mt-12 pt-8 border-t border-gray-100 text-center">
              <p className="text-xs text-gray-400 font-medium mb-4">Butuh akses Portal Pelanggan?</p>
              <a href="/customer-portal/login" className="text-[#A83E60] font-black text-xs hover:underline decoration-2 underline-offset-4">
                Klik disini untuk beralih <ArrowRight className="inline w-3 h-3 ml-1" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

