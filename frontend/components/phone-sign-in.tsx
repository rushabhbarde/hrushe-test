"use client";

import { useEffect, useState } from "react";
import type { ConfirmationResult } from "firebase/auth";
import { useCustomerAuth } from "@/components/customer-auth-provider";
import { apiRequest } from "@/lib/api";
import { confirmPhoneCode, describePhoneError, sendPhoneCode } from "@/lib/firebase-phone";

type Step = "phone" | "code" | "profile";

const RESEND_SECONDS = 30;
const RECAPTCHA_ID = "hrushe-phone-recaptcha";

/** Mobile + OTP: number → 6-digit code → (first time only) name and email. */
export function PhoneSignIn({ onSuccess }: { onSuccess?: () => void }) {
  const { phoneSignIn } = useCustomerAuth();
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [emailOtp, setEmailOtp] = useState("");
  const [emailCodeSent, setEmailCodeSent] = useState(false);
  const [confirmation, setConfirmation] = useState<ConfirmationResult | null>(null);
  const [idToken, setIdToken] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [resendIn, setResendIn] = useState(0);

  useEffect(() => {
    if (resendIn <= 0) {
      return;
    }
    const timer = window.setTimeout(() => setResendIn((value) => value - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [resendIn]);

  const digits = phone.replace(/\D/g, "").slice(-10);
  const shownPhone = `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;

  async function sendCode() {
    if (!/^[6-9]\d{9}$/.test(digits)) {
      setError("Enter a valid 10-digit Indian mobile number.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      setConfirmation(await sendPhoneCode(digits, RECAPTCHA_ID));
      setCode("");
      setStep("code");
      setResendIn(RESEND_SECONDS);
    } catch (sendError) {
      setError(describePhoneError(sendError));
    } finally {
      setBusy(false);
    }
  }

  async function verifyCode() {
    if (!confirmation || !/^\d{6}$/.test(code)) {
      setError("Enter the 6-digit code from the SMS.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const token = await confirmPhoneCode(confirmation, code);
      const result = await phoneSignIn(token);
      if (result.needsProfile) {
        setIdToken(token);
        setStep("profile");
      } else {
        onSuccess?.();
      }
    } catch (verifyError) {
      setError(describePhoneError(verifyError));
    } finally {
      setBusy(false);
    }
  }

  async function sendEmailCode() {
    if (name.trim().length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Add your name and a valid email for order updates.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await apiRequest("/auth/signup/request-otp", { method: "POST", body: JSON.stringify({ email: email.trim() }) });
      setEmailOtp("");
      setEmailCodeSent(true);
    } catch (sendError) {
      setError(describePhoneError(sendError));
    } finally {
      setBusy(false);
    }
  }

  async function createAccount() {
    if (!emailCodeSent) {
      await sendEmailCode();
      return;
    }
    if (!/^\d{6}$/.test(emailOtp)) {
      setError("Enter the 6-digit code we emailed you.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const result = await phoneSignIn(idToken, { name: name.trim(), email: email.trim(), emailOtp });
      if (!result.needsProfile) {
        onSuccess?.();
      }
    } catch (createError) {
      setError(describePhoneError(createError));
    } finally {
      setBusy(false);
    }
  }

  const heading = step === "profile" ? "One more thing." : step === "code" ? "Check your SMS." : "Welcome.";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 pr-12 sm:pr-14">
        <p className="fr-mono fr-muted">Wardrobe</p>
        <h2 className="fr-word text-[clamp(2.75rem,10vw,4rem)]">{heading}</h2>
        <p className="max-w-xl text-sm leading-6 text-[var(--muted)]">
          {step === "phone"
            ? "Sign in or join with your mobile number. We’ll text you a 6-digit code — no password."
            : step === "code"
              ? `Enter the code sent to ${shownPhone}.`
              : emailCodeSent
                ? `Enter the code we emailed to ${email.trim()}.`
                : "Your name, and an email for order updates and receipts. We’ll send a code to confirm it."}
        </p>
      </div>

      <form
        className="grid gap-5"
        onSubmit={(event) => {
          event.preventDefault();
          void (step === "phone" ? sendCode() : step === "code" ? verifyCode() : createAccount());
        }}
      >
        {step === "phone" ? (
          <label className="fr-field">
            <span>Mobile number</span>
            <span className="flex items-baseline gap-3">
              <span className="fr-mono">+91</span>
              <input
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                className="fr-input"
                type="tel"
                inputMode="numeric"
                autoComplete="tel-national"
                maxLength={14}
                placeholder="98765 43210"
                required
              />
            </span>
          </label>
        ) : null}

        {step === "code" ? (
          <>
            <label className="fr-field">
              <span>6-digit code</span>
              <input
                value={code}
                onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
                className="fr-input tracking-[0.4em]!"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                autoFocus
                required
              />
            </label>
            <div className="flex flex-wrap gap-x-6 gap-y-2">
              <button type="button" onClick={() => setStep("phone")} className="fr-mono fr-choice fr-link is-active">
                Change number
              </button>
              <button
                type="button"
                onClick={() => void sendCode()}
                disabled={resendIn > 0 || busy}
                className="fr-mono fr-choice fr-link is-active disabled:no-underline"
              >
                {resendIn > 0 ? `Resend in ${resendIn}s` : "Resend code"}
              </button>
            </div>
          </>
        ) : null}

        {step === "profile" ? (
          <>
            {!emailCodeSent ? (
              <>
                <label className="fr-field">
                  <span>Full name</span>
                  <input value={name} onChange={(event) => setName(event.target.value)} className="fr-input" autoComplete="name" required />
                </label>
                <label className="fr-field">
                  <span>Email</span>
                  <input
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="fr-input"
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    required
                  />
                </label>
              </>
            ) : (
              <>
                <label className="fr-field">
                  <span>Email code</span>
                  <input
                    value={emailOtp}
                    onChange={(event) => setEmailOtp(event.target.value.replace(/\D/g, "").slice(0, 6))}
                    className="fr-input tracking-[0.4em]!"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    autoFocus
                    required
                  />
                </label>
                <div className="flex flex-wrap gap-x-6 gap-y-2">
                  <button type="button" onClick={() => setEmailCodeSent(false)} className="fr-mono fr-choice fr-link is-active">
                    Change email
                  </button>
                  <button type="button" onClick={() => void sendEmailCode()} disabled={busy} className="fr-mono fr-choice fr-link is-active">
                    Resend code
                  </button>
                </div>
              </>
            )}
          </>
        ) : null}

        {error ? (
          <p className="border-l-2 border-[var(--danger)] pl-3 text-sm leading-5 text-[var(--danger)]" role="alert">
            {error}
          </p>
        ) : null}

        <button type="submit" disabled={busy} className="fr-button">
          {busy
            ? "One moment…"
            : step === "phone"
              ? "Send code"
              : step === "code"
                ? "Verify"
                : emailCodeSent
                  ? "Create account"
                  : "Send code to email"}
        </button>
      </form>

      <div id={RECAPTCHA_ID} />
      <p className="fr-mono fr-muted">Secure sign-in · SMS code</p>
    </div>
  );
}
