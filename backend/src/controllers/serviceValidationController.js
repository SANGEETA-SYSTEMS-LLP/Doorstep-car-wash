import { validateServiceCompletion } from "../services/serviceValidationService.js";

export async function validateService(req, res) {
  try {
    const booking = await validateServiceCompletion({
      bookingId: req.params.bookingId,
      userId: req.user.id,
      role: req.profile.role,
    });

    return res.json({ success: true, booking });
  } catch (error) {
    console.error("Validate service completion:", error);
    return res.status(error.status || 400).json({
      success: false,
      message: error.message || "Unable to validate service completion.",
    });
  }
}
