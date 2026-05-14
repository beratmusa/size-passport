import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from './supabaseClient';
import toast, { Toaster } from 'react-hot-toast';
import { predictBestSize } from './lib/size-engine';
import useProductData from './hooks/useProductData';

// Components
import SmartProfiler from './components/SmartProfiler';
import FitAnalyzer from './components/FitAnalyzer';

export default function WidgetApp({ productId, productTitle, shopDomain, config = {} }) {
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
    const defaultSize = sizes[0]?.size;
    const sizeEntry = sizes.find(s => s.size === defaultSize);
    return {
      ...product,
      size: defaultSize,
      measurements: sizeEntry?.measurements || {},
      size_data: sizes
    };
  }, [product, sizes]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-2">
        <div className="w-5 h-5 border-2 border-zinc-200 border-t-zinc-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  const isButton = config.ctaType === 'button';
  
  const ctaStyle = isButton ? {
    backgroundColor: config.ctaBgColor || '#000000',
    color: config.ctaTextColor || '#ffffff', // For button we usually want contrast, but letting them choose. Wait, default text color in shopify config was #000000. Let's stick to config.ctaTextColor.
    padding: `${config.ctaPaddingY || 8}px ${config.ctaPaddingX || 12}px`,
    borderRadius: `${config.ctaBorderRadius || 8}px`,
    border: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    cursor: 'pointer',
    width: config.ctaAlign === 'stretch' ? '100%' : 'auto',
    fontWeight: 500,
    transition: 'opacity 0.2s',
  } : {
    color: config.ctaTextColor || '#000000',
    padding: `${config.ctaPaddingY || 8}px ${config.ctaPaddingX || 12}px`,
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    cursor: 'pointer',
    background: 'transparent',
    border: 'none',
    borderBottom: '1px solid currentColor',
    width: config.ctaAlign === 'stretch' ? '100%' : 'auto',
    fontWeight: 500,
  };

  // Buton içinde "link" ise icon renklerini vs buna göre ayarlayalım
  const iconBgColor = isButton ? 'transparent' : '#000000'; // if it's a solid button, maybe no background for icon
  const iconColor = isButton ? 'currentColor' : '#ffffff';

  return (
    <div className="size-passport-widget font-sans w-full" style={{ display: 'flex', justifyContent: config.ctaAlign === 'stretch' ? 'center' : (config.ctaAlign || 'flex-start') }}>
      <Toaster position="top-center" containerStyle={{ zIndex: 10000002 }} />
      
      <button 
        onClick={handleSmartCheck}
        style={ctaStyle}
        className="group hover:opacity-80 transition-all duration-300 text-sm md:text-base"
      >
        <span 
          className="flex items-center justify-center w-5 h-5 md:w-6 md:h-6 rounded-full transition-colors"
          style={isButton ? {} : { backgroundColor: iconBgColor, color: iconColor }}
        >
          <svg className="w-3 h-3 md:w-3.5 md:h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
        </span>
        <span className="tracking-tight italic">
          {userProfile ? 'View My Fit Analysis' : 'Find My Size with AI'}
        </span>
        <svg className="w-4 h-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path>
        </svg>
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
              productName={product?.name || productTitle}

              
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
