"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import {
  Plus, Search, X, Loader2, Users, Tag, Crown, Phone, Star,
  Key, MessageCircle, Clock, CheckCircle2, XCircle
} from "lucide-react";

type Customer = {
  id: number; name: string; phone: string; is_member: boolean; join_date: string;
  username: string | null; password_plain: string | null;
};
type Voucher = {
  id: number; code: string; name: string; discount_amount: number;
  min_purchase: number; is_active: boolean; product_id: number | null;
  products?: { name: string } | null;
};
type CustomerOrder = {
  id: number; customer_name: string; product_name: string;
  ordered_at: string; status: string;
  customers: { name: string } | null;
};

const emptyCustomer = { name: "", phone: "", is_member: false };
const emptyVoucher  = { code: "", name: "", discount_amount: "", min_purchase: "", product_id: "" };

/** Buat inisial dari nama: "Sri Wahyuni" → "SW" */
function getInitials(name: string): string {
  return name.trim().split(/\s+/).map(w => w[0]?.toUpperCase() ?? "").join("");
}

/** Generate password plain: inisial + status (M/R) + id → "SW-M-5" */
function generatePasswordPlain(name: string, isMember: boolean, id: number): string {
  return `${getInitials(name)}-${isMember ? "M" : "R"}-${id}`;
}

/** Generate username: lowercase nama tanpa spasi → "sriwahyuni" */
function generateUsername(name: string): string {
  return name.toLowerCase().replace(/\s+/g, "");
}

/** Hash password: base64 dari plain text (simple hash untuk demo) */
function hashPassword(plain: string): string {
  if (typeof window !== "undefined") return btoa(plain);
  return Buffer.from(plain).toString("base64");
}

const STATUS_CONFIG: Record<string, { label: string; color: string; Icon: React.ElementType }> = {
  pending:   { label: "Menunggu",    color: "bg-yellow-100 text-yellow-700", Icon: Clock          },
  confirmed: { label: "Dikonfirmasi",color: "bg-green-100 text-green-700",  Icon: CheckCircle2   },
  cancelled: { label: "Dibatalkan",  color: "bg-red-100 text-red-600",      Icon: XCircle        },
};

export default function PelangganPage() {
  const [customers, setCustomers]   = useState<Customer[]>([]);
  const [vouchers, setVouchers]     = useState<Voucher[]>([]);
  const [orders, setOrders]         = useState<CustomerOrder[]>([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState("");
  const [tab, setTab]               = useState<"pelanggan" | "voucher" | "pesanan">("pelanggan");

  const [showCustModal, setShowCustModal] = useState(false);
  const [showVouchModal, setShowVouchModal] = useState(false);
  const [custForm, setCustForm]     = useState(emptyCustomer);
  const [vouchForm, setVouchForm]   = useState(emptyVoucher);
  const [products, setProducts]       = useState<any[]>([]);
  const [saving, setSaving]         = useState(false);
  const [toast, setToast]           = useState("");

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 3500); };

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const [{ data: custs }, { data: vouchs }, { data: ords }, { data: prods }] = await Promise.all([
      supabase.from("customers").select("*").order("name"),
      supabase.from("vouchers").select("*, products(name)").order("created_at", { ascending: false }),
      supabase.from("customer_orders").select("*, customers(name)").order("ordered_at", { ascending: false }).limit(100),
      supabase.from("products").select("id, name").in("type", ["Treatment", "Retail Produk"]).order("name"),
    ]);
    setCustomers(custs || []);
    setVouchers(vouchs || []);
    setOrders((ords as CustomerOrder[]) || []);
    setProducts(prods || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const saveCust = async () => {
    if (!custForm.name) { showToast("Nama wajib diisi!"); return; }
    setSaving(true);

    // Insert dulu untuk dapat ID
    const { data: inserted, error } = await supabase
      .from("customers")
      .insert({ name: custForm.name, phone: custForm.phone, is_member: custForm.is_member })
      .select()
      .single();

    if (error || !inserted) {
      showToast("Gagal menyimpan pelanggan!"); setSaving(false); return;
    }

    // Generate username & password berdasarkan ID yang baru didapat
    const username      = generateUsername(custForm.name);
    const passwordPlain = generatePasswordPlain(custForm.name, custForm.is_member, inserted.id);
    const passwordHash  = hashPassword(passwordPlain);

    await supabase.from("customers").update({ username, password_plain: passwordPlain, password_hash: passwordHash }).eq("id", inserted.id);

    showToast("Pelanggan baru ditambahkan!");
    setSaving(false); setShowCustModal(false); setCustForm(emptyCustomer); fetchAll();
  };

  const toggleMember = async (c: Customer) => {
    const newMember = !c.is_member;
    // Update status member
    await supabase.from("customers").update({ is_member: newMember }).eq("id", c.id);
    // Regenerate password karena status berubah (M/R berubah)
    const newPlain = generatePasswordPlain(c.name, newMember, c.id);
    const newHash  = hashPassword(newPlain);
    await supabase.from("customers").update({ password_plain: newPlain, password_hash: newHash }).eq("id", c.id);
    showToast(newMember ? "Status Member diaktifkan ✦ (Password diperbarui)" : "Status Member dinonaktifkan (Password diperbarui)");
    fetchAll();
  };

  const saveVoucher = async () => {
    if (!vouchForm.code || !vouchForm.name || !vouchForm.product_id) { 
      showToast("Kode, nama, dan produk wajib diisi!"); 
      return; 
    }
    setSaving(true);
    const { error } = await supabase.from("vouchers").insert({
      code: vouchForm.code, 
      name: vouchForm.name,
      discount_amount: parseFloat(vouchForm.discount_amount) || 0,
      min_purchase: parseFloat(vouchForm.min_purchase) || 0,
      product_id: parseInt(vouchForm.product_id)
    });
    if (error) { showToast("Kode voucher sudah ada!"); setSaving(false); return; }
    showToast("Voucher baru berhasil dibuat!");
    setSaving(false); setShowVouchModal(false); setVouchForm(emptyVoucher); fetchAll();
  };

  const toggleVoucher = async (id: number, current: boolean) => {
    await supabase.from("vouchers").update({ is_active: !current }).eq("id", id);
    showToast(!current ? "Voucher diaktifkan" : "Voucher dinonaktifkan");
    fetchAll();
  };

  const updateOrderStatus = async (id: number, status: string) => {
    await supabase.from("customer_orders").update({ status }).eq("id", id);
    showToast(status === "confirmed" ? "Pesanan dikonfirmasi ✓" : "Pesanan dibatalkan");
    fetchAll();
  };

  const filteredCusts = customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) || c.phone?.includes(search)
  );

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {toast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[999] bg-gray-900 text-white px-6 py-3 rounded-2xl text-sm font-semibold shadow-2xl animate-bounce-once">
          {toast}
        </div>
      )}

      {/* Stats Board */}
      <div className="px-6 py-5 grid grid-cols-2 md:grid-cols-4 gap-4 shrink-0">
        {[
          { label: "Total Pelanggan", value: customers.length, icon: <Users className="w-5 h-5" />, color: "from-blue-400 to-blue-600" },
          { label: "Member Aktif", value: customers.filter(c => c.is_member).length, icon: <Crown className="w-5 h-5" />, color: "from-amber-400 to-orange-500" },
          { label: "Voucher Aktif", value: vouchers.filter(v => v.is_active).length, icon: <Tag className="w-5 h-5" />, color: "from-lb-rose to-lb-rose-dark" },
          { label: "Pesanan Masuk", value: orders.filter(o => o.status === "pending").length, icon: <MessageCircle className="w-5 h-5" />, color: "from-emerald-400 to-emerald-600" },
        ].map(s => (
          <div key={s.label} className={`bg-gradient-to-br ${s.color} text-white p-4 rounded-3xl shadow-premium border border-white/10 relative overflow-hidden group`}>
            <div className="absolute top-0 right-0 w-16 h-16 bg-white/10 rounded-bl-full transition-transform group-hover:scale-110" />
            <div className="relative z-10 flex items-start justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-white/70 mb-1">{s.label}</p>
                <p className="text-2xl font-black">{s.value}</p>
              </div>
              <div className="bg-white/20 p-2 rounded-2xl backdrop-blur-sm">{s.icon}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Toolbar: Tabs + Action */}
      <div className="bg-white border-b border-rose-50 px-6 py-2 flex items-center justify-between gap-4 shrink-0 overflow-hidden">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide py-1">
          {([
            { key: "pelanggan", label: "Pelanggan" },
            { key: "voucher", label: "Voucher" },
            { key: "pesanan", label: `Pesanan${orders.filter(o => o.status === "pending").length > 0 ? ` (${orders.filter(o => o.status === "pending").length})` : ""}` },
          ] as const).map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`px-6 py-2 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all whitespace-nowrap border-2 ${
                tab === t.key 
                  ? "bg-lb-rose text-white border-lb-rose shadow-lg shadow-rose-200 scale-[1.03]" 
                  : "bg-white text-gray-400 border-gray-100 hover:border-gray-200"
              }`}>
              {t.label}
            </button>
          ))}
        </div>
        {tab !== "pesanan" && (
          <button
            onClick={() => tab === "pelanggan" ? setShowCustModal(true) : setShowVouchModal(true)}
            className="bg-gray-900 hover:bg-lb-rose text-white font-black px-6 py-2.5 rounded-2xl flex items-center gap-2 text-[11px] uppercase tracking-widest transition-all shadow-xl shadow-gray-200 shrink-0">
            <Plus className="w-4 h-4 text-rose-300" /> {tab === "pelanggan" ? "Tambah" : "Buat Voucher"}
          </button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-5">

        {/* ── TAB PELANGGAN ── */}
        {tab === "pelanggan" && (
          <>
            <div className="relative mb-5 max-w-sm group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-lb-rose transition-colors" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari nama atau nomor HP..."
                className="w-full pl-11 pr-4 py-2.5 bg-white border-2 border-gray-100 rounded-2xl text-[11px] font-black uppercase tracking-widest focus:border-lb-rose focus:ring-4 focus:ring-rose-50 outline-none transition-all shadow-sm" />
            </div>

            {loading ? (
              <div className="flex justify-center py-20"><Loader2 className="w-10 h-10 text-rose-200 animate-spin" /></div>
            ) : (
              <>
                {/* Mobile View */}
                <div className="grid grid-cols-1 gap-4 md:hidden">
                  {filteredCusts.map(c => (
                    <div key={c.id} className="bg-white rounded-3xl border border-gray-100 p-4 shadow-sm relative overflow-hidden">
                      <div className="flex items-center gap-4 mb-3">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-white text-base shrink-0 shadow-lg ${c.is_member ? "bg-gradient-to-br from-amber-400 to-orange-500" : "bg-gray-300"}`}>
                          {c.name.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-black text-gray-800 text-sm truncate">{c.name}</h4>
                          <div className="flex items-center gap-2 mt-0.5">
                            <Phone className="w-3 h-3 text-gray-300" />
                            <span className="text-[10px] text-gray-400 font-bold">{c.phone || "—"}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          {c.is_member && <span className="bg-amber-100 text-amber-600 text-[8px] font-black px-2 py-1 rounded-full uppercase tracking-tighter">Gold Member</span>}
                        </div>
                      </div>
                      
                      {c.username && (
                        <div className="bg-rose-50/50 rounded-2xl p-3 border border-rose-100/50 mb-3">
                           <div className="flex justify-between text-[9px] mb-1">
                              <span className="text-gray-400 font-bold uppercase">Portal Username</span>
                              <span className="text-gray-800 font-black">{c.username}</span>
                           </div>
                           <div className="flex justify-between text-[9px]">
                              <span className="text-gray-400 font-bold uppercase">Portal Password</span>
                              <span className="text-lb-rose font-black font-mono">{c.password_plain}</span>
                           </div>
                        </div>
                      )}
                      
                      <button onClick={() => toggleMember(c)}
                        className={`w-full py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${c.is_member ? "bg-gray-50 text-gray-400" : "bg-amber-50 text-amber-600 border border-amber-100"}`}>
                        {c.is_member ? "Nonaktifkan Member" : "Aktivasi Member"}
                      </button>
                    </div>
                  ))}
                </div>

                {/* Desktop View */}
                <div className="hidden md:block bg-white rounded-[32px] border border-gray-100 shadow-premium overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50/50 border-b border-gray-100">
                      <tr className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                        <th className="px-6 py-5 text-left">Pelanggan</th>
                        <th className="px-6 py-5 text-left">Kontak</th>
                        <th className="px-6 py-5 text-center">Status</th>
                        <th className="px-6 py-5 text-left">Akses Portal</th>
                        <th className="px-6 py-5 text-right">Kelola</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {filteredCusts.map(c => (
                        <tr key={c.id} className="hover:bg-rose-50/20 transition-colors group">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-4">
                              <div className={`w-10 h-10 rounded-[14px] flex items-center justify-center font-black text-white text-sm shrink-0 shadow-sm transition-transform group-hover:scale-110 ${c.is_member ? "bg-gradient-to-br from-amber-400 to-orange-500 shadow-amber-200" : "bg-gray-100 text-gray-400"}`}>
                                {c.name.charAt(0)}
                              </div>
                              <span className="font-black text-gray-800 italic">{c.name}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="flex items-center gap-2 text-[11px] font-bold text-gray-400">
                               <div className="p-1.5 bg-gray-50 rounded-lg"><Phone className="w-3 h-3" /></div>
                               {c.phone || "—"}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            {c.is_member
                              ? <span className="bg-amber-100 text-amber-700 text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest border border-amber-200">Gold Member</span>
                              : <span className="text-gray-300 text-[9px] font-black uppercase tracking-widest">Reguler</span>
                            }
                          </td>
                          <td className="px-6 py-4">
                            {c.username ? (
                              <div className="flex gap-3">
                                <div className="flex flex-col">
                                   <span className="text-[8px] text-gray-300 font-bold uppercase tracking-tighter">User</span>
                                   <span className="text-[11px] font-black text-gray-700">{c.username}</span>
                                </div>
                                <div className="flex flex-col">
                                   <span className="text-[8px] text-gray-300 font-bold uppercase tracking-tighter">Pass</span>
                                   <span className="text-[11px] font-black text-lb-rose font-mono">{c.password_plain}</span>
                                </div>
                              </div>
                            ) : (
                              <span className="text-gray-200 text-[10px] italic">Not Registered</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button onClick={() => toggleMember(c)}
                              className={`text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl transition-all border ${c.is_member ? "bg-white text-rose-400 border-rose-100 hover:bg-rose-50" : "bg-white text-amber-600 border-amber-100 hover:bg-amber-50"}`}>
                              {c.is_member ? "Revoke Gold" : "Upgrade Gold"}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </>
        )}

        {/* ── TAB VOUCHER ── */}
        {tab === "voucher" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {vouchers.map(v => (
              <div key={v.id} className={`bg-white rounded-[32px] p-6 shadow-premium relative overflow-hidden transition-all group ${v.is_active ? "border border-rose-100" : "opacity-50 grayscale"}`}>
                <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-lb-rose/10 to-transparent -z-0 rounded-bl-full transition-transform group-hover:scale-110`} />
                
                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-4">
                    <div className="bg-gray-900 text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl">
                      {v.code}
                    </div>
                    {v.products?.name && (
                      <div className="bg-rose-50 text-lb-rose px-2.5 py-1 rounded-xl text-[9px] font-black uppercase tracking-tighter border border-rose-100">
                        {v.products.name}
                      </div>
                    )}
                  </div>
                  
                  <h3 className="font-black text-lg text-gray-800 leading-tight mb-1">{v.name}</h3>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Voucher Member</p>
                  
                  <div className="mt-6 pt-6 border-t border-gray-50 flex justify-between items-end">
                    <div>
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Potongan</p>
                      <p className="font-black text-lb-rose text-2xl tracking-tighter italic">Rp {v.discount_amount.toLocaleString("id-ID")}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Min. Belanja</p>
                      <p className="font-black text-gray-900 text-sm tracking-tight text-right">Rp {v.min_purchase.toLocaleString("id-ID")}</p>
                    </div>
                  </div>
                  
                  <button onClick={() => toggleVoucher(v.id, v.is_active)}
                    className={`w-full mt-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${v.is_active ? "bg-rose-50 text-lb-rose hover:bg-lb-rose hover:text-white" : "bg-gray-100 text-gray-400 hover:bg-gray-200"}`}>
                    {v.is_active ? "Nonaktifkan Promo" : "Aktifkan Kembali"}
                  </button>
                </div>
              </div>
            ))}
            {!loading && vouchers.length === 0 && (
              <div className="col-span-full py-20 text-center text-gray-300">
                <Tag className="w-16 h-16 mx-auto mb-4 opacity-10" />
                <p className="font-black uppercase tracking-widest text-sm">Belum ada promo tersedia</p>
              </div>
            )}
          </div>
        )}

        {/* ── TAB PESANAN WA ── */}
        {tab === "pesanan" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-500 shadow-inner">
                    <MessageCircle className="w-5 h-5" />
                 </div>
                 <div>
                    <h2 className="font-black text-gray-800 tracking-tight uppercase text-sm">Pesanan via Portal</h2>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Real-time Dashboard</p>
                 </div>
              </div>
              <div className="flex items-center gap-2 px-4 py-1.5 bg-emerald-50 rounded-full border border-emerald-100">
                 <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                 <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Live Updates</span>
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center py-20"><Loader2 className="w-10 h-10 text-emerald-200 animate-spin" /></div>
            ) : orders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-gray-200">
                <div className="w-20 h-20 bg-gray-50 rounded-[40px] flex items-center justify-center mb-6">
                   <MessageCircle className="w-10 h-10 opacity-20" />
                </div>
                <p className="font-black uppercase tracking-widest text-xs">Belum ada pesanan masuk</p>
              </div>
            ) : (
              <>
                {/* Mobile Orders View */}
                <div className="grid grid-cols-1 gap-4 md:hidden">
                  {orders.map(o => {
                    const cfg = STATUS_CONFIG[o.status] ?? STATUS_CONFIG.pending;
                    return (
                      <div key={o.id} className="bg-white rounded-[32px] p-5 shadow-sm border border-gray-100 relative">
                        <div className="flex items-center justify-between mb-4">
                           <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${cfg.color}`}>
                             {cfg.label}
                           </div>
                           <span className="text-[10px] text-gray-400 font-bold">
                             {new Date(o.ordered_at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                           </span>
                        </div>
                        <h4 className="font-black text-gray-800 text-sm mb-1">{o.product_name}</h4>
                        <div className="flex items-center gap-2 mb-5">
                           <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-black text-gray-400">{o.customer_name?.charAt(0)}</div>
                           <p className="text-[11px] text-gray-500 font-bold">{o.customer_name}</p>
                        </div>
                        {o.status === "pending" && (
                          <div className="flex gap-2">
                             <button onClick={() => updateOrderStatus(o.id, "confirmed")} className="flex-1 py-2.5 rounded-2xl bg-emerald-500 text-white font-black text-[10px] uppercase tracking-widest shadow-lg shadow-emerald-100">Diterima</button>
                             <button onClick={() => updateOrderStatus(o.id, "cancelled")} className="flex-1 py-2.5 rounded-2xl bg-gray-50 text-gray-400 font-black text-[10px] uppercase tracking-widest">Tolak</button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Desktop Orders View */}
                <div className="hidden md:block bg-white rounded-[32px] border border-gray-100 shadow-premium overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50/50 border-b border-gray-100">
                      <tr className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                        <th className="px-6 py-5 text-left">Pelanggan</th>
                        <th className="px-6 py-5 text-left">Produk / Layanan</th>
                        <th className="px-6 py-5 text-center">Waktu Pesan</th>
                        <th className="px-6 py-5 text-center">Status</th>
                        <th className="px-6 py-5 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {orders.map(o => {
                        const cfg = STATUS_CONFIG[o.status] ?? STATUS_CONFIG.pending;
                        const Icon = cfg.Icon;
                        return (
                          <tr key={o.id} className="hover:bg-rose-50/10 transition-colors group">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-[12px] bg-emerald-500 flex items-center justify-center text-white font-black text-xs shadow-lg shadow-emerald-100">
                                  {o.customer_name?.charAt(0) ?? "?"}
                                </div>
                                <span className="font-black text-gray-800 text-sm italic">{o.customer_name}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                               <p className="font-black text-gray-700 text-sm tracking-tight">{o.product_name}</p>
                            </td>
                            <td className="px-6 py-4 text-center">
                               <div className="flex flex-col items-center">
                                  <span className="text-[11px] font-black text-gray-800">{new Date(o.ordered_at).toLocaleDateString("id-ID", { day: "2-digit", month: "short" })}</span>
                                  <span className="text-[9px] font-bold text-gray-400 uppercase">{new Date(o.ordered_at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}</span>
                               </div>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span className={`inline-flex items-center gap-2 text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full ${cfg.color}`}>
                                <Icon className="w-3.5 h-3.5" />{cfg.label}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              {o.status === "pending" && (
                                <div className="flex gap-2 justify-end">
                                  <button onClick={() => updateOrderStatus(o.id, "confirmed")}
                                    className="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest bg-emerald-500 text-white shadow-lg shadow-emerald-100 hover:scale-105 transition-all">
                                    Konfirmasi
                                  </button>
                                  <button onClick={() => updateOrderStatus(o.id, "cancelled")}
                                    className="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest bg-white border border-gray-100 text-gray-400 hover:bg-red-50 hover:text-red-500 hover:border-red-100 transition-all">
                                    Tolak
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* ── Modal Tambah Pelanggan ── */}
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

              {/* Preview akun portal */}
              {custForm.name && (
                <div className="bg-pink-50 border border-pink-100 rounded-xl p-3">
                  <p className="text-xs font-extrabold text-[#C94F78] mb-2 uppercase tracking-wider flex items-center gap-1">
                    <Key className="w-3 h-3" /> Preview Akun Portal
                  </p>
                  <p className="text-xs text-gray-600">Username: <strong>{generateUsername(custForm.name)}</strong></p>
                  <p className="text-xs text-gray-600 mt-0.5">Password: <strong className="font-mono text-[#C94F78]">{getInitials(custForm.name)}-{custForm.is_member ? "M" : "R"}-[ID]</strong></p>
                  <p className="text-[10px] text-gray-400 mt-1.5 italic">ID akan otomatis digenerate saat disimpan</p>
                </div>
              )}
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

      {/* ── Modal Voucher ── */}
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
                <label className="label-form">Gunakan Untuk Produk *</label>
                <select className="input-form" value={vouchForm.product_id} onChange={e => setVouchForm(f => ({ ...f, product_id: e.target.value }))}>
                  <option value="">— Pilih Produk —</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label-form">Nama / Deskripsi</label>
                <input className="input-form" placeholder="Diskon spesial produk SKU-xxx" value={vouchForm.name} onChange={e => setVouchForm(f => ({ ...f, name: e.target.value }))} />
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
