"use client";

import { useState, useEffect } from "react";
import { User, Printer, CheckCircle2, Bluetooth, LogOut, Loader2 } from "lucide-react";
import { bluetoothPrinter } from "@/lib/bluetoothPrinter";
import { useRouter } from "next/navigation";

export default function PengaturanPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [printerConnected, setPrinterConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const stored = localStorage.getItem("lbqueen_user");
    if (stored) {
      setUser(JSON.parse(stored));
    }
    setPrinterConnected(bluetoothPrinter.isConnected());
  }, []);

  const handleConnectPrinter = async () => {
    setIsConnecting(true);
    setErrorMsg("");
    try {
      await bluetoothPrinter.connect();
      setPrinterConnected(true);
    } catch (err: any) {
      setErrorMsg(err.message || "Gagal menghubungkan printer");
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnectPrinter = async () => {
    await bluetoothPrinter.disconnect();
    setPrinterConnected(false);
  };

  const handleLogout = () => {
    localStorage.removeItem("lbqueen_user");
    router.push("/login");
  };

  if (!user) return null;

  return (
    <div className="flex h-full bg-slate-50/50 p-4 md:p-8 overflow-auto font-sans">
      <div className="max-w-4xl w-full mx-auto space-y-6">
        
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Pengaturan Sistem</h1>
          <p className="text-sm text-slate-500 mt-1">Kelola profil Anda dan perangkat terhubung.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Profile Card */}
          <div className="bg-white rounded-[24px] border border-slate-100 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-rose-100 text-[#C94F78] flex items-center justify-center">
                <User className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-semibold text-slate-800">Profil Pengguna</h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Nama Lengkap</label>
                <div className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-medium text-slate-700">
                  {user.name}
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Username</label>
                <div className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-medium text-slate-700">
                  {user.username}
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Peran (Role)</label>
                <div className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-medium text-slate-700 capitalize">
                  {user.role}
                </div>
              </div>
            </div>

            <button onClick={handleLogout}
              className="mt-8 w-full py-3 bg-red-50 text-red-600 rounded-xl text-[13px] font-bold flex items-center justify-center gap-2 hover:bg-red-100 transition-colors">
              <LogOut className="w-4 h-4" /> Keluar dari Sistem
            </button>
          </div>

          {/* Device Card */}
          <div className="bg-white rounded-[24px] border border-slate-100 p-6 shadow-sm flex flex-col">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center">
                <Printer className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-semibold text-slate-800">Perangkat Bluetooth</h2>
            </div>
            
            <div className="flex-1">
              <p className="text-sm text-slate-500 mb-6 leading-relaxed">
                Hubungkan printer thermal via Bluetooth untuk mencetak invoice secara langsung dari halaman Kasir. Pastikan Bluetooth perangkat Anda aktif dan printer sudah dinyalakan.
              </p>

              {errorMsg && (
                <div className="mb-4 bg-red-50 text-red-600 text-xs px-4 py-3 rounded-xl border border-red-100 flex items-start gap-2">
                  <span className="shrink-0 mt-0.5">⚠️</span> {errorMsg}
                </div>
              )}

              {printerConnected ? (
                <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-5 flex flex-col items-center text-center">
                  <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mb-3 text-emerald-500">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <p className="font-semibold text-emerald-700 mb-1">Printer Terhubung</p>
                  <p className="text-xs text-emerald-600/80 mb-5">Siap digunakan untuk mencetak struk kasir.</p>
                  <button onClick={handleDisconnectPrinter}
                    className="px-4 py-2 bg-white text-emerald-600 border border-emerald-200 rounded-lg text-xs font-bold hover:bg-emerald-100 transition-colors">
                    Putuskan Koneksi
                  </button>
                </div>
              ) : (
                <div className="bg-slate-50 border border-dashed border-slate-200 rounded-xl p-5 flex flex-col items-center text-center">
                  <div className="w-12 h-12 bg-white shadow-sm border border-slate-100 rounded-full flex items-center justify-center mb-3 text-slate-400">
                    <Bluetooth className="w-6 h-6" />
                  </div>
                  <p className="font-semibold text-slate-700 mb-1">Belum Terhubung</p>
                  <p className="text-xs text-slate-500 mb-5">Klik tombol di bawah untuk mencari printer Bluetooth terdekat.</p>
                  <button onClick={handleConnectPrinter} disabled={isConnecting}
                    className="w-full py-3 bg-[#C94F78] text-white rounded-xl text-[13px] font-bold flex items-center justify-center gap-2 hover:bg-[#A83E60] transition-colors disabled:opacity-50">
                    {isConnecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bluetooth className="w-4 h-4" />}
                    {isConnecting ? "Mencari Printer..." : "Hubungkan Printer"}
                  </button>
                </div>
              )}
            </div>

            <div className="mt-6 pt-5 border-t border-slate-100 text-[10px] text-slate-400 leading-relaxed">
              *Koneksi Bluetooth web bersifat sementara untuk sesi ini. Anda perlu menghubungkan ulang jika memuat ulang (refresh) halaman.
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
