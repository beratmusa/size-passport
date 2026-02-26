import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../supabaseClient';
import toast from 'react-hot-toast';

const GuideCard = ({ title, desc }) => (
  <div className="bg-white border border-zinc-200 rounded-xl md:rounded-2xl p-4 md:p-6 shadow-sm flex flex-col">
    <h3 className="text-base md:text-lg font-medium text-zinc-800 tracking-wide mb-1 md:mb-2 uppercase">{title}</h3>
    <p className="text-xs md:text-sm text-zinc-500 font-light leading-relaxed mb-3 md:mb-4">{desc}</p>
    <div className="w-full h-20 md:h-24 bg-[#F9F9F9] border border-dashed border-zinc-300 rounded-lg md:rounded-xl flex items-center justify-center">
      <span className="text-[8px] md:text-[10px] text-zinc-400 uppercase tracking-widest text-center px-2">Görsel İllüstrasyon Alanı</span>
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
        const { data, error } = await supabase.from('user_profiles').select('*').eq('id', session.user.id).maybeSingle(); 
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
        console.error("Hata:", err);
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

    
     if (!formData.basic_info.height_cm || !formData.basic_info.weight_kg) {
       toast.error("Lütfen boy ve kilo bilgilerinizi giriniz.");
       setIsSubmitting(false);
       return;
     }

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
      // YENİ: Hata durumu için kırmızı şık bildirim
      toast.error("Hata oluştu: " + error.message);
    } else {
      // YENİ: Başarılı durumu için yeşil şık bildirim
      toast.success("Profiliniz başarıyla güncellendi!");
      
      if (onRefreshProfile) await onRefreshProfile();
      
      // Bildirimin okunması için modal kapanmasını çok kısa (yarım saniye) geciktiriyoruz
      setTimeout(() => {
        if (onClose) onClose(); 
      }, 600);
    }
  };

  if (isFetching) return <div className="min-h-screen bg-zinc-50 flex items-center justify-center text-zinc-500">Profiliniz Yükleniyor...</div>;

  return (
    <div className="h-full w-full bg-[#F6F6F6] flex flex-col font-sans text-zinc-900 overflow-y-auto lg:overflow-hidden selection:bg-zinc-200">
      
      <header className="flex-none w-full py-4 px-4 md:px-8 bg-white border-b border-zinc-200 z-10 flex flex-col xl:flex-row items-center justify-between gap-4 sticky top-0">
        
        <div className="text-center xl:text-left hidden md:block">
          <h2 className="text-lg md:text-xl font-medium text-zinc-800 tracking-tight">Ölçü Sihirbazı</h2>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full xl:w-auto">
          
          <div className="flex items-center gap-2 md:gap-4 bg-[#F9F9F9] px-3 md:px-5 py-2 md:py-2.5 rounded-full border border-zinc-200 shadow-sm w-full sm:w-auto justify-center h-[38px] md:h-[42px]">
            <div className="flex items-center gap-1.5 md:gap-2">
              <label className="text-[8px] md:text-[10px] uppercase tracking-[0.2em] text-zinc-500">{t('height')}</label>
              <div className="flex items-baseline border-b border-zinc-300 pb-0.5 group hover:border-zinc-500 transition-colors">
                <input type="number" name="height_cm" value={formData.basic_info.height_cm} onChange={handleBasicInfoChange} className="w-6 md:w-8 bg-transparent text-zinc-800 text-center text-xs md:text-sm focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" placeholder="180" />
                <span className="text-zinc-400 text-[8px] md:text-[10px] ml-0.5">cm</span>
              </div>
            </div>
            <div className="w-px h-4 md:h-5 bg-zinc-300"></div>
            <div className="flex items-center gap-1.5 md:gap-2">
              <label className="text-[8px] md:text-[10px] uppercase tracking-[0.2em] text-zinc-500">{t('weight')}</label>
              <div className="flex items-baseline border-b border-zinc-300 pb-0.5 group hover:border-zinc-500 transition-colors">
                <input type="number" name="weight_kg" value={formData.basic_info.weight_kg} onChange={handleBasicInfoChange} className="w-6 md:w-8 bg-transparent text-zinc-800 text-center text-xs md:text-sm focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" placeholder="75" />
                <span className="text-zinc-400 text-[8px] md:text-[10px] ml-0.5">kg</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-center h-[38px] md:h-[42px]">
            <button onClick={() => handleGenderChange('kadin')} className={`h-full px-4 md:px-5 rounded-full text-[8px] md:text-[10px] font-medium tracking-widest uppercase transition-all duration-300 border ${formData.gender === 'kadin' ? 'bg-zinc-900 text-white border-zinc-900 shadow-sm' : 'bg-transparent text-zinc-500 border-zinc-300 hover:border-zinc-400'}`}>{t('gender_female')}</button>
            <button onClick={() => handleGenderChange('erkek')} className={`h-full px-4 md:px-5 rounded-full text-[8px] md:text-[10px] font-medium tracking-widest uppercase transition-all duration-300 border ${formData.gender === 'erkek' ? 'bg-zinc-900 text-white border-zinc-900 shadow-sm' : 'bg-transparent text-zinc-500 border-zinc-300 hover:border-zinc-400'}`}>{t('gender_male')}</button>
            
            {onClose && (
              <button onClick={onClose} className="h-full ml-1 md:ml-2 px-4 md:px-5 rounded-full text-[8px] md:text-[10px] font-bold tracking-widest uppercase transition-all duration-300 bg-red-50 text-red-500 border border-red-200 hover:bg-red-100 hover:text-red-600 shadow-sm">
                İptal Et
              </button>
            )}
          </div>
          
        </div>
      </header>

      <div className="flex-1 flex flex-col lg:flex-row w-full max-w-[1600px] mx-auto overflow-y-auto lg:overflow-hidden relative">
        <div className="w-full lg:w-5/12 xl:w-1/3 p-4 sm:p-6 lg:p-10 order-2 lg:order-1 lg:overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <h3 className="text-lg md:text-xl font-light text-zinc-800 mb-4 md:mb-6 text-center lg:text-left">{t('guide_title')}</h3>
          <div className="space-y-4 md:space-y-6 pb-10 lg:pb-20">
            <GuideCard title={`1. ${t('measurements.shoulder')}`} desc="Mezurayı sırtınızdan, iki omuz kemiği ucu arasında düz bir şekilde uzatarak ölçün." />
            <GuideCard title={`2. ${t('measurements.chest')}`} desc="Mezurayı göğsünüzün en geniş noktasından, yere paralel olacak şekilde vücudunuza sarın." />
            <GuideCard title={`3. ${t('measurements.waist')}`} desc="Mezurayı belinizin en ince noktasından çok sıkmadan ve nefesinizi tutmadan ölçün." />
            <GuideCard title={`4. ${t('measurements.arm')}`} desc="Omuz kemiğinize yerleştirdiğiniz mezurayı, dirseğinizin üzerinden bilek kemiğinize kadar ölçün." />
            <GuideCard title={`5. ${t('measurements.hip')}`} desc="Ayaklarınızı birleştirerek dik durun ve kalçanızın en geniş noktasından ölçün." />
            <GuideCard title={`6. ${t('measurements.inseam')}`} desc="Ağ bölgesinden başlayarak ayak bileği kemiğinize kadar olan iç mesafeyi ölçün." />
            <GuideCard title={`7. ${t('measurements.outseam')}`} desc="Belinizin en ince noktasından başlayarak, bacağınızın dış yanından ayak bileğinize kadar olan mesafeyi ölçün." />
          </div>
        </div>

        <div className="w-full lg:w-7/12 xl:w-2/3 bg-white lg:border-l border-zinc-200 p-2 sm:p-4 lg:p-8 flex flex-col items-center justify-start lg:justify-center relative order-1 lg:order-2 shadow-sm lg:shadow-[-10px_0_30px_rgba(0,0,0,0.02)] border-b lg:border-b-0 pb-8 lg:pb-0">
          
          <div className="relative w-full max-w-xl h-[380px] sm:h-[460px] lg:h-[500px] flex items-center justify-center mt-4 lg:mt-0">
            <svg viewBox="0 0 300 600" className="absolute h-[90%] sm:h-[95%] w-auto text-zinc-300 stroke-current fill-none" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M 130 50 C 130 30, 170 30, 170 50 C 170 70, 160 80, 150 90 C 140 80, 130 70, 130 50 Z" />
              <path d="M 150 90 Q 150 110 195 120 L 220 280 M 150 90 Q 150 110 105 120 L 80 280" />
              <path d="M 115 125 L 125 320 Q 150 330 175 320 L 185 125" />
              <path d="M 125 320 L 105 540 L 125 550 L 145 350 M 175 320 L 195 540 L 175 550 L 155 350" />
            </svg>

            <div className="absolute top-[18%] left-[0%] md:left-[8%] flex items-center group">
              <div className="mr-1 md:mr-2 flex flex-col items-end">
                <label className="text-[8px] md:text-[10px] uppercase tracking-[0.2em] text-zinc-500 mb-0.5 md:mb-1">{t('measurements.shoulder')}</label>
                <div className="flex items-baseline border-b border-zinc-300 pb-0.5 md:pb-1 group-hover:border-zinc-500 transition-colors">
                  <input type="number" name="shoulder_width_cm" value={formData.measurements.shoulder_width_cm} onChange={handleMeasurementChange} className="w-8 md:w-10 bg-transparent text-zinc-800 text-center text-sm md:text-lg focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" placeholder="00" />
                  <span className="text-zinc-400 text-[8px] md:text-xs ml-0.5 md:ml-1">cm</span>
                </div>
              </div>
              <div className="w-6 md:w-20 border-b border-zinc-300 group-hover:border-zinc-500 transition-colors"></div>
            </div>

            <div className="absolute top-[38%] left-[0%] md:left-[8%] flex items-center group">
              <div className="mr-1 md:mr-2 flex flex-col items-end">
                <label className="text-[8px] md:text-[10px] uppercase tracking-[0.2em] text-zinc-500 mb-0.5 md:mb-1">{t('measurements.waist')}</label>
                <div className="flex items-baseline border-b border-zinc-300 pb-0.5 md:pb-1 group-hover:border-zinc-500 transition-colors">
                  <input type="number" name="waist_circumference_cm" value={formData.measurements.waist_circumference_cm} onChange={handleMeasurementChange} className="w-8 md:w-10 bg-transparent text-zinc-800 text-center text-sm md:text-lg focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" placeholder="00" />
                  <span className="text-zinc-400 text-[8px] md:text-xs ml-0.5 md:ml-1">cm</span>
                </div>
              </div>
              <div className="w-8 md:w-24 border-b border-zinc-300 group-hover:border-zinc-500 transition-colors"></div>
            </div>

            <div className="absolute top-[55%] left-[0%] md:left-[8%] flex items-center group">
              <div className="mr-1 md:mr-2 flex flex-col items-end">
                <label className="text-[8px] md:text-[10px] uppercase tracking-[0.2em] text-zinc-500 mb-0.5 md:mb-1">{t('measurements.hip')}</label>
                <div className="flex items-baseline border-b border-zinc-300 pb-0.5 md:pb-1 group-hover:border-zinc-500 transition-colors">
                  <input type="number" name="hip_circumference_cm" value={formData.measurements.hip_circumference_cm} onChange={handleMeasurementChange} className="w-8 md:w-10 bg-transparent text-zinc-800 text-center text-sm md:text-lg focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" placeholder="00" />
                  <span className="text-zinc-400 text-[8px] md:text-xs ml-0.5 md:ml-1">cm</span>
                </div>
              </div>
              <div className="w-8 md:w-20 border-b border-zinc-300 group-hover:border-zinc-500 transition-colors"></div>
            </div>

            <div className="absolute top-[72%] left-[0%] md:left-[8%] flex items-center group">
              <div className="mr-1 md:mr-2 flex flex-col items-end">
                <label className="text-[8px] md:text-[10px] uppercase tracking-[0.2em] text-zinc-500 mb-0.5 md:mb-1">{t('measurements.outseam')}</label>
                <div className="flex items-baseline border-b border-zinc-300 pb-0.5 md:pb-1 group-hover:border-zinc-500 transition-colors">
                  <input type="number" name="outseam_cm" value={formData.measurements.outseam_cm} onChange={handleMeasurementChange} className="w-8 md:w-10 bg-transparent text-zinc-800 text-center text-sm md:text-lg focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" placeholder="00" />
                  <span className="text-zinc-400 text-[8px] md:text-xs ml-0.5 md:ml-1">cm</span>
                </div>
              </div>
              <div className="w-10 md:w-24 border-b border-zinc-300 group-hover:border-zinc-500 transition-colors"></div>
            </div>

            <div className="absolute top-[28%] right-[0%] md:right-[8%] flex items-center flex-row-reverse group">
              <div className="ml-1 md:ml-2 flex flex-col items-start">
                <label className="text-[8px] md:text-[10px] uppercase tracking-[0.2em] text-zinc-500 mb-0.5 md:mb-1">{t('measurements.chest')}</label>
                <div className="flex items-baseline border-b border-zinc-300 pb-0.5 md:pb-1 group-hover:border-zinc-500 transition-colors">
                  <input type="number" name="chest_circumference_cm" value={formData.measurements.chest_circumference_cm} onChange={handleMeasurementChange} className="w-8 md:w-10 bg-transparent text-zinc-800 text-center text-sm md:text-lg focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" placeholder="00" />
                  <span className="text-zinc-400 text-[8px] md:text-xs ml-0.5 md:ml-1">cm</span>
                </div>
              </div>
              <div className="w-6 md:w-16 border-b border-zinc-300 group-hover:border-zinc-500 transition-colors"></div>
            </div>

            <div className="absolute top-[48%] right-[0%] md:right-[8%] flex items-center flex-row-reverse group">
              <div className="ml-1 md:ml-2 flex flex-col items-start">
                <label className="text-[8px] md:text-[10px] uppercase tracking-[0.2em] text-zinc-500 mb-0.5 md:mb-1">{t('measurements.arm')}</label>
                <div className="flex items-baseline border-b border-zinc-300 pb-0.5 md:pb-1 group-hover:border-zinc-500 transition-colors">
                  <input type="number" name="arm_length_cm" value={formData.measurements.arm_length_cm} onChange={handleMeasurementChange} className="w-8 md:w-10 bg-transparent text-zinc-800 text-center text-sm md:text-lg focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" placeholder="00" />
                  <span className="text-zinc-400 text-[8px] md:text-xs ml-0.5 md:ml-1">cm</span>
                </div>
              </div>
              <div className="w-3 md:w-10 border-b border-zinc-300 group-hover:border-zinc-500 transition-colors"></div>
            </div>

            <div className="absolute top-[65%] right-[0%] md:right-[8%] flex items-center flex-row-reverse group">
              <div className="ml-1 md:ml-2 flex flex-col items-start">
                <label className="text-[8px] md:text-[10px] uppercase tracking-[0.2em] text-zinc-500 mb-0.5 md:mb-1">{t('measurements.inseam')}</label>
                <div className="flex items-baseline border-b border-zinc-300 pb-0.5 md:pb-1 group-hover:border-zinc-500 transition-colors">
                  <input type="number" name="inseam_cm" value={formData.measurements.inseam_cm} onChange={handleMeasurementChange} className="w-8 md:w-10 bg-transparent text-zinc-800 text-center text-sm md:text-lg focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" placeholder="00" />
                  <span className="text-zinc-400 text-[8px] md:text-xs ml-0.5 md:ml-1">cm</span>
                </div>
              </div>
              <div className="w-12 md:w-24 border-b border-zinc-300 group-hover:border-zinc-500 transition-colors"></div>
            </div>

          </div>

          <div className="w-full max-w-lg mt-4 md:mt-6 flex flex-col items-center gap-3 md:gap-4 px-2">
            <div className="w-full flex gap-2 md:gap-3">
              {['slim', 'regular', 'oversize'].map((fit) => (
                <button key={fit} onClick={() => handlePreferenceChange(fit)} className={`flex-1 py-2.5 md:py-3 text-[8px] md:text-[10px] font-medium rounded-full border transition-all duration-300 transform hover:scale-105 active:scale-95 uppercase tracking-widest ${formData.preferences.default_fit === fit ? 'bg-zinc-900 text-white border-zinc-900 shadow-md' : 'bg-white text-zinc-500 border-zinc-200 hover:border-zinc-400 shadow-sm'}`}>
                  {t(`fits.${fit}`)}
                </button>
              ))}
            </div>

            <button onClick={handleSave} disabled={isSubmitting} className="w-full bg-zinc-900 hover:bg-zinc-800 text-white font-medium py-3.5 md:py-4 px-8 rounded-full transition-all duration-300 transform hover:scale-105 active:scale-95 flex items-center justify-center gap-2 uppercase tracking-widest text-[10px] md:text-[11px] shadow-lg mt-1 md:mt-2">
              {isSubmitting ? <span className="animate-pulse">{t('saving')}</span> : <>Profili Kaydet ve Güncelle <svg className="w-3 h-3 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg></>}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default MeasurementWizard;