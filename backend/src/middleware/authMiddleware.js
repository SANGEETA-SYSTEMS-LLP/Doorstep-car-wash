import {
  supabaseAuth,
  supabaseAdmin,
} from "../config/supabase.js";

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
        "id, full_name, phone, role"
      )
      .eq("id", user.id)
      .maybeSingle();

    if (
      profileError ||
      !profile
    ) {
      return res.status(403).json({
        message:
          "Application profile not found.",
      });
    }

    req.user = user;
    req.profile = profile;

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