"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Eye, EyeOff, Loader2, Crown, Sparkles, ShieldAlert } from "lucide-react";
import Image from "next/image";

/** Hash password: base64 — cocokkan dengan yang disimpan */
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
  const [isAdminPreview, setIsAdminPreview] = useState(false);

  useEffect(() => {
    // Cek apakah admin sedang melihat (preview mode)
    const adminUser = localStorage.getItem("lbqueen_user");
    if (adminUser) {
      setIsAdminPreview(true);
    }
  }, []);

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
    <div className="min-h-screen bg-[#FDFCFD] font-sans relative flex flex-col items-center selection:bg-rose-100 selection:text-[#C94F78]">
      {/* ── PREVIEW BANNER ── */}
      {isAdminPreview && (
        <div className="fixed top-0 left-0 right-0 bg-amber-500 text-white text-[10px] font-black uppercase tracking-[0.2em] py-2 px-4 z-[100] text-center flex items-center justify-center gap-2 shadow-md">
          <ShieldAlert className="w-3 h-3" /> Preview Mode (Admin View)
        </div>
      )}

      {/* ── TOP BACKGROUND ── */}
      <div className="w-full h-[40vh] lg:h-[45vh] relative overflow-hidden flex flex-col items-center justify-center shrink-0 bg-rose-50 border-b border-rose-100">
        {/* Dekorasi Background */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] opacity-[0.15] bg-[radial-gradient(circle_at_center,_#C94F78_0%,_transparent_60%)]" />
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#FDFCFD] to-transparent z-10" />

        <div className="relative z-10 flex flex-col items-center mt-[-40px]">
          <div className="w-20 h-20 bg-white rounded-[24px] shadow-xl shadow-rose-200/50 p-2.5 mb-5 transform -rotate-3 hover:rotate-0 transition-transform duration-300 border border-rose-50">
            <Image src="/lbqueen_logo.png" alt="LBQueen" width={80} height={80} style={{ width: "100%", height: "100%" }} className="rounded-[16px] object-cover" />
          </div>
          <h1 className="text-[#C94F78] text-2xl font-black tracking-tight drop-shadow-sm flex items-center gap-2">
            Portal Pelanggan <Crown className="w-5 h-5 text-amber-400" />
          </h1>
          <p className="text-[#C94F78]/60 text-[11px] font-bold uppercase tracking-[0.2em] mt-1.5 drop-shadow-sm">
            Care Beauty
          </p>
        </div>
      </div>

      {/* ── CARD CONTAINER ── */}
      <div className="w-full max-w-[400px] px-5 -mt-20 lg:-mt-24 relative z-20 pb-12">
        <div className="bg-white rounded-[32px] shadow-2xl shadow-rose-100/60 border border-white p-7 lg:p-8 relative overflow-hidden">
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
                placeholder="Username Anda"
                className="w-full px-5 py-4 bg-rose-50/30 border border-rose-100/50 rounded-2xl text-[13px] font-bold text-slate-800 placeholder:text-slate-400 outline-none focus:bg-white focus:border-[#C94F78] focus:ring-4 focus:ring-rose-50 transition-all" />
            </div>

            <div className="relative">
              <input type={showPass ? "text" : "password"} required value={password} onChange={e => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full px-5 py-4 bg-rose-50/30 border border-rose-100/50 rounded-2xl text-[13px] font-bold text-slate-800 placeholder:text-slate-400 outline-none focus:bg-white focus:border-[#C94F78] focus:ring-4 focus:ring-rose-50 transition-all pr-14" />
              <button type="button" onClick={() => setShowPass(!showPass)}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-slate-400 hover:text-[#C94F78] bg-white rounded-xl shadow-sm border border-slate-50 transition-colors">
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[10px] text-slate-400 font-bold mt-1.5 px-1 leading-relaxed">
              💡 Default: <span className="text-[#C94F78]">INISIAL-STATUS-ID</span> (cth: SW-M-5)
            </p>

            <button type="submit" disabled={loading}
              className="w-full py-4 bg-[#C94F78] hover:bg-[#A83E60] text-white font-black text-[14px] rounded-2xl flex items-center justify-center gap-2 transition-all duration-300 shadow-luxury-pink active:scale-[0.98] disabled:opacity-70 mt-2">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
              {loading ? "Memverifikasi..." : "Log in"}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-50 text-center flex flex-col items-center gap-3">
             <p className="text-slate-400 text-[11px] font-bold">
               Belum punya akun? <span className="text-[#C94F78]">Daftar ke kasir, yuk!</span>
             </p>
          </div>
        </div>

        {/* ── FOOTER TERMS ── */}
        <p className="text-center text-slate-400 text-[10px] mt-8 font-medium leading-relaxed px-4">
           Dengan log in, kamu menyetujui{" "}
           <a href="#" className="text-[#C94F78] font-bold hover:underline">Kebijakan Privasi</a> dan{" "}
           <a href="#" className="text-[#C94F78] font-bold hover:underline">Syarat & Ketentuan</a> LBQueen.
        </p>

        <div className="mt-8 text-center">
           <a href="/login" className="text-slate-300 text-[10px] font-bold hover:text-slate-400 transition-colors">
             Login Staff/Admin →
           </a>
        </div>
      </div>
    </div>
  );
}
