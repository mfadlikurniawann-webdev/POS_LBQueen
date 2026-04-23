"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { format } from "date-fns";
import { Printer, ChevronLeft, Loader2, AlertCircle } from "lucide-react";
import Image from "next/image";

type OnlineOrder = {
  id: number;
  customer_id: number;
  customer_name: string;
  product_id: number;
  product_name: string;
  status: string;
  ordered_at: string;
  completed_at?: string;
};

export default function OnlineInvoicePage() {
  const params = useParams();
  const [order, setOrder] = useState<OnlineOrder | null>(null);
  const [price, setPrice] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [size, setSize] = useState<"58mm" | "80mm">("80mm");
  
  const [cashierName, setCashierName] = useState("Admin / Owner");

  useEffect(() => {
    const userStr = localStorage.getItem("lbqueen_user");
    if (userStr) {
      try {
        const u = JSON.parse(userStr);
        setCashierName(u.name || "Admin / Owner");
      } catch (e) {}
    }

    const fetchOrder = async () => {
      if (!params.id) return;
      setLoading(true);
      
      try {
        const { data: ord, error: ordError } = await supabase
          .from("customer_orders")
          .select("*")
          .eq("id", params.id)
          .single();
          
        if (ordError || !ord) throw new Error("Pesanan online tidak ditemukan");
        setOrder(ord);

        if (ord.product_id) {
          const { data: prod } = await supabase
            .from("products")
            .select("selling_price")
            .eq("id", ord.product_id)
            .single();
          
          if (prod) {
            setPrice(prod.selling_price || 0);
          }
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [params.id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <Loader2 className="w-8 h-8 text-[#C94F78] animate-spin" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 gap-4">
        <AlertCircle className="w-12 h-12 text-red-500" />
        <p className="font-bold text-gray-700">{error || "Pesanan online tidak ditemukan"}</p>
        <button onClick={() => window.close()} className="px-4 py-2 bg-gray-200 rounded-lg text-sm font-semibold mt-2">
          Tutup
        </button>
      </div>
    );
  }

  const printWidth = size === "58mm" ? "w-[58mm] max-w-[200px]" : "w-[80mm] max-w-[280px]";
  const is58 = size === "58mm";

  const match = order.product_name.match(/\(x(\d+)\)$/);
  const qty = match ? parseInt(match[1]) : 1;
  const nameWithoutQty = order.product_name.replace(/\s*\(x\d+\)$/, "");
  const subtotal = price * qty;

  return (
    <div className="min-h-screen bg-gray-100 font-mono flex flex-col items-center py-8">
      {/* ── CONTROLS (NO PRINT) ── */}
      <div className="no-print bg-white p-4 rounded-2xl shadow-sm mb-8 w-full max-w-md flex flex-col gap-4 border border-gray-200">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
           <button onClick={() => window.close()} className="flex items-center gap-2 text-gray-500 hover:text-gray-800 transition-colors text-sm font-sans font-semibold">
             <ChevronLeft className="w-4 h-4" /> Kembali
           </button>
           <h1 className="font-sans font-bold text-gray-800">Pengaturan Cetak</h1>
        </div>
        
        <div className="flex gap-3 font-sans">
          <button 
            onClick={() => setSize("58mm")}
            className={`flex-1 py-2 rounded-lg text-sm font-bold border-2 transition-all ${size === "58mm" ? "border-[#C94F78] bg-rose-50 text-[#C94F78]" : "border-gray-200 text-gray-400"}`}
          >
            58 mm
          </button>
          <button 
            onClick={() => setSize("80mm")}
            className={`flex-1 py-2 rounded-lg text-sm font-bold border-2 transition-all ${size === "80mm" ? "border-[#C94F78] bg-rose-50 text-[#C94F78]" : "border-gray-200 text-gray-400"}`}
          >
            80 mm
          </button>
        </div>

        <div className="flex flex-col gap-2">
          <button 
            onClick={() => window.print()}
            className="w-full bg-[#C94F78] hover:bg-[#A83E60] text-white py-3 rounded-xl font-sans font-bold flex items-center justify-center gap-2 shadow-lg shadow-rose-200 transition-all active:scale-95"
          >
            <Printer className="w-5 h-5" /> Cetak Biasa (Browser)
          </button>
        </div>
      </div>

      {/* ── INVOICE PAPER ── */}
      <div className={`bg-white shadow-xl ${printWidth} relative p-4 print:shadow-none print:p-0 print:m-0 mx-auto text-black`} style={{ fontFamily: "monospace" }}>
         {/* Zigzag Top Decoration (No Print) */}
         <div className="absolute top-0 left-0 right-0 h-2 -mt-2 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPjxwb2x5Z29uIHBvaW50cz0iMCwwIDQsOCA4LDAiIGZpbGw9IiNmZmYiLz48L3N2Zz4=')] bg-repeat-x no-print z-10" />
         
         <div className="flex flex-col items-center mb-4">
            <div className={`relative mb-2 ${is58 ? "w-12 h-12" : "w-16 h-16"}`}>
               <Image src="/lbqueen_logo.png" alt="Logo" fill className="object-contain" />
            </div>
            <h2 className={`${is58 ? "text-[11px]" : "text-sm"} font-bold text-center leading-tight`}>LBQueen.id Care & Beauty<br/>CLINIC</h2>
            <p className={`${is58 ? "text-[9px]" : "text-[10px]"} text-center mt-1 leading-tight px-2`}>
              Jl. Hos Cokroaminoto no.17 Tanjungkarang Timur Bandar Lampung<br/>
              PT. LBQueen Care Beauty<br/>
              Cp : 082176171448
            </p>
         </div>

         <div className="border-t border-dashed border-black/50 my-2" />

         <div className={`${is58 ? "text-[9px]" : "text-[11px]"} space-y-0.5`}>
            <div className="flex justify-between"><span className="w-20">No Order</span><span>: ONL-{order.id}</span></div>
            <div className="flex justify-between"><span className="w-20">Pelanggan</span><span className="truncate max-w-[100px] text-right">: {order.customer_name}</span></div>
            <div className="flex justify-between"><span className="w-20">Tgl Order</span><span>: {format(new Date(order.ordered_at), "dd/MM/yyyy HH:mm")}</span></div>
            <div className="flex justify-between"><span className="w-20">Kasir</span><span>: {cashierName}</span></div>
         </div>

         <div className="border-t border-dashed border-black/50 my-2" />
         
         <h3 className={`${is58 ? "text-[10px]" : "text-xs"} font-bold text-center mb-2`}>LAYANAN ONLINE</h3>

         <div className={`${is58 ? "text-[9px]" : "text-[11px]"} space-y-2`}>
             <div className="flex flex-col">
               <span className="font-bold capitalize break-words leading-tight">{nameWithoutQty}</span>
               
               {price > 0 && (
                 <div className="flex justify-between mt-0.5">
                   <span>{qty} x {price.toLocaleString("id-ID")}</span>
                   <span>{subtotal.toLocaleString("id-ID")}</span>
                 </div>
               )}
               {price === 0 && (
                 <div className="flex justify-between mt-0.5">
                   <span>{qty}x</span>
                   <span>-</span>
                 </div>
               )}
             </div>
         </div>

         <div className="border-t border-dashed border-black/50 my-2" />

         <div className={`${is58 ? "text-[9px]" : "text-[11px]"}`}>
           {price > 0 && (
             <div className="flex justify-between font-bold mt-1 text-[11px]">
               <span>Total Estimasi</span>
               <span>{subtotal.toLocaleString("id-ID")}</span>
             </div>
           )}
           {price === 0 && (
             <div className="flex justify-between font-bold mt-1 text-[11px]">
               <span>Total</span>
               <span>TBD (Konfirmasi WA)</span>
             </div>
           )}
         </div>

         <div className="border-t border-dashed border-black/50 my-2" />

         <div className={`${is58 ? "text-[9px]" : "text-[11px]"} space-y-0.5`}>
           <div className="flex justify-between"><span>Status Order</span><span className="uppercase text-emerald-600 font-bold">{order.status === "completed" ? "Selesai" : order.status}</span></div>
           <div className="flex justify-between"><span>Metode Bayar</span><span>Transfer/WA</span></div>
         </div>

         <div className="border-t border-dashed border-black/50 my-2" />

         <div className={`${is58 ? "text-[8px]" : "text-[10px]"} text-center mt-3 font-bold mb-4`}>
            LBQueen.id Care & Beauty Clinic<br/>
            PT. LBQueen Care Beauty
         </div>

         {/* Zigzag Bottom Decoration (No Print) */}
         <div className="absolute bottom-0 left-0 right-0 h-2 -mb-2 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPjxwb2x5Z29uIHBvaW50cz0iMCwwIDgsMCA0LDgiIGZpbGw9IiNmZmYiLz48L3N2Zz4=')] bg-repeat-x no-print z-10" />
      </div>
    </div>
  );
}
