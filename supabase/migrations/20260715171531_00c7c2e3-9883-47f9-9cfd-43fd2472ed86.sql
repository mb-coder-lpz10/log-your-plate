CREATE TABLE public.food_favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  food_name text not null,
  serving_label text,
  calories numeric not null default 0,
  protein_g numeric not null default 0,
  carbs_g numeric not null default 0,
  fat_g numeric not null default 0,
  sugar_g numeric not null default 0,
  fiber_g numeric not null default 0,
  sodium_mg numeric not null default 0,
  fdc_id text,
  created_at timestamp with time zone not null default now(),
  unique (user_id, food_name, serving_label)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.food_favorites TO authenticated;
GRANT ALL ON public.food_favorites TO service_role;
ALTER TABLE public.food_favorites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own favorites" ON public.food_favorites FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX food_favorites_user_idx ON public.food_favorites(user_id, created_at DESC);
CREATE INDEX food_logs_user_recent_idx ON public.food_logs(user_id, created_at DESC);