"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { format } from "date-fns";
import { Printer, ChevronLeft, Loader2, AlertCircle } from "lucide-react";
import Image from "next/image";

type InvoiceItem = {
  id: number;
  product_id: number;
  quantity: number;
  price: number;
  subtotal: number;
  variant_name: string | null;
  products: { name: string; type: string } | null;
};

type InvoiceData = {
  id: number;
  invoice_number: string;
  created_at: string;
  total_amount: number;
  subtotal: number;
  discount_applied: number;
  payment: number;
  change_amount: number;
  customers: { name: string } | null;
  vouchers: { code: string } | null;
};

export default function InvoicePage() {
  const params = useParams();
  const router = useRouter();
  const [invoice, setInvoice] = useState<InvoiceData | null>(null);
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [size, setSize] = useState<"58mm" | "80mm">("80mm");
  
  // Pegawai can be fetched from local storage
  const [cashierName, setCashierName] = useState("Owner");

  useEffect(() => {
    const userStr = localStorage.getItem("lbqueen_user");
    if (userStr) {
      try {
        const u = JSON.parse(userStr);
        setCashierName(u.name || "Owner");
      } catch (e) {}
    }

    const fetchInvoice = async () => {
      if (!params.id) return;
      setLoading(true);
      
      try {
        // Fetch Transaction
        const { data: txn, error: txnError } = await supabase
          .from("transactions")
          .select("*, customers(name), vouchers(code)")
          .eq("id", params.id)
          .single();
          
        if (txnError || !txn) throw new Error("Invoice tidak ditemukan");
        setInvoice(txn);

        // Fetch Details
        const { data: details, error: detError } = await supabase
          .from("transaction_details")
          .select("*, products(name, type)")
          .eq("transaction_id", params.id);
          
        if (detError) throw new Error("Gagal mengambil detail invoice");
        setItems(details || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchInvoice();
  }, [params.id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <Loader2 className="w-8 h-8 text-[#C94F78] animate-spin" />
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 gap-4">
        <AlertCircle className="w-12 h-12 text-red-500" />
        <p className="font-bold text-gray-700">{error || "Invoice tidak ditemukan"}</p>
        <button onClick={() => window.close()} className="px-4 py-2 bg-gray-200 rounded-lg text-sm font-semibold mt-2">
          Tutup
        </button>
      </div>
    );
  }

  const printWidth = size === "58mm" ? "w-[58mm] max-w-[200px]" : "w-[80mm] max-w-[280px]";
  const is58 = size === "58mm";

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

        <button 
          onClick={() => window.print()}
          className="w-full bg-[#C94F78] hover:bg-[#A83E60] text-white py-3 rounded-xl font-sans font-bold flex items-center justify-center gap-2 shadow-lg shadow-rose-200 transition-all active:scale-95"
        >
          <Printer className="w-5 h-5" /> Cetak Sekarang
        </button>
      </div>

      {/* ── INVOICE PAPER ── */}
      <div className={`bg-white shadow-xl ${printWidth} relative p-4 print:shadow-none print:p-0 print:m-0 mx-auto text-black`} style={{ fontFamily: "monospace" }}>
         {/* Zigzag Top Decoration (No Print) */}
         <div className="absolute top-0 left-0 right-0 h-2 -mt-2 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPjxwb2x5Z29uIHBvaW50cz0iMCwwIDQsOCA4LDAiIGZpbGw9IiNmZmYiLz48L3N2Zz4=')] bg-repeat-x no-print z-10" />
         
         <div className="flex flex-col items-center mb-4">
            <div className={`relative mb-2 ${is58 ? "w-12 h-12" : "w-16 h-16"}`}>
               {/* Note: using a solid image for print is better, ensure the logo is contrasty */}
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
            <div className="flex justify-between"><span className="w-20">No Nota</span><span>: {invoice.invoice_number}</span></div>
            <div className="flex justify-between"><span className="w-20">Antrian</span><span>: -</span></div>
            <div className="flex justify-between"><span className="w-20">Pelanggan</span><span className="truncate max-w-[100px] text-right">: {invoice.customers?.name || "Umum"}</span></div>
            <div className="flex justify-between"><span className="w-20">Tanggal</span><span>: {format(new Date(invoice.created_at), "dd/MM/yyyy HH:mm")}</span></div>
            <div className="flex justify-between"><span className="w-20">Kasir</span><span>: {cashierName}</span></div>
            <div className="flex justify-between"><span className="w-20">Pegawai</span><span>: -</span></div>
         </div>

         <div className="border-t border-dashed border-black/50 my-2" />
         
         <h3 className={`${is58 ? "text-[10px]" : "text-xs"} font-bold text-center mb-2`}>LAYANAN</h3>

         <div className={`${is58 ? "text-[9px]" : "text-[11px]"} space-y-2`}>
            {items.map((item, idx) => {
               // Assuming items that have vouchers get their discount reflected in the total or subtotal,
               // we display the base price logic if available, else just subtotal.
               const hasVariant = !!item.variant_name;
               const itemName = item.products?.name || "Produk";
               
               return (
                 <div key={idx} className="flex flex-col">
                   <span className="font-bold capitalize break-words leading-tight">{itemName}</span>
                   {hasVariant && <span className="capitalize text-[8px] pl-2">- {item.variant_name}</span>}
                   
                   <div className="flex justify-between mt-0.5">
                     <span>{item.quantity} x {item.price.toLocaleString("id-ID")}</span>
                     <span>{item.subtotal.toLocaleString("id-ID")}</span>
                   </div>
                   {/* If there was a specific discount for this item, we would show it here. 
                       Currently, discount_applied is global for the transaction in our schema, 
                       so we will show it at the global total section. */}
                 </div>
               )
            })}
         </div>

         <div className="border-t border-dashed border-black/50 my-2" />

         <div className={`${is58 ? "text-[9px]" : "text-[11px]"}`}>
           <div className="flex justify-between font-bold">
             <span>Subtotal</span>
             <span>{invoice.subtotal.toLocaleString("id-ID")}</span>
           </div>
           {invoice.discount_applied > 0 && (
             <div className="flex justify-between mt-0.5">
               <span>Diskon ({invoice.vouchers?.code || "Promo"})</span>
               <span>-{invoice.discount_applied.toLocaleString("id-ID")}</span>
             </div>
           )}
           <div className="flex justify-between font-bold mt-1 text-[11px]">
             <span>Total</span>
             <span>{invoice.total_amount.toLocaleString("id-ID")}</span>
           </div>
         </div>

         <div className="border-t border-dashed border-black/50 my-2" />

         <div className={`${is58 ? "text-[9px]" : "text-[11px]"} space-y-0.5`}>
           <div className="flex justify-between"><span>Status</span><span>{invoice.payment >= invoice.total_amount ? "Lunas" : "Belum Lunas"}</span></div>
           <div className="flex justify-between"><span>Metode Bayar</span><span>{invoice.payment >= invoice.total_amount ? "Cash/Transfer" : "DP"}</span></div>
           <div className="flex justify-between"><span>Total Tagihan</span><span>{invoice.total_amount.toLocaleString("id-ID")}</span></div>
           <div className="flex justify-between"><span>DiBayar</span><span>{invoice.payment.toLocaleString("id-ID")}</span></div>
           {invoice.change_amount > 0 && invoice.payment >= invoice.total_amount && (
              <div className="flex justify-between"><span>Kembalian</span><span>{invoice.change_amount.toLocaleString("id-ID")}</span></div>
           )}
           {invoice.payment < invoice.total_amount && (
              <div className="flex justify-between"><span>Sisa Tagihan</span><span>{(invoice.total_amount - invoice.payment).toLocaleString("id-ID")}</span></div>
           )}
         </div>

         <div className="border-t border-dashed border-black/50 my-2" />
         
         <div className={`${is58 ? "text-[8px]" : "text-[9px]"} text-center mb-2 capitalize break-words px-1`}>
            {invoice.payment >= invoice.total_amount 
              ? "Pembayaran Lunas" 
              : `Pembayaran DP ${invoice.payment.toLocaleString("id-ID")}`}
         </div>

         <div className="border-t border-dashed border-black/50 my-2" />

         <div className={`${is58 ? "text-[8px]" : "text-[10px]"} text-center mt-3 font-bold`}>
            GRATIS TREATMENT JIKA TIDAK MENERIMA STRUK
         </div>
         
         <div className={`${is58 ? "text-[8px]" : "text-[9px]"} text-center mt-2 px-1`}>
            Terima Kasih sudah percaya dengan<br/>LBQueen.id<br/>
            Kepuasan Custumer no satu dalam pelayanan kita
         </div>

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
