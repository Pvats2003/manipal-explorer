
-- Place submissions table
CREATE TABLE public.place_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  maps_link TEXT,
  vibes TEXT[] NOT NULL DEFAULT '{}',
  cost_range TEXT NOT NULL DEFAULT 'free',
  best_times TEXT[] NOT NULL DEFAULT '{}',
  opening_hours TEXT,
  pro_tip TEXT,
  image_url TEXT,
  submitter_batch INTEGER,
  status TEXT NOT NULL DEFAULT 'pending',
  submitted_by UUID,
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.place_submissions ENABLE ROW LEVEL SECURITY;

-- Anyone can submit (incl anonymous)
CREATE POLICY "Anyone can insert submissions"
  ON public.place_submissions FOR INSERT
  WITH CHECK (true);

-- Approved submissions visible to all
CREATE POLICY "Approved submissions viewable by everyone"
  ON public.place_submissions FOR SELECT
  USING (status = 'approved');

-- Users can view their own submissions
CREATE POLICY "Users view own submissions"
  ON public.place_submissions FOR SELECT
  USING (auth.uid() = submitted_by);

-- Admins view all submissions
CREATE POLICY "Admins view all submissions"
  ON public.place_submissions FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins update submissions (approve/reject)
CREATE POLICY "Admins update submissions"
  ON public.place_submissions FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins delete submissions
CREATE POLICY "Admins delete submissions"
  ON public.place_submissions FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_place_submissions_updated_at
  BEFORE UPDATE ON public.place_submissions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_place_submissions_status ON public.place_submissions(status, submitted_at DESC);

-- Storage bucket for submission photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('submissions', 'submissions', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Submission images publicly viewable"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'submissions');

CREATE POLICY "Anyone can upload submission images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'submissions');

CREATE POLICY "Admins can delete submission images"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'submissions' AND has_role(auth.uid(), 'admin'::app_role));
