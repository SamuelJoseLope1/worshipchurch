ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS invite_code text UNIQUE DEFAULT upper(substr(md5(random()::text),1,6));
UPDATE public.organizations SET invite_code = upper(substr(md5(random()::text||id::text),1,6)) WHERE invite_code IS NULL;

CREATE TABLE public.org_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  email text NOT NULL,
  role public.org_role NOT NULL DEFAULT 'musician',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (org_id, email)
);
GRANT SELECT, INSERT, DELETE ON public.org_invites TO authenticated;
GRANT ALL ON public.org_invites TO service_role;
ALTER TABLE public.org_invites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owners manage invites" ON public.org_invites FOR ALL TO authenticated
  USING (public.has_org_role(org_id, auth.uid(), ARRAY['owner','admin']::public.org_role[]))
  WITH CHECK (public.has_org_role(org_id, auth.uid(), ARRAY['owner','admin']::public.org_role[]));

CREATE OR REPLACE FUNCTION public.join_org_by_code(_code text) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _org uuid;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'No autenticado'; END IF;
  SELECT id INTO _org FROM organizations WHERE invite_code = upper(trim(_code));
  IF _org IS NULL THEN RAISE EXCEPTION 'Código inválido'; END IF;
  INSERT INTO organization_members(org_id, user_id, role) VALUES (_org, auth.uid(), 'musician') ON CONFLICT DO NOTHING;
  RETURN _org;
END $$;

CREATE OR REPLACE FUNCTION public.accept_my_invites() RETURNS int
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _n int := 0; _e text := lower(auth.jwt()->>'email'); r record;
BEGIN
  IF auth.uid() IS NULL OR _e IS NULL THEN RETURN 0; END IF;
  FOR r IN SELECT * FROM org_invites WHERE lower(email) = _e LOOP
    INSERT INTO organization_members(org_id, user_id, role) VALUES (r.org_id, auth.uid(), r.role) ON CONFLICT DO NOTHING;
    DELETE FROM org_invites WHERE id = r.id; _n := _n + 1;
  END LOOP;
  RETURN _n;
END $$;

CREATE OR REPLACE FUNCTION public.regen_invite_code(_org uuid) RETURNS text
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _c text := upper(substr(md5(random()::text),1,6));
BEGIN
  IF NOT has_org_role(_org, auth.uid(), ARRAY['owner','admin']::org_role[]) THEN RAISE EXCEPTION 'Sin permiso'; END IF;
  UPDATE organizations SET invite_code = _c WHERE id = _org; RETURN _c;
END $$;

REVOKE EXECUTE ON FUNCTION public.join_org_by_code(text), public.accept_my_invites(), public.regen_invite_code(uuid) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.join_org_by_code(text), public.accept_my_invites(), public.regen_invite_code(uuid) TO authenticated;

CREATE POLICY "only owner email shares to cloud" ON public.songs AS RESTRICTIVE FOR INSERT TO authenticated
  WITH CHECK (shared = false OR lower(auth.jwt()->>'email') = 'samueljoselopegames@gmail.com');
CREATE POLICY "only owner email updates cloud" ON public.songs AS RESTRICTIVE FOR UPDATE TO authenticated
  WITH CHECK (shared = false OR lower(auth.jwt()->>'email') = 'samueljoselopegames@gmail.com');