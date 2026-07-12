const test = require("node:test");
const assert = require("node:assert/strict");
const bcrypt = require("bcrypt");

const User = require("../src/models/User");
const Cart = require("../src/models/Cart");
const VerificationCode = require("../src/models/VerificationCode");
const mailer = require("../src/utils/mailer");

mailer.sendEmail = async () => ({ delivered: true });

const {
  signup,
  updateMe,
  requestPasswordResetOtp,
  resetPasswordWithOtp,
} = require("../src/controllers/authController");

const buildResponse = () => ({
  cookies: [],
  statusCode: 200,
  body: null,
  cookie(name, value, options) {
    this.cookies.push({ name, value, options });
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

test("public signup creates a verified user after matching OTP", async (t) => {
  const originals = {
    userFindOne: User.findOne,
    userCreate: User.create,
    cartCreate: Cart.create,
    verificationFindOne: VerificationCode.findOne,
    verificationDeleteMany: VerificationCode.deleteMany,
  };

  t.after(() => {
    User.findOne = originals.userFindOne;
    User.create = originals.userCreate;
    Cart.create = originals.cartCreate;
    VerificationCode.findOne = originals.verificationFindOne;
    VerificationCode.deleteMany = originals.verificationDeleteMany;
  });

  User.findOne = async () => null;
  User.create = async (payload) => ({
    _id: "507f1f77bcf86cd799439011",
    role: "customer",
    tokenVersion: 0,
    addresses: [],
    preferences: {},
    communicationPreferences: {},
    wishlist: [],
    ...payload,
  });
  Cart.create = async () => ({});
  VerificationCode.findOne = () => ({
    sort: async () => ({
      codeHash: await bcrypt.hash("123456", 10),
      expiresAt: new Date(Date.now() + 60_000),
    }),
  });
  VerificationCode.deleteMany = async () => ({ deletedCount: 1 });

  const req = {
    body: {
      name: "Test Customer",
      email: "customer@example.com",
      phone: "9876543210",
      password: "pass1234",
      otp: "123456",
    },
  };
  const res = buildResponse();
  let nextError;

  await signup(req, res, (error) => {
    nextError = error;
  });

  assert.ifError(nextError);
  assert.equal(res.statusCode, 201);
  assert.equal(res.body.message, "User created successfully");
  assert.equal(res.body.user.email, "customer@example.com");
  assert.equal(res.body.user.isVerified, true);
  assert.ok(res.cookies.some((cookie) => cookie.name === "token"));
});

test("legacy auth profile updates reject direct email changes", async (t) => {
  const { nextError } = await callController(updateMe, {
    user: {
      _id: "507f1f77bcf86cd799439011",
      email: "old@example.com",
    },
    body: {
      name: "Test Customer",
      email: "new@example.com",
      phone: "9876543210",
      address: "Pune",
    },
  });

  assert.equal(nextError?.statusCode, 400);
  assert.match(nextError?.message, /email changes require otp/i);
});

test("password reset OTP request stores a hashed verification record", async (t) => {
  const originals = {
    userFindOne: User.findOne,
    verificationFindOne: VerificationCode.findOne,
    verificationDeleteMany: VerificationCode.deleteMany,
    verificationCreate: VerificationCode.create,
  };
  let createdVerification;

  t.after(() => {
    User.findOne = originals.userFindOne;
    VerificationCode.findOne = originals.verificationFindOne;
    VerificationCode.deleteMany = originals.verificationDeleteMany;
    VerificationCode.create = originals.verificationCreate;
  });

  User.findOne = async () => ({
    _id: "507f1f77bcf86cd799439011",
    email: "customer@example.com",
  });
  VerificationCode.findOne = async () => null;
  VerificationCode.deleteMany = async () => ({ deletedCount: 0 });
  VerificationCode.create = async (payload) => {
    createdVerification = payload;
    return payload;
  };

  const { res, nextError } = await callController(requestPasswordResetOtp, {
    body: {
      email: " Customer@Example.com ",
    },
  });

  assert.ifError(nextError);
  assert.equal(res.body.message, "If an account exists, a password reset OTP has been sent.");
  assert.equal(createdVerification.email, "customer@example.com");
  assert.equal(createdVerification.purpose, "password-reset");
  assert.equal(createdVerification.userId, "507f1f77bcf86cd799439011");
  assert.equal(await bcrypt.compare(res.body.devOtp, createdVerification.codeHash), true);
});

test("password reset succeeds with a valid OTP verification record", async (t) => {
  const originals = {
    userFindOne: User.findOne,
    verificationFindOne: VerificationCode.findOne,
    verificationDeleteMany: VerificationCode.deleteMany,
  };
  const user = {
    _id: "507f1f77bcf86cd799439011",
    email: "customer@example.com",
    password: await bcrypt.hash("oldpass1", 10),
    tokenVersion: 1,
    save: async () => {},
  };

  t.after(() => {
    User.findOne = originals.userFindOne;
    VerificationCode.findOne = originals.verificationFindOne;
    VerificationCode.deleteMany = originals.verificationDeleteMany;
  });

  User.findOne = async () => user;
  VerificationCode.findOne = () => ({
    sort: async () => ({
      codeHash: await bcrypt.hash("123456", 10),
      expiresAt: new Date(Date.now() + 60_000),
      failedAttempts: 0,
      lockedAt: null,
      save: async () => {},
    }),
  });
  VerificationCode.deleteMany = async () => ({ deletedCount: 1 });

  const { res, nextError } = await callController(resetPasswordWithOtp, {
    body: {
      email: "customer@example.com",
      otp: "123456",
      newPassword: "newpass1",
    },
  });

  assert.ifError(nextError);
  assert.equal(res.body.message, "Password reset successful");
  assert.equal(user.tokenVersion, 2);
  assert.equal(await bcrypt.compare("newpass1", user.password), true);
});

async function callController(handler, req, res = buildResponse()) {
  let nextError;
  await handler(req, res, (error) => {
    nextError = error;
  });
  return { res, nextError };
}
