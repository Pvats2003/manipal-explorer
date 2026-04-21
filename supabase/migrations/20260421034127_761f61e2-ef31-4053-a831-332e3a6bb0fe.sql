
-- ROLES ENUM + TABLE (separate, secure)
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "Users view their own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins view all roles" ON public.user_roles
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage roles" ON public.user_roles
  FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- PROFILES
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profiles viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

-- DESTINATIONS
CREATE TABLE public.destinations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL, -- beach, waterfall, trek, cafe, party, nature, food, adventure, chill
  moods TEXT[] NOT NULL DEFAULT '{}', -- multiple mood matches
  travel_types TEXT[] NOT NULL DEFAULT '{solo,friends,partner}',
  distance_km NUMERIC NOT NULL,
  duration_type TEXT NOT NULL DEFAULT 'day', -- 'day' or 'multi'
  budget_tier TEXT NOT NULL DEFAULT 'low', -- low, medium, high
  transport_cost INT NOT NULL DEFAULT 0,
  food_cost INT NOT NULL DEFAULT 0,
  stay_cost INT NOT NULL DEFAULT 0,
  entry_fee INT NOT NULL DEFAULT 0,
  rating NUMERIC NOT NULL DEFAULT 8.0,
  activities TEXT[] NOT NULL DEFAULT '{}',
  image_url TEXT,
  latitude NUMERIC,
  longitude NUMERIC,
  best_time TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.destinations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Destinations viewable by everyone" ON public.destinations FOR SELECT USING (true);
CREATE POLICY "Admins insert destinations" ON public.destinations FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update destinations" ON public.destinations FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete destinations" ON public.destinations FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- SAVED TRIPS
CREATE TABLE public.saved_trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  destination_id UUID NOT NULL REFERENCES public.destinations(id) ON DELETE CASCADE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, destination_id)
);
ALTER TABLE public.saved_trips ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own saved" ON public.saved_trips FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own saved" ON public.saved_trips FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own saved" ON public.saved_trips FOR DELETE USING (auth.uid() = user_id);

-- LIKES
CREATE TABLE public.likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  destination_id UUID NOT NULL REFERENCES public.destinations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, destination_id)
);
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own likes" ON public.likes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own likes" ON public.likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own likes" ON public.likes FOR DELETE USING (auth.uid() = user_id);

-- TRIP HISTORY (preference searches)
CREATE TABLE public.trip_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  preferences JSONB NOT NULL,
  selected_destination_id UUID REFERENCES public.destinations(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.trip_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own history" ON public.trip_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own history" ON public.trip_history FOR INSERT WITH CHECK (auth.uid() = user_id);

-- TIMESTAMP TRIGGER
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_destinations_updated BEFORE UPDATE ON public.destinations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- AUTO-CREATE PROFILE + DEFAULT ROLE ON SIGNUP
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
