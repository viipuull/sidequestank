
CREATE OR REPLACE FUNCTION public.enforce_reserved_username()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  normalized text;
  caller_email text;
BEGIN
  normalized := lower(regexp_replace(coalesce(NEW.username, ''), '[\s_.\-]', '', 'g'));
  IF normalized LIKE '%sidequest%' THEN
    SELECT email INTO caller_email FROM auth.users WHERE id = NEW.id;
    IF caller_email IS DISTINCT FROM 'ankleshwarweb@gmail.com' THEN
      RAISE EXCEPTION 'This username is reserved.' USING ERRCODE = 'check_violation';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tg_profiles_reserved_username ON public.profiles;
CREATE TRIGGER tg_profiles_reserved_username
BEFORE INSERT OR UPDATE OF username ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.enforce_reserved_username();

-- Free the "sidequest" username from the legacy development account.
DELETE FROM public.profiles
WHERE lower(regexp_replace(coalesce(username, ''), '[\s_.\-]', '', 'g')) LIKE '%sidequest%'
  AND id IN (SELECT id FROM auth.users WHERE email = 'vipulgarg874@gmail.com');

-- Remove the legacy development auth user entirely so it can no longer sign in.
DELETE FROM auth.users WHERE email = 'vipulgarg874@gmail.com';
