import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  LogOut, Book, Activity, Send, Trash2, 
  ToggleLeft, ToggleRight, Sparkles, FileText, Globe, Video, 
  RefreshCw, Terminal, Database, ArrowLeft
} from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';
import { supabase } from '../lib/supabaseClient';
import api from '../lib/apiClient';

interface Source {
  id: string;
  notebookId: string;
  sourceType: 'pdf' | 'url' | 'youtube' | 'paste';
  title: string;
  isActive: boolean;
  createdAt: string;
}

interface Message {
  role: 'student' | 'tutor';
  text: string;
  bloom_tag?: string;
}

interface Flashcard {
  id: string;
  deckId: string;
  front: string;
  back: string;
  status: 'unseen' | 'review' | 'mastered';
  sortOrder: number;
}

interface FlashcardDeck {
  id: string;
  notebookId: string;
  title: string;
  createdAt: string;
  cards: Flashcard[];
}

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correct_index: number;
  explanation: string;
  bloom_level: string;
}

interface Quiz {
  id: string;
  questions: QuizQuestion[];
}

export default function NotebookView() {
  const { notebookId } = useParams<{ notebookId: string }>();
  const chatBottomRef = useRef<HTMLDivElement>(null);
  
  // Navigation / View State: 'workspace' | 'dashboard' | 'logs' | 'settings'
  const [activeView, setActiveView] = useState<'workspace' | 'dashboard' | 'logs' | 'settings'>('workspace');
  
  // App States
  const [notebook, setNotebook] = useState<any>(null);
  const [sources, setSources] = useState<Source[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [chatLoading, setChatLoading] = useState(false);
  const [inputText, setInputText] = useState('');
  const [currentRegister, setCurrentRegister] = useState('socratic');
  const [user, setUser] = useState<any>(null);

  // Right Panel Sub-tab state: 'notes' | 'flashcards' | 'quiz'
  const [studioTab, setStudioTab] = useState<'notes' | 'flashcards' | 'quiz'>('notes');
  const [notes, setNotes] = useState('');

  // Source Uploader Modal State
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadType, setUploadType] = useState<'pdf' | 'url' | 'youtube' | 'paste'>('pdf');
  const [urlInput, setUrlInput] = useState('');
  const [pasteTitle, setPasteTitle] = useState('');
  const [pasteContent, setPasteContent] = useState('');
  const [fileInput, setFileInput] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Flashcards State
  const [flashcardDecks, setFlashcardDecks] = useState<FlashcardDeck[]>([]);
  const [activeDeck, setActiveDeck] = useState<FlashcardDeck | null>(null);
  const [currentCardIdx, setCurrentCardIdx] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isGeneratingCards, setIsGeneratingCards] = useState(false);
  const [flashcardTopic, setFlashcardTopic] = useState('');

  // Quiz State
  const [currentQuiz, setCurrentQuiz] = useState<Quiz | null>(null);
  const [quizDifficulty, setQuizDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [quizSize, setQuizSize] = useState(5);
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({}); // question index -> selected option index
  const [submittedQuiz, setSubmittedQuiz] = useState(false);

  // Dashboard Stats
  const [telemetrySessions, setTelemetrySessions] = useState<any[]>([]);
  const [telemetryLogs, setTelemetryLogs] = useState<any[]>([]);
  const [telemetryLoading, setTelemetryLoading] = useState(false);

  // Settings State
  const [preferredRegister, setPreferredRegister] = useState('socratic');
  const [sessionTtl, setSessionTtl] = useState(30);

  // Load basic configurations and user profile
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data: { user: sbUser } } = await supabase.auth.getUser();
        if (sbUser) setUser(sbUser);
        else {
          const demo = localStorage.getItem('maes_demo_session');
          if (demo) setUser(JSON.parse(demo).user);
        }
      } catch (e) {
        const demo = localStorage.getItem('maes_demo_session');
        if (demo) setUser(JSON.parse(demo).user);
      }
    };

    fetchUser();
    fetchNotebookDetails();
    fetchSources();
    loadNotes();
    loadLocalFlashcards();
    loadLocalQuiz();
  }, [notebookId]);

  // Scroll to bottom of chat
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, chatLoading]);

  // Load telemetries when switching views
  useEffect(() => {
    let interval: any;
    if (activeView === 'dashboard' || activeView === 'logs') {
      fetchTelemetryData();
      if (activeView === 'logs') {
        interval = setInterval(() => fetchTelemetryData(), 2000);
      }
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeView, sessionId]);

  // Auto-start session once user and notebook are loaded
  useEffect(() => {
    if (user && notebook && !sessionId) {
      handleStartSession();
    }
  }, [user, notebook, sessionId]);

  // Notebook Info
  const fetchNotebookDetails = async () => {
    try {
      const { data } = await api.get(`/notebooks/${notebookId}`);
      if (data && data.notebook) {
        setNotebook(data.notebook);
      } else {
        setNotebook({ id: notebookId, title: "Introduction to Algorithms & Complexity", domain: "Computer Science" });
      }
    } catch (e) {
      setNotebook({ id: notebookId, title: "Introduction to Algorithms & Complexity", domain: "Computer Science" });
    }
  };

  // Notes Local Storage caching
  const loadNotes = () => {
    const saved = localStorage.getItem(`maes_notes_${notebookId}`);
    if (saved) setNotes(saved);
    else setNotes('');
  };

  const handleNotesChange = (val: string) => {
    setNotes(val);
    localStorage.setItem(`maes_notes_${notebookId}`, val);
  };

  // Sources handling
  const fetchSources = async () => {
    try {
      const { data } = await api.get(`/sources/${notebookId}`);
      if (data && data.sources) {
        setSources(data.sources);
      }
    } catch (e) {
      console.warn("Failed fetching sources", e);
    }
  };


  const handleToggleSource = async (id: string, currentActive: boolean) => {
    try {
      await api.patch(`/sources/${id}/toggle`, { is_active: !currentActive });
      setSources(sources.map(s => s.id === id ? { ...s, isActive: !currentActive } : s));
    } catch (e) {
      const updated = sources.map(s => s.id === id ? { ...s, isActive: !currentActive } : s);
      setSources(updated);
      localStorage.setItem(`maes_sources_${notebookId}`, JSON.stringify(updated));
    }
  };

  const handleDeleteSource = async (id: string) => {
    try {
      await api.delete(`/sources/${id}`);
      setSources(sources.filter(s => s.id !== id));
    } catch (e) {
      const updated = sources.filter(s => s.id !== id);
      setSources(updated);
      localStorage.setItem(`maes_sources_${notebookId}`, JSON.stringify(updated));
    }
  };

  // Sources Ingestion Form
  const handleIngestSource = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploading(true);
    try {
      let responseData: any = null;

      if (uploadType === 'paste') {
        const { data } = await api.post('/sources/paste', {
          notebook_id: notebookId,
          title: pasteTitle || 'Pasted Context Log',
          content: pasteContent
        });
        responseData = data?.source;
      } else if (uploadType === 'url') {
        const { data } = await api.post('/sources/import-url', {
          notebook_id: notebookId,
          url: urlInput
        });
        responseData = data?.source;
      } else if (uploadType === 'youtube') {
        const { data } = await api.post('/sources/import-youtube', {
          notebook_id: notebookId,
          url: urlInput
        });
        responseData = data?.source;
      } else if (uploadType === 'pdf') {
        if (!fileInput) return;
        const formData = new FormData();
        formData.append('notebook_id', notebookId || '');
        formData.append('file', fileInput);
        const { data } = await api.post('/sources/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        responseData = data?.source;
      }

      if (responseData) {
        setSources((prev) => [...prev, responseData]);
      }
    } catch (e: any) {
      console.warn("Failed ingesting source via API", e);
      alert(e.response?.data?.detail || "Failed to upload document. Please try again.");
    } finally {
      setIsUploading(false);
      setIsUploadModalOpen(false);
      setUrlInput('');
      setPasteTitle('');
      setPasteContent('');
      setFileInput(null);
    }
  };


  // Chat/Socratic loop handlers
  const handleStartSession = async () => {
    try {
      const studentId = user?.id || '123e4567-e89b-12d3-a456-426614174000';
      const domain = notebook?.domain || 'Computer Science';
      const { data } = await api.post('/session/start', { student_id: studentId, domain, notebook_id: notebookId });
      setSessionId(data.session_id);
      setMessages([
        { role: 'tutor', text: `Socratic Comm Link established. Direct instruction is locked. Transmit your initial thesis or question concerning: "${domain}"`, bloom_tag: 'remember' }
      ]);
    } catch (e) {
      console.warn("Failed starting session via API, running local session", e);
      setSessionId(`sess-${Math.random().toString(36).substr(2, 9)}`);
      setMessages([
        { role: 'tutor', text: `LOCAL COMM LINK ACTIVE (Demo Mode). I will evaluate your understanding Socratically. Transmit your ideas.`, bloom_tag: 'remember' }
      ]);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || chatLoading || !sessionId) return;
    
    const text = inputText;
    setInputText('');
    setMessages((prev) => [...prev, { role: 'student', text }]);
    setChatLoading(true);

    try {
      const { data } = await api.post('/turn/', { session_id: sessionId, student_message: text });
      setMessages((prev) => [
        ...prev,
        { role: 'tutor', text: data.hint_text, bloom_tag: data.bloom_tag }
      ]);
      if (data.register) setCurrentRegister(data.register);
    } catch (e) {
      console.warn("API turn failed, using local Socratic tutor generator", e);
      // Simulate local Socratic fallback
      setTimeout(() => {
        const socraticQuestions = [
          "What led you to that conclusion about this algorithm?",
          "Can you explain how this handles the boundary conditions if the input is empty?",
          "What assumptions are we making about the time complexity here?",
          "How might this apply to a scenario where we have nested loops?",
          "What is the underlying logic linking these two variables?"
        ];
        const randomQuestion = socraticQuestions[Math.floor(Math.random() * socraticQuestions.length)];
        setMessages((prev) => [
          ...prev,
          { role: 'tutor', text: `[DEMO TUTOR] Interesting proposal. ${randomQuestion}`, bloom_tag: 'analyze' }
        ]);
        setChatLoading(false);
      }, 1500);
      return;
    }
    setChatLoading(false);
  };

  const handleEndSession = async () => {
    if (!sessionId) return;
    try {
      await api.post('/session/end', { session_id: sessionId });
    } catch (e) {
      console.warn("Failed ending session via API", e);
    }
    setSessionId(null);
    setMessages([]);
  };

  // Flashcards Logic
  const loadLocalFlashcards = () => {
    const cached = localStorage.getItem(`maes_flashcards_${notebookId}`);
    if (cached) {
      const decks = JSON.parse(cached);
      setFlashcardDecks(decks);
      if (decks.length > 0) setActiveDeck(decks[0]);
    }
  };

  const handleGenerateFlashcards = async () => {
    setIsGeneratingCards(true);
    try {
      const { data } = await api.post('/studio/flashcards', {
        notebook_id: notebookId,
        topic: flashcardTopic || 'Key Concepts'
      });
      if (data && data.deck) {
        const updated = [data.deck, ...flashcardDecks];
        setFlashcardDecks(updated);
        setActiveDeck(data.deck);
        setCurrentCardIdx(0);
        setIsFlipped(false);
        localStorage.setItem(`maes_flashcards_${notebookId}`, JSON.stringify(updated));
      }
    } catch (e) {
      console.warn("Failed generating flashcards from API", e);
    }
    setIsGeneratingCards(false);
  };

  const handleCardMastery = (status: 'review' | 'mastered') => {
    if (!activeDeck) return;
    const cards = [...activeDeck.cards];
    cards[currentCardIdx].status = status;
    const updatedDeck = { ...activeDeck, cards };
    const updatedDecks = flashcardDecks.map(d => d.id === activeDeck.id ? updatedDeck : d);
    setFlashcardDecks(updatedDecks);
    setActiveDeck(updatedDeck);
    localStorage.setItem(`maes_flashcards_${notebookId}`, JSON.stringify(updatedDecks));

    // Move to next card if master
    if (currentCardIdx < cards.length - 1) {
      setTimeout(() => {
        setIsFlipped(false);
        setCurrentCardIdx(prev => prev + 1);
      }, 300);
    }
  };

  // Quiz Logic
  const loadLocalQuiz = () => {
    const cached = localStorage.getItem(`maes_quiz_${notebookId}`);
    if (cached) {
      setCurrentQuiz(JSON.parse(cached));
    }
  };

  const handleGenerateQuiz = async () => {
    setIsGeneratingQuiz(true);
    setQuizAnswers({});
    setSubmittedQuiz(false);
    try {
      const { data } = await api.post('/studio/quiz', {
        notebook_id: notebookId,
        num_questions: quizSize,
        difficulty: quizDifficulty
      });
      if (data && data.quiz) {
        setCurrentQuiz(data.quiz);
        localStorage.setItem(`maes_quiz_${notebookId}`, JSON.stringify(data.quiz));
      }
    } catch (e) {
      console.warn("Failed generating quiz from API", e);
    }
    setIsGeneratingQuiz(false);
  };

  const calculateQuizScore = () => {
    if (!currentQuiz) return 0;
    let score = 0;
    currentQuiz.questions.forEach((q, idx) => {
      if (quizAnswers[idx] === q.correct_index) score++;
    });
    return score;
  };

  // Telemetry Dashboard data fetching
  const fetchTelemetryData = async () => {
    setTelemetryLoading(true);
    try {
      // 1. Fetch recent sessions telemetry summary from API
      const { data } = await api.get('/audit/dashboard/summary');
      if (data && data.sessions) {
        setTelemetrySessions(data.sessions);
      }
    } catch (e) {
      console.warn("Failed loading audit summary stats", e);
    }
    // Fetch live audit logs for the current active session
    if (sessionId) {
      try {
        const res = await api.get(`/audit/logs/${sessionId}`);
        if (res.data && res.data.logs) {
          setTelemetryLogs(res.data.logs);
        }
      } catch (e) {
        console.warn("Failed fetching live audit logs", e);
      }
    }
    
    setTelemetryLoading(false);
  };

  // Logout / Disconnect
  const handleLogout = async () => {
    await handleEndSession();
    localStorage.removeItem('maes_demo_session');
    await supabase.auth.signOut();
    window.dispatchEvent(new Event('maes_auth_change'));
  };

  return (
    <div className="h-screen w-full flex flex-col bg-canvas text-ink overflow-hidden font-sans">
      
      {/* NAVBAR */}
      <header className="h-16 border-b-1 border-ink flex items-center justify-between px-6 bg-canvas flex-shrink-0 z-10">
        <div className="flex items-center gap-4">
          <Link to="/" className="bg-brand text-canvas p-2 hover:bg-alert hover:text-ink transition-colors">
            <ArrowLeft size={16} />
          </Link>
          <h1 className="font-bold text-lg uppercase tracking-widest text-brand flex items-center gap-2">
            <Terminal size={18} /> {notebook?.title || "Operational Terminal"}
          </h1>
        </div>
        
        {/* NAV SECTIONS */}
        <div className="flex items-center gap-6">
          <nav className="hidden md:flex gap-4 font-mono text-sm uppercase tracking-wide font-bold">
            <button 
              onClick={() => setActiveView('workspace')} 
              className={`pb-1 border-b-2 transition-all ${activeView === 'workspace' ? 'border-brand text-brand' : 'border-transparent text-ink/60 hover:text-ink hover:border-ink/20'}`}
            >
              Workspace
            </button>
            <button 
              onClick={() => setActiveView('dashboard')} 
              className={`pb-1 border-b-2 transition-all ${activeView === 'dashboard' ? 'border-brand text-brand' : 'border-transparent text-ink/60 hover:text-ink hover:border-ink/20'}`}
            >
              Telemetry
            </button>
            <button 
              onClick={() => setActiveView('logs')} 
              className={`pb-1 border-b-2 transition-all ${activeView === 'logs' ? 'border-brand text-brand' : 'border-transparent text-ink/60 hover:text-ink hover:border-ink/20'}`}
            >
              Audit Logs
            </button>
            <button 
              onClick={() => setActiveView('settings')} 
              className={`pb-1 border-b-2 transition-all ${activeView === 'settings' ? 'border-brand text-brand' : 'border-transparent text-ink/60 hover:text-ink hover:border-ink/20'}`}
            >
              System Settings
            </button>
          </nav>
          
          <button onClick={handleLogout} className="btn-primary flex items-center gap-2 text-xs uppercase tracking-wider p-2">
            <LogOut size={14} /> Disconnect
          </button>
        </div>
      </header>

      {/* CORE CONTENT SWITCHER */}
      <div className="flex-1 overflow-hidden relative">
        
        {/* 1. THREE PANEL WORKSPACE VIEW */}
        {activeView === 'workspace' && (
          <div className="h-full flex overflow-hidden">
            
            {/* LEFT PANEL: KNOWLEDGE SOURCES */}
            <aside className="w-1/4 border-r-1 border-ink flex flex-col bg-canvas select-none">
              <div className="p-3 border-b-1 border-ink bg-brand text-canvas flex justify-between items-center">
                <span className="font-bold uppercase tracking-wider text-xs flex items-center gap-2">
                  <Book size={14} /> Mounted Contexts
                </span>
                <span className="font-mono text-[10px] text-canvas/70">{sources.length} Docs</span>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
                {sources.map((src) => (
                  <div 
                    key={src.id} 
                    className={`border border-ink p-3 flex flex-col gap-2 transition-all ${src.isActive ? 'bg-canvas shadow-[3px_3px_0px_#111111]' : 'bg-ink/5 opacity-60'}`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex gap-2 items-center">
                        {src.sourceType === 'pdf' && <FileText size={14} className="text-brand flex-shrink-0" />}
                        {src.sourceType === 'url' && <Globe size={14} className="text-brand flex-shrink-0" />}
                        {src.sourceType === 'youtube' && <Video size={14} className="text-brand flex-shrink-0" />}
                        {src.sourceType === 'paste' && <Sparkles size={14} className="text-brand flex-shrink-0" />}
                        
                        <p className="font-mono text-xs uppercase font-bold truncate max-w-[130px]" title={src.title}>
                          {src.title}
                        </p>
                      </div>
                      <button 
                        onClick={() => handleDeleteSource(src.id)}
                        className="text-ink hover:text-alert transition-colors cursor-pointer"
                        title="Delete context"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                    
                    <div className="flex justify-between items-center pt-1 border-t border-ink/5 mt-1">
                      <span className="text-[8px] font-mono uppercase opacity-60">
                        {src.sourceType}
                      </span>
                      <button 
                        onClick={() => handleToggleSource(src.id, src.isActive)}
                        className="text-brand hover:text-alert font-bold font-mono text-[9px] uppercase flex items-center gap-1 cursor-pointer"
                      >
                        {src.isActive ? (
                          <>Active <ToggleRight size={14} className="text-brand" /></>
                        ) : (
                          <>Inactive <ToggleLeft size={14} className="text-ink/40" /></>
                        )}
                      </button>
                    </div>
                  </div>
                ))}
                
                <button 
                  onClick={() => setIsUploadModalOpen(true)}
                  className="btn-alert text-xs mt-4 uppercase tracking-widest"
                >
                  Mount New Document
                </button>
              </div>
            </aside>

            {/* CENTER PANEL: SOCRATIC CHAT CHANNEL */}
            <section className="flex-1 flex flex-col relative bg-canvas">
              <div className="p-3 border-b-1 border-ink bg-canvas flex justify-between items-center z-10 shadow-sm flex-shrink-0">
                <span className="font-bold uppercase tracking-wider text-xs text-brand flex items-center gap-2">
                  <Activity size={14} className="text-brand animate-pulse" /> Socratic Comm Link
                </span>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-[10px] uppercase text-alert animate-pulse font-bold bg-alert/10 px-2 py-0.5 border border-alert/20">
                    Link Active // {currentRegister}
                  </span>
                </div>
              </div>
              
              {/* CHAT MESSAGES STREAM */}
              <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
                {messages.length === 0 ? (
                  <div className="text-center font-mono text-xs opacity-50 mt-20 uppercase flex flex-col items-center gap-4">
                    <Terminal size={32} className="text-brand opacity-60" />
                    <span>Awaiting comms link initiation... Click "INITIATE LINK" to trigger pedagogical agent.</span>
                  </div>
                ) : (
                  messages.map((msg, idx) => (
                    <div 
                      key={idx} 
                      className={`flex flex-col gap-1.5 max-w-[80%] ${msg.role === 'student' ? 'self-end items-end' : 'self-start'}`}
                    >
                      <div className="flex items-center gap-2">
                        <span className={`font-mono text-[10px] font-bold uppercase tracking-wider ${msg.role === 'student' ? 'text-alert' : 'text-brand'}`}>
                          {msg.role === 'student' ? 'Student' : 'Socratic Tutor'}
                        </span>
                        {msg.bloom_tag && (
                          <span className="bg-ink text-canvas text-[8px] px-1.5 py-0.5 uppercase tracking-wider font-mono font-bold">
                            {msg.bloom_tag}
                          </span>
                        )}
                      </div>
                      
                      <div className={`p-4 border border-ink font-mono text-sm leading-relaxed ${msg.role === 'student' ? 'bg-ink text-canvas shadow-[4px_4px_0px_#e88b56]' : 'bg-canvas shadow-[4px_4px_0px_#111111]'}`}>
                        <p className="whitespace-pre-wrap">{msg.text}</p>
                      </div>
                    </div>
                  ))
                )}
                
                {chatLoading && (
                  <div className="flex flex-col gap-1.5 max-w-[80%] self-start animate-pulse">
                    <span className="font-mono text-[10px] font-bold uppercase text-brand">Socratic Tutor</span>
                    <div className="p-4 border border-ink bg-canvas flex items-center gap-3 shadow-[4px_4px_0px_#111111]">
                      <div className="flex gap-1.5">
                        <div className="w-2 h-2 bg-brand rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                        <div className="w-2 h-2 bg-brand rounded-full animate-bounce" style={{ animationDelay: '0.15s' }}></div>
                        <div className="w-2 h-2 bg-brand rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></div>
                      </div>
                      <span className="font-mono text-[10px] uppercase opacity-70 tracking-wider">Evaluating System Rubrics...</span>
                    </div>
                  </div>
                )}
                <div ref={chatBottomRef} />
              </div>
              
              {/* TRANSMIT INPUT FORM */}
              <form onSubmit={handleSendMessage} className="p-4 border-t-1 border-ink bg-canvas flex gap-3 flex-shrink-0 z-10">
                <input 
                  type="text" 
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  disabled={!sessionId || chatLoading}
                  className="flex-1 border border-ink bg-transparent p-3 font-mono text-sm focus:outline-none focus:ring-1 focus:ring-brand disabled:opacity-40"
                  placeholder={sessionId ? "Type thesis or answer here..." : "Establish comm link to enable transmitter..."}
                />
                <button 
                  type="submit" 
                  disabled={!sessionId || chatLoading || !inputText.trim()} 
                  className="btn-primary font-bold tracking-widest uppercase disabled:opacity-40 flex items-center gap-2"
                >
                  <Send size={14} /> Transmit
                </button>
              </form>
            </section>

            {/* RIGHT PANEL: STUDIO AREA (Notes, Flashcards, Quiz) */}
            <aside className="w-1/4 border-l-1 border-ink flex flex-col bg-canvas z-0 select-none">
              
              {/* STUDIO PANEL TAB CONTROLLER */}
              <div className="flex border-b-1 border-ink font-mono text-[10px] font-bold uppercase tracking-wider flex-shrink-0 bg-ink/5">
                <button 
                  onClick={() => setStudioTab('notes')}
                  className={`flex-1 py-3 text-center border-r-1 border-ink transition-all ${studioTab === 'notes' ? 'bg-canvas text-brand border-b-transparent font-black' : 'text-ink/55 hover:bg-ink/5'}`}
                >
                  Notes
                </button>
                <button 
                  onClick={() => setStudioTab('flashcards')}
                  className={`flex-1 py-3 text-center border-r-1 border-ink transition-all ${studioTab === 'flashcards' ? 'bg-canvas text-brand border-b-transparent font-black' : 'text-ink/55 hover:bg-ink/5'}`}
                >
                  Cards
                </button>
                <button 
                  onClick={() => setStudioTab('quiz')}
                  className={`flex-1 py-3 text-center transition-all ${studioTab === 'quiz' ? 'bg-canvas text-brand border-b-transparent font-black' : 'text-ink/55 hover:bg-ink/5'}`}
                >
                  Quiz
                </button>
              </div>
              
              {/* TAB PANES CONTAINER */}
              <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
                
                {/* A. WORKSPACE NOTES */}
                {studioTab === 'notes' && (
                  <div className="flex-1 flex flex-col h-full">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-mono text-[10px] uppercase font-bold text-brand">Workspace Notes</span>
                      <span className="text-[9px] font-mono text-ink/50 bg-ink/5 px-2 py-0.5 border border-ink/10 rounded">Auto-Saved</span>
                    </div>
                    <textarea 
                      value={notes}
                      onChange={(e) => handleNotesChange(e.target.value)}
                      className="w-full flex-1 border border-ink bg-transparent p-3 font-mono text-xs resize-none focus:outline-none focus:ring-1 focus:ring-brand min-h-[350px] leading-relaxed" 
                      placeholder="Write critical takeaways and outlines here..."
                    />
                  </div>
                )}

                {/* B. SPACED REPETITION FLASHCARDS */}
                {studioTab === 'flashcards' && (
                  <div className="flex-1 flex flex-col gap-4">
                    
                    {/* GENERATION INSTRUCTION */}
                    <div className="panel-container flex flex-col gap-3">
                      <h4 className="font-mono font-bold text-xs uppercase text-brand">Assemble Study Deck</h4>
                      <input 
                        type="text"
                        value={flashcardTopic}
                        onChange={(e) => setFlashcardTopic(e.target.value)}
                        placeholder="Deck theme (e.g. Pump Hydraulics)"
                        className="border border-ink bg-transparent p-2 font-mono text-xs focus:outline-none w-full"
                      />
                      <button 
                        onClick={handleGenerateFlashcards}
                        disabled={isGeneratingCards || sources.length === 0}
                        className="btn-alert text-xs py-2 w-full uppercase tracking-wider font-bold disabled:opacity-40"
                      >
                        {isGeneratingCards ? 'Compiling deck...' : 'Generate Deck'}
                      </button>
                    </div>

                    {/* ACTIVE DECK VIEWER */}
                    {activeDeck && activeDeck.cards.length > 0 ? (
                      <div className="flex flex-col gap-3">
                        <div className="flex justify-between items-center">
                          <span className="font-mono text-[10px] font-bold text-brand uppercase truncate max-w-[120px]">{activeDeck.title}</span>
                          <span className="font-mono text-[9px] text-ink/60">{currentCardIdx + 1} of {activeDeck.cards.length} cards</span>
                        </div>
                        
                        {/* FLIP CARD ANCHOR */}
                        <div 
                          onClick={() => setIsFlipped(!isFlipped)}
                          className="h-44 border border-ink cursor-pointer bg-canvas shadow-[4px_4px_0px_#111111] hover:shadow-[4px_4px_0px_#e88b56] transition-all relative p-6 flex flex-col items-center justify-center text-center overflow-y-auto"
                        >
                          <div className="absolute top-2 right-2 text-[8px] font-mono uppercase bg-ink/10 px-1 py-0.5">
                            {isFlipped ? 'Answer' : 'Question'}
                          </div>
                          
                          <p className="font-mono text-xs leading-relaxed font-bold">
                            {isFlipped ? activeDeck.cards[currentCardIdx].back : activeDeck.cards[currentCardIdx].front}
                          </p>
                          
                          <div className="absolute bottom-2 text-[8px] font-mono uppercase text-ink/40">
                            Click card to flip
                          </div>
                        </div>

                        {/* MASTERY CONTROLS */}
                        {isFlipped && (
                          <div className="flex gap-2 animate-fadeIn">
                            <button 
                              onClick={() => handleCardMastery('review')}
                              className="btn-primary flex-1 bg-transparent text-ink hover:bg-ink/5 text-xs py-2 font-mono"
                            >
                              Need Review
                            </button>
                            <button 
                              onClick={() => handleCardMastery('mastered')}
                              className="btn-alert flex-1 text-xs py-2 font-mono font-bold"
                            >
                              Mastered
                            </button>
                          </div>
                        )}

                        {/* PAGE CONTROLS */}
                        <div className="flex justify-between mt-2 font-mono text-[10px]">
                          <button 
                            disabled={currentCardIdx === 0}
                            onClick={() => { setCurrentCardIdx(prev => prev - 1); setIsFlipped(false); }}
                            className="text-brand hover:underline font-bold disabled:opacity-30"
                          >
                            &lt; Prev Card
                          </button>
                          <button 
                            disabled={currentCardIdx === activeDeck.cards.length - 1}
                            onClick={() => { setCurrentCardIdx(prev => prev + 1); setIsFlipped(false); }}
                            className="text-brand hover:underline font-bold disabled:opacity-30"
                          >
                            Next Card &gt;
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-10 font-mono text-[10px] border border-dashed border-ink/25 text-ink/50 uppercase">
                        No decks active. Mount a source and generate flashcards.
                      </div>
                    )}
                  </div>
                )}

                {/* C. MULTIPLE CHOICE QUIZ GROUNDING */}
                {studioTab === 'quiz' && (
                  <div className="flex-1 flex flex-col gap-4">
                    
                    {/* QUIZ CONFIG */}
                    {!currentQuiz && (
                      <div className="panel-container flex flex-col gap-3">
                        <h4 className="font-mono font-bold text-xs uppercase text-brand">Ground Quiz Generator</h4>
                        
                        <div className="flex flex-col gap-1">
                          <span className="text-[9px] font-mono text-ink/60 uppercase">Difficulty</span>
                          <select 
                            value={quizDifficulty}
                            onChange={(e: any) => setQuizDifficulty(e.target.value)}
                            className="border border-ink bg-transparent p-1.5 font-mono text-xs w-full focus:outline-none"
                          >
                            <option value="easy">Easy (Knowledge)</option>
                            <option value="medium">Medium (Application)</option>
                            <option value="hard">Hard (Synthesis)</option>
                          </select>
                        </div>

                        <div className="flex flex-col gap-1">
                          <span className="text-[9px] font-mono text-ink/60 uppercase">Questions</span>
                          <input 
                            type="number"
                            value={quizSize}
                            onChange={(e) => setQuizSize(Number(e.target.value))}
                            min={3}
                            max={10}
                            className="border border-ink bg-transparent p-1.5 font-mono text-xs w-full focus:outline-none"
                          />
                        </div>
                        
                        <button 
                          onClick={handleGenerateQuiz}
                          disabled={isGeneratingQuiz || sources.length === 0}
                          className="btn-alert text-xs py-2 w-full uppercase tracking-wider font-bold disabled:opacity-40"
                        >
                          {isGeneratingQuiz ? 'Compiling Quiz...' : 'Assemble Quiz'}
                        </button>
                      </div>
                    )}

                    {/* ACTIVE MCQS SCREEN */}
                    {currentQuiz && (
                      <div className="flex flex-col gap-4">
                        <div className="flex justify-between items-center">
                          <span className="font-mono text-[10px] font-bold text-brand uppercase">Active Evaluation</span>
                          {submittedQuiz ? (
                            <span className="font-mono text-[10px] font-black text-brand bg-alert/20 px-2 border border-ink">
                              Score: {calculateQuizScore()} / {currentQuiz.questions.length}
                            </span>
                          ) : (
                            <button 
                              onClick={() => { setCurrentQuiz(null); setQuizAnswers({}); setSubmittedQuiz(false); }}
                              className="text-[9px] font-mono text-alert hover:underline uppercase font-bold"
                            >
                              Reset
                            </button>
                          )}
                        </div>

                        <div className="flex flex-col gap-5">
                          {currentQuiz.questions.map((q, qIdx) => {
                            const isCorrect = quizAnswers[qIdx] === q.correct_index;
                            return (
                              <div key={q.id} className="border border-ink p-3 bg-canvas shadow-[2px_2px_0px_#111111]">
                                <div className="flex gap-2 items-start mb-2">
                                  <span className="font-mono text-[10px] bg-brand text-canvas px-1.5 rounded">{qIdx+1}</span>
                                  <h5 className="font-mono text-xs font-bold leading-relaxed">{q.question}</h5>
                                </div>
                                
                                <div className="flex flex-col gap-1.5 mt-2">
                                  {q.options.map((opt, optIdx) => {
                                    const isSelected = quizAnswers[qIdx] === optIdx;
                                    let btnStyle = "border-ink hover:bg-ink/5";
                                    if (isSelected) btnStyle = "bg-ink text-canvas font-bold border-ink";
                                    if (submittedQuiz) {
                                      if (optIdx === q.correct_index) {
                                        btnStyle = "bg-brand text-canvas font-black border-brand";
                                      } else if (isSelected && !isCorrect) {
                                        btnStyle = "bg-alert text-ink font-bold border-alert";
                                      } else {
                                        btnStyle = "opacity-55 border-ink/20";
                                      }
                                    }
                                    return (
                                      <button
                                        key={optIdx}
                                        disabled={submittedQuiz}
                                        onClick={() => setQuizAnswers(prev => ({ ...prev, [qIdx]: optIdx }))}
                                        className={`border p-2 font-mono text-[10px] text-left transition-all leading-relaxed ${btnStyle}`}
                                      >
                                        {opt}
                                      </button>
                                    );
                                  })}
                                </div>

                                {submittedQuiz && (
                                  <div className="mt-3 p-2 bg-ink/5 border-l-2 border-brand font-mono text-[9px] leading-relaxed">
                                    <p className="font-bold uppercase text-brand tracking-wider">
                                      {isCorrect ? "✔ CORRECT" : "❌ INCORRECT"} // Bloom: {q.bloom_level}
                                    </p>
                                    <p className="mt-1 opacity-80">{q.explanation}</p>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>

                        {!submittedQuiz && (
                          <button 
                            onClick={() => setSubmittedQuiz(true)}
                            disabled={Object.keys(quizAnswers).length < currentQuiz.questions.length}
                            className="btn-alert text-xs py-3 w-full uppercase tracking-widest font-bold disabled:opacity-40 mt-2"
                          >
                            Submit Answers
                          </button>
                        )}
                        
                        {submittedQuiz && (
                          <button 
                            onClick={() => { setCurrentQuiz(null); setQuizAnswers({}); setSubmittedQuiz(false); }}
                            className="btn-primary text-xs py-2 w-full uppercase font-mono tracking-wider mt-2"
                          >
                            Exit Quiz
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </aside>
          </div>
        )}

        {/* 2. TELEMETRY DASHBOARD OVERLAY VIEW */}
        {activeView === 'dashboard' && (
          <div className="h-full overflow-y-auto p-6 md:p-10 bg-canvas flex flex-col gap-8">
            <div className="flex justify-between items-center border-b border-ink pb-3">
              <div>
                <h2 className="text-2xl font-bold uppercase tracking-wider text-brand">System Telemetry Board</h2>
                <p className="font-mono text-xs opacity-60 uppercase mt-0.5">Review performance logs, Socratic compliance audits, and student struggle ratios.</p>
              </div>
              <button 
                onClick={fetchTelemetryData} 
                disabled={telemetryLoading}
                className="btn-primary text-xs flex items-center gap-1.5 uppercase font-bold py-2 font-mono"
              >
                <RefreshCw size={14} className={telemetryLoading ? "animate-spin" : ""} /> Sync Logs
              </button>
            </div>

            {/* HIGH-LEVEL TELEMETRY STATS GRID */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="panel-container bg-canvas border-ink shadow-[4px_4px_0px_#111111] flex flex-col justify-between">
                <span className="font-mono text-[10px] uppercase text-brand font-bold">Avg Hint Quality</span>
                <span className="text-4xl font-mono font-black text-brand mt-2">4.6<span className="text-lg text-ink/50">/5</span></span>
                <div className="w-full bg-ink/15 h-1 mt-4">
                  <div className="bg-brand h-full w-[92%]"></div>
                </div>
              </div>
              <div className="panel-container bg-canvas border-ink shadow-[4px_4px_0px_#111111] flex flex-col justify-between">
                <span className="font-mono text-[10px] uppercase text-brand font-bold">Auditor Interventions</span>
                <span className="text-4xl font-mono font-black text-alert mt-2">12.5%</span>
                <div className="w-full bg-ink/15 h-1 mt-4">
                  <div className="bg-alert h-full w-[12.5%]"></div>
                </div>
              </div>
              <div className="panel-container bg-canvas border-ink shadow-[4px_4px_0px_#111111] flex flex-col justify-between">
                <span className="font-mono text-[10px] uppercase text-brand font-bold">Avg Bloom Level</span>
                <span className="text-3xl font-mono font-black text-brand mt-2 uppercase text-sm">Analyze <span className="text-xs text-ink/50 font-normal">(4.2)</span></span>
                <div className="w-full bg-ink/15 h-1 mt-4">
                  <div className="bg-brand h-full w-[70%]"></div>
                </div>
              </div>
              <div className="panel-container bg-canvas border-ink shadow-[4px_4px_0px_#111111] flex flex-col justify-between">
                <span className="font-mono text-[10px] uppercase text-brand font-bold">Active Sessions</span>
                <span className="text-4xl font-mono font-black text-brand mt-2">{telemetrySessions.length}</span>
                <span className="text-[9px] font-mono text-ink/40 uppercase mt-4">Synchronized with Neon DB</span>
              </div>
            </div>

            {/* CHARTS CONTAINER */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* CHART A: Bloom Taxonomy Progression */}
              <div className="panel-container border-ink shadow-[6px_6px_0px_#111111]">
                <h3 className="font-mono font-bold text-xs uppercase text-brand mb-4 border-b border-ink/10 pb-2">Bloom progression (Turn metrics)</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={[
                      { turn: 1, level: 1, label: 'Remember' },
                      { turn: 2, level: 2, label: 'Understand' },
                      { turn: 3, level: 2, label: 'Understand' },
                      { turn: 4, level: 3, label: 'Apply' },
                      { turn: 5, level: 4, label: 'Analyze' },
                      { turn: 6, level: 4, label: 'Analyze' },
                      { turn: 7, level: 5, label: 'Evaluate' }
                    ]}>
                      <XAxis dataKey="turn" stroke="#111" />
                      <YAxis stroke="#111" domain={[0, 6]} ticks={[1,2,3,4,5,6]} tickFormatter={(val) => {
                        const m: Record<number, string> = {1:'REM', 2:'UND', 3:'APP', 4:'ANA', 5:'EVA', 6:'CRE'};
                        return m[val] || '';
                      }} />
                      <Tooltip formatter={(value: any) => {
                        const m: Record<number, string> = {1:'Remember', 2:'Understand', 3:'Apply', 4:'Analyze', 5:'Evaluate', 6:'Create'};
                        return [m[value] || value, "Bloom Taxonomy Level"];
                      }} />
                      <Line type="monotone" dataKey="level" stroke="#062c22" strokeWidth={3} dot={{ fill: '#e88b56', stroke: '#111', strokeWidth: 1 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* CHART B: Tutor Quality Audits */}
              <div className="panel-container border-ink shadow-[6px_6px_0px_#111111]">
                <h3 className="font-mono font-bold text-xs uppercase text-brand mb-4 border-b border-ink/10 pb-2">Recent Session Evaluations</h3>
                {telemetrySessions.length === 0 ? (
                  <div className="h-64 flex items-center justify-center font-mono text-[10px] uppercase text-ink/50">
                    No session telemetries fetched.
                  </div>
                ) : (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={telemetrySessions}>
                        <XAxis dataKey="student_id" stroke="#111" />
                        <YAxis stroke="#111" />
                        <Tooltip />
                        <Bar dataKey="avg_hint_quality" fill="#e88b56" stroke="#111" strokeWidth={1}>
                          {telemetrySessions.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#062c22' : '#e88b56'} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </div>

            {/* NEON AUDIT SESSIONS LIST */}
            <div className="panel-container border-ink shadow-[6px_6px_0px_#111111] overflow-hidden">
              <h3 className="font-mono font-bold text-xs uppercase text-brand mb-4 border-b border-ink/10 pb-2 flex items-center gap-2">
                <Database size={14} /> Active Audit Logs (Neon Database Sync)
              </h3>
              
              <div className="overflow-x-auto">
                <table className="w-full font-mono text-[10px] text-left border-collapse">
                  <thead>
                    <tr className="bg-ink/5 border-b border-ink">
                      <th className="p-2 border-r border-ink/10 uppercase">Session ID</th>
                      <th className="p-2 border-r border-ink/10 uppercase">Student ID</th>
                      <th className="p-2 border-r border-ink/10 uppercase">Domain</th>
                      <th className="p-2 border-r border-ink/10 uppercase text-center">Turns</th>
                      <th className="p-2 border-r border-ink/10 uppercase text-center">Avg Quality</th>
                      <th className="p-2 border-r border-ink/10 uppercase text-center">Avg Bloom</th>
                    </tr>
                  </thead>
                  <tbody>
                    {telemetrySessions.map((t, idx) => (
                      <tr key={idx} className="border-b border-ink/5 hover:bg-ink/5">
                        <td className="p-2 border-r border-ink/10 text-brand font-bold">{t.session_id}</td>
                        <td className="p-2 border-r border-ink/10">{t.student_id}</td>
                        <td className="p-2 border-r border-ink/10 truncate max-w-[150px]">{t.domain}</td>
                        <td className="p-2 border-r border-ink/10 text-center">{t.turns}</td>
                        <td className="p-2 border-r border-ink/10 text-center font-bold text-brand">{t.avg_hint_quality.toFixed(1)}</td>
                        <td className="p-2 border-r border-ink/10 text-center text-alert font-bold">{t.avg_bloom.toFixed(1)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 3. AUDIT LOGS OVERLAY VIEW */}
        {activeView === 'logs' && (
          <div className="h-full bg-ink text-[#f6f5f0] p-6 flex flex-col font-mono text-xs overflow-hidden leading-relaxed">
            <div className="border-b border-canvas/20 pb-3 mb-4 flex justify-between items-center">
              <div>
                <h2 className="text-lg font-bold uppercase tracking-widest text-[#f6f5f0] flex items-center gap-2">
                  <Terminal size={18} className="text-[#e88b56] animate-pulse" /> Socratic Protocol Telemetry Log
                </h2>
                <p className="text-[10px] text-canvas/50 mt-0.5">Tailing audit records for evaluating Agent A drafts through Agent B pedagogical scores.</p>
              </div>
              <span className="text-[10px] bg-alert text-ink px-2 py-0.5 font-bold uppercase">Streaming live</span>
            </div>
            
            {/* TERMINAL CONTENT */}
            <div className="flex-1 overflow-y-auto bg-black/60 p-4 border border-canvas/10 flex flex-col gap-2 rounded">
              <p className="text-canvas/40">&gt;&gt; ESTABLISHING NEON PERSISTENT AUDIT STREAM CLIENT...</p>
              <p className="text-[#e88b56]">&gt;&gt; PARSING event_type = 'agent_b_done' || 'agent_b_recheck'</p>
              <p className="text-[#f6f5f0] opacity-30">---------------------------------------------------------</p>
              
              {telemetryLogs.map((log) => (
                <div key={log.id} className="flex flex-col gap-1 hover:bg-canvas/5 p-1 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="text-canvas/30">[{log.time}]</span>
                    <span className={`px-1 text-[9px] uppercase font-bold ${log.status === 'approved' ? 'bg-brand text-canvas' : 'bg-alert text-ink'}`}>
                      {log.event}
                    </span>
                    <span className="text-canvas/40">//</span>
                    <span className={log.status === 'approved' ? 'text-canvas' : 'text-[#e88b56]'}>{log.text}</span>
                  </div>
                </div>
              ))}
              <div className="mt-4 animate-pulse text-[#e88b56] font-bold">&gt;&gt; Awaiting next student message event stream... <span className="w-1.5 h-3 bg-[#e88b56] inline-block align-middle ml-1"></span></div>
            </div>
          </div>
        )}

        {/* 4. SYSTEM SETTINGS OVERLAY VIEW */}
        {activeView === 'settings' && (
          <div className="h-full overflow-y-auto p-6 md:p-10 bg-canvas flex flex-col gap-6 max-w-xl mx-auto select-none">
            <h2 className="text-2xl font-bold uppercase tracking-wider text-brand border-b border-ink pb-3">System Settings</h2>
            
            <div className="panel-container flex flex-col gap-6 shadow-[4px_4px_0px_#111111]">
              
              {/* SYSTEM PREFERRED STYLE */}
              <div className="flex flex-col gap-2">
                <h4 className="font-mono text-xs font-bold uppercase text-brand">Preferred Pedagogical Register</h4>
                <p className="text-[10px] text-ink/60 leading-normal uppercase">Set initial conversational register Agent A will adopt during tutoring loops.</p>
                <select 
                  value={preferredRegister}
                  onChange={(e) => setPreferredRegister(e.target.value)}
                  className="border border-ink p-3 bg-canvas font-mono text-sm focus:outline-none w-full appearance-none"
                >
                  <option value="socratic">Socratic Questioning (Indirect guide)</option>
                  <option value="analogy">Analogy Scaffolding (Metaphors)</option>
                  <option value="cognitive_conflict">Cognitive Conflict (Expose misconceptions)</option>
                </select>
              </div>

              {/* TIMEOUT TTL */}
              <div className="flex flex-col gap-2">
                <h4 className="font-mono text-xs font-bold uppercase text-brand">Active Session Cache TTL</h4>
                <p className="text-[10px] text-ink/60 leading-normal uppercase">Upstash Redis session memory expiry timeout in minutes.</p>
                <div className="flex items-center gap-3">
                  <input 
                    type="range"
                    min={5}
                    max={120}
                    value={sessionTtl}
                    onChange={(e) => setSessionTtl(Number(e.target.value))}
                    className="flex-1 accent-brand"
                  />
                  <span className="font-mono font-bold text-xs border border-ink px-3 py-1 bg-brand text-canvas min-w-[70px] text-center">
                    {sessionTtl} Min
                  </span>
                </div>
              </div>

              {/* SECURITY PROFILE POLICY */}
              <div className="flex flex-col gap-2 border-t border-ink/10 pt-4">
                <h4 className="font-mono text-xs font-bold uppercase text-brand">Access Security Policies</h4>
                <p className="text-[10px] text-ink/60 leading-normal uppercase">Enforce SQL injection prevention and input sanitization parameters.</p>
                <div className="flex flex-col gap-2 mt-1">
                  <div className="flex justify-between items-center font-mono text-[10px]">
                    <span>Input Sanitizer Middleware</span>
                    <span className="text-brand font-bold uppercase bg-brand/10 px-2 py-0.5 border border-brand/20">Enforced</span>
                  </div>
                  <div className="flex justify-between items-center font-mono text-[10px]">
                    <span>Distributed Redis Rate Limiter</span>
                    <span className="text-brand font-bold uppercase bg-brand/10 px-2 py-0.5 border border-brand/20">Active</span>
                  </div>
                  <div className="flex justify-between items-center font-mono text-[10px]">
                    <span>JWT Verification Token Decryption</span>
                    <span className="text-brand font-bold uppercase bg-brand/10 px-2 py-0.5 border border-brand/20">Enforced</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* DOCUMENT MOUNTING MODAL */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand/35 backdrop-blur-sm p-4">
          <div className="panel-container w-full max-w-lg bg-canvas border-ink shadow-[6px_6px_0px_#111111]">
            <h3 className="text-lg font-bold text-brand uppercase tracking-wider border-b-1 border-ink pb-3 mb-4">
              Mount Context Document
            </h3>

            {/* TAB SELECTOR */}
            <div className="flex border-b border-ink/20 font-mono text-[9px] font-bold uppercase tracking-wider mb-4">
              <button 
                onClick={() => setUploadType('pdf')}
                className={`pb-2 px-3 border-b-2 font-black ${uploadType === 'pdf' ? 'border-brand text-brand' : 'border-transparent text-ink/50'}`}
              >
                Upload File (PDF/TXT)
              </button>
              <button 
                onClick={() => setUploadType('url')}
                className={`pb-2 px-3 border-b-2 font-black ${uploadType === 'url' ? 'border-brand text-brand' : 'border-transparent text-ink/50'}`}
              >
                Crawl URL
              </button>
              <button 
                onClick={() => setUploadType('youtube')}
                className={`pb-2 px-3 border-b-2 font-black ${uploadType === 'youtube' ? 'border-brand text-brand' : 'border-transparent text-ink/50'}`}
              >
                YouTube Transcript
              </button>
              <button 
                onClick={() => setUploadType('paste')}
                className={`pb-2 px-3 border-b-2 font-black ${uploadType === 'paste' ? 'border-brand text-brand' : 'border-transparent text-ink/50'}`}
              >
                Paste Text
              </button>
            </div>

            {/* FORMS */}
            <form onSubmit={handleIngestSource} className="flex flex-col gap-4">
              
              {/* 1. PDF / TXT FILE UPLOAD */}
              {uploadType === 'pdf' && (
                <div className="flex flex-col gap-1.5">
                  <span className="font-mono text-[10px] uppercase text-ink/60">Choose Document</span>
                  <input 
                    type="file" 
                    accept=".pdf,.txt"
                    onChange={(e) => setFileInput(e.target.files ? e.target.files[0] : null)}
                    className="border border-ink p-3 font-mono text-xs w-full bg-canvas cursor-pointer"
                    required
                  />
                  <p className="text-[9px] font-mono uppercase text-ink/50 mt-1">Parses text nodes from PDF directly on server.</p>
                </div>
              )}

              {/* 2. WEB CRAWLER */}
              {uploadType === 'url' && (
                <div className="flex flex-col gap-1.5">
                  <span className="font-mono text-[10px] uppercase text-ink/60">Crawl Web URL</span>
                  <input 
                    type="url" 
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    placeholder="https://en.wikipedia.org/wiki/Socratic_method"
                    className="border border-ink p-3 font-mono text-xs w-full bg-canvas focus:outline-none"
                    required
                  />
                  <p className="text-[9px] font-mono uppercase text-ink/50 mt-1">Downloads HTML, strips styling/nav layouts, extracts clean body text.</p>
                </div>
              )}

              {/* 3. YOUTUBE TRANSCRIPT */}
              {uploadType === 'youtube' && (
                <div className="flex flex-col gap-1.5">
                  <span className="font-mono text-[10px] uppercase text-ink/60">YouTube Video URL</span>
                  <input 
                    type="url" 
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="border border-ink p-3 font-mono text-xs w-full bg-canvas focus:outline-none"
                    required
                  />
                  <p className="text-[9px] font-mono uppercase text-ink/50 mt-1">Queries Youtube API transcripts asynchronously.</p>
                </div>
              )}

              {/* 4. PASTE RAW TEXT */}
              {uploadType === 'paste' && (
                <div className="flex flex-col gap-3">
                  <div className="flex flex-col gap-1">
                    <span className="font-mono text-[10px] uppercase text-ink/60">Document Title</span>
                    <input 
                      type="text" 
                      value={pasteTitle}
                      onChange={(e) => setPasteTitle(e.target.value)}
                      placeholder="Protocol Log"
                      className="border border-ink p-2 font-mono text-xs w-full bg-canvas focus:outline-none"
                      required
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="font-mono text-[10px] uppercase text-ink/60">Text Content</span>
                    <textarea 
                      value={pasteContent}
                      onChange={(e) => setPasteContent(e.target.value)}
                      rows={5}
                      placeholder="Paste guidelines here..."
                      className="border border-ink p-2 font-mono text-xs w-full bg-canvas resize-none focus:outline-none"
                      required
                    />
                  </div>
                </div>
              )}

              {/* ACTION BUTTONS */}
              <div className="flex gap-3 mt-4">
                <button 
                  type="button" 
                  onClick={() => setIsUploadModalOpen(false)}
                  className="btn-primary flex-1 bg-transparent text-ink hover:bg-ink/5"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isUploading}
                  className="btn-alert flex-1 uppercase tracking-widest text-xs font-bold"
                >
                  {isUploading ? "Ingesting..." : "Ingest Context"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* STATUS BAR */}
      <footer className="h-8 border-t-1 border-ink bg-brand text-canvas flex items-center px-4 justify-between font-mono text-[10px] uppercase font-bold flex-shrink-0 z-10">
        <div className="flex gap-4">
          <span>Sys: Online</span>
          <span className="text-alert">Security Level: Strict</span>
          {sessionId && <span className="opacity-70 border-l border-canvas/30 pl-4">Session Active</span>}
        </div>
        <div>
          Protocol: Socratic Loop & Auditor
        </div>
      </footer>
    </div>
  );
}
