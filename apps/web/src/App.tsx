import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Workspace } from './components/workspace/Workspace';
import { AuthPage } from './pages/AuthPage';
import { DashboardPage } from './pages/DashboardPage';
import { supabase } from './lib/supabase';
import type { User } from '@supabase/supabase-js';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="h-screen w-screen bg-canvas flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-white/60 text-sm">Loading AI Creative Studio...</span>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route
        path="/auth"
        element={user ? <Navigate to="/dashboard" /> : <AuthPage />}
      />
      <Route
        path="/dashboard"
        element={user ? <DashboardPage /> : <Navigate to="/auth" />}
      />
      <Route
        path="/project/:projectId"
        element={user ? <Workspace /> : <Navigate to="/auth" />}
      />
      <Route
        path="/"
        element={<Navigate to={user ? '/dashboard' : '/auth'} />}
      />
    </Routes>
  );
}

export default App;
