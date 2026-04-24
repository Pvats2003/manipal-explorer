
-- 1. explorer_events: append-only ledger of point-earning actions
CREATE TABLE public.explorer_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  event_type text NOT NULL,
  points_awarded integer NOT NULL DEFAULT 0,
  reference_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
CREATE INDEX idx_explorer_events_user_created ON public.explorer_events(user_id, created_at DESC);

ALTER TABLE public.explorer_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own explorer events" ON public.explorer_events
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins view all explorer events" ON public.explorer_events
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users insert own explorer events" ON public.explorer_events
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 2. Trigger: auto-bump profiles.explorer_score on each event insert
CREATE OR REPLACE FUNCTION public.bump_explorer_score()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
    SET explorer_score = explorer_score + COALESCE(NEW.points_awarded, 0),
        updated_at = now()
    WHERE user_id = NEW.user_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_bump_explorer_score
AFTER INSERT ON public.explorer_events
FOR EACH ROW EXECUTE FUNCTION public.bump_explorer_score();

-- 3. user_badges
CREATE TABLE public.user_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  badge_id text NOT NULL,
  awarded_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, badge_id)
);
CREATE INDEX idx_user_badges_user ON public.user_badges(user_id, awarded_at DESC);

ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Badges viewable by everyone" ON public.user_badges
  FOR SELECT USING (true);
CREATE POLICY "Users insert own badges" ON public.user_badges
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins delete badges" ON public.user_badges
  FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- 4. notifications
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  message text NOT NULL,
  type text NOT NULL DEFAULT 'info',
  read boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
CREATE INDEX idx_notifications_user_created ON public.notifications(user_id, created_at DESC);
CREATE INDEX idx_notifications_unread ON public.notifications(user_id) WHERE read = false;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own notifications" ON public.notifications
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own notifications" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own notifications" ON public.notifications
  FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Admins insert any notification" ON public.notifications
  FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Enable realtime for notifications
ALTER TABLE public.notifications REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- 5. waitlist for Coming Soon "Notify Me"
CREATE TABLE public.waitlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  feature_id text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(email, feature_id)
);

ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can join waitlist" ON public.waitlist
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins view waitlist" ON public.waitlist
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));
