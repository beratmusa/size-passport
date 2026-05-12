import React, { useState, useEffect, useMemo } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { useSmartFit } from '../hooks/useSmartFit';
import { predictBestSize } from '../lib/size-engine';
import HumanBodyModel from './HumanBodyModel';

// ZOOM KOORDİNATLARI (AYNEN KALIYOR)
const ZOOM_CONFIG = {
  top: {
    shoulder: "50 30 200 200",
    chest: "50 80 200 200",
    waist: "50 180 200 200",
    arm: "0 80 300 300",
    full: "0 0 300 600"
  },
  bottom: {
    waist: "50 150 200 200",
    hip: "50 200 200 200",
    inseam: "80 250 140 300",
    outseam: "0 200 300 400",
    full: "0 150 300 450"
  }
};

const FitAnalyzer = ({ userProfile, onClose, onUpdateProfile, productData }) => {
  if (!productData) return null;
  const [activeZone, setActiveZone] = useState(null);
  const svgControls = useAnimation();
  
  const category = productData.category === 'bottom' ? 'bottom' : 'top';
  const coords = ZOOM_CONFIG[category];

  // AI Size Prediction
  const aiPrediction = useMemo(() => {
    if (!userProfile?.measurements || !productData?.size_data) return null;
    return predictBestSize(userProfile, productData.size_data, productData.category);
  }, [userProfile, productData]);

  const hasRecommendation = aiPrediction && aiPrediction.size !== productData.size;

  // --- DEĞİŞİKLİK BURADA BAŞLIYOR ---
  // Hook kullanarak hesaplamayı dışarıdan alıyoruz
  const { isReady, score, recommendation, details } = useSmartFit(
      productData.measurements || productData.metafields, 
      userProfile, 
      category
  );

  // Hook'tan gelen "details" dizisini, UI'ın beklediği "results" objesine çeviriyoruz
  // Böylece aşağıdaki SVG kodlarını değiştirmek zorunda kalmıyoruz.
  const getResult = (part) => {
      const d = details?.find(d => d.part === part);
      return d || { status: 'No Data', color: '#a1a1aa', bg: 'bg-zinc-400', delta: 0 };
  };

  const results = {
      shoulder: getResult('shoulder'),
      chest: getResult('chest'),
      waist: getResult('waist'),
      arm: getResult('arm'),
      hip: getResult('hip'),
      inseam: getResult('inseam'),
      outseam: getResult('outseam')
  };

  // Liste Elemanlarını Hazırla
  let listItems = [];
  if (category === 'top') {
    listItems = [
      { id: 'shoulder', name: 'Shoulder', data: results.shoulder },
      { id: 'chest', name: 'Chest', data: results.chest },
      { id: 'waist', name: 'Waist', data: results.waist },
      { id: 'arm', name: 'Arm Length', data: results.arm },
    ];
  } else {
    listItems = [
      { id: 'waist', name: 'Waist', data: results.waist },
      { id: 'hip', name: 'Hips', data: results.hip },
      { id: 'inseam', name: 'Inseam', data: results.inseam },
      { id: 'outseam', name: 'Outseam', data: results.outseam },
    ];
  }
  // --- DEĞİŞİKLİK BURADA BİTİYOR ---

  // --- AŞAĞISI SENİN ORİJİNAL KODUNLA AYNI ---
  
  useEffect(() => {
    if(!isReady) return;
    const runAnimationSequence = async () => {
      await new Promise(resolve => setTimeout(resolve, 500));
      // Dar olan bölgelere zoom yap
      const tightZones = listItems.filter(item => item.data.status === 'Dar').map(i => i.id);
      
      for (const zone of tightZones) {
        setActiveZone(zone);
        await svgControls.start({ viewBox: coords[zone], transition: { duration: 1, ease: [0.25, 1, 0.5, 1] } });
        await new Promise(resolve => setTimeout(resolve, 1200));
      }
      setActiveZone(null);
      await svgControls.start({ viewBox: coords.full, transition: { duration: 1, ease: [0.25, 1, 0.5, 1] } });
    };
    runAnimationSequence();
  }, [svgControls, category, isReady]);

  if (!isReady) return null;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/60 backdrop-blur-sm p-0 md:p-6 font-sans text-zinc-900">
      <motion.div initial={{ y: 50, opacity: 0, scale: 0.95 }} animate={{ y: 0, opacity: 1, scale: 1 }} transition={{ type: "spring", damping: 25, stiffness: 200 }} className="bg-white w-full h-full md:max-w-4xl md:h-[80vh] md:rounded-[2rem] flex flex-col overflow-hidden shadow-2xl">
        
        {/* HEADER */}
        <div className="flex-none flex items-center justify-between px-6 py-4 md:px-8 md:py-5 border-b border-zinc-100 bg-white z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`w-2 h-2 rounded-full animate-pulse ${score > 80 ? 'bg-emerald-500' : 'bg-yellow-500'}`}></span>
              <span className="text-[10px] uppercase tracking-widest text-zinc-400 font-semibold">Live Fit Analysis</span>
            </div>
            <h2 className="text-lg md:text-xl font-medium tracking-tight text-zinc-800 truncate max-w-[150px] sm:max-w-none">
              {productData.name} <span className="font-light text-zinc-500 ml-1">({productData.size})</span>
            </h2>
            {aiPrediction && (
              <div className="flex items-center gap-1.5 mt-1">
                <span className="text-sm">✨</span>
                <span className="text-[10px] sm:text-xs font-medium text-indigo-600">
                  AI Recommends: <strong>{aiPrediction.size}</strong>
                </span>
                <span className="hidden xs:inline text-[9px] text-zinc-400">({aiPrediction.score}% match)</span>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2 md:gap-4">
            <Button variant="outline" onClick={onUpdateProfile} className="flex rounded-full text-[10px] md:text-xs uppercase tracking-wider h-8 md:h-9 px-3 md:px-4 border-zinc-200 text-zinc-600 hover:text-zinc-900">
              Update Passport
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full text-zinc-400 hover:text-zinc-800 hover:bg-zinc-100 h-8 w-8 md:h-10 md:w-10">
              <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M6 18L18 6M6 6l12 12"></path></svg>
            </Button>
          </div>
        </div>

        {/* ORTA İÇERİK */}
        <div className="flex-1 flex flex-col md:flex-row overflow-y-auto bg-[#F6F6F6] min-h-0">
          
          {/* SVG ALANI */}
          <div className="w-full md:w-1/2 flex items-center justify-center p-6 md:p-12 relative min-h-[300px] md:min-h-0 bg-zinc-50/50">
             <div className="w-full h-full max-h-[400px] md:max-h-[550px] flex items-center justify-center">
               <HumanBodyModel 
                  category={category} 
                  results={results} 
                  activeZone={activeZone} 
                  svgControls={svgControls} 
                  coords={coords} 
               />
             </div>
          </div>

          {/* LİSTELER (SAĞ TARAF) */}
          <div className="w-full md:w-1/2 p-5 md:p-8 flex flex-col justify-center bg-white border-l border-zinc-100 z-10">
            <motion.h3 className="text-[10px] md:text-sm uppercase tracking-[0.2em] text-zinc-400 font-semibold mb-4 md:mb-6">
              {category === 'top' ? 'Top Body Fit' : 'Bottom Body Fit'}
            </motion.h3>
            
            <div className="flex flex-col gap-2.5 md:gap-3">
              {listItems.map((item, index) => (
                <motion.div 
                  key={item.id}
                  initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 + (index * 0.1) }}
                  onMouseEnter={() => { setActiveZone(item.id); svgControls.start({ viewBox: ZOOM_CONFIG[category][item.id], transition: { duration: 0.6 }}); }}
                  onMouseLeave={() => { setActiveZone(null); svgControls.start({ viewBox: ZOOM_CONFIG[category].full, transition: { duration: 0.6 }}); }}
                  className="group flex items-center justify-between p-3 rounded-xl border border-zinc-100 hover:border-zinc-300 hover:shadow-sm bg-white cursor-pointer transition-colors duration-300"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${item.data.bg} shadow-inner`}></div>
                    <div className="flex flex-col items-start gap-0.5">
                      <span className="text-[11px] md:text-sm font-medium text-zinc-700 leading-none">{item.name}</span>
                      <div className="flex items-center gap-1 text-[9px] text-zinc-400 font-mono">
                        <span title="Your Size">{item.data.user || '?'} cm</span>
                        <svg className="w-2.5 h-2.5 text-zinc-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                        <span title="Product Size" className="text-zinc-600 font-semibold">{item.data.product || '?'} cm</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end flex-shrink-0 ml-2">
                    <span className="whitespace-nowrap text-[9px] uppercase tracking-widest px-2.5 py-1 rounded-md font-semibold border" style={{ color: item.data.color, backgroundColor: `${item.data.color}15`, borderColor: `${item.data.color}30` }}>
                      {item.data.status} {item.data.status !== 'No Data' && `(${item.data.delta}cm)`}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="flex-none bg-zinc-900 text-white flex flex-col sm:flex-row items-center justify-between p-4 md:px-8 md:py-5 relative overflow-hidden">
             <div className="absolute right-0 top-0 w-64 h-full bg-gradient-to-l from-blue-500/20 to-transparent blur-2xl"></div>
              <div className="flex items-center gap-3 md:gap-4 relative z-10 w-full sm:w-3/4 mb-3 sm:mb-0">
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                  {hasRecommendation ? ( <span className="text-lg">✨</span> ) : ( <svg className="w-4 h-4 md:w-5 md:h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg> )}
                </div>
                {hasRecommendation ? (
                  <p className="text-[10px] md:text-sm font-light text-zinc-300 leading-tight md:leading-relaxed pr-2">
                    Based on your <strong className="text-white">{aiPrediction.preference}</strong> fit preference, we recommend size <strong className="text-indigo-400 text-sm md:text-base">{aiPrediction.size}</strong> instead of {productData.size}.
                  </p>
                ) : (
                  <p className="text-[10px] md:text-sm font-light text-zinc-300 leading-tight md:leading-relaxed pr-2">
                    {aiPrediction ? (
                      <>Size <strong className="text-emerald-400">{productData.size}</strong> is your match! ({aiPrediction.score}% fit score)</>
                    ) : (
                      <>Analysis based on your measurements and preference.</>
                    )}
                  </p>
                )}
              </div>
              <Button variant="secondary" className="relative z-10 w-full sm:w-auto h-9 md:h-11 px-6 md:px-8 rounded-full text-[10px] md:text-sm font-medium">Add to Cart</Button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default FitAnalyzer;