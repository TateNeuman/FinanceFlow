-- FinanceFlow Final: run once in Supabase SQL Editor before using cloud savings contributions.
-- Existing goals and transactions are preserved.
CREATE OR REPLACE FUNCTION public.add_savings_contribution(p_goal_id uuid, p_amount numeric)
RETURNS public.savings_goals
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE updated public.savings_goals%ROWTYPE;
BEGIN
  IF (SELECT auth.uid()) IS NULL THEN
    RAISE EXCEPTION 'Sign in required' USING ERRCODE = '28000';
  END IF;
  IF p_amount IS NULL OR p_amount <= 0 OR p_amount > 100000000 OR p_amount <> round(p_amount,2) THEN
    RAISE EXCEPTION 'Invalid contribution amount' USING ERRCODE = '22023';
  END IF;
  UPDATE public.savings_goals
  SET saved_amount = saved_amount + p_amount
  WHERE id = p_goal_id AND user_id = (SELECT auth.uid())
    AND saved_amount + p_amount <= 9999999999.99
  RETURNING * INTO updated;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Goal not found or contribution exceeds allowed balance' USING ERRCODE = 'P0002';
  END IF;
  RETURN updated;
END;
$$;
REVOKE ALL ON FUNCTION public.add_savings_contribution(uuid,numeric) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.add_savings_contribution(uuid,numeric) FROM anon;
GRANT EXECUTE ON FUNCTION public.add_savings_contribution(uuid,numeric) TO authenticated;
NOTIFY pgrst, 'reload schema';
