"use client";

import { AdminActionButton, AdminEmptyState, AdminPageHeader, AdminPanel, AdminSectionLabel, AdminSubhead } from "@/components/admin-ui";
import { AdminShell } from "@/components/admin-shell";

type ModuleStat = {
  label: string;
  value: string;
  detail?: string;
};

type ModuleListItem = {
  title: string;
  meta?: string;
  description: string;
};

export function AdminModulePage({
  eyebrow,
  title,
  description,
  primaryAction,
  secondaryAction,
  stats,
  sections,
}: {
  eyebrow: string;
  title: string;
  description: string;
  primaryAction?: { label: string; href: string };
  secondaryAction?: { label: string; href: string };
  stats: ReadonlyArray<ModuleStat>;
  sections: ReadonlyArray<{
    title: string;
    description?: string;
    items: ReadonlyArray<ModuleListItem>;
  }>;
}) {
  return (
    <AdminShell>
      <div className="space-y-6">
        <AdminPageHeader
          eyebrow={eyebrow}
          title={title}
          description={description}
          actions={
            <>
              {secondaryAction ? (
                <AdminActionButton href={secondaryAction.href} variant="secondary">
                  {secondaryAction.label}
                </AdminActionButton>
              ) : null}
              {primaryAction ? (
                <AdminActionButton href={primaryAction.href}>{primaryAction.label}</AdminActionButton>
              ) : null}
            </>
          }
        />

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => (
            <AdminPanel key={stat.label}>
              <AdminSectionLabel>{stat.label}</AdminSectionLabel>
              <p className="mt-4 text-3xl font-semibold tracking-[-0.04em]">{stat.value}</p>
              {stat.detail ? <p className="mt-3 text-sm leading-6 text-[var(--muted)]">{stat.detail}</p> : null}
            </AdminPanel>
          ))}
        </div>

        <div className="grid gap-5 xl:grid-cols-2">
          {sections.map((section) => (
            <AdminPanel key={section.title}>
              <AdminSubhead title={section.title} description={section.description} />
              {section.items.length ? (
                <div className="space-y-3">
                  {section.items.map((item) => (
                    <div
                      key={`${section.title}-${item.title}`}
                      className="rounded-[1.25rem] border border-[rgba(17,17,17,0.08)] px-4 py-4"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <h3 className="text-base font-semibold tracking-[-0.02em]">{item.title}</h3>
                          {item.meta ? (
                            <p className="mt-1 text-[11px] uppercase tracking-[0.2em] text-[var(--accent)]">
                              {item.meta}
                            </p>
                          ) : null}
                        </div>
                      </div>
                      <p className="mt-3 text-sm leading-6 text-[var(--muted)]">{item.description}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <AdminEmptyState
                  title={`No ${section.title.toLowerCase()} yet`}
                  description="This module is wired into the new admin structure and ready for deeper business logic as soon as you need it."
                />
              )}
            </AdminPanel>
          ))}
        </div>
      </div>
    </AdminShell>
  );
}
