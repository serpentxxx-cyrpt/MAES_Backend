-- Supabase PostgreSQL Schema Script
-- Paste this directly into the Supabase SQL Editor and click RUN

-- 1. Create notebooks table (if not exists)
CREATE TABLE IF NOT EXISTS public.notebooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  domain TEXT DEFAULT 'General',
  student_id UUID, -- References auth.users(id) if needed
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Create sources table
CREATE TABLE IF NOT EXISTS public.sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notebook_id UUID REFERENCES public.notebooks(id) ON DELETE CASCADE,
  source_type TEXT NOT NULL, -- pdf | url | youtube | paste
  title TEXT NOT NULL,
  raw_content TEXT NOT NULL,
  structured_content JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Create notes table
CREATE TABLE IF NOT EXISTS public.notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notebook_id UUID REFERENCES public.notebooks(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Create sessions table
CREATE TABLE IF NOT EXISTS public.sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notebook_id UUID REFERENCES public.notebooks(id) ON DELETE CASCADE,
  student_id TEXT NOT NULL,
  domain TEXT DEFAULT 'General',
  is_active BOOLEAN DEFAULT true,
  started_at TIMESTAMPTZ DEFAULT now(),
  ended_at TIMESTAMPTZ
);

-- 5. Create messages table
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES public.sessions(id) ON DELETE CASCADE,
  role TEXT NOT NULL, -- student | tutor
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Row-Level Security Configuration (Optional for dev, but highly secure)
ALTER TABLE public.notebooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Dynamic Policy: Allow all authenticated reads/writes for prototype
DROP POLICY IF EXISTS "Allow public read for auth users" ON public.notebooks;
CREATE POLICY "Allow public read for auth users" ON public.notebooks FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Allow public write for auth users" ON public.notebooks;
CREATE POLICY "Allow public write for auth users" ON public.notebooks FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Allow public update for auth users" ON public.notebooks;
CREATE POLICY "Allow public update for auth users" ON public.notebooks FOR UPDATE TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow public read sources" ON public.sources;
CREATE POLICY "Allow public read sources" ON public.sources FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Allow public write sources" ON public.sources;
CREATE POLICY "Allow public write sources" ON public.sources FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Allow public update sources" ON public.sources;
CREATE POLICY "Allow public update sources" ON public.sources FOR UPDATE TO authenticated USING (true);
DROP POLICY IF EXISTS "Allow public delete sources" ON public.sources;
CREATE POLICY "Allow public delete sources" ON public.sources FOR DELETE TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow public read notes" ON public.notes;
CREATE POLICY "Allow public read notes" ON public.notes FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Allow public write notes" ON public.notes;
CREATE POLICY "Allow public write notes" ON public.notes FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Allow public update notes" ON public.notes;
CREATE POLICY "Allow public update notes" ON public.notes FOR UPDATE TO authenticated USING (true);
DROP POLICY IF EXISTS "Allow public delete notes" ON public.notes;
CREATE POLICY "Allow public delete notes" ON public.notes FOR DELETE TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow public read sessions" ON public.sessions;
CREATE POLICY "Allow public read sessions" ON public.sessions FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Allow public write sessions" ON public.sessions;
CREATE POLICY "Allow public write sessions" ON public.sessions FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Allow public update sessions" ON public.sessions;
CREATE POLICY "Allow public update sessions" ON public.sessions FOR UPDATE TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow public read messages" ON public.messages;
CREATE POLICY "Allow public read messages" ON public.messages FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Allow public write messages" ON public.messages;
CREATE POLICY "Allow public write messages" ON public.messages FOR INSERT TO authenticated WITH CHECK (true);

-- 6. Create learner_models table
CREATE TABLE IF NOT EXISTS public.learner_models (
  student_id TEXT PRIMARY KEY,
  preferred_style TEXT DEFAULT 'socratic',
  mastery_levels JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.learner_models ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read learner_models" ON public.learner_models;
CREATE POLICY "Allow public read learner_models" ON public.learner_models FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Allow public write learner_models" ON public.learner_models;
CREATE POLICY "Allow public write learner_models" ON public.learner_models FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Allow public update learner_models" ON public.learner_models;
CREATE POLICY "Allow public update learner_models" ON public.learner_models FOR UPDATE TO authenticated USING (true);

-- 7. Create audit_logs table
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES public.sessions(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  text TEXT NOT NULL,
  status TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read audit_logs" ON public.audit_logs;
CREATE POLICY "Allow public read audit_logs" ON public.audit_logs FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Allow public write audit_logs" ON public.audit_logs;
CREATE POLICY "Allow public write audit_logs" ON public.audit_logs FOR INSERT TO authenticated WITH CHECK (true);
