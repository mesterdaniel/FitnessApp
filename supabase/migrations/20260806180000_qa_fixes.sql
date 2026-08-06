-- 1. Storage RLS Fix: Only allow the owner of the folder to modify/delete portfolio images
DROP POLICY IF EXISTS "Anyone can update a portfolio image." ON storage.objects;
DROP POLICY IF EXISTS "Anyone can delete a portfolio image." ON storage.objects;

CREATE POLICY "Users can update own portfolio image."
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'portfolios' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete own portfolio image."
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'portfolios' AND (storage.foldername(name))[1] = auth.uid()::text);


-- 2. Pass Refund Trigger Fix: Refund pass if a workout participation is rejected
CREATE OR REPLACE FUNCTION public.refund_pass_on_rejection() RETURNS TRIGGER AS $$
BEGIN
    -- If status changes from pending/accepted to rejected, and a pass was used, refund it.
    IF OLD.pass_id IS NOT NULL AND NEW.status = 'rejected' AND OLD.status IN ('pending', 'accepted') THEN
        UPDATE public.client_passes SET used_occasions = used_occasions - 1 WHERE id = OLD.pass_id AND used_occasions > 0;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_refund_pass_on_rejection ON public.workout_participants;
CREATE TRIGGER tr_refund_pass_on_rejection
  AFTER UPDATE OF status ON public.workout_participants
  FOR EACH ROW
  EXECUTE FUNCTION public.refund_pass_on_rejection();


-- 3. Pass RLS Fix: Trainers can only view passes of their own active/pending clients
DROP POLICY IF EXISTS "Users can view own passes" ON public.client_passes;
CREATE POLICY "Users can view own passes" ON public.client_passes FOR SELECT TO authenticated USING (
  client_id = auth.uid() 
  OR private.is_admin(auth.uid())
  OR (private.profile_role(auth.uid()) = 'trainer' AND private.trainer_has_client(auth.uid(), client_id))
);
