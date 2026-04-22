"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Eye, EyeOff, Loader2, Crown, ShieldAlert } from "lucide-react";
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
    <div className="min-h-screen flex selection:bg-rose-100 selection:text-[#C94F78] font-sans bg-[#FDFCFD]">
      
      {/* ── PREVIEW BANNER ── */}
      {isAdminPreview && (
        <div className="fixed top-0 left-0 right-0 bg-amber-500 text-white text-[10px] font-semibold capitalize tracking-[0.2em] py-2 px-4 z-[100] text-center flex items-center justify-center gap-2 shadow-md">
          <ShieldAlert className="w-3 h-3" /> Preview Mode (Admin View)
        </div>
      )}

      {/* ── RIGHT: IMAGE (Desktop Only) - For Customer we put image on right ── */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-rose-50 overflow-hidden items-center justify-center order-2">
        <Image src="https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?auto=format&fit=crop&q=80&w=1200" alt="LBQueen Beauty" fill className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-l from-[#C94F78]/80 via-[#C94F78]/30 to-transparent mix-blend-multiply" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
        <div className="absolute bottom-16 right-16 text-right text-white z-10">
          <h2 className="text-4xl font-bold mb-4 drop-shadow-md leading-tight">Pancarkan<br/>Kecantikan Sejatimu.</h2>
          <p className="text-white/80 font-medium text-lg max-w-md ml-auto">Akses portal member eksklusif untuk memesan treatment, melihat histori, dan mendapatkan promo spesial.</p>
        </div>
      </div>

      {/* ── LEFT: FORM ── */}
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-6 relative overflow-hidden order-1 bg-white">
        {/* Mobile background decor */}
        <div className="lg:hidden absolute top-0 left-0 w-full h-[40vh] bg-rose-50 rounded-b-[40px] -z-10 overflow-hidden">
           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] opacity-[0.15] bg-[radial-gradient(circle_at_center,_#C94F78_0%,_transparent_60%)]" />
        </div>

        <div className="w-full max-w-[400px] mt-10 lg:mt-0 relative z-20">
          
          <div className="lg:hidden flex flex-col items-center mb-10">
            <div className="w-20 h-20 bg-white rounded-2xl shadow-xl shadow-rose-200/50 p-2 mb-4 border border-rose-50">
              <Image src="/lbqueen_logo.png" alt="LBQueen" width={80} height={80} className="rounded-xl object-cover" />
            </div>
            <h1 className="text-[#C94F78] text-2xl font-bold flex items-center gap-2 drop-shadow-sm">
              Portal Pelanggan <Crown className="w-5 h-5 text-amber-400" />
            </h1>
          </div>

          <div className="bg-white/80 lg:bg-transparent backdrop-blur-xl lg:backdrop-blur-none rounded-[32px] lg:rounded-none shadow-2xl lg:shadow-none shadow-rose-100/60 border lg:border-none border-white p-8 relative">
            
            <div className="hidden lg:flex flex-col items-start mb-8">
               <div className="w-14 h-14 bg-white rounded-2xl shadow-lg shadow-rose-100 p-1.5 mb-6 border border-rose-50">
                 <Image src="/lbqueen_logo.png" alt="LBQueen" width={60} height={60} className="rounded-xl object-cover" />
               </div>
               <h1 className="text-3xl font-bold text-slate-800 mb-2 flex items-center gap-2">Portal Pelanggan <Crown className="w-6 h-6 text-amber-400" /></h1>
               <p className="text-slate-500 text-sm font-medium">Masuk untuk melanjutkan pengalaman berbelanja dan reservasi Anda.</p>
            </div>

            {error && (
              <div className="mb-6 bg-red-50 border border-red-100 text-red-600 rounded-2xl px-4 py-3 text-[12px] font-semibold flex items-center gap-2 animate-in fade-in zoom-in-95">
                <span className="text-red-400">⚠</span> {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-2 capitalize tracking-wider">Username Member</label>
                <input type="text" required value={username} onChange={e => setUsername(e.target.value)}
                  placeholder="Masukkan username Anda"
                  className="w-full px-5 py-4 bg-rose-50/30 border border-rose-100/50 rounded-2xl text-[13px] font-semibold text-slate-800 placeholder:text-slate-400 outline-none focus:bg-white focus:border-[#C94F78] focus:ring-4 focus:ring-rose-50 transition-all" />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-2 capitalize tracking-wider">Password</label>
                <div className="relative">
                  <input type={showPass ? "text" : "password"} required value={password} onChange={e => setPassword(e.target.value)}
                    placeholder="Masukkan password rahasia"
                    className="w-full px-5 py-4 bg-rose-50/30 border border-rose-100/50 rounded-2xl text-[13px] font-semibold text-slate-800 placeholder:text-slate-400 outline-none focus:bg-white focus:border-[#C94F78] focus:ring-4 focus:ring-rose-50 transition-all pr-14" />
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-slate-400 hover:text-[#C94F78] bg-white rounded-xl shadow-sm border border-slate-50 transition-colors">
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={loading}
                className="w-full py-4 bg-[#C94F78] hover:bg-[#A83E60] text-white font-bold text-[14px] rounded-2xl flex items-center justify-center gap-2 transition-all duration-300 shadow-luxury-pink active:scale-[0.98] disabled:opacity-70 mt-6 relative overflow-hidden group">
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
                <span className="relative z-10 flex items-center gap-2">
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
                  {loading ? "Memverifikasi..." : "Log In ke Portal"}
                </span>
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-slate-50 text-center flex flex-col items-center gap-3">
               <p className="text-slate-400 text-[11px] font-semibold">
                 Belum punya akun? <span className="text-[#C94F78] font-bold">Daftar ke kasir, yuk!</span>
               </p>
            </div>
          </div>

          {/* ── FOOTER TERMS ── */}
          <div className="mt-12 text-center">
             <p className="text-slate-400 text-[10px] font-medium leading-relaxed px-4 mb-4">
                Dengan log in, kamu menyetujui <a href="#" className="text-[#C94F78] font-semibold hover:underline">Kebijakan Privasi</a> dan <a href="#" className="text-[#C94F78] font-semibold hover:underline">Syarat & Ketentuan</a> LBQueen.
             </p>
             <a href="/login" className="text-slate-300 text-[10px] font-semibold hover:text-slate-400 transition-colors">
               Login Staff/Admin →
             </a>
          </div>
        </div>
      </div>
    </div>
  );
}
