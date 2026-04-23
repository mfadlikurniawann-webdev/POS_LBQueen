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
  subtotal: number; total_amount: number; discount_applied: number; 
  payment: number; change_amount: number;
  customers: { name: string } | null;
  vouchers: { code: string } | null;
};

export default function LaporanPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState(format(subDays(new Date(), 30), "yyyy-MM-dd"));
  const [endDate, setEndDate] = useState(format(new Date(), "yyyy-MM-dd"));

  const [editingTxn, setEditingTxn] = useState<Transaction | null>(null);
  const [editForm, setEditForm] = useState({ discount: 0, payment: 0 });
  const [actionLoading, setActionLoading] = useState(false);

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

  const handleDelete = async (id: number) => {
    if (!confirm("Hapus invoice ini? (Aksi ini tidak bisa dibatalkan dan STOK BARANG AKAN DIKEMBALIKAN otomatis)")) return;
    setActionLoading(true);
    try {
      // Ambil detail transaksi untuk mengembalikan stok
      const { data: details } = await supabase.from("transaction_details").select("*").eq("transaction_id", id);
      
      if (details && details.length > 0) {
        for (const item of details) {
          if (item.variant_id) {
            const { data: v } = await supabase.from("product_variants").select("stock").eq("id", item.variant_id).single();
            if (v) await supabase.from("product_variants").update({ stock: v.stock + item.quantity }).eq("id", item.variant_id);
          } else {
            const { data: p } = await supabase.from("products").select("stock, type").eq("id", item.product_id).single();
            if (p && p.type !== "Treatment Care & Beauty") {
              await supabase.from("products").update({ stock: p.stock + item.quantity }).eq("id", item.product_id);
            }
          }
        }
      }
      
      // Hapus transaksi (detail akan terhapus otomatis jika ada relasi CASCADE, tapi kita hapus manual untuk aman)
      await supabase.from("transaction_details").delete().eq("transaction_id", id);
      const { error } = await supabase.from("transactions").delete().eq("id", id);
      if (error) throw error;
      
      fetchData();
    } catch (e: any) {
      console.error(e);
      alert("Gagal menghapus invoice: " + e.message);
    } finally {
      setActionLoading(false);
    }
  };

  const openEdit = (t: Transaction) => {
    setEditingTxn(t);
    setEditForm({ discount: t.discount_applied, payment: t.payment });
  };

  const handleEditSave = async () => {
    if (!editingTxn) return;
    setActionLoading(true);
    try {
      const newTotal = Math.max(0, editingTxn.subtotal - editForm.discount);
      const newChange = Math.max(0, editForm.payment - newTotal);

      const { error } = await supabase.from("transactions").update({
        discount_applied: editForm.discount,
        total_amount: newTotal,
        payment: editForm.payment,
        change_amount: newChange
      }).eq("id", editingTxn.id);

      if (error) throw error;
      
      setEditingTxn(null);
      fetchData();
    } catch (e: any) {
      console.error(e);
      alert("Gagal memperbarui invoice: " + e.message);
    } finally {
      setActionLoading(false);
    }
  };

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
                 {(s.label === "Total Omzet" || s.label === "Potongan Diskon") && <span className="text-xl font-semibold">Rp</span>}
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
                  <th className="px-4 md:px-12 py-4 md:py-6 text-right whitespace-nowrap">Aksi</th>
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
                    <td className="px-4 md:px-12 py-4 md:py-5 text-right font-semibold whitespace-nowrap">
                       <div className="flex items-center justify-end gap-2">
                         <button onClick={() => openEdit(t)} disabled={actionLoading} className="px-3 py-1.5 bg-slate-50 text-slate-500 hover:text-[#C94F78] hover:bg-rose-50 rounded-xl text-[11px] transition-colors border border-slate-100">
                           Edit
                         </button>
                         <button onClick={() => handleDelete(t.id)} disabled={actionLoading} className="px-3 py-1.5 bg-slate-50 text-slate-500 hover:text-red-500 hover:bg-red-50 rounded-xl text-[11px] transition-colors border border-slate-100">
                           Hapus
                         </button>
                       </div>
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

      {/* ── MODAL EDIT INVOICE ── */}
      {editingTxn && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] w-full max-w-sm shadow-2xl p-6 md:p-8 animate-in zoom-in-95">
            <h2 className="text-lg font-bold text-slate-800 mb-1">Edit Invoice</h2>
            <p className="text-xs text-slate-400 mb-6">{editingTxn.invoice_number}</p>
            
            <div className="space-y-4 mb-8">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase tracking-widest">Subtotal (Fix)</label>
                <div className="px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-semibold text-slate-500">
                  Rp {editingTxn.subtotal.toLocaleString("id-ID")}
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-[#C94F78] mb-1.5 uppercase tracking-widest">Potongan / Diskon Baru (Rp)</label>
                <input type="number" value={editForm.discount} onChange={e => setEditForm(f => ({ ...f, discount: parseInt(e.target.value) || 0 }))}
                  className="w-full px-4 py-3 bg-rose-50 border border-rose-100 rounded-2xl text-sm font-semibold text-[#C94F78] focus:outline-none focus:ring-4 focus:ring-rose-50" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-emerald-600 mb-1.5 uppercase tracking-widest">Pembayaran Uang Tunai/Transfer (Rp)</label>
                <input type="number" value={editForm.payment} onChange={e => setEditForm(f => ({ ...f, payment: parseInt(e.target.value) || 0 }))}
                  className="w-full px-4 py-3 bg-emerald-50 border border-emerald-100 rounded-2xl text-sm font-semibold text-emerald-600 focus:outline-none focus:ring-4 focus:ring-emerald-50" />
              </div>
              <div className="pt-3 border-t border-slate-100 flex justify-between items-center">
                <span className="text-xs font-bold text-slate-400">Total Akhir Baru</span>
                <span className="text-lg font-bold text-slate-800">Rp {Math.max(0, editingTxn.subtotal - editForm.discount).toLocaleString("id-ID")}</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setEditingTxn(null)} disabled={actionLoading}
                className="flex-1 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-xl text-[12px] font-bold transition-all">
                Batal
              </button>
              <button onClick={handleEditSave} disabled={actionLoading}
                className="flex-1 py-3.5 bg-[#C94F78] hover:bg-[#A83E60] text-white rounded-xl text-[12px] font-bold shadow-pink-sm transition-all flex items-center justify-center gap-2">
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Simpan"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
