export function validateCustomerProfileInput(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw Object.assign(new Error("Profile details are required."), { status: 400 });
  }

  const allowedFields = new Set(["full_name", "phone"]);
  if (Object.keys(body).some((key) => !allowedFields.has(key))) {
    throw Object.assign(new Error("Only name and phone can be updated here."), { status: 400 });
  }

  const fullName = typeof body.full_name === "string" ? body.full_name.trim() : "";
  const phone = typeof body.phone === "string" ? body.phone.trim() : "";
  const phoneDigits = phone.replace(/\D/g, "");

  if (fullName.length < 2 || fullName.length > 120) {
    throw Object.assign(new Error("Name must be between 2 and 120 characters."), { status: 400 });
  }
  if (!/^\+?[0-9\s()-]{7,20}$/.test(phone) || phoneDigits.length < 7 || phoneDigits.length > 15) {
    throw Object.assign(new Error("Enter a valid phone number."), { status: 400 });
  }

  return { full_name: fullName, phone };
}
