"use client";
import { motion } from 'framer-motion';

export function HeroHumanBody() {
  return (
    <div className="relative w-full h-full min-h-[400px] flex items-center justify-center p-4">
      
      {/* Decorative scanning line */}
      <motion.div 
        className="absolute left-1/2 -translate-x-1/2 w-[200px] md:w-[280px] h-[2px] bg-brand-lime/70 blur-[1px] z-20"
        animate={{ top: ["10%", "90%", "10%"] }}
        transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
      />

      {/* Floating Status Badges (Individual) */}
      <motion.div 
        className="absolute top-[15%] md:top-[20%] right-[5%] md:right-[15%] glass-panel px-2.5 md:px-3 py-1 md:py-1.5 rounded-full border border-[#10b981]/30 text-[10px] md:text-xs font-bold text-slate-700 dark:text-white shadow-lg z-10 flex items-center gap-2"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.5 }}
      >
        <span>Shoulder</span>
        <span className="text-[#10b981]">Good</span>
      </motion.div>

      <motion.div 
        className="absolute top-[35%] md:top-[38%] left-[2%] md:left-[10%] glass-panel px-2.5 md:px-3 py-1 md:py-1.5 rounded-full border border-[#6366f1]/30 text-[10px] md:text-xs font-bold text-slate-700 dark:text-white shadow-lg z-10 flex items-center gap-2"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.7 }}
      >
        <span>Chest</span>
        <span className="text-[#6366f1]">Loose</span>
      </motion.div>

      <motion.div 
        className="absolute top-[50%] md:top-[55%] right-[2%] md:right-[8%] glass-panel px-2.5 md:px-3 py-1 md:py-1.5 rounded-full border border-[#3b82f6]/30 text-[10px] md:text-xs font-bold text-slate-700 dark:text-white shadow-lg z-10 flex items-center gap-2"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.9 }}
      >
        <span>Arms</span>
        <span className="text-[#3b82f6]">Loose</span>
      </motion.div>

      <motion.div 
        className="absolute top-[65%] md:top-[70%] left-[5%] md:left-[15%] glass-panel px-2.5 md:px-3 py-1 md:py-1.5 rounded-full border border-[#f59e0b]/30 text-[10px] md:text-xs font-bold text-slate-700 dark:text-white shadow-lg z-10 flex items-center gap-2"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 1.1 }}
      >
        <span>Waist</span>
        <span className="text-[#f59e0b]">Tight</span>
      </motion.div>

      <motion.svg 
        viewBox="0 0 300 600" 
        className="h-full w-full max-h-[500px] relative z-0 drop-shadow-[0_0_20px_rgba(178,230,56,0.15)] dark:drop-shadow-[0_0_30px_rgba(178,230,56,0.2)]"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1, ease: "easeOut" }}
      >
        {/* Human Body Outline (Derived from their code) */}
        <g className="text-slate-600 dark:text-slate-400 stroke-current fill-none" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            {/* Head & Torso */}
            <motion.path 
              d="M 130 50 C 130 30, 170 30, 170 50 C 170 70, 160 80, 150 90 C 140 80, 130 70, 130 50 Z" 
              stroke="currentColor"
              initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.5 }}
            />
            <motion.path 
              d="M 150 90 Q 150 110 195 120 L 220 280 M 150 90 Q 150 110 105 120 L 80 280" 
              stroke="currentColor"
              initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.5, delay: 0.2 }}
            />
            <motion.path 
              d="M 115 125 L 125 320 Q 150 330 175 320 L 185 125" 
              stroke="currentColor"
              initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.5, delay: 0.4 }}
            />
            {/* Legs (from lower body model) */}
            <motion.path 
              d="M 125 320 Q 110 420 100 550" 
              stroke="currentColor"
              initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.5, delay: 0.6 }}
            /> 
            <motion.path 
              d="M 175 320 Q 190 420 200 550" 
              stroke="currentColor"
              initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.5, delay: 0.6 }}
            /> 
        </g>

        {/* Heatmap Zones (Animated) */}
        <motion.g 
          className="opacity-90"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.9 }}
          transition={{ duration: 2, delay: 1 }}
        >
          {/* Blur filters manually applied to shapes for better browser support */}
          {/* Shoulders - Perfect Fit (#10b981) */}
          <motion.ellipse 
            cx="150" cy="115" rx="55" ry="15" fill="#10b981" filter="blur(8px)"
            animate={{ scale: [1, 1.05, 1], opacity: [0.6, 0.9, 0.6] }} 
            transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }} 
          />
          {/* Chest - Slightly Loose (#6366f1) */}
          <motion.ellipse 
            cx="150" cy="170" rx="45" ry="22" fill="#6366f1" filter="blur(12px)"
            animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.8, 0.5] }} 
            transition={{ repeat: Infinity, duration: 4, ease: "easeInOut", delay: 1 }} 
          />
          {/* Waist - Slightly Tight (#f59e0b) */}
          <motion.ellipse 
            cx="150" cy="280" rx="35" ry="18" fill="#f59e0b" filter="blur(10px)"
            animate={{ scale: [1, 1.05, 1], opacity: [0.6, 0.9, 0.6] }} 
            transition={{ repeat: Infinity, duration: 3.5, ease: "easeInOut", delay: 0.5 }} 
          />
          {/* Hips - Perfect Fit (#10b981) */}
          <motion.ellipse 
            cx="150" cy="330" rx="45" ry="15" fill="#10b981" filter="blur(8px)"
            animate={{ scale: [1, 1.08, 1], opacity: [0.5, 0.7, 0.5] }} 
            transition={{ repeat: Infinity, duration: 3, ease: "easeInOut", delay: 0.2 }} 
          />
          
          {/* Arms - Too Loose (#3b82f6) */}
          <line x1="108" y1="140" x2="85" y2="250" stroke="#3b82f6" strokeWidth="15" strokeLinecap="round" filter="blur(8px)" opacity="0.6" />
          <line x1="192" y1="140" x2="215" y2="250" stroke="#3b82f6" strokeWidth="15" strokeLinecap="round" filter="blur(8px)" opacity="0.6" />
          
          {/* Center measuring line */}
          <motion.line 
            x1="150" y1="90" x2="150" y2="400" 
            stroke="#10b981" strokeWidth="4" strokeLinecap="round" strokeDasharray="8,8"
            animate={{ strokeDashoffset: [0, -16] }}
            transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
          />
        </motion.g>
      </motion.svg>
    </div>
  );
}
