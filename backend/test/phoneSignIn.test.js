const test = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");

const User = require("../src/models/User");
const Cart = require("../src/models/Cart");
const mailer = require("../src/utils/mailer");
const firebaseIdToken = require("../src/utils/firebaseIdToken");

mailer.sendEmail = async () => ({ delivered: true });

const { phoneSignIn } = require("../src/controllers/authController");

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

const call = async (req) => {
  const res = buildResponse();
  let error;
  await phoneSignIn(req, res, (nextError) => {
    error = nextError;
  });
  return { res, error };
};

const customer = (extra = {}) => ({
  _id: "507f1f77bcf86cd799439011",
  role: "customer",
  tokenVersion: 0,
  addresses: [],
  preferences: {},
  communicationPreferences: {},
  wishlist: [],
  save: async () => {},
  ...extra,
});

function stubAll(t) {
  const originals = {
    verify: firebaseIdToken.verifyFirebasePhoneToken,
    findOne: User.findOne,
    create: User.create,
    cart: Cart.create,
  };
  t.after(() => {
    firebaseIdToken.verifyFirebasePhoneToken = originals.verify;
    User.findOne = originals.findOne;
    User.create = originals.create;
    Cart.create = originals.cart;
  });
  firebaseIdToken.verifyFirebasePhoneToken = async () => ({ phoneNumber: "+919876543210", uid: "uid-1" });
  Cart.create = async () => ({});
}

test("known phone signs straight in", async (t) => {
  stubAll(t);
  let query;
  User.findOne = async (filter) => {
    query = filter;
    return customer({ name: "Asha", email: "asha@example.com", phone: "9876543210" });
  };

  const { res, error } = await call({ body: { idToken: "token" } });

  assert.ifError(error);
  assert.deepEqual(query, { phone: "9876543210" });
  assert.equal(res.body.user.email, "asha@example.com");
  assert.equal(res.cookies[0].name, "token");
});

test("new phone asks for a profile before creating an account", async (t) => {
  stubAll(t);
  User.findOne = async () => null;
  User.create = async () => {
    throw new Error("should not create yet");
  };

  const { res, error } = await call({ body: { idToken: "token" } });

  assert.ifError(error);
  assert.deepEqual(res.body, { needsProfile: true, phone: "9876543210" });
  assert.equal(res.cookies.length, 0);
});

test("new phone with name and email creates a verified account", async (t) => {
  stubAll(t);
  User.findOne = async () => null;
  let created;
  User.create = async (payload) => {
    created = payload;
    return customer(payload);
  };

  const { res, error } = await call({ body: { idToken: "token", name: "Ravi K", email: "Ravi@Example.com" } });

  assert.ifError(error);
  assert.equal(res.statusCode, 201);
  assert.equal(created.phone, "9876543210");
  assert.equal(created.email, "ravi@example.com");
  assert.equal(created.isVerified, true);
  assert.ok(created.password.startsWith("$2"), "stores an unusable hashed password");
});

test("admin phone numbers are refused here", async (t) => {
  stubAll(t);
  User.findOne = async () => customer({ role: "admin", email: "admin@example.com", phone: "9876543210" });

  const { error } = await call({ body: { idToken: "token" } });

  assert.equal(error?.statusCode, 403);
});

test("firebase tokens are checked for signature, project and phone", async () => {
  const { privateKey, publicKey } = crypto.generateKeyPairSync("rsa", { modulusLength: 2048 });
  const pem = publicKey.export({ type: "spki", format: "pem" });
  const sign = (claims, project = "hrushe-test") =>
    jwt.sign({ phone_number: "+919876543210", ...claims }, privateKey, {
      algorithm: "RS256",
      keyid: "k1",
      audience: project,
      issuer: `https://securetoken.google.com/${project}`,
      subject: "uid-1",
      expiresIn: "5m",
    });
  const options = { projectId: "hrushe-test", getCerts: async () => ({ k1: pem }) };

  const ok = await firebaseIdToken.verifyFirebasePhoneToken(sign({}), options);
  assert.equal(ok.phoneNumber, "+919876543210");

  await assert.rejects(firebaseIdToken.verifyFirebasePhoneToken(sign({}, "someone-else"), options), { statusCode: 401 });
  await assert.rejects(firebaseIdToken.verifyFirebasePhoneToken(sign({ phone_number: undefined }), options), { statusCode: 401 });
  await assert.rejects(firebaseIdToken.verifyFirebasePhoneToken("not-a-token", options), { statusCode: 401 });
  await assert.rejects(firebaseIdToken.verifyFirebasePhoneToken(sign({}), { ...options, projectId: "" }), { statusCode: 503 });
});
