-- Phase 2 Migrations for Neon (Audit & Telemetry)
-- Run this in your Neon SQL Editor

-- 1. Create a GIN index on the metadata JSONB column
-- This drastically speeds up the Telemetry Dashboard when querying specific rubric scores or decisions
CREATE INDEX IF NOT EXISTS idx_audit_logs_metadata 
ON public.audit_logs USING GIN (metadata);

-- 2. Add an index specifically for the student_id 
-- To speed up the "Recent Session Evaluations" bar chart grouping
CREATE INDEX IF NOT EXISTS idx_audit_logs_student 
ON public.audit_logs(student_id);
