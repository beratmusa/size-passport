"use client";
import { motion } from "framer-motion";

export function ROIDashboard() {
  return (
    <div className="w-full bg-white dark:bg-slate-900 rounded-xl md:rounded-2xl border border-slate-200 dark:border-slate-800 p-4 md:p-6 shadow-xl flex flex-col gap-4 md:gap-6 text-left">
      
      {/* Top Header / App Name Mock */}
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 md:pb-4">
        <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base md:text-lg">Dashboard Analytics</h3>
        <div className="flex items-center gap-2 text-xs font-medium text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md">
          <span>Last 30 Days</span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
        {/* Card 1 */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-white dark:bg-slate-800 p-3 md:p-4 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm"
        >
          <p className="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-wide">AI Recommendations</p>
          <h3 className="mt-1 md:mt-2 text-xl md:text-2xl font-extrabold text-slate-900 dark:text-white">12,450</h3>
        </motion.div>
        {/* Card 2 */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="bg-white dark:bg-slate-800 p-3 md:p-4 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm"
        >
          <p className="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-wide">AI-Assisted Cart Adds</p>
          <h3 className="mt-1 md:mt-2 text-xl md:text-2xl font-extrabold text-slate-900 dark:text-white">3,142</h3>
        </motion.div>
        {/* Card 3 */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="bg-white dark:bg-slate-800 p-3 md:p-4 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm"
        >
          <p className="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-wide">Cart Conversion Rate</p>
          <h3 className="mt-1 md:mt-2 text-xl md:text-2xl font-extrabold text-slate-900 dark:text-white">25.2%</h3>
        </motion.div>
      </div>

      {/* Estimated Returns Saved */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }} whileInView={{ opacity: 1, scale: 1 }} transition={{ delay: 0.4 }}
        className="bg-amber-50 dark:bg-amber-900/10 p-4 md:p-6 rounded-xl border border-amber-200 dark:border-amber-700/50 flex flex-col justify-center relative overflow-hidden"
      >
        <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-amber-200/40 dark:from-amber-700/20 to-transparent pointer-events-none"></div>
        <p className="text-[11px] md:text-xs font-bold text-amber-700 dark:text-amber-500 uppercase tracking-wide">Estimated Returns Saved</p>
        <h3 className="mt-1 text-2xl md:text-4xl font-extrabold text-slate-900 dark:text-white flex items-baseline gap-2">
          428 <span className="text-sm md:text-lg font-semibold text-slate-500 dark:text-slate-400">items prevented</span>
        </h3>
      </motion.div>

      {/* Two columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        {/* Size Distribution */}
        <motion.div 
          initial={{ opacity: 0, x: -10 }} whileInView={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }}
          className="bg-white dark:bg-slate-800 p-4 md:p-5 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm"
        >
           <h4 className="font-bold text-slate-800 dark:text-slate-100 mb-3 md:mb-4 text-xs md:text-sm">Size Distribution</h4>
           <div className="flex flex-col gap-3">
             <div className="flex flex-col gap-1.5">
               <div className="flex justify-between text-[11px] md:text-xs font-medium text-slate-600 dark:text-slate-300"><span>Medium (M)</span><span>45%</span></div>
               <div className="w-full bg-slate-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                 <motion.div initial={{ width: 0 }} whileInView={{ width: "45%" }} transition={{ duration: 1, delay: 0.6 }} className="bg-brand-blue h-full rounded-full"></motion.div>
               </div>
             </div>
             <div className="flex flex-col gap-1.5">
               <div className="flex justify-between text-[11px] md:text-xs font-medium text-slate-600 dark:text-slate-300"><span>Large (L)</span><span>30%</span></div>
               <div className="w-full bg-slate-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                 <motion.div initial={{ width: 0 }} whileInView={{ width: "30%" }} transition={{ duration: 1, delay: 0.7 }} className="bg-brand-blue h-full rounded-full opacity-80"></motion.div>
               </div>
             </div>
             <div className="flex flex-col gap-1.5">
               <div className="flex justify-between text-[11px] md:text-xs font-medium text-slate-600 dark:text-slate-300"><span>Small (S)</span><span>15%</span></div>
               <div className="w-full bg-slate-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                 <motion.div initial={{ width: 0 }} whileInView={{ width: "15%" }} transition={{ duration: 1, delay: 0.8 }} className="bg-brand-blue h-full rounded-full opacity-60"></motion.div>
               </div>
             </div>
           </div>
        </motion.div>
        
        {/* Recent Events */}
        <motion.div 
          initial={{ opacity: 0, x: 10 }} whileInView={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }}
          className="bg-white dark:bg-slate-800 p-4 md:p-5 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col justify-between"
        >
           <h4 className="font-bold text-slate-800 dark:text-slate-100 mb-3 md:mb-4 text-xs md:text-sm">Recent Activity</h4>
           <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-2">
                 <div className="flex flex-col">
                   <span className="text-[11px] md:text-xs font-bold text-slate-800 dark:text-slate-200">Added to Cart</span>
                   <span className="text-[9px] md:text-[10px] text-slate-500">2 mins ago</span>
                 </div>
                 <span className="bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 text-[9px] md:text-[10px] font-bold px-2 py-1 rounded">Size: M</span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-2">
                 <div className="flex flex-col">
                   <span className="text-[11px] md:text-xs font-bold text-slate-800 dark:text-slate-200">Recommendation</span>
                   <span className="text-[9px] md:text-[10px] text-slate-500">15 mins ago</span>
                 </div>
                 <span className="bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400 text-[9px] md:text-[10px] font-bold px-2 py-1 rounded">Size: XL</span>
              </div>
              <div className="flex items-center justify-between">
                 <div className="flex flex-col">
                   <span className="text-[11px] md:text-xs font-bold text-slate-800 dark:text-slate-200">Added to Cart</span>
                   <span className="text-[9px] md:text-[10px] text-slate-500">1 hour ago</span>
                 </div>
                 <span className="bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 text-[9px] md:text-[10px] font-bold px-2 py-1 rounded">Size: L</span>
              </div>
           </div>
        </motion.div>
      </div>

    </div>
  );
}
