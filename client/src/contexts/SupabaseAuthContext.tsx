import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase, supabaseConfigError } from "@/lib/supabase";

export type AersRoleCode =
  | "LEARNER"
  | "FACILITATOR"
  | "ASSESSOR"
  | "INSTITUTION_COORDINATOR"
  | "INSTITUTION_LEADERSHIP"
  | "AERS_ADMIN"
  | "SYSTEM_ADMIN";

export type AersProfile = {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  status: string;
  avatar_url: string | null;
};

export type AersRole = {
  code: AersRoleCode;
  name: string;
  institution_id: string | null;
};

type AuthContextValue = {
  session: Session | null;
  authUser: User | null;
  profile: AersProfile | null;
  roles: AersRole[];
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function readableAuthError(message: string): string {
  if (message.toLowerCase().includes("invalid login credentials")) return "Email or password is incorrect.";
  if (message.toLowerCase().includes("email not confirmed")) return "Confirm your email address before signing in.";
  return "We couldn't sign you in. Please try again.";
}

async function loadIdentity(user: User): Promise<{ profile: AersProfile | null; roles: AersRole[] }> {
  if (!supabase) return { profile: null, roles: [] };
  const [profileResult, rolesResult] = await Promise.all([
    supabase.from("users").select("id,email,first_name,last_name,status,avatar_url").eq("id", user.id).maybeSingle(),
    supabase.from("user_roles").select("institution_id,roles(code,name)").eq("user_id", user.id),
  ]);
  if (profileResult.error) throw profileResult.error;
  if (rolesResult.error) throw rolesResult.error;
  const roleRows = (rolesResult.data ?? []) as Array<{ institution_id: string | null; roles: { code: AersRoleCode; name: string } | { code: AersRoleCode; name: string }[] | null }>;
  const roles = roleRows.flatMap((row) => {
    const linked = Array.isArray(row.roles) ? row.roles[0] : row.roles;
    return linked ? [{ code: linked.code, name: linked.name, institution_id: row.institution_id }] : [];
  });
  return { profile: (profileResult.data as AersProfile | null) ?? null, roles };
}

export function SupabaseAuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<AersProfile | null>(null);
  const [roles, setRoles] = useState<AersRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(supabaseConfigError);

  const hydrate = async (nextSession: Session | null) => {
    setSession(nextSession);
    setAuthUser(nextSession?.user ?? null);
    if (!nextSession?.user) {
      setProfile(null);
      setRoles([]);
      return;
    }
    try {
      const identity = await loadIdentity(nextSession.user);
      setProfile(identity.profile);
      setRoles(identity.roles);
      setError(null);
    } catch (identityError) {
      console.error("[AERS] Failed to load identity", identityError);
      setError("We couldn't load your AERS profile. Please refresh and try again.");
    }
  };

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    let active = true;
    supabase.auth.getSession().then(async ({ data, error: sessionError }) => {
      if (!active) return;
      if (sessionError) setError("We couldn't restore your session. Please sign in again.");
      await hydrate(data.session);
      if (active) setLoading(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      void hydrate(nextSession);
      setLoading(false);
    });
    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    session,
    authUser,
    profile,
    roles,
    loading,
    error,
    signIn: async (email, password) => {
      if (!supabase) throw new Error(supabaseConfigError ?? "Supabase is not configured.");
      setError(null);
      const { data, error: signInError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (signInError) {
        const safeError = readableAuthError(signInError.message);
        setError(safeError);
        throw new Error(safeError);
      }
      await hydrate(data.session);
    },
    signOut: async () => {
      if (!supabase) return;
      const { error: signOutError } = await supabase.auth.signOut();
      if (signOutError) throw new Error("We couldn't sign you out. Please try again.");
      setSession(null);
      setAuthUser(null);
      setProfile(null);
      setRoles([]);
    },
    refreshProfile: async () => {
      if (session?.user) {
        const identity = await loadIdentity(session.user);
        setProfile(identity.profile);
        setRoles(identity.roles);
      }
    },
  }), [authUser, error, loading, profile, roles, session]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useSupabaseAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useSupabaseAuth must be used inside SupabaseAuthProvider");
  return context;
}
