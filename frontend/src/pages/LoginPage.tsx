import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { BookOpenCheck, Mail, ArrowRight, Sparkles } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    const { error } = await supabase.auth.signInWithOtp({ email });
    if (error) {
      setMessage(error.message);
      setIsSuccess(false);
    } else {
      setMessage(`A magic sign-in link has been sent to ${email}. Check your inbox.`);
      setIsSuccess(true);
    }
    setLoading(false);
  };

  const handleGuestAccess = () => {
    localStorage.setItem('maes_demo_session', JSON.stringify({
      user: { id: 'demo-user-123', email: 'guest@maes.local' }
    }));
    window.dispatchEvent(new Event('maes_auth_change'));
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

        {/* Login Form */}
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
            <label className="pref-label" htmlFor="email">
              Email address
            </label>
            <div style={{ position: 'relative' }}>
              <Mail
                size={16}
                style={{
                  position: 'absolute', left: '0.875rem', top: '50%',
                  transform: 'translateY(-50%)', color: 'var(--stone-400)'
                }}
              />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input"
                style={{ paddingLeft: '2.5rem' }}
                placeholder="you@university.edu"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-full"
            style={{ marginTop: '0.25rem' }}
            disabled={loading}
          >
            {loading ? (
              <>
                <div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                Sending link...
              </>
            ) : (
              <>
                Send Sign-In Link
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        {/* Feedback Message */}
        {message && (
          <div style={{
            marginTop: '1rem',
            padding: '0.875rem 1rem',
            borderRadius: 'var(--radius)',
            background: isSuccess ? 'var(--green-100)' : 'var(--error-light)',
            border: `1px solid ${isSuccess ? 'var(--green-300)' : 'rgba(192,57,43,0.25)'}`,
            color: isSuccess ? 'var(--green-800)' : 'var(--error)',
            fontSize: '0.875rem',
            lineHeight: 1.5,
          }}>
            {message}
          </div>
        )}

        {/* Divider */}
        <div className="login-divider">or</div>

        {/* Guest Access */}
        <button
          type="button"
          onClick={handleGuestAccess}
          className="btn btn-secondary btn-full"
        >
          <Sparkles size={16} />
          Continue as Guest
        </button>

        <p style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--stone-400)', marginTop: '1.25rem', lineHeight: 1.6 }}>
          Guest mode stores data locally. Sign in with your email to sync across devices and access full features.
        </p>
      </div>
    </div>
  );
}
