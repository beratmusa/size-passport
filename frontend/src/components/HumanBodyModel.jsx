import React from 'react';
import { motion } from 'framer-motion';

const HumanBodyModel = ({ category, results, activeZone, svgControls, coords }) => {
  return (
    <motion.svg initial={{ viewBox: coords.full }} animate={svgControls} className="h-[90%] w-auto relative z-0 drop-shadow-sm">
      <defs>
        <filter id="thermal" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="12" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>
      {category === 'top' ? (
        <>
          <g className="text-zinc-300 stroke-current fill-none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M 130 50 C 130 30, 170 30, 170 50 C 170 70, 160 80, 150 90 C 140 80, 130 70, 130 50 Z" />
            <path d="M 150 90 Q 150 110 195 120 L 220 280 M 150 90 Q 150 110 105 120 L 80 280" />
            <path d="M 115 125 L 125 320 Q 150 330 175 320 L 185 125" />
            <path d="M 125 320 L 105 540 L 125 550 L 145 350 M 175 320 L 195 540 L 175 550 L 155 350" />
          </g>
          <g filter="url(#thermal)" className="mix-blend-multiply opacity-70">
            <ellipse cx="150" cy="115" rx="55" ry="18" fill={results.shoulder?.color || '#a1a1aa'} className={`transition-all duration-700 ${activeZone && activeZone !== 'shoulder' ? 'opacity-5 scale-95' : 'opacity-100 scale-100'}`} />
            <ellipse cx="150" cy="170" rx="42" ry="25" fill={results.chest?.color || '#a1a1aa'} className={`transition-all duration-700 ${activeZone && activeZone !== 'chest' ? 'opacity-5 scale-95' : 'opacity-100 scale-100'}`} />
            <ellipse cx="150" cy="270" rx="38" ry="22" fill={results.waist?.color || '#a1a1aa'} className={`transition-all duration-700 ${activeZone && activeZone !== 'waist' ? 'opacity-5 scale-95' : 'opacity-100 scale-100'}`} />
            <g className={`transition-all duration-700 ${activeZone && activeZone !== 'arm' ? 'opacity-5' : 'opacity-100'}`}>
              <line x1="108" y1="140" x2="85" y2="250" stroke={results.arm?.color || '#a1a1aa'} strokeWidth="20" strokeLinecap="round" />
              <line x1="192" y1="140" x2="215" y2="250" stroke={results.arm?.color || '#a1a1aa'} strokeWidth="20" strokeLinecap="round" />
            </g>
          </g>
        </>
      ) : (
        <>
          <g className="text-zinc-300 stroke-current fill-none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M 110 180 Q 150 190 190 180" />
            <path d="M 110 180 Q 90 220 100 350 L 85 550 L 115 560 L 145 280" /> 
            <path d="M 190 180 Q 210 220 200 350 L 215 550 L 185 560 L 155 280" /> 
            <path d="M 145 280 Q 150 290 155 280" />
          </g>
          <g filter="url(#thermal)" className="mix-blend-multiply opacity-70">
            <ellipse cx="150" cy="180" rx="40" ry="12" fill={results.waist?.color || '#a1a1aa'} className={`transition-all duration-700 ${activeZone && activeZone !== 'waist' ? 'opacity-5 scale-95' : 'opacity-100 scale-100'}`} />
            <ellipse cx="150" cy="230" rx="55" ry="15" fill={results.hip?.color || '#a1a1aa'} className={`transition-all duration-700 ${activeZone && activeZone !== 'hip' ? 'opacity-5 scale-95' : 'opacity-100 scale-100'}`} />
            <g className={`transition-all duration-700 ${activeZone && activeZone !== 'inseam' ? 'opacity-5' : 'opacity-100'}`}>
               <line x1="145" y1="280" x2="115" y2="560" stroke={results.inseam?.color || '#a1a1aa'} strokeWidth="15" strokeLinecap="round" />
               <line x1="155" y1="280" x2="185" y2="560" stroke={results.inseam?.color || '#a1a1aa'} strokeWidth="15" strokeLinecap="round" />
            </g>
            <g className={`transition-all duration-700 ${activeZone && activeZone !== 'outseam' ? 'opacity-5' : 'opacity-100'}`}>
               <line x1="100" y1="220" x2="85" y2="550" stroke={results.outseam?.color || '#a1a1aa'} strokeWidth="10" strokeLinecap="round" />
               <line x1="200" y1="220" x2="215" y2="550" stroke={results.outseam?.color || '#a1a1aa'} strokeWidth="10" strokeLinecap="round" />
            </g>
          </g>
        </>
      )}
    </motion.svg>
  );
};

export default HumanBodyModel;
