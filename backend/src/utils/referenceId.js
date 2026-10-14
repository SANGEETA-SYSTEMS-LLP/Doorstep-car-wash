// Encode all 128 UUID bits; never truncate and never use this ID for authorization.
export function referenceId(kind, userId) {
  const hex = String(userId || "").replaceAll("-", "");
  if (!/^[a-f0-9]{32}$/i.test(hex) || !["CUS", "WSH"].includes(kind)) return null;
  return kind + "-" + BigInt("0x" + hex).toString(36).toUpperCase().padStart(25, "0");
}
