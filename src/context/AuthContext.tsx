import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { Session } from "@supabase/supabase-js";
import { supabase, UserProfile } from "@/src/lib/supabase";

interface AuthContextType {
  user: UserProfile | null;
  session: Session | null;
  loading: boolean;
  error: string | null;
  fetchUserProfile: (userId: string) => Promise<void>;
  setUser: (user: UserProfile | null) => void;
  signOut: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  // Fetch profile from users table
  const fetchUserProfile = useCallback(async (userId: string) => {
    try {
      setError(null);
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) {
        console.error("Profile fetch error:", error.message);
        setError(error.message);
        setUser(null);
      } else {
        setUser(data as UserProfile);
      }
    } catch (err) {
      console.error("Profile fetch exception:", err);
      setError(err instanceof Error ? err.message : 'Failed to fetch profile');
      setUser(null);
    }
  }, []);

  // Initialize auth and set up listener
  useEffect(() => {
    const initAuth = async () => {
      try {
        setError(null);
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          console.error("Session error:", error.message);
          setError(error.message);
          setLoading(false);
          return;
        }

        const currentSession = data.session;
        setSession(currentSession);

        if (currentSession?.user?.id) {
          await fetchUserProfile(currentSession.user.id);
          setLoading(false);
        } else {
          setLoading(false);
        }
      } catch (err) {
        console.error("Auth initialization error:", err);
        setError(err instanceof Error ? err.message : 'Failed to initialize authentication');
        setLoading(false);
      }
    };

    initAuth();

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        setSession(newSession);
        
        if (newSession?.user?.id) {
          setLoading(true);
          await fetchUserProfile(newSession.user.id);
          setLoading(false);
        } else {
          setUser(null);
          setLoading(false);
        }
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, [fetchUserProfile]);

  const signOut = async () => {
    try {
      setError(null);
      setLoading(true);
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
    } catch (err) {
      console.error("Sign out error:", err);
      setError(err instanceof Error ? err.message : 'Failed to sign out');
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    session,
    loading,
    error,
    fetchUserProfile,
    setUser,
    signOut,
    clearError,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}