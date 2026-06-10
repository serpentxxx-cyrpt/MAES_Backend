-- Phase 2 Migrations for Supabase

-- 1. Update sessions table
-- Change student_id to UUID as requested by blueprint exact alignment
ALTER TABLE public.sessions ALTER COLUMN student_id TYPE UUID USING student_id::uuid;
ALTER TABLE public.sessions 
ADD COLUMN IF NOT EXISTS title TEXT,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

-- 2. Update learner_models table
ALTER TABLE public.learner_models
ADD COLUMN IF NOT EXISTS dominant_bloom TEXT,
ADD COLUMN IF NOT EXISTS preferred_register TEXT,
ADD COLUMN IF NOT EXISTS overall_level TEXT;

-- 3. Prepare for RAG (Document Chunks)
CREATE TABLE IF NOT EXISTS public.document_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_id UUID REFERENCES public.sources(id) ON DELETE CASCADE,
    chunk_index INTEGER NOT NULL,
    content TEXT NOT NULL,
    -- Note: 'embedding vector(768)' will be added in Phase 3 when pgvector is enabled.
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.document_chunks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read chunks" ON public.document_chunks;
CREATE POLICY "Allow public read chunks" ON public.document_chunks FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Allow public write chunks" ON public.document_chunks;
CREATE POLICY "Allow public write chunks" ON public.document_chunks FOR INSERT TO authenticated WITH CHECK (true);
