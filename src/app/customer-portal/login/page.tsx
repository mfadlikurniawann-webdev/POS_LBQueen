"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Eye, EyeOff, Loader2, Sparkles, Crown, AlertTriangle, BadgeCheck, ChevronRight } from "lucide-react";
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
    <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA] relative overflow-hidden font-sans">
      {/* Background Decorative Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-100/50 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-teal-100/40 rounded-full blur-[100px]" />

      <div className="w-full max-w-md px-6 relative z-10">
        {/* Header Section */}
        <div className="text-center mb-10 animate-in fade-in slide-in-from-top-4 duration-700">
          <div className="inline-flex items-center justify-center p-4 bg-white rounded-3xl shadow-premium border border-white mb-6">
            <Image src="/lbqueen_logo.png" alt="LBQueen" width={64} height={64} className="rounded-2xl" priority />
          </div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight mb-2 uppercase italic">
            Portal <span className="text-emerald-600">Pelanggan</span>
          </h1>
          <p className="text-gray-400 text-sm font-medium tracking-wide">Manage your beauty rituals with LBQueen</p>
        </div>

        {/* Card Section */}
        <div className="bg-white/80 backdrop-blur-xl rounded-[40px] shadow-2xl shadow-emerald-200/20 border border-white p-10 animate-in fade-in zoom-in-95 duration-500">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-black text-gray-800 mb-1">Welcome Back 👋</h2>
              <div className="w-8 h-1 bg-emerald-500 rounded-full" />
            </div>
            <div className="p-2 bg-emerald-50 rounded-2xl">
              <Crown className="w-5 h-5 text-emerald-600" />
            </div>
          </div>

          {error && (
            <div className="mb-6 bg-red-50 border border-red-100 text-red-600 rounded-2xl px-5 py-3.5 text-xs font-bold flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
              <AlertTriangle className="w-4 h-4 text-red-400" /> {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2.5 ml-1">Username Identifier</label>
              <input
                type="text" required value={username} onChange={e => setUsername(e.target.value)}
                id="customer-username"
                placeholder="Enter your username..."
                className="w-full px-6 py-4 bg-gray-50/50 border border-gray-100 rounded-2xl text-sm font-semibold focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all placeholder:text-gray-300"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2.5 ml-1">Identity Key</label>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"} required value={password} onChange={e => setPassword(e.target.value)}
                  id="customer-password"
                  placeholder="Enter your security key..."
                  className="w-full px-6 py-4 bg-gray-50/50 border border-gray-100 rounded-2xl text-sm font-semibold focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all pr-14 placeholder:text-gray-300"
                />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-300 hover:text-emerald-500 transition-colors">
                  {showPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <div className="mt-4 flex items-start gap-2.5 px-4 py-3 bg-emerald-50/30 rounded-2xl border border-emerald-100/50">
                <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0 animate-pulse" />
                <p className="text-[10px] text-emerald-700/80 font-bold leading-relaxed">
                  Default: <span className="text-emerald-900 font-black">INITIAL-STATUS-ID</span> (e.g. SW-M-5)
                </p>
              </div>
            </div>

            <button type="submit" disabled={loading} id="customer-login-btn"
              className="w-full py-4.5 bg-gray-900 hover:bg-emerald-600 text-white font-black rounded-2xl flex items-center justify-center gap-3 transition-all duration-300 shadow-xl shadow-gray-200 hover:shadow-emerald-300/30 disabled:opacity-60 text-xs uppercase tracking-widest mt-4">
              {loading ? <Loader2 className="w-5 h-5 animate-spin text-emerald-400" /> : <BadgeCheck className="w-5 h-5 text-emerald-400" />}
              {loading ? "Verifying..." : "Enter Portal"}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-50 text-center">
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-4">
              New Ritual? Register at Boutique Reception
            </p>
            <a href="/login" className="inline-flex items-center gap-2 text-lb-rose font-bold text-[10px] uppercase tracking-wider hover:opacity-80 transition-opacity bg-rose-50 px-5 py-2.5 rounded-full border border-rose-100/50">
              Corporate Login Logic <ChevronRight className="w-3 h-3" />
            </a>
          </div>
        </div>

        <p className="text-center text-[10px] text-gray-300 mt-10 font-bold uppercase tracking-[0.2em]">
          Exclusive Access &bull; LBQueen Beauty Boutique
        </p>
      </div>
    </div>
  );
}
