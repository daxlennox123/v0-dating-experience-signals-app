-- Add engagement features: image uploads, full name, social handle, voting, comments, views

-- Add new columns to signals table
ALTER TABLE public.signals 
ADD COLUMN IF NOT EXISTS image_url TEXT,
ADD COLUMN IF NOT EXISTS subject_full_name TEXT,
ADD COLUMN IF NOT EXISTS subject_social_handle TEXT,
ADD COLUMN IF NOT EXISTS green_flag_votes INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS red_flag_votes INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS comment_count INTEGER DEFAULT 0;

-- Create votes table for tracking user votes
CREATE TABLE IF NOT EXISTS public.signal_votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  signal_id UUID NOT NULL REFERENCES public.signals(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  vote_type TEXT NOT NULL CHECK (vote_type IN ('green_flag', 'red_flag')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(signal_id, user_id)
);

ALTER TABLE public.signal_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all votes" ON public.signal_votes 
  FOR SELECT USING (true);

CREATE POLICY "Users can insert own votes" ON public.signal_votes 
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own votes" ON public.signal_votes 
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own votes" ON public.signal_votes 
  FOR DELETE USING (user_id = auth.uid());

-- Create comments table
CREATE TABLE IF NOT EXISTS public.signal_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  signal_id UUID NOT NULL REFERENCES public.signals(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (char_length(content) <= 500),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.signal_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view comments on active signals" ON public.signal_comments 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.signals 
      WHERE id = signal_id AND status = 'active'
    )
  );

CREATE POLICY "Users can insert own comments" ON public.signal_comments 
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own comments" ON public.signal_comments 
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own comments" ON public.signal_comments 
  FOR DELETE USING (user_id = auth.uid());

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_signal_votes_signal ON public.signal_votes(signal_id);
CREATE INDEX IF NOT EXISTS idx_signal_votes_user ON public.signal_votes(user_id);
CREATE INDEX IF NOT EXISTS idx_signal_comments_signal ON public.signal_comments(signal_id);
CREATE INDEX IF NOT EXISTS idx_signals_engagement ON public.signals((green_flag_votes + red_flag_votes + comment_count + view_count) DESC);

-- Function to update vote counts
CREATE OR REPLACE FUNCTION update_signal_vote_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.vote_type = 'green_flag' THEN
      UPDATE public.signals SET green_flag_votes = green_flag_votes + 1 WHERE id = NEW.signal_id;
    ELSE
      UPDATE public.signals SET red_flag_votes = red_flag_votes + 1 WHERE id = NEW.signal_id;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.vote_type = 'green_flag' THEN
      UPDATE public.signals SET green_flag_votes = GREATEST(0, green_flag_votes - 1) WHERE id = OLD.signal_id;
    ELSE
      UPDATE public.signals SET red_flag_votes = GREATEST(0, red_flag_votes - 1) WHERE id = OLD.signal_id;
    END IF;
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.vote_type = 'green_flag' THEN
      UPDATE public.signals SET green_flag_votes = GREATEST(0, green_flag_votes - 1) WHERE id = OLD.signal_id;
    ELSE
      UPDATE public.signals SET red_flag_votes = GREATEST(0, red_flag_votes - 1) WHERE id = OLD.signal_id;
    END IF;
    IF NEW.vote_type = 'green_flag' THEN
      UPDATE public.signals SET green_flag_votes = green_flag_votes + 1 WHERE id = NEW.signal_id;
    ELSE
      UPDATE public.signals SET red_flag_votes = red_flag_votes + 1 WHERE id = NEW.signal_id;
    END IF;
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_vote_counts ON public.signal_votes;
CREATE TRIGGER trigger_update_vote_counts
  AFTER INSERT OR UPDATE OR DELETE ON public.signal_votes
  FOR EACH ROW
  EXECUTE FUNCTION update_signal_vote_counts();

-- Function to update comment counts
CREATE OR REPLACE FUNCTION update_signal_comment_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.signals SET comment_count = comment_count + 1 WHERE id = NEW.signal_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.signals SET comment_count = GREATEST(0, comment_count - 1) WHERE id = OLD.signal_id;
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_comment_counts ON public.signal_comments;
CREATE TRIGGER trigger_update_comment_counts
  AFTER INSERT OR DELETE ON public.signal_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_signal_comment_counts();
