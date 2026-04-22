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
    <div className="min-h-screen flex bg-transparent font-sans overflow-hidden">
      {/* ── PREVIEW BANNER ── */}
      {isAdminPreview && (
        <div className="fixed top-0 left-0 right-0 bg-amber-500 text-white text-[10px] font-black uppercase tracking-[0.2em] py-2 px-4 z-[100] text-center flex items-center justify-center gap-2">
          <ShieldAlert className="w-3 h-3" /> Preview Mode: Tampilan login untuk pelanggan (Admin View)
        </div>
      )}

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
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-transparent">
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

          <div className="bg-white rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.06)] border border-gray-100 p-8 lg:p-10">
            {/* Header */}
            <div className="mb-8">
              <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center mb-4">
                <Crown className="w-6 h-6 text-emerald-600" />
              </div>
              <h2 className="text-3xl font-extrabold text-gray-900 mb-2">Halo, Pelanggan! 👋</h2>
              <p className="text-gray-400 text-sm font-medium">Masuk untuk memesan layanan & produk LBQueen</p>
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
                  id="customer-username"
                  placeholder="Username Anda..."
                  className="w-full px-4 py-3.5 bg-gray-50 border-2 border-gray-100 rounded-xl text-sm font-medium focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all" />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Password</label>
                <div className="relative">
                  <input type={showPass ? "text" : "password"} required value={password} onChange={e => setPassword(e.target.value)}
                    id="customer-password"
                    placeholder="Password Anda..."
                    className="w-full px-4 py-3.5 bg-gray-50 border-2 border-gray-100 rounded-xl text-sm font-medium focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all pr-12" />
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-2 font-medium">
                  💡 Password default: <span className="font-mono font-bold text-gray-600">INISIAL-STATUS-ID</span> (contoh: <span className="font-mono">SW-M-5</span>)
                </p>
              </div>

              <button type="submit" disabled={loading} id="customer-login-btn"
                className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl flex items-center justify-center gap-2 transition-all duration-300 shadow-lg shadow-emerald-600/30 hover:shadow-xl disabled:opacity-60 text-base mt-2">
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
                {loading ? "Memverifikasi..." : "Masuk ke Portal"}
              </button>
            </form>

            <div className="mt-6 pt-5 border-t border-gray-100 text-center">
              <p className="text-xs text-gray-400">Belum punya akun? Daftarkan diri Anda ke kasir LBQueen</p>
            </div>

            {/* Link balik ke admin */}
            <p className="text-center text-xs text-gray-300 mt-4">
              Staff / Admin?{" "}
              <a href="/login" className="text-[#C94F78] font-semibold hover:underline">Login Admin →</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
