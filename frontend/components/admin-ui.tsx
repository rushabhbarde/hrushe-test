"use client";

import Link from "next/link";
import type { ReactNode } from "react";

type Tone = "default" | "accent" | "success" | "warning";

const toneClasses: Record<Tone, string> = {
  default:
    "border-[color:color-mix(in_srgb,var(--foreground)_10%,transparent)] bg-[color:color-mix(in_srgb,var(--surface)_86%,transparent)] text-[var(--foreground)]",
  accent:
    "border-[color:color-mix(in_srgb,var(--foreground)_16%,transparent)] bg-[color:color-mix(in_srgb,var(--foreground)_7%,transparent)] text-[var(--foreground)]",
  success:
    "border-[rgba(18,130,74,0.18)] bg-[rgba(18,130,74,0.1)] text-[#12824a]",
  warning:
    "border-[rgba(193,112,24,0.18)] bg-[rgba(193,112,24,0.1)] text-[#8c5417]",
};

function fieldClassName(className = "") {
  return `min-h-12 border border-[color:color-mix(in_srgb,var(--foreground)_10%,transparent)] bg-[color:color-mix(in_srgb,var(--surface)_78%,transparent)] px-4 text-sm text-[var(--foreground)] outline-none transition placeholder:text-[color:color-mix(in_srgb,var(--muted)_90%,transparent)] focus:border-[color:color-mix(in_srgb,var(--foreground)_28%,transparent)] focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--foreground)_5%,transparent)] ${className}`.trim();
}

export function AdminBadge({
  children,
  tone = "default",
}: {
  children: ReactNode;
  tone?: Tone;
}) {
  return (
    <span
      className={`inline-flex items-center border px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.18em] ${toneClasses[tone]}`}
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
      className={`border border-[color:color-mix(in_srgb,var(--foreground)_8%,transparent)] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--surface)_92%,transparent),color-mix(in_srgb,var(--surface-strong)_88%,transparent))] p-5 shadow-[0_20px_48px_rgba(17,17,17,0.08)] backdrop-blur md:p-6 ${className}`}
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
        tone === "accent"
          ? "text-[color:color-mix(in_srgb,var(--foreground)_82%,transparent)]"
          : "text-[var(--muted)]"
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
    <div className="theme-spotlight overflow-hidden border border-[color:color-mix(in_srgb,var(--foreground)_8%,transparent)] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--surface)_94%,transparent),color-mix(in_srgb,var(--surface-strong)_90%,transparent))] px-5 py-6 shadow-[0_24px_60px_rgba(17,17,17,0.08)] sm:px-7 sm:py-8 lg:flex lg:items-end lg:justify-between">
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
      {actions ? <div className="mt-5 flex flex-wrap gap-3 lg:mt-0 lg:justify-end">{actions}</div> : null}
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
      ? "button-primary px-5 py-3 text-sm font-medium"
      : "button-secondary px-5 py-3 text-sm font-medium";

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
    <div className="mb-5 flex flex-col gap-3 border-b border-[color:color-mix(in_srgb,var(--foreground)_8%,transparent)] pb-4 sm:flex-row sm:items-end sm:justify-between">
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
    <div className="empty-shell flex min-h-[240px] flex-col items-start justify-center px-6 py-8">
      <AdminSectionLabel>Ready when you are</AdminSectionLabel>
      <h3 className="mt-3 text-2xl font-semibold tracking-[-0.03em]">{title}</h3>
      <p className="mt-3 max-w-xl text-sm leading-6 text-[var(--muted)]">{description}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

export function AdminFilterInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={fieldClassName(props.className)} />;
}

export function AdminFilterSelect(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={fieldClassName(props.className)} />;
}

export function AdminTextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={`${fieldClassName(props.className)} min-h-[132px] py-3`}
    />
  );
}

export function AdminField({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-medium text-[var(--foreground)]">{label}</span>
      {children}
      {hint ? <span className="text-xs leading-5 text-[var(--muted)]">{hint}</span> : null}
    </label>
  );
}

export function AdminSwitch({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description?: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between gap-4 border border-[color:color-mix(in_srgb,var(--foreground)_8%,transparent)] bg-[color:color-mix(in_srgb,var(--surface)_80%,transparent)] px-4 py-4 text-left"
      aria-pressed={checked}
    >
      <div>
        <p className="text-sm font-medium text-[var(--foreground)]">{label}</p>
        {description ? <p className="mt-1 text-xs leading-5 text-[var(--muted)]">{description}</p> : null}
      </div>
      <span
        className={`relative inline-flex h-7 w-12 shrink-0 items-center border transition ${
          checked
            ? "border-[var(--foreground)] bg-[var(--foreground)]"
            : "border-[color:color-mix(in_srgb,var(--foreground)_14%,transparent)] bg-[color:color-mix(in_srgb,var(--surface-strong)_90%,transparent)]"
        }`}
      >
        <span
          className={`absolute left-1 h-4.5 w-4.5 bg-[var(--background)] transition ${
            checked ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </span>
    </button>
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

export function AdminConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  destructive = false,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-[rgba(0,0,0,0.36)] px-4 backdrop-blur-sm">
      <div className="w-full max-w-md border border-[color:color-mix(in_srgb,var(--foreground)_10%,transparent)] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--surface)_96%,transparent),color-mix(in_srgb,var(--surface-strong)_94%,transparent))] p-6 shadow-[0_32px_80px_rgba(17,17,17,0.18)]">
        <AdminSectionLabel tone={destructive ? "warning" : "accent"}>
          {destructive ? "Confirm destructive action" : "Confirm action"}
        </AdminSectionLabel>
        <h3 className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-[var(--foreground)]">
          {title}
        </h3>
        <p className="mt-3 text-sm leading-6 text-[var(--muted)]">{description}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <button type="button" onClick={onCancel} className="button-secondary px-5 py-3 text-sm font-medium">
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`px-5 py-3 text-sm font-medium ${
              destructive
                ? "border border-[var(--danger)] bg-[var(--danger)] text-white"
                : "button-primary"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

