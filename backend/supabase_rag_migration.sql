-- Phase 3 RAG Migration for Supabase
-- Run this in the Supabase SQL Editor

-- Step 1: Enable pgvector extension
-- (You may also need to enable it from Supabase Dashboard → Database → Extensions)
CREATE EXTENSION IF NOT EXISTS vector;

-- Step 2: Create document_embeddings table
CREATE TABLE IF NOT EXISTS public.document_embeddings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_id UUID REFERENCES public.sources(id) ON DELETE CASCADE,
    notebook_id UUID REFERENCES public.notebooks(id) ON DELETE CASCADE,
    chunk_index INTEGER NOT NULL,
    content TEXT NOT NULL,
    embedding vector(768) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Step 3: HNSW index for fast approximate nearest-neighbor cosine search
CREATE INDEX IF NOT EXISTS document_embeddings_embedding_idx
    ON public.document_embeddings
    USING hnsw (embedding vector_cosine_ops);

-- Step 4: Row Level Security
ALTER TABLE public.document_embeddings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow authenticated read embeddings" ON public.document_embeddings;
CREATE POLICY "Allow authenticated read embeddings" ON public.document_embeddings
    FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Allow authenticated write embeddings" ON public.document_embeddings;
CREATE POLICY "Allow authenticated write embeddings" ON public.document_embeddings
    FOR INSERT TO authenticated WITH CHECK (true);

-- Step 5: Stored procedure for vector similarity search
CREATE OR REPLACE FUNCTION match_documents(
    query_embedding vector(768),
    match_notebook_id UUID,
    match_count INT DEFAULT 5
)
RETURNS TABLE (content TEXT, similarity FLOAT)
LANGUAGE sql STABLE AS $$
    SELECT content, 1 - (embedding <=> query_embedding) AS similarity
    FROM public.document_embeddings
    WHERE notebook_id = match_notebook_id
    ORDER BY embedding <=> query_embedding
    LIMIT match_count;
$$;
