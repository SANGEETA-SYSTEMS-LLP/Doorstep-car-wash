const otpStore =
  new Map();

export function storeOtp(
  bookingId,
  otp
) {
  const expiresAt =
    Date.now() +
    15 * 60 * 1000;

  otpStore.set(
    bookingId,
    {
      otp,
      expiresAt,
    }
  );
}

export function getOtp(
  bookingId
) {
  const record =
    otpStore.get(
      bookingId
    );

  if (!record) {
    return null;
  }

  if (
    Date.now() >
    record.expiresAt
  ) {
    otpStore.delete(
      bookingId
    );

    return null;
  }

  return record.otp;
}

export function deleteOtp(
  bookingId
) {
  otpStore.delete(
    bookingId
  );
}