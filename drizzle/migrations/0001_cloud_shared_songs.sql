ALTER TABLE public.songs ADD COLUMN IF NOT EXISTS shared boolean NOT NULL DEFAULT false;
CREATE POLICY "anyone reads shared songs" ON public.songs FOR SELECT TO authenticated USING (shared = true);
CREATE POLICY "anyone reads stems of shared songs" ON public.stems FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.songs s WHERE s.id = stems.song_id AND s.shared = true));
CREATE POLICY "read shared or linked media" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'media' AND EXISTS (
    SELECT 1 FROM public.stems st JOIN public.songs s ON s.id = st.song_id
    WHERE st.storage_path = storage.objects.name
      AND (s.shared = true OR public.is_org_member(st.org_id, auth.uid()))));