import { supabase } from "../services/auth/supabase";
import { getPasswordResetRedirectUrl } from "../services/auth/passwordResetUrl";
export const signIn = (email, password) => supabase.auth.signInWithPassword({ email, password });
export const signOut = () => supabase.auth.signOut();
export const requestPasswordReset = email => supabase.auth.resetPasswordForEmail(email, { redirectTo: getPasswordResetRedirectUrl() });
