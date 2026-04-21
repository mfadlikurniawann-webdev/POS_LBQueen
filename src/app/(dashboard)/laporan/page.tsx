"use client";

import { useState } from "react";
import { format, subDays, isAfter, isBefore, isSameDay } from "date-fns";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { FileDown, Calendar, Search, TrendingUp, DownloadCloud } from "lucide-react";

export default function LaporanPage() {
  const [startDate, setStartDate] = useState(format(subDays(new Date(), 7), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  
  // Dummy Transactions (In real app, this comes from Supabase based on Date range filtering)
  const transactions = [
    { id: "INV-1001", date: "2026-04-18T10:30:00Z", customer: "Ayu Lestari", items: "Laser Rejuvenation, Acne Serum", subtotal: 570000, discount: 50000, total: 520000 },
    { id: "INV-1002", date: "2026-04-19T14:15:00Z", customer: "Bunga", items: "Facial Wash Glowing", subtotal: 85000, discount: 0, total: 85000 },
    { id: "INV-1003", date: "2026-04-20T09:00:00Z", customer: "Salsa", items: "Korean BB Glow", subtotal: 350000, discount: 0, total: 350000 },
    { id: "INV-1004", date: "2026-04-21T11:45:00Z", customer: "Ayu Lestari", items: "Body Lotion Premium", subtotal: 95000, discount: 0, total: 95000 },
  ];

  // Filtering (Simulated on client for demo)
  const filteredData = transactions.filter(t => {
    const tDate = new Date(t.date);
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // Set hours to match boundary
    start.setHours(0,0,0,0);
    end.setHours(23,59,59,999);

    return (isAfter(tDate, start) || isSameDay(tDate, start)) && 
           (isBefore(tDate, end) || isSameDay(tDate, end));
  });

  const totalOmzet = filteredData.reduce((acc, curr) => acc + curr.total, 0);
  const totalTransaksi = filteredData.length;

  const exportToExcel = () => {
    const dataToExport = filteredData.map(t => ({
      "No Invoice": t.id,
      "Tanggal": format(new Date(t.date), "dd MMM yyyy, HH:mm"),
      "Pelanggan": t.customer,
      "Item Dibeli": t.items,
      "Subtotal": t.subtotal,
      "Diskon (Voucher)": t.discount,
      "Total Akhir (Net)": t.total
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Laporan Transaksi");
    XLSX.writeFile(wb, `Laporan_LBQueen_${startDate}_to_${endDate}.xlsx`);
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.text("Laporan Transaksi LBQueen POS", 14, 22);
    
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text(`Periode: ${startDate} s/d ${endDate}`, 14, 30);
    doc.text(`Total Omzet: Rp ${totalOmzet.toLocaleString('id-ID')}`, 14, 36);

    const tableColumn = ["Invoice", "Tanggal", "Pelanggan", "Total Bayar"];
    const tableRows = filteredData.map(t => [
      t.id,
      format(new Date(t.date), "dd/MM/yyyy"),
      t.customer,
      `Rp ${t.total.toLocaleString('id-ID')}`
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 45,
      theme: 'grid',
      styles: { fontSize: 10, cellPadding: 3 },
      headStyles: { fillColor: [201, 79, 120] } // LB-Pink RGB
    });

    doc.save(`Laporan_LBQueen_${startDate}_to_${endDate}.pdf`);
  };

  return (
    <div className="p-8 h-full flex flex-col bg-gray-50/50">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 tracking-tight">Laporan Keuangan</h1>
          <p className="text-gray-500 text-sm">Validasi Omzet dan Cetak Rekapitulasi</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <button onClick={exportToPDF} className="flex-1 md:flex-none uppercase tracking-wider text-[11px] font-extrabold bg-red-50 text-red-600 hover:bg-red-100 px-5 py-3 rounded-xl flex items-center justify-center gap-2 transition-all">
            <FileDown className="w-4 h-4"/> DOWNLOAD PDF
          </button>
          <button onClick={exportToExcel} className="flex-1 md:flex-none uppercase tracking-wider text-[11px] font-extrabold bg-green-50 text-green-600 hover:bg-green-100 px-5 py-3 rounded-xl flex items-center justify-center gap-2 transition-all">
            <DownloadCloud className="w-4 h-4"/> DOWNLOAD EXCEL
          </button>
        </div>
      </div>

      {/* FILTER & STATS CARD */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-[0_5px_20px_rgba(0,0,0,0.02)] flex flex-col justify-center">
            <p className="text-gray-400 text-sm font-bold uppercase tracking-widest mb-1 flex items-center gap-2">
                <Calendar className="w-4 h-4"/> Filter Periode
            </p>
            <div className="flex items-center gap-3 mt-3">
              <input 
                 type="date" 
                 value={startDate} 
                 onChange={(e) => setStartDate(e.target.value)}
                 className="w-full text-sm font-bold bg-gray-50 border border-gray-200 px-3 py-2 rounded-xl focus:ring-2 focus:ring-lb-pink/20 outline-none"
              />
              <span className="text-gray-400 font-bold">-</span>
              <input 
                 type="date" 
                 value={endDate}
                 onChange={(e) => setEndDate(e.target.value)} 
                 className="w-full text-sm font-bold bg-gray-50 border border-gray-200 px-3 py-2 rounded-xl focus:ring-2 focus:ring-lb-pink/20 outline-none"
              />
            </div>
        </div>

        <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-6 rounded-3xl shadow-lg flex flex-col justify-center relative overflow-hidden">
             <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-bl-full"></div>
             <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">Total Omzet Bersih</p>
             <h2 className="text-3xl font-black text-white mt-1 flex items-center gap-3">
               Rp {totalOmzet.toLocaleString('id-ID')}
               <TrendingUp className="w-6 h-6 text-green-400" />
             </h2>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-[0_5px_20px_rgba(0,0,0,0.02)] flex flex-col justify-center">
             <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">Total Transaksi</p>
             <h2 className="text-3xl font-black text-gray-800 mt-1">{totalTransaksi} Nota</h2>
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-[0_2px_15px_rgba(0,0,0,0.02)] flex-1 flex flex-col">
          <div className="p-4 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
             <h3 className="font-bold text-gray-800">Detail Transaksi ({startDate} - {endDate})</h3>
             <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"/>
                <input type="text" placeholder="Cari invoice..." className="pl-9 pr-3 py-1.5 text-sm bg-white border border-gray-200 rounded-lg outline-none"/>
             </div>
          </div>
          <div className="overflow-auto flex-1">
             <table className="w-full text-left text-sm">
                 <thead className="bg-gray-50 text-gray-500 font-bold text-xs uppercase tracking-wider sticky top-0">
                     <tr>
                         <th className="px-6 py-4 border-b border-gray-100">No. Inv</th>
                         <th className="px-6 py-4 border-b border-gray-100">Tanggal & Waktu</th>
                         <th className="px-6 py-4 border-b border-gray-100">Pelanggan</th>
                         <th className="px-6 py-4 border-b border-gray-100">Rincian Item</th>
                         <th className="px-6 py-4 border-b border-gray-100 text-right">Potongan</th>
                         <th className="px-6 py-4 border-b border-gray-100 text-right">Total Net</th>
                     </tr>
                 </thead>
                 <tbody className="divide-y divide-gray-50">
                     {filteredData.map(t => (
                         <tr key={t.id} className="hover:bg-pink-50/50 transition-colors">
                            <td className="px-6 py-4 font-bold text-lb-pink">{t.id}</td>
                            <td className="px-6 py-4 text-gray-500 font-medium">{format(new Date(t.date), "dd MMM yyyy, HH:mm")}</td>
                            <td className="px-6 py-4 font-bold text-gray-800">{t.customer}</td>
                            <td className="px-6 py-4 text-gray-500 truncate max-w-[200px]">{t.items}</td>
                            <td className="px-6 py-4 text-right text-red-400 font-semibold">{t.discount > 0 ? `- Rp ${t.discount.toLocaleString('id-ID')}` : '-'}</td>
                            <td className="px-6 py-4 text-right font-black text-gray-800">Rp {t.total.toLocaleString('id-ID')}</td>
                         </tr>
                     ))}
                     {filteredData.length === 0 && (
                         <tr>
                             <td colSpan={6} className="text-center py-10 text-gray-400 font-medium">Tidak ada transaksi pada rentang tanggal ini.</td>
                         </tr>
                     )}
                 </tbody>
             </table>
          </div>
      </div>
    </div>
  );
}
