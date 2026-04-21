"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { UserCircle, Lock, AlertCircle, Loader2 } from "lucide-react";
import Image from "next/image";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Login langsung ke tabel custom users
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("username", username)
        .eq("password", password) // note: no hashing yet as per original request, but easily changeable
        .single();

      if (error || !data) {
        // BYPASS Mode (Karena Anda belum setup real Supabase URL, kita beri jalan pintas untuk demo)
        if (username === 'admin' && password === 'adminlbqueen') {
           const dummyUser = { id: 1, name: "Super Admin", role: "admin", username: "admin" }
           localStorage.setItem("lbqueen_user", JSON.stringify(dummyUser));
           router.push("/");
        } else {
           setError("Username atau password salah! Gunakan: admin / adminlbqueen untuk mode Demo.");
        }
      } else {
        // Simpan data user (Ideally we use HTTP Only Cookies via Server Actions)
        // Untuk PoC cepat POS Client, simpan di localStorage
        localStorage.setItem("lbqueen_user", JSON.stringify(data));
        router.push("/");
      }
    } catch (err) {
      // BYPASS Mode Fallback
      if (username === 'admin' && password === 'adminlbqueen') {
         const dummyUser = { id: 1, name: "Super Admin", role: "admin", username: "admin" }
         localStorage.setItem("lbqueen_user", JSON.stringify(dummyUser));
         router.push("/");
      } else {
         setError("Gagal menghubungi server. Gunakan admin / adminlbqueen untuk demo.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Panel Kiri - Info LBQueen */}
      <div className="hidden lg:flex flex-1.2 bg-gradient-to-br from-lb-pink to-lb-pink-dark text-white p-16 flex-col justify-center relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-12 right-10 w-64 h-64 bg-white/10 rounded-full blur-2xl"></div>
        
        <div className="relative z-10 max-w-lg">
          <div className="flex items-center gap-4 mb-8">
            <div className="bg-white p-1 rounded-xl shadow-md">
              <Image src="/lbqueen_logo.png" alt="LBQueen Logo" width={48} height={48} priority style={{ width: "auto", height: "auto" }} className="rounded-lg" />
            </div>
            <h3 className="text-2xl font-bold">LBQueen Care Beauty</h3>
          </div>
          
          <h1 className="text-5xl font-bold leading-tight mb-6">
            Kelola Klinik & Toko <span className="text-lb-pink-light">Lebih Mudah</span>
          </h1>
          <p className="text-lg opacity-90 mb-8 leading-relaxed">
            Sistem <strong>Point of Sale (POS)</strong> premium khusus untuk mengelola seluruh transaksi klinik kecantikan, stok produk, dan riwayat pelanggan dalam satu platform.
          </p>
          
          <div className="space-y-4">
            {["Transaksi Kasir Cepat & Modern", "Manajemen Stok Barang Real-time", "Database Pelanggan Terintegrasi", "Laporan Omzet Akurat"].map((feature, i) => (
              <div key={i} className="flex items-center gap-3 opacity-90">
                <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                {feature}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Panel Kanan - Form Login */}
      <div className="flex-1 flex items-center justify-center p-8 bg-gradient-to-br from-white to-pink-50/30">
        <div className="w-full max-w-md bg-white p-8 sm:p-10 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-pink-100/50">
          <div className="text-center mb-8">
            <Image src="/lbqueen_logo.png" alt="LBQueen" width={64} height={64} priority style={{ width: "auto", height: "auto" }} className="lg:hidden mx-auto rounded-xl shadow-lg mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Selamat Datang</h2>
            <p className="text-gray-500 text-sm">Masuk ke akun Anda untuk melanjutkan</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl flex items-start gap-3 text-sm">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <p>{error}</p>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Username / ID Pegawai</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <UserCircle className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  required
                  className="block w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-lb-pink/20 focus:border-lb-pink transition-all outline-none"
                  placeholder="Masukkan username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="password"
                  required
                  className="block w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-lb-pink/20 focus:border-lb-pink transition-all outline-none"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-lb-pink hover:bg-lb-pink-dark text-white font-medium py-3 px-4 rounded-xl transition-all active:scale-[0.98] mt-2 flex items-center justify-center h-[52px]"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Masuk ke Sistem"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
