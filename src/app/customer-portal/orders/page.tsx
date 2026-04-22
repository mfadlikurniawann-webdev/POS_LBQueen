"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { 
  ChevronLeft, ShoppingBag, Loader2, Clock, CheckCircle2, 
  MessageCircle, ArrowRight, Package, Search, Ticket,
  Truck, HelpCircle
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const WA_NUMBER = "6282176171448";

type Order = {
  id: number;
  product_id: number;
  product_name: string;
  status: string;
  created_at: string;
  customer_name: string;
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("semua");
  const [customer, setCustomer] = useState<any>(null);

  const fetchOrders = useCallback(async (custId: number) => {
    setLoading(true);
    const { data, error } = await supabase
      .from("customer_orders")
      .select("*")
      .eq("customer_id", custId)
      .order("created_at", { ascending: false });
    
    if (data) setOrders(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem("lbqueen_customer");
    if (stored) {
      const cust = JSON.parse(stored);
      setCustomer(cust);
      fetchOrders(cust.id);
    }
  }, [fetchOrders]);

  const filteredOrders = orders.filter(o => {
    if (activeTab === "semua") return true;
    if (activeTab === "menunggu") return o.status === "pending";
    if (activeTab === "diproses") return o.status === "processing";
    if (activeTab === "selesai") return o.status === "completed";
    return true;
  });

  const getStatusInfo = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return { label: "Menunggu Konfirmasi", icon: <Clock className="w-4 h-4" />, color: "text-amber-500", bg: "bg-amber-50" };
      case "processing":
        return { label: "Sedang Diproses", icon: <Package className="w-4 h-4" />, color: "text-blue-500", bg: "bg-blue-50" };
      case "completed":
        return { label: "Selesai", icon: <CheckCircle2 className="w-4 h-4" />, color: "text-emerald-500", bg: "bg-emerald-50" };
      default:
        return { label: status, icon: <Clock className="w-4 h-4" />, color: "text-gray-500", bg: "bg-gray-50" };
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFCFD] pb-32">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-[#C94F78] px-5 pt-12 pb-6 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-4">
           <Link href="/customer-portal" className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white active:scale-90 transition-all">
             <ChevronLeft className="w-6 h-6" />
           </Link>
           <h1 className="text-xl font-bold text-white leading-tight flex items-center gap-2">
             Order Saya
           </h1>
        </div>
        <button onClick={() => window.open(`https://wa.me/${WA_NUMBER}`, "_blank")} className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white active:scale-90 transition-all">
           <HelpCircle className="w-5 h-5" />
        </button>
      </div>

      {/* Tabs */}
      <div className="sticky top-[76px] z-40 bg-white border-b border-gray-50 flex overflow-x-auto no-scrollbar">
         {["semua", "menunggu", "diproses", "selesai"].map((tab) => (
           <button 
             key={tab}
             onClick={() => setActiveTab(tab)}
             className={`flex-1 min-w-[100px] py-4 text-[12px] font-semibold capitalize tracking-widest transition-all relative ${
               activeTab === tab ? "text-[#C94F78]" : "text-gray-400"
             }`}
           >
             {tab}
             {activeTab === tab && <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#C94F78] rounded-t-full" />}
           </button>
         ))}
      </div>

      <div className="p-5">
        {loading ? (
          <div className="py-20 flex flex-col items-center gap-4">
             <Loader2 className="w-8 h-8 text-[#C94F78] animate-spin" />
             <p className="text-xs font-semibold text-gray-300 capitalize tracking-widest">Menyiapkan History...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="py-20 text-center flex flex-col items-center gap-6">
             <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto">
                <ShoppingBag className="w-10 h-10 text-gray-200" />
             </div>
             <div>
                <p className="text-base font-semibold text-gray-900 mb-1">Belum Ada Pesanan</p>
                <p className="text-sm text-gray-400 mb-8 max-w-[240px] mx-auto">Temukan perawatan premium favorit Anda sekarang.</p>
                <Link href="/customer-portal" className="bg-[#C94F78] text-white px-8 py-3 rounded-full font-semibold text-sm tracking-widest shadow-lg shadow-rose-100 capitalize transition-all active:scale-95">
                  Eksplor Sekarang
                </Link>
             </div>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map(order => {
              const status = getStatusInfo(order.status);
              return (
                <div key={order.id} className="bg-white rounded-[28px] p-5 border border-gray-100 shadow-sm space-y-4">
                   <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                         <div className={`p-1.5 rounded-lg ${status.bg} ${status.color}`}>
                            {status.icon}
                         </div>
                         <span className={`text-[10px] font-semibold capitalize tracking-widest ${status.color}`}>
                           {status.label}
                         </span>
                      </div>
                      <span className="text-[10px] font-semibold text-gray-400 tracking-widest">
                        {new Date(order.created_at).toLocaleDateString("id-ID", { day: 'numeric', month: 'short' })}
                      </span>
                   </div>
                   
                   <div className="flex gap-4">
                      <div className="w-16 h-16 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center text-[#C94F78] italic font-semibold text-xl opacity-20">
                         LB
                      </div>
                      <div className="flex-1 min-w-0">
                         <h3 className="text-sm font-semibold text-gray-800 truncate mb-1">{order.product_name}</h3>
                         <p className="text-[10px] font-semibold text-gray-400 capitalize tracking-widest">Ritual Belanja Premium</p>
                      </div>
                   </div>

                   <div className="pt-4 border-t border-dashed border-gray-100 flex justify-between items-center">
                      <button 
                        onClick={() => window.open(`https://wa.me/${WA_NUMBER}?text=Halo LBQueen, saya ingin menanyakan status pesanan saya: ${order.product_name}`, "_blank")}
                        className="text-[11px] font-semibold text-[#C94F78] flex items-center gap-2"
                      >
                         <MessageCircle className="w-4 h-4" /> Hubungi Admin
                      </button>
                      <button className="text-[11px] font-semibold text-gray-400 capitalize border border-gray-100 px-4 py-2 rounded-xl">
                         Detail
                      </button>
                   </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
