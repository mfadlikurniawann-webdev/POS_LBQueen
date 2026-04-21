"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { Plus, Search, Edit2, Trash2, X, Loader2, Flower2, Package, Sparkles, ChevronDown, Upload, Image as ImageIcon } from "lucide-react";
import Image from "next/image";

const TYPES = ["Treatment", "Retail Produk", "Treatment Care & Beauty", "Product Care & Beauty", "Barang Kantor", "Aset Karyawan"] as const;

const typeConfig: Record<string, { color: string; bg: string; icon: React.ReactNode }> = {
  "Treatment":               { color: "text-purple-600", bg: "bg-purple-50", icon: <Sparkles className="w-4 h-4" /> },
  "Retail Produk":           { color: "text-pink-600",   bg: "bg-pink-50",   icon: <Package className="w-4 h-4" /> },
  "Treatment Care & Beauty": { color: "text-purple-500", bg: "bg-gray-50",   icon: <Flower2 className="w-4 h-4" /> },
  "Product Care & Beauty":   { color: "text-pink-500",   bg: "bg-gray-50",   icon: <Package className="w-4 h-4" /> },
  "Barang Kantor":           { color: "text-blue-600",   bg: "bg-blue-50",   icon: <Package className="w-4 h-4" /> },
  "Aset Karyawan":           { color: "text-amber-600",  bg: "bg-amber-50",  icon: <Package className="w-4 h-4" /> },
};

type Product = {
  id: number; product_code: string; name: string; type: string;
  purchase_price: number; selling_price: number; stock: number;
  unit: string; image_url: string | null; sub_category?: string | null;
};

const emptyForm = {
  product_code: "", name: "", type: "Treatment",
  purchase_price: "", selling_price: "", stock: "", unit: "Sesi", image_url: "",
  sub_category: "",
};

export default function StokPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [existingSubCategories, setExistingSubCategories] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState("Treatment");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<Product | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

  const fetchData = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("products").select("*").order("name");
    setProducts(data || []);
    
    // Extract unique sub_categories
    const subs = Array.from(new Set((data || []).map(p => p.sub_category).filter(Boolean))) as string[];
    setExistingSubCategories(subs);
    
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

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
      sub_category: p.sub_category || "",
    });
    setShowModal(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      showToast("Gagal: Ukuran file maksimal 2MB"); return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setForm(f => ({ ...f, image_url: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!form.name || !form.product_code) return showToast("Gagal: Kode dan Nama produk wajib diisi!");
    setSaving(true);
    try {
      const payload = {
        product_code: form.product_code.trim(),
        name: form.name.trim(),
        type: form.type,
        purchase_price: parseFloat(form.purchase_price) || 0,
        selling_price: parseFloat(form.selling_price) || 0,
        stock: parseInt(form.stock) || 0,
        unit: form.unit.trim() || (form.type === "Treatment" ? "Sesi" : "Pcs"),
        image_url: form.image_url || null,
        sub_category: form.sub_category?.trim() || null,
      };

      const { error } = editItem 
        ? await supabase.from("products").update(payload).eq("id", editItem.id)
        : await supabase.from("products").insert(payload);

      if (error) throw error;
      showToast(editItem ? "Produk diperbarui!" : "Produk baru ditambahkan!");
      setShowModal(false); fetchData();
    } catch (err: any) {
      showToast(`Gagal: ${err.message}`);
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Hapus produk ini?")) return;
    await supabase.from("products").delete().eq("id", id);
    showToast("Produk dihapus."); fetchData();
  };

  const filtered = products.filter(p => p.type === activeTab && p.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="h-full flex flex-col bg-gray-50/50 font-sans">
      {toast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[60] bg-gray-900 text-white px-6 py-3 rounded-2xl text-xs font-bold shadow-2xl animate-in fade-in slide-in-from-top-4">{toast}</div>
      )}

      {/* Header Area */}
      <div className="bg-white px-6 py-6 border-b border-gray-100 shrink-0">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">Inventori Produk</h2>
            <p className="text-sm text-gray-400 font-medium">Kelola stok dan layanan klinik LBQueen</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative min-w-[280px]">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="text" placeholder={`Cari di ${activeTab}...`} value={search} onChange={e => setSearch(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 bg-gray-50 border-2 border-gray-100 rounded-xl text-sm font-medium focus:bg-white focus:border-[#C94F78] outline-none transition-all" />
            </div>
            <button onClick={openAdd} className="bg-[#C94F78] hover:bg-[#A83E60] text-white font-bold px-6 py-2.5 rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-pink-100">
              <Plus className="w-5 h-5" /> Tambah Produk
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mt-8 overflow-x-auto scrollbar-hide pb-1">
          {TYPES.map(t => (
            <button key={t} onClick={() => setActiveTab(t)}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border-2 ${activeTab === t ? "bg-white border-[#C94F78] text-[#C94F78] shadow-sm" : "bg-transparent border-transparent text-gray-400 hover:text-gray-600"}`}>
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Table Area */}
      <div className="flex-1 overflow-auto p-6">
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100 uppercase text-[10px] font-black text-gray-400 tracking-wider">
                <th className="px-6 py-4">Produk / Layanan</th>
                <th className="px-6 py-4">Sub Kategori</th>
                <th className="px-6 py-4">Harga Modal</th>
                <th className="px-6 py-4">Harga Jual</th>
                <th className="px-6 py-4 text-center">Stok</th>
                <th className="px-6 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan={6} className="py-20 text-center"><Loader2 className="w-8 h-8 text-[#C94F78] animate-spin mx-auto opacity-20" /></td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="py-20 text-center text-gray-400 font-medium">Belum ada data di kategori ini.</td></tr>
              ) : filtered.map(p => (
                <tr key={p.id} className="hover:bg-pink-50/30 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl overflow-hidden bg-pink-50 border border-pink-100 shrink-0 flex items-center justify-center">
                        {p.image_url ? (
                          <Image src={p.image_url} alt={p.name} width={48} height={48} className="object-cover w-full h-full" />
                        ) : (
                          <Flower2 className="w-5 h-5 text-pink-200" />
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 leading-tight">{p.name}</p>
                        <p className="text-[11px] text-gray-400 font-mono mt-1">{p.product_code}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="bg-gray-100 text-gray-500 text-[10px] font-bold px-2 py-1 rounded-lg uppercase">{p.sub_category || "Umum"}</span>
                  </td>
                  <td className="px-6 py-4 text-gray-500 font-medium text-sm">Rp {p.purchase_price.toLocaleString("id-ID")}</td>
                  <td className="px-6 py-4 font-bold text-[#C94F78] text-sm">Rp {p.selling_price.toLocaleString("id-ID")}</td>
                  <td className="px-6 py-4 text-center font-bold text-gray-700 text-sm">
                    {p.type === "Treatment" ? <span className="text-purple-400">∞ Sesi</span> : `${p.stock} ${p.unit}`}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => openEdit(p)} className="p-2 text-gray-400 hover:text-[#C94F78] hover:bg-pink-50 rounded-xl transition-all">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(p.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Form */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] p-8 w-full max-w-xl shadow-2xl max-h-[90vh] overflow-auto">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h3 className="text-2xl font-extrabold text-gray-900">{editItem ? "Edit Produk" : "Produk Baru"}</h3>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">{form.type}</p>
              </div>
              <button onClick={() => setShowModal(false)} className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 hover:text-gray-900"><X /></button>
            </div>

            <div className="space-y-6">
              {/* Image Upload */}
              <div className="flex flex-col items-center">
                 <div className="w-32 h-32 rounded-[32px] bg-gray-50 border-2 border-dashed border-gray-200 flex items-center justify-center relative overflow-hidden group cursor-pointer"
                   onClick={() => fileInputRef.current?.click()}>
                   {form.image_url ? (
                     <Image src={form.image_url} alt="Preview" width={128} height={128} className="object-cover w-full h-full" />
                   ) : (
                     <Upload className="w-8 h-8 text-gray-300" />
                   )}
                   <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <ImageIcon className="text-white w-6 h-6" />
                   </div>
                 </div>
                 <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                 <p className="text-[10px] text-gray-400 font-bold uppercase mt-3 tracking-wider">Klik untuk unggah foto (Max 2MB)</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label-form">Kode *</label>
                  <input className="input-form" placeholder="P-001" value={form.product_code} onChange={e => setForm(f => ({ ...f, product_code: e.target.value }))} />
                </div>
                <div>
                  <label className="label-form">Sub Kategori</label>
                  <input className="input-form" list="sub-cats" placeholder="Pilih / Ketik..." value={form.sub_category} onChange={e => setForm(f => ({ ...f, sub_category: e.target.value }))} />
                  <datalist id="sub-cats">{existingSubCategories.map(s => <option key={s} value={s} />)}</datalist>
                </div>
              </div>

              <div>
                <label className="label-form">Nama Produk / Layanan *</label>
                <input className="input-form" placeholder="Masukkan nama..." value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label-form">Stok</label>
                  <input type="number" className="input-form disabled:opacity-25" disabled={form.type === "Treatment"} placeholder="0" value={form.stock} onChange={e => setForm(f => ({ ...f, stock: e.target.value }))} />
                </div>
                <div>
                  <label className="label-form">Satuan Unit</label>
                  <input className="input-form" placeholder="Pcs, Sesi..." value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))} />
                </div>
              </div>
            </div>

            <div className="flex gap-4 mt-10">
              <button onClick={() => setShowModal(false)} className="flex-1 py-4 border-2 border-gray-100 rounded-2xl font-bold text-gray-400 hover:bg-gray-50 transition-all uppercase text-xs tracking-widest">Batal</button>
              <button onClick={handleSave} disabled={saving} className="flex-1 py-4 bg-[#C94F78] hover:bg-[#A83E60] text-white font-bold rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-pink-100 disabled:opacity-50 uppercase text-xs tracking-widest">
                {saving ? "Menyimpan..." : (editItem ? "Simpan Perubahan" : "Simpan Produk")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
