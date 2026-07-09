import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import toast from 'react-hot-toast';

import { Button } from "@/components/ui/button";
import BrandSelectionStep from './profiler/BrandSelectionStep';
import SizeFitSelectionStep from './profiler/SizeFitSelectionStep';
import FeedbackSliders from './profiler/FeedbackSliders';
import { estimateUserMeasurements, sortSizes } from '../lib/size-engine';
import { detectProductCategory, detectProductGender } from '../lib/utils';

const SIZE_CONFIG = {
  letter: ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL'], 
  inch: ['28', '29', '30', '31', '32', '33', '34', '36', '38']
};

const SmartProfiler = ({ session, onClose, onCancel, onRefreshProfile, onGuestProfileCreated, productCategory, productSubCategory, productName }) => {
  const [step, setStep] = useState(1);
  const [brands, setBrands] = useState([]);
  const [fitOptions, setFitOptions] = useState([]); 
  const [loadingData, setLoadingData] = useState(true);

  // Akıllı Algılama Fonksiyonları
  const detectedGender = detectProductGender(productCategory, productName);
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

  // 2. OTOMATİK AYARLAR (Kategori değişince çalışır)
  useEffect(() => {
    // Kategori değişince Beden ve Fit seçimini sıfırla (Hata olmaması için)
    setSelectedSize('');
    setSelectedFit('regular'); // Her kategoride olan güvenli bir liman
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
    // 1. Kategori bazlı filtre (eski mantık)
    const isCategoryMatch = (fit.category === 'all' || !fit.category || fit.category === category);
    if (!isCategoryMatch) return false;
    
    // 2. Markaya özel kesim filtresi (veritabanında o markanın kesimleri varsa)
    if (brandFits.length > 0) {
      return brandFits.includes(fit.name.toLowerCase().trim());
    }
    
    return true; 
  });

  // Beden listesi direkt DB'den, DB boşsa kategoriye göre varsayılan
  const activeSizeList = brandSizes.length > 0 
    ? brandSizes.filter(s => {
        if (!activeSystemTab || availableSystems.length <= 1) return true;
        return s.system === activeSystemTab || (!s.system && activeSystemTab === 'universal');
      })
    : (selectedSubCategory === 'jeans' || selectedSubCategory === 'pants' || category === 'bottom' ? SIZE_CONFIG.inch : SIZE_CONFIG.letter);

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
      toast("Tam veri bulunamadı, tahmini kalıp kullanılıyor.", { icon: 'ℹ️' });
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

    const profileData = {
      gender: selectedGender,
      measurements: bodyMeasurements,
      preferences: { 
        default_fit: userFitPreference, 
        reference_brand: selectedBrand, 
        reference_size: selectedSize 
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
        toast.success("Guest profile created!");
        onGuestProfileCreated(profileData);
      } else {
        toast.success("Profile created successfully!");
        if (onRefreshProfile) await onRefreshProfile();
      }
      setTimeout(() => { if (onClose) onClose(); }, 600);
    } else {
      toast.error("An error occurred.");
    }
  };

  // UI Helper Fonksiyonları...
  const getFeelLabel = (val) => {
    if (val === 0) return "Too Small";
    if (val === 25) return "A Bit Small";
    if (val === 50) return "Perfect";
    if (val === 75) return "A Bit Big";
    if (val === 100) return "Too Big";
    return "";
  };
  
  const getSatisfactionLabel = (val) => {
    if (val === 0) return "Want Smaller";
    if (val === 50) return "Perfect";
    if (val === 100) return "Want Bigger";
    return "";
  };

  return (
    <div className="h-full w-full bg-white flex flex-col font-sans text-zinc-900 selection:bg-zinc-200">
      
      <header className="flex-none py-4 px-6 md:py-6 md:px-8 border-b border-zinc-100 flex items-center justify-between">
        <div>
          <h2 className="text-xl md:text-2xl font-semibold tracking-tight">Smart Fit Assistant</h2>
          <p className="text-zinc-500 text-[10px] md:text-sm mt-0.5 md:mt-1">{step === 1 ? 'Reference Brand Selection' : 'Detailed Analysis'}</p>
        </div>
        {onClose && ( <Button variant="ghost" onClick={onCancel || onClose} className="rounded-full h-8 w-8 md:h-10 md:w-10 p-0">✕</Button> )}
      </header>

      <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-6 w-full max-w-none overflow-y-auto">
        
        {step === 1 && (
          <div className="w-full max-w-2xl space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <BrandSelectionStep 
              selectedGender={selectedGender}
              setSelectedGender={setSelectedGender}
              brands={brands}
              loadingData={loadingData}
              onSelectBrand={(id) => { setSelectedBrand(id); setStep(2); }}
              hideGenderSelection={!!detectedGender}
            />
          </div>
        )}

        {step === 2 && (
          <div className="w-full max-w-4xl space-y-4 md:space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
            <div className="flex items-center justify-between">
               <Button variant="ghost" onClick={() => setStep(1)} className="text-zinc-400 hover:text-zinc-900 -ml-2 md:-ml-4 text-xs">← Change Brand</Button>
               <span className="bg-zinc-100 text-zinc-600 text-[9px] md:text-[10px] font-bold px-2 py-0.5 md:px-3 md:py-1 rounded-full tracking-widest uppercase">{selectedGender === 'women' ? 'Women' : 'Men'}</span>
            </div>

            <div className="text-center space-y-1 md:space-y-2">
                <h3 className="text-xl md:text-3xl font-light text-zinc-900">
                    What is your size in <span className="capitalize font-medium">{brands.find(b => b.id === selectedBrand)?.name || selectedBrand}</span>?
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
              />

              <FeedbackSliders 
                physicalFeel={physicalFeel}
                setPhysicalFeel={setPhysicalFeel}
                satisfaction={satisfaction}
                setSatisfaction={setSatisfaction}
                getFeelLabel={getFeelLabel}
                getSatisfactionLabel={getSatisfactionLabel}
              />
            </div>

            <Button onClick={handleSave} disabled={!selectedSize || isSubmitting} className="w-full h-12 md:h-14 rounded-full text-xs md:text-sm uppercase tracking-widest shadow-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transition-all transform hover:scale-[1.01]">{isSubmitting ? "Calculating..." : "Analyze"}</Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SmartProfiler;