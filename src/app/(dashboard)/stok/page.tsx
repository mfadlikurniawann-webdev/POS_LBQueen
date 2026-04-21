"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { Plus, Search, Edit2, Trash2, X, Loader2, Flower2, Package, Stethoscope, Briefcase, Shirt } from "lucide-react";
import Image from "next/image";

const TYPES = ["Treatment", "Retail Produk", "Barang Kantor", "Aset Karyawan"] as const;

const typeConfig: Record<string, { color: string; bg: string; icon: React.ReactNode }> = {
  "Treatment":      { color: "text-purple-600",  bg: "bg-purple-50",  icon: <Stethoscope className="w-4 h-4" /> },
  "Retail Produk":  { color: "text-pink-600",    bg: "bg-pink-50",    icon: <Package className="w-4 h-4" /> },
  "Barang Kantor":  { color: "text-blue-600",    bg: "bg-blue-50",    icon: <Briefcase className="w-4 h-4" /> },
  "Aset Karyawan":  { color: "text-amber-600",   bg: "bg-amber-50",   icon: <Shirt className="w-4 h-4" /> },
};

type Product = {
  id: number; product_code: string; name: string; type: string;
  purchase_price: number; selling_price: number; stock: number;
  unit: string; image_url: string | null;
};

const emptyForm = {
  product_code: "", name: "", type: "Treatment",
  purchase_price: "", selling_price: "", stock: "", unit: "Sesi", image_url: "",
};

export default function StokPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [activeTab, setActiveTab] = useState("Treatment");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<Product | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("products").select("*").order("name");
    setProducts(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const openAdd = () => {
    setEditItem(null);
    setForm({ ...emptyForm, type: activeTab, unit: activeTab === "Treatment" ? "Sesi" : "Pcs" });
    setShowModal(true);
  };

  const openEdit = (p: Product) => {
    setEditItem(p);
    setForm({
      product_code: p.product_code, name: p.name, type: p.type,
      purchase_price: String(p.purchase_price), selling_price: String(p.selling_price),
      stock: String(p.stock), unit: p.unit, image_url: p.image_url || "",
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.product_code) { showToast("Kode dan nama wajib diisi!"); return; }
    setSaving(true);
    const payload = {
      product_code: form.product_code, name: form.name, type: form.type,
      purchase_price: parseFloat(form.purchase_price) || 0,
      selling_price: parseFloat(form.selling_price) || 0,
      stock: parseInt(form.stock) || 0, unit: form.unit,
      image_url: form.image_url || null,
    };
    if (editItem) {
      await supabase.from("products").update(payload).eq("id", editItem.id);
      showToast("Produk berhasil diperbarui!");
    } else {
      const { error } = await supabase.from("products").insert(payload);
      if (error) { showToast("Kode produk sudah ada!"); setSaving(false); return; }
      showToast("Produk baru berhasil ditambahkan!");
    }
    setSaving(false); setShowModal(false); fetchProducts();
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Hapus produk ini?")) return;
    await supabase.from("products").delete().eq("id", id);
    showToast("Produk dihapus."); fetchProducts();
  };

  const filtered = products.filter(p =>
    p.type === activeTab && p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col bg-gray-50 overflow-hidden">
      {toast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[999] bg-gray-900 text-white px-6 py-3 rounded-2xl text-sm font-semibold shadow-2xl">{toast}</div>
      )}
      {/* Header */}
      {/* (rendered by layout) */}

      {/* Toolbar: Tabs + Add Button */}
      <div className="bg-white border-b border-gray-100 px-5 flex items-center justify-between gap-4 shrink-0">
        <div className="flex gap-0 overflow-x-auto">
          {TYPES.map(type => {
            const cfg = typeConfig[type];
            const active = activeTab === type;
            return (
              <button key={type} onClick={() => setActiveTab(type)}
                className={`flex items-center gap-1.5 px-4 py-3.5 text-sm font-bold border-b-2 transition-all whitespace-nowrap ${
                  active ? "border-[#C94F78] text-[#C94F78]" : "border-transparent text-gray-400 hover:text-gray-600"
                }`}>
                <span className={active ? "text-[#C94F78]" : "text-gray-400"}>{cfg.icon}</span>
                {type}
              </button>
            );
          })}
        </div>
        <button onClick={openAdd}
          className="bg-[#C94F78] hover:bg-[#A83E60] text-white font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 text-sm transition-all shadow-md shadow-pink-200 shrink-0">
          <Plus className="w-4 h-4" /> Tambah
        </button>
      </div>

      {/* Toolbar */}
      <div className="px-6 py-4 flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder={`Cari ${activeTab}...`} value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-pink-100 focus:border-pink-300 outline-none" />
        </div>
        <span className="text-sm text-gray-400 font-semibold">{filtered.length} item</span>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto px-6 pb-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm min-w-[600px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-xs font-extrabold text-gray-500 uppercase tracking-wider">
                <th className="px-6 py-4 text-left">Produk</th>
                <th className="px-6 py-4 text-left">Harga Modal</th>
                {(activeTab === "Treatment" || activeTab === "Retail Produk") && <th className="px-6 py-4 text-left">Harga Jual</th>}
                <th className="px-6 py-4 text-center">Stok / Unit</th>
                <th className="px-6 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan={5} className="text-center py-12"><Loader2 className="w-8 h-8 mx-auto text-pink-300 animate-spin" /></td></tr>
              ) : filtered.map(p => (
                <tr key={p.id} className="hover:bg-pink-50/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl overflow-hidden bg-pink-50 border border-pink-100 shrink-0 flex items-center justify-center">
                        {p.image_url
                          ? <Image src={p.image_url} alt={p.name} width={44} height={44} className="object-cover w-full h-full" />
                          : <Flower2 className="w-5 h-5 text-pink-200" />}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">{p.name}</p>
                        <p className="text-xs text-gray-400 font-mono">{p.product_code}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-500 font-medium">Rp {p.purchase_price.toLocaleString("id-ID")}</td>
                  {(activeTab === "Treatment" || activeTab === "Retail Produk") && (
                    <td className="px-6 py-4 font-bold text-[#C94F78]">Rp {p.selling_price.toLocaleString("id-ID")}</td>
                  )}
                  <td className="px-6 py-4 text-center font-bold text-gray-700">
                    {p.type === "Treatment" ? <span className="text-purple-400">∞ Sesi</span> : `${p.stock} ${p.unit}`}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => openEdit(p)} className="p-2 text-gray-400 hover:text-[#C94F78] hover:bg-pink-50 rounded-lg transition-all">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(p.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && filtered.length === 0 && (
                <tr><td colSpan={5} className="text-center py-12 text-gray-400">
                  <Package className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p>Belum ada data. Tambahkan sekarang!</p>
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Form */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => !saving && setShowModal(false)}>
          <div className="bg-white rounded-3xl p-6 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-auto" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-extrabold text-gray-900">{editItem ? "Edit Produk" : "Tambah Produk Baru"}</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600"><X /></button>
            </div>

            <div className="space-y-4">
              {/* Tipe */}
              <div>
                <label className="label-form">Kategori Produk</label>
                <div className="grid grid-cols-2 gap-2">
                  {TYPES.map(t => (
                    <button key={t} type="button"
                      onClick={() => setForm(f => ({ ...f, type: t }))}
                      className={`p-2.5 rounded-xl text-sm font-bold border-2 transition-all text-left flex items-center gap-2 ${form.type === t ? "border-[#C94F78] bg-pink-50 text-[#C94F78]" : "border-gray-100 text-gray-500 hover:border-gray-200"}`}>
                      <span className={form.type === t ? "text-[#C94F78]" : "text-gray-400"}>{typeConfig[t].icon}</span>{t}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label-form">Kode Produk *</label>
                  <input className="input-form" placeholder="e.g. TRT-001" value={form.product_code} onChange={e => setForm(f => ({ ...f, product_code: e.target.value }))} />
                </div>
                <div>
                  <label className="label-form">Satuan</label>
                  <input className="input-form" placeholder="Sesi, Pcs, Botol..." value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))} />
                </div>
              </div>

              <div>
                <label className="label-form">Nama Produk / Layanan *</label>
                <input className="input-form" placeholder="Nama lengkap produk atau treatment" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label-form">Harga Modal (Rp)</label>
                  <input type="number" className="input-form" placeholder="0" value={form.purchase_price} onChange={e => setForm(f => ({ ...f, purchase_price: e.target.value }))} />
                </div>
                <div>
                  <label className="label-form">Harga Jual (Rp)</label>
                  <input type="number" className="input-form" placeholder="0" value={form.selling_price} onChange={e => setForm(f => ({ ...f, selling_price: e.target.value }))} />
                </div>
              </div>

              {form.type !== "Treatment" && (
                <div>
                  <label className="label-form">Stok Awal</label>
                  <input type="number" className="input-form" placeholder="0" value={form.stock} onChange={e => setForm(f => ({ ...f, stock: e.target.value }))} />
                </div>
              )}

              {/* URL Foto */}
              <div>
                <label className="label-form">Link Foto Produk (URL)</label>
                <input className="input-form" placeholder="https://..." value={form.image_url} onChange={e => setForm(f => ({ ...f, image_url: e.target.value }))} />
                {form.image_url && (
                  <div className="mt-2 w-20 h-20 rounded-xl overflow-hidden border border-gray-200">
                    <Image src={form.image_url} alt="preview" width={80} height={80} className="object-cover w-full h-full" onError={() => setForm(f => ({ ...f, image_url: "" }))} />
                  </div>
                )}
                <p className="text-xs text-gray-400 mt-1">Paste URL gambar produk (dari Google Drive, Supabase Storage, dsb)</p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="flex-1 py-3 border-2 border-gray-200 rounded-xl font-bold text-gray-600 hover:border-gray-300">Batal</button>
              <button onClick={handleSave} disabled={saving}
                className="flex-1 py-3 bg-[#C94F78] hover:bg-[#A83E60] text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {saving ? "Menyimpan..." : (editItem ? "Simpan Perubahan" : "Tambah Produk")}
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        .label-form { display: block; font-size: 12px; font-weight: 700; color: #6B7280; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 6px; }
        .input-form { width: 100%; padding: 10px 14px; border: 2px solid #F3F4F6; border-radius: 12px; font-size: 14px; font-weight: 500; color: #111827; transition: all 0.2s; outline: none; }
        .input-form:focus { border-color: #C94F78; box-shadow: 0 0 0 3px rgba(201,79,120,0.1); }
      `}</style>
    </div>
  );
}
