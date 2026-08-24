const test = require("node:test");
const assert = require("node:assert/strict");
const bcrypt = require("bcrypt");

const User = require("../src/models/User");
const VerificationCode = require("../src/models/VerificationCode");
const Cart = require("../src/models/Cart");
const Product = require("../src/models/Product");
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
  moveWishlistItemToCart,
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
    cartFindOne: Cart.findOne,
    cartCreate: Cart.create,
    productFind: Product.find,
  };

  t.after(() => {
    User.findOne = originals.userFindOne;
    User.findById = originals.userFindById;
    VerificationCode.findOne = originals.verificationFindOne;
    VerificationCode.deleteMany = originals.verificationDeleteMany;
    VerificationCode.create = originals.verificationCreate;
    Cart.findOne = originals.cartFindOne;
    Cart.create = originals.cartCreate;
    Product.find = originals.productFind;
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

test("profile update returns friendly conflict when phone unique index wins a race", async (t) => {
  installModelStubs(t);

  User.findOne = async () => null;
  User.findById = async () => ({
    _id: "507f1f77bcf86cd799439011",
    email: "customer@example.com",
    name: "Test Customer",
    phone: "9876543210",
    gender: "",
    dateOfBirth: null,
    profilePictureUrl: "",
    save: async () => {
      const error = new Error("E11000 duplicate key error collection: users index: users_phone_unique_non_empty dup key");
      error.code = 11000;
      error.keyPattern = { phone: 1 };
      throw error;
    },
  });

  const { nextError } = await callController(updateProfile, {
    user: {
      _id: "507f1f77bcf86cd799439011",
      email: "customer@example.com",
    },
    body: {
      name: "Test Customer",
      email: "customer@example.com",
      phone: "+91 98765 43210",
    },
  });

  assert.equal(nextError?.statusCode, 409);
  assert.match(nextError?.message || "", /phone number is already in use/i);
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

test("moving a wishlist item to cart revalidates current product availability", async (t) => {
  installModelStubs(t);

  let cartSaved = false;
  let userSaved = false;
  User.findById = async () => ({
    _id: "507f1f77bcf86cd799439011",
    wishlist: ["507f1f77bcf86cd799439012"],
    save: async () => {
      userSaved = true;
    },
  });
  Cart.findOne = () => ({
    populate: async () => ({
      items: [],
      save: async () => {
        cartSaved = true;
      },
      populate: async () => {},
    }),
  });
  Product.find = async () => [];

  const { nextError } = await callController(moveWishlistItemToCart, {
    user: {
      _id: "507f1f77bcf86cd799439011",
    },
    params: {
      productId: "507f1f77bcf86cd799439012",
    },
    body: {
      quantity: 1,
      size: "M",
      color: "Black",
      fit: "Oversize",
    },
  });

  assert.equal(nextError?.statusCode, 409);
  assert.match(nextError?.message || "", /no longer available/i);
  assert.equal(cartSaved, false);
  assert.equal(userSaved, false);
});

test("moving a wishlist item keeps wishlist unchanged when cart save fails", async (t) => {
  installModelStubs(t);

  let userSaved = false;
  const productId = "507f1f77bcf86cd799439012";
  const user = {
    _id: "507f1f77bcf86cd799439011",
    wishlist: [productId],
    save: async () => {
      userSaved = true;
    },
  };
  User.findById = async () => user;
  Cart.findOne = () => ({
    populate: async () => ({
      items: [],
      save: async () => {
        throw new Error("cart write failed");
      },
      populate: async () => {},
    }),
  });
  Product.find = async () => [
    {
      _id: { toString: () => productId },
      name: "Wishlist Tee",
      status: "Active",
      price: 999,
      pricePaise: 99900,
      sizes: ["M"],
      colors: ["Black"],
      images: ["https://example.com/wishlist.jpg"],
      trackInventory: true,
      variants: [
        {
          sku: "HRU-WISHLIST-M-BLK",
          size: "M",
          color: "Black",
          fit: "Oversize",
          stock: 1,
          reserved: 0,
          active: true,
        },
      ],
    },
  ];

  const { nextError } = await callController(moveWishlistItemToCart, {
    user: {
      _id: "507f1f77bcf86cd799439011",
    },
    params: {
      productId,
    },
    body: {
      quantity: 1,
      size: "M",
      color: "Black",
      fit: "Oversize",
    },
  });

  assert.match(nextError?.message || "", /cart write failed/i);
  assert.equal(userSaved, false);
  assert.deepEqual(user.wishlist, [productId]);
});
