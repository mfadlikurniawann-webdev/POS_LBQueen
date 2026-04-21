"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { Plus, Search, Edit2, Trash2, X, Loader2, Flower2, Package, Stethoscope, Briefcase, Shirt, Sparkles, ChevronDown } from "lucide-react";
import Image from "next/image";

const TYPES = ["Treatment Care & Beauty", "Product Care & Beauty", "Barang Kantor", "Aset Karyawan", "Treatment", "Retail Produk"] as const;

const typeConfig: Record<string, { color: string; bg: string; icon: React.ReactNode }> = {
  "Treatment Care & Beauty": { color: "text-purple-600",  bg: "bg-purple-50",  icon: <Sparkles className="w-4 h-4" /> },
  "Product Care & Beauty":   { color: "text-pink-600",    bg: "bg-pink-50",    icon: <Package className="w-4 h-4" /> },
  "Treatment":               { color: "text-purple-500",  bg: "bg-gray-50",    icon: <Flower2 className="w-4 h-4" /> },
  "Retail Produk":           { color: "text-pink-500",    bg: "bg-gray-50",    icon: <Package className="w-4 h-4" /> },
  "Barang Kantor":           { color: "text-blue-600",    bg: "bg-blue-50",    icon: <Briefcase className="w-4 h-4" /> },
  "Aset Karyawan":           { color: "text-amber-600",   bg: "bg-amber-50",   icon: <Shirt className="w-4 h-4" /> },
};

type Product = {
  id: number; product_code: string; name: string; type: string;
  purchase_price: number; selling_price: number; stock: number;
  unit: string; image_url: string | null; is_set: boolean;
  category_id: number | null;
};

type Category = { id: number; name: string };

const emptyForm = {
  product_code: "", name: "", type: "Treatment Care & Beauty",
  purchase_price: "", selling_price: "", stock: "", unit: "Sesi", image_url: "", is_set: false,
  category_id: "" as string | number,
};

export default function StokPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeTab, setActiveTab] = useState("Treatment Care & Beauty");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<Product | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [{ data: pData }, { data: cData }] = await Promise.all([
      supabase.from("products").select("*").order("name"),
      supabase.from("categories").select("*").order("name"),
    ]);
    setProducts(pData || []);
    setCategories(cData || []);
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
      stock: String(p.stock), unit: p.unit, image_url: p.image_url || "", is_set: p.is_set || false,
      category_id: p.category_id || "",
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.product_code) { 
      showToast("Gagal: Kode dan Nama produk wajib diisi!"); 
      return; 
    }
    
    setSaving(true);
    try {
      const payload = {
        product_code: form.product_code.trim(),
        name: form.name.trim(),
        type: form.type,
        purchase_price: parseFloat(form.purchase_price) || 0,
        selling_price: parseFloat(form.selling_price) || 0,
        stock: parseInt(form.stock) || 0,
        unit: form.unit.trim() || (form.type.includes("Treatment") ? "Sesi" : "Pcs"),
        image_url: form.image_url?.trim() || null,
        is_set: form.is_set,
        category_id: form.category_id ? Number(form.category_id) : null,
      };

      let result;
      if (editItem) {
        result = await supabase.from("products").update(payload).eq("id", editItem.id);
      } else {
        result = await supabase.from("products").insert(payload);
      }

      if (result.error) {
        console.error("Supabase Error:", result.error);
        if (result.error.code === "23505") { // Unique violation
          showToast(`Gagal: Kode Produk "${form.product_code}" sudah digunakan.`);
        } else {
          showToast(`Gagal: ${result.error.message}`);
        }
        setSaving(false);
        return;
      }

      showToast(editItem ? "Produk diperbarui!" : "Produk baru ditambahkan!");
      setSaving(false); 
      setShowModal(false); 
      fetchData();
    } catch (err: any) {
      console.error("Client Error:", err);
      showToast("Terjadi kesalahan sistem. Coba lagi.");
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Hapus produk ini?")) return;
    await supabase.from("products").delete().eq("id", id);
    showToast("Produk dihapus."); fetchData();
  }

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

      {/* Tabs Layout */}
      <div className="bg-white border-b border-rose-50 px-5 flex items-center justify-between gap-4 shrink-0 overflow-hidden">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide py-2">
          {TYPES.map(type => {
            const cfg = typeConfig[type];
            const active = activeTab === type;
            return (
              <button key={type} onClick={() => setActiveTab(type)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all whitespace-nowrap border-2 ${
                  active 
                    ? "bg-lb-rose text-white border-lb-rose shadow-lg shadow-rose-200 scale-[1.03]" 
                    : "bg-white text-gray-400 border-gray-100 hover:border-gray-200"
                }`}>
                <span className={active ? "text-white" : "text-gray-300"}>{cfg.icon}</span>
                {type}
              </button>
            );
          })}
        </div>
        <button onClick={openAdd}
          className="bg-gray-900 hover:bg-lb-rose text-white font-black px-5 py-2.5 rounded-2xl flex items-center gap-2 text-[11px] uppercase tracking-widest transition-all shadow-xl shadow-gray-200 shrink-0">
          <Plus className="w-4 h-4" /> Tambah
        </button>
      </div>

      {/* Toolbar */}
      {/* Main Search & Stats */}
      <div className="px-6 py-5 flex items-center justify-between">
        <div className="relative flex-1 max-w-sm group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-lb-rose transition-colors" />
          <input type="text" placeholder={`Cari di ${activeTab}...`} value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 bg-white border-2 border-gray-100 rounded-2xl text-xs font-bold focus:border-lb-rose focus:ring-4 focus:ring-rose-50 outline-none transition-all shadow-sm" />
        </div>
        <div className="flex items-center gap-2">
           <div className="w-2 h-2 rounded-full bg-lb-rose animate-pulse" />
           <span className="text-[11px] text-gray-400 font-black uppercase tracking-widest">{filtered.length} Tersedia</span>
        </div>
      </div>

      {/* Responsive Content */}
      <div className="flex-1 overflow-auto px-6 pb-24 md:pb-6">
        {loading ? (
          <div className="h-full flex items-center justify-center">
            <Loader2 className="w-10 h-10 text-rose-200 animate-spin" />
          </div>
        ) : (
          <>
            {/* Mobile View (Cards) */}
            <div className="grid grid-cols-1 gap-4 md:hidden">
              {filtered.map(p => (
                <div key={p.id} className="bg-white rounded-3xl border border-gray-100 p-4 shadow-sm relative overflow-hidden">
                  <div className="flex gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center shrink-0 overflow-hidden">
                      {p.image_url ? (
                        <Image src={p.image_url} alt={p.name} width={64} height={64} className="object-cover w-full h-full" />
                      ) : (
                        <Flower2 className="w-6 h-6 text-rose-200" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-black text-gray-800 text-sm truncate">{p.name}</h4>
                        {p.is_set && <span className="bg-emerald-100 text-emerald-600 text-[8px] font-black px-1.5 py-0.5 rounded uppercase">SET</span>}
                      </div>
                      <p className="text-[10px] text-gray-400 font-mono mb-2 uppercase">{p.product_code}</p>
                      <div className="flex items-center justify-between mt-auto">
                        <div className="flex flex-col leading-tight">
                          <span className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter">Harga Jual</span>
                          <span className="text-sm font-black text-lb-rose">Rp {p.selling_price.toLocaleString("id-ID")}</span>
                        </div>
                        <div className="text-right flex flex-col leading-tight">
                          <span className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter">Stok</span>
                          <span className="text-xs font-bold text-gray-700">{p.type === "Treatment" ? "∞ Sesi" : `${p.stock} ${p.unit}`}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="absolute top-3 right-3 flex gap-1">
                    <button onClick={() => openEdit(p)} className="p-2 text-gray-300 hover:text-lb-rose bg-gray-50 rounded-xl transition-all">
                      <Edit2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop View (Table) */}
            <div className="hidden md:block bg-white rounded-3xl border border-gray-100 shadow-premium overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50/50 border-b border-gray-100 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    <th className="px-6 py-5 text-left">Informasi Produk</th>
                    <th className="px-6 py-5 text-left">Modal</th>
                    {(activeTab === "Treatment" || activeTab === "Retail Produk" || activeTab.includes("Beauty")) && <th className="px-6 py-5 text-left">Harga Jual</th>}
                    <th className="px-6 py-5 text-center">Status Stok</th>
                    <th className="px-6 py-5 text-right">Kelola</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map(p => (
                    <tr key={p.id} className="hover:bg-rose-50/20 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-[18px] overflow-hidden bg-rose-50 border border-rose-100 shrink-0 flex items-center justify-center group-hover:scale-105 transition-transform">
                            {p.image_url
                              ? <Image src={p.image_url} alt={p.name} width={48} height={48} className="object-cover w-full h-full" />
                              : <Flower2 className="w-6 h-6 text-rose-200" />}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-black text-gray-800 text-sm">{p.name}</p>
                              {p.is_set && <span className="bg-emerald-100 text-emerald-600 text-[9px] font-black px-2 py-0.5 rounded-full border border-emerald-200">SET</span>}
                            </div>
                            <p className="text-[10px] text-gray-400 font-black tracking-widest uppercase mt-0.5">{p.product_code}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-400 font-bold">Rp {p.purchase_price.toLocaleString("id-ID")}</td>
                      {(activeTab === "Treatment" || activeTab === "Retail Produk" || activeTab.includes("Beauty")) && (
                        <td className="px-6 py-4 font-black text-lb-rose italic">Rp {p.selling_price.toLocaleString("id-ID")}</td>
                      )}
                      <td className="px-6 py-4 text-center">
                         <div className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                           p.stock <= 5 && p.type !== "Treatment" ? "bg-amber-100 text-amber-600" : "bg-emerald-100 text-emerald-600"
                         }`}>
                           {p.type === "Treatment" ? "∞ Unlimited" : `${p.stock} ${p.unit}`}
                         </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => openEdit(p)} className="p-2.5 text-gray-300 hover:text-lb-rose hover:bg-rose-50 rounded-xl transition-all shadow-sm">
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete(p.id)} className="p-2.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all shadow-sm">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
        
        {!loading && filtered.length === 0 && (
          <div className="py-20 text-center text-gray-300">
            <Package className="w-16 h-16 mx-auto mb-4 opacity-10" />
            <p className="font-black uppercase tracking-widest text-sm">Tidak ada data ditemukan</p>
          </div>
        )}
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
                  {TYPES.map(t => {
                    const cfg = typeConfig[t];
                    if (!cfg) return null;
                    return (
                      <button key={t} type="button"
                        onClick={() => setForm(f => ({ ...f, type: t, unit: t.includes("Treatment") ? "Sesi" : "Pcs" }))}
                        className={`p-2.5 rounded-xl text-[11px] font-bold border-2 transition-all text-left flex items-center gap-2 ${form.type === t ? "border-[#C94F78] bg-pink-50 text-[#C94F78]" : "border-gray-100 text-gray-500 hover:border-gray-200"}`}>
                        <span className={form.type === t ? "text-[#C94F78]" : "text-gray-400"}>{cfg.icon}</span>{t}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Sub Kategori (Kategori di DB) */}
              {form.type === "Treatment Care & Beauty" && (
                <div>
                  <label className="label-form">Sub Kategori (Pilih salah satu)</label>
                  <div className="relative">
                    <select 
                      className="input-form appearance-none" 
                      value={form.category_id} 
                      onChange={e => setForm(f => ({ ...f, category_id: e.target.value }))}
                    >
                      <option value="">-- Pilih Sub Kategori --</option>
                      {categories.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>
              )}

              {/* Produk Set Toggle */}
              <div className="flex items-center justify-between p-3 bg-pink-50 rounded-xl border border-pink-100">
                <div>
                  <p className="text-sm font-bold text-gray-800">Produk Set / Bundle?</p>
                  <p className="text-[10px] text-gray-500 font-medium">Tampilan khusus untuk paket hemat</p>
                </div>
                <button type="button" onClick={() => setForm(f => ({ ...f, is_set: !f.is_set }))}
                  className={`w-10 h-5 rounded-full transition-all relative ${form.is_set ? "bg-[#C94F78]" : "bg-gray-200"}`}>
                  <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${form.is_set ? "left-5" : "left-0.5"}`} />
                </button>
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
