import React, { useState, useEffect, useMemo } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { useSmartFit } from '../hooks/useSmartFit';
import { predictBestSize } from '../lib/size-engine';
import { detectProductCategory } from '../lib/utils';
import HumanBodyModel from './HumanBodyModel';
import { t } from '../lib/i18n';

// ZOOM KOORDİNATLARI (AYNEN KALIYOR)
const ZOOM_CONFIG = {
  top: {
    shoulder: "50 30 200 200",
    chest: "50 80 200 200",
    waist: "50 180 200 200",
    arm: "0 80 300 300",
    length: "50 100 200 300",
    full: "50 30 200 350" // Odaklanmış ve büyütülmüş görünüm
  },
  bottom: {
    waist: "50 150 200 200",
    hip: "50 200 200 200",
    inseam: "80 250 140 300",
    outseam: "0 200 300 400",
    length: "50 200 200 350",
    full: "0 150 300 450"
  }
};

const FitAnalyzer = ({ userProfile, onClose, onUpdateProfile, onProfileDeleted, onProfileUpdated, productData }) => {
  if (!productData) return null;
  const [activeZone, setActiveZone] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const svgControls = useAnimation();
  
  const category = detectProductCategory(productData.category, productData.name);
  const fitType = productData.fit_type || 'regular';
  const coords = ZOOM_CONFIG[category];

  const isImperial = productData.shops?.unit_system === 'imperial' || productData.unit_system === 'imperial';
  const unitLabel = isImperial ? 'in' : 'cm';
  const displayVal = (val) => {
      if (!val && val !== 0) return '?';
      if (isImperial) return (val / 2.54).toFixed(1);
      return Math.round(val * 10) / 10;
  };

  // AI Size Prediction
  const aiPrediction = useMemo(() => {
    if (!userProfile?.measurements || !productData?.size_data) return null;
    return predictBestSize(userProfile, productData.size_data, category, fitType);
  }, [userProfile, productData, category, fitType]);

  const hasRecommendation = aiPrediction && aiPrediction.size !== productData.size;
  const lang = productData.shops?.language || 'en';

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
      outseam: getResult('outseam'),
      length: getResult('length')
  };

  // Liste Elemanlarını Hazırla
  let listItems = [];
  if (category === 'top') {
    listItems = [
      { id: 'shoulder', name: t('shoulder', lang), data: results.shoulder },
      { id: 'chest', name: t('chest', lang), data: results.chest },
      { id: 'waist', name: t('waist', lang), data: results.waist },
      { id: 'arm', name: t('armLength', lang), data: results.arm },
      { id: 'length', name: t('totalLength', lang), data: results.length },
    ];
  } else {
    listItems = [
      { id: 'waist', name: t('waist', lang), data: results.waist },
      { id: 'hip', name: t('hip', lang), data: results.hip },
      { id: 'length', name: t('length', lang), data: results.length },
      { id: 'inseam', name: t('inseam', lang), data: results.inseam },
      { id: 'outseam', name: t('outseam', lang), data: results.outseam },
    ];
  }

  // Sadece verisi olan (No Data olmayan) alanları göster
  const filteredListItems = listItems.filter(item => item.data.status !== 'No Data');
  // --- DEĞİŞİKLİK BURADA BİTİYOR ---

  // --- AŞAĞISI SENİN ORİJİNAL KODUNLA AYNI ---
  
  useEffect(() => {
    if(!isReady) return;
    const runAnimationSequence = async () => {
      await new Promise(resolve => setTimeout(resolve, 500));
      // Dar olan bölgelere zoom yap
      const tightZones = filteredListItems.filter(item => item.data.status && item.data.status.includes('Tight')).map(i => i.id);
      
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

  let historyList = userProfile?.preferences?.history || [];
  
  // Backward compatibility: If no history array exists but we have a reference brand, mock a history item
  if (historyList.length === 0 && userProfile?.preferences?.reference_brand) {
    historyList = [{
      id: 'legacy-1',
      brand: userProfile.preferences.reference_brand,
      size: userProfile.preferences.reference_size,
      category: category,
      measurements: userProfile.measurements,
      preference: userProfile.preferences.default_fit
    }];
  }

  const handleDeleteHistory = (id) => {
    const updatedHistory = historyList.filter(h => h.id !== id);
    if (updatedHistory.length === 0) {
      if (onProfileDeleted) onProfileDeleted();
    } else {
      const newProfile = { ...userProfile };
      newProfile.preferences = { ...newProfile.preferences, history: updatedHistory };
      newProfile.preferences.reference_brand = updatedHistory[0].brand;
      newProfile.preferences.reference_size = updatedHistory[0].size;
      newProfile.preferences.default_fit = updatedHistory[0].preference;
      newProfile.measurements = updatedHistory[0].measurements;
      if (onProfileUpdated) onProfileUpdated(newProfile);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/60 backdrop-blur-sm p-4 md:p-6 font-sans text-zinc-900">
      <motion.div initial={{ y: 50, opacity: 0, scale: 0.95 }} animate={{ y: 0, opacity: 1, scale: 1 }} transition={{ type: "spring", damping: 25, stiffness: 200 }} className="bg-white w-full h-[85vh] md:max-w-4xl md:h-[80vh] rounded-[1.5rem] md:rounded-[2rem] flex flex-col overflow-hidden shadow-2xl relative">
        
        {/* HEADER */}
        <div className="flex-none flex items-center justify-between px-6 py-4 md:px-8 md:py-5 border-b border-zinc-100 bg-white z-[60]">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`w-2 h-2 rounded-full animate-pulse ${score > 80 ? 'bg-emerald-500' : 'bg-yellow-500'}`}></span>
              <span className="text-[10px] uppercase tracking-widest text-zinc-400 font-semibold">{t('liveFitAnalysis', lang)}</span>
            </div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg md:text-xl font-medium tracking-tight text-zinc-800 truncate max-w-[200px] sm:max-w-none">
                {productData.name} <span className="font-light text-zinc-500 ml-1">({productData.size})</span>
              </h2>
            </div>
            {aiPrediction && aiPrediction.score > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 mt-1.5 bg-indigo-50/60 w-fit px-2.5 py-1.5 rounded-lg border border-indigo-100/50">
                <span className="text-xs md:text-sm leading-none">✨</span>
                <span className="text-[10px] md:text-xs font-semibold text-indigo-700 tracking-tight leading-none">
                  {t('aiRecommends', lang)}: {aiPrediction.size}
                </span>
                <span className="text-[9px] md:text-[10px] text-indigo-600 font-bold bg-white/60 px-1.5 py-0.5 rounded shadow-sm leading-none ml-0.5">
                  {aiPrediction.score}% {t('match', lang)}
                </span>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2 sm:gap-3 shrink-0 relative">
            {historyList.length > 0 && (
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="flex items-center justify-center rounded-full border border-zinc-200 hover:bg-zinc-100 transition-colors h-8 px-3 text-[11px] font-medium md:h-9 md:px-4 md:text-xs md:font-semibold text-zinc-800"
              >
                {t('historyBtn', lang)}
              </button>
            )}

            {showHistory && historyList.length > 0 && (
              <div className="absolute top-12 right-12 w-64 md:w-72 bg-white rounded-xl shadow-xl border border-zinc-100 p-2 z-50 overflow-hidden">
                <div className="text-xs font-bold text-zinc-400 px-3 py-2 uppercase tracking-wider border-b border-zinc-50 mb-2">{t('savedReferences', lang)}</div>
                <div className="max-h-60 overflow-y-auto pr-1">
                  {historyList.map(item => (
                    <div key={item.id} className="flex items-center justify-between p-2 hover:bg-zinc-50 rounded-lg group">
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-zinc-800 capitalize">{item.brand}</span>
                        <span className="text-[11px] text-zinc-500 capitalize">{t(item.subCategory || item.category, lang)} - {item.size}</span>
                      </div>
                      <button 
                        onClick={() => handleDeleteHistory(item.id)}
                        className="text-red-500 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-md opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button 
              onClick={onUpdateProfile} 
              className="flex items-center justify-center rounded-full border border-zinc-200 hover:bg-zinc-100 transition-colors h-8 px-3 text-[11px] font-medium md:h-9 md:px-4 md:text-xs md:font-semibold text-zinc-800"
            >
              {t('editBtn', lang)}
            </button>
            <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full text-zinc-400 hover:text-zinc-800 hover:bg-zinc-100 h-10 w-10 sm:h-11 sm:w-11 active:scale-95 transition-transform bg-zinc-50 border border-transparent hover:border-zinc-200">
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M6 18L18 6M6 6l12 12"></path></svg>
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
                  subCategory={productData.sub_category}
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
              {category === 'top' ? t('topBodyFit', lang) : t('bottomBodyFit', lang)}
            </motion.h3>
            
            <div className="flex flex-col gap-2.5 md:gap-3">
              {filteredListItems.map((item, index) => (
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
                        <span title={t('yourSize', lang)}>{displayVal(item.data.user)} {unitLabel}</span>
                        <svg className="w-2.5 h-2.5 text-zinc-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                        <span title={t('productSize', lang)} className="text-zinc-600 font-semibold">{displayVal(item.data.product)} {unitLabel}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end flex-shrink-0 ml-2">
                    <span className="whitespace-nowrap text-[9px] uppercase tracking-widest px-2.5 py-1 rounded-md font-semibold border" style={{ color: item.data.color, backgroundColor: `${item.data.color}15`, borderColor: `${item.data.color}30` }}>
                      {item.data.status ? t('status' + item.data.status.replace(/\s+/g, ''), lang) : t('noData', lang)} {item.data.status !== 'No Data' && `(${displayVal(item.data.delta)}${unitLabel})`}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="flex-none bg-zinc-900 text-white flex flex-col sm:flex-row items-center justify-between p-5 md:px-8 md:py-5 relative overflow-hidden">
             <div className="absolute right-0 top-0 w-64 h-full bg-gradient-to-l from-blue-500/20 to-transparent blur-2xl"></div>
              <div className="flex items-center gap-3 md:gap-4 relative z-10 w-full sm:w-3/4 mb-4 sm:mb-0">
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                  {hasRecommendation ? ( <span className="text-lg">✨</span> ) : ( <svg className="w-4 h-4 md:w-5 md:h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg> )}
                </div>
                {hasRecommendation ? (
                  <p 
                    className="text-[11px] md:text-sm font-light text-zinc-300 leading-tight md:leading-relaxed pr-2"
                    dangerouslySetInnerHTML={{ __html: `${t('recommendationText', lang, { preference: `<strong class="text-white">${aiPrediction.preference}</strong>`, recSize: `<strong class="text-indigo-400 text-sm md:text-base">${aiPrediction.size}</strong>`, prodSize: productData.size })} ${aiPrediction.score > 0 ? `<span class="text-white bg-white/10 px-1.5 py-0.5 rounded ml-1">${t('withAccuracy', lang, { score: aiPrediction.score })}</span>` : ''}` }}
                  />
                ) : (
                  <p 
                    className="text-[11px] md:text-sm font-light text-zinc-300 leading-tight md:leading-relaxed pr-2"
                    dangerouslySetInnerHTML={{ __html: aiPrediction && aiPrediction.score > 0 
                      ? `${t('perfectMatchText', lang, { prodSize: `<strong class="text-emerald-400">${productData.size}</strong>` })} (<strong class="text-white">${t('withAccuracy', lang, { score: aiPrediction.score })}</strong>)` 
                      : t('analysisBaseText', lang) 
                    }}
                  />
                )}
              </div>
              <Button variant="secondary" className="relative z-10 w-full sm:w-auto h-10 md:h-11 px-8 md:px-8 rounded-full text-[12px] md:text-sm font-medium shadow-lg active:scale-95 transition-transform">{t('addToCart', lang)}</Button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default FitAnalyzer;
