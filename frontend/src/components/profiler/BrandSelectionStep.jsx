import React from 'react';

const BrandSelectionStep = ({ selectedGender, setSelectedGender, brands, loadingData, onSelectBrand }) => {
  return (
    <div className="w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-center mb-6">
        <div className="bg-zinc-100 p-1 rounded-full flex gap-1">
           <button onClick={() => setSelectedGender('women')} className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${selectedGender === 'women' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-700'}`}>Women</button>
           <button onClick={() => setSelectedGender('men')} className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${selectedGender === 'men' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-700'}`}>Men</button>
        </div>
      </div>
      <div className="text-center space-y-2"><h3 className="text-3xl font-light text-zinc-900">Which brand do you wear most often?</h3></div>
      
      {loadingData ? (
          <div className="flex justify-center text-sm text-zinc-400 animate-pulse">Loading data...</div>
      ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-h-[300px] overflow-y-auto">
          {brands.map((brand) => (
              <button key={brand.id} onClick={() => onSelectBrand(brand.id)} className="group flex flex-col items-center justify-center p-6 rounded-2xl border border-zinc-200 hover:border-zinc-900 hover:bg-zinc-50 transition-all duration-300">
              <span className="text-lg font-medium text-zinc-700 group-hover:text-zinc-900">{brand.name}</span>
              </button>
          ))}
          </div>
      )}
    </div>
  );
};

export default BrandSelectionStep;
