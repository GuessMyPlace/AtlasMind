CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
 
-- ── GENERATION JOBS ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS atlasmind_jobs (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name            TEXT NOT NULL,
    place_type      TEXT,
    status          TEXT DEFAULT 'pending'
                    CHECK (status IN (
                      'pending','running','paused',
                      'completed','failed','quota_exceeded'
                    )),
    total           INT DEFAULT 0,
    processed       INT DEFAULT 0,
    succeeded       INT DEFAULT 0,
    failed          INT DEFAULT 0,
    names_input     JSONB DEFAULT '[]',
    results         JSONB DEFAULT '[]',
    scheduled_for   TIMESTAMPTZ,
    started_at      TIMESTAMPTZ,
    completed_at    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    created_by      TEXT DEFAULT 'manual',
    error           TEXT
);
 
CREATE INDEX IF NOT EXISTS idx_jobs_status  ON atlasmind_jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_created ON atlasmind_jobs(created_at DESC);
 
-- ── QUOTA TRACKING ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS gemini_quota_log (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date            DATE NOT NULL,
    model           TEXT DEFAULT 'gemini-2.5-pro',
    requests_made   INT DEFAULT 0,
    requests_limit  INT DEFAULT 50,
    tokens_used     INT DEFAULT 0,
    quota_exceeded  BOOLEAN DEFAULT false,
    reset_at        TIMESTAMPTZ,
    updated_at      TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(date, model)
);
 
-- ── GENERATION ROADMAP ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS atlasmind_roadmap (
    id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phase            TEXT NOT NULL,
    title            TEXT NOT NULL,
    description      TEXT,
    place_type       TEXT,
    names            JSONB DEFAULT '[]',
    status           TEXT DEFAULT 'pending'
                     CHECK (status IN ('pending','in_progress','completed')),
    priority         INT DEFAULT 5,
    total_places     INT DEFAULT 0,
    completed_places INT DEFAULT 0,
    job_id           UUID REFERENCES atlasmind_jobs(id) ON DELETE SET NULL,
    created_at       TIMESTAMPTZ DEFAULT NOW()
);
 
CREATE INDEX IF NOT EXISTS idx_roadmap_status   ON atlasmind_roadmap(status);
CREATE INDEX IF NOT EXISTS idx_roadmap_priority ON atlasmind_roadmap(priority);
 
-- ── UNKNOWN PLACES QUEUE (from game wrong guesses) ───────────
CREATE TABLE IF NOT EXISTS unknown_places_queue (
    id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name       TEXT NOT NULL UNIQUE,
    reported   INT DEFAULT 1,
    status     TEXT DEFAULT 'pending'
               CHECK (status IN ('pending','generated','rejected')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
 
-- Increment reported count function
CREATE OR REPLACE FUNCTION increment_reported(place_name TEXT)
RETURNS void AS $$
BEGIN
  UPDATE unknown_places_queue
  SET reported = reported + 1
  WHERE name = place_name;
END;
$$ LANGUAGE plpgsql;
 
-- ── RLS ──────────────────────────────────────────────────────
ALTER TABLE atlasmind_jobs         ENABLE ROW LEVEL SECURITY;
ALTER TABLE gemini_quota_log       ENABLE ROW LEVEL SECURITY;
ALTER TABLE atlasmind_roadmap      ENABLE ROW LEVEL SECURITY;
ALTER TABLE unknown_places_queue   ENABLE ROW LEVEL SECURITY;
 
CREATE POLICY "jobs_all"    ON atlasmind_jobs         FOR ALL USING (true);
CREATE POLICY "quota_all"   ON gemini_quota_log        FOR ALL USING (true);
CREATE POLICY "roadmap_all" ON atlasmind_roadmap       FOR ALL USING (true);
CREATE POLICY "queue_all"   ON unknown_places_queue    FOR ALL USING (true);
