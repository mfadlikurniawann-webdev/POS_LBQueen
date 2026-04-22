"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { 
  User, Lock, LogOut, ChevronLeft, ShieldCheck, 
  Eye, EyeOff, Loader2, Crown, MapPin, Phone, CheckCircle2
} from "lucide-react";
import Link from "next/link";

/** Hash password: base64 (consistent with login logic) */
function hashPassword(plain: string): string {
  if (typeof window !== "undefined") return btoa(plain);
  return Buffer.from(plain).toString("base64");
}

export default function ProfilePage() {
  const router = useRouter();
  const [customer, setCustomer] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [showOldPass, setShowOldPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  
  const [passForm, setPassForm] = useState({ old: "", new: "", confirm: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const stored = localStorage.getItem("lbqueen_customer");
    if (stored) {
      setCustomer(JSON.parse(stored));
    } else {
      router.push("/customer-portal/login");
    }
  }, [router]);

  const validatePassword = (pass: string) => {
    if (pass.length < 8) return "Password minimal 8 karakter.";
    if (!/[A-Z]/.test(pass)) return "Password harus mengandung minimal 1 huruf besar.";
    if (!/[0-9]/.test(pass)) return "Password harus mengandung minimal 1 angka.";
    return null;
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setSuccess("");
    
    if (!customer?.id) return;
    
    // Validasi
    const valErr = validatePassword(passForm.new);
    if (valErr) { setError(valErr); return; }
    if (passForm.new !== passForm.confirm) { setError("Konfirmasi password tidak cocok."); return; }

    setLoading(true);
    try {
      // 1. Verifikasi Password Lama
      const { data: dbUser, error: fetchErr } = await supabase
        .from("customers")
        .select("password_hash")
        .eq("id", customer.id)
        .single();

      if (fetchErr || !dbUser) throw new Error("Gagal memverifikasi akun.");
      
      const oldHash = hashPassword(passForm.old);
      if (oldHash !== dbUser.password_hash) {
        setError("Password lama salah."); setLoading(false); return;
      }

      // 2. Update Password Baru
      const newHash = hashPassword(passForm.new);
      const { error: updateErr } = await supabase
        .from("customers")
        .update({ 
            password_hash: newHash,
            password_plain: passForm.new // Tetap simpan plain agar sinkron dengan sistem inisial
        })
        .eq("id", customer.id);

      if (updateErr) throw updateErr;

      setSuccess("Password berhasil diperbarui!");
      setPassForm({ old: "", new: "", confirm: "" });
    } catch (err: any) {
      setError("Gagal memperbarui password. Coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("lbqueen_customer");
    router.push("/customer-portal/login");
  };

  if (!customer) return null;

  return (
    <div className="min-h-screen bg-[#FDFCFD] pb-32">
      {/* ── HEADER ── */}
      <div className="bg-[#C94F78] px-5 pt-12 pb-16 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl" />
        <div className="relative z-10 flex items-center justify-between">
           <Link href="/customer-portal" className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white active:scale-90 transition-all">
             <ChevronLeft className="w-6 h-6" />
           </Link>
           <h1 className="text-xl font-bold text-white">Profil Saya</h1>
           <div className="w-10" /> {/* Spacer */}
        </div>
      </div>

      <div className="px-5 -mt-8 relative z-20">
        {/* ── USER CARD ── */}
        <div className="bg-white rounded-[32px] p-6 shadow-xl shadow-rose-100/50 border border-white mb-6">
           <div className="flex items-center gap-5">
              <div className={`w-20 h-20 rounded-[28px] flex items-center justify-center text-white text-3xl font-bold shadow-lg ${customer.is_member ? "bg-gradient-to-br from-amber-400 to-orange-500" : "bg-slate-200"}`}>
                {customer.name?.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                 <h2 className="text-xl font-bold text-slate-800 truncate mb-1">{customer.name}</h2>
                 <p className="text-xs text-slate-400 font-semibold tracking-widest flex items-center gap-1 mb-2">
                    <User className="w-3 h-3" /> @{customer.username}
                 </p>
                 {customer.is_member && (
                   <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-600 rounded-full text-[10px] font-bold capitalize tracking-widest border border-amber-100 shadow-sm">
                     <Crown className="w-3 h-3" /> Gold Member
                   </span>
                 )}
              </div>
           </div>
           
           <div className="mt-8 grid grid-cols-1 gap-4 pt-6 border-t border-slate-50">
              <div className="flex items-center gap-4">
                 <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                    <Phone className="w-4 h-4" />
                 </div>
                 <div>
                    <p className="text-[10px] text-slate-400 font-bold capitalize tracking-wider">Nomor Telepon</p>
                    <p className="text-[13px] font-semibold text-slate-700">{customer.phone || "—"}</p>
                 </div>
              </div>
              <div className="flex items-center gap-4">
                 <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                    <ShieldCheck className="w-4 h-4" />
                 </div>
                 <div>
                    <p className="text-[10px] text-slate-400 font-bold capitalize tracking-wider">Status Akun</p>
                    <p className="text-[13px] font-semibold text-emerald-500">Terverifikasi</p>
                 </div>
              </div>
           </div>
        </div>

        {/* ── CHANGE PASSWORD FORM ── */}
        <div className="bg-white rounded-[32px] p-8 shadow-xl shadow-slate-100/50 border border-slate-50 mb-6">
           <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-rose-50 rounded-2xl flex items-center justify-center text-[#C94F78]">
                 <Lock className="w-5 h-5" />
              </div>
              <div>
                 <h3 className="font-bold text-slate-800">Keamanan</h3>
                 <p className="text-[10px] text-slate-400 font-semibold tracking-wider capitalize">Ganti Password Akun</p>
              </div>
           </div>

           {error && (
             <div className="mb-6 bg-red-50 border border-red-100 text-red-600 rounded-2xl px-4 py-3 text-[12px] font-semibold flex items-center gap-2 animate-shake">
                <span>⚠</span> {error}
             </div>
           )}

           {success && (
             <div className="mb-6 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-2xl px-4 py-3 text-[12px] font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" /> {success}
             </div>
           )}

           <form onSubmit={handleUpdatePassword} className="space-y-5">
              <div>
                 <label className="block text-[10px] font-bold text-slate-400 mb-2 capitalize tracking-widest">Password Lama</label>
                 <div className="relative">
                    <input type={showOldPass ? "text" : "password"} required
                      value={passForm.old} onChange={e => setPassForm(p => ({ ...p, old: e.target.value }))}
                      className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-semibold text-slate-800 focus:bg-white focus:border-[#C94F78] outline-none transition-all" />
                    <button type="button" onClick={() => setShowOldPass(!showOldPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300">
                      {showOldPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                 </div>
              </div>

              <div>
                 <label className="block text-[10px] font-bold text-slate-400 mb-2 capitalize tracking-widest">Password Baru</label>
                 <div className="relative">
                    <input type={showNewPass ? "text" : "password"} required
                      value={passForm.new} onChange={e => setPassForm(p => ({ ...p, new: e.target.value }))}
                      className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-semibold text-slate-800 focus:bg-white focus:border-[#C94F78] outline-none transition-all" />
                    <button type="button" onClick={() => setShowNewPass(!showNewPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300">
                      {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                 </div>
                 <p className="text-[10px] text-slate-400 mt-2 ml-1 leading-relaxed italic">
                   Minimal 8 karakter, 1 huruf besar, dan 1 angka.
                 </p>
              </div>

              <div>
                 <label className="block text-[10px] font-bold text-slate-400 mb-2 capitalize tracking-widest">Konfirmasi Password Baru</label>
                 <input type="password" required
                   value={passForm.confirm} onChange={e => setPassForm(p => ({ ...p, confirm: e.target.value }))}
                   className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-semibold text-slate-800 focus:bg-white focus:border-[#C94F78] outline-none transition-all" />
              </div>

              <button type="submit" disabled={loading}
                className="w-full py-4 bg-[#C94F78] text-white rounded-2xl text-[13px] font-bold tracking-widest uppercase hover:bg-[#A83E60] transition-all disabled:opacity-50 shadow-luxury-pink active:scale-95 flex items-center justify-center gap-2">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {loading ? "Menyimpan..." : "Update Password"}
              </button>
           </form>
        </div>

        {/* ── LOGOUT BUTTON ── */}
        <button onClick={handleLogout}
          className="w-full py-4 bg-white border-2 border-rose-50 text-[#C94F78] rounded-[28px] text-[13px] font-bold tracking-[0.2em] uppercase hover:bg-rose-50 transition-all active:scale-95 flex items-center justify-center gap-3 shadow-sm mb-12">
          <LogOut className="w-5 h-5" /> Keluar Aplikasi
        </button>
      </div>
    </div>
  );
}
