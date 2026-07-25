
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS pioneer_number INTEGER UNIQUE;

-- Fix existing data first
UPDATE public.profiles p
SET is_pioneer = false, pioneer_number = NULL
FROM auth.users u
WHERE u.id = p.id AND lower(u.email) = 'ankleshwarweb@gmail.com';

UPDATE public.profiles p
SET is_pioneer = true, pioneer_number = 1
FROM auth.users u
WHERE u.id = p.id AND lower(u.email) = 'vipulgarg874@gmail.com';

-- Auto-assign pioneer on insert (skip founder, first 25 non-founder profiles)
CREATE OR REPLACE FUNCTION public.tg_profiles_assign_pioneer()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  caller_email text;
  next_num int;
  current_count int;
BEGIN
  SELECT lower(email) INTO caller_email FROM auth.users WHERE id = NEW.id;

  -- Founder is never a pioneer
  IF caller_email = 'ankleshwarweb@gmail.com' THEN
    NEW.is_pioneer := false;
    NEW.pioneer_number := NULL;
    RETURN NEW;
  END IF;

  -- If pioneer already assigned (e.g. via reserved seed), keep it
  IF NEW.pioneer_number IS NOT NULL THEN
    NEW.is_pioneer := true;
    RETURN NEW;
  END IF;

  SELECT COUNT(*)::int INTO current_count FROM public.profiles WHERE is_pioneer = true;
  IF current_count < 25 THEN
    SELECT COALESCE(MAX(pioneer_number), 0) + 1 INTO next_num FROM public.profiles;
    NEW.is_pioneer := true;
    NEW.pioneer_number := next_num;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS assign_pioneer_trg ON public.profiles;
CREATE TRIGGER assign_pioneer_trg
  BEFORE INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.tg_profiles_assign_pioneer();

-- Update slot counter to reflect the 25-slot target
CREATE OR REPLACE FUNCTION public.pioneer_slots_remaining()
RETURNS INTEGER LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT GREATEST(0, 25 - (SELECT COUNT(*)::int FROM public.profiles WHERE is_pioneer = true));
$$;
