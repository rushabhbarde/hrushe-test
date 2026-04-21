"use client";

import Link from "next/link";
import type { ReactNode } from "react";

type Tone = "default" | "accent" | "success" | "warning";

const toneClasses: Record<Tone, string> = {
  default:
    "border-[rgba(17,17,17,0.08)] bg-white text-[var(--foreground)]",
  accent:
    "border-[rgba(214,31,38,0.14)] bg-[rgba(214,31,38,0.06)] text-[var(--accent)]",
  success:
    "border-[rgba(18,130,74,0.14)] bg-[rgba(18,130,74,0.08)] text-[#12824a]",
  warning:
    "border-[rgba(193,112,24,0.14)] bg-[rgba(193,112,24,0.08)] text-[#8c5417]",
};

export function AdminBadge({
  children,
  tone = "default",
}: {
  children: ReactNode;
  tone?: Tone;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.18em] ${toneClasses[tone]}`}
    >
      {children}
    </span>
  );
}

export function AdminPanel({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-[1.75rem] border border-[rgba(17,17,17,0.08)] bg-white/96 p-5 shadow-[0_16px_40px_rgba(17,17,17,0.06)] backdrop-blur md:p-6 ${className}`}
    >
      {children}
    </section>
  );
}

export function AdminSectionLabel({
  children,
  tone = "accent",
}: {
  children: ReactNode;
  tone?: Tone;
}) {
  return (
    <p
      className={`text-[11px] font-medium uppercase tracking-[0.28em] ${
        tone === "accent" ? "text-[var(--accent)]" : "text-[var(--muted)]"
      }`}
    >
      {children}
    </p>
  );
}

export function AdminPageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-5 rounded-[2rem] border border-[rgba(17,17,17,0.06)] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(255,255,255,0.9))] px-5 py-6 shadow-[0_20px_48px_rgba(17,17,17,0.05)] sm:px-7 sm:py-8 lg:flex-row lg:items-end lg:justify-between">
      <div className="max-w-3xl">
        <AdminSectionLabel>{eyebrow}</AdminSectionLabel>
        <h1 className="display-font mt-3 text-4xl leading-none text-[var(--foreground)] sm:text-5xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--muted)] sm:text-base">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-3 lg:justify-end">{actions}</div> : null}
    </div>
  );
}

export function AdminActionButton({
  href,
  children,
  variant = "primary",
}: {
  href: string;
  children: ReactNode;
  variant?: "primary" | "secondary";
}) {
  const className =
    variant === "primary"
      ? "button-primary rounded-full px-5 py-3 text-sm font-medium"
      : "button-secondary rounded-full px-5 py-3 text-sm font-medium";

  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}

export function AdminMetricCard({
  label,
  value,
  detail,
  tone = "default",
}: {
  label: string;
  value: string;
  detail?: string;
  tone?: Tone;
}) {
  return (
    <AdminPanel className="flex min-h-[164px] flex-col justify-between">
      <div className="flex items-start justify-between gap-3">
        <AdminSectionLabel tone={tone}>{label}</AdminSectionLabel>
        <AdminBadge tone={tone}>{tone === "default" ? "Live" : tone}</AdminBadge>
      </div>
      <div className="space-y-3">
        <p className="text-4xl font-semibold leading-none tracking-[-0.04em] text-[var(--foreground)]">
          {value}
        </p>
        {detail ? <p className="text-sm leading-6 text-[var(--muted)]">{detail}</p> : null}
      </div>
    </AdminPanel>
  );
}

export function AdminSubhead({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-col gap-3 border-b border-[rgba(17,17,17,0.08)] pb-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h2 className="text-2xl font-semibold tracking-[-0.03em] text-[var(--foreground)]">
          {title}
        </h2>
        {description ? (
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{description}</p>
        ) : null}
      </div>
      {action}
    </div>
  );
}

export function AdminEmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="empty-shell flex min-h-[240px] flex-col items-start justify-center rounded-[1.5rem] px-6 py-8">
      <AdminSectionLabel>Ready when you are</AdminSectionLabel>
      <h3 className="mt-3 text-2xl font-semibold tracking-[-0.03em]">{title}</h3>
      <p className="mt-3 max-w-xl text-sm leading-6 text-[var(--muted)]">{description}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

export function AdminFilterInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`min-h-11 rounded-full border border-[rgba(17,17,17,0.1)] bg-white px-4 text-sm outline-none transition placeholder:text-[var(--muted)] focus:border-[rgba(17,17,17,0.25)] ${props.className || ""}`}
    />
  );
}

export function AdminFilterSelect(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={`min-h-11 rounded-full border border-[rgba(17,17,17,0.1)] bg-white px-4 text-sm outline-none transition focus:border-[rgba(17,17,17,0.25)] ${props.className || ""}`}
    />
  );
}

export function AdminKeyValue({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="space-y-1">
      <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-[var(--muted)]">
        {label}
      </p>
      <div className="text-sm leading-6 text-[var(--foreground)]">{value}</div>
    </div>
  );
}
