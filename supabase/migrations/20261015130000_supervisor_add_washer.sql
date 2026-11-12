BEGIN;
CREATE OR REPLACE FUNCTION public.supervisor_add_washer(p_actor_id uuid,p_user_id uuid,p_radius numeric)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE actor public.profiles%rowtype; target public.profiles%rowtype; w public.washers%rowtype;
BEGIN
 SELECT * INTO actor FROM public.profiles WHERE id=p_actor_id;
 IF NOT FOUND OR NOT actor.is_active OR actor.role::text NOT IN ('supervisor','sub_admin','super_admin') THEN RAISE EXCEPTION 'Supervisor permission required.'; END IF;
 IF p_actor_id=p_user_id OR p_radius IS NULL OR p_radius<=0 OR p_radius>100 THEN RAISE EXCEPTION 'Invalid washer details.'; END IF;
 SELECT * INTO target FROM public.profiles WHERE id=p_user_id FOR UPDATE;
 IF NOT FOUND OR NOT target.is_active THEN RAISE EXCEPTION 'Active registered account not found.'; END IF;
 IF target.role::text NOT IN ('customer','washer') THEN RAISE EXCEPTION 'This account has another staff role.'; END IF;
 IF target.role::text='customer' AND NOT EXISTS(SELECT 1 FROM auth.users WHERE id=p_user_id AND raw_user_meta_data->>'requested_role'='washer') THEN RAISE EXCEPTION 'The person must register using Washer sign up first.'; END IF;
 SELECT * INTO w FROM public.washers WHERE user_id=p_user_id FOR UPDATE;
 IF FOUND THEN
   IF w.supervisor_id IS DISTINCT FROM p_actor_id THEN RAISE EXCEPTION 'Washer already belongs to another supervisor. Contact an administrator.'; END IF;
   RETURN to_jsonb(w);
 END IF;
 INSERT INTO public.washers(user_id,supervisor_id,service_radius_km,status,is_active,is_verified)
 VALUES(p_user_id,p_actor_id,p_radius,'offline',true,false) RETURNING * INTO w;
 UPDATE public.profiles SET role='washer' WHERE id=p_user_id;
 RETURN to_jsonb(w);
END $$;
REVOKE ALL ON FUNCTION public.supervisor_add_washer(uuid,uuid,numeric) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.supervisor_add_washer(uuid,uuid,numeric) TO service_role;
COMMIT;


