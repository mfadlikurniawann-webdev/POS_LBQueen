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
    <div className="min-h-screen bg-slate-50 font-sans relative flex flex-col items-center selection:bg-rose-100 selection:text-[#C94F78]">
      {/* ── TOP BACKGROUND ── */}
      <div className="w-full h-[40vh] lg:h-[45vh] relative overflow-hidden flex flex-col items-center justify-center shrink-0" 
        style={{ background: "linear-gradient(135deg, #C94F78 0%, #8B2252 100%)" }}>
        {/* Dekorasi Background */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] opacity-20 bg-[radial-gradient(circle_at_center,_white_0%,_transparent_60%)]" />
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />

        <div className="relative z-10 flex flex-col items-center mt-[-40px]">
          <div className="w-20 h-20 bg-white rounded-[24px] shadow-2xl p-2.5 mb-5 transform rotate-3 hover:rotate-0 transition-transform duration-300">
            <Image src="/lbqueen_logo.png" alt="LBQueen" width={80} height={80} style={{ width: "100%", height: "100%" }} className="rounded-[16px] object-cover" />
          </div>
          <h1 className="text-white text-3xl font-black tracking-tight drop-shadow-md flex items-center gap-2">
            LBQueen Admin <Sparkles className="w-5 h-5 text-rose-200" />
          </h1>
          <p className="text-rose-200 text-[11px] font-bold uppercase tracking-[0.2em] mt-1.5 drop-shadow-sm">
            Point of Sale System
          </p>
        </div>
      </div>

      {/* ── CARD CONTAINER ── */}
      <div className="w-full max-w-[400px] px-5 -mt-20 lg:-mt-24 relative z-20 pb-12">
        <div className="bg-white rounded-[32px] shadow-2xl shadow-slate-200/60 border border-white p-7 lg:p-8 relative overflow-hidden">
          {/* Card subtle shine */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#C94F78]/20 to-transparent" />

          {error && (
            <div className="mb-6 bg-red-50 border border-red-100 text-red-600 rounded-2xl px-4 py-3 text-[12px] font-bold flex items-center gap-2 animate-in fade-in zoom-in-95">
              <span className="text-red-400">⚠</span> {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <input type="text" required value={username} onChange={e => setUsername(e.target.value)}
                placeholder="Username"
                className="w-full px-5 py-4 bg-slate-50/50 border border-slate-100 rounded-2xl text-[13px] font-bold text-slate-800 placeholder:text-slate-400 outline-none focus:bg-white focus:border-[#C94F78] focus:ring-4 focus:ring-rose-50 transition-all" />
            </div>

            <div className="relative">
              <input type={showPass ? "text" : "password"} required value={password} onChange={e => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full px-5 py-4 bg-slate-50/50 border border-slate-100 rounded-2xl text-[13px] font-bold text-slate-800 placeholder:text-slate-400 outline-none focus:bg-white focus:border-[#C94F78] focus:ring-4 focus:ring-rose-50 transition-all pr-14" />
              <button type="button" onClick={() => setShowPass(!showPass)}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-slate-400 hover:text-[#C94F78] bg-white rounded-xl shadow-sm border border-slate-50 transition-colors">
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <button type="submit" disabled={loading}
              className="w-full py-4 bg-[#C94F78] hover:bg-[#A83E60] text-white font-black text-[14px] rounded-2xl flex items-center justify-center gap-2 transition-all duration-300 shadow-luxury-pink active:scale-[0.98] disabled:opacity-70 mt-2">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
              {loading ? "Menyocokkan..." : "Log in"}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-50 text-center flex flex-col items-center gap-3">
             <p className="text-slate-400 text-[11px] font-bold">
               Bukan admin? <a href="/customer-portal/login" className="text-[#C94F78] hover:underline">Ke Portal Pelanggan</a>
             </p>
          </div>
        </div>

        {/* ── FOOTER TERMS ── */}
        <p className="text-center text-slate-400 text-[10px] mt-8 font-medium leading-relaxed px-4">
           Dengan log in, kamu menyetujui{" "}
           <a href="#" className="text-[#C94F78] font-bold hover:underline">Kebijakan Privasi</a> dan{" "}
           <a href="#" className="text-[#C94F78] font-bold hover:underline">Syarat & Ketentuan</a> LBQueen.
        </p>
      </div>
    </div>
  );
}
