-- EVENTS TABLE
CREATE TABLE public.events (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_by uuid NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  category text NOT NULL DEFAULT 'other',
  location text NOT NULL,
  starts_at timestamp with time zone NOT NULL,
  ends_at timestamp with time zone,
  image_url text,
  link text,
  organizer text,
  status text NOT NULL DEFAULT 'approved',
  hidden boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX idx_events_starts_at ON public.events(starts_at);
CREATE INDEX idx_events_status ON public.events(status);
CREATE INDEX idx_events_category ON public.events(category);

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Anyone can view approved, non-hidden events
CREATE POLICY "Approved events viewable by everyone"
ON public.events FOR SELECT
USING (status = 'approved' AND hidden = false);

-- Users see their own (any status)
CREATE POLICY "Users view own events"
ON public.events FOR SELECT
USING (auth.uid() = created_by);

-- Admins see everything
CREATE POLICY "Admins view all events"
ON public.events FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Logged-in users can insert their own events
CREATE POLICY "Users insert own events"
ON public.events FOR INSERT
WITH CHECK (auth.uid() = created_by);

-- Users update their own events
CREATE POLICY "Users update own events"
ON public.events FOR UPDATE
USING (auth.uid() = created_by);

-- Admins update any event
CREATE POLICY "Admins update any event"
ON public.events FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

-- Users delete their own events
CREATE POLICY "Users delete own events"
ON public.events FOR DELETE
USING (auth.uid() = created_by);

-- Admins delete any event
CREATE POLICY "Admins delete any event"
ON public.events FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- updated_at trigger
CREATE TRIGGER update_events_updated_at
BEFORE UPDATE ON public.events
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RSVP TABLE
CREATE TABLE public.event_rsvps (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(event_id, user_id)
);

CREATE INDEX idx_event_rsvps_event ON public.event_rsvps(event_id);

ALTER TABLE public.event_rsvps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone view rsvps"
ON public.event_rsvps FOR SELECT
USING (true);

CREATE POLICY "Users insert own rsvp"
ON public.event_rsvps FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own rsvp"
ON public.event_rsvps FOR DELETE
USING (auth.uid() = user_id);

-- STORAGE BUCKET
INSERT INTO storage.buckets (id, name, public)
VALUES ('event-images', 'event-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Event images publicly readable"
ON storage.objects FOR SELECT
USING (bucket_id = 'event-images');

CREATE POLICY "Users upload event images to own folder"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'event-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users update own event images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'event-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users delete own event images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'event-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
);