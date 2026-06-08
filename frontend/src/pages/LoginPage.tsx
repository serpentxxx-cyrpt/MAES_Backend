import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { ShieldAlert } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({ email });
    if (error) {
      setMessage(error.message);
    } else {
      setMessage('Secure access link sent to your email.');
    }
    setLoading(false);
  };

  const handleDemoLogin = () => {
    localStorage.setItem('maes_demo_session', JSON.stringify({
      user: {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'student@edu.org',
        user_metadata: { name: 'Demo Student' }
      },
      access_token: 'eyJhbGciOiAiSFMyNTYiLCAidHlwIjogIkpXVCJ9.eyJzdWIiOiAiMTIzZTQ1NjctZTg5Yi0xMmQzLWE0NTYtNDI2NjE0MTc0MDAwIiwgInJvbGUiOiAiZGVtbyJ9.abcdefg123456789'
    }));
    window.dispatchEvent(new Event('maes_auth_change'));
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-canvas p-4">
      <div className="panel-container w-full max-w-md bg-canvas">
        <div className="flex flex-col items-center mb-8">
          <div className="bg-brand text-canvas p-4 mb-4">
            <ShieldAlert size={48} />
          </div>
          <h1 className="text-2xl font-bold text-brand uppercase tracking-widest text-center">
            Socratic Pedagogy Platform
          </h1>
          <p className="text-ink font-mono mt-2 uppercase text-sm font-semibold tracking-wider">
            Socratic Protocol Initiated
          </p>
        </div>

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-ink font-bold uppercase text-xs tracking-wider">
              Student Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="border border-ink bg-transparent p-3 text-ink font-mono focus:outline-none focus:ring-1 focus:ring-brand"
              placeholder="student@edu.org"
              required
            />
          </div>
          
          <button type="submit" className="btn-alert mt-4 uppercase tracking-widest" disabled={loading}>
            {loading ? 'Authenticating...' : 'Request Access Link'}
          </button>
        </form>

        <div className="flex flex-col gap-2 mt-4">
          <div className="flex items-center gap-2">
            <div className="h-px bg-ink/20 flex-1"></div>
            <span className="text-[10px] font-mono uppercase text-ink/40">Offline Bypass</span>
            <div className="h-px bg-ink/20 flex-1"></div>
          </div>
          
          <button 
            type="button" 
            onClick={handleDemoLogin} 
            className="btn-primary uppercase tracking-widest text-xs py-3 text-center"
          >
            Enter Demo Access Mode
          </button>
        </div>
        
        {message && (
          <div className="mt-6 p-3 border-l-4 border-alert bg-canvas text-ink font-mono text-sm font-medium">
            &gt; SYSTEM MESSAGE: {message}
          </div>
        )}
      </div>
    </div>
  );
}

