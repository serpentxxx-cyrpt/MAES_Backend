import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Plus, LogOut, Terminal, Activity, Layers, Calendar, ChevronRight } from 'lucide-react';
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

export default function NotebookList() {
  const navigate = useNavigate();
  const [notebooks, setNotebooks] = useState<Notebook[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDomain, setNewDomain] = useState('Computer Science');

  useEffect(() => {
    // Get current user profile
    const getProfile = async () => {
      try {
        const { data: { user: sbUser } } = await supabase.auth.getUser();
        if (sbUser) {
          setUser(sbUser);
        } else {
          const demoUser = localStorage.getItem('maes_demo_session');
          if (demoUser) {
            setUser(JSON.parse(demoUser).user);
          }
        }
      } catch (e) {
        const demoUser = localStorage.getItem('maes_demo_session');
        if (demoUser) {
          setUser(JSON.parse(demoUser).user);
        }
      }
    };
    
    getProfile();
    fetchNotebooks();
  }, []);

  const fetchNotebooks = async () => {
    setLoading(true);
    try {
      const res = await api.get('/notebooks');
      if (res.data.notebooks) {
        setNotebooks(res.data.notebooks);
      }
    } catch (e) {
      console.warn("Failed fetching notebooks", e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNotebook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    try {
      const res = await api.post('/notebooks', {
        title: newTitle,
        domain: newDomain
      });
      
      if (res.data.notebook) {
        setNotebooks([res.data.notebook, ...notebooks]);
      }
      setIsModalOpen(false);
      setNewTitle('');
    } catch (e) {
      console.warn("Failed creating notebook", e);
    }
  };

  const handleLogout = async () => {
    localStorage.removeItem('maes_demo_session');
    await supabase.auth.signOut();
    window.dispatchEvent(new Event('maes_auth_change'));
  };

  return (
    <div className="min-h-screen w-full flex flex-col bg-canvas text-ink font-sans">
      {/* NAVBAR */}
      <header className="h-16 border-b-1 border-ink flex items-center justify-between px-6 bg-canvas flex-shrink-0 z-10">
        <div className="flex items-center gap-4">
          <div className="bg-brand text-canvas p-2">
            <Activity size={20} />
          </div>
          <h1 className="font-bold text-lg uppercase tracking-widest text-brand">
            Socratic Terminal // Learning Environment
          </h1>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="hidden sm:flex items-center gap-2 font-mono text-[10px] uppercase font-bold text-ink/60 bg-ink/5 border border-ink/10 px-2 py-1">
            <Terminal size={12} className="text-brand" /> Student: {user?.email || 'System'}
          </div>
        </div>
      </header>

      {/* WORKSPACE CONTENT */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-6 md:p-10">
        
        {/* WELCOME BANNER */}
        <div className="panel-container mb-8 bg-brand text-canvas flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-[4px_4px_0px_#111111] p-6 border-ink">
          <div>
            <h2 className="text-xl md:text-2xl font-bold uppercase tracking-wider text-canvas">
              Student Socratic Workspace
            </h2>
            <p className="font-mono text-xs opacity-80 mt-1 uppercase">
              Socratic training loops and scaffolding for advanced concept mastery.
            </p>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="btn-alert text-xs uppercase tracking-widest flex items-center gap-2 whitespace-nowrap self-stretch md:self-auto justify-center"
          >
            <Plus size={16} /> New Notebook
          </button>
        </div>

        {/* SECTION HEADER */}
        <div className="flex justify-between items-center mb-6 border-b-1 border-ink pb-2">
          <h3 className="font-mono font-bold uppercase text-sm text-brand tracking-wider flex items-center gap-2">
            <BookOpen size={16} /> Active Socratic Contexts
          </h3>
          <span className="font-mono text-xs text-ink/60 uppercase">Count: {notebooks.length}</span>
        </div>

        {/* NOTEBOOKS GRID */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 font-mono text-xs uppercase opacity-70 gap-2">
            <div className="w-6 h-6 border-2 border-brand border-t-transparent animate-spin"></div>
            Loading Socratic Contexts...
          </div>
        ) : notebooks.length === 0 ? (
          <div className="text-center font-mono text-xs py-20 border border-dashed border-ink/30 uppercase opacity-55">
            No contexts loaded. Click "NEW NOTEBOOK" to mount a Socratic tutoring agent.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {notebooks.map((nb) => (
              <div 
                key={nb.id} 
                onClick={() => navigate(`/notebook/${nb.id}`)}
                className="panel-container flex flex-col justify-between hover:bg-ink hover:text-canvas group cursor-pointer transition-colors duration-200 border-ink shadow-[4px_4px_0px_#111111] hover:shadow-[4px_4px_0px_#e88b56]"
              >
                <div>
                  <div className="flex justify-between items-start gap-4 mb-2">
                    <span className="font-mono text-[10px] bg-brand text-canvas group-hover:bg-alert group-hover:text-ink px-2 py-0.5 border border-ink font-bold uppercase tracking-wider">
                      {nb.domain}
                    </span>
                    <span className="text-[10px] font-mono text-ink/50 group-hover:text-canvas/50 flex items-center gap-1">
                      <Calendar size={10} /> {new Date(nb.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <h4 className="text-lg font-bold uppercase tracking-wide group-hover:text-canvas leading-tight mb-4">
                    {nb.title}
                  </h4>
                </div>
                
                <div className="flex justify-between items-center border-t border-ink/10 group-hover:border-canvas/20 pt-3 mt-4">
                  <span className="font-mono text-[10px] uppercase font-bold text-ink/70 group-hover:text-canvas/70 flex items-center gap-1.5">
                    <Layers size={12} className="text-alert" /> {nb.sourceCount !== undefined ? nb.sourceCount : 0} Sources Mounted
                  </span>
                  
                  <span className="text-alert font-bold flex items-center text-xs uppercase tracking-wider group-hover:translate-x-1 transition-transform">
                    Open Notebook <ChevronRight size={14} />
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* CREATE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand/35 backdrop-blur-sm p-4">
          <div className="panel-container w-full max-w-md bg-canvas border-ink shadow-[6px_6px_0px_#111111] relative">
            <h3 className="text-xl font-bold text-brand uppercase tracking-wider border-b-1 border-ink pb-3 mb-4">
              Mount Core Context
            </h3>
            
            <form onSubmit={handleCreateNotebook} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="font-mono text-[10px] font-bold uppercase text-ink/70">
                  Notebook Context Title
                </label>
                <input 
                  type="text" 
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Introduction to Calculus"
                  className="border border-ink bg-transparent p-3 font-mono text-sm focus:outline-none focus:ring-1 focus:ring-brand"
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-mono text-[10px] font-bold uppercase text-ink/70">
                  Pedagogical Domain Area
                </label>
                <select 
                  value={newDomain}
                  onChange={(e) => setNewDomain(e.target.value)}
                  className="border border-ink bg-transparent p-3 font-mono text-sm focus:outline-none focus:ring-1 focus:ring-brand appearance-none"
                >
                  <option value="Computer Science">Computer Science</option>
                  <option value="Physics">Physics</option>
                  <option value="Mathematics">Mathematics</option>
                  <option value="General Science">General Science</option>
                </select>
              </div>

              <div className="flex gap-3 mt-6">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="btn-primary flex-1 bg-transparent text-ink hover:bg-ink/5"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn-alert flex-1 uppercase tracking-widest text-xs"
                >
                  Mount Context
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer className="h-8 border-t-1 border-ink bg-brand text-canvas flex items-center px-6 justify-between font-mono text-[10px] uppercase font-bold flex-shrink-0">
        <div>Sys: Online</div>
        <div>M.A.E.S Platform v1.0.0</div>
      </footer>
    </div>
  );
}
