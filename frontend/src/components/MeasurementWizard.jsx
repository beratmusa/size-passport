import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../supabaseClient';
import toast from 'react-hot-toast';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const GuideCard = ({ title, desc }) => (
  <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm flex flex-col">
    <h3 className="text-lg font-medium text-zinc-800 tracking-wide mb-2 uppercase">{title}</h3>
    <p className="text-sm text-zinc-500 font-light leading-relaxed mb-4">{desc}</p>
    <div className="w-full h-24 bg-zinc-50 border border-dashed border-zinc-300 rounded-xl flex items-center justify-center">
      <span className="text-[10px] text-zinc-400 uppercase tracking-widest text-center px-2">Görsel İllüstrasyon Alanı</span>
    </div>
  </div>
);

const MeasurementWizard = ({ session, onClose, onRefreshProfile }) => {
  const { t, i18n } = useTranslation();
  
  const [formData, setFormData] = useState({
    gender: 'erkek',
    basic_info: { height_cm: '', weight_kg: '' },
    measurements: { shoulder_width_cm: '', chest_circumference_cm: '', waist_circumference_cm: '', hip_circumference_cm: '', arm_length_cm: '', inseam_cm: '', outseam_cm: '' },
    preferences: { default_fit: 'regular' }
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!session || !session.user) return setIsFetching(false);
      try {
        const { data } = await supabase.from('user_profiles').select('*').eq('id', session.user.id).maybeSingle(); 
        if (data) {
          setFormData(prev => ({
            ...prev,
            gender: data.gender || 'erkek',
            basic_info: { ...prev.basic_info, ...(data.basic_info || {}) },
            measurements: { ...prev.measurements, ...(data.measurements || {}) },
            preferences: { ...prev.preferences, ...(data.preferences || {}) }
          }));
        }
      } catch (err) {
        toast.error("Profil yüklenirken bir hata oluştu.");
      } finally {
        setIsFetching(false);
      }
    };
    fetchProfile();
  }, [session]);

  const handleGenderChange = (selectedGender) => setFormData(prev => ({ ...prev, gender: selectedGender }));
  const handleBasicInfoChange = (e) => setFormData(prev => ({ ...prev, basic_info: { ...prev.basic_info, [e.target.name]: e.target.value === '' ? '' : Number(e.target.value) } }));
  const handleMeasurementChange = (e) => setFormData(prev => ({ ...prev, measurements: { ...prev.measurements, [e.target.name]: e.target.value === '' ? '' : Number(e.target.value) } }));
  const handlePreferenceChange = (fit) => setFormData(prev => ({ ...prev, preferences: { ...prev.preferences, default_fit: fit } }));

  const handleSave = async () => {
    setIsSubmitting(true);
    const { error } = await supabase.from('user_profiles').upsert({
      id: session.user.id,
      gender: formData.gender,
      basic_info: formData.basic_info,
      measurements: formData.measurements,
      preferences: formData.preferences,
      updated_at: new Date()
    });
    setIsSubmitting(false);

    if (error) {
      toast.error("Hata oluştu: " + error.message);
    } else {
      toast.success("Profiliniz başarıyla güncellendi!");
      if (onRefreshProfile) await onRefreshProfile();
      setTimeout(() => { if (onClose) onClose(); }, 600);
    }
  };

  // Okları gizleyen özel Tailwind class zinciri
  const noSpinnersClass = "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none";

  if (isFetching) return <div className="min-h-screen bg-zinc-50 flex items-center justify-center text-zinc-500">Profiliniz Yükleniyor...</div>;

  return (
    <div className="h-full w-full bg-[#F6F6F6] flex flex-col font-sans text-zinc-900 overflow-y-auto lg:overflow-hidden selection:bg-zinc-200">
      
      {/* HEADER KISMI */}
      <header className="flex-none w-full py-4 px-4 md:px-8 bg-white border-b border-zinc-200 z-10 flex items-center justify-between sticky top-0">
        
        <div className="hidden md:block">
          <h2 className="text-xl font-medium text-zinc-800 tracking-tight">Ölçü Sihirbazı</h2>
        </div>

        <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-[10px] uppercase tracking-[0.2em] text-zinc-500">{t('height')}</label>
              <div className="relative w-20">
                <Input type="number" name="height_cm" value={formData.basic_info.height_cm} onChange={handleBasicInfoChange} placeholder="180" className={`pr-7 text-center h-9 ${noSpinnersClass}`} />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-zinc-400">cm</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-[10px] uppercase tracking-[0.2em] text-zinc-500">{t('weight')}</label>
              <div className="relative w-20">
                <Input type="number" name="weight_kg" value={formData.basic_info.weight_kg} onChange={handleBasicInfoChange} placeholder="75" className={`pr-7 text-center h-9 ${noSpinnersClass}`} />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-zinc-400">kg</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant={formData.gender === 'kadin' ? 'default' : 'outline'} onClick={() => handleGenderChange('kadin')} className="h-9 px-4 rounded-full text-[10px] tracking-widest uppercase">
              {t('gender_female')}
            </Button>
            <Button variant={formData.gender === 'erkek' ? 'default' : 'outline'} onClick={() => handleGenderChange('erkek')} className="h-9 px-4 rounded-full text-[10px] tracking-widest uppercase">
              {t('gender_male')}
            </Button>
            
            {onClose && (
              <Button variant="destructive" onClick={onClose} className="h-9 rounded-full ml-2 text-[10px] tracking-widest uppercase">
                İptal
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* ALT KISIM (KİTAPÇIK VE SİLÜET) */}
      <div className="flex-1 flex flex-col lg:flex-row w-full max-w-[1600px] mx-auto overflow-y-auto lg:overflow-hidden relative">
        
        {/* SOL: REHBER */}
        <div className="w-full lg:w-1/3 p-6 lg:p-10 order-2 lg:order-1 lg:overflow-y-auto [&::-webkit-scrollbar]:hidden">
          <h3 className="text-xl font-light text-zinc-800 mb-6">{t('guide_title')}</h3>
          <div className="space-y-6 pb-20">
            <GuideCard title={`1. ${t('measurements.shoulder')}`} desc="Mezurayı sırtınızdan, iki omuz kemiği ucu arasında düz bir şekilde uzatarak ölçün." />
            <GuideCard title={`2. ${t('measurements.chest')}`} desc="Mezurayı göğsünüzün en geniş noktasından, yere paralel olacak şekilde vücudunuza sarın." />
            <GuideCard title={`3. ${t('measurements.waist')}`} desc="Mezurayı belinizin en ince noktasından çok sıkmadan ve nefesinizi tutmadan ölçün." />
            <GuideCard title={`4. ${t('measurements.arm')}`} desc="Omuz kemiğinize yerleştirdiğiniz mezurayı, dirseğinizin üzerinden bilek kemiğinize kadar ölçün." />
            {/* Alt Beden Rehberleri Geri Geldi */}
            <GuideCard title={`5. ${t('measurements.hip')}`} desc="Ayaklarınızı birleştirerek dik durun ve kalçanızın en geniş noktasından ölçün." />
            <GuideCard title={`6. ${t('measurements.inseam')}`} desc="Ağ bölgesinden başlayarak ayak bileği kemiğinize kadar olan iç mesafeyi ölçün." />
            <GuideCard title={`7. ${t('measurements.outseam')}`} desc="Belinizin en ince noktasından başlayarak, bacağınızın dış yanından ayak bileğinize kadar olan mesafeyi ölçün." />
          </div>
        </div>

        {/* SAĞ: SİLÜET VE INPUTLAR */}
        <div className="w-full lg:w-2/3 bg-white lg:border-l border-zinc-200 p-8 flex flex-col items-center justify-center relative order-1 lg:order-2 shadow-sm">
          
          <div className="relative w-full max-w-xl h-[500px] flex items-center justify-center">
            <svg viewBox="0 0 300 600" className="absolute h-[95%] w-auto text-zinc-300 stroke-current fill-none" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M 130 50 C 130 30, 170 30, 170 50 C 170 70, 160 80, 150 90 C 140 80, 130 70, 130 50 Z" />
              <path d="M 150 90 Q 150 110 195 120 L 220 280 M 150 90 Q 150 110 105 120 L 80 280" />
              <path d="M 115 125 L 125 320 Q 150 330 175 320 L 185 125" />
              <path d="M 125 320 L 105 540 L 125 550 L 145 350 M 175 320 L 195 540 L 175 550 L 155 350" />
            </svg>

            {/* OMUZ (Sol) */}
            <div className="absolute top-[18%] left-[0%] md:left-[8%] flex items-center group">
              <div className="mr-3 flex flex-col items-end">
                <label className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 mb-1">{t('measurements.shoulder')}</label>
                <div className="relative w-20">
                  <Input type="number" name="shoulder_width_cm" value={formData.measurements.shoulder_width_cm} onChange={handleMeasurementChange} placeholder="00" className={`pr-6 text-center h-8 ${noSpinnersClass}`} />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-zinc-400">cm</span>
                </div>
              </div>
              <div className="w-16 border-b border-dashed border-zinc-300"></div>
            </div>

            {/* BEL (Sol) */}
            <div className="absolute top-[38%] left-[0%] md:left-[8%] flex items-center group">
              <div className="mr-3 flex flex-col items-end">
                <label className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 mb-1">{t('measurements.waist')}</label>
                <div className="relative w-20">
                  <Input type="number" name="waist_circumference_cm" value={formData.measurements.waist_circumference_cm} onChange={handleMeasurementChange} placeholder="00" className={`pr-6 text-center h-8 ${noSpinnersClass}`} />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-zinc-400">cm</span>
                </div>
              </div>
              <div className="w-20 border-b border-dashed border-zinc-300"></div>
            </div>

            {/* KALÇA (Sol) - Geri Geldi */}
            <div className="absolute top-[55%] left-[0%] md:left-[8%] flex items-center group">
              <div className="mr-3 flex flex-col items-end">
                <label className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 mb-1">{t('measurements.hip')}</label>
                <div className="relative w-20">
                  <Input type="number" name="hip_circumference_cm" value={formData.measurements.hip_circumference_cm} onChange={handleMeasurementChange} placeholder="00" className={`pr-6 text-center h-8 ${noSpinnersClass}`} />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-zinc-400">cm</span>
                </div>
              </div>
              <div className="w-16 border-b border-dashed border-zinc-300"></div>
            </div>

            {/* DIŞ BACAK (Sol) - Geri Geldi */}
            <div className="absolute top-[72%] left-[0%] md:left-[8%] flex items-center group">
              <div className="mr-3 flex flex-col items-end">
                <label className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 mb-1">{t('measurements.outseam')}</label>
                <div className="relative w-20">
                  <Input type="number" name="outseam_cm" value={formData.measurements.outseam_cm} onChange={handleMeasurementChange} placeholder="00" className={`pr-6 text-center h-8 ${noSpinnersClass}`} />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-zinc-400">cm</span>
                </div>
              </div>
              <div className="w-24 border-b border-dashed border-zinc-300"></div>
            </div>

            {/* GÖĞÜS (Sağ) */}
            <div className="absolute top-[28%] right-[0%] md:right-[8%] flex items-center flex-row-reverse group">
              <div className="ml-3 flex flex-col items-start">
                <label className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 mb-1">{t('measurements.chest')}</label>
                <div className="relative w-20">
                  <Input type="number" name="chest_circumference_cm" value={formData.measurements.chest_circumference_cm} onChange={handleMeasurementChange} placeholder="00" className={`pr-6 text-center h-8 ${noSpinnersClass}`} />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-zinc-400">cm</span>
                </div>
              </div>
              <div className="w-12 border-b border-dashed border-zinc-300"></div>
            </div>

            {/* KOL (Sağ) */}
            <div className="absolute top-[48%] right-[0%] md:right-[8%] flex items-center flex-row-reverse group">
              <div className="ml-3 flex flex-col items-start">
                <label className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 mb-1">{t('measurements.arm')}</label>
                <div className="relative w-20">
                  <Input type="number" name="arm_length_cm" value={formData.measurements.arm_length_cm} onChange={handleMeasurementChange} placeholder="00" className={`pr-6 text-center h-8 ${noSpinnersClass}`} />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-zinc-400">cm</span>
                </div>
              </div>
              <div className="w-8 border-b border-dashed border-zinc-300"></div>
            </div>

            {/* İÇ BACAK (Sağ) - Geri Geldi */}
            <div className="absolute top-[65%] right-[0%] md:right-[8%] flex items-center flex-row-reverse group">
              <div className="ml-3 flex flex-col items-start">
                <label className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 mb-1">{t('measurements.inseam')}</label>
                <div className="relative w-20">
                  <Input type="number" name="inseam_cm" value={formData.measurements.inseam_cm} onChange={handleMeasurementChange} placeholder="00" className={`pr-6 text-center h-8 ${noSpinnersClass}`} />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-zinc-400">cm</span>
                </div>
              </div>
              <div className="w-20 border-b border-dashed border-zinc-300"></div>
            </div>

          </div>

          {/* ALT BUTONLAR */}
          <div className="w-full max-w-md mt-8 flex flex-col gap-4">
            
            <div className="flex gap-3">
              {['slim', 'regular', 'oversize'].map((fit) => (
                <Button 
                  key={fit} 
                  variant={formData.preferences.default_fit === fit ? 'default' : 'outline'}
                  onClick={() => handlePreferenceChange(fit)} 
                  className="flex-1 rounded-full text-[10px] uppercase tracking-widest h-10 shadow-sm"
                >
                  {t(`fits.${fit}`)}
                </Button>
              ))}
            </div>

            <Button onClick={handleSave} disabled={isSubmitting} className="w-full h-12 rounded-full text-xs uppercase tracking-widest shadow-lg">
              {isSubmitting ? "Kaydediliyor..." : "Profili Kaydet ve Güncelle"}
            </Button>
            
          </div>

        </div>
      </div>
    </div>
  );
};

export default MeasurementWizard;