import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import { supabase } from "../services/supabase";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] =
    useState(null);

  const [profile, setProfile] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const loadProfile = async (userId) => {
    if (!userId) {
      setProfile(null);
      return null;
    }

    const {
      data,
      error,
    } = await supabase
      .from("profiles")
      .select("id, full_name, phone, role")
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      console.error(
        "Profile load error:",
        {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
          status: error.status,
        }
      );

      setProfile(null);

      return null;
    }

    setProfile(data);

    return data;
  };

  useEffect(() => {
    let mounted = true;
    let profileTimer;

    const initializeAuth = async () => {
      try {
        const {
          data: { session },
        } =
          await supabase.auth.getSession();

        if (!mounted) return;

        const currentUser =
          session?.user ?? null;

        setUser(currentUser);

        if (currentUser) {
          await loadProfile(
            currentUser.id
          );
        } else {
          setProfile(null);
        }
      } catch (error) {
        console.error(
          "Auth initialization error:",
          error
        );
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    const {
      data: { subscription },
    } =
      supabase.auth.onAuthStateChange(
        (_event, session) => {
          if (!mounted) return;
          const currentUser = session?.user ?? null;
          setUser(currentUser);
          clearTimeout(profileTimer);
          if (!currentUser) {
            setProfile(null);
            setLoading(false);
            return;
          }
          // Query outside the auth callback to avoid holding Supabase's auth lock.
          profileTimer = setTimeout(async () => {
            try {
              if (mounted) await loadProfile(currentUser.id);
            } finally {
              if (mounted) setLoading(false);
            }
          }, 0);
        }
      );

    return () => {
      mounted = false;
      clearTimeout(profileTimer);

      subscription.unsubscribe();
    };
  }, []);

  const register = async ({
    fullName,
    phone,
    email,
    password,
  }) => {
    const {
      data,
      error,
    } = await supabase.auth.signUp({
      email,
      password,

      options: {
        data: {
          full_name: fullName,
          phone,
        },
      },
    });

    if (error) {
      throw error;
    }

    return data;
  };

  const login = async (
    email,
    password
  ) => {
    const {
      data,
      error,
    } =
      await supabase.auth.signInWithPassword(
        {
          email,
          password,
        }
      );

    if (error) {
      throw error;
    }

    return data;
  };

  const logout = async () => {
    const { error } =
      await supabase.auth.signOut();

    if (error) {
      throw error;
    }

    setUser(null);
    setProfile(null);
  };

  const refreshProfile = async () => {
    if (!user) return null;

    return loadProfile(user.id);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        register,
        login,
        logout,
        refreshProfile,
        isAuthenticated: Boolean(user),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context =
    useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider"
    );
  }

  return context;
}

export default AuthContext;