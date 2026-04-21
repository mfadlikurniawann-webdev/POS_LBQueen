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

      {/* Toolbar: Filter + Export */}
      <div className="bg-white border-b border-rose-50 px-6 py-3 flex flex-wrap items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 bg-gray-50 border-2 border-gray-100 rounded-2xl px-4 py-2 group focus-within:border-lb-rose transition-all">
            <CalendarDays className="w-4 h-4 text-gray-300 group-focus-within:text-lb-rose" />
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
              className="bg-transparent text-[11px] font-black text-gray-700 outline-none uppercase tracking-widest" />
            <span className="text-gray-300 font-bold px-1">—</span>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
              className="bg-transparent text-[11px] font-black text-gray-700 outline-none uppercase tracking-widest" />
          </div>
          <button onClick={fetchData}
            className="px-6 py-2.5 bg-lb-rose text-white font-black rounded-2xl text-[10px] uppercase tracking-[0.2em] hover:bg-lb-rose-dark transition-all shadow-xl shadow-rose-100">
            Apply
          </button>
        </div>
        
        <div className="flex gap-2">
          <button onClick={exportPDF}
            className="flex items-center gap-2 px-5 py-2.5 bg-white text-gray-400 font-black rounded-2xl text-[10px] uppercase tracking-widest hover:text-red-500 hover:border-red-100 transition-all border-2 border-gray-100">
            <FileDown className="w-4 h-4" /> PDF
          </button>
          <button onClick={exportExcel}
            className="flex items-center gap-2 px-5 py-2.5 bg-white text-gray-400 font-black rounded-2xl text-[10px] uppercase tracking-widest hover:text-emerald-500 hover:border-emerald-100 transition-all border-2 border-gray-100">
            <DownloadCloud className="w-4 h-4" /> Excel
          </button>
        </div>
      </div>

      {/* Stats Board */}
      <div className="px-6 py-5 grid grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
        {[
          { label: "Total Omzet", value: totalOmzet.toLocaleString("id-ID"), sub: `${(totalOmzet / 1000000).toFixed(1)}jt Total`, icon: <TrendingUp className="w-5 h-5" />, color: "from-lb-rose to-lb-rose-dark" },
          { label: "Transaksi", value: transactions.length, sub: "nota berhasil", icon: <ShoppingBag className="w-5 h-5" />, color: "from-gray-800 to-black" },
          { label: "Member Terlayani", value: memberTxns, sub: "dengan loyalty account", icon: <Users className="w-5 h-5" />, color: "from-amber-400 to-orange-500" },
          { label: "Potongan Diskon", value: totalDiskon.toLocaleString("id-ID"), sub: "reward member", icon: <Tag className="w-5 h-5" />, color: "from-emerald-400 to-emerald-600" },
        ].map(s => (
          <div key={s.label} className={`bg-gradient-to-br ${s.color} text-white p-5 rounded-[32px] shadow-premium relative overflow-hidden group transition-transform hover:scale-[1.02]`}>
            <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-bl-full transition-transform group-hover:scale-110" />
            <div className="relative z-10">
              <div className="flex items-start justify-between mb-4">
                <p className="text-white/60 text-[9px] font-black uppercase tracking-[0.2em]">{s.label}</p>
                <div className="bg-white/20 p-2 rounded-2xl backdrop-blur-sm">{s.icon}</div>
              </div>
              <p className="text-xl font-black mb-1">Rp {s.value}</p>
              <p className="text-white/40 text-[9px] font-bold uppercase tracking-wider">{s.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Transaction Table */}
      <div className="flex-1 overflow-auto px-6 pb-24 md:pb-6">
        <div className="bg-white rounded-[32px] border border-gray-100 shadow-premium overflow-hidden">
          <div className="px-8 py-5 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
            <h3 className="font-black text-gray-800 uppercase tracking-widest text-xs">Jurnal Penjualan</h3>
            {loading ? <Loader2 className="w-5 h-5 text-lb-rose animate-spin" /> : (
               <div className="px-3 py-1 bg-rose-50 text-lb-rose text-[9px] font-black rounded-full uppercase tracking-widest border border-rose-100">
                  {transactions.length} Records
               </div>
            )}
          </div>
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-50 bg-gray-50/30">
                  <th className="px-8 py-5 text-left">Invoice</th>
                  <th className="px-8 py-5 text-left">Waktu</th>
                  <th className="px-8 py-5 text-left">Pelanggan</th>
                  <th className="px-8 py-5 text-left">Voucher</th>
                  <th className="px-8 py-5 text-right">Potongan</th>
                  <th className="px-8 py-5 text-right">Settlement</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {!loading && transactions.map(t => (
                  <tr key={t.id} className="hover:bg-rose-50/20 transition-colors group">
                    <td className="px-8 py-4">
                       <span className="font-black text-lb-rose text-xs tracking-tight group-hover:underline cursor-pointer">{t.invoice_number}</span>
                    </td>
                    <td className="px-8 py-4">
                       <div className="flex flex-col">
                          <span className="text-[11px] font-black text-gray-800">{format(new Date(t.created_at), "dd MMM yyyy")}</span>
                          <span className="text-[9px] font-bold text-gray-400 uppercase">{format(new Date(t.created_at), "HH:mm")}</span>
                       </div>
                    </td>
                    <td className="px-8 py-4 text-[11px] font-black text-gray-700 italic">
                       {t.customers ? t.customers.name : <span className="text-gray-300 uppercase not-italic font-bold">Public / Walk-in</span>}
                    </td>
                    <td className="px-8 py-4">
                      {t.vouchers ? (
                         <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-900 text-white text-[9px] font-black rounded-lg uppercase tracking-widest">
                            <Tag className="w-3 h-3 text-rose-300" /> {t.vouchers.code}
                         </div>
                      ) : <span className="text-gray-200">None</span>}
                    </td>
                    <td className="px-8 py-4 text-right">
                       <span className={`text-[11px] font-black ${t.discount_applied > 0 ? "text-lb-rose" : "text-gray-300"}`}>
                          {t.discount_applied > 0 ? `- Rp ${t.discount_applied.toLocaleString("id-ID")}` : "0"}
                       </span>
                    </td>
                    <td className="px-8 py-4 text-right">
                       <span className="text-sm font-black text-gray-900">Rp {t.total_amount.toLocaleString("id-ID")}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!loading && transactions.length === 0 && (
              <div className="py-24 text-center text-gray-200">
                 <TrendingUp className="w-16 h-16 mx-auto mb-6 opacity-10" />
                 <p className="font-black uppercase tracking-[0.2em] text-xs">No data available for this period</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
