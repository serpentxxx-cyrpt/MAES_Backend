-- Neon PostgreSQL Audit Schema Script
-- Paste this directly into your Neon SQL Editor and click RUN

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id BIGSERIAL PRIMARY KEY,
  session_id TEXT NOT NULL,
  student_id TEXT NOT NULL,
  event_type TEXT NOT NULL, -- agent_b_done | agent_b_recheck | error
  metadata JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index metadata fields for rapid teacher dashboard queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_session ON public.audit_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_event ON public.audit_logs(event_type);
