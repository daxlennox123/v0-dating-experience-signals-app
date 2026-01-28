-- Fix infinite recursion in RLS policies
-- Drop ALL existing policies dynamically first

-- Drop all policies on profiles
DO $$ 
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'profiles' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.profiles', pol.policyname);
    END LOOP;
END $$;

-- Drop all policies on signals
DO $$ 
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'signals' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.signals', pol.policyname);
    END LOOP;
END $$;

-- Drop all policies on claims
DO $$ 
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'claims' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.claims', pol.policyname);
    END LOOP;
END $$;

-- Drop all policies on invites
DO $$ 
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'invites' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.invites', pol.policyname);
    END LOOP;
END $$;

-- Drop all policies on reports
DO $$ 
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'reports' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.reports', pol.policyname);
    END LOOP;
END $$;

-- Drop all policies on audit_log
DO $$ 
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'audit_log' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.audit_log', pol.policyname);
    END LOOP;
END $$;

-- Create admin check function with security definer to avoid recursion
CREATE OR REPLACE FUNCTION public.check_is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'moderator')
  );
$$;

-- PROFILES: Simple non-recursive policies
CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "profiles_select_admin" ON public.profiles
  FOR SELECT USING (check_is_admin());

CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "profiles_update_admin" ON public.profiles
  FOR UPDATE USING (check_is_admin());

CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- SIGNALS: Approved signals visible to all authenticated users
CREATE POLICY "signals_select_active" ON public.signals
  FOR SELECT USING (status = 'active');

CREATE POLICY "signals_select_own" ON public.signals
  FOR SELECT USING (author_id = auth.uid());

CREATE POLICY "signals_select_admin" ON public.signals
  FOR SELECT USING (check_is_admin());

CREATE POLICY "signals_insert" ON public.signals
  FOR INSERT WITH CHECK (author_id = auth.uid());

CREATE POLICY "signals_update_own" ON public.signals
  FOR UPDATE USING (author_id = auth.uid());

CREATE POLICY "signals_update_admin" ON public.signals
  FOR UPDATE USING (check_is_admin());

-- CLAIMS (uses claimant_id)
CREATE POLICY "claims_select_own" ON public.claims
  FOR SELECT USING (claimant_id = auth.uid());

CREATE POLICY "claims_select_admin" ON public.claims
  FOR SELECT USING (check_is_admin());

CREATE POLICY "claims_insert" ON public.claims
  FOR INSERT WITH CHECK (claimant_id = auth.uid());

CREATE POLICY "claims_update_admin" ON public.claims
  FOR UPDATE USING (check_is_admin());

-- INVITES
CREATE POLICY "invites_select_own" ON public.invites
  FOR SELECT USING (created_by = auth.uid());

CREATE POLICY "invites_select_available" ON public.invites
  FOR SELECT USING (used_by IS NULL AND expires_at > NOW());

CREATE POLICY "invites_insert" ON public.invites
  FOR INSERT WITH CHECK (created_by = auth.uid());

CREATE POLICY "invites_update" ON public.invites
  FOR UPDATE USING (used_by IS NULL);

-- REPORTS
CREATE POLICY "reports_select_own" ON public.reports
  FOR SELECT USING (reporter_id = auth.uid());

CREATE POLICY "reports_select_admin" ON public.reports
  FOR SELECT USING (check_is_admin());

CREATE POLICY "reports_insert" ON public.reports
  FOR INSERT WITH CHECK (reporter_id = auth.uid());

CREATE POLICY "reports_update_admin" ON public.reports
  FOR UPDATE USING (check_is_admin());

-- AUDIT_LOG (admin only)
CREATE POLICY "audit_log_select_admin" ON public.audit_log
  FOR SELECT USING (check_is_admin());

CREATE POLICY "audit_log_insert" ON public.audit_log
  FOR INSERT WITH CHECK (actor_id = auth.uid());
