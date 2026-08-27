import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import toast from 'react-hot-toast';
import { t } from '../lib/i18n';

import { Button } from "@/components/ui/button";
import BrandSelectionStep from './profiler/BrandSelectionStep';
import SizeFitSelectionStep from './profiler/SizeFitSelectionStep';
import FeedbackSliders from './profiler/FeedbackSliders';
import ManualMeasurementsStep from './profiler/ManualMeasurementsStep';
import { estimateUserMeasurements, sortSizes, normalizeMeasurements } from '../lib/size-engine';
import { detectProductCategory, detectProductGender } from '../lib/utils';

const SIZE_CONFIG = {
  letter: ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL'], 
  inch: ['28', '29', '30', '31', '32', '33', '34', '36', '38']
};

const SmartProfiler = ({ session, userProfile, onClose, onCancel, onRefreshProfile, onGuestProfileCreated, productCategory, productSubCategory, productGender, productName, lang = 'en', unitSystem = 'cm' }) => {
  const [step, setStep] = useState(1);
  const [brands, setBrands] = useState([]);
  const [availableBrandIds, setAvailableBrandIds] = useState([]);
  const [fitOptions, setFitOptions] = useState([]); 
  const [loadingData, setLoadingData] = useState(true);

  // Akıllı Algılama Fonksiyonları
  const detectedGender = productGender || detectProductGender(productCategory, productName);
  const category = detectProductCategory(productCategory, productName);

  // Seçim State'leri
  const [selectedGender, setSelectedGender] = useState(detectedGender || 'men'); 
  const [selectedBrand, setSelectedBrand] = useState('');
  
  // Kategori Yönetimi
  const [selectedSubCategory, setSelectedSubCategory] = useState(productSubCategory || (category === 'bottom' ? 'pants' : 'tshirt'));
  
  const [selectedFit, setSelectedFit] = useState('regular'); 
  const [selectedSize, setSelectedSize] = useState('');
  const [physicalFeel, setPhysicalFeel] = useState(50); 
  const [satisfaction, setSatisfaction] = useState(50);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 1. VERİLERİ ÇEK
  useEffect(() => {
    const fetchData = async () => {
      setLoadingData(true);
      
      const { data: brandsData } = await supabase.from('brands').select('*').order('name');
      if (brandsData) setBrands(brandsData);

      // Fit Types çekerken 'category' kolonunu da alıyoruz
      const { data: fitsData } = await supabase.from('fit_types').select('*').order('name');
      if (fitsData) setFitOptions(fitsData);
      
      setLoadingData(false);
    };
    fetchData();
  }, []);

  // 2. MARKALARI FİLTRELE (Cinsiyet ve Kategoriye Göre)
  useEffect(() => {
    const fetchAvailableBrands = async () => {
      const { data } = await supabase
        .from('view_smart_variants')
        .select('brand_id')
        .eq('gender', selectedGender)
        .eq('category', category);
      
      if (data) {
        const uniqueIds = [...new Set(data.map(d => d.brand_id))];
        setAvailableBrandIds(uniqueIds);
      }
    };
    fetchAvailableBrands();
  }, [selectedGender, category]);

  // 3. OTOMATİK AYARLAR (Kategori değişince çalışır)
  useEffect(() => {
    // Kategori değişince Beden ve Fit seçimini sıfırla (Hata olmaması için)
    setSelectedFit('');
    setSelectedSize('');
  }, [category, selectedSubCategory, selectedGender]);

  // 3. FİLTRELEME MANTIĞI (Kritik Kısım Burası) 🔍
  const [brandFits, setBrandFits] = useState([]);
  const [brandSizes, setBrandSizes] = useState([]); // Dinamik bedenler
  const [brandSubCategories, setBrandSubCategories] = useState([]);
  const [variantData, setVariantData] = useState([]);
  const [loadingBrandFits, setLoadingBrandFits] = useState(false);
  const [availableSystems, setAvailableSystems] = useState([]);
  const [activeSystemTab, setActiveSystemTab] = useState('');

  // Veritabanından marka, cinsiyet ve (ana) kategoriye göre tüm alt ürünleri çek
  useEffect(() => {
    const fetchBrandData = async () => {
      if (step === 2 && selectedBrand) {
        setLoadingBrandFits(true);
        const { data } = await supabase
          .from('view_smart_variants')
          .select('sub_category, fit_type, size, size_system')
          .eq('brand_id', selectedBrand)
          .eq('gender', selectedGender)
          .eq('category', category);
        
        if (data && data.length > 0) {
          setVariantData(data);
          const uniqueSubCats = [...new Set(data.map(d => d.sub_category).filter(Boolean))];
          setBrandSubCategories(uniqueSubCats);
          
          if (uniqueSubCats.length > 0 && !uniqueSubCats.includes(selectedSubCategory)) {
            setSelectedSubCategory(uniqueSubCats[0]);
          }
        } else {
          setVariantData([]);
          setBrandSubCategories([]);
          setBrandFits([]);
          setBrandSizes([]);
        }
        setLoadingBrandFits(false);
      }
    };
    fetchBrandData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, selectedBrand, selectedGender, category]);

  // Seçili alt kategori (ürün) değiştiğinde kesim ve bedenleri filtrele
  useEffect(() => {
    if (variantData.length > 0) {
      const filteredData = variantData.filter(d => d.sub_category === selectedSubCategory);
      // Ensure strict filtering by lowercasing and trimming fit types
      const uniqueFits = [...new Set(filteredData.map(d => d.fit_type?.toLowerCase().trim()).filter(Boolean))];
      
      const systems = [...new Set(filteredData.map(d => d.size_system).filter(sys => sys))].sort();
      setAvailableSystems(systems);
      
      setActiveSystemTab(prev => {
        if (systems.length > 0 && !systems.includes(prev)) return systems[0];
        if (systems.length === 0) return '';
        return prev;
      });
      
      const uniqueSizesMap = new Map();
      filteredData.forEach(d => {
         if (!d.size) return;
         const key = `${d.size}-${d.size_system || 'all'}`;
         if (!uniqueSizesMap.has(key)) {
             uniqueSizesMap.set(key, { label: d.size, rawSize: d.size, system: d.size_system });
         }
      });
      const uniqueSizes = sortSizes(Array.from(uniqueSizesMap.values()));      
      setBrandFits(uniqueFits);
      setBrandSizes(uniqueSizes);
      
      setSelectedFit(prev => {
        const lowerPrev = prev.toLowerCase().trim();
        if (uniqueFits.length > 0 && !uniqueFits.includes(lowerPrev)) {
          return uniqueFits[0];
        }
        return prev;
      });
    }
  }, [selectedSubCategory, variantData]);

  const filteredFits = fitOptions.filter(fit => {
    const isCategoryMatch = (fit.category === 'all' || !fit.category || fit.category === category);
    if (!isCategoryMatch) return false;
    
    if (brandFits.length > 0) {
      return brandFits.includes(fit.name.toLowerCase().trim());
    }
    
    // Markaya ait o kategoride hiç ürün yoksa boş dönsün (uydurma olmasın)
    return false;
  });

  // Beden listesi direkt DB'den, DB boşsa uydurma beden gösterme
  const activeSizeList = brandSizes.length > 0 
    ? brandSizes.filter(s => {
        if (!activeSystemTab || availableSystems.length <= 1) return true;
        return s.system === activeSystemTab || (!s.system && activeSystemTab === 'universal');
      })
    : [];

  // 4. KAYDETME İŞLEMİ
  const handleSave = async () => {
    setIsSubmitting(true);

    const sizeObj = brandSizes.find(s => s.label === selectedSize && (availableSystems.length <= 1 || s.system === activeSystemTab || (!s.system && activeSystemTab === 'universal')));
    const querySize = sizeObj ? sizeObj.rawSize : selectedSize;
    const querySystem = sizeObj ? sizeObj.system : null;

    let query = supabase
      .from('view_smart_variants')
      .select('measurements')
      .eq('brand_id', selectedBrand)
      .eq('sub_category', selectedSubCategory)
      .eq('size', querySize)
      .eq('fit_type', selectedFit);

    if (querySystem) {
      query = query.eq('size_system', querySystem);
    }

    let { data: refMeas } = await query.maybeSingle();

    if (!refMeas) {
      toast(t('dataNotFound', lang), { icon: 'ℹ️' });
      if (category === 'top') refMeas = { measurements: { chest: 100, waist: 90 } };
      else refMeas = { measurements: { waist: 84, hip: 100, length: 81 } };
    }

    const base = refMeas.measurements || refMeas;
    
    // İş mantığı soyutlaması: Kullanıcı ölçülerini tahmin et (Artık Fit Type'ı da gönderiyoruz)
    const bodyMeasurements = estimateUserMeasurements(base, physicalFeel, category, selectedFit);

    let userFitPreference = 'regular';
    // Eğer kullanıcı bol hissetmesine rağmen "Mükemmel" diyorsa veya "Daha büyük" istiyorsa 'loose' tercih eder.
    if (satisfaction === 100 || (satisfaction === 50 && physicalFeel >= 75)) {
      userFitPreference = 'loose';
    } else if (satisfaction === 0 || (satisfaction === 50 && physicalFeel <= 25)) {
      userFitPreference = 'slim';
    }

    const historyEntry = {
      id: Date.now().toString(),
      brand: selectedBrand,
      size: selectedSize,
      fit: selectedFit,
      category,
      subCategory: selectedSubCategory,
      measurements: bodyMeasurements,
      preference: userFitPreference,
      date: new Date().toISOString()
    };

    let history = userProfile?.preferences?.history || [];
    // Remove if there is an exact same brand/category entry to avoid duplicates, or just prepend
    history = [historyEntry, ...history.filter(h => h.brand !== selectedBrand || h.category !== category)];

    const profileData = {
      gender: selectedGender,
      measurements: bodyMeasurements,
      preferences: { 
        default_fit: userFitPreference, 
        reference_brand: selectedBrand, 
        reference_size: selectedSize,
        history
      },
      updated_at: new Date()
    };

    let error = null;
    if (session?.user?.id) {
      profileData.id = session.user.id;
      const res = await supabase.from('user_profiles').upsert(profileData);
      error = res.error;
    }

    setIsSubmitting(false);

    if (!error) {
      if (!session?.user?.id && onGuestProfileCreated) {
        toast.success(t('profileCreated', lang));
        onGuestProfileCreated(profileData);
      } else {
        toast.success(t('profileSuccess', lang));
        if (onRefreshProfile) await onRefreshProfile();
      }
      setTimeout(() => { if (onClose) onClose(); }, 600);
    } else {
      toast.error(t('errorOccurred', lang));
    }
  };

  const handleManualSave = async (manualMeasurements) => {
    setIsSubmitting(true);
    
    // Normalize measurements for size engine
    const bodyMeasurements = normalizeMeasurements(manualMeasurements, category, true);

    const historyEntry = {
      id: Date.now().toString(),
      brand: 'Manual',
      size: 'Custom',
      fit: 'regular',
      category,
      subCategory: selectedSubCategory,
      measurements: bodyMeasurements,
      preference: 'regular',
      date: new Date().toISOString()
    };

    let history = userProfile?.preferences?.history || [];
    // Remove old manual entry for same category if exists
    history = [historyEntry, ...history.filter(h => h.brand !== 'Manual' || h.category !== category)];

    const profileData = {
      gender: selectedGender,
      measurements: bodyMeasurements,
      preferences: { 
        default_fit: 'regular', 
        reference_brand: 'Manual', 
        reference_size: 'Custom',
        history
      },
      updated_at: new Date()
    };

    let error = null;
    if (session?.user?.id) {
      profileData.id = session.user.id;
      const res = await supabase.from('user_profiles').upsert(profileData);
      error = res.error;
    }

    setIsSubmitting(false);

    if (!error) {
      if (!session?.user?.id && onGuestProfileCreated) {
        toast.success(t('profileCreated', lang) || 'Profil başarıyla oluşturuldu');
        onGuestProfileCreated(profileData);
      } else {
        toast.success(t('profileSuccess', lang) || 'Ölçüleriniz başarıyla kaydedildi');
        if (onRefreshProfile) await onRefreshProfile();
      }
      setTimeout(() => { if (onClose) onClose(); }, 600);
    } else {
      toast.error(t('errorOccurred', lang) || 'Bir hata oluştu');
    }
  };

  // UI Helper Fonksiyonları...
  const getFeelLabel = (val) => {
    if (val === 0) return t('tooSmall', lang);
    if (val === 25) return t('bitSmall', lang);
    if (val === 50) return t('perfect', lang);
    if (val === 75) return t('bitBig', lang);
    if (val === 100) return t('tooBig', lang);
    return "";
  };
  
  const getSatisfactionLabel = (val) => {
    if (val === 0) return t('wantSmaller', lang);
    if (val === 50) return t('perfect', lang);
    if (val === 100) return t('wantBigger', lang);
    return "";
  };

  return (
    <div className="h-full w-full bg-white flex flex-col font-sans text-zinc-900 selection:bg-zinc-200">
      
      <header className="flex-none py-4 px-6 md:py-6 md:px-8 border-b border-zinc-100 flex items-center justify-between">
        <div>
          <h2 className="text-xl md:text-2xl font-semibold tracking-tight">{t('smartFitAssistant', lang)}</h2>
          <p className="text-zinc-500 text-[10px] md:text-sm mt-0.5 md:mt-1">{step === 1 ? t('refBrandSelection', lang) : t('detailedAnalysis', lang)}</p>
        </div>
        <div className="flex items-center gap-2">
          {step === 1 && (
            <Button 
              variant="ghost" 
              onClick={() => setStep('manual')} 
              className="h-8 md:h-10 px-3 rounded-full text-xs font-medium gap-2 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-ruler"><path d="M21.3 15.3a2.4 2.4 0 0 1 0 3.4l-2.6 2.6a2.4 2.4 0 0 1-3.4 0L2.7 8.7a2.41 2.41 0 0 1 0-3.4l2.6-2.6a2.41 2.41 0 0 1 3.4 0Z"/><path d="m14.5 12.5 2-2"/><path d="m11.5 9.5 2-2"/><path d="m8.5 6.5 2-2"/><path d="m17.5 15.5 2-2"/></svg>
              <span className="ml-1">{t('manualEntryBtn', lang) || 'Kendin Gir'}</span>
            </Button>
          )}
          {!session && step === 1 && (
            <Button 
              variant="outline" 
              onClick={async () => {
                const { error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.href }});
                if (error) console.error("Login error:", error.message);
              }} 
              className="h-8 md:h-10 px-3 rounded-full text-xs font-medium gap-2 border-zinc-200 text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900"
            >
              <svg className="w-3.5 h-3.5 md:w-4 md:h-4" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
              <span className="ml-1">{t('login', lang)}</span>
            </Button>
          )}
          {onClose && ( <Button variant="ghost" onClick={onCancel || onClose} className="rounded-full h-8 w-8 md:h-10 md:w-10 p-0 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100">✕</Button> )}
        </div>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-6 w-full max-w-none overflow-y-auto">
        
        {step === 'manual' && (
          <ManualMeasurementsStep
            category={category}
            lang={lang}
            unitSystem={unitSystem}
            onCancel={() => setStep(1)}
            onSave={handleManualSave}
          />
        )}

        {step === 1 && (
          <div className="w-full max-w-2xl space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <BrandSelectionStep 
              selectedGender={selectedGender}
              setSelectedGender={setSelectedGender}
              brands={brands.filter(b => availableBrandIds.includes(b.id))}
              loadingData={loadingData}
              onSelectBrand={(id) => { setSelectedBrand(id); setStep(2); }}
              hideGenderSelection={!!detectedGender}
              lang={lang}
            />
          </div>
        )}

        {step === 2 && (
          <div className="w-full max-w-4xl space-y-4 md:space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
            <div className="flex items-center justify-between">
               <Button variant="ghost" onClick={() => setStep(1)} className="text-zinc-400 hover:text-zinc-900 -ml-2 md:-ml-4 text-xs">← {t('changeBrand', lang)}</Button>
               <span className="bg-zinc-100 text-zinc-600 text-[9px] md:text-[10px] font-bold px-2 py-0.5 md:px-3 md:py-1 rounded-full tracking-widest uppercase">{selectedGender === 'women' ? t('women', lang) : t('men', lang)}</span>
            </div>

            <div className="text-center space-y-1 md:space-y-2">
                <h3 className="text-xl md:text-3xl font-light text-zinc-900">
                    {t('whatIsYourSize', lang, { brand: brands.find(b => b.id === selectedBrand)?.name || selectedBrand })}
                </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-12">
              <SizeFitSelectionStep 
                selectedSubCategory={selectedSubCategory}
                setSelectedSubCategory={setSelectedSubCategory}
                brandSubCategories={brandSubCategories}
                selectedFit={selectedFit}
                setSelectedFit={setSelectedFit}
                filteredFits={filteredFits}
                activeSystemTab={activeSystemTab}
                setActiveSystemTab={setActiveSystemTab}
                availableSystems={availableSystems}
                activeSizeList={activeSizeList}
                selectedSize={selectedSize}
                setSelectedSize={setSelectedSize}
                lang={lang}
              />

              <FeedbackSliders 
                physicalFeel={physicalFeel}
                setPhysicalFeel={setPhysicalFeel}
                satisfaction={satisfaction}
                setSatisfaction={setSatisfaction}
                getFeelLabel={getFeelLabel}
                getSatisfactionLabel={getSatisfactionLabel}
                lang={lang}
              />
            </div>

            <Button onClick={handleSave} disabled={!selectedSize || isSubmitting} className="w-full h-12 md:h-14 rounded-full text-xs md:text-sm uppercase tracking-widest shadow-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transition-all transform hover:scale-[1.01]">{isSubmitting ? t('calculating', lang) : t('analyze', lang)}</Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SmartProfiler;