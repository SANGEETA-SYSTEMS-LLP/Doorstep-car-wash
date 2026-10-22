export function errorMiddleware(error, req, res, next) {
  if (res.headersSent) return next(error);
  const status = Number.isInteger(error.status) && error.status >= 400 && error.status < 600 ? error.status : error.code === "23505" ? 409 : error.code === "23503" ? 400 : 500;
  // Keep request bodies, provider responses, SQL text, and secrets out of logs.
  console.error("API request failed", {
    method: req.method,
    path: req.path,
    status,
    code: typeof error.code === "string" ? error.code : undefined,
    name: typeof error.name === "string" ? error.name : "Error",
  });
  const databaseError = typeof error.code === "string" && (/^[0-9A-Z]{5}$/.test(error.code) || /^PGRST\d+$/.test(error.code));
  const message = status >= 500 || databaseError
    ? "Unable to complete this request. Please try again."
    : error.code === "23505"
      ? "A matching record already exists."
      : error.code === "23503"
        ? "A referenced record is unavailable."
        : error.message;
  return res.status(status).json({ success: false, message });
}
