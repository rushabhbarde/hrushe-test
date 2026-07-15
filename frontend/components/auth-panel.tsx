"use client";

import Image from "next/image";
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
  variant?: "classic" | "prestige";
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
  variant = "classic",
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
  const [signupFirstName, setSignupFirstName] = useState("");
  const [signupLastName, setSignupLastName] = useState("");
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
    const composedSignupName =
      signupName.trim() ||
      [signupFirstName.trim(), signupLastName.trim()].filter(Boolean).join(" ");
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

  if (variant === "prestige") {
    const prestigeField =
      "group grid gap-2 border-b border-white/18 pb-3 text-[0.92rem] font-semibold text-white";
    const prestigeInput =
      "w-full bg-transparent text-[0.95rem] font-medium text-white outline-none placeholder:text-white/42";
    const prestigeButton =
      "min-h-12 w-full border border-white/26 px-5 text-sm font-semibold text-white transition hover:border-white hover:bg-white hover:text-black disabled:cursor-not-allowed disabled:opacity-55";
    const prestigeLightButton =
      "hrushe-light-action min-h-12 w-full px-5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-55";
    const prestigeError = error ? (
      <p className="border border-white/16 bg-white/[0.06] px-4 py-3 text-sm leading-5 text-white/82" aria-live="polite">
        {error}
      </p>
    ) : null;
    const prestigeLogo = (
      <Image
        src="/NEW_LOGO.png"
        alt="HRUSHE"
        width={260}
        height={60}
        priority
        className="mx-auto h-auto w-48 brightness-0 invert sm:w-52"
      />
    );

    if (view === "forgot-password") {
      return (
        <section className={`w-full text-white ${className}`.trim()}>
          <button
            type="button"
            onClick={closeForgotPassword}
            className="mb-10 text-xs font-semibold uppercase tracking-[0.18em] text-white/56 transition hover:text-white"
          >
            Back to login
          </button>
          <div className="mx-auto max-w-md">
            {prestigeLogo}
            <p className="mt-2 text-center text-sm font-semibold uppercase tracking-[0.12em] text-white/72">
              Reset access
            </p>
            {forgotStep === "request" ? (
              <form className="mt-14 grid gap-7" onSubmit={(event) => void onRequestOtp(event)}>
                <label className={prestigeField}>
                  Email
                  <input
                    value={forgotEmail}
                    onChange={(event) => setForgotEmail(event.target.value)}
                    className={prestigeInput}
                    placeholder="Your email address"
                    type="email"
                    autoComplete="email"
                    required
                  />
                </label>
                {prestigeError}
                <button type="submit" disabled={isForgotOtpSubmitting} className={prestigeButton}>
                  {isForgotOtpSubmitting ? "Sending OTP..." : "Send OTP"}
                </button>
              </form>
            ) : (
              <form className="mt-14 grid gap-7" onSubmit={(event) => void onResetPassword(event)}>
                <label className={prestigeField}>
                  Email
                  <input
                    value={forgotEmail}
                    onChange={(event) => setForgotEmail(event.target.value)}
                    className={prestigeInput}
                    placeholder="Your email address"
                    type="email"
                    autoComplete="email"
                    required
                  />
                </label>
                <label className={prestigeField}>
                  OTP
                  <input
                    value={forgotOtp}
                    onChange={(event) => setForgotOtp(event.target.value)}
                    className={prestigeInput}
                    placeholder="6-digit OTP"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    required
                  />
                </label>
                <label className={prestigeField}>
                  New password
                  <input
                    value={forgotPassword}
                    onChange={(event) => setForgotPassword(event.target.value)}
                    className={prestigeInput}
                    placeholder="Choose password"
                    type={showForgotPassword ? "text" : "password"}
                    autoComplete="new-password"
                    required
                  />
                </label>
                <button
                  type="button"
                  onClick={() => setShowForgotPassword((current) => !current)}
                  className="-mt-5 justify-self-end text-xs font-semibold uppercase tracking-[0.16em] text-white/48 hover:text-white"
                >
                  {showForgotPassword ? "Hide" : "Show"}
                </button>
                {devOtp ? <p className="text-sm text-white/48">Dev OTP: {devOtp}</p> : null}
                {prestigeError}
                <button type="submit" disabled={isSubmitting} className={prestigeLightButton}>
                  {isSubmitting ? "Resetting..." : "Reset password"}
                </button>
              </form>
            )}
          </div>
        </section>
      );
    }

    if (mode === "signup") {
      return (
        <section className={`w-full text-white ${className}`.trim()}>
          <div className="mb-8 flex items-center gap-8 text-sm font-semibold text-white">
            <span>1 / 2</span>
            <span>Details</span>
          </div>
          <form className="grid gap-5" onSubmit={(event) => void onSignupSubmit(event)}>
            <label className={prestigeField}>
              Email
              <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_8.5rem] sm:items-end">
                <input
                  value={signupEmail}
                  onChange={(event) => {
                    setSignupEmail(event.target.value);
                    setSignupOtpRequested(false);
                    setSignupOtp("");
                    setSignupDevOtp("");
                  }}
                  className={prestigeInput}
                  placeholder="Your email address"
                  type="email"
                  autoComplete="email"
                  required
                />
                <button
                  type="button"
                  onClick={() => void onRequestSignupOtp()}
                  disabled={isSignupOtpSubmitting}
                  className="min-h-9 border border-white/18 px-3 text-xs font-semibold uppercase tracking-[0.12em] text-white/72 transition hover:border-white hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSignupOtpSubmitting ? "Sending" : signupOtpRequested ? "Resend" : "Send OTP"}
                </button>
              </div>
            </label>
            <label className={prestigeField}>
              First name
              <input
                value={signupFirstName}
                onChange={(event) => setSignupFirstName(event.target.value)}
                className={prestigeInput}
                placeholder="Your first name"
                autoComplete="given-name"
                required
              />
            </label>
            <label className={prestigeField}>
              Last name
              <input
                value={signupLastName}
                onChange={(event) => setSignupLastName(event.target.value)}
                className={prestigeInput}
                placeholder="Your last name"
                autoComplete="family-name"
                required
              />
            </label>
            <label className={prestigeField}>
              Phone
              <input
                value={signupPhone}
                onChange={(event) => setSignupPhone(event.target.value)}
                className={prestigeInput}
                placeholder="10-digit phone number"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                required
              />
            </label>
            <label className={prestigeField}>
              Email OTP
              <input
                value={signupOtp}
                onChange={(event) => setSignupOtp(event.target.value)}
                className={prestigeInput}
                placeholder="Verification code"
                inputMode="numeric"
                autoComplete="one-time-code"
                required
              />
            </label>
            <label className={prestigeField}>
              Password
              <input
                value={signupPassword}
                onChange={(event) => setSignupPassword(event.target.value)}
                className={prestigeInput}
                placeholder="Choose password"
                type={showSignupPassword ? "text" : "password"}
                autoComplete="new-password"
                required
              />
            </label>
            <label className={prestigeField}>
              Confirm password
              <input
                value={signupConfirmPassword}
                onChange={(event) => setSignupConfirmPassword(event.target.value)}
                className={prestigeInput}
                placeholder="Repeat password"
                type={showSignupConfirmPassword ? "text" : "password"}
                autoComplete="new-password"
                required
              />
            </label>
            <div className="-mt-2 grid justify-items-end gap-2 text-right text-xs font-semibold uppercase tracking-[0.16em] text-white/48 sm:flex sm:flex-wrap sm:justify-end sm:gap-x-4">
              <button type="button" onClick={() => setShowSignupPassword((current) => !current)} className="hover:text-white">
                {showSignupPassword ? "Hide password" : "Show password"}
              </button>
              <button type="button" onClick={() => setShowSignupConfirmPassword((current) => !current)} className="hover:text-white">
                {showSignupConfirmPassword ? "Hide confirm" : "Show confirm"}
              </button>
            </div>
            <label className="flex items-start gap-3 text-sm font-semibold leading-6 text-white/82">
              <input type="checkbox" className="mt-1 h-4 w-4 border border-white/28 bg-transparent accent-white" />
              Subscribe to receive email updates about HRUSHE product launches, promotions and exclusive discounts.
            </label>
            {signupDevOtp ? <p className="text-sm text-white/48">Dev OTP: {signupDevOtp}</p> : null}
            {prestigeError}
            <button type="submit" disabled={isSubmitting} className={prestigeLightButton}>
              {isSubmitting ? "Creating account..." : "Create Account"}
            </button>
          </form>
          <button
            type="button"
            onClick={() => switchMode("login")}
            className="mt-5 w-full text-center text-sm font-semibold text-white/46 transition hover:text-white"
          >
            Already got an account? Login here
          </button>
        </section>
      );
    }

    return (
      <section className={`w-full text-white ${className}`.trim()}>
        <div className="mx-auto max-w-md">
          {prestigeLogo}
          <form className="mt-28 grid gap-7 lg:mt-32" onSubmit={(event) => void onLoginSubmit(event)}>
            <label className={prestigeField}>
              Your email address
              <input
                value={loginIdentifier}
                onChange={(event) => setLoginIdentifier(event.target.value)}
                className={prestigeInput}
                placeholder="Email address or phone number"
                autoComplete="username"
                required
              />
            </label>
            <label className={prestigeField}>
              Enter your password
              <input
                value={loginPassword}
                onChange={(event) => setLoginPassword(event.target.value)}
                className={prestigeInput}
                placeholder="Password"
                type={showLoginPassword ? "text" : "password"}
                autoComplete="current-password"
                required
              />
            </label>
            <div className="-mt-4 flex items-center justify-between gap-4">
              <button
                type="button"
                onClick={() => setShowLoginPassword((current) => !current)}
                className="text-xs font-semibold uppercase tracking-[0.16em] text-white/42 transition hover:text-white"
              >
                {showLoginPassword ? "Hide" : "Show"}
              </button>
              <button
                type="button"
                onClick={openForgotPassword}
                className="text-sm font-semibold text-white/46 transition hover:text-white"
              >
                Forgot your password?
              </button>
            </div>
            {prestigeError}
            <div className="grid gap-3 pt-3">
              <button type="submit" disabled={isSubmitting} className={prestigeButton}>
                {isSubmitting ? "Signing in..." : "Sign in"}
              </button>
              <button type="button" onClick={() => switchMode("signup")} className={prestigeButton}>
                Create an account
              </button>
            </div>
          </form>
          <a
            href="/story"
            className="mt-28 block text-center text-sm font-semibold text-white/44 underline underline-offset-4 transition hover:text-white"
          >
            Explore HRUSHE
          </a>
        </div>
      </section>
    );
  }

  const panelTitle =
    view === "forgot-password"
      ? "Reset your password."
      : mode === "login"
        ? "Welcome back."
        : "Create your account.";
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
  const formClass = "auth-switch-panel mt-5 grid gap-3.5 sm:mt-6 sm:gap-4";
  const inputClass =
    "lux-input bg-white/75 text-[0.95rem] shadow-[inset_0_1px_0_rgba(255,255,255,0.68)]";
  const passwordToggleClass =
    "absolute right-4 top-1/2 -translate-y-1/2 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[var(--muted)] transition hover:text-black";
  const errorMessage = error ? (
    <p
      className="border border-[color-mix(in_srgb,var(--danger)_28%,transparent)] bg-[color-mix(in_srgb,var(--danger)_7%,transparent)] px-4 py-3 text-sm leading-5 text-[var(--danger)]"
      aria-live="polite"
    >
      {error}
    </p>
  ) : null;

  return (
    <div className={`lux-panel overflow-hidden ${className}`.trim()}>
      <div className="grid lg:grid-cols-[0.84fr_1.16fr]">
        <aside className="relative hidden min-h-[640px] overflow-hidden bg-[#111111] p-8 text-white lg:flex lg:flex-col lg:justify-between">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_28%_18%,rgba(255,255,255,0.18),transparent_28rem)]" />
          <div className="relative">
            <p className="eyebrow text-white/60">HRUSHE Account</p>
            <h2 className="display-font mt-5 max-w-sm text-6xl leading-[0.88] tracking-[-0.06em]">
              Quiet access. Faster orders.
            </h2>
            <p className="mt-6 max-w-xs text-sm leading-6 text-white/64">
              A clean member space for saved delivery details, saved pieces,
              and checkout without repeating yourself.
            </p>
          </div>

          <div className="relative grid gap-3">
            {panelHighlights.map((item, index) => (
              <div
                key={item}
                className="grid grid-cols-[3.5rem_1fr] items-center border border-white/12 bg-white/[0.04] px-4 py-3"
              >
                <span className="text-xs font-semibold tracking-[0.22em] text-white/42">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="text-sm font-medium text-white/86">{item}</span>
              </div>
            ))}
          </div>
        </aside>

        <section className="relative bg-[color-mix(in_srgb,var(--surface)_88%,transparent)] px-4 py-5 sm:px-7 sm:py-8 lg:px-8">
          <div className="mb-5 border border-[var(--border)] bg-black px-4 py-4 text-white lg:hidden">
            <p className="eyebrow text-white/58">HRUSHE Account</p>
            <p className="mt-2 text-sm leading-5 text-white/76">
              Secure access for saved bags, saved pieces, and faster checkout.
            </p>
          </div>

          <div className="pr-12 sm:pr-14">
            <p className="eyebrow text-[var(--accent)]">Account access</p>
            <h2 className="display-font mt-2 text-[2.45rem] leading-[0.9] tracking-[-0.055em] sm:text-5xl lg:text-[3.35rem]">
              {panelTitle}
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-[var(--muted)]">
              {panelDescription}
            </p>
          </div>

          {view === "auth" ? (
            <div className="mt-5 grid max-w-md grid-cols-2 border border-[var(--border)] bg-white/70 p-1">
              <button
                type="button"
                onClick={() => switchMode("login")}
                className={`min-h-11 px-4 text-sm font-semibold transition ${
                  mode === "login"
                    ? "hrushe-inverse-action shadow-[0_10px_24px_rgba(0,0,0,0.16)]"
                    : "text-[var(--muted)] hover:bg-black/[0.04] hover:text-black"
                }`}
              >
                Login
              </button>
              <button
                type="button"
                onClick={() => switchMode("signup")}
                className={`min-h-11 px-4 text-sm font-semibold transition ${
                  mode === "signup"
                    ? "hrushe-inverse-action shadow-[0_10px_24px_rgba(0,0,0,0.16)]"
                    : "text-[var(--muted)] hover:bg-black/[0.04] hover:text-black"
                }`}
              >
                Create account
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={closeForgotPassword}
              className="mt-5 inline-flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent)] transition hover:text-black"
            >
              <span className="h-px w-10 bg-current" />
              Back to login
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
                  className="button-primary w-full px-5 py-3 transition disabled:cursor-not-allowed disabled:opacity-60"
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
                    className={`${inputClass} pr-24`}
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
                    className="button-primary px-5 py-3 transition disabled:cursor-not-allowed disabled:opacity-60"
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
                    className="button-secondary px-5 py-3 transition"
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
                  className={`${inputClass} pr-24`}
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
                  className="justify-self-start text-sm font-medium text-[var(--accent)] underline underline-offset-4 transition hover:text-black"
                >
                  Forgot password?
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="button-primary w-full px-5 py-3 transition disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmitting ? "Signing in..." : "Login"}
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
                  className="button-secondary whitespace-nowrap px-5 py-3 transition disabled:cursor-not-allowed disabled:opacity-60"
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
                    className={`${inputClass} pr-24`}
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
                    className={`${inputClass} pr-24`}
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
                className="button-primary w-full px-5 py-3 transition disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? "Creating account..." : "Create account"}
              </button>
            </form>
          )}

          <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-[var(--border)] pt-4 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
            <span>Secure account access</span>
            <span className="h-1 w-1 bg-[var(--border)]" />
            <span>OTP protected</span>
          </div>
        </section>
      </div>
    </div>
  );
}
