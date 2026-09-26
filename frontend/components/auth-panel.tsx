"use client";

import { useEffect, useState } from "react";
import { useCustomerAuth } from "@/components/customer-auth-provider";
import { useToast } from "@/components/toast-provider";
import { apiRequest } from "@/lib/api";

export type AuthMode = "login" | "signup";
type AuthView = "auth" | "forgot-password";

type AuthPanelProps = {
  initialMode?: AuthMode;
  onSuccess?: () => void;
  onModeChange?: (mode: AuthMode) => void;
  className?: string;
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const normalizePhone = (value: string) => value.replace(/\D/g, "").slice(-10);

function validatePassword(password: string) {
  if (password.length < 8) {
    return "Password must be at least 8 characters long.";
  }

  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    return "Password must include at least one letter and one number.";
  }

  return "";
}

export function AuthPanel({
  initialMode = "login",
  onSuccess,
  onModeChange,
  className = "",
}: AuthPanelProps) {
  const { login, signup } = useCustomerAuth();
  const { pushToast } = useToast();
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [view, setView] = useState<AuthView>("auth");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSignupOtpSubmitting, setIsSignupOtpSubmitting] = useState(false);
  const [isForgotOtpSubmitting, setIsForgotOtpSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [loginIdentifier, setLoginIdentifier] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPhone, setSignupPhone] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupConfirmPassword, setSignupConfirmPassword] = useState("");
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showSignupConfirmPassword, setShowSignupConfirmPassword] = useState(false);
  const [signupOtp, setSignupOtp] = useState("");
  const [signupOtpRequested, setSignupOtpRequested] = useState(false);
  const [signupDevOtp, setSignupDevOtp] = useState("");
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotOtp, setForgotOtp] = useState("");
  const [forgotPassword, setForgotPassword] = useState("");
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotStep, setForgotStep] = useState<"request" | "verify">("request");
  const [devOtp, setDevOtp] = useState("");

  useEffect(() => {
    setMode(initialMode);
    setView("auth");
    setError("");
  }, [initialMode]);

  const switchMode = (nextMode: AuthMode) => {
    setMode(nextMode);
    setError("");
    setView("auth");
    onModeChange?.(nextMode);
  };

  const openForgotPassword = () => {
    setView("forgot-password");
    setForgotStep("request");
    setForgotOtp("");
    setForgotPassword("");
    setDevOtp("");
    setError("");
  };

  const closeForgotPassword = () => {
    setView("auth");
    setForgotStep("request");
    setForgotOtp("");
    setForgotPassword("");
    setDevOtp("");
    setError("");
  };

  const onLoginSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!loginIdentifier.trim() || !loginPassword) {
      setError("Enter your email or phone and password.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const success = await login(loginIdentifier, loginPassword);

      if (!success) {
        setError("Invalid email, phone, or password.");
        return;
      }

      pushToast("Welcome back.");
      onSuccess?.();
    } catch (loginError) {
      setError(
        loginError instanceof Error ? loginError.message : "Could not sign you in right now."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const onSignupSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const composedSignupName = signupName.trim();
    const normalizedEmail = signupEmail.trim().toLowerCase();
    const normalizedPhone = normalizePhone(signupPhone);
    const passwordError = validatePassword(signupPassword);

    if (composedSignupName.length < 2) {
      setError("Enter your full name.");
      return;
    }

    if (!emailPattern.test(normalizedEmail)) {
      setError("Enter a valid email address.");
      return;
    }

    if (!/^[6-9]\d{9}$/.test(normalizedPhone)) {
      setError("Enter a valid 10-digit Indian phone number.");
      return;
    }

    if (passwordError) {
      setError(passwordError);
      return;
    }

    if (signupPassword !== signupConfirmPassword) {
      setError("Password and confirm password must match.");
      return;
    }

    if (!signupOtpRequested || !signupOtp.trim()) {
      setError("Please verify your email with OTP before creating your account.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const success = await signup({
        name: composedSignupName,
        email: normalizedEmail,
        phone: normalizedPhone,
        password: signupPassword,
        otp: signupOtp,
      });

      if (!success) {
        setError("Could not create your account.");
        return;
      }

      pushToast("Account created successfully.");
      onSuccess?.();
    } catch {
      setError("Could not create your account.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const onRequestSignupOtp = async () => {
    const normalizedEmail = signupEmail.trim().toLowerCase();

    if (!normalizedEmail) {
      setError("Enter your email address first.");
      return;
    }

    if (!emailPattern.test(normalizedEmail)) {
      setError("Enter a valid email address.");
      return;
    }

    setIsSignupOtpSubmitting(true);
    setError("");
    setSignupDevOtp("");

    try {
      const response = await apiRequest<{
        message: string;
        expiresInMinutes: number;
        devOtp?: string;
      }>("/auth/signup/request-otp", {
        method: "POST",
        body: JSON.stringify({ email: normalizedEmail }),
      });

      setSignupOtpRequested(true);
      setSignupDevOtp(response.devOtp || "");
      pushToast("Signup OTP sent successfully to your email.");
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Could not send signup OTP right now."
      );
    } finally {
      setIsSignupOtpSubmitting(false);
    }
  };

  const onRequestOtp = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedEmail = forgotEmail.trim().toLowerCase();

    if (!emailPattern.test(normalizedEmail)) {
      setError("Enter a valid email address.");
      return;
    }

    setIsForgotOtpSubmitting(true);
    setError("");
    setDevOtp("");

    try {
      const response = await apiRequest<{
        message: string;
        expiresInMinutes: number;
        devOtp?: string;
      }>("/auth/forgot-password/request-otp", {
        method: "POST",
        body: JSON.stringify({ email: normalizedEmail }),
      });

      setForgotEmail(normalizedEmail);
      setForgotStep("verify");
      setDevOtp(response.devOtp || "");
      pushToast("OTP sent to your email.");
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Could not send OTP right now."
      );
    } finally {
      setIsForgotOtpSubmitting(false);
    }
  };

  const onResetPassword = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const passwordError = validatePassword(forgotPassword);

    if (passwordError) {
      setError(passwordError);
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      await apiRequest("/auth/forgot-password/reset", {
        method: "POST",
        body: JSON.stringify({
          email: forgotEmail,
          otp: forgotOtp,
          newPassword: forgotPassword,
        }),
      });

      pushToast("Password reset successful. You can login now.");
      setLoginIdentifier(forgotEmail);
      setLoginPassword("");
      closeForgotPassword();
      setMode("login");
    } catch (resetError) {
      setError(
        resetError instanceof Error
          ? resetError.message
          : "Could not reset password right now."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const panelTitle =
    view === "forgot-password"
      ? "New password."
      : mode === "login"
        ? "Welcome back."
        : "Join us.";
  const panelDescription =
    view === "forgot-password"
      ? "Verify your email OTP and set a fresh password without leaving checkout."
      : mode === "login"
        ? "Sign in to track orders, save pieces, and move through checkout faster."
        : "Join HRUSHE to save delivery details, place orders, and keep every drop close.";
  const panelHighlights =
    view === "forgot-password"
      ? ["Email OTP verification", "Secure password reset", "Return to your saved bag"]
      : mode === "login"
        ? ["Saved bag and pieces", "Fast checkout access", "Order tracking in one place"]
        : ["Verified email signup", "Saved delivery profile", "Saved pieces and cart shortcuts"];
  const formClass = "auth-switch-panel mt-6 grid gap-5";
  const inputClass = "fr-input";
  const passwordToggleClass =
    "fr-mono fr-choice absolute right-0 top-1/2 -translate-y-1/2";
  const errorMessage = error ? (
    <p
      className="border-l-2 border-[var(--danger)] pl-3 text-sm leading-5 text-[var(--danger)]"
      aria-live="polite"
    >
      {error}
    </p>
  ) : null;

  return (
    <div className={`overflow-hidden bg-[var(--background)] ${className}`.trim()}>
      <div className="grid lg:grid-cols-[0.9fr_1.1fr]">
        <aside className="fr-frame relative hidden min-h-[600px] p-8 lg:flex lg:flex-col lg:justify-between">
          <div className="relative flex flex-col gap-4">
            <p className="fr-mono fr-muted">Wardrobe</p>
            <p className="fr-word max-w-sm text-[3.5rem]">Defined quietly.</p>
            <p className="max-w-xs text-sm leading-6 text-[var(--muted)]">
              Your orders, saved pieces and delivery details, kept in one quiet place.
            </p>
          </div>

          <div className="relative grid gap-3">
            {panelHighlights.map((item, index) => (
              <div
                key={item}
                className="grid grid-cols-[3rem_1fr] items-baseline border-t border-[color-mix(in_srgb,var(--foreground)_12%,transparent)] py-3"
              >
                <span className="fr-mono fr-muted">{String(index + 1).padStart(2, "0")}</span>
                <span className="fr-mono">{item}</span>
              </div>
            ))}
          </div>
        </aside>

        <section className="relative px-5 py-7 sm:px-8 sm:py-10 lg:px-10">
          <div className="flex flex-col gap-3 pr-12 sm:pr-14">
            <p className="fr-mono fr-muted">Wardrobe</p>
            <h2 className="fr-word text-[clamp(2.75rem,10vw,4rem)]">
              {panelTitle}
            </h2>
            <p className="max-w-xl text-sm leading-6 text-[var(--muted)]">
              {panelDescription}
            </p>
          </div>

          {view === "auth" ? (
            <div className="mt-6 flex gap-6">
              <button
                type="button"
                onClick={() => switchMode("login")}
                aria-pressed={mode === "login"}
                className={`fr-mono fr-choice is-underlined min-h-11 ${mode === "login" ? "is-active" : ""}`}
              >
                Sign in
              </button>
              <button
                type="button"
                onClick={() => switchMode("signup")}
                aria-pressed={mode === "signup"}
                className={`fr-mono fr-choice is-underlined min-h-11 ${mode === "signup" ? "is-active" : ""}`}
              >
                Create account
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={closeForgotPassword}
              className="fr-mono fr-choice fr-link is-active mt-6"
            >
              ← Back to sign in
            </button>
          )}

          {view === "forgot-password" ? (
            forgotStep === "request" ? (
              <form className={formClass} onSubmit={(event) => void onRequestOtp(event)}>
                <input
                  value={forgotEmail}
                  onChange={(event) => setForgotEmail(event.target.value)}
                  className={inputClass}
                  aria-label="Email address"
                  placeholder="Email address"
                  type="email"
                  autoComplete="email"
                  required
                />
                {errorMessage}
                <button
                  type="submit"
                  disabled={isForgotOtpSubmitting}
                  className="fr-button"
                >
                  {isForgotOtpSubmitting ? "Sending OTP..." : "Send OTP"}
                </button>
              </form>
            ) : (
              <form className={formClass} onSubmit={(event) => void onResetPassword(event)}>
                <input
                  value={forgotEmail}
                  onChange={(event) => setForgotEmail(event.target.value)}
                  className={inputClass}
                  aria-label="Email address"
                  placeholder="Email address"
                  type="email"
                  autoComplete="email"
                  required
                />
                <input
                  value={forgotOtp}
                  onChange={(event) => setForgotOtp(event.target.value)}
                  className={inputClass}
                  aria-label="6-digit OTP"
                  placeholder="6-digit OTP"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  required
                />
                <div className="relative">
                  <input
                    value={forgotPassword}
                    onChange={(event) => setForgotPassword(event.target.value)}
                    className={`${inputClass} pr-16!`}
                    aria-label="New password"
                    placeholder="New password"
                    type={showForgotPassword ? "text" : "password"}
                    autoComplete="new-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword((current) => !current)}
                    className={passwordToggleClass}
                  >
                    {showForgotPassword ? "Hide" : "Show"}
                  </button>
                </div>
                {devOtp ? (
                  <p className="text-sm text-[var(--muted)]">
                    Dev OTP: <span className="font-semibold text-[var(--accent)]">{devOtp}</span>
                  </p>
                ) : null}
                {errorMessage}
                <div className="grid gap-3 sm:grid-cols-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="fr-button"
                  >
                    {isSubmitting ? "Resetting..." : "Reset password"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setForgotStep("request");
                      setForgotOtp("");
                      setForgotPassword("");
                      setDevOtp("");
                      setError("");
                    }}
                    className="fr-mono min-h-[3.25rem] border border-[color-mix(in_srgb,var(--foreground)_22%,transparent)]"
                  >
                    Resend OTP
                  </button>
                </div>
              </form>
            )
          ) : mode === "login" ? (
            <form className={formClass} onSubmit={(event) => void onLoginSubmit(event)}>
              <input
                value={loginIdentifier}
                onChange={(event) => setLoginIdentifier(event.target.value)}
                className={inputClass}
                aria-label="Email address or phone number"
                placeholder="Email address or phone number"
                autoComplete="username"
                required
              />
              <div className="relative">
                <input
                  value={loginPassword}
                  onChange={(event) => setLoginPassword(event.target.value)}
                  className={`${inputClass} pr-16!`}
                  aria-label="Password"
                  placeholder="Password"
                  type={showLoginPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowLoginPassword((current) => !current)}
                  className={passwordToggleClass}
                >
                  {showLoginPassword ? "Hide" : "Show"}
                </button>
              </div>
              {errorMessage}
              <div className="grid gap-3 sm:grid-cols-[1fr_12rem] sm:items-center">
                <button
                  type="button"
                  onClick={openForgotPassword}
                  className="fr-mono fr-choice fr-link justify-self-start"
                >
                  Forgot password?
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="fr-button"
                >
                  {isSubmitting ? "Signing in…" : "Sign in"}
                </button>
              </div>
            </form>
          ) : (
            <form className={formClass} onSubmit={(event) => void onSignupSubmit(event)}>
              <input
                value={signupName}
                onChange={(event) => setSignupName(event.target.value)}
                className={inputClass}
                aria-label="Full name"
                placeholder="Full name"
                autoComplete="name"
                required
              />
              <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_0.72fr]">
                <input
                  value={signupEmail}
                  onChange={(event) => {
                    setSignupEmail(event.target.value);
                    setSignupOtpRequested(false);
                    setSignupOtp("");
                    setSignupDevOtp("");
                  }}
                  className={inputClass}
                  aria-label="Email address"
                  placeholder="Email address"
                  type="email"
                  autoComplete="email"
                  required
                />
                <input
                  value={signupPhone}
                  onChange={(event) => setSignupPhone(event.target.value)}
                  className={inputClass}
                  aria-label="Phone number"
                  placeholder="Phone number"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  required
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_11.5rem]">
                <input
                  value={signupOtp}
                  onChange={(event) => setSignupOtp(event.target.value)}
                  className={inputClass}
                  aria-label="Email OTP"
                  placeholder="Email OTP"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  required
                />
                <button
                  type="button"
                  onClick={() => void onRequestSignupOtp()}
                  disabled={isSignupOtpSubmitting}
                  className="fr-mono min-h-12 whitespace-nowrap border border-[color-mix(in_srgb,var(--foreground)_22%,transparent)] px-4 disabled:opacity-60"
                >
                  {isSignupOtpSubmitting
                    ? "Sending..."
                    : signupOtpRequested
                      ? "Resend OTP"
                      : "Send OTP"}
                </button>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="relative">
                  <input
                    value={signupPassword}
                    onChange={(event) => setSignupPassword(event.target.value)}
                    className={`${inputClass} pr-16!`}
                    aria-label="Password"
                    placeholder="Password"
                    type={showSignupPassword ? "text" : "password"}
                    autoComplete="new-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowSignupPassword((current) => !current)}
                    className={passwordToggleClass}
                  >
                    {showSignupPassword ? "Hide" : "Show"}
                  </button>
                </div>
                <div className="relative">
                  <input
                    value={signupConfirmPassword}
                    onChange={(event) => setSignupConfirmPassword(event.target.value)}
                    className={`${inputClass} pr-16!`}
                    aria-label="Confirm password"
                    placeholder="Confirm password"
                    type={showSignupConfirmPassword ? "text" : "password"}
                    autoComplete="new-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowSignupConfirmPassword((current) => !current)}
                    className={passwordToggleClass}
                  >
                    {showSignupConfirmPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>
              {signupDevOtp ? (
                <p className="text-sm text-[var(--muted)]">
                  Dev OTP: <span className="font-semibold text-[var(--accent)]">{signupDevOtp}</span>
                </p>
              ) : null}
              {errorMessage}
              <button
                type="submit"
                disabled={isSubmitting}
                className="fr-button"
              >
                {isSubmitting ? "Creating account..." : "Create account"}
              </button>
            </form>
          )}

          <div className="fr-mono fr-muted mt-8 flex flex-wrap items-center gap-x-3 gap-y-2">
            <span>Secure access</span>
            <span aria-hidden="true">·</span>
            <span>Email OTP protected</span>
          </div>
        </section>
      </div>
    </div>
  );
}
