export function matchesWasherLocation(address, query) {
  const normalize = value => String(value || "").normalize("NFKC").toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
  const tokens = normalize(query).split(/\s+/).filter(Boolean);
  const saved = normalize(address);
  return tokens.every(token => saved.includes(token));
}
