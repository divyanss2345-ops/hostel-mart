import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase, type Profile } from '@/lib/supabase';

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  isAdmin: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, name: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, name, email, role, created_at')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.error('[AuthContext] Profile query failed:', error.code, error.message);
      setProfile(null);
      return false;
    }
    if (!data) {
      console.warn('[AuthContext] No profile row found for user', userId);
    }
    setProfile(data as Profile | null);
    return true;
  }, []);

  useEffect(() => {
    let mounted = true;

    // On mount, restore any existing session from storage.
    // This is what keeps the user logged in after a page refresh.
    supabase.auth.getSession().then(({ data, error }) => {
      if (error) {
        console.error('[AuthContext] getSession error:', error.message);
      }
      if (!mounted) return;
      console.log('[AuthContext] getSession result:', data.session ? 'session found' : 'no session');
      setSession(data.session);
      if (data.session?.user) {
        loadProfile(data.session.user.id).finally(() => mounted && setLoading(false));
      } else {
        setLoading(false);
      }
    });

    // Listen for auth state changes (sign in, sign out, token refresh, etc.).
    // The callback runs synchronously inside Supabase, so async work is wrapped
    // in an IIFE to avoid deadlocks.
    const { data: sub } = supabase.auth.onAuthStateChange((event, newSession) => {
      console.log('[AuthContext] onAuthStateChange:', event, newSession ? 'has session' : 'no session');
      (async () => {
        setSession(newSession);
        if (newSession?.user) {
          await loadProfile(newSession.user.id);
        } else {
          setProfile(null);
        }
        setLoading(false);
      })();
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [loadProfile]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        console.error('[AuthContext] signInWithPassword failed:', error.message);
        return { error: error.message };
      }

      console.log('[AuthContext] signInWithPassword success, user:', data.user?.id);
      // Update React state immediately so the UI reflects the login
      // without waiting for the onAuthStateChange event to fire.
      setSession(data.session);
      if (data.session?.user) {
        await loadProfile(data.session.user.id);
      }
      setLoading(false);
      return { error: null };
    },
    [loadProfile],
  );

  const signUp = useCallback(
    async (email: string, password: string, name: string) => {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name } },
      });
      if (error) return { error: error.message };

      // Email confirmation is OFF, so a session should be returned immediately.
      setSession(data.session);
      if (data.user) {
        await loadProfile(data.user.id);
      }
      setLoading(false);
      return { error: null };
    },
    [loadProfile],
  );

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setSession(null);
  }, []);

  const refreshProfile = useCallback(async () => {
    if (session?.user) await loadProfile(session.user.id);
  }, [session?.user, loadProfile]);

  const value: AuthContextValue = {
    session,
    user: session?.user ?? null,
    profile,
    loading,
    isAdmin: profile?.role === 'admin',
    signIn,
    signUp,
    signOut,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
