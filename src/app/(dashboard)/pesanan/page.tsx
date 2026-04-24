"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { 
  Loader2, Clock, CheckCircle2, Package, Search, 
  Filter, Calendar, User, ShoppingBag, ArrowRight
} from "lucide-react";

type Order = {
  id: number;
  customer_id: number;
  customer_name: string;
  product_name: string;
  status: string;
  ordered_at: string;
  completed_at?: string;
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("all");
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("customer_orders")
      .select("*")
      .order("ordered_at", { ascending: false });
    
    if (data) setOrders(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const updateStatus = async (id: number, newStatus: string) => {
    setUpdatingId(id);
    try {
      const updateData: any = { status: newStatus };
      if (newStatus === "completed") {
        updateData.completed_at = new Date().toISOString();
      } else {
        updateData.completed_at = null;
      }

      const { error } = await supabase
        .from("customer_orders")
        .update(updateData)
        .eq("id", id);

      if (error) throw error;
      
      setOrders(prev => prev.map(o => o.id === id ? { ...o, ...updateData } : o));
    } catch (e) {
      console.error(e);
      alert("Gagal memperbarui status pesanan");
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredOrders = orders.filter(o => {
    if (filterStatus === "all") return true;
    return o.status === filterStatus;
  });

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "pending": return "bg-amber-50 text-amber-600 border-amber-100";
      case "processing": return "bg-blue-50 text-blue-600 border-blue-100";
      case "completed": return "bg-emerald-50 text-emerald-600 border-emerald-100";
      default: return "bg-slate-50 text-slate-600 border-slate-100";
    }
  };

  return (
    <div className="p-6 space-y-6 bg-slate-50/50 min-h-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Pesanan</h1>
          <p className="text-xs text-slate-500 mt-1">Kelola booking dan pesanan masuk dari portal pelanggan.</p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex bg-white rounded-xl border border-slate-200 p-1 shadow-sm">
            {["all", "pending", "processing", "completed"].map(s => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold capitalize transition-all ${
                  filterStatus === s ? "bg-[#C94F78] text-white" : "text-slate-400 hover:text-slate-600"
                }`}
              >
                {s === "all" ? "Semua" : s === "pending" ? "Menunggu" : s === "processing" ? "Diproses" : "Selesai"}
              </button>
            ))}
          </div>
          <button onClick={fetchOrders} className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-[#C94F78] shadow-sm transition-all">
            <Loader2 className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="h-64 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-[#C94F78] animate-spin" />
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="h-64 flex flex-col items-center justify-center gap-2 bg-white rounded-3xl border border-dashed border-slate-200">
          <ShoppingBag className="w-10 h-10 text-slate-200" />
          <p className="text-sm text-slate-400">Tidak ada pesanan ditemukan</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredOrders.map(order => (
            <div key={order.id} className="bg-white rounded-3xl border border-slate-100 p-5 shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
              <div className="flex items-center justify-between mb-4">
                <div className={`px-2.5 py-1 rounded-lg border text-[10px] font-bold uppercase tracking-wider ${getStatusStyle(order.status)}`}>
                  {order.status === "pending" ? "Menunggu" : order.status === "processing" ? "Diproses" : "Selesai"}
                </div>
                <div className="flex items-center gap-1.5 text-slate-400">
                  <Calendar className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-medium">
                    {new Date(order.ordered_at).toLocaleDateString("id-ID", { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 shrink-0">
                    <User className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Pelanggan</p>
                    <p className="text-sm font-semibold text-slate-700 truncate">{order.customer_name}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center text-[#C94F78] shrink-0">
                    <ShoppingBag className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Produk/Layanan</p>
                    <p className="text-sm font-semibold text-slate-700 leading-tight line-clamp-2">{order.product_name}</p>
                  </div>
                </div>
              </div>

              {order.completed_at && (
                <div className="mt-4 p-3 bg-emerald-50/50 rounded-xl border border-emerald-100 flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-[10px] text-emerald-700 font-semibold">
                    Selesai pada: {new Date(order.completed_at).toLocaleDateString("id-ID", { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              )}

              <div className="mt-6 pt-4 border-t border-slate-50 flex gap-2">
                {order.status === "pending" && (
                  <button
                    disabled={updatingId === order.id}
                    onClick={() => updateStatus(order.id, "processing")}
                    className="flex-1 py-2 bg-blue-500 text-white rounded-xl text-[11px] font-bold hover:bg-blue-600 transition-all flex items-center justify-center gap-1.5"
                  >
                    {updatingId === order.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ArrowRight className="w-3.5 h-3.5" />}
                    Proses Pesanan
                  </button>
                )}
                {order.status === "processing" && (
                  <button
                    disabled={updatingId === order.id}
                    onClick={() => updateStatus(order.id, "completed")}
                    className="flex-1 py-2 bg-emerald-500 text-white rounded-xl text-[11px] font-bold hover:bg-emerald-600 transition-all flex items-center justify-center gap-1.5"
                  >
                    {updatingId === order.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                    Selesaikan
                  </button>
                )}
                {order.status === "completed" && (
                  <>
                    <button
                      disabled={updatingId === order.id}
                      onClick={() => updateStatus(order.id, "processing")}
                      className="flex-1 py-2 bg-slate-100 text-slate-500 rounded-xl text-[11px] font-bold hover:bg-slate-200 transition-all"
                    >
                      Reset ke Proses
                    </button>
                    <button
                      onClick={() => window.open(`/invoice-online/${order.id}`, "_blank")}
                      className="flex-1 py-2 bg-[#C94F78] text-white rounded-xl text-[11px] font-bold hover:bg-[#A83E60] transition-all flex items-center justify-center gap-1.5 shadow-sm shadow-rose-100"
                    >
                      Cetak Invoice
                    </button>
                  </>
                )}
                <button
                  onClick={() => {
                    const msg = `Halo ${order.customer_name}, kami ingin mengonfirmasi pesanan Anda: ${order.product_name}.`;
                    window.open(`https://wa.me/628?text=${encodeURIComponent(msg)}`, "_blank");
                  }}
                  className="px-4 py-2 border border-slate-200 text-slate-400 rounded-xl hover:bg-slate-50 transition-all"
                >
                  WA
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
