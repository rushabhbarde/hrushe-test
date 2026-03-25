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
      if (!(await login(username, password))) {
        setError("Invalid admin credentials.");
        return;
      }

      pushToast("Admin login successful.");
      onSuccess?.();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`grain-card rounded-[2rem] p-6 sm:p-8 ${className}`.trim()}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="eyebrow text-[var(--accent)]">Admin portal</p>
          <h2 className="display-font mt-3 text-3xl sm:text-4xl">Admin login.</h2>
          <p className="mt-3 max-w-md text-sm leading-6 text-[var(--muted)]">
            Sign in to manage products, homepage content, and live customer orders.
          </p>
        </div>
      </div>

      <form className="mt-8 grid gap-4" onSubmit={onSubmit}>
        <input
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          className="rounded-2xl border border-[var(--border)] bg-white/70 px-4 py-3"
          placeholder="Username"
          required
        />
        <input
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="rounded-2xl border border-[var(--border)] bg-white/70 px-4 py-3"
          placeholder="Password"
          type="password"
          required
        />
        {error ? <p className="text-sm text-[var(--accent)]">{error}</p> : null}
        <button
          type="submit"
          disabled={isSubmitting}
          className="button-primary rounded-full px-5 py-3 transition disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "Signing in..." : "Login"}
        </button>
      </form>
    </div>
  );
}
