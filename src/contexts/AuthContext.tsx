import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export interface ExplorerProfile {
  user_id: string;
  display_name: string | null;
  batch_year: number | null;
  profile_emoji: string;
  explorer_score: number;
  onboarded: boolean;
  avatar_url: string | null;
}

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAdmin: boolean;
  profile: ExplorerProfile | null;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [profile, setProfile] = useState<ExplorerProfile | null>(null);

  const loadProfile = async (uid: string): Promise<void> => {
    try {
      const { data } = await supabase
        .from("profiles")
        .select("user_id, display_name, batch_year, profile_emoji, explorer_score, onboarded, avatar_url")
        .eq("user_id", uid)
        .maybeSingle();
      if (data) setProfile(data as ExplorerProfile);
    } catch (error) {
      console.error("Failed to load profile:", error);
    }
  };

  const loadAdminStatus = async (uid: string): Promise<void> => {
    try {
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", uid)
        .eq("role", "admin")
        .maybeSingle();
      setIsAdmin(!!data);
    } catch (error) {
      console.error("Failed to load admin status:", error);
      setIsAdmin(false);
    }
  };

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(sess);
      setUser(sess?.user ?? null);
      if (sess?.user) {
        // Load admin status and profile concurrently
        Promise.all([
          loadAdminStatus(sess.user.id),
          loadProfile(sess.user.id),
        ]).catch((error) => {
          console.error("Failed to load user data:", error);
        });
      } else {
        setIsAdmin(false);
        setProfile(null);
      }
    });

    // Get current session on mount
    supabase.auth.getSession().then(({ data: { session: sess } }) => {
      setSession(sess);
      setUser(sess?.user ?? null);
      if (sess?.user) {
        Promise.all([
          loadAdminStatus(sess.user.id),
          loadProfile(sess.user.id),
        ]).catch((error) => {
          console.error("Failed to load user data:", error);
        }).finally(() => {
          setLoading(false);
        });
      } else {
        setLoading(false);
      }
    }).catch((error) => {
      console.error("Failed to get session:", error);
      setLoading(false);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const signOut = async (): Promise<void> => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error("Failed to sign out:", error);
      throw error;
    }
  };

  const refreshProfile = async (): Promise<void> => {
    if (user) {
      try {
        await loadProfile(user.id);
      } catch (error) {
        console.error("Failed to refresh profile:", error);
        throw error;
      }
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, isAdmin, profile, refreshProfile, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
