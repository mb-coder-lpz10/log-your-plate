
CREATE TABLE public.water_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  logged_on date NOT NULL DEFAULT ((now() AT TIME ZONE 'utc')::date),
  amount_ml integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.water_logs TO authenticated;
GRANT ALL ON public.water_logs TO service_role;
ALTER TABLE public.water_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own water" ON public.water_logs FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX water_logs_user_day_idx ON public.water_logs(user_id, logged_on);

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS water_ml_target integer NOT NULL DEFAULT 2500;
