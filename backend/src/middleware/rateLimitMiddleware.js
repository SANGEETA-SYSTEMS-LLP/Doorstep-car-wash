import { ipKeyGenerator, rateLimit } from "express-rate-limit";

function limiter({ windowMs, limit, message, skipSuccessfulRequests = false, byUser = false }) {
  return rateLimit({
    windowMs,
    limit,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    skipSuccessfulRequests,
    ...(byUser ? { keyGenerator: req => req.user?.id ? `user:${req.user.id}` : `ip:${ipKeyGenerator(req.ip)}` } : {}),
    message: { success: false, message },
  });
}

// These process-local limits are a baseline for one API instance. Production
// deployments with multiple instances must also enforce limits at the edge.
export const apiRateLimit = limiter({
  windowMs: 15 * 60 * 1000,
  limit: 600,
  message: "Too many requests. Please wait and try again.",
});

export const pageViewRateLimit = limiter({
  windowMs: 15 * 60 * 1000,
  limit: 120,
  message: "Too many page view events. Please wait and try again.",
});

export const authAttemptRateLimit = limiter({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  message: "Too many authentication attempts. Please wait and try again.",
});

export const authAbuseRateLimit = limiter({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  message: "Too many sign-in or password-reset attempts. Please wait and try again.",
});

export const publicLookupRateLimit = limiter({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  message: "Too many address lookups. Please wait before searching again.",
});

export const paymentActionRateLimit = limiter({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  message: "Too many payment requests. Please wait and try again.",
  byUser: true,
});

export const payoutDetailsRateLimit = limiter({
  windowMs: 60 * 60 * 1000,
  limit: 10,
  message: "Too many payout detail changes. Please wait and try again.",
  byUser: true,
});

export const adminMutationRateLimit = limiter({
  windowMs: 15 * 60 * 1000,
  limit: 60,
  message: "Too many administrative changes. Please wait and try again.",
  byUser: true,
});
