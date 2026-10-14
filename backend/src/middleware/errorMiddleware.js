export function errorMiddleware(error, req, res, next) {
  if (res.headersSent) return next(error);
  console.error(req.method, req.path, error);
  const status = Number.isInteger(error.status) && error.status >= 400 && error.status < 600 ? error.status : error.code === "23505" ? 409 : error.code === "23503" ? 400 : 500;
  const message = status === 500 ? "Unable to complete this request. Please try again." : error.code === "23505" ? "A matching record already exists." : error.code === "23503" ? "A referenced record is unavailable." : error.message;
  return res.status(status).json({ success: false, message });
}
