import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from './supabaseClient';
import toast, { Toaster } from 'react-hot-toast';
import { predictBestSize } from './lib/size-engine';
import useProductData from './hooks/useProductData';
import { detectProductCategory } from './lib/utils';
import { t } from './lib/i18n';

// Components
import SmartProfiler from './components/SmartProfiler';
import FitAnalyzer from './components/FitAnalyzer';

export default function WidgetApp({ productId, productTitle, shopDomain, shopifyVariants = [], config = {} }) {
  const [session, setSession] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [currentShopifySize, setCurrentShopifySize] = useState(null);
  
  // Product Data
  const { product, sizes: allSizes, loading, error } = useProductData(productId, { lookupBy: 'shopify' });

  // Filter sizes based on Shopify availability
  const sizes = useMemo(() => {
    if (shopifyVariants.length === 0) return allSizes;
    
    // Get all size labels that are available in Shopify
    const availableSizeLabels = shopifyVariants
      .filter(v => v.available)
      .map(v => v.options.map(o => o.toLowerCase())); // Flatten all options just in case
    
    const flattenedAvailable = availableSizeLabels.flat();

    return allSizes.filter(s => {
      const label = s.size.toLowerCase();
      // Check if this size label exists in any available variant's options or title
      return flattenedAvailable.includes(label) || 
             shopifyVariants.some(v => v.available && v.title.toLowerCase().includes(label));
    });
  }, [allSizes, shopifyVariants]);

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
    if (session?.user) {
      fetchUserProfile(session.user.id);
    } else {
      // Misafir profili (Guest Profile) local storage kontrolü
      const storedProfile = localStorage.getItem('size_passport_guest_profile');
      if (storedProfile) {
        try {
          setUserProfile(JSON.parse(storedProfile));
        } catch (e) {
          console.error("Local storage parse error:", e);
        }
      }
    }
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
    try {
      supabase.from('analytics_events').insert({
        user_id: session?.user?.id || null,
        product_id: productId,
        event_type: 'profiler_opened',
        shop: shopDomain
      }).then(() => {});
    } catch (e) {
      console.error('Tracking error:', e);
    }
    // Commented out login requirement for testing
    // if (!session) {
    //   setActiveModal('login');
    //   return;
    // }
    const cat = product ? detectProductCategory(product.category, product.title) : 'top';
    const isBottom = cat === 'bottom' || cat === 'pants' || cat === 'jeans' || cat === 'shorts' || cat === 'skirt';
    
    let hasRelevantMeasurements = false;
    if (userProfile?.measurements) {
      if (isBottom) {
        hasRelevantMeasurements = !!(userProfile.measurements.waist || userProfile.measurements.hip || userProfile.measurements.outseam || userProfile.measurements.inseam);
      } else {
        hasRelevantMeasurements = !!(userProfile.measurements.chest || userProfile.measurements.shoulder || userProfile.measurements.arm || userProfile.measurements.length);
      }
    }

    if (hasRelevantMeasurements) {
      setActiveModal('analyzer');
    } else {
      setActiveModal('wizard');
    }
  };

  const handleLogin = async () => {
    await supabase.auth.signInWithOAuth({ provider: 'google' });
  };

  // Listen to Shopify Variant Changes
  useEffect(() => {
    if (sizes.length === 0) return;
    
    // Helper to safely match size string
    const matchSize = (sizesArray, valText) => {
      if (!valText) return null;
      const val = valText.toLowerCase().trim();
      const sortedSizes = [...sizesArray].sort((a, b) => b.size.length - a.size.length);
      
      return sortedSizes.find(s => {
          const sz = s.size.toLowerCase();
          if (sz === val) return true;
          
          try {
              // Exact word match to prevent "size: m" matching "s"
              const escapedSz = sz.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
              const regex = new RegExp(`\\b${escapedSz}\\b`, 'i');
              if (regex.test(val)) return true;
          } catch(e) {}
          
          // Fallback only if the size is longer than 1 character (prevents "s" matching "small")
          if (sz.length > 1 && val.includes(sz)) return true;
          return false;
      });
    };

    // Auto-detect initial size if possible
    const checkedRadio = document.querySelector('input[type="radio"]:checked');
    if (checkedRadio) {
      const val = checkedRadio.value;
      const matched = matchSize(sizes, val);
      if (matched) setCurrentShopifySize(matched.size);
    }

    const handleChange = (e) => {
        if (e.target.tagName.toLowerCase() === 'input' && e.target.type === 'radio') {
            const matched = matchSize(sizes, e.target.value);
            if (matched) setCurrentShopifySize(matched.size);
        } else if (e.target.tagName.toLowerCase() === 'select') {
            const val = e.target.options[e.target.selectedIndex] ? e.target.options[e.target.selectedIndex].text : e.target.value;
            const matched = matchSize(sizes, val);
            if (matched) setCurrentShopifySize(matched.size);
        }
    };

    const handleClick = (e) => {
        const label = e.target.closest('label');
        if (label) {
            const input = document.getElementById(label.htmlFor);
            if (input && input.value) {
                const matched = matchSize(sizes, input.value);
                if (matched) setCurrentShopifySize(matched.size);
            } else {
                 const matched = matchSize(sizes, label.innerText);
                 if (matched) setCurrentShopifySize(matched.size);
            }
        }
    };
    
    document.addEventListener('change', handleChange);
    document.addEventListener('click', handleClick);

    return () => {
        document.removeEventListener('change', handleChange);
        document.removeEventListener('click', handleClick);
    };
  }, [sizes]);

  // Prepare product data for analyzer
  const selectedProductData = useMemo(() => {
    if (!product || sizes.length === 0) return null;
    const defaultSize = currentShopifySize || sizes[0]?.size;
    const sizeEntry = sizes.find(s => s.size === defaultSize) || sizes[0];
    return {
      ...product,
      size: sizeEntry.size,
      measurements: sizeEntry?.measurements || {},
      size_data: sizes
    };
  }, [product, sizes, currentShopifySize]);

  const bestSizeResult = useMemo(() => {
    if (!userProfile || !selectedProductData) return null;
    const normalizedCategory = detectProductCategory(selectedProductData.category, selectedProductData.name);
    const fitType = selectedProductData.fit_type || 'regular';
    return predictBestSize(userProfile, selectedProductData.size_data, normalizedCategory, fitType);
  }, [userProfile, selectedProductData]);

  // Track Add to Cart Events
  useEffect(() => {
    if (!shopDomain) return;

    let isTracking = false;
    const trackAddToCart = async () => {
      if (isTracking) return;
      isTracking = true;
      setTimeout(() => { isTracking = false; }, 2000);

      try {
        const eventType = bestSizeResult?.size ? 'add_to_cart_with_ai' : 'add_to_cart';
        const recSize = bestSizeResult?.size || currentShopifySize || null;
        await supabase.from('analytics_events').insert({
          user_id: session?.user?.id || null,
          product_id: productId || 'unknown_product',
          event_type: eventType,
          recommended_size: recSize,
          shop: shopDomain
        });
      } catch (e) {
        console.error('Tracking error:', e);
      }
    };

    const handleCartSubmit = (e) => {
      const form = e.target;
      if (form && (form.action && form.action.includes('/cart/add') || form.querySelector('button[name="add"], input[name="add"], button[type="submit"]'))) {
        trackAddToCart();
      }
    };

    const handleCartClick = (e) => {
      const btn = e.target.closest('button[name="add"], input[name="add"], button[type="submit"][name="add"], .product-form__submit, .add-to-cart-button, [data-add-to-cart]');
      if (btn && !btn.disabled) {
        trackAddToCart();
      }
    };

    const origFetch = window.fetch;
    window.fetch = async (...args) => {
      let urlStr = '';
      if (typeof args[0] === 'string') urlStr = args[0];
      else if (args[0] && typeof args[0] === 'object' && args[0].url) urlStr = args[0].url;
      else if (args[0] && typeof args[0]?.toString === 'function') urlStr = args[0].toString();

      if (urlStr && (urlStr.includes('/cart/add') || urlStr.includes('/cart/add.js') || urlStr.includes('/cart/add.json'))) {
        trackAddToCart();
      }
      return origFetch(...args);
    };

    const origOpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function(method, url, ...rest) {
      if (typeof url === 'string' && (url.includes('/cart/add') || url.includes('/cart/add.js') || url.includes('/cart/add.json'))) {
        trackAddToCart();
      }
      return origOpen.call(this, method, url, ...rest);
    };

    document.addEventListener('submit', handleCartSubmit);
    document.addEventListener('click', handleCartClick);
    return () => {
      document.removeEventListener('submit', handleCartSubmit);
      document.removeEventListener('click', handleCartClick);
      window.fetch = origFetch;
      XMLHttpRequest.prototype.open = origOpen;
    };
  }, [bestSizeResult?.size, currentShopifySize, session?.user?.id, productId, shopDomain]);

  // Track Recommendation Shown Events
  useEffect(() => {
    if (!bestSizeResult?.size || !shopDomain) return;
    const trackRecommendation = async () => {
      try {
        await supabase.from('analytics_events').insert({
          user_id: session?.user?.id || null,
          product_id: productId,
          event_type: 'recommendation_shown',
          recommended_size: bestSizeResult.size,
          shop: shopDomain
        });
      } catch (e) {
        console.error('Tracking error:', e);
      }
    };
    trackRecommendation();
  }, [bestSizeResult?.size, session?.user?.id, productId, shopDomain]);

  // Highlight AI Recommended Size in Shopify Theme
  useEffect(() => {
    if (!bestSizeResult?.size || !config.showRecommendation) return;

    const size = bestSizeResult.size.toLowerCase();
    let highlightedElements = [];

    const highlightSize = () => {
      // 1. Radio Buttons (Dawn theme and most others)
      const inputs = document.querySelectorAll('input[type="radio"]');
      inputs.forEach(input => {
        if (input.value.toLowerCase() === size || input.value.toLowerCase() === size + ' ') {
          const label = document.querySelector(`label[for="${input.id}"]`) || input.closest('label');
          if (label && !label.dataset.aiHighlighted) {
            label.dataset.aiHighlighted = 'true';
            label.style.border = `2px solid ${config.recommendationBgColor || '#6366f1'}`;
            label.style.position = 'relative';
            
            if (!label.querySelector('.size-passport-badge')) {
              const badge = document.createElement('span');
              badge.className = 'size-passport-badge';
              badge.innerText = '✨';
              badge.style.position = 'absolute';
              badge.style.top = '-8px';
              badge.style.right = '-8px';
              badge.style.background = config.recommendationBgColor || '#6366f1';
              badge.style.color = config.recommendationTextColor || '#ffffff';
              badge.style.fontSize = '10px';
              badge.style.padding = '2px 4px';
              badge.style.borderRadius = '999px';
              badge.style.lineHeight = '1';
              badge.style.zIndex = '10';
              label.appendChild(badge);
            }
            highlightedElements.push(label);
          }
        }
      });

      // 2. Select Dropdowns
      const options = document.querySelectorAll('select option');
      options.forEach(option => {
        if (option.value.toLowerCase() === size || option.text.toLowerCase().trim() === size) {
          if (!option.text.includes('✨')) {
             option.dataset.origText = option.text;
             option.text = `${option.text} ✨ AI Recommended`;
             highlightedElements.push(option);
          }
        }
      });
    };

    highlightSize();
    const timer = setTimeout(highlightSize, 1000); // Check again after 1s for dynamically loaded variants

    return () => {
      clearTimeout(timer);
      highlightedElements.forEach(el => {
        if (el.tagName.toLowerCase() === 'label') {
          el.style.border = '';
          el.dataset.aiHighlighted = '';
          const badge = el.querySelector('.size-passport-badge');
          if (badge) badge.remove();
        } else if (el.tagName.toLowerCase() === 'option') {
          if (el.dataset.origText) el.text = el.dataset.origText;
        }
      });
    };
  }, [bestSizeResult, config.showRecommendation]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-2">
        <div className="w-5 h-5 border-2 border-zinc-200 border-t-zinc-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  const isButton = config.ctaType === 'button';
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const currentScale = isMobile ? (config.ctaScaleMobile || 1.0) : (config.ctaScale || 1.0);
  const currentAlign = isMobile ? (config.ctaAlignMobile || 'stretch') : (config.ctaAlign || 'flex-start');
  
  const ctaStyle = isButton ? {
    backgroundColor: config.ctaBgColor || '#000000',
    color: config.ctaTextColor || '#ffffff', 
    padding: `${config.ctaPaddingY || 8}px ${config.ctaPaddingX || 12}px`,
    borderRadius: `${config.ctaBorderRadius || 8}px`,
    border: config.ctaBorderThickness && config.ctaBorderColor && config.ctaBorderThickness > 0 ? `${config.ctaBorderThickness}px solid ${config.ctaBorderColor}` : 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    cursor: 'pointer',
    width: currentAlign === 'stretch' ? '100%' : 'auto',
    fontWeight: 500,
    transition: 'all 0.2s',
    transform: `scale(${currentScale})`,
    transformOrigin: currentAlign === 'center' ? 'center' : (currentAlign === 'flex-end' ? 'right' : 'left'),
    '--hover-bg': config.ctaHoverBgColor || config.ctaBgColor || '#000000',
    '--hover-text': config.ctaHoverTextColor || config.ctaTextColor || '#ffffff',
    '--hover-border': config.ctaHoverBorderColor || config.ctaBorderColor || 'transparent',
    '--hover-scale-val': currentScale * (config.ctaHoverScale || 1.0)
  } : {
    color: config.ctaTextColor || '#000000',
    padding: `${config.ctaPaddingY || 8}px ${config.ctaPaddingX || 12}px`,
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    cursor: 'pointer',
    background: 'transparent',
    border: 'none',
    borderBottom: config.ctaBorderThickness && config.ctaBorderColor && config.ctaBorderThickness > 0 ? `${config.ctaBorderThickness}px solid ${config.ctaBorderColor}` : '1px solid currentColor',
    width: currentAlign === 'stretch' ? '100%' : 'auto',
    fontWeight: 500,
    transition: 'all 0.2s',
    transform: `scale(${currentScale})`,
    transformOrigin: currentAlign === 'center' ? 'center' : (currentAlign === 'flex-end' ? 'right' : 'left'),
    '--hover-bg': 'transparent',
    '--hover-text': config.ctaHoverTextColor || config.ctaTextColor || '#000000',
    '--hover-border': config.ctaHoverBorderColor || config.ctaBorderColor || 'currentColor',
    '--hover-scale-val': currentScale * (config.ctaHoverScale || 1.0)
  };

  // Buton içinde "link" ise icon renklerini vs buna göre ayarlayalım
  const iconBgColor = isButton ? 'transparent' : '#000000'; 
  const iconColor = isButton ? 'currentColor' : '#ffffff';

  return (
    <div className="size-passport-widget font-sans w-full" style={{ display: 'flex', flexDirection: 'column', width: currentAlign === 'stretch' ? '100%' : 'auto' }}>
      <Toaster position="top-center" containerStyle={{ zIndex: 10000002 }} />
      <style>{`
        .size-passport-cta-button:hover {
          background-color: var(--hover-bg) !important;
          color: var(--hover-text) !important;
          border-color: var(--hover-border) !important;
          transform: scale(var(--hover-scale-val)) !important;
          opacity: 1 !important;
        }
      `}</style>
      <button 
        onClick={handleSmartCheck}
        style={ctaStyle}
        className="group size-passport-cta-button transition-all duration-300 text-sm md:text-base"
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
          {userProfile ? t('viewFit', product?.shops?.language) : t('findSize', product?.shops?.language)}
        </span>
        <svg className="w-4 h-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path>
        </svg>
      </button>

      {/* RECOMMENDED SIZE TEXT */}
      {userProfile && bestSizeResult && config.showRecommendation && (
        <div 
          className="mt-2 text-xs md:text-sm font-medium tracking-tight flex items-center gap-1.5"
          style={{ 
            color: config.recommendationBgColor || '#4f46e5',
            alignSelf: currentAlign === 'center' ? 'center' : (currentAlign === 'flex-end' ? 'flex-end' : 'flex-start') 
          }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
          </svg>
          {config.recommendationText?.replace('{size}', bestSizeResult.size) || `AI Recommends: ${bestSizeResult.size}`}
        </div>
      )}

      {/* MODALS */}
      
      {/* 0. LOGIN MODAL */}
      {activeModal === 'login' && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-zinc-900/40 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-sm rounded-2xl shadow-2xl overflow-hidden p-8 text-center relative">
            <button onClick={() => setActiveModal('none')} className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-zinc-800 rounded-full hover:bg-zinc-100">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
            <h2 className="text-2xl font-bold mb-2">SizePassport</h2>
            <p className="text-zinc-500 mb-6 text-sm">{t('loginRequired', product?.shops?.language || 'en')}</p>
            <button 
              onClick={handleLogin}
              className="w-full bg-zinc-900 text-white py-3 rounded-xl font-medium hover:bg-zinc-800 transition-colors"
            >
              {t('continueGoogle', product?.shops?.language || 'en')}
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
              productGender={product?.gender || null}
              productName={product?.name || productTitle}
              userProfile={userProfile}
              lang={product?.shops?.language || 'en'}
              unitSystem={product?.shops?.unit_system || 'cm'}

              onRefreshProfile={() => session && fetchUserProfile(session.user.id)}
              onGuestProfileCreated={(profile) => {
                setUserProfile(profile);
                localStorage.setItem('size_passport_guest_profile', JSON.stringify(profile));
              }}
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
                onProfileDeleted={() => {
                  setUserProfile(null);
                  localStorage.removeItem('size_passport_guest_profile');
                  setActiveModal('wizard');
                }}
                onProfileUpdated={(updatedProfile) => {
                  setUserProfile(updatedProfile);
                  localStorage.setItem('size_passport_guest_profile', JSON.stringify(updatedProfile));
                }}
                onClose={() => setActiveModal('none')} 
            />
        </div>
      )}

    </div>
  );
}
