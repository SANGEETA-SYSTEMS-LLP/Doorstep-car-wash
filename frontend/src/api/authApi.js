import { supabase } from "../services/auth/supabase";
export const signIn = (email, password) => supabase.auth.signInWithPassword({ email, password });
export const signOut = () => supabase.auth.signOut();
export const requestPasswordReset = email => supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin + "/reset-password" });
