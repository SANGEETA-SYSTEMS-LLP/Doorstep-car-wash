import multer from "multer";

const storage =
  multer.memoryStorage();

const fileFilter = (
  req,
  file,
  callback
) => {
  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/webp",
  ];

  if (
    !allowedTypes.includes(
      file.mimetype
    )
  ) {
    return callback(
      new Error(
        "Only JPG, PNG and WEBP images are allowed."
      )
    );
  }

  callback(null, true);
};

export const uploadServicePhotos =
  multer({
    storage,

    fileFilter,

    limits: {
      fileSize:
        5 * 1024 * 1024,

      files: 5,
      fields: 4,
      parts: 9,
    },
  });

export function validateServicePhotoSignatures(req, res, next) {
  const isJpeg = (buffer) => buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  const isPng = (buffer) => buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  const isWebp = (buffer) => buffer.length >= 12 && buffer.toString("ascii", 0, 4) === "RIFF" && buffer.toString("ascii", 8, 12) === "WEBP";
  const valid = (file) => {
    const buffer = file.buffer;
    if (!Buffer.isBuffer(buffer)) return false;
    if (file.mimetype === "image/jpeg") return isJpeg(buffer);
    if (file.mimetype === "image/png") return isPng(buffer);
    if (file.mimetype === "image/webp") return isWebp(buffer);
    return false;
  };

  if ((req.files || []).some((file) => !valid(file))) {
    return res.status(400).json({ success: false, message: "An uploaded file is not a valid JPG, PNG, or WEBP image." });
  }

  const allowedFields = new Set(["type"]);
  if (Object.keys(req.body || {}).some((field) => !allowedFields.has(field))) {
    return res.status(400).json({ success: false, message: "Unexpected upload form field." });
  }

  next();
}
