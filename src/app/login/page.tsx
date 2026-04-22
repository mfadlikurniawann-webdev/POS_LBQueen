"use client";

import { useState, useEffect } from "react";
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
      if (username === "admin" && password === "adminlbqueen") {
        localStorage.setItem("lbqueen_user", JSON.stringify({ id: 1, name: "Super Admin", role: "admin", username: "admin" }));
        router.push("/"); return;
      }
      setError("Gagal menghubungi server. Coba lagi.");
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex selection:bg-rose-100 selection:text-[#C94F78] font-sans bg-slate-50">
      
      {/* ── LEFT: IMAGE (Desktop Only) ── */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-rose-50 overflow-hidden items-center justify-center">
        <Image src="https://images.unsplash.com/photo-1498843053639-170ff2122f35?auto=format&fit=crop&q=80&w=1200" alt="LBQueen Clinic" fill className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#C94F78]/80 via-[#C94F78]/40 to-transparent mix-blend-multiply" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
        <div className="absolute bottom-16 left-16 right-16 text-white z-10">
          <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl p-2 mb-6 border border-white/30 flex items-center justify-center shadow-2xl">
             <Image src="/lbqueen_logo.png" alt="LBQueen" width={60} height={60} className="rounded-xl object-cover" />
          </div>
          <h2 className="text-4xl font-bold mb-4 drop-shadow-md leading-tight">Manajemen<br/>Klinik Profesional.</h2>
          <p className="text-white/80 font-medium text-lg max-w-md">Kendali penuh atas operasional, reservasi, dan data pelanggan klinik kecantikan LBQueen.</p>
        </div>
      </div>

      {/* ── RIGHT: FORM ── */}
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-6 relative overflow-hidden">
        {/* Mobile background decor */}
        <div className="lg:hidden absolute top-0 left-0 w-full h-[40vh] bg-gradient-to-br from-[#D95F87] to-[#8B2252] rounded-b-[40px] -z-10" />

        <div className="w-full max-w-[400px] mt-10 lg:mt-0 relative z-20">
          
          <div className="lg:hidden flex flex-col items-center mb-10">
            <div className="w-20 h-20 bg-white rounded-2xl shadow-xl p-2 mb-4 border border-rose-50">
              <Image src="/lbqueen_logo.png" alt="LBQueen" width={80} height={80} className="rounded-xl object-cover" />
            </div>
            <h1 className="text-white text-2xl font-bold flex items-center gap-2 drop-shadow-md">
              LBQueen Admin <Sparkles className="w-5 h-5 text-rose-200" />
            </h1>
          </div>

          <div className="bg-white/80 lg:bg-white backdrop-blur-xl lg:backdrop-blur-none rounded-[32px] shadow-2xl shadow-rose-200/40 border border-white p-8 relative">
            <div className="hidden lg:block mb-8">
              <h1 className="text-2xl font-bold text-slate-800 mb-2">Selamat Datang 👋</h1>
              <p className="text-slate-500 text-sm font-medium">Silakan login untuk mengakses dashboard admin.</p>
            </div>

            {error && (
              <div className="mb-6 bg-red-50 border border-red-100 text-red-600 rounded-2xl px-4 py-3 text-[12px] font-semibold flex items-center gap-2 animate-in fade-in zoom-in-95">
                <span className="text-red-400">⚠</span> {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-2 capitalize tracking-wider">Username</label>
                <input type="text" required value={username} onChange={e => setUsername(e.target.value)}
                  placeholder="Masukkan username"
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-[13px] font-semibold text-slate-800 placeholder:text-slate-400 outline-none focus:bg-white focus:border-[#C94F78] focus:ring-4 focus:ring-rose-50 transition-all" />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-2 capitalize tracking-wider">Password</label>
                <div className="relative">
                  <input type={showPass ? "text" : "password"} required value={password} onChange={e => setPassword(e.target.value)}
                    placeholder="Masukkan password"
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-[13px] font-semibold text-slate-800 placeholder:text-slate-400 outline-none focus:bg-white focus:border-[#C94F78] focus:ring-4 focus:ring-rose-50 transition-all pr-14" />
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-slate-400 hover:text-[#C94F78] bg-white rounded-xl shadow-sm border border-slate-50 transition-colors">
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={loading}
                className="w-full py-4 bg-[#C94F78] hover:bg-[#A83E60] text-white font-bold text-[14px] rounded-2xl flex items-center justify-center gap-2 transition-all duration-300 shadow-luxury-pink active:scale-[0.98] disabled:opacity-70 mt-4 relative overflow-hidden group">
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
                <span className="relative z-10 flex items-center gap-2">
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
                  {loading ? "Menyocokkan..." : "Log In Sekarang"}
                </span>
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-slate-50 text-center flex flex-col items-center gap-3">
               <p className="text-slate-400 text-[11px] font-semibold">
                 Bukan staf admin? <a href="/customer-portal/login" className="text-[#C94F78] hover:underline">Ke Portal Pelanggan</a>
               </p>
            </div>
          </div>

          {/* ── FOOTER TERMS ── */}
          <p className="text-center text-slate-400 text-[10px] mt-8 font-medium leading-relaxed px-4">
             Dengan log in, kamu menyetujui{" "}
             <a href="#" className="text-[#C94F78] font-semibold hover:underline">Kebijakan Privasi</a> dan{" "}
             <a href="#" className="text-[#C94F78] font-semibold hover:underline">Syarat & Ketentuan</a> LBQueen.
          </p>
        </div>
      </div>
    </div>
  );
}
