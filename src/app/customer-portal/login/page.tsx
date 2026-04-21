"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Eye, EyeOff, Loader2, Crown, ShieldAlert, ArrowRight, UserCircle2 } from "lucide-react";
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
    <div className="min-h-screen flex flex-col md:flex-row bg-white font-sans overflow-hidden">
      {/* ── PREVIEW BANNER ── */}
      {isAdminPreview && (
        <div className="fixed top-0 left-0 right-0 bg-amber-500 text-white text-[10px] font-black uppercase tracking-[0.2em] py-2 px-4 z-[100] text-center flex items-center justify-center gap-2">
          <ShieldAlert className="w-3 h-3" /> Preview Mode: Tampilan login untuk pelanggan (Admin View)
        </div>
      )}

      {/* ── LEFT PANEL (Branding) ────────────────────────────────── */}
      <div className="hidden md:flex md:w-[45%] lg:w-[55%] bg-[#A83E60] relative overflow-hidden flex-col items-center justify-center p-12 text-white">
        <div className="absolute top-[-10%] left-[-5%] w-[400px] h-[400px] bg-white/5 rounded-full blur-3xl opacity-50" />
        <div className="absolute bottom-[-5%] right-[-5%] w-[300px] h-[300px] bg-black/10 rounded-full blur-2xl opacity-30" />
        
        <div className="relative z-10 max-w-md w-full">
          <div className="flex items-center gap-4 mb-12">
            <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/20">
              <Image src="/lbqueen_logo.png" alt="LBQueen" width={64} height={64} className="brightness-0 invert object-contain" />
            </div>
            <div>
              <p className="text-2xl font-black tracking-tighter italic">LBQueen</p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/60">Boutique Portal</p>
            </div>
          </div>

          <h1 className="text-4xl lg:text-5xl font-extrabold leading-[1.1] mb-8">
            Nikmati Ritual <br /> Kecantikan <span className="text-pink-200">Eksklusif</span> Anda
          </h1>

          <div className="space-y-6">
            {[
              "Cek Riwayat Treatment & Produk",
              "Informasi Voucher & Promo Membership",
              "Update Profil & Keanggotaan",
              "Akses Cepat Layanan Kami"
            ].map((text, i) => (
              <div key={i} className="flex items-center gap-4 group">
                <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center border border-white/10 group-hover:bg-white group-hover:text-[#A83E60] transition-all">
                  <UserCircle2 className="w-4 h-4" />
                </div>
                <p className="font-medium text-white/90">{text}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="absolute bottom-12 left-12">
          <p className="text-[11px] font-bold uppercase tracking-widest text-white/40 italic">
            Beauty begins the moment you decide to be yourself.
          </p>
        </div>
      </div>

      {/* ── RIGHT PANEL (Login Form) ─────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 bg-gray-50/50 md:bg-white relative">
        <div className="w-full max-w-sm">
          {/* Mobile Logo */}
          <div className="flex md:hidden items-center justify-center gap-3 mb-10">
            <Image src="/lbqueen_logo.png" alt="LBQueen" width={48} height={48} className="rounded-xl shadow-sm" />
            <h1 className="text-2xl font-black text-[#A83E60] italic">LBQueen</h1>
          </div>

          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-pink-50 mb-4">
              <Crown className="w-6 h-6 text-[#A83E60]" />
            </div>
            <h2 className="text-3xl font-black text-gray-900 mb-2">Portal Pelanggan</h2>
            <p className="text-gray-400 text-sm font-medium">Masuk untuk melihat keuntungan member Anda</p>
          </div>

          <div className="bg-white md:bg-transparent rounded-[32px] p-8 md:p-0 shadow-xl shadow-gray-200/50 md:shadow-none border border-gray-100 md:border-none">
            {error && (
              <div className="mb-6 bg-red-50 border border-red-100 text-red-600 rounded-2xl px-5 py-4 text-xs font-bold flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                <ShieldAlert className="w-4 h-4 text-red-400" /> {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2.5 ml-1">Username Identifier</label>
                <input
                  type="text" required value={username} onChange={e => setUsername(e.target.value)}
                  placeholder="Masukkan username member..."
                  className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-semibold focus:bg-white focus:border-[#A83E60] focus:ring-4 focus:ring-pink-500/10 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2.5 ml-1">Identity Key</label>
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
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Masuk ke Portal"}
                {!loading && <ArrowRight className="w-4 h-4" />}
              </button>
            </form>

            <div className="mt-12 pt-8 border-t border-gray-100 text-center">
              <p className="text-xs text-gray-400 font-medium mb-4">Akses Staff / Administrasi?</p>
              <a href="/login" className="text-[#A83E60] font-black text-xs hover:underline decoration-2 underline-offset-4">
                Login ke Sistem POS Admin <ArrowRight className="inline w-3 h-3 ml-1" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

