import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpenCheck, Plus, LogOut, BookOpen,
  Layers, Calendar, ChevronRight, User, RefreshCw
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import api from '../lib/apiClient';

interface Notebook {
  id: string;
  title: string;
  domain: string;
  createdAt: string;
  updatedAt: string;
  sourceCount?: number;
}

const DOMAIN_OPTIONS = [
  'Computer Science',
  'Mathematics',
  'Physics',
  'Chemistry',
  'Biology',
  'Engineering',
  'Economics',
  'General Science',
];

export default function NotebookList() {
  const navigate = useNavigate();
  const [notebooks, setNotebooks] = useState<Notebook[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDomain, setNewDomain] = useState('Computer Science');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const getProfile = async () => {
      try {
        const { data: { user: sbUser } } = await supabase.auth.getUser();
        if (sbUser) {
          setUser(sbUser);
        }
      } catch (e) {
        console.error('Error fetching user profile', e);
      }
    };
    getProfile();
    fetchNotebooks();
  }, []);

  const fetchNotebooks = async () => {
    setLoading(true);
    try {
      const res = await api.get('/notebooks');
      if (res.data.notebooks) setNotebooks(res.data.notebooks);
    } catch (e) {
      console.warn('Failed fetching notebooks', e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNotebook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setCreating(true);
    try {
      const res = await api.post('/notebooks', { title: newTitle, domain: newDomain });
      if (res.data.notebook) {
        setNotebooks([res.data.notebook, ...notebooks]);
        navigate(`/notebook/${res.data.notebook.id}`);
      }
    } catch (e) {
      console.warn('Failed creating notebook', e);
    } finally {
      setCreating(false);
      setIsModalOpen(false);
      setNewTitle('');
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const firstName = user?.email?.split('@')[0] || 'Learner';

  return (
    <div className="notebooks-page">
      {/* Navbar */}
      <header className="navbar">
        <div className="navbar-brand">
          <div className="navbar-logo">
            <BookOpenCheck size={20} />
          </div>
          MAES Learning
        </div>

        <div className="navbar-actions">
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            padding: '0.375rem 0.875rem',
            background: 'var(--stone-100)',
            border: '1.5px solid var(--stone-200)',
            borderRadius: 'var(--radius)',
            fontSize: '0.8125rem',
            color: 'var(--stone-600)',
            fontWeight: 500,
          }}>
            <User size={14} />
            {user?.email || 'Loading...'}
          </div>

          <button
            onClick={fetchNotebooks}
            disabled={loading}
            className="btn btn-secondary btn-sm"
            title="Refresh notebooks"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>

          <button onClick={handleLogout} className="btn btn-secondary btn-sm">
            <LogOut size={14} />
            Sign Out
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="notebooks-main">
        {/* Welcome Banner */}
        <div className="welcome-banner">
          <div>
            <p className="welcome-greeting">Welcome back,</p>
            <h2 className="welcome-title">{firstName.charAt(0).toUpperCase() + firstName.slice(1)}</h2>
            <p className="welcome-subtitle">
              {notebooks.length > 0
                ? `You have ${notebooks.length} active notebook${notebooks.length > 1 ? 's' : ''}. Ready to learn?`
                : 'Create your first notebook to start an AI-guided learning session.'}
            </p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="btn"
            style={{
              background: '#fff',
              color: 'var(--green-800)',
              fontWeight: 700,
              flexShrink: 0,
            }}
          >
            <Plus size={18} />
            New Notebook
          </button>
        </div>

        {/* Section header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: '1.25rem'
        }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--ink)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <BookOpen size={18} style={{ color: 'var(--green)' }} />
            My Notebooks
          </h3>
          <span style={{ fontSize: '0.8125rem', color: 'var(--stone-500)', fontWeight: 500 }}>
            {notebooks.length} {notebooks.length === 1 ? 'notebook' : 'notebooks'}
          </span>
        </div>

        {/* Notebooks grid */}
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '5rem', gap: '1rem', color: 'var(--stone-400)' }}>
            <div style={{ width: 32, height: 32, border: '3px solid var(--stone-200)', borderTopColor: 'var(--green)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>Loading notebooks...</span>
          </div>
        ) : notebooks.length === 0 ? (
          <div style={{
            background: 'var(--white)',
            border: '2px dashed var(--stone-300)',
            borderRadius: 'var(--radius-xl)',
            padding: '4rem 2rem',
            textAlign: 'center',
          }}>
            <BookOpen size={48} style={{ color: 'var(--green-300)', margin: '0 auto 1rem' }} />
            <p style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--stone-600)', marginBottom: '0.5rem' }}>No notebooks yet</p>
            <p style={{ fontSize: '0.875rem', color: 'var(--stone-400)', marginBottom: '1.5rem' }}>
              Create your first notebook and start an AI-guided learning session.
            </p>
            <button onClick={() => setIsModalOpen(true)} className="btn btn-primary">
              <Plus size={16} /> Create Notebook
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.25rem' }}>
            {notebooks.map((nb) => (
              <div
                key={nb.id}
                onClick={() => navigate(`/notebook/${nb.id}`)}
                className="notebook-card"
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem' }}>
                  <span className="notebook-domain-badge">
                    <Layers size={10} />
                    {nb.domain}
                  </span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--stone-400)', display: 'flex', alignItems: 'center', gap: '0.3rem', flexShrink: 0 }}>
                    <Calendar size={10} />
                    {new Date(nb.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                </div>

                <h4 className="notebook-title">{nb.title}</h4>

                <div className="notebook-meta">
                  <span className="notebook-meta-info">
                    <BookOpen size={12} />
                    {nb.sourceCount ?? 0} source{nb.sourceCount !== 1 ? 's' : ''}
                  </span>
                  <span className="notebook-open-link">
                    Open <ChevronRight size={14} />
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Create Notebook Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">Create New Notebook</h2>

            <form onSubmit={handleCreateNotebook} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                <label className="pref-label" htmlFor="nb-title">Notebook title</label>
                <input
                  id="nb-title"
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="input"
                  placeholder="e.g. Introduction to Calculus"
                  required
                  autoFocus
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                <label className="pref-label" htmlFor="nb-domain">Subject area</label>
                <select
                  id="nb-domain"
                  value={newDomain}
                  onChange={(e) => setNewDomain(e.target.value)}
                  className="input select"
                >
                  {DOMAIN_OPTIONS.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn btn-secondary"
                  style={{ flex: 1 }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ flex: 1 }}
                  disabled={creating || !newTitle.trim()}
                >
                  {creating ? (
                    <>
                      <div style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus size={16} />
                      Create Notebook
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer style={{
        padding: '0.75rem 1.5rem',
        borderTop: '1px solid var(--stone-200)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'var(--white)',
        fontSize: '0.75rem',
        color: 'var(--stone-400)',
      }}>
        <span>MAES Adaptive Learning Platform</span>
        <span>v2.0 · Powered by Groq & Mistral AI</span>
      </footer>
    </div>
  );
}
