import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import MeasurementWizard from './components/MeasurementWizard';
import FitAnalyzer from './components/FitAnalyzer';
import toast, { Toaster } from 'react-hot-toast';

const SAMPLE_PRODUCT = {
  name: 'Premium Triko Kazak',
  size: 'M Beden',
  price: '1.299 TL',
  measurements: { shoulder: 44, chest: 104, waist: 100, arm: 65 }
};

function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);
  const [activeModal, setActiveModal] = useState('none');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchUserProfile(session.user.id);
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      setSession(currentSession);
      if (currentSession) {
        fetchUserProfile(currentSession.user.id);
      } else {
        setUserProfile(null);
        setActiveModal('none');
      }
    });

    const hash = window.location.hash;
    if (hash && hash.includes('access_token')) {
      localStorage.setItem('resume_magic_flow', 'true');
      window.history.replaceState(null, '', window.location.pathname);
    }

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!loading && session && localStorage.getItem('resume_magic_flow') === 'true') {
      if (userProfile) setActiveModal('analyzer');
      else setActiveModal('wizard');
      localStorage.removeItem('resume_magic_flow');
    }
  }, [loading, session, userProfile]);

  const fetchUserProfile = async (userId) => {
    const { data } = await supabase.from('user_profiles').select('*').eq('id', userId).maybeSingle();
    if (data) setUserProfile(data);
    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin } });
    if (error) console.error("Giriş hatası:", error.message);
  };

  const handleMagicButtonClick = () => {
    if (!session) {
      setActiveModal('login');
    } else if (!userProfile) {
      toast('Önce ölçülerinizi girmelisiniz.', { icon: '📏' });
      setActiveModal('wizard');
    } else {
      setActiveModal('analyzer');
    }
  };

  if (loading) return <div className="min-h-screen bg-white flex items-center justify-center">Yükleniyor...</div>;

  return (
    <div className="min-h-screen bg-white font-sans text-zinc-900 selection:bg-zinc-200">
      
      {/* HOST SİTE */}
      <header className="flex items-center justify-between px-6 py-4 md:px-8 md:py-5 border-b border-zinc-100">
        <h1 className="text-xl font-bold tracking-widest uppercase">Zarif Giyim</h1>
        <div className="flex gap-6 text-sm font-medium text-zinc-500">
          <a href="#" className="hover:text-zinc-900">Erkek</a>
          <a href="#" className="hover:text-zinc-900">Kadın</a>
          <a href="#" className="hover:text-zinc-900">İletişim</a>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-10 md:py-20 flex flex-col md:flex-row gap-8 md:gap-12 relative z-0">
        <div className="w-full md:w-1/2 aspect-[3/4] bg-zinc-100 rounded-3xl relative overflow-hidden group">
          <img src="https://images.unsplash.com/photo-1620799140188-3b2a02fd9a77?q=80&w=1000&auto=format&fit=crop" alt="Kazak" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
        </div>

        <div className="w-full md:w-1/2 flex flex-col justify-center">
          <p className="text-xs md:text-sm tracking-[0.2em] text-zinc-400 uppercase mb-2 md:mb-3">Yeni Sezon</p>
          <h2 className="text-3xl md:text-4xl font-light text-zinc-800 tracking-tight mb-2 md:mb-4">{SAMPLE_PRODUCT.name}</h2>
          <p className="text-2xl font-medium text-zinc-900 mb-6 md:mb-8">{SAMPLE_PRODUCT.price}</p>
          <p className="text-sm md:text-base text-zinc-500 font-light leading-relaxed mb-6 md:mb-8">
            İnce dokunmuş, %100 pamuklu premium triko kazak. Serin havalarda şıklığınızı korurken kusursuz bir konfor sunar.
          </p>

          <div className="flex flex-col gap-4 border-t border-zinc-100 pt-6 md:pt-8">
            <h3 className="text-sm font-medium text-zinc-800">Beden Seçimi</h3>
            <div className="flex gap-3 mb-4">
              {['S', 'M', 'L', 'XL'].map(s => (
                <button key={s} className="w-10 h-10 md:w-12 md:h-12 rounded-full border border-zinc-200 text-zinc-600 hover:border-zinc-400 flex items-center justify-center text-sm font-medium transition-colors">
                  {s}
                </button>
              ))}
            </div>

            <button onClick={handleMagicButtonClick} className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-medium py-3.5 md:py-4 rounded-full shadow-[0_0_20px_rgba(59,130,246,0.3)] transition-all transform hover:scale-[1.02] active:scale-95 text-sm md:text-base">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
              Evrensel Beden Pasaportumla Dene
            </button>
            <button className="w-full bg-zinc-900 hover:bg-zinc-800 text-white font-medium py-3.5 md:py-4 rounded-full transition-colors mt-2 text-sm md:text-base">
              Normal Sepete Ekle
            </button>
          </div>
        </div>
      </main>

      {activeModal === 'login' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/60 backdrop-blur-sm p-4">
          <div className="bg-white border border-zinc-200 rounded-[2rem] p-8 md:p-12 shadow-2xl w-full max-w-md text-center relative animate-fade-up">
            <button onClick={() => setActiveModal('none')} className="absolute top-6 right-6 text-zinc-400 hover:text-zinc-800">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
            <h2 className="text-2xl md:text-3xl font-light text-zinc-900 tracking-tight mb-2 mt-4">Beden Pasaportu</h2>
            <p className="text-zinc-500 text-sm font-light mb-10">Kusursuz uyum için hesabınızı bağlayın.</p>
            <button onClick={handleGoogleLogin} className="w-full bg-white border border-zinc-300 hover:bg-zinc-50 text-zinc-800 font-medium py-3.5 rounded-full transition-all flex items-center justify-center gap-3 text-sm shadow-sm">
              <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
              Google ile Devam Et
            </button>
          </div>
        </div>
      )}

      {activeModal === 'wizard' && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-zinc-900/60 backdrop-blur-sm md:p-6 flex items-center justify-center">
           <div className="w-full h-full bg-white md:rounded-[2rem] overflow-hidden shadow-2xl relative">
              <MeasurementWizard 
                session={session} 
                onRefreshProfile={() => fetchUserProfile(session.user.id)}
                onClose={() => setActiveModal('none')} 
              />
           </div>
        </div>
      )}

      {activeModal === 'analyzer' && (
        <FitAnalyzer 
          userProfile={userProfile} 
          onClose={() => setActiveModal('none')} 
          onUpdateProfile={() => setActiveModal('wizard')} 
          productData={SAMPLE_PRODUCT} 
        />
      )}

      <Toaster 
        position="top-center" 
        toastOptions={{
          style: {
            background: '#27272a', // zinc-800
            color: '#fff',
            borderRadius: '100px',
            fontSize: '14px',
            fontWeight: '500',
            letterSpacing: '0.05em',
            padding: '12px 24px',
          },
        }} 
      />

    </div>
  );
}

export default App;