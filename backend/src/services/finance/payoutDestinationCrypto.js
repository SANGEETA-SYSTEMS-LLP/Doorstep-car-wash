import crypto from "node:crypto";

function encryptionKey() {
  const configuredKey = process.env.PAYOUT_DATA_ENCRYPTION_KEY;
  if (configuredKey) {
    const key = Buffer.from(configuredKey, "base64");
    if (key.length !== 32) throw new Error("Payout data encryption key must be a base64-encoded 32-byte key.");
    return key;
  }
  const rootSecret = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!rootSecret) throw new Error("Payout data encryption is unavailable.");
  return Buffer.from(crypto.hkdfSync("sha256", rootSecret, "washnow-payout-destination", "washer-payout-v1", 32));
}

export function encryptPayoutDestination(destination) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(JSON.stringify(destination), "utf8"), cipher.final()]);
  return JSON.stringify({ version: 1, iv: iv.toString("base64"), tag: cipher.getAuthTag().toString("base64"), data: ciphertext.toString("base64") });
}

export function decryptPayoutDestination(value) {
  try {
    const stored = JSON.parse(value);
    if (stored.version !== 1) throw new Error("Unsupported encrypted payout data version.");
    const decipher = crypto.createDecipheriv("aes-256-gcm", encryptionKey(), Buffer.from(stored.iv, "base64"));
    decipher.setAuthTag(Buffer.from(stored.tag, "base64"));
    const plaintext = Buffer.concat([decipher.update(Buffer.from(stored.data, "base64")), decipher.final()]).toString("utf8");
    return JSON.parse(plaintext);
  } catch {
    throw Object.assign(new Error("Saved payout details cannot be decrypted. Contact the platform administrator."), { status: 503 });
  }
}
