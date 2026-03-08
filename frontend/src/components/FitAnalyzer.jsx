import React, { useState, useEffect } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { useSmartFit } from '../hooks/useSmartFit'; // <--- YENİ EKLENTİ

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
      // Eğer veri yoksa varsayılan gri döndür
      return d || { status: 'Veri Yok', color: '#a1a1aa', bg: 'bg-zinc-400', delta: 0 };
  };

  const results = {
      shoulder: getResult('shoulder'),
      chest: getResult('chest'),
      waist: getResult('waist'),
      arm: getResult('arm'),
      hip: getResult('hip'),
      inseam: getResult(category === 'bottom' ? 'length' : 'inseam'), // length -> inseam
      outseam: getResult('outseam')
  };

  // Liste Elemanlarını Hazırla
  let listItems = [];
  if (category === 'top') {
    listItems = [
      { id: 'shoulder', name: 'Omuz Genişliği', data: results.shoulder },
      { id: 'chest', name: 'Göğüs Çevresi', data: results.chest },
      { id: 'waist', name: 'Bel Çevresi', data: results.waist },
      { id: 'arm', name: 'Kol Boyu', data: results.arm },
    ];
  } else {
    listItems = [
      { id: 'waist', name: 'Bel Çevresi', data: results.waist },
      { id: 'hip', name: 'Basen/Kalça', data: results.hip },
      { id: 'inseam', name: 'İç Bacak', data: results.inseam },
      { id: 'outseam', name: 'Dış Bacak', data: results.outseam },
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
              <span className="text-[10px] uppercase tracking-widest text-zinc-400 font-semibold">Canlı Beden Analizi</span>
            </div>
            <h2 className="text-lg md:text-xl font-medium tracking-tight text-zinc-800">
              {productData.name} <span className="font-light text-zinc-500 ml-1">({productData.size})</span>
            </h2>
          </div>
          
          <div className="flex items-center gap-2 md:gap-4">
            <Button variant="outline" onClick={onUpdateProfile} className="hidden sm:flex rounded-full text-[10px] md:text-xs uppercase tracking-wider h-8 md:h-9 px-4 border-zinc-200 text-zinc-600 hover:text-zinc-900">
              Pasaportu Güncelle
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full text-zinc-400 hover:text-zinc-800 hover:bg-zinc-100 h-8 w-8 md:h-10 md:w-10">
              <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M6 18L18 6M6 6l12 12"></path></svg>
            </Button>
          </div>
        </div>

        {/* ORTA İÇERİK */}
        <div className="flex-1 flex flex-col md:flex-row overflow-y-auto md:overflow-hidden bg-[#F6F6F6]">
          
          {/* SVG ALANI (Senin Orijinal SVG Kodların Buraya Gelecek) */}
          <div className="w-full md:w-1/2 flex items-center justify-center p-4 md:p-8 relative min-h-[400px] md:min-h-0">
             {/* ... SVG KODUNU AYNEN KORUYORUZ ... */}
             {/* Not: Buradaki <motion.svg> içeriği senin attığın dosyadakiyle birebir aynı kalacak. */}
             {/* Sadece `fill={results.shoulder.color}` gibi kısımlar zaten yukarıda results objesini tanımladığımız için çalışacak. */}
             
             <motion.svg initial={{ viewBox: coords.full }} animate={svgControls} className="h-[90%] w-auto relative z-0 drop-shadow-sm">
                {/* ... SVG İÇERİĞİ (Senin dosyadakiyle aynı) ... */}
                {/* Örn: <ellipse cx="150" cy="115" rx="55" ry="18" fill={results.shoulder.color} ... /> */}
                {/* SVG Kodunu buraya kopyala-yapıştır yapman yeterli, results objesi uyumlu hale getirildi. */}
                
                {/* Senin dosyadaki SVG içeriğini buraya aynen yapıştıracağım: */}
                 <defs><filter id="thermal" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="12" result="blur" /><feComposite in="SourceGraphic" in2="blur" operator="over" /></filter></defs>
                  {category === 'top' ? (
                    <>
                      <g className="text-zinc-300 stroke-current fill-none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M 130 50 C 130 30, 170 30, 170 50 C 170 70, 160 80, 150 90 C 140 80, 130 70, 130 50 Z" />
                        <path d="M 150 90 Q 150 110 195 120 L 220 280 M 150 90 Q 150 110 105 120 L 80 280" />
                        <path d="M 115 125 L 125 320 Q 150 330 175 320 L 185 125" />
                        <path d="M 125 320 L 105 540 L 125 550 L 145 350 M 175 320 L 195 540 L 175 550 L 155 350" />
                      </g>
                      <g filter="url(#thermal)" className="mix-blend-multiply opacity-70">
                        <ellipse cx="150" cy="115" rx="55" ry="18" fill={results.shoulder.color} className={`transition-all duration-700 ${activeZone && activeZone !== 'shoulder' ? 'opacity-5 scale-95' : 'opacity-100 scale-100'}`} />
                        <ellipse cx="150" cy="170" rx="42" ry="25" fill={results.chest.color} className={`transition-all duration-700 ${activeZone && activeZone !== 'chest' ? 'opacity-5 scale-95' : 'opacity-100 scale-100'}`} />
                        <ellipse cx="150" cy="270" rx="38" ry="22" fill={results.waist.color} className={`transition-all duration-700 ${activeZone && activeZone !== 'waist' ? 'opacity-5 scale-95' : 'opacity-100 scale-100'}`} />
                        <g className={`transition-all duration-700 ${activeZone && activeZone !== 'arm' ? 'opacity-5' : 'opacity-100'}`}>
                          <line x1="108" y1="140" x2="85" y2="250" stroke={results.arm.color} strokeWidth="20" strokeLinecap="round" />
                          <line x1="192" y1="140" x2="215" y2="250" stroke={results.arm.color} strokeWidth="20" strokeLinecap="round" />
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
                        <ellipse cx="150" cy="180" rx="40" ry="12" fill={results.waist.color} className={`transition-all duration-700 ${activeZone && activeZone !== 'waist' ? 'opacity-5 scale-95' : 'opacity-100 scale-100'}`} />
                        <ellipse cx="150" cy="230" rx="55" ry="15" fill={results.hip.color} className={`transition-all duration-700 ${activeZone && activeZone !== 'hip' ? 'opacity-5 scale-95' : 'opacity-100 scale-100'}`} />
                        <g className={`transition-all duration-700 ${activeZone && activeZone !== 'inseam' ? 'opacity-5' : 'opacity-100'}`}>
                           <line x1="145" y1="280" x2="115" y2="560" stroke={results.inseam.color} strokeWidth="15" strokeLinecap="round" />
                           <line x1="155" y1="280" x2="185" y2="560" stroke={results.inseam.color} strokeWidth="15" strokeLinecap="round" />
                        </g>
                        <g className={`transition-all duration-700 ${activeZone && activeZone !== 'outseam' ? 'opacity-5' : 'opacity-100'}`}>
                           <line x1="100" y1="220" x2="85" y2="550" stroke={results.outseam.color} strokeWidth="10" strokeLinecap="round" />
                           <line x1="200" y1="220" x2="215" y2="550" stroke={results.outseam.color} strokeWidth="10" strokeLinecap="round" />
                        </g>
                      </g>
                    </>
                  )}
             </motion.svg>
          </div>

          {/* LİSTELER (SAĞ TARAF) */}
          <div className="w-full md:w-1/2 p-6 md:p-8 flex flex-col justify-center bg-white border-l border-zinc-100 z-10">
            <motion.h3 className="text-sm uppercase tracking-[0.2em] text-zinc-400 font-semibold mb-6">
              {category === 'top' ? 'Üst Beden Uyumu' : 'Alt Beden Uyumu'}
            </motion.h3>
            
            <div className="flex flex-col gap-3">
              {listItems.map((item, index) => (
                <motion.div 
                  key={item.id}
                  initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 + (index * 0.1) }}
                  onMouseEnter={() => { setActiveZone(item.id); svgControls.start({ viewBox: ZOOM_CONFIG[category][item.id], transition: { duration: 0.6 }}); }}
                  onMouseLeave={() => { setActiveZone(null); svgControls.start({ viewBox: ZOOM_CONFIG[category].full, transition: { duration: 0.6 }}); }}
                  className="group flex items-center justify-between p-3.5 rounded-xl border border-zinc-100 hover:border-zinc-300 hover:shadow-sm bg-white cursor-pointer transition-colors duration-300"
                >
                  <div className="flex items-center gap-3.5">
                    <div className={`w-3 h-3 rounded-full flex-shrink-0 ${item.data.bg} shadow-inner`}></div>
                    <div className="flex flex-col items-start gap-1">
                      <span className="text-xs md:text-sm font-medium text-zinc-700 leading-none">{item.name}</span>
                      <div className="flex items-center gap-1.5 text-[10px] text-zinc-400 font-mono">
                        <span title="Senin Ölçün">{item.data.user || '?'} cm</span>
                        <svg className="w-3 h-3 text-zinc-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                        <span title="Ürün Ölçüsü" className="text-zinc-600 font-semibold">{item.data.product || '?'} cm</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end flex-shrink-0 ml-2">
                    <span className="whitespace-nowrap text-[10px] uppercase tracking-widest px-2.5 py-1.5 rounded-md font-semibold border" style={{ color: item.data.color, backgroundColor: `${item.data.color}15`, borderColor: `${item.data.color}30` }}>
                      {item.data.status} {item.data.status !== 'Veri Yok' && `(${item.data.delta}cm)`}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* FOOTER - Aynen kalıyor */}
        <div className="flex-none bg-zinc-900 text-white flex flex-col md:flex-row items-start md:items-center justify-between p-6 md:px-8 md:py-6 relative overflow-hidden">
             {/* ... Footer içeriği senin kodundakiyle aynı ... */}
             <div className="absolute right-0 top-0 w-64 h-full bg-gradient-to-l from-blue-500/20 to-transparent blur-2xl"></div>
              <div className="flex items-center gap-4 relative z-10 w-full md:w-3/4 mb-4 md:mb-0">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                </div>
                <p className="text-xs md:text-sm font-light text-zinc-300 leading-relaxed pr-4">
                  Bu analiz ölçülerinize ve (<strong className="text-white">{userProfile?.preferences?.default_fit || 'Normal'}</strong>) kesim tercihinize göre hesaplanmıştır.
                </p>
              </div>
              <Button variant="secondary" className="relative z-10 w-full md:w-auto h-10 md:h-12 px-8 rounded-full text-xs md:text-sm font-medium">Sepete Ekle</Button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default FitAnalyzer;