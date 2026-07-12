const test = require("node:test");
const assert = require("node:assert/strict");
const bcrypt = require("bcrypt");

const User = require("../src/models/User");
const VerificationCode = require("../src/models/VerificationCode");
const mailer = require("../src/utils/mailer");
const auditLog = require("../src/utils/auditLog");

const sentEmails = [];
const recordedAudits = [];

mailer.sendEmail = async (payload) => {
  sentEmails.push(payload);
  return { delivered: true };
};
auditLog.recordAuditLog = async (...args) => {
  recordedAudits.push(args);
};

const {
  updateProfile,
  requestEmailChangeOtp,
  verifyEmailChangeOtp,
} = require("../src/controllers/accountController");

const buildResponse = () => ({
  cookies: [],
  clearedCookies: [],
  statusCode: 200,
  body: null,
  cookie(name, value, options) {
    this.cookies.push({ name, value, options });
    return this;
  },
  clearCookie(name, options) {
    this.clearedCookies.push({ name, options });
    return this;
  },
  status(statusCode) {
    this.statusCode = statusCode;
    return this;
  },
  json(body) {
    this.body = body;
    return this;
  },
});

const callController = async (handler, req, res = buildResponse()) => {
  let nextError;
  await handler(req, res, (error) => {
    nextError = error;
  });
  return { res, nextError };
};

const installModelStubs = (t) => {
  const originals = {
    userFindOne: User.findOne,
    userFindById: User.findById,
    verificationFindOne: VerificationCode.findOne,
    verificationDeleteMany: VerificationCode.deleteMany,
    verificationCreate: VerificationCode.create,
  };

  t.after(() => {
    User.findOne = originals.userFindOne;
    User.findById = originals.userFindById;
    VerificationCode.findOne = originals.verificationFindOne;
    VerificationCode.deleteMany = originals.verificationDeleteMany;
    VerificationCode.create = originals.verificationCreate;
    sentEmails.length = 0;
    recordedAudits.length = 0;
  });
};

test("profile updates reject direct email changes", async (t) => {
  installModelStubs(t);

  const { nextError } = await callController(updateProfile, {
    user: {
      _id: "507f1f77bcf86cd799439011",
      email: "old@example.com",
    },
    body: {
      name: "Test Customer",
      email: "new@example.com",
      phone: "9876543210",
    },
  });

  assert.equal(nextError?.statusCode, 400);
  assert.match(nextError?.message, /email changes require otp/i);
});

test("requesting an email change OTP stores a hashed code and sends mail", async (t) => {
  installModelStubs(t);

  let createdVerification;
  User.findOne = async () => null;
  VerificationCode.findOne = async () => null;
  VerificationCode.deleteMany = async () => ({ deletedCount: 0 });
  VerificationCode.create = async (payload) => {
    createdVerification = payload;
    return payload;
  };

  const { res, nextError } = await callController(requestEmailChangeOtp, {
    user: {
      _id: "507f1f77bcf86cd799439011",
      email: "old@example.com",
    },
    body: {
      newEmail: "  New@Example.com ",
    },
  });

  assert.ifError(nextError);
  assert.equal(res.body.message, "If this email can be used, an OTP has been sent.");
  assert.equal(res.body.expiresInMinutes, 10);
  assert.equal(createdVerification.email, "new@example.com");
  assert.equal(createdVerification.purpose, "email-change");
  assert.notEqual(createdVerification.codeHash, undefined);
  assert.equal(await bcrypt.compare(sentEmails[0].mergeInfo.otp, createdVerification.codeHash), true);
  assert.equal(sentEmails[0].to, "new@example.com");
});

test("verifying an email change OTP updates the account and clears auth cookies", async (t) => {
  installModelStubs(t);

  const verification = {
    codeHash: await bcrypt.hash("123456", 10),
    expiresAt: new Date(Date.now() + 60_000),
    failedAttempts: 0,
    lockedAt: null,
    save: async () => {},
  };
  const user = {
    _id: "507f1f77bcf86cd799439011",
    email: "old@example.com",
    tokenVersion: 2,
    save: async () => {},
  };

  User.findOne = async () => null;
  User.findById = async () => user;
  VerificationCode.findOne = () => ({
    sort: async () => verification,
  });
  VerificationCode.deleteMany = async () => ({ deletedCount: 1 });

  const { res, nextError } = await callController(verifyEmailChangeOtp, {
    user: {
      _id: "507f1f77bcf86cd799439011",
      email: "old@example.com",
    },
    body: {
      newEmail: "new@example.com",
      otp: "123456",
    },
  });

  assert.ifError(nextError);
  assert.equal(user.email, "new@example.com");
  assert.equal(user.isVerified, true);
  assert.equal(user.tokenVersion, 3);
  assert.ok(user.emailVerifiedAt instanceof Date);
  assert.equal(res.body.message, "Email changed successfully. Please sign in again with your new email.");
  assert.ok(res.clearedCookies.some((cookie) => cookie.name === "token"));
  assert.ok(res.clearedCookies.some((cookie) => cookie.name === "hrushe-csrf"));
  assert.equal(recordedAudits.length, 1);
});

test("email change OTP locks after too many failed attempts", async (t) => {
  installModelStubs(t);

  let saved = false;
  const verification = {
    codeHash: await bcrypt.hash("123456", 10),
    expiresAt: new Date(Date.now() + 60_000),
    failedAttempts: 4,
    lockedAt: null,
    save: async () => {
      saved = true;
    },
  };

  VerificationCode.findOne = () => ({
    sort: async () => verification,
  });

  const { nextError } = await callController(verifyEmailChangeOtp, {
    user: {
      _id: "507f1f77bcf86cd799439011",
      email: "old@example.com",
    },
    body: {
      newEmail: "new@example.com",
      otp: "000000",
    },
  });

  assert.equal(nextError?.statusCode, 400);
  assert.match(nextError?.message, /otp is invalid or expired/i);
  assert.equal(verification.failedAttempts, 5);
  assert.ok(verification.lockedAt instanceof Date);
  assert.equal(saved, true);
});
