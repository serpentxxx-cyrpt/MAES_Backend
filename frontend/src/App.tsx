import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import NotebookView from './pages/NotebookView';
import NotebookList from './pages/NotebookList';

// We intentionally do not import LoginPage to leave it inactive, but we leave the file in the repository.

function App() {
  const [, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Unconditionally establish direct access mock session for demo mode
    const demoPayload = {
      access_token: "eyJhbGciOiAiSFMyNTYiLCAidHlwIjogIkpXVCJ9.eyJzdWIiOiAiMTIzZTQ1NjctZTg5Yi0xMmQzLWE0NTYtNDI2NjE0MTc0MDAwIiwgInJvbGUiOiAiZGVtbyJ9.abcdefg123456789",
      user: {
        id: "123e4567-e89b-12d3-a456-426614174000",
        email: "demo@socratic.local",
        user_metadata: { role: "demo" }
      }
    };
    localStorage.setItem('maes_demo_session', JSON.stringify(demoPayload));
    setSession(demoPayload);
    setLoading(false);
  }, []);

  if (loading) {
    return <div className="min-h-screen bg-canvas text-ink flex items-center justify-center font-mono font-bold uppercase tracking-widest">Initializing...</div>;
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

