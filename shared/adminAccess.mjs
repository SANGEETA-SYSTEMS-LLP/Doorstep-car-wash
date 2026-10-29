export const PRIMARY_ADMIN_EMAIL = "ssadmin@sangeetasystems.com";

export function isPrimaryAdminEmail(email) {
  return typeof email === "string" && email.trim().toLowerCase() === PRIMARY_ADMIN_EMAIL;
}
