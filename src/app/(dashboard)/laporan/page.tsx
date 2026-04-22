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
    <div className="h-full flex flex-col bg-white overflow-hidden font-sans">

      {/* Toolbar: Filter + Export (Ref Image 1 style) */}
      <div className="bg-white border-b border-slate-50 px-5 md:px-8 py-4 md:py-5 flex flex-wrap items-center justify-between gap-4 md:gap-5 shrink-0 z-10 font-sans">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-full px-6 py-3 shadow-inner">
            <CalendarDays className="w-4 h-4 text-slate-400" />
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
              className="bg-transparent text-[11px] font-semibold text-slate-700 outline-none capitalize tracking-[0.1em]" />
            <span className="text-slate-300 font-semibold px-1">—</span>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
              className="bg-transparent text-[11px] font-semibold text-slate-700 outline-none capitalize tracking-[0.1em]" />
          </div>
          <div className="w-11 h-11 rounded-full bg-rose-50/50 flex items-center justify-center cursor-pointer hover:bg-rose-100/50 transition-colors border border-rose-50 shadow-sm">
             <TrendingUp className="w-4 h-4 text-[#A83E60]" />
          </div>
        </div>
        
        <div className="flex gap-3">
          <button onClick={exportPDF}
            className="flex items-center gap-3 px-7 py-3 bg-white text-slate-400 font-semibold rounded-full text-[10px] capitalize tracking-[0.15em] hover:text-[#A83E60] hover:border-rose-100 transition-all border border-slate-100 shadow-sm">
            <FileDown className="w-4 h-4" /> PDF
          </button>
          <button onClick={exportExcel}
            className="flex items-center gap-3 px-7 py-3 bg-white text-slate-400 font-semibold rounded-full text-[10px] capitalize tracking-[0.15em] hover:text-emerald-500 hover:border-emerald-100 transition-all border border-slate-100 shadow-sm">
            <DownloadCloud className="w-4 h-4" /> Excel
          </button>
        </div>
      </div>

      {/* Stats Board (Ref Image Luxury theme) */}
      <div className="px-5 md:px-8 py-5 md:py-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 shrink-0 bg-white">
        {[
          { label: "Total Omzet", value: totalOmzet.toLocaleString("id-ID"), sub: `${(totalOmzet / 1000000).toFixed(1)}jt Total`, icon: <TrendingUp className="w-5 h-5" />, color: "bg-white text-[#A83E60] shadow-luxury-pink border border-rose-50" },
          { label: "Transaksi", value: transactions.length, sub: "nota berhasil", icon: <ShoppingBag className="w-5 h-5" />, color: "bg-slate-900 text-white shadow-xl shadow-slate-100" },
          { label: "Member Terlayani", value: memberTxns, sub: "dengan loyalty account", icon: <Users className="w-5 h-5" />, color: "bg-orange-500 text-white shadow-xl shadow-orange-100" },
          { label: "Potongan Diskon", value: totalDiskon.toLocaleString("id-ID"), sub: "reward member", icon: <Tag className="w-5 h-5" />, color: "bg-emerald-500 text-white shadow-xl shadow-emerald-100" },
        ].map((s, i) => (
          <div key={s.label} className={`${s.color} p-7 rounded-[32px] relative overflow-hidden group transition-all duration-500 hover:scale-[1.02]`}>
            {/* Visual element on card */}
            <div className={`absolute top-0 right-0 w-28 h-28 rounded-bl-full transition-all duration-700 group-hover:scale-110 ${i === 0 ? "bg-rose-50/30" : "bg-white/10"}`} />
            
            <div className="relative z-10">
              <div className="flex items-start justify-between mb-8">
                <p className={`${i === 0 ? "text-slate-400" : "text-white/60"} text-[10px] font-semibold capitalize tracking-[0.2em]`}>{s.label}</p>
                <div className={`${i === 0 ? "bg-rose-50 text-[#C94F78]" : "bg-white/20 text-white"} p-3 rounded-2xl backdrop-blur-sm border border-transparent ${i === 0 ? "group-hover:border-rose-100" : ""}`}>{s.icon}</div>
              </div>
              <div className="flex items-baseline gap-2 mb-1.5">
                 <span className="text-xl font-semibold">Rp</span>
                 <p className="text-3xl font-semibold tracking-tight">{s.value}</p>
              </div>
              <p className={`${i === 0 ? "text-rose-300" : "text-white/40"} text-[10px] font-semibold capitalize tracking-wider`}>{s.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Transaction Table (Luxury styling) */}
      <div className="flex-1 overflow-auto px-5 md:px-8 pb-32 md:pb-12 bg-white">
        <div className="bg-white rounded-[24px] md:rounded-[40px] border border-slate-100 shadow-premium overflow-hidden relative">
          <div className="px-5 md:px-12 py-5 md:py-8 border-b border-slate-50 flex items-center justify-between">
            <h3 className="font-semibold text-slate-800 capitalize tracking-widest text-xs">Jurnal Penjualan</h3>
            {loading ? <Loader2 className="w-5 h-5 text-[#C94F78] animate-spin" /> : (
               <div className="w-8 h-8 rounded-full border-2 border-slate-100 border-t-rose-200" />
            )}
          </div>
          <div className="overflow-auto scrollbar-hide">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[10px] font-semibold text-slate-400 capitalize tracking-[0.2em] bg-slate-50/50">
                  <th className="px-4 md:px-12 py-4 md:py-6 text-left whitespace-nowrap">Invoice</th>
                  <th className="px-4 md:px-12 py-4 md:py-6 text-left whitespace-nowrap">Waktu</th>
                  <th className="px-4 md:px-12 py-4 md:py-6 text-left whitespace-nowrap">Pelanggan</th>
                  <th className="px-4 md:px-12 py-4 md:py-6 text-left whitespace-nowrap">Voucher</th>
                  <th className="px-4 md:px-12 py-4 md:py-6 text-right whitespace-nowrap">Potongan</th>
                  <th className="px-4 md:px-12 py-4 md:py-6 text-right whitespace-nowrap">Settlement</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 font-medium">
                {transactions.map(t => (
                  <tr key={t.id} className="hover:bg-rose-50/20 transition-all duration-300 group">
                    <td className="px-4 md:px-12 py-4 md:py-5 whitespace-nowrap">
                       <a href={`/invoice/${t.id}`} target="_blank" rel="noreferrer" className="font-semibold text-[#C94F78] text-xs underline decoration-rose-100 underline-offset-4 hover:text-[#A83E60] cursor-pointer" title="Cetak Ulang Invoice">
                         {t.invoice_number}
                       </a>
                    </td>
                    <td className="px-4 md:px-12 py-4 md:py-5 text-[11px] text-slate-400 font-semibold capitalize tracking-tight whitespace-nowrap">
                       {format(new Date(t.created_at), "dd/MM/yyyy")}
                    </td>
                    <td className="px-4 md:px-12 py-4 md:py-5 text-[11px] font-semibold text-slate-600 capitalize tracking-tight whitespace-nowrap">
                       {t.customers ? t.customers.name : <span className="text-slate-300">Walk-in Customer</span>}
                    </td>
                    <td className="px-4 md:px-12 py-4 md:py-5 whitespace-nowrap">
                      {t.vouchers ? (
                         <span className="text-[10px] font-semibold text-slate-700 border border-slate-100 px-3 py-1.5 rounded-lg bg-slate-50 capitalize tracking-widest">{t.vouchers.code}</span>
                      ) : <span className="text-slate-200">—</span>}
                    </td>
                    <td className="px-4 md:px-12 py-4 md:py-5 text-right font-semibold text-slate-300 whitespace-nowrap">
                       {t.discount_applied > 0 ? (
                         <span className="text-[#C94F78] font-semibold">- Rp {t.discount_applied.toLocaleString("id-ID")}</span>
                       ) : "0"}
                    </td>
                    <td className="px-4 md:px-12 py-4 md:py-5 text-right font-semibold text-slate-800 text-[14px] md:text-[16px] tracking-tight whitespace-nowrap">
                       Rp {t.total_amount.toLocaleString("id-ID")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!loading && transactions.length === 0 && (
              <div className="py-32 text-center">
                 <ShoppingBag className="w-20 h-20 mx-auto mb-6 text-slate-100 opacity-50" />
                 <p className="text-slate-300 text-xs font-semibold capitalize tracking-[0.25em]">Belum ada data transaksi</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
