import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import toast, { Toaster } from 'react-hot-toast';

// Bileşenlerimiz
import SmartProfiler from './components/SmartProfiler';
import FitAnalyzer from './components/FitAnalyzer';

// ÖRNEK ÜRÜN VERİSİ (Burası dinamik olacak)
const SAMPLE_PRODUCT = {
  id: 'urun-555',
  name: 'Vintage Straight Jean', // Ürün Adı
  category: 'bottom',            // Ana Kategori (top/bottom)
  sub_category: 'jeans',         // Alt Kategori (jeans, pants, t-shirt...)
  fit: 'regular',                // Kesim (slim, regular, oversize)
  size: '32',                    // Varsayılan beden
  price: '1.499 TL',
  image: 'https://images.unsplash.com/photo-1582552938357-32b906df40cb?q=80&w=1000&auto=format&fit=crop',
  measurements: { waist: 84, hip: 100, inseam: 82, outseam: 104 }
};

function App() {
  const [session, setSession] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  
  // Modal Yönetimi: 'none' | 'wizard' (SmartProfiler) | 'analyzer' (FitAnalyzer)
  const [activeModal, setActiveModal] = useState('none');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchUserProfile(session.user.id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchUserProfile(session.user.id);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (userId) => {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) console.error('Profil hatası:', error);
    if (data) setUserProfile(data);
  };

  const handleLogin = async () => {
    // Google girişi (veya e-posta)
    await supabase.auth.signInWithOAuth({ provider: 'google' });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUserProfile(null);
    setActiveModal('none');
  };

  return (
    <div className="min-h-screen bg-white font-sans text-zinc-900">
      <Toaster position="top-center" />
      
      {/* NAVBAR */}
      <nav className="border-b border-zinc-100 px-8 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold tracking-tight">Beden Pasaportu</h1>
        <div>
          {session ? (
            <div className="flex items-center gap-4">
              <span className="text-sm text-zinc-500">{session.user.email}</span>
              <button onClick={handleLogout} className="text-xs text-red-500 hover:underline">Çıkış</button>
            </div>
          ) : (
            <button onClick={handleLogin} className="bg-zinc-900 text-white px-6 py-2 rounded-full text-sm font-medium">Giriş Yap</button>
          )}
        </div>
      </nav>

      {/* ANA EKRAN (Demo Ürün Sayfası) */}
      <main className="max-w-7xl mx-auto px-8 py-12 flex flex-col md:flex-row gap-12">
        {/* Sol: Ürün Görseli */}
        <div className="w-full md:w-1/2 bg-zinc-100 rounded-2xl h-[600px] flex items-center justify-center relative overflow-hidden group shadow-lg">
            
            {/* Ürün Resmi */}
            <img 
              src={SAMPLE_PRODUCT.image} 
              alt={SAMPLE_PRODUCT.name} 
              className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
            />

            {/* Ürün Etiketi (Sol Üst) */}
            <div className="absolute top-4 left-4 bg-white/90 backdrop-blur px-3 py-1 rounded text-xs font-bold uppercase tracking-widest shadow-sm">
                {SAMPLE_PRODUCT.fit} Fit
            </div>

             {/* Yeni Etiket (Sağ Alt - Estetik) */}
             <div className="absolute bottom-6 right-6 bg-zinc-900/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/20">
                <span className="text-white text-xs font-medium tracking-wide">New Season</span>
            </div>
        </div>

        {/* Sağ: Ürün Detayları */}
        <div className="w-full md:w-1/2 flex flex-col justify-center space-y-8">
          <div>
            <h1 className="text-4xl font-light text-zinc-900 mb-2">{SAMPLE_PRODUCT.name}</h1>
            <p className="text-2xl font-medium text-zinc-500">{SAMPLE_PRODUCT.price}</p>
          </div>

          {/* Aksiyon Alanı */}
          <div className="p-6 bg-zinc-50 border border-zinc-200 rounded-2xl space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold uppercase tracking-widest text-zinc-500">Beden Seçimi</span>
              <a href="#" className="text-xs underline text-zinc-400 hover:text-zinc-900">Beden Tablosu</a>
            </div>
            
            <div className="grid grid-cols-5 gap-2">
              {['28', '30', '32', '34', '36'].map(size => (
                <button 
                  key={size} 
                  className={`h-12 rounded-lg border text-sm font-medium transition-all ${size === SAMPLE_PRODUCT.size ? 'border-zinc-900 bg-zinc-900 text-white' : 'border-zinc-200 bg-white hover:border-zinc-400'}`}
                >
                  {size}
                </button>
              ))}
            </div>

            {/* SİHİRLİ BUTON: BEDENİM NE? */}
            <button 
              onClick={() => {
                if (!session) {
                  toast.error("Lütfen önce giriş yapın.");
                  return;
                }
                // Eğer profili varsa direkt analizi aç, yoksa sihirbazı aç
                if (userProfile?.measurements) {
                  setActiveModal('analyzer');
                } else {
                  setActiveModal('wizard');
                }
              }}
              className="w-full h-14 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-xl font-medium text-sm uppercase tracking-widest shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 transition-all transform hover:scale-[1.01] flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              Bedenim Ne? (Akıllı Analiz)
            </button>
            <p className="text-xs text-center text-zinc-400">Yapay zeka destekli beden önerisi</p>
          </div>
        </div>
      </main>

      {/* --- MODALLAR --- */}
      
      {/* 1. AKILLI PROFİL SİHİRBAZI (SmartProfiler) */}
      {activeModal === 'wizard' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/40 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden h-auto max-h-[90vh]">
            <SmartProfiler 
              session={session}               
              productCategory={SAMPLE_PRODUCT.category}       // 'bottom'
              productSubCategory={SAMPLE_PRODUCT.sub_category}// 'jeans'
              productFit={SAMPLE_PRODUCT.fit}                 // 'regular'
              
              onRefreshProfile={() => fetchUserProfile(session.user.id)}
              onClose={() => {
                if (userProfile?.measurements) setActiveModal('analyzer');
                else setActiveModal('none');
              }} 
            />
          </div>
        </div>
      )}

      {/* 2. BEDEN ANALİZ EKRANI (FitAnalyzer) */}
      {activeModal === 'analyzer' && (
        <FitAnalyzer 
          userProfile={userProfile} 
          productData={SAMPLE_PRODUCT} // <--- KRİTİK NOKTA: ÜRÜNÜ BURADA GÖNDERİYORUZ
          onUpdateProfile={() => setActiveModal('wizard')} // Pasaportu güncelle butonuna basınca 'wizard' açılır
          onClose={() => setActiveModal('none')} 
        />
      )}

    </div>
  );
}

export default App;