const otpStore = new Map();

exports.saveOtp = (phone, otp) => {
  otpStore.set(phone, {
    otp,
    expiresAt: Date.now() + 5 * 60 * 1000, // 5 minutes
  });
};

exports.verifyOtp = (phone, otp) => {
  const data = otpStore.get(phone);

  if (!data) return false;
  if (Date.now() > data.expiresAt) return false;

  const isValid = data.otp === otp;

  if (isValid) otpStore.delete(phone);

  return isValid;
};
