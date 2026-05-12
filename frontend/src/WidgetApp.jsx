import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from './supabaseClient';
import toast, { Toaster } from 'react-hot-toast';
import { predictBestSize } from './lib/size-engine';
import useProductData from './hooks/useProductData';

// Components
import SmartProfiler from './components/SmartProfiler';
import FitAnalyzer from './components/FitAnalyzer';

export default function WidgetApp({ productId, productTitle, shopDomain }) {
  const [session, setSession] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  
  // Product Data
  const { product, sizes, loading, error } = useProductData(productId, { lookupBy: 'shopify' });

  // Widget State
  const [activeModal, setActiveModal] = useState('none'); // 'none' | 'login' | 'wizard' | 'analyzer'

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

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
    // Commented out login requirement for testing
    // if (!session) {
    //   setActiveModal('login');
    //   return;
    // }
    if (userProfile?.measurements) {
      setActiveModal('analyzer');
    } else {
      setActiveModal('wizard');
    }
  };

  const handleLogin = async () => {
    await supabase.auth.signInWithOAuth({ provider: 'google' });
  };

  // Prepare product data for analyzer
  const selectedProductData = useMemo(() => {
    if (!product || sizes.length === 0) return null;
    // We assume the selected size is calculated inside or defaults to the last size if not selected.
    // For the widget, the store page has its own size selector, but we might not have access to it directly.
    // Let's pass the first size or generic product data for now.
    const defaultSize = sizes[0]?.size;
    const sizeEntry = sizes.find(s => s.size === defaultSize);
    return {
      ...product,
      size: defaultSize,
      measurements: sizeEntry?.measurements || {},
      size_data: sizes
    };
  }, [product, sizes]);

  // Product verisi henüz gelmemiş veya hata olsa bile butonu göstermeye devam et
  // Sadece yükleme durumunda spinner göster
  if (loading) {
    return (
      <div className="flex items-center justify-center p-2">
        <div className="w-5 h-5 border-2 border-zinc-200 border-t-zinc-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="size-passport-widget font-sans">
      <Toaster position="top-center" containerStyle={{ zIndex: 10000002 }} />
      
      {/* SİHİRLİ BUTON (MAĞAZA ÜRÜN SAYFASINDA GÖRÜNECEK TEK ŞEY) */}
      <button 
        onClick={handleSmartCheck}
        className="w-full h-14 px-6 bg-zinc-900 text-white rounded-lg font-semibold text-base hover:bg-zinc-800 transition-all flex items-center justify-center gap-2 shadow-sm"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
        {userProfile ? 'View Fit Analysis' : 'Find My Size (AI)'}
      </button>

      {/* MODALS */}
      
      {/* 0. LOGIN MODAL */}
      {activeModal === 'login' && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-zinc-900/40 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden p-8 text-center relative">
            <button onClick={() => setActiveModal('none')} className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-zinc-800 rounded-full hover:bg-zinc-100">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
            <h2 className="text-2xl font-bold mb-2">Size Passport</h2>
            <p className="text-zinc-500 mb-6 text-sm">Please login to access your smart size recommendations.</p>
            <button 
              onClick={handleLogin}
              className="w-full bg-zinc-900 text-white py-3 rounded-xl font-medium hover:bg-zinc-800 transition-colors"
            >
              Continue with Google
            </button>
          </div>
        </div>
      )}

      {/* 1. AKILLI PROFİL SİHİRBAZI */}
      {activeModal === 'wizard' && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-zinc-900/40 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-2xl lg:max-w-4xl rounded-2xl shadow-2xl overflow-hidden h-auto max-h-[90vh]">
            <SmartProfiler 
              session={session}               
              productCategory={product?.category || 'tops'}
              productSubCategory={product?.sub_category || 't-shirt'}
              productFit={product?.fit_type || 'regular'}

              
              onRefreshProfile={() => session && fetchUserProfile(session.user.id)}
              onGuestProfileCreated={(profile) => setUserProfile(profile)}
              onClose={() => {
                // Determine if we should go to analyzer based on whether we have a profile.
                // Note: userProfile might not be instantly available in this closure, 
                // so we can rely on setActiveModal logic. Actually if we check userProfile it might be stale.
                // Let's just use a functional state update to safely check the latest state.
                setActiveModal(prev => {
                  return 'analyzer'; // We'll just transition to analyzer if they saved.
                });
              }} 
              onCancel={() => setActiveModal('none')}
            />
          </div>
        </div>
      )}

      {/* 2. BEDEN ANALİZ EKRANI */}
      {activeModal === 'analyzer' && selectedProductData && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center">
            <FitAnalyzer 
                userProfile={userProfile} 
                productData={selectedProductData} 
                onUpdateProfile={() => setActiveModal('wizard')} 
                onClose={() => setActiveModal('none')} 
            />
        </div>
      )}

    </div>
  );
}
