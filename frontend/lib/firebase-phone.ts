"use client";

import type { ConfirmationResult } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "",
};

/** Phone sign-in turns on only once the Firebase web config is set (Vercel env). */
export function isPhoneSignInEnabled() {
  return Boolean(firebaseConfig.apiKey && firebaseConfig.authDomain && firebaseConfig.projectId);
}

async function getFirebaseAuth() {
  const [{ initializeApp, getApps }, { getAuth }] = await Promise.all([import("firebase/app"), import("firebase/auth")]);
  const app = getApps()[0] || initializeApp(firebaseConfig);
  const auth = getAuth(app);
  auth.languageCode = "en";
  return auth;
}

/** Sends a 6-digit SMS code to an Indian mobile number. `containerId` hosts the invisible reCAPTCHA. */
export async function sendPhoneCode(phone10: string, containerId: string): Promise<ConfirmationResult> {
  const auth = await getFirebaseAuth();
  const { RecaptchaVerifier, signInWithPhoneNumber } = await import("firebase/auth");
  const verifier = new RecaptchaVerifier(auth, containerId, { size: "invisible" });
  try {
    return await signInWithPhoneNumber(auth, `+91${phone10}`, verifier);
  } catch (error) {
    verifier.clear();
    throw error;
  }
}

/** Confirms the code and returns a Firebase ID token for the HRUSHE backend to verify. */
export async function confirmPhoneCode(confirmation: ConfirmationResult, code: string) {
  const credential = await confirmation.confirm(code);
  return credential.user.getIdToken();
}

export function describePhoneError(error: unknown) {
  const code = (error as { code?: string })?.code || "";
  if (code.includes("invalid-verification-code")) return "That code isn’t right. Check the SMS and try again.";
  if (code.includes("code-expired")) return "That code has expired. Send a new one.";
  if (code.includes("too-many-requests")) return "Too many attempts. Please wait a few minutes and try again.";
  if (code.includes("invalid-phone-number")) return "Enter a valid 10-digit Indian mobile number.";
  if (code.includes("quota-exceeded")) return "We can’t send codes right now. Please try again shortly.";
  return error instanceof Error && error.message && !code ? error.message : "Something went wrong. Please try again.";
}
