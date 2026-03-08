-- =============================================================================
-- EventOS · Migration: Judging System
-- File: supabase/migrations/20260308_judging.sql
-- =============================================================================
-- WHAT THIS DOES:
--   1. Creates event_judges table (per-event judge assignments)
--   2. Creates event_criteria table (evaluation criteria per event)
--   3. Creates scores table (judge scores per team per criterion)
--   4. Creates leaderboard view (aggregated team rankings)
--   5. Adds RLS policies and grants
--
-- SAFE TO RE-RUN: Uses IF NOT EXISTS / DROP IF EXISTS patterns.
-- =============================================================================


-- =============================================================================
-- 1. TABLES
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1.1  event_judges — Per-event judge assignments
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.event_judges (
  id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id    UUID         NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id     UUID         NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  assigned_by UUID         NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_one_judge_per_user_per_event UNIQUE (event_id, user_id)
);

COMMENT ON TABLE public.event_judges IS 'Per-event judge assignments. Any user can be a judge for a specific event.';


-- -----------------------------------------------------------------------------
-- 1.2  event_criteria — Evaluation criteria selected for an event
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.event_criteria (
  id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id      UUID         NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  name          TEXT         NOT NULL,
  max_points    INTEGER      NOT NULL DEFAULT 10 CHECK (max_points > 0),
  display_order INTEGER      NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_criteria_name_per_event UNIQUE (event_id, name)
);

COMMENT ON TABLE public.event_criteria IS 'Evaluation criteria selected by the organizer for a specific event.';
COMMENT ON COLUMN public.event_criteria.max_points IS 'Maximum score a judge can give for this criterion (default 10).';


-- -----------------------------------------------------------------------------
-- 1.3  scores — Judge scores per team OR individual per criterion
-- -----------------------------------------------------------------------------
DROP VIEW IF EXISTS public.leaderboard CASCADE;
DROP TABLE IF EXISTS public.scores CASCADE;

CREATE TABLE IF NOT EXISTS public.scores (
  id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id        UUID         NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  judge_id        UUID         NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  team_id         UUID         REFERENCES public.teams(id) ON DELETE CASCADE,
  participant_id  UUID         REFERENCES public.profiles(id) ON DELETE CASCADE,
  criteria_id     UUID         NOT NULL REFERENCES public.event_criteria(id) ON DELETE CASCADE,
  points          INTEGER      NOT NULL CHECK (points >= 0),
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

  -- Either team_id or participant_id must be set (not both)
  CONSTRAINT chk_score_target CHECK (
    (team_id IS NOT NULL AND participant_id IS NULL) OR
    (team_id IS NULL AND participant_id IS NOT NULL)
  ),
  -- One score per judge per team per criterion (team events)
  CONSTRAINT uq_score_per_judge_team_criteria UNIQUE (judge_id, team_id, criteria_id),
  -- One score per judge per participant per criterion (individual events)
  CONSTRAINT uq_score_per_judge_participant_criteria UNIQUE (judge_id, participant_id, criteria_id)
);

COMMENT ON TABLE public.scores IS 'Scores given by judges to teams or individual participants for specific criteria.';


-- =============================================================================
-- 2. INDEXES
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_event_judges_event_id  ON public.event_judges(event_id);
CREATE INDEX IF NOT EXISTS idx_event_judges_user_id   ON public.event_judges(user_id);
CREATE INDEX IF NOT EXISTS idx_event_criteria_event_id ON public.event_criteria(event_id);
CREATE INDEX IF NOT EXISTS idx_scores_event_id        ON public.scores(event_id);
CREATE INDEX IF NOT EXISTS idx_scores_judge_id        ON public.scores(judge_id);
CREATE INDEX IF NOT EXISTS idx_scores_team_id         ON public.scores(team_id);
CREATE INDEX IF NOT EXISTS idx_scores_participant_id  ON public.scores(participant_id);
CREATE INDEX IF NOT EXISTS idx_scores_criteria_id     ON public.scores(criteria_id);


-- =============================================================================
-- 3. TRIGGERS (updated_at on scores)
-- =============================================================================
DROP TRIGGER IF EXISTS trg_scores_updated_at ON public.scores;
CREATE TRIGGER trg_scores_updated_at
  BEFORE UPDATE ON public.scores
  FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();


-- =============================================================================
-- 4. VIEW — Leaderboard (aggregated rankings per event — teams + individuals)
-- =============================================================================
CREATE OR REPLACE VIEW public.leaderboard AS
-- Team scores
SELECT
  s.event_id,
  s.team_id,
  NULL::UUID        AS participant_id,
  t.name            AS team_name,
  NULL::TEXT         AS participant_name,
  t.status          AS team_status,
  SUM(s.points)     AS total_points,
  COUNT(DISTINCT s.judge_id) AS judges_scored
FROM      public.scores s
JOIN      public.teams  t ON t.id = s.team_id
WHERE     s.team_id IS NOT NULL
GROUP BY  s.event_id, s.team_id, t.name, t.status

UNION ALL

-- Individual scores
SELECT
  s.event_id,
  NULL::UUID        AS team_id,
  s.participant_id,
  NULL::TEXT         AS team_name,
  p.name            AS participant_name,
  NULL::public.team_status AS team_status,
  SUM(s.points)     AS total_points,
  COUNT(DISTINCT s.judge_id) AS judges_scored
FROM      public.scores s
JOIN      public.profiles p ON p.id = s.participant_id
WHERE     s.participant_id IS NOT NULL
GROUP BY  s.event_id, s.participant_id, p.name
ORDER BY  total_points DESC;


-- =============================================================================
-- 5. ROW LEVEL SECURITY
-- =============================================================================
ALTER TABLE public.event_judges   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_criteria ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scores         ENABLE ROW LEVEL SECURITY;


-- ── event_judges ─────────────────────────────────────────────────────────────
-- Anyone can see who is judging a public event
DROP POLICY IF EXISTS "judges_select_public" ON public.event_judges;
CREATE POLICY "judges_select_public"
  ON public.event_judges FOR SELECT
  USING (event_id IN (SELECT id FROM public.events WHERE status IN ('PUBLISHED', 'ONGOING', 'COMPLETED')));

-- Organizer can assign judges for their events
DROP POLICY IF EXISTS "judges_insert_organizer" ON public.event_judges;
CREATE POLICY "judges_insert_organizer"
  ON public.event_judges FOR INSERT
  WITH CHECK (
    assigned_by = auth.uid()
    AND event_id IN (SELECT id FROM public.events WHERE created_by = auth.uid())
  );

-- Organizer can remove judges from their events
DROP POLICY IF EXISTS "judges_delete_organizer" ON public.event_judges;
CREATE POLICY "judges_delete_organizer"
  ON public.event_judges FOR DELETE
  USING (event_id IN (SELECT id FROM public.events WHERE created_by = auth.uid()));


-- ── event_criteria ───────────────────────────────────────────────────────────
-- Anyone can see criteria for public events
DROP POLICY IF EXISTS "criteria_select_public" ON public.event_criteria;
CREATE POLICY "criteria_select_public"
  ON public.event_criteria FOR SELECT
  USING (event_id IN (SELECT id FROM public.events WHERE status IN ('PUBLISHED', 'ONGOING', 'COMPLETED')));

-- Organizer can manage criteria for their events
DROP POLICY IF EXISTS "criteria_insert_organizer" ON public.event_criteria;
CREATE POLICY "criteria_insert_organizer"
  ON public.event_criteria FOR INSERT
  WITH CHECK (event_id IN (SELECT id FROM public.events WHERE created_by = auth.uid()));

DROP POLICY IF EXISTS "criteria_delete_organizer" ON public.event_criteria;
CREATE POLICY "criteria_delete_organizer"
  ON public.event_criteria FOR DELETE
  USING (event_id IN (SELECT id FROM public.events WHERE created_by = auth.uid()));


-- ── scores ───────────────────────────────────────────────────────────────────
-- Judges can see their own scores
DROP POLICY IF EXISTS "scores_select_own" ON public.scores;
CREATE POLICY "scores_select_own"
  ON public.scores FOR SELECT
  USING (judge_id = auth.uid());

-- Organizer can see all scores for their events
DROP POLICY IF EXISTS "scores_select_organizer" ON public.scores;
CREATE POLICY "scores_select_organizer"
  ON public.scores FOR SELECT
  USING (event_id IN (SELECT id FROM public.events WHERE created_by = auth.uid()));

-- Judges can insert scores (must be assigned as judge)
DROP POLICY IF EXISTS "scores_insert_judge" ON public.scores;
CREATE POLICY "scores_insert_judge"
  ON public.scores FOR INSERT
  WITH CHECK (
    judge_id = auth.uid()
    AND event_id IN (SELECT event_id FROM public.event_judges WHERE user_id = auth.uid())
  );

-- Judges can update their own scores
DROP POLICY IF EXISTS "scores_update_judge" ON public.scores;
CREATE POLICY "scores_update_judge"
  ON public.scores FOR UPDATE
  USING (judge_id = auth.uid());


-- =============================================================================
-- 6. GRANTS
-- =============================================================================
-- Public read access for leaderboard and criteria
GRANT SELECT ON public.event_judges   TO anon, authenticated;
GRANT SELECT ON public.event_criteria TO anon, authenticated;
GRANT SELECT ON public.leaderboard    TO anon, authenticated;

-- Authenticated user operations
GRANT INSERT, DELETE       ON public.event_judges   TO authenticated;
GRANT INSERT, DELETE       ON public.event_criteria  TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.scores       TO authenticated;
