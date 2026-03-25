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
  const [error, setError] = useState("");
  const [loginIdentifier, setLoginIdentifier] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPhone, setSignupPhone] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupConfirmPassword, setSignupConfirmPassword] = useState("");
  const [signupOtp, setSignupOtp] = useState("");
  const [signupOtpRequested, setSignupOtpRequested] = useState(false);
  const [signupDevOtp, setSignupDevOtp] = useState("");
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotOtp, setForgotOtp] = useState("");
  const [forgotPassword, setForgotPassword] = useState("");
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
    } catch {
      setError("Could not sign you in right now.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const onSignupSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

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
        name: signupName,
        email: signupEmail,
        phone: signupPhone,
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
    if (!signupEmail.trim()) {
      setError("Enter your email address first.");
      return;
    }

    setIsSubmitting(true);
    setError("");
    setSignupDevOtp("");

    try {
      const response = await apiRequest<{
        message: string;
        expiresInMinutes: number;
        devOtp?: string;
      }>("/auth/signup/request-otp", {
        method: "POST",
        body: JSON.stringify({ email: signupEmail }),
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
      setIsSubmitting(false);
    }
  };

  const onRequestOtp = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");
    setDevOtp("");

    try {
      const response = await apiRequest<{
        message: string;
        expiresInMinutes: number;
        devOtp?: string;
      }>("/auth/forgot-password/request-otp", {
        method: "POST",
        body: JSON.stringify({ email: forgotEmail }),
      });

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
      setIsSubmitting(false);
    }
  };

  const onResetPassword = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
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

  return (
    <div className={`grain-card rounded-[2rem] p-6 sm:p-8 ${className}`.trim()}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="eyebrow text-[var(--accent)]">Account</p>
          <h2 className="display-font mt-3 text-3xl sm:text-4xl">
            {view === "forgot-password"
              ? "Reset your password."
              : mode === "login"
                ? "Welcome back."
                : "Create your account."}
          </h2>
          <p className="mt-3 max-w-md text-sm leading-6 text-[var(--muted)]">
            {view === "forgot-password"
              ? "Enter your email, verify the OTP, and set a new password without leaving this popup."
              : mode === "login"
                ? "Sign in to view orders, track deliveries, and checkout faster."
                : "Join HRUSHE to save your details, place orders, and track every drop."}
          </p>
        </div>
      </div>

      {view === "auth" ? (
        <div className="mt-6 inline-flex rounded-full border border-[var(--border)] bg-white/60 p-1">
          <button
            type="button"
            onClick={() => switchMode("login")}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              mode === "login" ? "bg-black text-white" : "text-[var(--muted)]"
            }`}
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => switchMode("signup")}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              mode === "signup" ? "bg-black text-white" : "text-[var(--muted)]"
            }`}
          >
            Create account
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={closeForgotPassword}
          className="mt-6 inline-flex text-sm font-medium text-[var(--accent)] underline underline-offset-4"
        >
          Back to login
        </button>
      )}

      {view === "forgot-password" ? (
        forgotStep === "request" ? (
          <form className="mt-8 grid gap-4" onSubmit={(event) => void onRequestOtp(event)}>
            <input
              value={forgotEmail}
              onChange={(event) => setForgotEmail(event.target.value)}
              className="rounded-2xl border border-[var(--border)] bg-white/70 px-4 py-3"
              placeholder="Email address"
              type="email"
              required
            />
            {error ? <p className="text-sm text-[var(--accent)]">{error}</p> : null}
            <button
              type="submit"
              disabled={isSubmitting}
              className="button-primary rounded-full px-5 py-3 transition disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Sending OTP..." : "Send OTP"}
            </button>
          </form>
        ) : (
          <form className="mt-8 grid gap-4" onSubmit={(event) => void onResetPassword(event)}>
            <input
              value={forgotEmail}
              onChange={(event) => setForgotEmail(event.target.value)}
              className="rounded-2xl border border-[var(--border)] bg-white/70 px-4 py-3"
              placeholder="Email address"
              type="email"
              required
            />
            <input
              value={forgotOtp}
              onChange={(event) => setForgotOtp(event.target.value)}
              className="rounded-2xl border border-[var(--border)] bg-white/70 px-4 py-3"
              placeholder="6-digit OTP"
              inputMode="numeric"
              required
            />
            <input
              value={forgotPassword}
              onChange={(event) => setForgotPassword(event.target.value)}
              className="rounded-2xl border border-[var(--border)] bg-white/70 px-4 py-3"
              placeholder="New password"
              type="password"
              required
            />
            {devOtp ? (
              <p className="text-sm text-[var(--muted)]">
                Dev OTP: <span className="font-semibold text-[var(--accent)]">{devOtp}</span>
              </p>
            ) : null}
            {error ? <p className="text-sm text-[var(--accent)]">{error}</p> : null}
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className="button-primary rounded-full px-5 py-3 transition disabled:cursor-not-allowed disabled:opacity-60"
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
                className="button-secondary rounded-full px-5 py-3 transition"
              >
                Resend OTP
              </button>
            </div>
          </form>
        )
      ) : mode === "login" ? (
        <form className="mt-8 grid gap-4" onSubmit={(event) => void onLoginSubmit(event)}>
          <input
            value={loginIdentifier}
            onChange={(event) => setLoginIdentifier(event.target.value)}
            className="rounded-2xl border border-[var(--border)] bg-white/70 px-4 py-3"
            placeholder="Email address or phone number"
            required
          />
          <input
            value={loginPassword}
            onChange={(event) => setLoginPassword(event.target.value)}
            className="rounded-2xl border border-[var(--border)] bg-white/70 px-4 py-3"
            placeholder="Password"
            type="password"
            required
          />
          {error ? <p className="text-sm text-[var(--accent)]">{error}</p> : null}
          <button
            type="button"
            onClick={openForgotPassword}
            className="justify-self-start text-sm font-medium text-[var(--accent)] underline underline-offset-4"
          >
            Forgot password?
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="button-primary rounded-full px-5 py-3 transition disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Signing in..." : "Login"}
          </button>
        </form>
      ) : (
        <form className="mt-8 grid gap-4" onSubmit={(event) => void onSignupSubmit(event)}>
          <input
            value={signupName}
            onChange={(event) => setSignupName(event.target.value)}
            className="rounded-2xl border border-[var(--border)] bg-white/70 px-4 py-3"
            placeholder="Full name"
            required
          />
          <input
            value={signupEmail}
            onChange={(event) => {
              setSignupEmail(event.target.value);
              setSignupOtpRequested(false);
              setSignupOtp("");
              setSignupDevOtp("");
            }}
            className="rounded-2xl border border-[var(--border)] bg-white/70 px-4 py-3"
            placeholder="Email address"
            type="email"
            required
          />
          <input
            value={signupPhone}
            onChange={(event) => setSignupPhone(event.target.value)}
            className="rounded-2xl border border-[var(--border)] bg-white/70 px-4 py-3"
            placeholder="Phone number"
            type="tel"
            required
          />
          <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
            <input
              value={signupOtp}
              onChange={(event) => setSignupOtp(event.target.value)}
              className="rounded-2xl border border-[var(--border)] bg-white/70 px-4 py-3"
              placeholder="Email OTP"
              inputMode="numeric"
              required
            />
            <button
              type="button"
              onClick={() => void onRequestSignupOtp()}
              disabled={isSubmitting}
              className="button-secondary rounded-full px-5 py-3 transition disabled:cursor-not-allowed disabled:opacity-60"
            >
              {signupOtpRequested ? "Resend OTP" : "Send OTP"}
            </button>
          </div>
          <input
            value={signupPassword}
            onChange={(event) => setSignupPassword(event.target.value)}
            className="rounded-2xl border border-[var(--border)] bg-white/70 px-4 py-3"
            placeholder="Password"
            type="password"
            required
          />
          <input
            value={signupConfirmPassword}
            onChange={(event) => setSignupConfirmPassword(event.target.value)}
            className="rounded-2xl border border-[var(--border)] bg-white/70 px-4 py-3"
            placeholder="Confirm password"
            type="password"
            required
          />
          {signupDevOtp ? (
            <p className="text-sm text-[var(--muted)]">
              Dev OTP: <span className="font-semibold text-[var(--accent)]">{signupDevOtp}</span>
            </p>
          ) : null}
          {error ? <p className="text-sm text-[var(--accent)]">{error}</p> : null}
          <button
            type="submit"
            disabled={isSubmitting}
            className="button-primary rounded-full px-5 py-3 transition disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Creating account..." : "Create account"}
          </button>
        </form>
      )}
    </div>
  );
}
