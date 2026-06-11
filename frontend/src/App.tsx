import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import NotebookView from './pages/NotebookView';
import NotebookList from './pages/NotebookList';

import LoginPage from './pages/LoginPage';
import { supabase } from './lib/supabaseClient';

function App() {
  const [session, setSession] = useState<any>(null);
  const [demoSession, setDemoSession] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (localStorage.getItem('maes_demo_session')) {
        setDemoSession(true);
      }
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    const handleAuthChange = () => {
      if (localStorage.getItem('maes_demo_session')) {
        setDemoSession(true);
      } else {
        setDemoSession(false);
      }
    };
    window.addEventListener('maes_auth_change', handleAuthChange);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('maes_auth_change', handleAuthChange);
    };
  }, []);

  if (loading) {
    return <div className="min-h-screen bg-canvas text-ink flex items-center justify-center font-mono font-bold uppercase tracking-widest">Initializing...</div>;
  }

  if (!session && !demoSession) {
    return <LoginPage />;
  }

  return (
    <Router>
      <Routes>
        <Route 
          path="/" 
          element={<NotebookList />} 
          key="notebook-list-route"
        />
        <Route 
          path="/notebook/:notebookId" 
          element={<NotebookView />} 
          key="notebook-view-route"
        />
        {/* Redirect any stray /login navigation to root */}
        <Route 
          path="/login" 
          element={<Navigate to="/" />} 
          key="login-route"
        />
      </Routes>
    </Router>
  );
}

export default App;

