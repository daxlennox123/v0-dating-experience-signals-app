-- The Signal - Database Schema
-- Private invite-only dating experience signals app

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- PROFILES TABLE (extends auth.users)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  phone_verified BOOLEAN DEFAULT FALSE,
  selfie_url TEXT,
  selfie_verified BOOLEAN DEFAULT FALSE,
  account_status TEXT DEFAULT 'pending' CHECK (account_status IN ('pending', 'approved', 'rejected', 'banned')),
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'moderator', 'admin')),
  has_contributed BOOLEAN DEFAULT FALSE, -- true if posted signal OR marked "never dated"
  never_dated BOOLEAN DEFAULT FALSE,
  terms_accepted_at TIMESTAMPTZ,
  guidelines_accepted_at TIMESTAMPTZ,
  invited_by UUID REFERENCES public.profiles(id),
  invite_code TEXT UNIQUE,
  invites_remaining INTEGER DEFAULT 3,
  watermark_hash TEXT, -- rotating hash for screenshot deterrence
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON public.profiles 
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles 
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON public.profiles 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'moderator')
    )
  );

CREATE POLICY "Admins can update all profiles" ON public.profiles 
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ==========================================
-- SIGNALS TABLE (dating experience posts)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.signals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  -- Subject identification (anonymous to users, traceable for moderation)
  subject_first_name TEXT NOT NULL,
  subject_last_initial TEXT,
  subject_platform TEXT, -- where they met (Hinge, Tinder, etc.)
  subject_location TEXT, -- city/area
  -- Structured review data
  experience_type TEXT NOT NULL CHECK (experience_type IN ('first_date', 'multiple_dates', 'relationship', 'situationship', 'talking_stage')),
  overall_signal TEXT NOT NULL CHECK (overall_signal IN ('green', 'yellow', 'red')),
  -- Tags (stored as arrays)
  green_flags TEXT[] DEFAULT '{}',
  red_flags TEXT[] DEFAULT '{}',
  -- Short text description
  description TEXT CHECK (char_length(description) <= 200),
  -- Moderation
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'under_review', 'hidden', 'removed')),
  flagged_count INTEGER DEFAULT 0,
  -- Claim/response
  claimed_by UUID REFERENCES public.profiles(id),
  claim_status TEXT CHECK (claim_status IN ('pending', 'approved', 'denied')),
  claim_response TEXT,
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.signals ENABLE ROW LEVEL SECURITY;

-- Signals policies - users can only see active signals if they've contributed
CREATE POLICY "Contributors can view active signals" ON public.signals 
  FOR SELECT USING (
    status = 'active' AND
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND has_contributed = TRUE
      AND account_status = 'approved'
    )
  );

CREATE POLICY "Users can view own signals" ON public.signals 
  FOR SELECT USING (author_id = auth.uid());

CREATE POLICY "Users can insert own signals" ON public.signals 
  FOR INSERT WITH CHECK (author_id = auth.uid());

CREATE POLICY "Users can update own signals" ON public.signals 
  FOR UPDATE USING (author_id = auth.uid());

CREATE POLICY "Moderators can view all signals" ON public.signals 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'moderator')
    )
  );

CREATE POLICY "Moderators can update signals" ON public.signals 
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'moderator')
    )
  );

-- ==========================================
-- REPORTS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS public.reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reporter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  signal_id UUID REFERENCES public.signals(id) ON DELETE CASCADE,
  reported_user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  reason TEXT NOT NULL CHECK (reason IN ('harassment', 'false_information', 'identifying_info', 'threats', 'hate_speech', 'explicit_content', 'doxxing', 'crime_allegation', 'other')),
  details TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'action_taken', 'dismissed')),
  reviewed_by UUID REFERENCES public.profiles(id),
  reviewed_at TIMESTAMPTZ,
  action_taken TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create reports" ON public.reports 
  FOR INSERT WITH CHECK (reporter_id = auth.uid());

CREATE POLICY "Users can view own reports" ON public.reports 
  FOR SELECT USING (reporter_id = auth.uid());

CREATE POLICY "Moderators can view all reports" ON public.reports 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'moderator')
    )
  );

CREATE POLICY "Moderators can update reports" ON public.reports 
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'moderator')
    )
  );

-- ==========================================
-- CLAIMS TABLE (right to respond)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.claims (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  signal_id UUID NOT NULL REFERENCES public.signals(id) ON DELETE CASCADE,
  claimant_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied')),
  reviewed_by UUID REFERENCES public.profiles(id),
  reviewed_at TIMESTAMPTZ,
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.claims ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create claims" ON public.claims 
  FOR INSERT WITH CHECK (claimant_id = auth.uid());

CREATE POLICY "Users can view own claims" ON public.claims 
  FOR SELECT USING (claimant_id = auth.uid());

CREATE POLICY "Moderators can view all claims" ON public.claims 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'moderator')
    )
  );

CREATE POLICY "Moderators can update claims" ON public.claims 
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'moderator')
    )
  );

-- ==========================================
-- INVITES TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS public.invites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL,
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  used_by UUID REFERENCES public.profiles(id),
  used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own invites" ON public.invites 
  FOR SELECT USING (created_by = auth.uid());

CREATE POLICY "Users can create invites" ON public.invites 
  FOR INSERT WITH CHECK (created_by = auth.uid());

CREATE POLICY "Anyone can use valid invite codes" ON public.invites 
  FOR SELECT USING (used_by IS NULL AND expires_at > NOW());

CREATE POLICY "Users can update invites they use" ON public.invites 
  FOR UPDATE USING (used_by IS NULL);

-- ==========================================
-- AUDIT LOG TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS public.audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL, -- 'profile', 'signal', 'report', 'claim'
  target_id UUID,
  details JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view audit log" ON public.audit_log 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "System can insert audit log" ON public.audit_log 
  FOR INSERT WITH CHECK (actor_id = auth.uid());

-- ==========================================
-- TRIGGER: Auto-create profile on signup
-- ==========================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role TEXT := 'user';
  user_status TEXT := 'pending';
BEGIN
  -- Auto-approve and set admin for specific email
  IF NEW.email = 'daxlennox1@gmail.com' THEN
    user_role := 'admin';
    user_status := 'approved';
  END IF;

  INSERT INTO public.profiles (
    id,
    email,
    role,
    account_status,
    invite_code,
    watermark_hash
  )
  VALUES (
    NEW.id,
    NEW.email,
    user_role,
    user_status,
    substr(md5(random()::text), 0, 9),
    substr(md5(NEW.id::text || NOW()::text), 0, 13)
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ==========================================
-- TRIGGER: Update watermark hash periodically
-- ==========================================
CREATE OR REPLACE FUNCTION public.rotate_watermark_hash()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.watermark_hash := substr(md5(NEW.id::text || NOW()::text), 0, 13);
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

-- ==========================================
-- INDEXES for performance
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_signals_status ON public.signals(status);
CREATE INDEX IF NOT EXISTS idx_signals_author ON public.signals(author_id);
CREATE INDEX IF NOT EXISTS idx_signals_created ON public.signals(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_signals_subject ON public.signals(subject_first_name, subject_location);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON public.profiles(account_status);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_reports_status ON public.reports(status);
CREATE INDEX IF NOT EXISTS idx_invites_code ON public.invites(code);
