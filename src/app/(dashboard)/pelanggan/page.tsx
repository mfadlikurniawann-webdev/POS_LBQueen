"use client";

import { useState } from "react";
import { Users, Plus, Tag } from "lucide-react";

export default function PelangganPage() {
  const customers = [
    { id: 1, name: "Ayu Lestari", phone: "0812345678", is_member: true, join_date: "2024-01-15" },
    { id: 2, name: "Bunga", phone: "0898765432", is_member: false, join_date: "2024-03-20" },
  ];

  const vouchers = [
    { id: 1, code: "MEMBER50", name: "Diskon Member 50Rb", discount_amount: 50000, min_purchase: 200000 },
  ];

  return (
    <div className="p-8 h-full overflow-auto bg-gray-50/50">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 tracking-tight">Pelanggan & Membership</h1>
          <p className="text-gray-500 text-sm">Kelola data pasien/pelanggan dan *Custom Voucher* diskon.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Kolom Kiri: Tabel Pelanggan */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center">
             <h2 className="text-lg font-bold">Database Pelanggan</h2>
             <button className="text-sm bg-gray-900 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2"><Plus className="w-4 h-4"/> Tambah Pelanggan</button>
          </div>
          <div className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50/50 text-gray-500 font-medium border-b border-gray-100">
                <tr>
                   <th className="px-6 py-4">Nama</th>
                   <th className="px-6 py-4">Nomor HP</th>
                   <th className="px-6 py-4">Status Membership</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {customers.map(c => (
                  <tr key={c.id}>
                    <td className="px-6 py-4 font-bold text-gray-800">{c.name}</td>
                    <td className="px-6 py-4 text-gray-500">{c.phone}</td>
                    <td className="px-6 py-4">
                      {c.is_member ? <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">Member Aktif</span> : <span className="bg-gray-100 text-gray-500 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">Reguler</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Kolom Kanan: Kupon/Voucher */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
             <h2 className="text-lg font-bold flex items-center gap-2"><Tag className="w-5 h-5 text-lb-pink"/> Voucher Aktif</h2>
             <button className="text-sm bg-lb-pink/10 text-lb-pink px-3 py-1.5 rounded-lg font-bold hover:bg-lb-pink hover:text-white transition-all"><Plus className="w-4 h-4"/></button>
          </div>
          
          <div className="space-y-3">
             {vouchers.map(v => (
               <div key={v.id} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm relative overflow-hidden group">
                 <div className="absolute top-0 right-0 w-16 h-16 bg-pink-50 rounded-bl-full -z-10"></div>
                 <h3 className="font-extrabold text-gray-800 text-lg">{v.code}</h3>
                 <p className="text-xs text-gray-500 mb-2">{v.name}</p>
                 <div className="flex justify-between items-end mt-4">
                    <div>
                      <p className="text-[10px] text-gray-400 font-bold uppercase">Potongan</p>
                      <p className="font-bold text-lb-pink">Rp {v.discount_amount.toLocaleString('id-ID')}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-gray-400 font-bold uppercase">Min. Beli</p>
                      <p className="font-bold text-gray-700 text-xs">Rp {v.min_purchase.toLocaleString('id-ID')}</p>
                    </div>
                 </div>
               </div>
             ))}
             
             <div className="bg-blue-50/50 border border-blue-100 border-dashed rounded-2xl p-4 text-center">
                <p className="text-xs text-blue-500">Voucher di atas otomatis muncul di Kasir jika pelanggan adalah <b>Member</b> dan memenuhi <b>Minimum Pembelian</b>.</p>
             </div>
          </div>
        </div>

      </div>
    </div>
  );
}
