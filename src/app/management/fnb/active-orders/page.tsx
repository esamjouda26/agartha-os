import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Activity, ChefHat, Package, Clock, CreditCard } from "lucide-react";

export default async function FnbActiveOrdersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return redirect("/login");

  // Fetch F&B Orders
  const { data: fnbOrders } = await supabase
    .from("fnb_orders")
    .select(`
      id, created_at, status, total_amount, payment_method,
      fnb_order_items ( quantity, unit_price, fnb_menu_items ( name ) )
    `)
    .eq("status", "preparing")
    .order("created_at", { ascending: false });

  // Fetch Retail Orders
  const { data: retailOrders } = await supabase
    .from("retail_orders")
    .select(`
      id, created_at, status, total_amount, payment_method,
      retail_order_items ( quantity, unit_price, retail_catalog ( name ) )
    `)
    .eq("status", "completed")
    .order("created_at", { ascending: false })
    .limit(20);

  return (
    <div className="space-y-8 pb-10">
      {/* ═══ Header ═══ */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-cinzel text-3xl text-[#d4af37] font-bold tracking-wider flex items-center">
            <Activity className="w-8 h-8 mr-3" /> 
            Unified POS Monitoring
          </h1>
          <p className="text-gray-400 text-sm mt-1 uppercase tracking-widest font-semibold flex items-center">
            <span className="w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse" />
            Live View: Preparation & Conversion
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* F&B Section */}
        <section className="glass-panel rounded-lg overflow-hidden flex flex-col min-h-[600px] border-[#d4af37]/30">
          <div className="p-4 border-b border-white/10 flex items-center justify-between bg-[#020408]/50">
            <h2 className="text-lg font-cinzel font-bold text-[#d4af37] tracking-wider flex items-center">
              <ChefHat className="w-5 h-5 mr-2 text-[#d4af37]" />
              F&B Prep Queue
            </h2>
            <span className="bg-[#d4af37]/20 text-[#d4af37] border border-[#d4af37]/30 py-1 px-3 rounded text-xs font-bold uppercase tracking-widest">
              {fnbOrders?.length || 0} Active
            </span>
          </div>
          
          <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto custom-scrollbar">
            {fnbOrders?.map(order => (
               <div key={order.id} className="bg-[#010204] border border-white/10 p-5 rounded outline outline-1 outline-transparent hover:outline-[#d4af37]/50 transition-all group">
                 <div className="flex justify-between items-start mb-4 pb-3 border-b border-white/10">
                   <div>
                     <span className="text-xs text-[#d4af37] font-mono tracking-widest bg-[#d4af37]/10 px-2 py-1 rounded border border-[#d4af37]/20">#{order.id.split("-")[0]}</span>
                     <p className="text-xl font-orbitron font-bold text-white mt-2">RM {Number(order.total_amount).toFixed(2)}</p>
                   </div>
                   <div className="text-right">
                     <span className="bg-orange-500/20 text-orange-400 border border-orange-500/30 text-[10px] px-2.5 py-1 rounded uppercase tracking-widest font-bold flex items-center justify-end">
                       <Clock className="w-3 h-3 mr-1" /> {order.status}
                     </span>
                     <p className="text-[10px] text-gray-500 mt-2 uppercase tracking-widest flex items-center justify-end">
                       <CreditCard className="w-3 h-3 mr-1" /> {order.payment_method}
                     </p>
                   </div>
                 </div>
                 <ul className="text-xs space-y-3">
                   {order.fnb_order_items.map((item: any, idx: number) => (
                     <li key={idx} className="flex justify-between items-center text-gray-300">
                       <span className="flex items-center">
                         <span className="font-bold text-[#d4af37] mr-2 bg-white/5 px-2 py-0.5 rounded">{item.quantity}x</span> 
                         <span className="font-sans font-semibold tracking-wide">{item.fnb_menu_items?.name}</span>
                       </span>
                     </li>
                   ))}
                 </ul>
               </div>
            ))}
            {(!fnbOrders || fnbOrders.length === 0) && (
              <div className="text-center py-16 flex flex-col items-center">
                <ChefHat className="w-12 h-12 text-gray-600 mb-4" />
                <p className="text-gray-500 text-sm tracking-widest uppercase font-semibold">Queue Cleared</p>
              </div>
            )}
          </div>
        </section>

        {/* Retail Section */}
        <section className="glass-panel rounded-lg overflow-hidden flex flex-col min-h-[600px] border-[#d4af37]/30">
          <div className="p-4 border-b border-white/10 flex items-center justify-between bg-[#020408]/50">
            <h2 className="text-lg font-cinzel font-bold text-white tracking-wider flex items-center">
              <Package className="w-5 h-5 mr-2 text-gray-400" />
              Recent Retail Activity
            </h2>
            <span className="bg-white/10 text-white border border-white/20 py-1 px-3 rounded text-xs font-bold uppercase tracking-widest">
              Live Feed
            </span>
          </div>
          
          <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto custom-scrollbar">
            {retailOrders?.map(order => (
               <div key={order.id} className="bg-[#010204] border border-white/5 p-5 rounded hover:bg-white/[0.02] transition-colors">
                 <div className="flex justify-between items-start mb-4 pb-3 border-b border-white/5">
                   <div>
                     <span className="text-xs text-gray-500 font-mono tracking-widest">#{order.id.split("-")[0]}</span>
                     <p className="text-lg font-orbitron font-bold text-gray-300 mt-2">RM {Number(order.total_amount).toFixed(2)}</p>
                   </div>
                   <div className="text-right">
                     <span className="bg-green-500/10 text-green-400 border border-green-500/20 text-[10px] px-2.5 py-1 rounded uppercase tracking-widest font-bold">
                       {order.status}
                     </span>
                     <p className="text-[10px] text-gray-600 mt-2 uppercase tracking-widest flex items-center justify-end">
                       <CreditCard className="w-3 h-3 mr-1" /> {order.payment_method}
                     </p>
                   </div>
                 </div>
                 <ul className="text-xs space-y-3">
                   {order.retail_order_items.map((item: any, idx: number) => (
                     <li key={idx} className="flex justify-between items-center text-gray-400">
                       <span className="flex items-center">
                         <span className="font-bold text-white mr-2 bg-white/5 px-2 py-0.5 rounded">{item.quantity}x</span> 
                         <span className="font-sans tracking-wide">{item.retail_catalog?.name}</span>
                       </span>
                     </li>
                   ))}
                 </ul>
               </div>
            ))}
            {(!retailOrders || retailOrders.length === 0) && (
              <div className="text-center py-16 flex flex-col items-center">
                <Package className="w-12 h-12 text-gray-700 mb-4" />
                <p className="text-gray-600 text-sm tracking-widest uppercase font-semibold">No Retail Transactions</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
