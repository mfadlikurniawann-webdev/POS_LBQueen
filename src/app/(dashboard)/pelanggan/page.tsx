"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { Plus, Search, X, Loader2, Users, Tag, Crown, Phone, Star } from "lucide-react";
import PageHeader from "@/components/PageHeader";

type Customer = { id: number; name: string; phone: string; is_member: boolean; join_date: string };
type Voucher = { id: number; code: string; name: string; discount_amount: number; min_purchase: number; is_active: boolean };

const emptyCustomer = { name: "", phone: "", is_member: false };
const emptyVoucher = { code: "", name: "", discount_amount: "", min_purchase: "" };

export default function PelangganPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"pelanggan" | "voucher">("pelanggan");

  // Modal States
  const [showCustModal, setShowCustModal] = useState(false);
  const [showVouchModal, setShowVouchModal] = useState(false);
  const [custForm, setCustForm] = useState(emptyCustomer);
  const [vouchForm, setVouchForm] = useState(emptyVoucher);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const [{ data: custs }, { data: vouchs }] = await Promise.all([
      supabase.from("customers").select("*").order("name"),
      supabase.from("vouchers").select("*").order("created_at", { ascending: false }),
    ]);
    setCustomers(custs || []);
    setVouchers(vouchs || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const saveCust = async () => {
    if (!custForm.name) { showToast("Nama wajib diisi!"); return; }
    setSaving(true);
    await supabase.from("customers").insert({ ...custForm });
    showToast("Pelanggan baru ditambahkan! 🎉");
    setSaving(false); setShowCustModal(false); setCustForm(emptyCustomer); fetchAll();
  };

  const toggleMember = async (id: number, current: boolean) => {
    await supabase.from("customers").update({ is_member: !current }).eq("id", id);
    showToast(!current ? "Status Member diaktifkan ✦" : "Status Member dinonaktifkan");
    fetchAll();
  };

  const saveVoucher = async () => {
    if (!vouchForm.code || !vouchForm.name) { showToast("Kode dan nama voucher wajib diisi!"); return; }
    setSaving(true);
    const { error } = await supabase.from("vouchers").insert({
      code: vouchForm.code, name: vouchForm.name,
      discount_amount: parseFloat(vouchForm.discount_amount) || 0,
      min_purchase: parseFloat(vouchForm.min_purchase) || 0,
    });
    if (error) { showToast("Kode voucher sudah ada!"); setSaving(false); return; }
    showToast("Voucher baru berhasil dibuat! 🎟️");
    setSaving(false); setShowVouchModal(false); setVouchForm(emptyVoucher); fetchAll();
  };

  const toggleVoucher = async (id: number, current: boolean) => {
    await supabase.from("vouchers").update({ is_active: !current }).eq("id", id);
    showToast(!current ? "Voucher diaktifkan" : "Voucher dinonaktifkan");
    fetchAll();
  };

  const filteredCusts = customers.filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || c.phone?.includes(search));

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {toast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[999] bg-gray-900 text-white px-6 py-3 rounded-2xl text-sm font-semibold shadow-2xl">{toast}</div>
      )}

      {/* Header */}
      <PageHeader title="Pelanggan & Membership" icon={<Users className="w-6 h-6" />} />

      {/* Sub-header with button */}
      <div className="bg-white border-b border-gray-100 px-6 py-3 shrink-0">
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm text-gray-400">Kelola database pelanggan dan voucher diskon eksklusif</p>
          <button
            onClick={() => tab === "pelanggan" ? setShowCustModal(true) : setShowVouchModal(true)}
            className="bg-[#C94F78] hover:bg-[#A83E60] text-white font-bold px-5 py-2.5 rounded-xl flex items-center gap-2 text-sm shadow-lg shadow-pink-200 transition-all shrink-0">
            <Plus className="w-4 h-4" /> {tab === "pelanggan" ? "Pelanggan Baru" : "Buat Voucher"}
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mt-5">
          {[
            { label: "Total Pelanggan", value: customers.length, icon: <Users className="w-5 h-5" />, color: "text-blue-500 bg-blue-50" },
            { label: "Member Aktif", value: customers.filter(c => c.is_member).length, icon: <Crown className="w-5 h-5" />, color: "text-amber-500 bg-amber-50" },
            { label: "Voucher Aktif", value: vouchers.filter(v => v.is_active).length, icon: <Tag className="w-5 h-5" />, color: "text-[#C94F78] bg-pink-50" },
          ].map(s => (
            <div key={s.label} className="bg-white border border-gray-100 rounded-2xl p-4 flex items-center gap-3 shadow-sm">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.color}`}>{s.icon}</div>
              <div>
                <p className="text-2xl font-extrabold text-gray-900">{s.value}</p>
                <p className="text-xs text-gray-400 font-semibold">{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mt-5 bg-gray-100 rounded-xl p-1 w-fit">
          {(["pelanggan", "voucher"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-5 py-2 rounded-lg text-sm font-bold capitalize transition-all ${tab === t ? "bg-white shadow text-gray-900" : "text-gray-500 hover:text-gray-700"}`}>
              {t === "pelanggan" ? "Database Pelanggan" : "Voucher & Diskon"}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {tab === "pelanggan" ? (
          <>
            <div className="relative mb-4 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari nama atau nomor HP..."
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-pink-100 focus:border-pink-300 outline-none" />
            </div>

            {loading ? (
              <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-pink-300 animate-spin" /></div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <table className="w-full text-sm min-w-[500px]">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr className="text-xs font-extrabold text-gray-500 uppercase tracking-wider">
                      <th className="px-6 py-4 text-left">Nama</th>
                      <th className="px-6 py-4 text-left">No. HP</th>
                      <th className="px-6 py-4 text-center">Status</th>
                      <th className="px-6 py-4 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filteredCusts.map(c => (
                      <tr key={c.id} className="hover:bg-pink-50/30 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-white text-sm shrink-0 ${c.is_member ? "bg-gradient-to-br from-amber-400 to-orange-500" : "bg-gradient-to-br from-gray-300 to-gray-400"}`}>
                              {c.name.charAt(0)}
                            </div>
                            <span className="font-bold text-gray-800">{c.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-500 flex items-center gap-2"><Phone className="w-3.5 h-3.5 text-gray-300" />{c.phone || "-"}</td>
                        <td className="px-6 py-4 text-center">
                          {c.is_member
                            ? <span className="bg-amber-100 text-amber-700 text-xs font-extrabold px-3 py-1 rounded-full inline-flex items-center gap-1"><Crown className="w-3 h-3"/>Member</span>
                            : <span className="bg-gray-100 text-gray-500 text-xs font-bold px-3 py-1 rounded-full">Reguler</span>
                          }
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button onClick={() => toggleMember(c.id, c.is_member)}
                            className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all ${c.is_member ? "bg-gray-100 text-gray-600 hover:bg-red-50 hover:text-red-500" : "bg-amber-50 text-amber-600 hover:bg-amber-100"}`}>
                            {c.is_member ? "Cabut Member" : "Jadikan Member"}
                          </button>
                        </td>
                      </tr>
                    ))}
                    {filteredCusts.length === 0 && !loading && (
                      <tr><td colSpan={4} className="text-center py-10 text-gray-400">Belum ada pelanggan terdaftar.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {vouchers.map(v => (
              <div key={v.id} className={`bg-white border rounded-2xl p-5 shadow-sm relative overflow-hidden transition-all ${v.is_active ? "border-pink-100" : "border-gray-100 opacity-60"}`}>
                {/* Rose dekorasi sudut */}
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-pink-50 to-transparent -z-0 rounded-bl-full" />
                <Star className={`absolute top-4 right-4 w-4 h-4 ${v.is_active ? "text-amber-300" : "text-gray-200"}`} />

                <div className="relative z-10">
                  <p className="text-xs font-extrabold text-gray-400 tracking-widest uppercase mb-1">Kode Voucher</p>
                  <h3 className="font-extrabold text-2xl text-gray-900 tracking-tight">{v.code}</h3>
                  <p className="text-sm text-gray-500 mt-1">{v.name}</p>

                  <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-end">
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Potongan</p>
                      <p className="font-extrabold text-[#C94F78] text-xl">Rp {v.discount_amount.toLocaleString("id-ID")}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Min. Beli</p>
                      <p className="font-bold text-gray-700 text-sm">Rp {v.min_purchase.toLocaleString("id-ID")}</p>
                    </div>
                  </div>

                  <button onClick={() => toggleVoucher(v.id, v.is_active)}
                    className={`w-full mt-4 py-2 rounded-xl text-xs font-bold transition-all ${v.is_active ? "bg-gray-100 text-gray-500 hover:bg-red-50 hover:text-red-500" : "bg-pink-50 text-[#C94F78] hover:bg-pink-100"}`}>
                    {v.is_active ? "Nonaktifkan" : "Aktifkan Kembali"}
                  </button>
                </div>
              </div>
            ))}
            {!loading && vouchers.length === 0 && (
              <div className="col-span-3 text-center py-16 text-gray-400">
                <Tag className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p>Belum ada voucher. Buat voucher pertama Anda!</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal Pelanggan */}
      {showCustModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => !saving && setShowCustModal(false)}>
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-xl font-extrabold">Tambah Pelanggan</h3>
              <button onClick={() => setShowCustModal(false)}><X className="text-gray-400" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="label-form">Nama Lengkap *</label>
                <input className="input-form" placeholder="Nama pelanggan" value={custForm.name} onChange={e => setCustForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div>
                <label className="label-form">Nomor HP / WhatsApp</label>
                <input className="input-form" placeholder="0812..." value={custForm.phone} onChange={e => setCustForm(f => ({ ...f, phone: e.target.value }))} />
              </div>
              <div className="flex items-center justify-between p-4 bg-amber-50 border border-amber-100 rounded-xl">
                <div className="flex items-center gap-2">
                  <Crown className="w-5 h-5 text-amber-500" />
                  <div>
                    <p className="font-bold text-sm text-gray-800">Daftarkan sebagai Member?</p>
                    <p className="text-xs text-gray-400">Member mendapat akses voucher eksklusif</p>
                  </div>
                </div>
                <button onClick={() => setCustForm(f => ({ ...f, is_member: !f.is_member }))}
                  className={`w-11 h-6 rounded-full transition-all relative ${custForm.is_member ? "bg-amber-400" : "bg-gray-200"}`}>
                  <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${custForm.is_member ? "left-5" : "left-0.5"}`} />
                </button>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowCustModal(false)} className="flex-1 py-3 border-2 border-gray-200 rounded-xl font-bold text-gray-600">Batal</button>
              <button onClick={saveCust} disabled={saving} className="flex-1 py-3 bg-[#C94F78] text-white font-bold rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 hover:bg-[#A83E60] transition-all">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null} {saving ? "Menyimpan..." : "Simpan"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Voucher */}
      {showVouchModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => !saving && setShowVouchModal(false)}>
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-xl font-extrabold">Buat Voucher Baru</h3>
              <button onClick={() => setShowVouchModal(false)}><X className="text-gray-400" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="label-form">Kode Voucher *</label>
                <input className="input-form uppercase" placeholder="e.g. MEMBER100" value={vouchForm.code} onChange={e => setVouchForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} />
              </div>
              <div>
                <label className="label-form">Nama / Deskripsi</label>
                <input className="input-form" placeholder="Diskon spesial member" value={vouchForm.name} onChange={e => setVouchForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label-form">Potongan (Rp)</label>
                  <input type="number" className="input-form" placeholder="50000" value={vouchForm.discount_amount} onChange={e => setVouchForm(f => ({ ...f, discount_amount: e.target.value }))} />
                </div>
                <div>
                  <label className="label-form">Min. Pembelian</label>
                  <input type="number" className="input-form" placeholder="200000" value={vouchForm.min_purchase} onChange={e => setVouchForm(f => ({ ...f, min_purchase: e.target.value }))} />
                </div>
              </div>
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-xs text-blue-600">
                <p>💡 Voucher ini hanya bisa dipakai pelanggan <strong>Member</strong> di Terminal Kasir.</p>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowVouchModal(false)} className="flex-1 py-3 border-2 border-gray-200 rounded-xl font-bold text-gray-600">Batal</button>
              <button onClick={saveVoucher} disabled={saving} className="flex-1 py-3 bg-[#C94F78] text-white font-bold rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 hover:bg-[#A83E60] transition-all">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null} {saving ? "Menyimpan..." : "Buat Voucher"}
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        .label-form { display: block; font-size: 11px; font-weight: 700; color: #6B7280; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 6px; }
        .input-form { width: 100%; padding: 10px 14px; border: 2px solid #F3F4F6; border-radius: 12px; font-size: 14px; font-weight: 500; color: #111827; transition: all 0.2s; outline: none; }
        .input-form:focus { border-color: #C94F78; box-shadow: 0 0 0 3px rgba(201,79,120,0.1); }
      `}</style>
    </div>
  );
}
