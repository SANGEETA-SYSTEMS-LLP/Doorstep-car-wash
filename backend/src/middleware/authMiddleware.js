import {
  supabaseAuth,
  supabaseAdmin,
} from "../config/supabase.js";
import { reconcileWasherSignup } from "../services/washer/washerSignupService.js";

export async function requireAuth(
  req,
  res,
  next
) {
  try {
    const authorization =
      req.headers.authorization;

    if (
      !authorization ||
      !authorization.startsWith(
        "Bearer "
      )
    ) {
      return res.status(401).json({
        message:
          "Authentication required.",
      });
    }

    const accessToken =
      authorization.replace(
        "Bearer ",
        ""
      );

    const {
      data: { user },
      error,
    } =
      await supabaseAuth.auth.getUser(
        accessToken
      );

    if (error && (!error.status || error.status >= 500)) {
      console.error("Supabase Auth unavailable:", {
        name: error.name,
        status: error.status,
        code: error.code,
        message: error.message,
      });
      return res.status(503).json({message: "Authentication service unavailable. Please try again shortly."});
    }
    if (error || !user) {
      return res.status(401).json({
        message:
          "Invalid or expired session.",
      });
    }

    const {
      data: profile,
      error: profileError,
    } = await supabaseAdmin
      .from("profiles")
      .select(
        "id, full_name, phone, role, is_active"
      )
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) {
      console.error("Profile lookup failed:", profileError.code, profileError.message);
      return res.status(503).json({ message: "Your profile could not be loaded. Please try again shortly." });
    }
    if (!profile) {
      return res.status(404).json({
        message:
          "Application profile not found.",
      });
    }
    if (profile.is_active === false) {
      return res.status(403).json({ message: "This account is inactive. Contact support for help." });
    }

    req.user = user;
    req.profile = await reconcileWasherSignup(user, profile);

    next();
  } catch (error) {
    console.error(
      "Authentication middleware:",
      error
    );

    return res.status(500).json({
      message:
        "Authentication failed.",
    });
  }
}
