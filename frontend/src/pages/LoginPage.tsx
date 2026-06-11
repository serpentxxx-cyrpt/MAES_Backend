import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { BookOpenCheck } from 'lucide-react';

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    const { error: signInError } = await supabase.auth.signInWithOAuth({ 
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      }
    });
    if (signInError) {
      setError(signInError.message);
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        {/* Logo */}
        <div className="login-logo">
          <BookOpenCheck size={28} />
        </div>

        {/* Title */}
        <h1 className="login-title">MAES Learning</h1>
        <p className="login-subtitle">Adaptive AI tutoring powered by Socratic dialogue</p>

        {/* Login Action */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          <button
            onClick={handleGoogleLogin}
            className="btn btn-primary btn-full"
            disabled={loading}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: '0.75rem',
              backgroundColor: '#fff',
              color: '#3c4043',
              border: '1px solid #dadce0',
              fontWeight: 500,
              boxShadow: '0 1px 2px 0 rgba(60,64,67,0.3), 0 1px 3px 1px rgba(60,64,67,0.15)'
            }}
          >
            {loading ? (
              <>
                <div style={{ width: 16, height: 16, border: '2px solid rgba(0,0,0,0.2)', borderTopColor: '#3c4043', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                Connecting...
              </>
            ) : (
              <>
                <svg width="18" height="18" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path><path fill="none" d="M0 0h48v48H0z"></path></svg>
                Sign in with Google
              </>
            )}
          </button>
        </div>

        {/* Feedback Message */}
        {error && (
          <div style={{
            marginTop: '1rem',
            padding: '0.875rem 1rem',
            borderRadius: 'var(--radius)',
            background: 'var(--error-light)',
            border: '1px solid rgba(192,57,43,0.25)',
            color: 'var(--error)',
            fontSize: '0.875rem',
            lineHeight: 1.5,
          }}>
            {error}
          </div>
        )}

      </div>
    </div>
  );
}
