import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import toast from 'react-hot-toast';

import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const SIZE_CONFIG = {
  letter: ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL'], 
  inch: ['28', '29', '30', '31', '32', '33', '34', '36', '38'], 
  eu: ['32', '34', '36', '38', '40', '42', '44'], 
  us: ['0', '2', '4', '6', '8', '10', '12']
};

const SmartProfiler = ({ session, onClose, onRefreshProfile, productCategory, productSubCategory, productFit }) => {
  const [step, setStep] = useState(1);
  const [brands, setBrands] = useState([]);
  const [loadingBrands, setLoadingBrands] = useState(true);

  const [selectedGender, setSelectedGender] = useState('kadin'); 
  const [selectedBrand, setSelectedBrand] = useState('');
  
  const category = productCategory || 'top';
  const subCategory = productSubCategory || 't-shirt';
  
  const [selectedFit, setSelectedFit] = useState('regular'); 
  const [selectedSize, setSelectedSize] = useState('');
  
  const [physicalFeel, setPhysicalFeel] = useState(50); 
  const [satisfaction, setSatisfaction] = useState(50);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sizeStandard, setSizeStandard] = useState('letter');

  // 1. MARKALARI ÇEK (Brands tablosundan)
  useEffect(() => {
    const fetchBrands = async () => {
      // Burası 'brands' tablosundan çekmeye devam ediyor (Anne tablo)
      const { data } = await supabase.from('brands').select('*').order('name');
      if (data) setBrands(data);
      setLoadingBrands(false);
    };
    fetchBrands();
  }, []);

  // 2. OTOMATİK STANDART BELİRLEME
  useEffect(() => {
    if (subCategory === 'jeans') setSizeStandard('inch');
    else if (subCategory === 'pants' && selectedGender === 'erkek') setSizeStandard('inch');
    else if (category === 'bottom' && selectedGender === 'kadin') setSizeStandard('eu');
    else setSizeStandard('letter');
    
    setSelectedSize('');
  }, [category, subCategory, selectedGender]);

  const activeSizeList = SIZE_CONFIG[sizeStandard] || SIZE_CONFIG.letter;

  // 3. ÖLÇÜLERİ ÇEK (YENİ VIEW KULLANILIYOR)
  const getReferenceMeasurements = async () => {
    
    // --- DEĞİŞİKLİK BURADA: 'view_brand_measurements' ---
    
    // A. Tam Eşleşme
    let query = supabase
      .from('view_brand_measurements') // <--- YENİ TABLO ADI (VIEW)
      .select('measurements')
      .eq('brand_id', selectedBrand)
      .eq('category', category)
      .eq('sub_category', subCategory)
      .eq('gender', selectedGender)
      .eq('size_label', selectedSize)
      .eq('fit_type', selectedFit)
      .maybeSingle();

    let { data } = await query;
    if (data) return data.measurements;

    // B. Marka İçi Yedek (Fit yoksa Regular)
    if (selectedFit !== 'regular') {
      const { data: regularData } = await supabase
        .from('view_brand_measurements') // <--- YENİ TABLO ADI
        .select('measurements')
        .eq('brand_id', selectedBrand)
        .eq('category', category)
        .eq('sub_category', subCategory)
        .eq('gender', selectedGender)
        .eq('size_label', selectedSize)
        .eq('fit_type', 'regular')
        .maybeSingle();
      
      if (regularData) {
        let meas = regularData.measurements;
        // Matematiksel Fit Dönüşümü
        if (selectedFit === 'slim') return { ...meas, chest: (meas.chest || 0) - 4, waist: (meas.waist || 0) - 4 };
        if (selectedFit === 'oversize') return { ...meas, chest: (meas.chest || 0) + 8, waist: (meas.waist || 0) + 8 };
        return meas;
      }
    }
    
    // C. Global Yedek (Markada yoksa başka markaya bak)
    const { data: globalData } = await supabase
      .from('view_brand_measurements') // <--- YENİ TABLO ADI
      .select('measurements')
      .eq('category', category)
      .eq('sub_category', subCategory)
      .eq('gender', selectedGender)
      .eq('size_label', selectedSize)
      .eq('fit_type', 'regular')
      .limit(1)
      .maybeSingle();

    if (globalData) return globalData.measurements;

    return null;
  };

  const handleSave = async () => {
    setIsSubmitting(true);
    let base = await getReferenceMeasurements();

    if (!base) {
      toast("Veri bulunamadı, tahmini kalıp kullanılıyor.", { icon: '⚠️' });
      if (selectedGender === 'erkek') base = { shoulder: 46, chest: 100, waist: 88, hip: 102, arm: 64, inseam: 82, outseam: 104 };
      else base = { shoulder: 39, chest: 90, waist: 70, hip: 96, arm: 59, inseam: 78, outseam: 100 };
    }

    const diffMap = { 0: 5, 25: 2.5, 50: 0, 75: -2.5, 100: -5 };
    const adjustment = diffMap[physicalFeel] !== undefined ? diffMap[physicalFeel] : 0; 

    let estimatedMeasurements = {};

    if (category === 'top') {
      estimatedMeasurements = {
        shoulder_width_cm: Math.round((base.shoulder || 40) + (adjustment * 0.3)),
        chest_circumference_cm: Math.round(base.chest + adjustment),
        waist_circumference_cm: Math.round(base.waist + adjustment),
        hip_circumference_cm: Math.round(base.hip + adjustment),
        arm_length_cm: Math.round(base.arm || 60),
        inseam_cm: selectedGender === 'erkek' ? 82 : 78, 
        outseam_cm: selectedGender === 'erkek' ? 104 : 100
      };
    } else {
      estimatedMeasurements = {
        shoulder_width_cm: selectedGender === 'erkek' ? 46 : 39, 
        chest_circumference_cm: selectedGender === 'erkek' ? 100 : 90, 
        waist_circumference_cm: Math.round(base.waist + adjustment),
        hip_circumference_cm: Math.round((base.hip || 90) + adjustment),
        arm_length_cm: selectedGender === 'erkek' ? 64 : 59,
        inseam_cm: Math.round(base.inseam || (selectedGender === 'erkek' ? 82 : 78)),
        outseam_cm: Math.round(base.outseam || (selectedGender === 'erkek' ? 104 : 100))
      };
    }

    let userFitPreference = 'regular';
    if (satisfaction === 100) userFitPreference = 'loose'; 
    if (satisfaction === 0) userFitPreference = 'slim';

    const { error } = await supabase.from('user_profiles').upsert({
      id: session.user.id,
      gender: selectedGender,
      basic_info: { height_cm: 175, weight_kg: 70 },
      measurements: estimatedMeasurements,
      preferences: { 
        default_fit: userFitPreference, 
        reference_brand: selectedBrand, 
        reference_size: selectedSize 
      },
      updated_at: new Date()
    });

    setIsSubmitting(false);

    if (!error) {
      toast.success("Profiliniz başarıyla oluşturuldu!");
      if (onRefreshProfile) await onRefreshProfile();
      setTimeout(() => { if (onClose) onClose(); }, 600);
    }
  };

  const getFeelLabel = (val) => {
    if (val === 0) return "Çok Dar (Sıkıyor)";
    if (val === 25) return "Biraz Dar";
    if (val === 50) return "Tam (Mükemmel)";
    if (val === 75) return "Biraz Bol";
    if (val === 100) return "Çok Bol (Düşüyor)";
    return "";
  };
  
  const getSatisfactionLabel = (val) => {
    if (val === 0) return "Daha Bol Olmalıydı";
    if (val === 50) return "Tam İstediğim Gibi";
    if (val === 100) return "Daha Dar Olmalıydı";
    return "";
  };

  return (
    <div className="h-full w-full bg-white flex flex-col font-sans text-zinc-900 selection:bg-zinc-200">
      
      {/* HEADER */}
      <header className="flex-none py-6 px-8 border-b border-zinc-100 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Akıllı Beden Asistanı</h2>
          <p className="text-zinc-500 text-sm mt-1">{step === 1 ? 'Referans Marka Seçimi' : 'Detaylı Analiz'}</p>
        </div>
        {onClose && ( <Button variant="ghost" onClick={onClose} className="rounded-full h-10 w-10 p-0"><svg className="w-6 h-6 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M6 18L18 6M6 6l12 12"></path></svg></Button> )}
      </header>

      <div className="flex-1 flex flex-col items-center justify-center p-6 max-w-2xl mx-auto w-full">
        
        {/* ADIM 1: MARKA SEÇİMİ */}
        {step === 1 && (
          <div className="w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-center mb-6">
              <div className="bg-zinc-100 p-1 rounded-full flex gap-1">
                 <button onClick={() => setSelectedGender('kadin')} className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${selectedGender === 'kadin' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-700'}`}>Kadın</button>
                 <button onClick={() => setSelectedGender('erkek')} className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${selectedGender === 'erkek' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-700'}`}>Erkek</button>
              </div>
            </div>
            <div className="text-center space-y-2"><h3 className="text-3xl font-light text-zinc-900">En sık hangi markayı giyiyorsunuz?</h3></div>
            
            {loadingBrands ? (
                <div className="flex justify-center text-sm text-zinc-400 animate-pulse">Markalar yükleniyor...</div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-h-[300px] overflow-y-auto">
                {brands.map((brand) => (
                    <button key={brand.id} onClick={() => { setSelectedBrand(brand.id); setStep(2); }} className="group flex flex-col items-center justify-center p-6 rounded-2xl border border-zinc-200 hover:border-zinc-900 hover:bg-zinc-50 transition-all duration-300">
                    <span className="text-lg font-medium text-zinc-700 group-hover:text-zinc-900">{brand.name}</span>
                    </button>
                ))}
                </div>
            )}
          </div>
        )}

        {/* ADIM 2: ANALİZ EKRANI */}
        {step === 2 && (
          <div className="w-full space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
            <div className="flex items-center justify-between">
               <Button variant="ghost" onClick={() => setStep(1)} className="text-zinc-400 hover:text-zinc-900 -ml-4">← Marka Değiştir</Button>
               <span className="bg-zinc-100 text-zinc-600 text-[10px] font-bold px-3 py-1 rounded-full tracking-widest uppercase">{selectedGender === 'kadin' ? 'Kadın' : 'Erkek'}</span>
            </div>

            <div className="text-center space-y-2">
                <h3 className="text-3xl font-light text-zinc-900">
                    <span className="capitalize font-medium">{brands.find(b => b.id === selectedBrand)?.name || selectedBrand}</span> bedeniniz nedir?
                </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              
              {/* SOL KOLON */}
              <div className="space-y-5">
                
                {/* 1. ÜRÜN BİLGİSİ */}
                <div className="h-12 w-full bg-zinc-50 border border-zinc-200 rounded-xl flex items-center px-4 gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                  <span className="text-sm font-medium text-zinc-700">Ürün: <span className="font-bold capitalize">{subCategory.replace('-', ' ')}</span></span>
                </div>

                <div className="space-y-1">
                   <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest pl-1">Ürünün Kesimi</label>
                   <Select value={selectedFit} onValueChange={setSelectedFit}>
                    <SelectTrigger className="h-10 bg-white border-zinc-200"><SelectValue placeholder="Kesim Seçin" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="slim">Slim Fit (Dar)</SelectItem>
                      <SelectItem value="regular">Regular Fit (Normal)</SelectItem>
                      <SelectItem value="oversize">Oversize (Bol)</SelectItem>
                      <SelectItem value="loose">Loose Fit (Rahat)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* 2. BEDEN TİPİ SEKMELERİ */}
                <Tabs value={sizeStandard} onValueChange={setSizeStandard} className="w-full">
                   <TabsList className="w-full grid grid-cols-4 bg-zinc-100 p-1 h-9">
                     <TabsTrigger value="letter" className="text-[10px] h-7">Harf</TabsTrigger>
                     <TabsTrigger value="inch" className="text-[10px] h-7">İnç</TabsTrigger>
                     <TabsTrigger value="eu" className="text-[10px] h-7">EU</TabsTrigger>
                     <TabsTrigger value="us" className="text-[10px] h-7">US</TabsTrigger>
                   </TabsList>
                </Tabs>

                {/* 3. BEDEN BUTONLARI */}
                <div className="grid grid-cols-5 gap-2 max-h-[120px] overflow-y-auto pr-1">
                  {activeSizeList.map(s => (
                    <button key={s} onClick={() => setSelectedSize(s)} className={`h-10 rounded-lg text-sm font-medium border transition-all flex-shrink-0 ${selectedSize === s ? 'bg-zinc-900 text-white border-zinc-900' : 'bg-white text-zinc-600 border-zinc-200 hover:border-zinc-400'}`}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* SAĞ KOLON: ÇİFT BAR */}
              <div className="space-y-4 bg-zinc-50 p-5 rounded-2xl border border-zinc-100 flex flex-col justify-center">
                
                {/* BAR 1: HİSSİYAT */}
                <div className="space-y-3 pb-2">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">1. Üzerinize Nasıl Oturuyor?</label>
                      <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100 min-w-[80px] text-center">{getFeelLabel(physicalFeel)}</span>
                    </div>
                    <Slider defaultValue={[50]} max={100} step={25} value={[physicalFeel]} onValueChange={(val) => setPhysicalFeel(val[0])} className="py-2" />
                    
                    {/* HİZALAMA */}
                    <div className="relative h-6 text-[8px] text-zinc-400 font-medium uppercase tracking-tighter mt-1">
                        <span className="absolute left-0 top-0 text-left w-10 leading-tight">Çok<br/>Dar</span>
                        <span className="absolute left-[25%] -translate-x-1/2 top-0 text-center w-12 leading-tight">Biraz<br/>Dar</span>
                        <span className="absolute left-[50%] -translate-x-1/2 top-0 text-center w-10 font-bold text-zinc-600">Tam</span>
                        <span className="absolute left-[75%] -translate-x-1/2 top-0 text-center w-12 leading-tight">Biraz<br/>Bol</span>
                        <span className="absolute right-0 top-0 text-right w-10 leading-tight">Çok<br/>Bol</span>
                    </div>
                </div>

                <div className="w-full border-t border-zinc-200 my-1"></div>

                {/* BAR 2: MEMNUNİYET */}
                <div className="space-y-3 pt-2">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">2. Duruşundan Memnun musun?</label>
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 min-w-[80px] text-center">{getSatisfactionLabel(satisfaction)}</span>
                    </div>
                    <Slider defaultValue={[50]} max={100} step={50} value={[satisfaction]} onValueChange={(val) => setSatisfaction(val[0])} className="py-2" />
                    
                    {/* HİZALAMA */}
                    <div className="relative h-6 text-[8px] text-zinc-400 font-medium uppercase tracking-tighter mt-1">
                        <span className="absolute left-0 top-0 text-left w-16 leading-tight">Daha Bol<br/>İsterdim</span>
                        <span className="absolute left-[50%] -translate-x-1/2 top-0 text-center w-12 font-bold text-zinc-800">Mükemmel</span>
                        <span className="absolute right-0 top-0 text-right w-16 leading-tight">Daha Dar<br/>İsterdim</span>
                    </div>
                </div>
              </div>
            </div>

            <Button onClick={handleSave} disabled={!selectedSize || isSubmitting} className="w-full h-14 rounded-full text-sm uppercase tracking-widest shadow-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transition-all transform hover:scale-[1.01]">{isSubmitting ? "Hesaplanıyor..." : "Analiz Et"}</Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SmartProfiler;