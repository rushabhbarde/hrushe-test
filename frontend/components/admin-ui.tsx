"use client";

import Link from "next/link";
import type { ReactNode } from "react";

type Tone = "default" | "accent" | "success" | "warning";

const toneClasses: Record<Tone, string> = {
  default: "border-[color-mix(in_srgb,var(--foreground)_18%,transparent)] text-[var(--muted)]",
  accent: "border-[var(--foreground)] text-[var(--foreground)]",
  success: "border-[#1f6b43] text-[#1f6b43]",
  warning: "border-[#8c5417] text-[#8c5417]",
};

function fieldClassName(className = "") {
  return `min-h-12 w-full min-w-0 max-w-full border-0 border-b border-[color-mix(in_srgb,var(--foreground)_30%,transparent)] bg-transparent px-0 text-base text-[var(--foreground)] outline-none transition placeholder:text-[var(--fr-quiet)] focus:border-[var(--foreground)] ${className}`.trim();
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
      className={`fr-mono inline-flex items-center border px-2 py-1 text-[10px]! ${toneClasses[tone]}`}
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
      className={`border-t border-[color-mix(in_srgb,var(--foreground)_12%,transparent)] pt-6 ${className}`}
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
    <p className={`fr-mono ${tone === "accent" ? "" : "fr-muted"}`}>
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
    <div className="flex flex-col gap-6 pb-2 lg:flex-row lg:items-end lg:justify-between">
      <div className="max-w-4xl">
        <AdminSectionLabel tone="default">{eyebrow}</AdminSectionLabel>
        <h1 className="fr-word mt-4 text-[clamp(2.5rem,5vw,4.5rem)]">
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
      ? "fr-button w-auto! px-6"
      : "fr-mono inline-flex min-h-[3.25rem] items-center border border-[var(--foreground)] px-6";

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
    <AdminPanel className="flex min-h-[150px] flex-col justify-between gap-6">
      <AdminSectionLabel tone={tone === "default" ? "default" : "accent"}>{label}</AdminSectionLabel>
      <div className="space-y-3">
        <p className="fr-word text-[clamp(2.25rem,3.5vw,3.25rem)]">
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
    <div className="mb-5 flex flex-col gap-3 pb-2 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h2 className="fr-word text-[clamp(1.75rem,3vw,2.5rem)]">
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
    <div className="flex min-h-[200px] flex-col items-start justify-center py-8">
      <AdminSectionLabel tone="default">Nothing yet</AdminSectionLabel>
      <h3 className="fr-word mt-3 text-[clamp(1.75rem,3vw,2.5rem)]">{title}</h3>
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
    <label className="grid min-w-0 gap-2">
      <span className="fr-mono fr-muted min-w-0">{label}</span>
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
      className="flex w-full min-w-0 items-center justify-between gap-4 border-b border-[color-mix(in_srgb,var(--foreground)_10%,transparent)] py-4 text-left"
      aria-pressed={checked}
    >
      <div className="min-w-0">
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
      <p className="fr-mono fr-muted">{label}</p>
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
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-[rgba(0,0,0,0.36)] px-4">
      <div role="alertdialog" aria-modal="true" className="w-full max-w-md bg-[var(--background)] p-8">
        <AdminSectionLabel tone={destructive ? "warning" : "accent"}>
          {destructive ? "Confirm destructive action" : "Confirm action"}
        </AdminSectionLabel>
        <h3 className="fr-word mt-3 text-[2rem]">{title}</h3>
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
