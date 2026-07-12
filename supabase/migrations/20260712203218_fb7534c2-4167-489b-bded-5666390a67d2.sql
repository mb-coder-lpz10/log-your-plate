
CREATE TYPE public.activity_source AS ENUM ('manual','google_fit','samsung_health','apple_health','csv');

CREATE TABLE public.activity_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  logged_on DATE NOT NULL DEFAULT ((now() AT TIME ZONE 'utc')::date),
  steps INTEGER NOT NULL DEFAULT 0,
  active_kcal NUMERIC NOT NULL DEFAULT 0,
  exercise_min INTEGER NOT NULL DEFAULT 0,
  distance_m INTEGER NOT NULL DEFAULT 0,
  source public.activity_source NOT NULL DEFAULT 'manual',
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, logged_on)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.activity_logs TO authenticated;
GRANT ALL ON public.activity_logs TO service_role;

ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own activity" ON public.activity_logs
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER activity_logs_set_updated_at
  BEFORE UPDATE ON public.activity_logs
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Add step target to profile
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS steps_target INTEGER NOT NULL DEFAULT 8000;
