import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { t } from '../../lib/i18n';

const ManualMeasurementsStep = ({ category, onSave, onCancel, lang = 'en', unitSystem = 'cm' }) => {
  const isTop = category === 'top' || category === 'tshirt';

  const unit = unitSystem === 'imperial' || unitSystem === 'inch' || unitSystem === 'in' ? 'in' : 'cm';
  const unitMultiplier = unit === 'in' ? 2.54 : 1;

  
  const [measurements, setMeasurements] = useState({
    chest: '',
    waist: '',
    hip: '',
    shoulder: '',
    arm: '',
    inseam: '',
    length: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setMeasurements(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveClick = () => {
    // Only pass values that are actually filled
    const cleanMeasurements = {};
    Object.keys(measurements).forEach(key => {
      if (measurements[key]) {
        // Multiply by unitMultiplier to convert inches to cm if necessary
        cleanMeasurements[key] = parseFloat(measurements[key]) * unitMultiplier;
      }
    });
    onSave(cleanMeasurements);
  };

  const isFormValid = () => {
    if (isTop) {
      return measurements.chest && measurements.waist;
    } else {
      return measurements.waist && measurements.hip;
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 bg-white p-6 rounded-2xl shadow-sm border border-zinc-100">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onCancel} className="text-zinc-400 hover:text-zinc-900 -ml-4 text-xs">
          ← {t('back', lang) || 'Geri'}
        </Button>
        <span className="bg-zinc-100 text-zinc-600 text-[10px] font-bold px-3 py-1 rounded-full tracking-widest uppercase">
          {t('manualEntry', lang) || 'MANUAL ENTRY'}
        </span>
      </div>

      <div className="text-center space-y-2">
        <h3 className="text-2xl font-light text-zinc-900">
          {t('enterMeasurementsTitle', lang)}
        </h3>
        <p className="text-sm text-zinc-500">
          {t('enterMeasurementsDesc', lang, { unit: unit })}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {isTop ? (
          <>
            <div className="space-y-2">
              <Label htmlFor="chest" className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">{t('chest', lang)} ({unit}) *</Label>
              <Input id="chest" name="chest" type="number" value={measurements.chest} onChange={handleChange} placeholder="Örn: 100" className="h-12 bg-zinc-50/50" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="waist" className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">{t('waist', lang)} ({unit}) *</Label>
              <Input id="waist" name="waist" type="number" value={measurements.waist} onChange={handleChange} placeholder="Örn: 90" className="h-12 bg-zinc-50/50" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="shoulder" className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">{t('shoulder', lang)} ({unit})</Label>
              <Input id="shoulder" name="shoulder" type="number" value={measurements.shoulder} onChange={handleChange} placeholder="Örn: 45" className="h-12 bg-zinc-50/50" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="arm" className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">{t('armLength', lang)} ({unit})</Label>
              <Input id="arm" name="arm" type="number" value={measurements.arm} onChange={handleChange} placeholder="Örn: 64" className="h-12 bg-zinc-50/50" />
            </div>
          </>
        ) : (
          <>
            <div className="space-y-2">
              <Label htmlFor="waist" className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">{t('waist', lang)} ({unit}) *</Label>
              <Input id="waist" name="waist" type="number" value={measurements.waist} onChange={handleChange} placeholder="Örn: 84" className="h-12 bg-zinc-50/50" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hip" className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">{t('hip', lang)} ({unit}) *</Label>
              <Input id="hip" name="hip" type="number" value={measurements.hip} onChange={handleChange} placeholder="Örn: 100" className="h-12 bg-zinc-50/50" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="inseam" className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">{t('inseam', lang)} ({unit})</Label>
              <Input id="inseam" name="inseam" type="number" value={measurements.inseam} onChange={handleChange} placeholder="Örn: 81" className="h-12 bg-zinc-50/50" />
            </div>
          </>
        )}
      </div>

      <Button 
        onClick={handleSaveClick} 
        disabled={!isFormValid()} 
        className="w-full h-12 rounded-full text-sm uppercase tracking-widest shadow-xl bg-gradient-to-r from-zinc-800 to-zinc-900 hover:from-black hover:to-black transition-all"
      >
        {t('saveMeasurements', lang)}
      </Button>
    </div>
  );
};

export default ManualMeasurementsStep;
