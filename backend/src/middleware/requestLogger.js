import crypto from "node:crypto";

function safePath(path) {
  return String(path || "/")
    .slice(0, 300)
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, ":email")
    .replace(/[0-9a-f]{8}-[0-9a-f-]{27,}/gi, ":id")
    .replace(/WSH-[0-9A-Z]{10,}/gi, ":washerId")
    .replace(/\/\d{6,}(?=\/|$)/g, "/:id")
    .replace(/\/[A-Za-z0-9_-]{24,}(?=\/|$)/g, "/:id");
}

export function requestLogger(req, res, next) {
  const startedAt = process.hrtime.bigint();
  req.requestId = crypto.randomUUID();
  req.logPath = safePath(req.path);
  res.setHeader("X-Request-Id", req.requestId);

  res.once("finish", () => {
    const durationMs = Number(process.hrtime.bigint() - startedAt) / 1e6;
    console.info(JSON.stringify({
      event: "http_request",
      request_id: req.requestId,
      method: req.method,
      path: req.logPath,
      status: res.statusCode,
      duration_ms: Number(durationMs.toFixed(2)),
      ...(req.user?.id ? { user_id: req.user.id } : {}),
      ...(req.profile?.role ? { role: req.profile.role } : {}),
    }));
  });

  next();
}
