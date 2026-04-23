"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";
import {
  Plus, Search, Edit2, Trash2, X, Loader2, Flower2,
  Package, Sparkles, Upload, Image as ImageIcon,
  Paintbrush2, Eye, Gem, Tag, ChevronDown, Heart,
} from "lucide-react";
import Image from "next/image";

const TYPES = [
  "Treatment Care & Beauty",
  "Product Care & Beauty",
  "Stok Bahan Klinik",
  "Barang Klinik",
] as const;

type TType = typeof TYPES[number];

const TYPE_META: Record<TType, { icon: React.ReactNode; color: string }> = {
  "Treatment Care & Beauty": { icon: <Sparkles className="w-3.5 h-3.5" />, color: "text-purple-500" },
  "Product Care & Beauty":   { icon: <Package className="w-3.5 h-3.5" />, color: "text-rose-400" },
  "Stok Bahan Klinik":       { icon: <Package className="w-3.5 h-3.5" />, color: "text-rose-400" },
  "Barang Klinik":           { icon: <Package className="w-3.5 h-3.5" />, color: "text-blue-400" },
};

const SUB_CATEGORIES: Record<TType, string[]> = {
  "Treatment Care & Beauty": ["eyelash", "breash", "nail art", "eyebrow", "Skin care Clinic"],
  "Product Care & Beauty": ["Produk eyelash", "Produk nail", "Produk eyebrow", "Produk skincare"],
  "Stok Bahan Klinik": ["eyelash", "breash", "nail art", "eyebrow", "Skin care Clinic"],
  "Barang Klinik": ["Alat Medis", "Alat Kantor"],
};

type ProductVariant = {
  id: number; product_id: number; variant_name: string;
  price: number; stock: number; is_active: boolean;
};
type Product = {
  id: number; product_code: string; name: string; type: string;
  purchase_price: number; selling_price: number; stock: number;
  unit: string; image_url: string | null; sub_category?: string | null;
  variants?: ProductVariant[];
};

const emptyForm = {
  product_code: "", name: "", type: "Treatment Care & Beauty" as TType,
  purchase_price: "", selling_price: "", stock: "", unit: "Sesi",
  image_url: "", sub_category: "",
};
const emptyVariantRow = { variant_name: "", price: "", stock: "" };

export default function StokPage() {
  const [products,            setProducts]            = useState<Product[]>([]);
  const [existingSubCats,     setExistingSubCats]     = useState<string[]>([]);
  const [activeTab,           setActiveTab]           = useState<TType>("Treatment Care & Beauty");
  const [search,              setSearch]              = useState("");
  const [loading,             setLoading]             = useState(true);
  const [showModal,           setShowModal]           = useState(false);
  const [editItem,            setEditItem]            = useState<Product | null>(null);
  const [form,                setForm]                = useState(emptyForm);
  const [saving,              setSaving]              = useState(false);
  const [toast,               setToast]               = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Variant state
  const [variants,      setVariants]      = useState<ProductVariant[]>([]);
  const [variantForms,  setVariantForms]  = useState<typeof emptyVariantRow[]>([]);
  const [variantSaving, setVariantSaving] = useState(false);
  const [savedProdId,   setSavedProdId]   = useState<number | null>(null);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

  const fetchData = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("products").select("*, variants:product_variants(*)").order("name");
    setProducts(data || []);
    setExistingSubCats(Array.from(new Set((data || []).map((p: Product) => p.sub_category).filter(Boolean))) as string[]);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const isTreatment = (t: string) => t === "Treatment Care & Beauty";

  const openAdd = () => {
    setEditItem(null); setSavedProdId(null);
    setVariants([]); setVariantForms([]);
    setForm({ ...emptyForm, type: activeTab, unit: isTreatment(activeTab) ? "Sesi" : "Pcs" });
    setShowModal(true);
  };

  const openEdit = (p: Product) => {
    setEditItem(p); setSavedProdId(p.id);
    setVariants(p.variants || []); setVariantForms([]);
    setForm({
      product_code: p.product_code, name: p.name, type: p.type as TType,
      purchase_price: String(p.purchase_price), selling_price: String(p.selling_price),
      stock: String(p.stock), unit: p.unit, image_url: p.image_url || "",
      sub_category: p.sub_category || "",
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false); setEditItem(null);
    setSavedProdId(null); setVariants([]); setVariantForms([]);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { showToast("Maks 2MB"); return; }
    const r = new FileReader();
    r.onloadend = () => setForm(f => ({ ...f, image_url: r.result as string }));
    r.readAsDataURL(file);
  };

  const persistNewVariants = async (pid: number) => {
    const rows = variantForms.filter(v => v.variant_name.trim());
    if (!rows.length) return;
    const { error } = await supabase.from("product_variants").insert(
      rows.map(v => ({ product_id: pid, variant_name: v.variant_name.trim(),
        price: parseFloat(v.price) || 0, stock: parseInt(v.stock) || 0 }))
    );
    if (error) showToast(`Varian: ${error.message}`);
    else setVariantForms([]);
  };

  const handleSave = async () => {
    if (!form.name || !form.product_code) return showToast("Kode & nama wajib diisi");
    setSaving(true);
    try {
      const payload = {
        product_code: form.product_code.trim(), name: form.name.trim(), type: form.type,
        purchase_price: parseFloat(form.purchase_price) || 0,
        selling_price: parseFloat(form.selling_price) || 0,
        stock: parseInt(form.stock) || 0,
        unit: form.unit.trim() || (isTreatment(form.type) ? "Sesi" : "Pcs"),
        image_url: form.image_url || null,
        sub_category: form.sub_category?.trim() || null,
      };
      if (editItem) {
        const { error } = await supabase.from("products").update(payload).eq("id", editItem.id);
        if (error) throw error;
        await persistNewVariants(editItem.id);
      } else {
        const { data, error } = await supabase.from("products").insert(payload).select().single();
        if (error) throw error;
        setSavedProdId(data.id);
        await persistNewVariants(data.id);
      }
      showToast(editItem ? "Perubahan disimpan" : "Produk ditambahkan");
      closeModal(); fetchData();
    } catch (e: any) { showToast(e.message); }
    finally { setSaving(false); }
  };

  const handleSaveVariants = async () => {
    const pid = savedProdId || editItem?.id;
    if (!pid) { showToast("Simpan produk dulu"); return; }
    setVariantSaving(true);
    await persistNewVariants(pid);
    const { data } = await supabase.from("product_variants").select("*").eq("product_id", pid);
    setVariants(data || []);
    setVariantSaving(false);
    showToast("Varian disimpan");
  };

  const handleDeleteVariant = async (id: number) => {
    if (!confirm("Hapus varian ini?")) return;
    await supabase.from("product_variants").delete().eq("id", id);
    setVariants(p => p.filter(v => v.id !== id));
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Hapus produk ini?")) return;
    await supabase.from("products").delete().eq("id", id);
    fetchData();
  };

  const filtered = products.filter(p => p.type === activeTab && p.name.toLowerCase().includes(search.toLowerCase()));
  const meta = (t: string) => TYPE_META[t as TType] ?? TYPE_META["Stok Bahan Klinik"];

  return (
    <div className="h-full flex flex-col bg-[#fdfcfc]">
      {toast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[60] bg-white border border-[#f0ecec]
          shadow-soft px-5 py-2.5 rounded-xl text-[12px] text-[#3d3939] animate-in fade-in slide-in-from-top-4">
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="bg-white px-6 py-4 border-b border-[#f0ecec] shrink-0">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-[15px] font-semibold text-[#2d2820]">Inventori Produk</h2>
            <p className="text-[11px] text-[#a8a4a4] mt-0.5">Kelola stok & layanan klinik LBQueen</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#ccc8c8]" />
              <input type="text" placeholder={`Cari di ${activeTab}...`} value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9 pr-3 py-2 bg-[#fafafa] border border-[#f0ecec] rounded-xl text-[12px]
                  text-[#3d3939] placeholder:text-[#ccc8c8] focus:outline-none focus:border-[#e8719a] transition-colors w-56" />
            </div>
            <button onClick={openAdd}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#d4508a] text-white rounded-xl text-[12px] font-medium hover:bg-[#b83b72] transition-colors shadow-pink">
              <Plus className="w-4 h-4" /> Tambah
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 overflow-x-auto scrollbar-hide pb-0.5">
          {TYPES.map(t => {
            const m = meta(t);
            const active = activeTab === t;
            return (
              <button key={t} onClick={() => setActiveTab(t)}
                className={`flex items-center gap-1.5 whitespace-nowrap px-3 py-1.5 rounded-lg text-[11px] transition-all ${
                  active
                    ? "bg-[#fff0f5] text-[#d4508a] border border-[#ffd6e7] font-medium"
                    : "text-[#a8a4a4] hover:text-[#d4508a] hover:bg-[#fff8fb]"
                }`}>
                <span className={active ? "text-[#d4508a]" : "text-[#d4c8cc]"}>{m.icon}</span>
                {t}
              </button>
            );
          })}
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-auto p-5">
        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 text-[#e8b4c8] animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-[12px] text-[#ccc8c8]">Belum ada produk di kategori ini.</div>
        ) : (
          <>
            {/* Mobile View */}
            <div className="grid grid-cols-1 gap-4 md:hidden pb-16">
              {filtered.map(p => (
                <div key={p.id} className="bg-white rounded-2xl border border-[#f0ecec] p-4 flex flex-col gap-3 shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-xl overflow-hidden bg-[#fff0f5] border border-[#ffd6e7] shrink-0 flex items-center justify-center">
                      {p.image_url
                        ? <Image src={p.image_url} alt={p.name} width={48} height={48} className="object-cover w-full h-full" />
                        : <Flower2 className="w-5 h-5 text-[#f5c0d8]" />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] text-[#3d3939] font-medium leading-tight">{p.name}</p>
                      <div className="flex items-center justify-between mt-1.5">
                        <p className="text-[11px] text-[#ccc8c8] font-mono">{p.product_code}</p>
                        <span className="text-[10px] text-[#a8a4a4] bg-[#f5f2f2] px-2 py-0.5 rounded-md">
                          {p.sub_category || "Umum"}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between py-2 border-y border-[#f5f2f2]">
                    <div>
                      <p className="text-[10px] text-[#a8a4a4] mb-0.5">Harga Jual</p>
                      <p className="text-[13px] font-semibold text-[#d4508a]">Rp {p.selling_price.toLocaleString("id-ID")}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-[#a8a4a4] mb-0.5">Stok</p>
                      <p className="text-[13px] text-[#3d3939] font-medium">{isTreatment(p.type) ? "∞" : p.stock} <span className="text-[10px]">{isTreatment(p.type) ? "sesi" : p.unit}</span></p>
                    </div>
                  </div>
                  
                  {(p.variants?.length ?? 0) > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {p.variants!.map(v => (
                        <span key={v.id} className="text-[10px] text-[#d4508a] bg-[#fff0f5] px-2 py-1 rounded-md flex items-center gap-1 border border-[#ffd6e7]">
                          <Tag className="w-2.5 h-2.5" /> {v.variant_name}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center gap-2 mt-1">
                    <button onClick={() => openEdit(p)} className="flex-1 py-2 bg-[#fafafa] text-[#a8a4a4] hover:text-[#d4508a] hover:bg-[#fff0f5] rounded-xl text-[11px] font-medium border border-[#f0ecec] transition-colors flex items-center justify-center gap-1">
                      <Edit2 className="w-3.5 h-3.5" /> Edit
                    </button>
                    <button onClick={() => handleDelete(p.id)} className="px-4 py-2 bg-rose-50 text-rose-400 hover:bg-rose-100 rounded-xl text-[11px] font-medium transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop View */}
            <div className="hidden md:block bg-white rounded-2xl border border-[#f0ecec] overflow-hidden pb-16 md:pb-0">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-[#f5f2f2] text-[10px] text-[#ccc8c8] capitalize tracking-wider">
                    <th className="px-5 py-3 font-medium">Produk</th>
                    <th className="px-5 py-3 font-medium">Sub Kategori</th>
                    <th className="px-5 py-3 font-medium">Varian</th>
                    <th className="px-5 py-3 font-medium">Harga Modal</th>
                    <th className="px-5 py-3 font-medium">Harga Jual</th>
                    <th className="px-5 py-3 font-medium text-center">Stok</th>
                    <th className="px-5 py-3 font-medium text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#faf8f8]">
                  {filtered.map(p => (
                    <tr key={p.id} className="hover:bg-[#fff8fb] transition-colors group">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl overflow-hidden bg-[#fff0f5] border border-[#ffd6e7] shrink-0 flex items-center justify-center">
                            {p.image_url
                              ? <Image src={p.image_url} alt={p.name} width={40} height={40} className="object-cover w-full h-full" />
                              : <Flower2 className="w-4 h-4 text-[#f5c0d8]" />
                            }
                          </div>
                          <div>
                            <p className="text-[13px] text-[#3d3939] font-medium leading-tight">{p.name}</p>
                            <p className="text-[10px] text-[#ccc8c8] font-mono mt-0.5">{p.product_code}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <span className="text-[10px] text-[#a8a4a4] bg-[#f5f2f2] px-2 py-0.5 rounded-md">
                          {p.sub_category || "Umum"}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        {(p.variants?.length ?? 0) > 0 ? (
                          <div className="flex flex-col gap-0.5">
                            {p.variants!.slice(0, 2).map(v => (
                              <span key={v.id} className="text-[10px] text-[#d4508a] bg-[#fff0f5] px-2 py-0.5 rounded-md flex items-center gap-1 w-fit">
                                <Tag className="w-2.5 h-2.5" /> {v.variant_name}
                              </span>
                            ))}
                            {(p.variants?.length ?? 0) > 2 && (
                              <span className="text-[10px] text-[#ccc8c8]">+{(p.variants?.length ?? 0) - 2} lagi</span>
                            )}
                          </div>
                        ) : <span className="text-[#e5e1e1] text-[12px]">—</span>}
                      </td>
                      <td className="px-5 py-3 text-[12px] text-[#a8a4a4]">Rp {p.purchase_price.toLocaleString("id-ID")}</td>
                      <td className="px-5 py-3 text-[12px] font-medium text-[#d4508a]">Rp {p.selling_price.toLocaleString("id-ID")}</td>
                      <td className="px-5 py-3 text-center text-[12px] text-[#7a7676]">
                        {isTreatment(p.type) ? <span className="text-purple-300 text-[10px]">∞ sesi</span> : `${p.stock} ${p.unit}`}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => openEdit(p)}
                            className="p-1.5 text-[#ccc8c8] hover:text-[#d4508a] hover:bg-[#fff0f5] rounded-lg transition-all">
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => handleDelete(p.id)}
                            className="p-1.5 text-[#ccc8c8] hover:text-rose-400 hover:bg-rose-50 rounded-lg transition-all">
                            <Trash2 className="w-3.5 h-3.5" />
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
      </div>

      {/* ── MODAL ── */}
      {showModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-[2px] z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-xl shadow-soft border border-[#f0ecec] max-h-[92vh] overflow-auto">
            <div className="flex justify-between items-center px-6 py-4 border-b border-[#f5f2f2]">
              <div>
                <p className="text-[14px] font-medium text-[#2d2820]">{editItem ? "Edit Produk" : "Produk Baru"}</p>
                <p className="text-[10px] text-[#ccc8c8] mt-0.5">{form.type}</p>
              </div>
              <button onClick={closeModal} className="text-[#ccc8c8] hover:text-[#3d3939] transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-5">
              {/* Image */}
              <div className="flex justify-center">
                <div className="relative w-24 h-24 rounded-2xl overflow-hidden bg-[#fff0f5] border border-[#ffd6e7]
                  cursor-pointer group" onClick={() => fileInputRef.current?.click()}>
                  {form.image_url
                    ? <Image src={form.image_url} alt="Preview" fill className="object-cover" />
                    : <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-[#f5c0d8]">
                        <Upload className="w-6 h-6" />
                        <span className="text-[9px] text-[#e8b4c8]">Foto</span>
                      </div>
                  }
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <ImageIcon className="w-5 h-5 text-white" />
                  </div>
                </div>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
              </div>

              {/* Type selector */}
              <div>
                <label className="label-form">Tipe Produk</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  {TYPES.map(t => {
                    const m = meta(t);
                    return (
                      <button key={t} type="button"
                        onClick={() => setForm(f => ({ ...f, type: t, unit: isTreatment(t) ? "Sesi" : "Pcs", sub_category: "" }))}
                        className={`flex items-center gap-1.5 px-2.5 py-2 rounded-xl border text-[10px] transition-all ${
                          form.type === t
                            ? "border-[#d4508a] bg-[#fff0f5] text-[#d4508a] font-medium"
                            : "border-[#f0ecec] text-[#a8a4a4] hover:border-[#ffd6e7] hover:text-[#d4508a]"
                        }`}>
                        {m.icon}
                        <span className="truncate">{t}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Code & Sub-cat */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label-form">Kode *</label>
                  <input className="input-form" placeholder="P-001" value={form.product_code}
                    onChange={e => setForm(f => ({ ...f, product_code: e.target.value }))} />
                </div>
                <div>
                  <label className="label-form">Sub Kategori</label>
                  <select className="input-form bg-white" value={form.sub_category} onChange={e => setForm(f => ({ ...f, sub_category: e.target.value }))}>
                    <option value="">-- Pilih --</option>
                    {(SUB_CATEGORIES[form.type as TType] || []).map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Name */}
              <div>
                <label className="label-form">Nama Produk / Layanan *</label>
                <input className="input-form" placeholder="Nama lengkap produk" value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>

              {/* Price */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label-form">Harga Modal (Rp)</label>
                  <input type="number" className="input-form" placeholder="0" value={form.purchase_price}
                    onChange={e => setForm(f => ({ ...f, purchase_price: e.target.value }))} />
                </div>
                <div>
                  <label className="label-form">Harga Jual Default (Rp)</label>
                  <input type="number" className="input-form" placeholder="0" value={form.selling_price}
                    onChange={e => setForm(f => ({ ...f, selling_price: e.target.value }))} />
                </div>
              </div>

              {/* Stock & Unit */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label-form">Stok</label>
                  <input type="number" className="input-form" disabled={isTreatment(form.type)}
                    placeholder="0" value={form.stock} onChange={e => setForm(f => ({ ...f, stock: e.target.value }))} />
                </div>
                <div>
                  <label className="label-form">Satuan</label>
                  <input className="input-form" placeholder="Pcs, Sesi..." value={form.unit}
                    onChange={e => setForm(f => ({ ...f, unit: e.target.value }))} />
                </div>
              </div>

              {/* ── VARIANTS ── */}
              <div className="border-t border-[#f5f2f2] pt-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-[12px] font-medium text-[#3d3939]">Varian Produk</p>
                    <p className="text-[10px] text-[#ccc8c8]">Opsional — setiap varian punya harga sendiri</p>
                  </div>
                  <button type="button" onClick={() => setVariantForms(p => [...p, { ...emptyVariantRow }])}
                    className="flex items-center gap-1 px-3 py-1.5 bg-[#fff0f5] text-[#d4508a] rounded-xl
                      text-[11px] border border-[#ffd6e7] hover:bg-[#ffd6e7] transition-colors">
                    <Plus className="w-3 h-3" /> Varian
                  </button>
                </div>

                {/* Existing */}
                {variants.length > 0 && (
                  <div className="space-y-1.5 mb-3">
                    <p className="text-[10px] text-[#ccc8c8] mb-1.5">Tersimpan</p>
                    {variants.map(v => (
                      <div key={v.id} className="flex items-center gap-3 bg-[#fff8fb] border border-[#ffeef5] rounded-xl px-3 py-2">
                        <Tag className="w-3 h-3 text-[#e8b4c8] shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-[12px] text-[#3d3939] truncate">{v.variant_name}</p>
                          <p className="text-[10px] text-[#d4508a]">Rp {v.price.toLocaleString("id-ID")} · {v.stock} stok</p>
                        </div>
                        <button type="button" onClick={() => handleDeleteVariant(v.id)}
                          className="text-[#e0d8d8] hover:text-rose-400 transition-colors p-1">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* New rows */}
                {variantForms.length > 0 && (
                  <div className="space-y-2">
                    {variantForms.length > 0 && <p className="text-[10px] text-[#ccc8c8]">Baru</p>}
                    {variantForms.map((vf, idx) => (
                      <div key={idx} className="grid grid-cols-[1fr_120px_80px_auto] gap-2 items-end bg-[#fafafa] p-3 rounded-xl border border-[#f0ecec]">
                        <div>
                          <label className="label-form">Nama Varian</label>
                          <input className="input-form text-[12px]" placeholder="cth: Merah, Natural 15mm..." value={vf.variant_name}
                            onChange={e => setVariantForms(p => p.map((v, i) => i === idx ? { ...v, variant_name: e.target.value } : v))} />
                        </div>
                        <div>
                          <label className="label-form">Harga (Rp)</label>
                          <input type="number" className="input-form text-[12px]" placeholder="0" value={vf.price}
                            onChange={e => setVariantForms(p => p.map((v, i) => i === idx ? { ...v, price: e.target.value } : v))} />
                        </div>
                        <div>
                          <label className="label-form">Stok</label>
                          <input type="number" className="input-form text-[12px]" placeholder="0" value={vf.stock}
                            onChange={e => setVariantForms(p => p.map((v, i) => i === idx ? { ...v, stock: e.target.value } : v))} />
                        </div>
                        <button type="button" onClick={() => setVariantForms(p => p.filter((_, i) => i !== idx))}
                          className="text-[#ccc8c8] hover:text-rose-400 transition-colors pb-0.5">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    {editItem && (
                      <button type="button" onClick={handleSaveVariants} disabled={variantSaving}
                        className="w-full py-2 bg-[#fff0f5] text-[#d4508a] text-[11px] border border-[#ffd6e7]
                          rounded-xl hover:bg-[#ffd6e7] transition-colors disabled:opacity-50">
                        {variantSaving ? "Menyimpan..." : "Simpan Varian"}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 px-6 py-4 border-t border-[#f5f2f2]">
              <button onClick={closeModal}
                className="flex-1 py-2.5 border border-[#f0ecec] rounded-xl text-[12px] text-[#a8a4a4] hover:bg-[#fafafa] transition-colors">
                Batal
              </button>
              <button onClick={handleSave} disabled={saving}
                className="flex-1 py-2.5 bg-[#d4508a] text-white rounded-xl text-[12px] font-medium
                  hover:bg-[#b83b72] transition-colors shadow-pink disabled:opacity-50">
                {saving ? "Menyimpan..." : (editItem ? "Simpan Perubahan" : "Simpan Produk")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
