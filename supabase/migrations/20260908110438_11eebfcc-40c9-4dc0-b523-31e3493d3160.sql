DROP POLICY IF EXISTS "Users can view all avatars" ON storage.objects;

DROP POLICY IF EXISTS "Users can upload pint photos" ON storage.objects;
CREATE POLICY "Users can upload their own pint photos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'pint-photos' AND (auth.uid())::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users can delete their own pint photos" ON storage.objects;
CREATE POLICY "Users can delete their own pint photos"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'pint-photos' AND (auth.uid())::text = (storage.foldername(name))[1]);

REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.admin_growth_stats() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_growth_stats() TO authenticated;
REVOKE ALL ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;
REVOKE ALL ON FUNCTION public.is_group_member(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_group_member(uuid, uuid) TO authenticated;
REVOKE ALL ON FUNCTION public.share_group_with_user(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.share_group_with_user(uuid, uuid) TO authenticated;