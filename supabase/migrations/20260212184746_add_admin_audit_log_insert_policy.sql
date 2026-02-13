-- Allow admins to insert into admin_audit_log (for server actions using authenticated client)
CREATE POLICY "Admins can insert admin_audit_log" ON public.admin_audit_log
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
