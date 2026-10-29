import { isPrimaryAdminEmail } from "../../../shared/adminAccess.mjs";

export function allowRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!req.profile) return res.status(401).json({ message: "Authentication required." });
    if (req.profile.is_active === false) return res.status(403).json({ message: "This account is inactive. Contact support for help." });
    if (!allowedRoles.includes(req.profile.role)) {
      return res.status(403).json({ message: "You do not have permission to perform this action." });
    }
    next();
  };
}

export function restrictSuperAdminToPrimaryEmail(req, res, next) {
  if (req.profile?.role === "super_admin" && !isPrimaryAdminEmail(req.user?.email)) {
    return res.status(403).json({ message: "You do not have permission to access the admin console." });
  }
  next();
}
