export const PRIMARY_ADMIN_EMAIL = "ssadmin@sangeetasystems.com";
export const STAFF_ROLE_EMAILS = Object.freeze({
  super_admin: PRIMARY_ADMIN_EMAIL,
  sub_admin: "atalari04@gmail.com",
  accountant: "supportsstech@gmail.com",
});

export function isPrimaryAdminEmail(email) {
  return typeof email === "string" && email.trim().toLowerCase() === PRIMARY_ADMIN_EMAIL;
}

export function isConfiguredStaffEmail(role, email) {
  const expected = STAFF_ROLE_EMAILS[role];
  return typeof email === "string" && typeof expected === "string" && email.trim().toLowerCase() === expected;
}
