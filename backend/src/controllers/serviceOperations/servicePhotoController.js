import crypto from "node:crypto";

import {
  supabaseAdmin,
} from "../../config/supabase.js";

const SERVICE_PHOTO_BUCKET = "service-photos";

async function getWasher(userId) {
  const {
    data,
    error,
  } = await supabaseAdmin
    .from("washers")
    .select("id, user_id, is_active")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    throw new Error(
      "Washer profile not found."
    );
  }
  if (data.is_active === false) {
    throw new Error("Washer account is inactive.");
  }

  return data;
}

async function getAssignedBooking(bookingId, washerId) {
  const { data, error } = await supabaseAdmin
    .from("bookings")
    .select("id, assigned_washer_id, status")
    .eq("id", bookingId)
    .eq("assigned_washer_id", washerId)
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error("Assigned booking not found.");
  return data;
}

export async function getSignedServicePhotos(bookingId) {
  const { data: photos, error } = await supabaseAdmin
    .from("booking_service_photos")
    .select("id, photo_type, photo_url, created_at")
    .eq("booking_id", bookingId)
    .order("created_at", { ascending: true });

  if (error) throw error;

  return Promise.all((photos || []).map(async (photo) => {
    // Only our generated booking-scoped object paths are eligible for signing.
    // Never return a persisted arbitrary URL to the browser.
    if (typeof photo.photo_url !== "string" || !/^[-\w]+\/(before|after)\/[\w.-]+\.(jpg|png|webp)$/i.test(photo.photo_url)) {
      return null;
    }

    const { data, error: signedUrlError } = await supabaseAdmin.storage
      .from(SERVICE_PHOTO_BUCKET)
      .createSignedUrl(photo.photo_url, 60 * 10);

    if (signedUrlError) throw signedUrlError;
    return { ...photo, url: data.signedUrl };
  })).then((signedPhotos) => signedPhotos.filter(Boolean));
}

export async function uploadPhotos(req, res) {
  try {
    const { bookingId } = req.params;
    const { type } = req.body || {};

    if (!["before", "after"].includes(type)) {
      return res.status(400).json({ message: "Photo type must be before or after." });
    }
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "At least one photo is required." });
    }

    const washer = await getWasher(req.user.id);
    const booking = await getAssignedBooking(bookingId, washer.id);
    if (type === "before" && !["washer_arrived", "otp_verified", "service_started"].includes(booking.status)) {
      return res.status(400).json({ message: "Before photos cannot be uploaded at this stage." });
    }
    if (type === "after" && booking.status !== "service_started") {
      return res.status(400).json({ message: "After photos can only be uploaded during service." });
    }

    const uploadedPhotos = [];

    for (const file of req.files) {
      const extension = getExtension(file.mimetype);
      const fileName = `${Date.now()}-${crypto.randomUUID()}.${extension}`;
      const storagePath = `${bookingId}/${type}/${fileName}`;

      const { error: uploadError } = await supabaseAdmin.storage
        .from(SERVICE_PHOTO_BUCKET)
        .upload(storagePath, file.buffer, {
          contentType: file.mimetype,
          upsert: false,
        });
      if (uploadError) throw uploadError;

      const { data: photo, error: photoError } = await supabaseAdmin
        .from("booking_service_photos")
        .insert({
          booking_id: bookingId,
          photo_type: type,
          photo_url: storagePath,
          uploaded_by: req.user.id,
        })
        .select("*")
        .single();

      if (photoError) {
        await supabaseAdmin.storage.from(SERVICE_PHOTO_BUCKET).remove([storagePath]);
        throw photoError;
      }

      uploadedPhotos.push(photo);
    }

    return res.json({ success: true, photos: uploadedPhotos });
  } catch (error) {
    console.error("Service photo upload failed", {
      name: error?.name || "Error",
      code: typeof error?.code === "string" ? error.code : undefined,
    });
    return res.status(400).json({
      success: false,
      message: "Unable to upload photos. Please check the booking and try again.",
    });
  }
}

function getExtension(mimeType) {
  switch (mimeType) {
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    default:
      return "jpg";
  }
}
