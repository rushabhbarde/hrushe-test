"use client";

import { useState } from "react";
import { useAdminAuth } from "@/components/admin-auth-provider";
import { useToast } from "@/components/toast-provider";

type AdminAuthPanelProps = {
  onSuccess?: () => void;
  className?: string;
};

export function AdminAuthPanel({
  onSuccess,
  className = "",
}: AdminAuthPanelProps) {
  const { login } = useAdminAuth();
  const { pushToast } = useToast();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      const result = await login(username, password);

      if (!result.ok) {
        setError(result.error || "Invalid admin credentials.");
        return;
      }

      pushToast("Admin login successful.");
      onSuccess?.();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`flex flex-col gap-8 ${className}`.trim()}>
      <div className="flex flex-col gap-4">
        <p className="fr-mono fr-muted">Atelier · HRUSHE admin</p>
        <h1 className="fr-word text-[clamp(3rem,10vw,5rem)]">Sign in.</h1>
        <p className="max-w-md text-sm leading-6 text-[var(--muted)]">
          Pieces, the homepage and orders, for the people who run HRUSHE.
        </p>
      </div>

      <form className="flex flex-col gap-6" onSubmit={onSubmit}>
        <label className="fr-field">
          <span>Admin email</span>
          <input
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            className="fr-input"
            type="email"
            autoComplete="username"
            required
          />
        </label>
        <label className="fr-field">
          <span>Password</span>
          <input
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="fr-input"
            type="password"
            autoComplete="current-password"
            required
          />
        </label>
        {error ? (
          <p className="border-l-2 border-[var(--danger)] pl-3 text-sm text-[var(--danger)]" role="alert">
            {error}
          </p>
        ) : null}
        <p className="fr-mono fr-muted">Access follows your admin role.</p>
        <button type="submit" disabled={isSubmitting} className="fr-button">
          {isSubmitting ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}
