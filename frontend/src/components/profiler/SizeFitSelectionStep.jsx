import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { t } from '../../lib/i18n';

const SizeFitSelectionStep = ({
  selectedSubCategory,
  setSelectedSubCategory,
  brandSubCategories,
  selectedFit,
  setSelectedFit,
  filteredFits,
  activeSystemTab,
  setActiveSystemTab,
  availableSystems,
  activeSizeList,
  selectedSize,
  setSelectedSize,
  lang = 'en'
}) => {
  return (
    <div className="space-y-5">
      {/* --- ÜRÜN (SUB CATEGORY) DROPDOWN --- */}
      <div className="space-y-1">
         <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest pl-1">{t('productType', lang)}</label>
         <Select value={selectedSubCategory} onValueChange={setSelectedSubCategory}>
          <SelectTrigger className="h-10 bg-white border-zinc-200 capitalize">
              <SelectValue placeholder={t('selectProduct', lang)} />
          </SelectTrigger>
          <SelectContent>
            {(brandSubCategories.length > 0 ? brandSubCategories : [selectedSubCategory]).map((subCat) => (
                <SelectItem key={subCat} value={subCat} className="capitalize">
                  {subCat.replace('-', ' ')}
                </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* --- FİLTRELENMİŞ KESİM DROPDOWN --- */}
      <div className="space-y-1">
         <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest pl-1">{t('fitCut', lang)}</label>
         <Select value={selectedFit} onValueChange={setSelectedFit}>
          <SelectTrigger className="h-10 bg-white border-zinc-200 capitalize">
              <SelectValue placeholder={t('selectFit', lang)} />
          </SelectTrigger>
          <SelectContent>
            {filteredFits.length > 0 ? (
              filteredFits.map((fit) => (
                  <SelectItem key={fit.id} value={fit.name} className="capitalize">
                    {fit.name} Fit
                  </SelectItem>
              ))
            ) : (
              <SelectItem value="regular" disabled>No fits found for this brand</SelectItem>
            )}
          </SelectContent>
        </Select>
      </div>

      {availableSystems.length > 1 && (
        <Tabs value={activeSystemTab} onValueChange={(val) => {
           setActiveSystemTab(val);
           setSelectedSize('');
        }} className="w-full">
           <TabsList className="w-full flex bg-zinc-100 p-1 h-9">
             {availableSystems.map(sys => (
               <TabsTrigger key={sys} value={sys} className="flex-1 text-[10px] h-7 uppercase">
                 {sys === 'universal' ? 'LETTER' : sys}
               </TabsTrigger>
             ))}
           </TabsList>
        </Tabs>
      )}

      <div className="space-y-2 pt-1">
        <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest pl-1">{t('selectYourSize', lang)}</label>
        <div className="grid grid-cols-4 gap-2 max-h-[140px] overflow-y-auto pr-1">
          {activeSizeList.map(s => {
            const label = typeof s === 'string' ? s : s.label;
            const sysKey = typeof s === 'string' ? s : `${s.rawSize}-${s.system || 'all'}`;
            return (
              <button key={sysKey} onClick={() => setSelectedSize(label)} className={`h-10 rounded-lg text-sm font-medium border transition-all flex-shrink-0 ${selectedSize === label ? 'bg-zinc-900 text-white border-zinc-900' : 'bg-white text-zinc-600 border-zinc-200 hover:border-zinc-400'}`}>
                {label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default SizeFitSelectionStep;
