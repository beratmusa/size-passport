import React from 'react';
import { supabase } from '../supabaseClient';
import { useTranslation } from 'react-i18next';

const LoginScreen = () => {
  const { t } = useTranslation();

  const handleLogin = async (provider) => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: provider,
      options: {
        redirectTo: window.location.origin
      }
    });
    if (error) console.error("Giriş hatası:", error.message);
  };

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center p-4 selection:bg-zinc-200">
      <div className="bg-white border border-zinc-200 rounded-[2rem] p-8 md:p-12 shadow-sm w-full max-w-md text-center">
        <h1 className="text-2xl md:text-3xl font-light text-zinc-900 tracking-tight mb-2">Evrensel Beden Pasaportu</h1>
        <p className="text-zinc-500 text-sm font-light mb-10">Kusursuz uyum için giriş yapın.</p>

        <div className="space-y-4">
          {/* Apple ile Giriş */}
          <button 
            onClick={() => handleLogin('apple')}
            className="w-full bg-zinc-900 hover:bg-zinc-800 text-white font-medium py-3.5 rounded-full transition-all flex items-center justify-center gap-3 text-sm shadow-md"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.04 2.26-.79 3.59-.76 1.54.04 2.76.67 3.52 1.83-3.08 1.81-2.58 5.86.44 7.03-.66 1.76-1.55 3.19-2.63 4.07zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/></svg>
            Apple ile Devam Et
          </button>

          {/* Google ile Giriş */}
          <button 
            onClick={() => handleLogin('google')}
            className="w-full bg-white border border-zinc-300 hover:bg-zinc-50 text-zinc-800 font-medium py-3.5 rounded-full transition-all flex items-center justify-center gap-3 text-sm shadow-sm"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
            Google ile Devam Et
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;