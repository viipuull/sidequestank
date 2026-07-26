CREATE OR REPLACE FUNCTION public.current_period_start(_freq challenge_reset)
RETURNS timestamp with time zone
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT CASE _freq
    WHEN 'daily' THEN date_trunc('day', now())
    WHEN 'weekly' THEN date_trunc('week', now())
    WHEN 'monthly' THEN date_trunc('month', now())
    ELSE 'epoch'::timestamptz
  END
$$;