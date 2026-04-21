"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Eye, EyeOff, Loader2, Sparkles, Crown, AlertTriangle, BadgeCheck } from "lucide-react";
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
  const [showPass, setShowPass]  = useState(false);
  const [error, setError]        = useState("");
  const [loading, setLoading]    = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError("");

    try {
      // Cari pelanggan berdasarkan username
      const { data, error: dbErr } = await supabase
        .from("customers")
        .select("*")
        .eq("username", username.toLowerCase().trim())
        .single();

      if (dbErr || !data) {
        setError("Username tidak ditemukan."); setLoading(false); return;
      }

      // Cocokkan hash
      const inputHash = hashPassword(password);
      if (inputHash !== data.password_hash) {
        setError("Password salah. Coba lagi."); setLoading(false); return;
      }

      // Simpan sesi pelanggan
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
    <div className="min-h-screen flex bg-white">

      {/* === Panel Kiri Dekoratif === */}
      <div className="hidden lg:flex w-[45%] relative flex-col overflow-hidden"
        style={{ background: "linear-gradient(145deg, #1a7f5a 0%, #15694a 50%, #0e4d35 100%)" }}>
        {/* Dekorasi lingkaran */}
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full opacity-10 bg-white" />
        <div className="absolute -bottom-20 -left-20 w-72 h-72 rounded-full opacity-10 bg-white" />
        <div className="absolute top-2/3 right-0 w-64 h-64 rounded-full opacity-[0.06] bg-white" />

        <div className="relative z-10 flex flex-col h-full justify-between p-12">
          {/* Logo */}
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-xl shadow-black/20 p-1.5">
              <Image src="/lbqueen_logo.png" alt="LBQueen" width={40} height={40}
                style={{ width: "auto", height: "auto" }} className="rounded-xl" />
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
              <span className="text-white/60 text-sm font-semibold tracking-wider uppercase">Portal Pelanggan</span>
            </div>
            <h1 className="text-5xl font-extrabold text-white leading-tight mb-6">
              Perawatan<br />Terbaik<br />
              <span className="text-white/50">Untuk Anda.</span>
            </h1>
            <p className="text-white/70 text-lg leading-relaxed mb-8">
              Akses layanan & produk pilihan LBQueen, pesan langsung via WhatsApp, dan nikmati keuntungan member eksklusif.
            </p>

            <div className="space-y-3">
              {[
                "Lihat menu & treatment terbaru",
                "Pesan langsung via WhatsApp",
                "Voucher eksklusif untuk Member",
                "Riwayat pesanan Anda",
              ].map(f => (
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

            {/* Member badge */}
            <div className="mt-8 inline-flex items-center gap-2 bg-white/10 border border-white/20 px-4 py-2 rounded-2xl">
              <Crown className="w-4 h-4 text-amber-300" />
              <span className="text-white/80 text-sm font-semibold">Member mendapat voucher & harga spesial</span>
            </div>
          </div>

          <p className="text-white/30 text-xs">© {new Date().getFullYear()} LBQueen Care Beauty. All rights reserved.</p>
        </div>
      </div>

      {/* === Panel Kanan (Form) === */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-gray-50">
        <div className="w-full max-w-md">
          {/* Logo Mobile */}
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex items-center gap-3">
              <Image src="/lbqueen_logo.png" alt="LBQueen" width={48} height={48}
                style={{ width: "auto", height: "auto" }} className="rounded-2xl shadow-lg" />
              <div className="text-left">
                <p className="font-extrabold text-2xl text-gray-900 leading-none">LBQueen</p>
                <p className="text-xs text-gray-400 font-semibold tracking-wider uppercase">Portal Pelanggan</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-[48px] shadow-premium border border-gray-50 p-10 lg:p-12 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-bl-full -z-0 opacity-50" />
            
            <div className="relative z-10">
              <div className="mb-10">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-14 h-14 bg-gray-900 rounded-[22px] flex items-center justify-center shadow-2xl">
                    <Crown className="w-7 h-7 text-amber-400" />
                  </div>
                  <div>
                    <h2 className="text-sm font-black text-emerald-600 uppercase tracking-[0.2em]">Loyalty Portal</h2>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Exclusive Access</p>
                  </div>
                </div>
                <h1 className="text-3xl font-black text-gray-900 leading-tight italic tracking-tighter uppercase">Hello, Gorgeous</h1>
                <p className="text-gray-400 text-[11px] font-bold mt-2">Sign in to manage your beauty rituals</p>
              </div>

              {error && (
                <div className="mb-8 bg-red-50 border border-red-100 text-red-600 rounded-2xl px-5 py-4 text-[11px] font-black uppercase tracking-widest flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                  <AlertTriangle className="w-4 h-4 text-red-400" /> {error}
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3" htmlFor="customer-username">Username Identifier</label>
                  <input type="text" required value={username} onChange={e => setUsername(e.target.value)}
                    id="customer-username"
                    placeholder="Enter your username..."
                    className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent rounded-[20px] text-xs font-bold focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all" />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3" htmlFor="customer-password">Identity Key</label>
                  <div className="relative">
                    <input type={showPass ? "text" : "password"} required value={password} onChange={e => setPassword(e.target.value)}
                      id="customer-password"
                      placeholder="Enter your password..."
                      className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent rounded-[20px] text-xs font-bold focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all pr-14" />
                    <button type="button" onClick={() => setShowPass(!showPass)}
                      className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-300 hover:text-emerald-500 transition-colors">
                      {showPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  <div className="mt-4 flex items-start gap-2 px-4 py-2 bg-gray-50 rounded-xl border border-gray-100">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1 shrink-0" />
                    <p className="text-[9px] text-gray-400 font-bold leading-relaxed">
                      Default Pass: <span className="text-gray-700 font-black">INITIAL-STATUS-ID</span> (e.g. SW-M-5)
                    </p>
                  </div>
                </div>

                <button type="submit" disabled={loading} id="customer-login-btn"
                  className="w-full py-5 bg-gray-900 group-hover:bg-black text-white font-black rounded-[24px] flex items-center justify-center gap-4 transition-all duration-500 shadow-2xl shadow-gray-200 hover:shadow-emerald-100 disabled:opacity-60 text-xs uppercase tracking-[0.2em] mt-2 group">
                  {loading ? <Loader2 className="w-5 h-5 animate-spin text-emerald-400" /> : <BadgeCheck className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition-transform" />}
                  {loading ? "Verifying..." : "Enter Portal"}
                </button>
              </form>

              <div className="mt-10 pt-8 border-t border-gray-50 text-center">
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-relaxed">New to LBQueen rituals?<br/>Register at our boutique reception</p>
              </div>

              <div className="mt-8 text-center flex flex-col items-center gap-4">
                 <p className="text-[9px] text-gray-300 font-black uppercase tracking-[0.3em]">Corporate Access Only</p>
                 <a href="/login" className="px-6 py-2 bg-rose-50 text-lb-rose rounded-full text-[9px] font-black uppercase tracking-widest border border-rose-100/50 hover:bg-lb-rose hover:text-white transition-all shadow-sm">
                   Switch to Admin Login
                 </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
