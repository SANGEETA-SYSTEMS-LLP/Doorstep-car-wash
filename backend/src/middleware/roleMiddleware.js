export function allowRoles(
  ...allowedRoles
) {
  return (req, res, next) => {
    if (!req.profile) {
      return res.status(401).json({
        message:
          "Authentication required.",
      });
    }

    const localTestMode =
      process.env.NODE_ENV === "development" &&
      process.env.TEST_MODE === "true" &&
      ["127.0.0.1", "::1", "::ffff:127.0.0.1"].includes(
        req.socket?.remoteAddress
      );

    if (
      !localTestMode &&
      !allowedRoles.includes(req.profile.role)
    ) {
      return res.status(403).json({
        message:
          "You do not have permission to perform this action.",
      });
    }

    next();
  };
}