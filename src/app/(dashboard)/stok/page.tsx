"use client";

import { useState } from "react";
import { Package, Plus, Search, Filter } from "lucide-react";

export default function StokPage() {
  const [activeTab, setActiveTab] = useState("Retail Produk");
  
  // Dummy Data
  const products = [
    { id: 1, name: "Facial Wash Glowing", type: "Retail Produk", purchase_price: 50000, selling_price: 85000, stock: 45, unit: "Botol" },
    { id: 2, name: "Laser Rejuvenation", type: "Treatment", purchase_price: 0, selling_price: 450000, stock: 999, unit: "Sesi" },
    { id: 3, name: "Jarum Suntik Micro", type: "Barang Kantor", purchase_price: 2000, selling_price: 0, stock: 500, unit: "Pcs" },
    { id: 4, name: "Seragam Kasir", type: "Aset Karyawan", purchase_price: 150000, selling_price: 0, stock: 15, unit: "Pcs" },
  ];

  const types = ["Treatment", "Retail Produk", "Barang Kantor", "Aset Karyawan"];
  const filteredProducts = products.filter(p => p.type === activeTab);

  return (
    <div className="p-8 h-full flex flex-col bg-gray-50/50">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 tracking-tight">Manajemen Inventaris & Aset</h1>
          <p className="text-gray-500 text-sm">Kelola produk jual, treatment, logistik klinik, dan aset karyawan.</p>
        </div>
        <button className="bg-lb-pink hover:bg-lb-pink-dark text-white font-bold py-2.5 px-5 rounded-2xl flex items-center gap-2 shadow-lg shadow-pink-200 transition-all">
          <Plus className="w-5 h-5" /> Produk Baru
        </button>
      </div>

      {/* TABS */}
      <div className="flex gap-4 mb-6 border-b border-gray-200">
        {types.map(type => (
          <button
            key={type}
            onClick={() => setActiveTab(type)}
            className={`pb-3 px-2 font-bold text-sm transition-all border-b-2 ${activeTab === type ? 'border-lb-pink text-lb-pink' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
          >
            {type}
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex justify-between items-center mb-4">
        <div className="relative w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder={`Cari di ${activeTab}...`} className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-lb-pink/20 outline-none" />
        </div>
        <button className="flex items-center gap-2 text-sm font-medium text-gray-500 bg-white border border-gray-200 px-4 py-2 rounded-xl">
          <Filter className="w-4 h-4" /> Filter
        </button>
      </div>

      {/* TABLE */}
      <div className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm flex-1">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50/50 text-gray-500 font-medium border-b border-gray-100">
            <tr>
              <th className="px-6 py-4">Nama Item</th>
              <th className="px-6 py-4">Kategori</th>
              <th className="px-6 py-4">Harga Modal</th>
              {activeTab === "Treatment" || activeTab === "Retail Produk" ? <th className="px-6 py-4">Harga Jual</th> : null}
              <th className="px-6 py-4 text-center">Stok Sistem</th>
              <th className="px-6 py-4 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filteredProducts.map(p => (
              <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-6 py-4 font-bold text-gray-800">{p.name}</td>
                <td className="px-6 py-4">
                  <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs font-bold">{p.type}</span>
                </td>
                <td className="px-6 py-4 text-gray-500">Rp {p.purchase_price.toLocaleString('id-ID')}</td>
                {activeTab === "Treatment" || activeTab === "Retail Produk" ? <td className="px-6 py-4 font-bold text-lb-pink">Rp {p.selling_price.toLocaleString('id-ID')}</td> : null}
                <td className="px-6 py-4 font-extrabold text-center text-gray-800">{p.type === 'Treatment' ? '∞' : `${p.stock} ${p.unit}`}</td>
                <td className="px-6 py-4 text-right">
                  <button className="text-lb-pink font-semibold hover:underline text-xs">Edit</button>
                </td>
              </tr>
            ))}
            {filteredProducts.length === 0 && (
              <tr>
                 <td colSpan={6} className="text-center py-10 text-gray-400">Tidak ada data di kategori ini.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
