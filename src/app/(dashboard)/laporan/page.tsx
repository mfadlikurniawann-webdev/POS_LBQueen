"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { format, subDays } from "date-fns";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { FileDown, DownloadCloud, TrendingUp, ShoppingBag, Users, Tag, Loader2, CalendarDays } from "lucide-react";

type Transaction = {
  id: number; invoice_number: string; created_at: string;
  total_amount: number; discount_applied: number; payment: number;
  customers: { name: string } | null;
  vouchers: { code: string } | null;
};

export default function LaporanPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState(format(subDays(new Date(), 30), "yyyy-MM-dd"));
  const [endDate, setEndDate] = useState(format(new Date(), "yyyy-MM-dd"));

  const fetchData = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("transactions")
      .select("*, customers(name), vouchers(code)")
      .gte("created_at", `${startDate}T00:00:00`)
      .lte("created_at", `${endDate}T23:59:59`)
      .order("created_at", { ascending: false });
    setTransactions(data || []);
    setLoading(false);
  }, [startDate, endDate]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const totalOmzet = transactions.reduce((a, t) => a + t.total_amount, 0);
  const totalDiskon = transactions.reduce((a, t) => a + t.discount_applied, 0);
  const memberTxns = transactions.filter(t => t.customers !== null).length;

  const exportExcel = () => {
    const rows = transactions.map(t => ({
      "No. Invoice": t.invoice_number,
      "Tanggal": format(new Date(t.created_at), "dd MMM yyyy, HH:mm"),
      "Pelanggan": t.customers?.name || "Umum",
      "Voucher": t.vouchers?.code || "-",
      "Diskon (Rp)": t.discount_applied,
      "Total Bayar (Rp)": t.total_amount,
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Laporan");
    XLSX.writeFile(wb, `LBQueen_Laporan_${startDate}_${endDate}.xlsx`);
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(201, 79, 120);
    doc.text("LBQueen Care Beauty", 14, 18);
    doc.setTextColor(0);
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text("Laporan Transaksi Penjualan", 14, 25);
    doc.setFontSize(10);
    doc.setTextColor(120);
    doc.text(`Periode: ${startDate}  sampai  ${endDate}`, 14, 32);
    doc.text(`Total Omzet: Rp ${totalOmzet.toLocaleString("id-ID")}  |  Total Transaksi: ${transactions.length}`, 14, 38);

    autoTable(doc, {
      startY: 45,
      theme: "grid",
      headStyles: { fillColor: [201, 79, 120], fontSize: 9, fontStyle: "bold" },
      bodyStyles: { fontSize: 9 },
      alternateRowStyles: { fillColor: [253, 242, 248] },
      head: [["Invoice", "Tanggal", "Pelanggan", "Voucher", "Diskon", "Total"]],
      body: transactions.map(t => [
        t.invoice_number,
        format(new Date(t.created_at), "dd/MM/yy HH:mm"),
        t.customers?.name || "Umum",
        t.vouchers?.code || "-",
        `Rp ${t.discount_applied.toLocaleString("id-ID")}`,
        `Rp ${t.total_amount.toLocaleString("id-ID")}`,
      ]),
    });
    doc.save(`LBQueen_Laporan_${startDate}_${endDate}.pdf`);
  };

  return (
    <div className="h-full flex flex-col bg-gray-50 overflow-hidden">

      {/* Header rendered by layout */}

      {/* Compact Toolbar: date filter + export buttons */}
      <div className="bg-white border-b border-gray-100 px-5 py-3 flex flex-wrap items-center gap-3 shrink-0">
        <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 flex-1 min-w-0">
          <CalendarDays className="w-4 h-4 text-gray-400 shrink-0" />
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
            className="bg-transparent text-sm font-bold text-gray-700 outline-none w-full" />
          <span className="text-gray-400 font-bold shrink-0">—</span>
          <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
            className="bg-transparent text-sm font-bold text-gray-700 outline-none w-full" />
        </div>
        <button onClick={fetchData}
          className="px-4 py-2 bg-[#C94F78] text-white font-bold rounded-xl text-sm hover:bg-[#A83E60] transition-all shrink-0">
          Tampilkan
        </button>
        <div className="flex gap-2 shrink-0">
          <button onClick={exportPDF}
            className="flex items-center gap-1.5 px-3 py-2 bg-red-50 text-red-600 font-bold rounded-xl text-sm hover:bg-red-100 transition-all border border-red-100">
            <FileDown className="w-3.5 h-3.5" /> PDF
          </button>
          <button onClick={exportExcel}
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 text-emerald-600 font-bold rounded-xl text-sm hover:bg-emerald-100 transition-all border border-emerald-100">
            <DownloadCloud className="w-3.5 h-3.5" /> Excel
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="px-6 py-4 grid grid-cols-2 md:grid-cols-4 gap-4 shrink-0">
        {[
          { label: "Total Omzet", value: `Rp ${(totalOmzet / 1000000).toFixed(1)}jt`, sub: totalOmzet.toLocaleString("id-ID"), icon: <TrendingUp className="w-5 h-5" />, color: "from-[#C94F78] to-[#A83E60]" },
          { label: "Total Transaksi", value: transactions.length, sub: "nota berhasil", icon: <ShoppingBag className="w-5 h-5" />, color: "from-indigo-500 to-indigo-700" },
          { label: "Pelanggan Terlayani", value: memberTxns, sub: "memakai akun member", icon: <Users className="w-5 h-5" />, color: "from-amber-400 to-orange-500" },
          { label: "Total Diskon", value: `Rp ${(totalDiskon).toLocaleString("id-ID")}`, sub: "diberikan ke member", icon: <Tag className="w-5 h-5" />, color: "from-emerald-400 to-emerald-600" },
        ].map(s => (
          <div key={s.label} className={`bg-gradient-to-br ${s.color} text-white p-4 rounded-2xl shadow-lg`}>
            <div className="flex items-start justify-between mb-2">
              <p className="text-white/80 text-xs font-bold uppercase tracking-wider">{s.label}</p>
              <div className="bg-white/20 p-1.5 rounded-lg">{s.icon}</div>
            </div>
            <p className="text-2xl font-extrabold mt-1">{s.value}</p>
            <p className="text-white/60 text-xs mt-1">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Tabel Transaksi */}
      <div className="flex-1 overflow-auto px-6 pb-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
            <h3 className="font-extrabold text-gray-800">Detail Transaksi</h3>
            {loading && <Loader2 className="w-4 h-4 text-pink-400 animate-spin" />}
          </div>
          <div className="overflow-auto">
            <table className="w-full text-sm min-w-[650px]">
              <thead>
                <tr className="text-xs font-extrabold text-gray-500 uppercase tracking-wider border-b border-gray-100">
                  <th className="px-6 py-4 text-left">Invoice</th>
                  <th className="px-6 py-4 text-left">Waktu</th>
                  <th className="px-6 py-4 text-left">Pelanggan</th>
                  <th className="px-6 py-4 text-left">Voucher</th>
                  <th className="px-6 py-4 text-right">Diskon</th>
                  <th className="px-6 py-4 text-right">Total Bayar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {!loading && transactions.map(t => (
                  <tr key={t.id} className="hover:bg-pink-50/30 transition-colors">
                    <td className="px-6 py-4 font-bold text-[#C94F78] font-mono text-xs">{t.invoice_number}</td>
                    <td className="px-6 py-4 text-gray-500 text-xs font-medium">{format(new Date(t.created_at), "dd MMM yyyy, HH:mm")}</td>
                    <td className="px-6 py-4">
                      {t.customers ? (
                        <span className="flex items-center gap-1.5 font-semibold text-gray-800">
                          <span className="w-5 h-5 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center text-[10px] font-extrabold">{t.customers.name.charAt(0)}</span>
                          {t.customers.name}
                        </span>
                      ) : <span className="text-gray-400">Umum</span>}
                    </td>
                    <td className="px-6 py-4">
                      {t.vouchers ? <span className="bg-pink-50 text-[#C94F78] text-[10px] font-extrabold px-2 py-0.5 rounded-md">{t.vouchers.code}</span> : <span className="text-gray-300">-</span>}
                    </td>
                    <td className="px-6 py-4 text-right text-emerald-600 font-bold text-sm">
                      {t.discount_applied > 0 ? `- Rp ${t.discount_applied.toLocaleString("id-ID")}` : "-"}
                    </td>
                    <td className="px-6 py-4 text-right font-extrabold text-gray-900">Rp {t.total_amount.toLocaleString("id-ID")}</td>
                  </tr>
                ))}
                {!loading && transactions.length === 0 && (
                  <tr><td colSpan={6} className="text-center py-14 text-gray-400">
                    <TrendingUp className="w-10 h-10 mx-auto mb-2 opacity-20" />
                    <p>Tidak ada transaksi pada periode ini.</p>
                  </td></tr>
                )}
                {loading && (
                  <tr><td colSpan={6} className="text-center py-12"><Loader2 className="w-8 h-8 mx-auto text-pink-300 animate-spin" /></td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
