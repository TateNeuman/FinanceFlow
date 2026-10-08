-- FinanceFlow v2.4: atomic recurring occurrence posting.
-- Run in Supabase SQL Editor once. Existing data is preserved.
ALTER TABLE public.recurring_rules
  ADD COLUMN IF NOT EXISTS last_posted_date date;

CREATE OR REPLACE FUNCTION public.post_recurring_occurrence(
  p_rule_id uuid,
  p_expected_due_date date,
  p_next_due_date date
)
RETURNS public.transactions
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  r public.recurring_rules%ROWTYPE;
  posted public.transactions%ROWTYPE;
  expected_next date;
BEGIN
  IF (SELECT auth.uid()) IS NULL THEN
    RAISE EXCEPTION 'You must be signed in' USING ERRCODE = '28000';
  END IF;

  SELECT * INTO r FROM public.recurring_rules
  WHERE id = p_rule_id AND user_id = (SELECT auth.uid())
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Recurring rule not found or access denied' USING ERRCODE = 'P0002';
  END IF;

  -- The row lock serializes concurrent attempts for the same occurrence.
  IF r.next_due_date IS DISTINCT FROM p_expected_due_date
     OR r.last_posted_date IS NOT DISTINCT FROM p_expected_due_date THEN
    RAISE EXCEPTION 'This occurrence has already been recorded or the schedule has changed'
      USING ERRCODE = '23505';
  END IF;

  IF r.frequency = 'weekly' THEN
    expected_next := r.next_due_date + 7;
  ELSIF r.frequency = 'monthly' THEN
    expected_next := (date_trunc('month', r.next_due_date)::date + interval '1 month')::date
      + (LEAST(EXTRACT(day FROM r.next_due_date)::int,
         EXTRACT(day FROM ((date_trunc('month', r.next_due_date)::date + interval '2 months')::date - 1))::int) - 1);
  ELSE
    RAISE EXCEPTION 'Unsupported recurring frequency';
  END IF;

  IF p_next_due_date IS DISTINCT FROM expected_next THEN
    RAISE EXCEPTION 'Invalid next due date' USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.transactions (user_id, title, amount, type, category, date)
  VALUES (r.user_id, r.name, r.amount, r.type, r.category, r.next_due_date)
  RETURNING * INTO posted;

  UPDATE public.recurring_rules
  SET next_due_date = expected_next, last_posted_date = r.next_due_date
  WHERE id = r.id AND user_id = (SELECT auth.uid());

  RETURN posted;
END;
$$;

REVOKE ALL ON FUNCTION public.post_recurring_occurrence(uuid,date,date) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.post_recurring_occurrence(uuid,date,date) FROM anon;
GRANT EXECUTE ON FUNCTION public.post_recurring_occurrence(uuid,date,date) TO authenticated;
NOTIFY pgrst, 'reload schema';
