CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, NULLIF(NEW.raw_user_meta_data->>'full_name', ''))
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END; $function$;

UPDATE public.profiles
SET display_name = NULL
WHERE display_name IS NOT NULL
  AND display_name ~ '^[^@]+@[^@]+\.[^@]+$';