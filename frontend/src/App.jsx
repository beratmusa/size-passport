import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import ProductPage from './pages/ProductPage';

function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Demo Giriş Ekranı (Eğer giriş yapmamışsa)
  const handleLogin = async () => {
    await supabase.auth.signInWithOAuth({ provider: 'google' });
  };

  if (loading) return <div className="h-screen flex items-center justify-center">Yükleniyor...</div>;

  // Eğer giriş yapmamışsa basit bir giriş ekranı göster (Opsiyonel)
  // İstersen direkt ProductPage'i de render edebilirsin, orada zaten kontrol var.
  if (!session) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-zinc-50 gap-4">
        <h1 className="text-3xl font-bold tracking-tighter">ZARA CLONE</h1>
        <p className="text-zinc-500">Devam etmek için giriş yapın.</p>
        <button 
          onClick={handleLogin}
          className="bg-black text-white px-8 py-3 rounded-full font-medium hover:bg-zinc-800 transition-all"
        >
          Google ile Giriş Yap
        </button>
      </div>
    );
  }

  return <ProductPage session={session} />;
}

export default App;