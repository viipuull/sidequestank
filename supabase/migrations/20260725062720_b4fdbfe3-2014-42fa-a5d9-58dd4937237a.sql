CREATE OR REPLACE FUNCTION public.enforce_reserved_username()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  normalized text;
  caller_email text;
BEGIN
  normalized := lower(regexp_replace(coalesce(NEW.username, ''), '[\s_.\-]', '', 'g'));
  SELECT email INTO caller_email FROM auth.users WHERE id = NEW.id;

  IF normalized LIKE '%sidequest%' THEN
    IF caller_email IS DISTINCT FROM 'ankleshwarweb@gmail.com' THEN
      RAISE EXCEPTION 'This username is already taken.' USING ERRCODE = 'check_violation';
    END IF;
  END IF;

  IF normalized = 'cybershikari' THEN
    IF caller_email IS DISTINCT FROM 'vipulgarg874@gmail.com' THEN
      RAISE EXCEPTION 'This username is already taken.' USING ERRCODE = 'check_violation';
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS enforce_reserved_username_trg ON public.profiles;
CREATE TRIGGER enforce_reserved_username_trg
  BEFORE INSERT OR UPDATE OF username ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.enforce_reserved_username();