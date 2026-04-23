"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Eye, EyeOff, Loader2, Crown, ShieldAlert, Heart } from "lucide-react";
import Image from "next/image";

/** Hash password: base64 (consistent with login logic) */
function hashPassword(plain: string): string {
  if (typeof window !== "undefined") return btoa(plain);
  return Buffer.from(plain).toString("base64");
}

export default function CustomerLoginPage() {
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
      const { data, error: dbErr } = await supabase
        .from("customers")
        .select("*")
        .eq("username", username.toLowerCase().trim())
        .single();

      if (dbErr || !data) {
        setError("Username tidak ditemukan."); setLoading(false); return;
      }

      const inputHash = hashPassword(password);
      if (inputHash !== data.password_hash) {
        setError("Password salah. Coba lagi."); setLoading(false); return;
      }

      localStorage.setItem("lbqueen_customer", JSON.stringify({
        id: data.id,
        name: data.name,
        phone: data.phone,
        is_member: data.is_member,
        username: data.username,
      }));

      router.push("/customer-portal");
    } catch {
      setError("Gagal menghubungi server. Coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex flex-col items-center justify-center font-sans overflow-hidden bg-white selection:bg-rose-100 selection:text-[#C94F78]">
      
      {/* ── BACKGROUND SPLIT ── */}
      <div className="absolute inset-0 flex flex-col">
         {/* Top Half: Pink Gradient with Opacity */}
         <div className="h-1/2 w-full relative" style={{ background: "linear-gradient(135deg, #FF9FB2 0%, #C94F78 100%)" }}>
            <div className="absolute inset-0 opacity-10" 
              style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }} />
            <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-white to-transparent" />
         </div>
         {/* Bottom Half: Solid White */}
         <div className="h-1/2 w-full bg-white" />
      </div>

      {/* ── LOGIN FORM CARD (OVERLAY) ── */}
      <div className="relative z-10 w-full max-w-[420px] px-6">
        
        <div className="flex flex-col items-center mb-8 animate-in fade-in slide-in-from-top-4 duration-700">
           <div className="w-20 h-20 bg-white rounded-[28px] shadow-2xl p-2.5 mb-5 border border-white/50 backdrop-blur-xl">
             <Image src="/lbqueen_logo.png" alt="LBQueen" width={80} height={80} className="rounded-2xl object-cover" />
           </div>
           <h1 className="text-white text-3xl font-bold tracking-tight drop-shadow-md flex items-center gap-2">
             LBQueen Portal <Heart className="w-5 h-5 text-rose-200" />
           </h1>
           <p className="text-rose-50 text-[11px] font-bold uppercase tracking-[0.3em] mt-2 opacity-90">
             Customer Exclusive
           </p>
        </div>

        <div className="bg-white/80 backdrop-blur-2xl rounded-[40px] shadow-2xl shadow-rose-200/50 border border-white p-10 animate-in zoom-in-95 duration-500">
          
          <div className="mb-8">
             <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
               Halo Cantik! ✨
             </h2>
             <p className="text-slate-400 text-xs font-medium mt-1">Masuk untuk akses treatment & promo spesial.</p>
          </div>

          {error && (
            <div className="mb-6 bg-red-50 border border-red-100 text-red-600 rounded-2xl px-4 py-3 text-[12px] font-bold flex items-center gap-2 animate-shake">
              <span className="text-red-400">⚠</span> {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 mb-2 uppercase tracking-widest ml-1">Username Member</label>
              <input type="text" required value={username} onChange={e => setUsername(e.target.value)}
                placeholder="Masukkan username Anda"
                className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-[14px] font-semibold text-slate-800 placeholder:text-slate-300 outline-none focus:bg-white focus:border-[#C94F78] focus:ring-4 focus:ring-rose-50 transition-all" />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 mb-2 uppercase tracking-widest ml-1">Password</label>
              <div className="relative">
                <input type={showPass ? "text" : "password"} required value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="Masukkan password"
                  className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-[14px] font-semibold text-slate-800 placeholder:text-slate-300 outline-none focus:bg-white focus:border-[#C94F78] focus:ring-4 focus:ring-rose-50 transition-all pr-14" />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center text-slate-300 hover:text-[#C94F78] bg-white rounded-xl shadow-sm border border-slate-50 transition-colors">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full py-4.5 bg-[#C94F78] hover:bg-[#A83E60] text-white font-bold text-[14px] rounded-2xl flex items-center justify-center gap-2 transition-all duration-300 shadow-luxury-pink active:scale-[0.98] disabled:opacity-70 mt-6 uppercase tracking-widest">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
              {loading ? "Menyambungkan..." : "Masuk ke Portal"}
            </button>
          </form>

          <div className="mt-10 pt-8 border-t border-slate-50 text-center">
             <p className="text-slate-400 text-[11px] font-bold">
               Belum jadi member? <span className="text-[#C94F78] font-extrabold">Daftar di Kasir LBQueen</span>
             </p>
          </div>
        </div>

        <div className="mt-10 text-center flex flex-col items-center gap-4">
           <a href="/login" className="text-slate-300 text-[10px] font-bold uppercase tracking-[0.2em] hover:text-[#C94F78] transition-colors">
             Login Staf Admin →
           </a>
           <div className="w-8 h-1 bg-slate-100 rounded-full opacity-50" />
        </div>
      </div>
    </div>
  );
}
