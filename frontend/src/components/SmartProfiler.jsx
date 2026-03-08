import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import toast from 'react-hot-toast';

import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Beden Listeleri
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

  // Seçim State'leri
  const [selectedGender, setSelectedGender] = useState('men'); 
  const [selectedBrand, setSelectedBrand] = useState('');
  
  const category = productCategory || 'top';
  const subCategory = productSubCategory || 'tshirt';
  
  const [selectedFit, setSelectedFit] = useState(productFit || 'regular'); 
  const [selectedSize, setSelectedSize] = useState('');
  
  // Hissiyat (0: Dar, 50: Tam, 100: Bol)
  const [physicalFeel, setPhysicalFeel] = useState(50); 
  const [satisfaction, setSatisfaction] = useState(50);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sizeStandard, setSizeStandard] = useState('letter');

  // 1. Markaları Çek
  useEffect(() => {
    const fetchBrands = async () => {
      const { data } = await supabase.from('brands').select('*').order('name');
      if (data) setBrands(data);
      setLoadingBrands(false);
    };
    fetchBrands();
  }, []);

  // 2. Kategoriye Göre Beden Sistemini Ayarla
  useEffect(() => {
    if (subCategory === 'jeans') setSizeStandard('inch');
    else if (subCategory === 'pants' && selectedGender === 'men') setSizeStandard('inch');
    else if (category === 'bottom' && selectedGender === 'women') setSizeStandard('eu');
    else setSizeStandard('letter');
    
    setSelectedSize('');
  }, [category, subCategory, selectedGender]);

  const activeSizeList = SIZE_CONFIG[sizeStandard] || SIZE_CONFIG.letter;

  // 3. KAYDETME İŞLEMİ
  const handleSave = async () => {
    setIsSubmitting(true);

    // A. SQL View'dan Referans Ölçüyü Çek
    let { data: refMeas } = await supabase
      .from('view_smart_variants')
      .select('measurements')
      .eq('brand_id', selectedBrand)
      .eq('sub_category', subCategory)
      .eq('size', selectedSize)
      .eq('fit_type', selectedFit)
      .maybeSingle();

    // B. Veri Yoksa Fallback
    if (!refMeas) {
      toast("Tam veri bulunamadı, tahmini kalıp kullanılıyor.", { icon: 'ℹ️' });
      if (category === 'top') refMeas = { measurements: { chest: 100, waist: 90 } };
      else refMeas = { measurements: { waist: 84, hip: 100, length: 81 } };
    }

    const base = refMeas.measurements || refMeas;

    // C. Hissiyat Algoritması
    const adjustment = (50 - physicalFeel) / 4; 

    let bodyMeasurements = {};

    if (category === 'top') {
      const chestBase = base.chest || base.chest_width || 100;
      bodyMeasurements.chest = Math.round(chestBase + adjustment);
      bodyMeasurements.waist = Math.round((chestBase * 0.90) + adjustment); 
      bodyMeasurements.shoulder = Math.round(chestBase * 0.45);
      bodyMeasurements.arm = 64; 
    } else {
      const waistBase = base.waist || base.waist_width || 84;
      bodyMeasurements.waist = Math.round(waistBase + adjustment);
      bodyMeasurements.hip = Math.round((waistBase * 1.18) + adjustment);
      bodyMeasurements.inseam = base.length || base.inseam || 81;
      bodyMeasurements.outseam = (base.length || 81) + 24;
    }

    // D. Kullanıcı Tercihi
    let userFitPreference = 'regular';
    if (satisfaction === 100) userFitPreference = 'loose'; 
    if (satisfaction === 0) userFitPreference = 'slim';

    const { error } = await supabase.from('user_profiles').upsert({
      id: session.user.id,
      gender: selectedGender,
      measurements: bodyMeasurements,
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
    } else {
      toast.error("Bir hata oluştu.");
    }
  };

  // Helper Labels
  const getFeelLabel = (val) => {
    if (val === 0) return "Çok Dar";
    if (val === 25) return "Biraz Dar";
    if (val === 50) return "Tam";
    if (val === 75) return "Biraz Bol";
    if (val === 100) return "Çok Bol";
    return "";
  };
  
  const getSatisfactionLabel = (val) => {
    if (val === 0) return "Daha Bol Olmalıydı";
    if (val === 50) return "İstediğim Gibi";
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
        {onClose && ( <Button variant="ghost" onClick={onClose} className="rounded-full h-10 w-10 p-0">✕</Button> )}
      </header>

      <div className="flex-1 flex flex-col items-center justify-center p-6 max-w-2xl mx-auto w-full overflow-y-auto">
        
        {/* ADIM 1: MARKA SEÇİMİ */}
        {step === 1 && (
          <div className="w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-center mb-6">
              <div className="bg-zinc-100 p-1 rounded-full flex gap-1">
                 <button onClick={() => setSelectedGender('women')} className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${selectedGender === 'women' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-700'}`}>Kadın</button>
                 <button onClick={() => setSelectedGender('men')} className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${selectedGender === 'men' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-700'}`}>Erkek</button>
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
               <span className="bg-zinc-100 text-zinc-600 text-[10px] font-bold px-3 py-1 rounded-full tracking-widest uppercase">{selectedGender === 'women' ? 'Kadın' : 'Erkek'}</span>
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

              {/* SAĞ KOLON: ÇİFT BAR (DÜZELTİLEN ALAN) */}
              <div className="space-y-4 bg-zinc-50 p-5 rounded-2xl border border-zinc-100 flex flex-col justify-center">
                
                {/* BAR 1: HİSSİYAT */}
                <div className="space-y-3 pb-2">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">1. Üzerinize Nasıl Oturuyor?</label>
                      <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100 min-w-[80px] text-center">{getFeelLabel(physicalFeel)}</span>
                    </div>
                    <Slider defaultValue={[50]} max={100} step={25} value={[physicalFeel]} onValueChange={(val) => setPhysicalFeel(val[0])} className="py-2" />
                    
                    {/* YENİ GRID YAPISI (Kaymaları önler) */}
                    <div className="grid grid-cols-5 text-[9px] text-zinc-400 font-medium uppercase mt-1">
                        <span className="text-left leading-tight">Çok<br/>Dar</span>
                        <span className="text-center leading-tight">Biraz<br/>Dar</span>
                        <span className="text-center font-bold text-zinc-600">Tam</span>
                        <span className="text-center leading-tight">Biraz<br/>Bol</span>
                        <span className="text-right leading-tight">Çok<br/>Bol</span>
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
                    
                    {/* YENİ FLEX YAPISI */}
                    <div className="flex justify-between text-[9px] text-zinc-400 font-medium uppercase mt-1">
                        <span className="text-left w-16 leading-tight">Daha Bol<br/>İsterdim</span>
                        <span className="text-center w-auto font-bold text-zinc-800">Mükemmel</span>
                        <span className="text-right w-16 leading-tight">Daha Dar<br/>İsterdim</span>
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