const jwt = require("jsonwebtoken");
const env = require("../config/env");
const AppError = require("./AppError");

// Google's public certificates for Firebase Auth ID tokens (keyed by `kid`).
const CERTS_URL =
  "https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com";

const certCache = { certs: null, expiresAt: 0 };

async function getFirebaseCerts() {
  if (certCache.certs && Date.now() < certCache.expiresAt) {
    return certCache.certs;
  }

  const response = await fetch(CERTS_URL);
  if (!response.ok) {
    throw new AppError("Could not verify the phone sign-in right now. Please try again.", 503);
  }

  const maxAge = Number(/max-age=(\d+)/.exec(response.headers.get("cache-control") || "")?.[1] || 3600);
  certCache.certs = await response.json();
  certCache.expiresAt = Date.now() + maxAge * 1000;
  return certCache.certs;
}

/**
 * Verifies a Firebase Auth ID token from phone sign-in and returns the verified phone number.
 * Checks signature (Google certs), audience/issuer (our Firebase project), expiry and subject.
 */
async function verifyFirebasePhoneToken(idToken, { projectId = env.FIREBASE_PROJECT_ID, getCerts = getFirebaseCerts } = {}) {
  if (!projectId) {
    throw new AppError("Phone sign-in is not configured yet.", 503);
  }

  const decodedHeader = jwt.decode(String(idToken || ""), { complete: true });
  const kid = decodedHeader?.header?.kid;
  if (!kid || decodedHeader.header.alg !== "RS256") {
    throw new AppError("Phone verification failed. Please request a new code.", 401);
  }

  const certs = await getCerts();
  const cert = certs[kid];
  if (!cert) {
    throw new AppError("Phone verification failed. Please request a new code.", 401);
  }

  let payload;
  try {
    payload = jwt.verify(idToken, cert, {
      algorithms: ["RS256"],
      audience: projectId,
      issuer: `https://securetoken.google.com/${projectId}`,
    });
  } catch {
    throw new AppError("Phone verification failed or expired. Please request a new code.", 401);
  }

  if (!payload.sub || !payload.phone_number || (payload.auth_time && payload.auth_time * 1000 > Date.now() + 60_000)) {
    throw new AppError("Phone verification failed. Please request a new code.", 401);
  }

  return { phoneNumber: payload.phone_number, uid: payload.sub };
}

module.exports = { verifyFirebasePhoneToken, getFirebaseCerts };
