
-- ============ EXPERIENCES ============
CREATE TABLE public.experiences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by uuid NOT NULL,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  location text NOT NULL DEFAULT '',
  destination_id uuid NULL,
  starts_at timestamptz NOT NULL DEFAULT now(),
  budget_estimate integer NOT NULL DEFAULT 0,
  image_url text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.experiences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Experiences viewable by everyone" ON public.experiences FOR SELECT USING (true);
CREATE POLICY "Users insert own experiences" ON public.experiences FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Users update own experiences" ON public.experiences FOR UPDATE USING (auth.uid() = created_by);
CREATE POLICY "Users delete own experiences" ON public.experiences FOR DELETE USING (auth.uid() = created_by);
CREATE TRIGGER trg_experiences_updated BEFORE UPDATE ON public.experiences FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ ATTENDEES ============
CREATE TABLE public.experience_attendees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  experience_id uuid NOT NULL REFERENCES public.experiences(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (experience_id, user_id)
);
ALTER TABLE public.experience_attendees ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Attendees viewable by everyone" ON public.experience_attendees FOR SELECT USING (true);
CREATE POLICY "Users join experiences" ON public.experience_attendees FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users leave experiences" ON public.experience_attendees FOR DELETE USING (auth.uid() = user_id);

-- ============ GROUPS ============
CREATE TABLE public.experience_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  experience_id uuid NOT NULL REFERENCES public.experiences(id) ON DELETE CASCADE,
  created_by uuid NOT NULL,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  max_members integer NOT NULL DEFAULT 10,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.experience_groups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Groups viewable by everyone" ON public.experience_groups FOR SELECT USING (true);
CREATE POLICY "Users insert groups" ON public.experience_groups FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Creators update groups" ON public.experience_groups FOR UPDATE USING (auth.uid() = created_by);
CREATE POLICY "Creators delete groups" ON public.experience_groups FOR DELETE USING (auth.uid() = created_by);

-- ============ GROUP MEMBERS ============
CREATE TABLE public.group_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES public.experience_groups(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (group_id, user_id)
);
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members viewable by everyone" ON public.group_members FOR SELECT USING (true);
CREATE POLICY "Users join groups" ON public.group_members FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users leave groups" ON public.group_members FOR DELETE USING (auth.uid() = user_id);

-- Helper: is user a member of a group? (security definer to avoid recursive RLS)
CREATE OR REPLACE FUNCTION public.is_group_member(_group_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.group_members WHERE group_id = _group_id AND user_id = _user_id)
$$;

-- ============ MESSAGES ============
CREATE TABLE public.group_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES public.experience_groups(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.group_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members view messages" ON public.group_messages FOR SELECT USING (public.is_group_member(group_id, auth.uid()));
CREATE POLICY "Members post messages" ON public.group_messages FOR INSERT WITH CHECK (auth.uid() = user_id AND public.is_group_member(group_id, auth.uid()));
CREATE POLICY "Authors delete messages" ON public.group_messages FOR DELETE USING (auth.uid() = user_id);

-- ============ POLLS ============
CREATE TABLE public.polls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES public.experience_groups(id) ON DELETE CASCADE,
  created_by uuid NOT NULL,
  question text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.polls ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members view polls" ON public.polls FOR SELECT USING (public.is_group_member(group_id, auth.uid()));
CREATE POLICY "Members create polls" ON public.polls FOR INSERT WITH CHECK (auth.uid() = created_by AND public.is_group_member(group_id, auth.uid()));
CREATE POLICY "Creators delete polls" ON public.polls FOR DELETE USING (auth.uid() = created_by);

CREATE TABLE public.poll_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id uuid NOT NULL REFERENCES public.polls(id) ON DELETE CASCADE,
  label text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.poll_options ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Options visible to poll viewers" ON public.poll_options FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.polls p WHERE p.id = poll_id AND public.is_group_member(p.group_id, auth.uid()))
);
CREATE POLICY "Poll creators add options" ON public.poll_options FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.polls p WHERE p.id = poll_id AND p.created_by = auth.uid())
);

CREATE TABLE public.poll_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id uuid NOT NULL REFERENCES public.polls(id) ON DELETE CASCADE,
  option_id uuid NOT NULL REFERENCES public.poll_options(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (poll_id, user_id)
);
ALTER TABLE public.poll_votes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Votes visible to members" ON public.poll_votes FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.polls p WHERE p.id = poll_id AND public.is_group_member(p.group_id, auth.uid()))
);
CREATE POLICY "Members vote" ON public.poll_votes FOR INSERT WITH CHECK (
  auth.uid() = user_id AND EXISTS (SELECT 1 FROM public.polls p WHERE p.id = poll_id AND public.is_group_member(p.group_id, auth.uid()))
);
CREATE POLICY "Users delete own vote" ON public.poll_votes FOR DELETE USING (auth.uid() = user_id);

-- ============ EXPENSES ============
CREATE TABLE public.expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES public.experience_groups(id) ON DELETE CASCADE,
  paid_by uuid NOT NULL,
  description text NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  split_among uuid[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members view expenses" ON public.expenses FOR SELECT USING (public.is_group_member(group_id, auth.uid()));
CREATE POLICY "Members add expenses" ON public.expenses FOR INSERT WITH CHECK (auth.uid() = paid_by AND public.is_group_member(group_id, auth.uid()));
CREATE POLICY "Payer deletes expense" ON public.expenses FOR DELETE USING (auth.uid() = paid_by);

-- ============ REALTIME ============
ALTER PUBLICATION supabase_realtime ADD TABLE public.group_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.poll_votes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.group_members;
ALTER PUBLICATION supabase_realtime ADD TABLE public.expenses;
ALTER TABLE public.group_messages REPLICA IDENTITY FULL;
ALTER TABLE public.poll_votes REPLICA IDENTITY FULL;
ALTER TABLE public.group_members REPLICA IDENTITY FULL;
ALTER TABLE public.expenses REPLICA IDENTITY FULL;

-- ============ SEED (3 demo experiences) ============
DO $$
DECLARE
  any_user uuid;
  d1 uuid; d2 uuid; d3 uuid;
BEGIN
  SELECT user_id INTO any_user FROM public.profiles ORDER BY created_at LIMIT 1;
  IF any_user IS NULL THEN RETURN; END IF;
  SELECT id INTO d1 FROM public.destinations ORDER BY rating DESC NULLS LAST LIMIT 1;
  SELECT id INTO d2 FROM public.destinations ORDER BY rating DESC NULLS LAST OFFSET 1 LIMIT 1;
  SELECT id INTO d3 FROM public.destinations ORDER BY rating DESC NULLS LAST OFFSET 2 LIMIT 1;

  INSERT INTO public.experiences (created_by, title, description, location, destination_id, starts_at, budget_estimate)
  VALUES
    (any_user, 'Sunset Trip to Malpe Beach', 'Chill bonfire + sunset photos. Open to anyone — let''s split a tempo.', 'Malpe Beach', d1, now() + interval '3 days', 600),
    (any_user, 'Weekend Trek to Kudremukh', 'Overnight trek, basic fitness needed. Group cooking.', 'Kudremukh', d2, now() + interval '10 days', 2200),
    (any_user, 'Cafe Hopping in Manipal', 'Hit 4 cafes in one afternoon. Foodies welcome.', 'Manipal', d3, now() + interval '2 days', 400);
END $$;
