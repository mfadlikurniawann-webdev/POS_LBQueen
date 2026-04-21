"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { Plus, Search, Edit2, Trash2, X, Loader2, Flower2, Package, Sparkles, ChevronDown, Upload, Image as ImageIcon, Check } from "lucide-react";
import Image from "next/image";

const TYPES = ["Treatment Care & Beauty", "Product Care & Beauty", "Barang Kantor", "Aset Karyawan", "Treatment", "Retail Produk"] as const;

const typeConfig: Record<string, { color: string; bg: string; icon: React.ReactNode }> = {
  "Treatment Care & Beauty": { color: "text-purple-600",  bg: "bg-purple-50",  icon: <Sparkles className="w-4 h-4" /> },
  "Product Care & Beauty":   { color: "text-pink-600",    bg: "bg-pink-50",    icon: <Package className="w-4 h-4" /> },
  "Treatment":               { color: "text-purple-500",  bg: "bg-gray-50",    icon: <Flower2 className="w-4 h-4" /> },
  "Retail Produk":           { color: "text-pink-500",    bg: "bg-gray-50",    icon: <Package className="w-4 h-4" /> },
  "Barang Kantor":           { color: "text-blue-600",    bg: "bg-blue-50",    icon: <Package className="w-4 h-4" /> },
  "Aset Karyawan":           { color: "text-amber-600",   bg: "bg-amber-50",   icon: <Package className="w-4 h-4" /> },
};

type Product = {
  id: number; product_code: string; name: string; type: string;
  purchase_price: number; selling_price: number; stock: number;
  unit: string; image_url: string | null; is_set: boolean;
  category_id: number | null;
  sub_category?: string | null;
};

type Category = { id: number; name: string };

const emptyForm = {
  product_code: "", name: "", type: "Treatment Care & Beauty",
  purchase_price: "", selling_price: "", stock: "", unit: "Sesi", image_url: "", is_set: false,
  category_id: "" as string | number,
  sub_category: "",
};

export default function StokPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [existingSubCategories, setExistingSubCategories] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState("Treatment Care & Beauty");
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
    const [{ data: pData }, { data: cData }] = await Promise.all([
      supabase.from("products").select("*").order("name"),
      supabase.from("categories").select("*").order("name"),
    ]);
    
    setProducts(pData || []);
    setCategories(cData || []);
    
    // Extract unique sub_categories from products
    const subs = Array.from(new Set((pData || []).map(p => p.sub_category).filter(Boolean))) as string[];
    setExistingSubCategories(subs);
    
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openAdd = () => {
    setEditItem(null);
    setForm({ ...emptyForm, type: activeTab, unit: activeTab.includes("Treatment") ? "Sesi" : "Pcs" });
    setShowModal(true);
  };

  const openEdit = (p: Product) => {
    setEditItem(p);
    setForm({
      product_code: p.product_code, name: p.name, type: p.type,
      purchase_price: String(p.purchase_price), selling_price: String(p.selling_price),
      stock: String(p.stock), unit: p.unit, image_url: p.image_url || "", is_set: p.is_set || false,
      category_id: p.category_id || "",
      sub_category: p.sub_category || "",
    });
    setShowModal(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) { // 2MB Limit
      showToast("Gagal: Ukuran file maksimal 2MB");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setForm(f => ({ ...f, image_url: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!form.name || !form.product_code) { 
      showToast("Gagal: Kode dan Nama produk wajib diisi!"); 
      return; 
    }
    
    setSaving(true);
    try {
      const payload: any = {
        product_code: form.product_code.trim(),
        name: form.name.trim(),
        type: form.type,
        purchase_price: parseFloat(form.purchase_price) || 0,
        selling_price: parseFloat(form.selling_price) || 0,
        stock: parseInt(form.stock) || 0,
        unit: form.unit.trim() || (form.type.includes("Treatment") ? "Sesi" : "Pcs"),
        image_url: form.image_url || null,
        is_set: form.is_set,
        category_id: form.category_id ? Number(form.category_id) : null,
        sub_category: form.sub_category?.trim() || null,
      };

      let result;
      if (editItem) {
        result = await supabase.from("products").update(payload).eq("id", editItem.id);
      } else {
        result = await supabase.from("products").insert(payload);
      }

      if (result.error) {
        showToast(`Gagal: ${result.error.message}`);
        setSaving(false); return;
      }

      showToast(editItem ? "Produk diperbarui!" : "Produk baru ditambahkan!");
      setSaving(false); setShowModal(false); fetchData();
    } catch (err: any) {
      showToast("Terjadi kesalahan sistem.");
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
    <div className="h-full flex flex-col bg-gray-50/30 overflow-hidden font-sans">
      {toast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[999] bg-gray-900 text-white px-6 py-3 rounded-2xl text-xs font-bold shadow-2xl animate-in fade-in slide-in-from-top-4 uppercase tracking-widest">{toast}</div>
      )}

      {/* Tabs Layout */}
      <div className="bg-white border-b border-gray-100 px-6 flex items-center justify-between gap-4 shrink-0">
        <div className="flex gap-1 overflow-x-auto scrollbar-hide py-3">
          {TYPES.map(type => {
            const cfg = typeConfig[type];
            const active = activeTab === type;
            return (
              <button key={type} onClick={() => setActiveTab(type)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all whitespace-nowrap border ${
                  active 
                    ? "bg-[#A83E60] text-white border-[#A83E60] shadow-md shadow-pink-100" 
                    : "bg-white text-gray-400 border-transparent hover:bg-gray-50 hover:text-gray-600"
                }`}>
                {type}
              </button>
            );
          })}
        </div>
        <button onClick={openAdd}
          className="bg-[#A83E60] hover:bg-[#C94F78] text-white font-bold px-5 py-2 rounded-xl flex items-center gap-2 text-[10px] uppercase tracking-widest transition-all shadow-lg shadow-pink-100">
          <Plus className="w-4 h-4" /> Tambah
        </button>
      </div>

      {/* Toolbar */}
      <div className="px-6 py-4 flex items-center justify-between bg-white/50 backdrop-blur-sm border-b border-gray-100">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder={`Cari ${activeTab}...`} value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 bg-white border border-gray-100 rounded-2xl text-xs font-semibold focus:border-[#A83E60] focus:ring-4 focus:ring-pink-50 outline-none transition-all shadow-sm" />
        </div>
        <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest flex items-center gap-2">
           <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
           {filtered.length} Data Terkunci
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-auto p-6">
        {loading ? (
          <div className="h-full flex items-center justify-center"><Loader2 className="w-8 h-8 text-[#A83E60] animate-spin opacity-20" /></div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-24">
            {filtered.map(p => (
              <div key={p.id} className="bg-white rounded-[32px] border border-gray-100/80 p-5 shadow-premium hover:shadow-xl hover:border-pink-100 transition-all group relative">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-20 h-20 rounded-3xl bg-pink-50 border border-pink-100/50 flex items-center justify-center shrink-0 overflow-hidden relative group-hover:scale-[1.02] transition-transform">
                    {p.image_url ? (
                      <Image src={p.image_url} alt={p.name} width={80} height={80} className="object-cover w-full h-full" />
                    ) : (
                      <ImageIcon className="w-8 h-8 text-pink-200" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                      <span className="text-[9px] font-black uppercase text-[#A83E60] tracking-wider truncate max-w-[100px]">{p.sub_category || "General"}</span>
                      {p.is_set && <span className="bg-emerald-500 text-white text-[7px] font-black px-1.5 py-0.5 rounded-full uppercase">Bundle</span>}
                    </div>
                    <h4 className="font-bold text-gray-800 text-sm leading-snug line-clamp-2 mb-1">{p.name}</h4>
                    <p className="text-[10px] text-gray-400 font-mono uppercase tracking-tighter">{p.product_code}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                  <div>
                    <p className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter">Harga Jual</p>
                    <p className="text-sm font-black text-[#A83E60]">Rp {p.selling_price.toLocaleString("id-ID")}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter">Stok</p>
                    <p className="text-xs font-bold text-gray-700">{p.type === "Treatment" ? "∞" : p.stock} <span className="text-[10px]">{p.unit}</span></p>
                  </div>
                </div>

                {/* Hover Actions */}
                <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openEdit(p)} className="p-2 bg-white shadow-lg rounded-xl text-gray-400 hover:text-[#A83E60] border border-gray-100">
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => handleDelete(p.id)} className="p-2 bg-white shadow-lg rounded-xl text-gray-400 hover:text-red-500 border border-gray-100">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Form */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[40px] p-8 w-full max-w-xl shadow-2xl max-h-[90vh] overflow-auto animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h3 className="text-2xl font-black text-gray-900 leading-none">{editItem ? "Edit Produk" : "Tambah Produk"}</h3>
                <p className="text-xs text-gray-400 font-medium mt-2 uppercase tracking-widest">{form.type}</p>
              </div>
              <button onClick={() => setShowModal(false)} className="w-10 h-10 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400 hover:text-gray-900 transition-colors"><X className="w-5 h-5" /></button>
            </div>

            <div className="space-y-6">
              {/* Image Upload Area */}
              <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-100 rounded-[32px] bg-gray-50/50 hover:border-[#A83E60]/30 transition-all cursor-pointer relative overflow-hidden group"
                onClick={() => fileInputRef.current?.click()}>
                {form.image_url ? (
                  <div className="relative w-32 h-32 rounded-3xl overflow-hidden shadow-xl border-4 border-white">
                    <Image src={form.image_url} alt="Preview" width={128} height={128} className="object-cover w-full h-full" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <Upload className="w-6 h-6 text-white" />
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <div className="w-16 h-16 rounded-2xl bg-white shadow-sm flex items-center justify-center mb-3">
                      <Upload className="w-6 h-6 text-gray-300" />
                    </div>
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest text-center">Klik untuk upload foto <br /><span className="text-[9px] font-medium">(PNG/JPG, Max 2MB)</span></p>
                  </div>
                )}
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="label-form">Kode Produk *</label>
                  <input className="input-form" placeholder="TRT-001" value={form.product_code} onChange={e => setForm(f => ({ ...f, product_code: e.target.value }))} />
                </div>
                <div>
                  <label className="label-form">Sub Kategori</label>
                  <div className="relative">
                    <input className="input-form" list="sub-cats" placeholder="Ketik baru / pilih..." value={form.sub_category} onChange={e => setForm(f => ({ ...f, sub_category: e.target.value }))} />
                    <datalist id="sub-cats">
                      {existingSubCategories.map(s => <option key={s} value={s} />)}
                    </datalist>
                  </div>
                </div>
              </div>

              <div>
                <label className="label-form">Nama Produk / Layanan *</label>
                <input className="input-form" placeholder="Masukkan nama item..." value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="label-form">Harga Modal (Rp)</label>
                  <input type="number" className="input-form" placeholder="0" value={form.purchase_price} onChange={e => setForm(f => ({ ...f, purchase_price: e.target.value }))} />
                </div>
                <div>
                  <label className="label-form">Harga Jual (Rp)</label>
                  <input type="number" className="input-form font-bold text-[#A83E60]" placeholder="0" value={form.selling_price} onChange={e => setForm(f => ({ ...f, selling_price: e.target.value }))} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="label-form">Stok Tersedia</label>
                  <input type="number" className="input-form disabled:opacity-30" disabled={form.type === "Treatment"} placeholder="0" value={form.stock} onChange={e => setForm(f => ({ ...f, stock: e.target.value }))} />
                </div>
                <div>
                  <label className="label-form">Satuan Unit</label>
                  <input className="input-form" placeholder="Pcs, Sesi, Tabung..." value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))} />
                </div>
              </div>

              {/* Bundle Toggle */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-3xl border border-gray-100">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl ${form.is_set ? "bg-emerald-100 text-emerald-600" : "bg-gray-200 text-gray-400"}`}>
                    <Check className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-800 uppercase tracking-tighter">Produk Set / Bundle?</p>
                    <p className="text-[10px] text-gray-400">Tampilkan label khusus di kasir</p>
                  </div>
                </div>
                <button type="button" onClick={() => setForm(f => ({ ...f, is_set: !f.is_set }))}
                  className={`w-12 h-6 rounded-full transition-all relative ${form.is_set ? "bg-emerald-500" : "bg-gray-300"}`}>
                  <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${form.is_set ? "left-7" : "left-1"}`} />
                </button>
              </div>
            </div>

            <div className="flex gap-4 mt-10">
              <button onClick={() => setShowModal(false)} className="flex-1 py-4 border border-gray-100 rounded-[20px] font-bold text-gray-400 hover:bg-gray-50 transition-colors uppercase text-[11px] tracking-widest">Batal</button>
              <button onClick={handleSave} disabled={saving}
                className="flex-1 py-4 bg-[#A83E60] hover:bg-[#C94F78] text-white font-bold rounded-[20px] flex items-center justify-center gap-2 transition-all shadow-lg shadow-pink-100 disabled:opacity-50 uppercase text-[11px] tracking-widest">
                {saving ? "Menyimpan..." : (editItem ? "Simpan Perubahan" : "Terbitkan Produk")}
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        .label-form { display: block; font-size: 10px; font-weight: 800; color: #9CA3AF; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 8px; margin-left: 4px; }
        .input-form { width: 100%; padding: 14px 20px; border: 1px solid #F3F4F6; border-radius: 18px; font-size: 13px; font-weight: 600; color: #1F2937; transition: all 0.2s; outline: none; background: #F9FAFB; }
        .input-form:focus { border-color: #A83E60; background: white; box-shadow: 0 0 0 4px rgba(168,62,96,0.05); }
        .shadow-premium { box-shadow: 0 2px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.02); }
      `}</style>
    </div>
  );
}

