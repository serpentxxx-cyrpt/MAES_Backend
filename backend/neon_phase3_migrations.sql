-- Phase 3 Telemetry Migrations for Neon DB
-- Run this in the Neon SQL Editor

-- GCD Profiles: tracks student misconceptions
CREATE TABLE IF NOT EXISTS gcd_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id TEXT NOT NULL,
    session_id TEXT,
    concept TEXT NOT NULL,
    misconception_text TEXT,
    detected_at TIMESTAMPTZ DEFAULT now(),
    resolved_at TIMESTAMPTZ
);

-- Pedagogy Metrics: per-turn CLS scores and bloom stall tracking
CREATE TABLE IF NOT EXISTS pedagogy_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id TEXT NOT NULL,
    student_id TEXT NOT NULL,
    turn_number INT,
    cls_score FLOAT,
    bloom_stall_count INT,
    active_misconception TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- DVS Events: records each visual scaffold generation
CREATE TABLE IF NOT EXISTS dvs_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id TEXT NOT NULL,
    trigger_reason TEXT,
    svg_payload TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for fast student/session lookups
CREATE INDEX IF NOT EXISTS gcd_profiles_student_idx ON gcd_profiles (student_id);
CREATE INDEX IF NOT EXISTS pedagogy_metrics_session_idx ON pedagogy_metrics (session_id);
CREATE INDEX IF NOT EXISTS dvs_events_session_idx ON dvs_events (session_id);
