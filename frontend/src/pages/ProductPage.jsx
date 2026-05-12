import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../supabaseClient';
import toast, { Toaster } from 'react-hot-toast';
import { predictBestSize } from '../lib/size-engine';
import useProductData from '../hooks/useProductData';

// Bileşenlerimiz
import SmartProfiler from '../components/SmartProfiler';
import FitAnalyzer from '../components/FitAnalyzer';

// Gerçek üretimde Shopify'dan gelecek olan product ID
// Şimdilik test verisi ID'si
const DEFAULT_PRODUCT_ID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';

const ProductPage = ({ session, productId = DEFAULT_PRODUCT_ID }) => {
  const [userProfile, setUserProfile] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);

  // DB'den ürün verisini çek
  const { product, sizes, loading, error } = useProductData(productId);

  // İlk beden yüklendiğinde en büyük bedeni varsayılan seç
  useEffect(() => {
    if (sizes.length > 0 && !selectedSize) {
      setSelectedSize(sizes[sizes.length - 1].size);
    }
  }, [sizes, selectedSize]);

  // AI Prediction
  const aiPrediction = useMemo(() => {
    if (!userProfile?.measurements || sizes.length === 0) return null;
    return predictBestSize(userProfile, sizes, product?.category);
  }, [userProfile, sizes, product]);

  // Seçilen bedene göre dinamik productData oluştur (FitAnalyzer için)
  const selectedProductData = useMemo(() => {
    if (!product || sizes.length === 0 || !selectedSize) return null;
    const sizeEntry = sizes.find(s => s.size === selectedSize);
    return {
      ...product,
      size: selectedSize,
      measurements: sizeEntry?.measurements || {},
      size_data: sizes
    };
  }, [product, sizes, selectedSize]);

  // Modal Yönetimi: 'none' | 'wizard' | 'analyzer'
  const [activeModal, setActiveModal] = useState('none');

  // Profil Çekme
  useEffect(() => {
    if (!session?.user) return;
    fetchUserProfile(session.user.id);
  }, [session]);

  const fetchUserProfile = async (userId) => {
    const { data } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    if (data) setUserProfile(data);
  };

  const handleSmartCheck = () => {
    if (!session) {
      toast.error("Please login first.");
      return;
    }
    if (userProfile?.measurements) {
      setActiveModal('analyzer');
    } else {
      setActiveModal('wizard');
    }
  };

  // Loading State
  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-zinc-200 border-t-zinc-800 rounded-full animate-spin mx-auto"></div>
          <p className="text-sm text-zinc-400 uppercase tracking-widest">Loading product...</p>
        </div>
      </div>
    );
  }

  // Error State
  if (error || !product) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center space-y-4 max-w-md">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto">
            <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z"></path></svg>
          </div>
          <p className="text-sm text-zinc-500">Product not found or an error occurred.</p>
          <p className="text-xs text-zinc-400">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white font-sans text-zinc-900 pb-20">
      <Toaster position="top-center" />
      
      {/* NAVBAR */}
      <nav className="border-b border-zinc-100 px-8 py-4 flex items-center justify-between sticky top-0 bg-white/90 backdrop-blur z-40">
        <h1 className="text-xl font-bold tracking-tight">Size Passport</h1>
        <div className="text-sm text-zinc-500">
           {session ? `Welcome` : 'Guest User'}
        </div>
      </nav>

      {/* MAIN CONTENT */}
      <main className="max-w-7xl mx-auto px-8 py-12 flex flex-col md:flex-row gap-12">
        {/* Sol: Ürün Görseli */}
        <div className="w-full md:w-1/2 bg-zinc-100 rounded-2xl h-[600px] flex items-center justify-center relative overflow-hidden group shadow-lg">
            <div className="flex flex-col items-center gap-3 text-zinc-400">
              <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
              <span className="text-xs uppercase tracking-widest">Product Image</span>
              <span className="text-[10px] text-zinc-300">Provided by Shopify</span>
            </div>
            <div className="absolute top-4 left-4 bg-white/90 backdrop-blur px-3 py-1 rounded text-xs font-bold uppercase tracking-widest shadow-sm">
                {product.fit_type} Fit
            </div>
        </div>

        {/* Sağ: Ürün Detayları */}
        <div className="w-full md:w-1/2 flex flex-col justify-center space-y-8">
          <div>
            <h1 className="text-4xl font-light text-zinc-900 mb-2">{product.name}</h1>
            <div className="flex items-center gap-2 text-sm text-zinc-400">
              <span className="px-2 py-0.5 bg-zinc-100 rounded text-xs font-medium uppercase">{product.sub_category}</span>
              <span>·</span>
              <span className="capitalize">{product.gender}</span>
            </div>
          </div>

          <div className="p-6 bg-zinc-50 border border-zinc-200 rounded-2xl space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold uppercase tracking-widest text-zinc-500">Size Selection</span>
              <span className="text-xs text-zinc-400">{sizes.length} sizes available</span>
            </div>

            {/* AI Size Prediction Badge */}
            {aiPrediction && (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-100">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-blue-500 shadow-md shadow-indigo-200">
                  <span className="text-white text-lg">✨</span>
                </div>
                <div className="flex-1">
                  <p className="text-xs font-bold uppercase tracking-wider text-indigo-600">AI Recommends</p>
                  <p className="text-sm text-zinc-700">
                    Size <span className="font-bold text-indigo-700">{aiPrediction.size}</span>
                    <span className="ml-2 text-xs text-zinc-400">({aiPrediction.score}% match · {aiPrediction.preference} fit)</span>
                  </p>
                </div>
              </div>
            )}
            
            <div className={`grid gap-2`} style={{ gridTemplateColumns: `repeat(${Math.min(sizes.length, 6)}, 1fr)` }}>
              {sizes.map(({ size }) => {
                const isAI = aiPrediction?.size === size;
                const isSelected = size === selectedSize;
                return (
                  <button 
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`relative h-12 rounded-lg border text-sm font-medium transition-all cursor-pointer ${
                      isSelected
                        ? 'border-zinc-900 bg-zinc-900 text-white'
                        : isAI
                          ? 'border-indigo-400 bg-indigo-50 text-indigo-700 ring-2 ring-indigo-200'
                          : 'border-zinc-200 bg-white hover:border-zinc-400'
                    }`}
                  >
                    {size}
                    {isAI && !isSelected && (
                      <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-indigo-500 text-[10px] text-white shadow">✦</span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* SİHİRLİ BUTON */}
            <button 
              onClick={handleSmartCheck}
              className="w-full h-14 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-xl font-medium text-sm uppercase tracking-widest shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 transition-all transform hover:scale-[1.01] flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              {userProfile ? 'View Analysis' : 'What is My Size? (Smart Analysis)'}
            </button>
            <p className="text-xs text-center text-zinc-400">AI-powered size recommendation</p>
          </div>
        </div>
      </main>

      {/* --- MODALS --- */}
      
      {/* 1. AKILLI PROFİL SİHİRBAZI */}
      {activeModal === 'wizard' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/40 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden h-auto max-h-[90vh]">
            <SmartProfiler 
              session={session}               
              productCategory={product.category}
              productSubCategory={product.sub_category}
              productFit={product.fit_type}
              
              onRefreshProfile={() => fetchUserProfile(session.user.id)}
              onClose={() => {
                if (userProfile?.measurements) setActiveModal('analyzer');
                else setActiveModal('none');
              }} 
            />
          </div>
        </div>
      )}

      {/* 2. BEDEN ANALİZ EKRANI */}
      {activeModal === 'analyzer' && selectedProductData && (
        <FitAnalyzer 
          userProfile={userProfile} 
          productData={selectedProductData} 
          onUpdateProfile={() => setActiveModal('wizard')} 
          onClose={() => setActiveModal('none')} 
        />
      )}

    </div>
  );
};

export default ProductPage;