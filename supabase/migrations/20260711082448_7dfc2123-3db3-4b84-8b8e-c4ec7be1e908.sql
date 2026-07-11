
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS training_days_per_week integer,
  ADD COLUMN IF NOT EXISTS sleep_target_hours numeric DEFAULT 8,
  ADD COLUMN IF NOT EXISTS sugar_target_g integer DEFAULT 50,
  ADD COLUMN IF NOT EXISTS fiber_target_g integer DEFAULT 30,
  ADD COLUMN IF NOT EXISTS dietary_prefs text[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS goal_note text;

ALTER TABLE public.food_logs
  ADD COLUMN IF NOT EXISTS sugar_g numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS fiber_g numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS sodium_mg numeric NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS public.sleep_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  logged_on date NOT NULL DEFAULT ((now() AT TIME ZONE 'utc')::date),
  hours numeric NOT NULL,
  quality smallint,
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, logged_on)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.sleep_logs TO authenticated;
GRANT ALL ON public.sleep_logs TO service_role;

ALTER TABLE public.sleep_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own sleep" ON public.sleep_logs
  FOR ALL TO public
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
