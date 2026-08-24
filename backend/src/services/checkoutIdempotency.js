const crypto = require("crypto");
const CheckoutAttempt = require("../models/CheckoutAttempt");
const AppError = require("../utils/AppError");

const IDEMPOTENCY_KEY_MIN_LENGTH = 16;
const IDEMPOTENCY_KEY_MAX_LENGTH = 160;
const IDEMPOTENCY_WAIT_MS = 50;
const IDEMPOTENCY_WAIT_ATTEMPTS = 40;
const SAFE_IDEMPOTENCY_KEY_PATTERN = /^[A-Za-z0-9._:-]+$/;

const sleep = (durationMs) =>
  new Promise((resolve) => {
    setTimeout(resolve, durationMs);
  });

function sha256(value) {
  return crypto.createHash("sha256").update(String(value)).digest("hex");
}

function stableStringify(value) {
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(",")}]`;
  }

  if (value && typeof value === "object") {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`)
      .join(",")}}`;
  }

  return JSON.stringify(value);
}

function normalizeIdempotencyKey(value) {
  const key = String(value || "").trim();

  if (
    key.length < IDEMPOTENCY_KEY_MIN_LENGTH ||
    key.length > IDEMPOTENCY_KEY_MAX_LENGTH ||
    !SAFE_IDEMPOTENCY_KEY_PATTERN.test(key)
  ) {
    throw new AppError("Checkout idempotency key is invalid.", 400);
  }

  return key;
}

function isDuplicateKeyError(error) {
  return error?.code === 11000;
}

function cloneSnapshot(value) {
  return JSON.parse(JSON.stringify(value));
}

function ensureAttemptMatchesRequest(attempt, { identityHash, cartHash, requestHash }) {
  if (
    attempt.identityHash !== identityHash ||
    attempt.cartHash !== cartHash ||
    attempt.requestHash !== requestHash
  ) {
    throw new AppError("This checkout idempotency key was already used for a different checkout.", 409);
  }
}

function isAttemptExpired(attempt, now = new Date()) {
  return attempt?.expiresAt && new Date(attempt.expiresAt).getTime() <= now.getTime();
}

async function deactivateExpiredAttempt(keyHash, now = new Date()) {
  await CheckoutAttempt.findOneAndUpdate(
    {
      keyHash,
      active: true,
      expiresAt: { $lte: now },
    },
    {
      $set: {
        active: false,
        status: "expired",
      },
    }
  );
}

async function findActiveAttempt(keyHash) {
  return CheckoutAttempt.findOne({ keyHash, active: true });
}

async function waitForExistingAttempt(keyHash, requestContext, buildReplayResponse) {
  for (let attemptIndex = 0; attemptIndex < IDEMPOTENCY_WAIT_ATTEMPTS; attemptIndex += 1) {
    const attempt = await findActiveAttempt(keyHash);

    if (!attempt || isAttemptExpired(attempt)) {
      throw new AppError("The previous checkout attempt has expired. Please try again.", 409);
    }

    ensureAttemptMatchesRequest(attempt, requestContext);

    if (attempt.status === "created" && attempt.responseSnapshot) {
      return {
        response: buildReplayResponse(cloneSnapshot(attempt.responseSnapshot)),
        replayed: true,
        attempt,
      };
    }

    if (attempt.status === "failed") {
      throw new AppError(
        attempt.errorMessage || "The previous checkout attempt failed. Please retry with a new idempotency key.",
        409
      );
    }

    await sleep(IDEMPOTENCY_WAIT_MS);
  }

  throw new AppError("Checkout creation is already in progress. Please retry shortly.", 409);
}

async function runCheckoutWithIdempotency({
  idempotencyKey,
  identityHash,
  cartHash,
  requestHash,
  expiresAt,
  createCheckoutSession,
  buildReplayResponse,
}) {
  const normalizedKey = normalizeIdempotencyKey(idempotencyKey);
  const keyHash = sha256(`checkout:${normalizedKey}`);
  const requestContext = { identityHash, cartHash, requestHash };
  const now = new Date();

  await deactivateExpiredAttempt(keyHash, now);

  let attempt;
  try {
    attempt = await CheckoutAttempt.create({
      keyHash,
      identityHash,
      cartHash,
      requestHash,
      status: "processing",
      active: true,
      expiresAt,
    });
  } catch (error) {
    if (!isDuplicateKeyError(error)) {
      throw error;
    }

    return waitForExistingAttempt(keyHash, requestContext, buildReplayResponse);
  }

  try {
    const { response, responseSnapshot } = await createCheckoutSession();
    await CheckoutAttempt.findOneAndUpdate(
      { _id: attempt._id, status: "processing", active: true },
      {
        $set: {
          status: "created",
          orderId: response.appOrderId,
          checkoutSessionId: response.razorpayOrderId,
          responseSnapshot,
          expiresAt,
        },
      }
    );

    return {
      response,
      replayed: false,
      attempt,
    };
  } catch (error) {
    await CheckoutAttempt.findOneAndUpdate(
      { _id: attempt._id },
      {
        $set: {
          status: "failed",
          active: false,
          errorMessage: String(error?.message || "Checkout attempt failed").slice(0, 500),
        },
      }
    ).catch(() => undefined);
    throw error;
  }
}

function buildCheckoutCartHash(items, totals) {
  const snapshot = (items || [])
    .map((item) => ({
      productId: item.productId?.toString?.() || String(item.productId || ""),
      size: String(item.size || ""),
      color: String(item.color || ""),
      fit: String(item.fit || ""),
      sku: String(item.sku || ""),
      quantity: Number(item.quantity) || 0,
      pricePaise: Number(item.pricePaise) || 0,
    }))
    .sort((first, second) =>
      stableStringify(first).localeCompare(stableStringify(second))
    );

  return sha256(stableStringify({
    items: snapshot,
    totals: {
      subtotalPaise: totals.subtotalPaise,
      discountPaise: totals.discountPaise,
      shippingPaise: totals.shippingPaise,
      taxPaise: totals.taxPaise,
      totalPaise: totals.totalPaise,
    },
  }));
}

function buildCheckoutIdentityHash({ userId, email, phone }) {
  const identity = userId
    ? { type: "user", userId: String(userId) }
    : {
        type: "guest",
        email: String(email || "").toLowerCase(),
        phone: String(phone || ""),
      };

  return sha256(stableStringify(identity));
}

function buildCheckoutRequestHash({ identityHash, cartHash, shippingAddressDetails }) {
  return sha256(stableStringify({
    identityHash,
    cartHash,
    shipping: {
      label: shippingAddressDetails.label || "",
      fullName: shippingAddressDetails.fullName || "",
      mobile: shippingAddressDetails.mobile || "",
      pincode: shippingAddressDetails.pincode || "",
      city: shippingAddressDetails.city || "",
      state: shippingAddressDetails.state || "",
      house: shippingAddressDetails.house || "",
      area: shippingAddressDetails.area || "",
      landmark: shippingAddressDetails.landmark || "",
    },
  }));
}

function getCheckoutIdempotencyKey(req, { identityHash, cartHash }) {
  const explicitKey =
    req.get?.("Idempotency-Key") ||
    req.get?.("idempotency-key") ||
    req.headers?.["idempotency-key"] ||
    req.body?.idempotencyKey;

  if (explicitKey) {
    return explicitKey;
  }

  return `legacy:${identityHash}:${cartHash}`;
}

module.exports = {
  buildCheckoutCartHash,
  buildCheckoutIdentityHash,
  buildCheckoutRequestHash,
  getCheckoutIdempotencyKey,
  normalizeIdempotencyKey,
  runCheckoutWithIdempotency,
  sha256,
  stableStringify,
};
