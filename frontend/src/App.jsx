import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import MeasurementWizard from './components/MeasurementWizard';
import LoginScreen from './components/LoginScreen';

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

  if (loading) return <div className="min-h-screen bg-zinc-50 flex items-center justify-center text-zinc-500">Yükleniyor...</div>;

  return session ? <MeasurementWizard session={session} /> : <LoginScreen />;
}

export default App;