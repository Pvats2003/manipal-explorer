
DROP POLICY IF EXISTS "Admins insert any notification" ON public.notifications;
CREATE POLICY "Admins insert any notification" ON public.notifications
  FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
