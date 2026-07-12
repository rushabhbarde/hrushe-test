const bcrypt = require("bcrypt");
const crypto = require("crypto");
const VerificationCode = require("../models/VerificationCode");
const AppError = require("./AppError");

const OTP_EXPIRY_MINUTES = 10;
const OTP_REQUEST_COOLDOWN_MS = 60 * 1000;
const OTP_MAX_FAILED_ATTEMPTS = 5;
const OTP_HASH_ROUNDS = 10;
const OTP_GENERIC_ERROR = "OTP is invalid or expired. Please request a new one.";

const generateOtp = () => String(crypto.randomInt(100000, 1000000));

const normalizeEmail = (value) => String(value || "").trim().toLowerCase();

function buildOtpQuery({ email, purpose, userId }) {
  const query = {
    email: normalizeEmail(email),
    purpose,
  };

  if (userId !== undefined) {
    query.userId = userId;
  }

  return query;
}

async function createOtpVerification({ email, purpose, userId = null }) {
  const normalizedEmail = normalizeEmail(email);
  const baseQuery = buildOtpQuery({
    email: normalizedEmail,
    purpose,
    ...(userId ? { userId } : {}),
  });
  const recentOtp = await VerificationCode.findOne({
    ...baseQuery,
    createdAt: { $gt: new Date(Date.now() - OTP_REQUEST_COOLDOWN_MS) },
  });

  if (recentOtp) {
    throw new AppError("Please wait a minute before requesting another OTP", 429);
  }

  const otp = generateOtp();
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  await VerificationCode.deleteMany(baseQuery);
  const verification = await VerificationCode.create({
    ...baseQuery,
    userId,
    codeHash: await bcrypt.hash(otp, OTP_HASH_ROUNDS),
    expiresAt,
    failedAttempts: 0,
    lockedAt: null,
  });

  return {
    otp,
    verification,
    expiresAt,
    expiresInMinutes: OTP_EXPIRY_MINUTES,
  };
}

async function deleteOtpVerifications({ email, purpose, userId }) {
  return VerificationCode.deleteMany(
    buildOtpQuery({
      email,
      purpose,
      ...(userId ? { userId } : {}),
    })
  );
}

async function verifyOtpCode({ email, purpose, otp, userId }) {
  const query = buildOtpQuery({
    email,
    purpose,
    ...(userId ? { userId } : {}),
  });
  const verification = await VerificationCode.findOne(query).sort({ createdAt: -1 });

  if (!verification || verification.lockedAt) {
    throw new AppError(OTP_GENERIC_ERROR, 400);
  }

  if (verification.expiresAt.getTime() < Date.now()) {
    await VerificationCode.deleteMany(query);
    throw new AppError(OTP_GENERIC_ERROR, 400);
  }

  const isOtpValid = await bcrypt.compare(String(otp || "").trim(), verification.codeHash);

  if (!isOtpValid) {
    verification.failedAttempts = Number(verification.failedAttempts || 0) + 1;
    if (verification.failedAttempts >= OTP_MAX_FAILED_ATTEMPTS) {
      verification.lockedAt = new Date();
    }
    await verification.save();
    throw new AppError(OTP_GENERIC_ERROR, 400);
  }

  return verification;
}

module.exports = {
  OTP_EXPIRY_MINUTES,
  OTP_GENERIC_ERROR,
  OTP_MAX_FAILED_ATTEMPTS,
  OTP_REQUEST_COOLDOWN_MS,
  createOtpVerification,
  deleteOtpVerifications,
  normalizeEmail,
  verifyOtpCode,
};
