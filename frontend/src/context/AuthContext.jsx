import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

import { supabase } from "../services/auth/supabase";
import { apiRequest } from "../api/apiClient";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] =
    useState(null);

  const [profile, setProfile] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [profileError, setProfileError] = useState(null);
  const profileRequest = useRef(0);
  const activeUserId = useRef(null);

  const loadProfile = async (userId) => {
    const requestId = ++profileRequest.current;
    setProfileError(null);
    if (!userId) {
      setProfile(null);
      return null;
    }

    try {
      const data = await apiRequest("/account/profile");
      if (requestId !== profileRequest.current || activeUserId.current !== userId) return null;
      if (!data?.profile || data.profile.id !== userId) throw new Error("The server could not load your account profile.");
      setProfile(data.profile);
      return data.profile;
    } catch (error) {
      if (requestId !== profileRequest.current || activeUserId.current !== userId) return null;
      setProfileError(error instanceof TypeError
        ? "Cannot connect to the server. Check your connection and make sure the backend is running, then retry."
        : error.message);
      setProfile(null);
      return null;
    }
  };

  useEffect(() => {
    let mounted = true;
    let profileTimer;
    let handledUserId;

    const {
      data: { subscription },
    } =
      supabase.auth.onAuthStateChange(
        (event, session) => {
          if (!mounted) return;
          const currentUser = session?.user ?? null;
          const userId = currentUser?.id ?? null;
          // INITIAL_SESSION supplies startup state. Focus/sign-in and token
          // refresh events for the same user must not start another profile query.
          if (handledUserId === userId && event !== "USER_UPDATED") return;
          handledUserId = userId;
          if (activeUserId.current !== (currentUser?.id ?? null)) {
            ++profileRequest.current;
            setProfile(null);
          }
          activeUserId.current = currentUser?.id ?? null;
          setUser(currentUser);
          clearTimeout(profileTimer);
          if (!currentUser) {
            setProfile(null);
            setProfileError(null);
            setLoading(false);
            return;
          }
          setLoading(true);
          // Query outside the auth callback to avoid holding Supabase's auth lock.
          profileTimer = setTimeout(async () => {
            try {
              if (mounted) await loadProfile(currentUser.id);
            } finally {
              if (mounted && activeUserId.current === currentUser.id) setLoading(false);
            }
          }, 0);
        }
      );

    return () => {
      mounted = false;
      ++profileRequest.current;
      clearTimeout(profileTimer);

      subscription.unsubscribe();
    };
  }, []);

  const register = async ({
    fullName,
    phone,
    email,
    password,
    requestedRole = "customer",
    signupAddress = null,
  }) => {
    const {
      data,
      error,
    } = await supabase.auth.signUp({
      email,
      password,

      options: {
        data: {
          signup_address: requestedRole === "customer" ? signupAddress : null,
          washer_signup_location: requestedRole === "washer" ? signupAddress : null,
          full_name: fullName,
          phone,
          requested_role: ["supervisor", "washer"].includes(requestedRole) ? requestedRole : "customer",
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
    setLoading(true);
    try { return await loadProfile(user.id); }
    finally { setLoading(false); }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        profileError,
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
