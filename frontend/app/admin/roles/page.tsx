"use client";

import { useEffect, useMemo, useState } from "react";
import { AdminShell } from "@/components/admin-shell";
import {
  AdminBadge,
  AdminField,
  AdminFilterInput,
  AdminFilterSelect,
  AdminPageHeader,
  AdminPanel,
  AdminSubhead,
} from "@/components/admin-ui";
import { useAdminAuth } from "@/components/admin-auth-provider";
import { useToast } from "@/components/toast-provider";
import { getAdminAuthHeaders } from "@/lib/admin-auth";
import { apiRequest } from "@/lib/api";
import {
  adminPermissionCatalog,
  adminRoleDefinitions,
  type AdminPermission,
  type AdminRoleId,
  type AdminRoleRecord,
} from "@/lib/admin-workspace";

type StaffUser = {
  id: string;
  name: string;
  email: string;
  phone: string;
  adminRole: AdminRoleId;
  adminRoleName: string;
  adminPermissions: AdminPermission[];
  lastLoginAt: string | null;
  createdAt: string;
};

type StaffPayload = {
  roles: AdminRoleRecord[];
  staff: StaffUser[];
};

const defaultDraft = {
  name: "",
  email: "",
  phone: "",
  password: "",
  adminRole: "brand-growth-manager" as AdminRoleId,
};

export default function AdminRolesPage() {
  const { hasPermission } = useAdminAuth();
  const { pushToast } = useToast();
  const [roles, setRoles] = useState<AdminRoleRecord[]>(adminRoleDefinitions);
  const [staff, setStaff] = useState<StaffUser[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState<AdminRoleId>("super-admin");
  const [draft, setDraft] = useState(defaultDraft);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const selectedRole = useMemo(
    () => roles.find((role) => role.id === selectedRoleId) || roles[0],
    [roles, selectedRoleId]
  );

  useEffect(() => {
    if (!hasPermission("roles.manage")) {
      setLoading(false);
      return;
    }

    let active = true;

    void apiRequest<StaffPayload>("/admin/staff", {
      headers: getAdminAuthHeaders(),
      cache: "no-store",
    })
      .then((payload) => {
        if (!active) {
          return;
        }

        setRoles(payload.roles?.length ? payload.roles : adminRoleDefinitions);
        setStaff(payload.staff || []);
      })
      .catch((error) => {
        pushToast(
          error instanceof Error ? error.message : "Could not load staff roles.",
          "error"
        );
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [hasPermission, pushToast]);

  async function createStaffUser() {
    if (!draft.name.trim() || !draft.email.trim() || !draft.password.trim()) {
      pushToast("Name, email, and password are required.", "error");
      return;
    }

    setSaving(true);
    try {
      const created = await apiRequest<StaffUser>("/admin/staff", {
        method: "POST",
        headers: getAdminAuthHeaders(),
        body: JSON.stringify(draft),
      });
      setStaff((current) => [...current, created]);
      setDraft(defaultDraft);
      pushToast("Staff account created.");
    } catch (error) {
      pushToast(
        error instanceof Error ? error.message : "Could not create staff account.",
        "error"
      );
    } finally {
      setSaving(false);
    }
  }

  async function updateStaffRole(staffUser: StaffUser, adminRole: AdminRoleId) {
    setSaving(true);
    try {
      const updated = await apiRequest<StaffUser>(`/admin/staff/${staffUser.id}/role`, {
        method: "PUT",
        headers: getAdminAuthHeaders(),
        body: JSON.stringify({ adminRole }),
      });
      setStaff((current) =>
        current.map((item) => (item.id === updated.id ? updated : item))
      );
      pushToast(`${updated.name} is now ${updated.adminRoleName}.`);
    } catch (error) {
      pushToast(
        error instanceof Error ? error.message : "Could not update staff role.",
        "error"
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminShell>
      <div className="space-y-6">
        <AdminPageHeader
          eyebrow="Roles & permissions"
          title="Run HRUSHE with four clear staff roles."
          description="Super Admin controls the full workspace. Brand & Growth owns banners, coupons, content, media, reviews, and sales visibility. Operations owns orders, tracking, shipping, returns, and support. Catalog owns products and merchandising."
        />

        <div className="grid gap-4 md:grid-cols-4">
          {roles.map((role) => (
            <AdminPanel key={role.id} className="min-h-[160px]">
              <AdminBadge tone={role.id === "super-admin" ? "accent" : "default"}>
                {role.permissions.length} permissions
              </AdminBadge>
              <h2 className="mt-4 text-2xl font-semibold tracking-[-0.04em]">
                {role.name}
              </h2>
              <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
                {role.description}
              </p>
            </AdminPanel>
          ))}
        </div>

        <div className="grid gap-5 xl:grid-cols-[280px_minmax(0,1fr)]">
          <AdminPanel>
            <AdminSubhead title="Role matrix" description="System roles are fixed for safer operations." />
            <div className="space-y-2">
              {roles.map((role) => (
                <button
                  key={role.id}
                  type="button"
                  onClick={() => setSelectedRoleId(role.id)}
                  className={`w-full px-3 py-3 text-left text-sm ${
                    role.id === selectedRole.id
                      ? "bg-[var(--foreground)] text-[var(--background)]"
                      : "border border-[color:color-mix(in_srgb,var(--foreground)_8%,transparent)] bg-[color:color-mix(in_srgb,var(--surface)_80%,transparent)]"
                  }`}
                >
                  {role.name}
                </button>
              ))}
            </div>
          </AdminPanel>

          <AdminPanel>
            <AdminSubhead title={selectedRole.name} description={selectedRole.description} />
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {adminPermissionCatalog.map((permission) => {
                const enabled = selectedRole.permissions.includes(permission);

                return (
                  <div
                    key={permission}
                    className={`border px-4 py-3 text-sm ${
                      enabled
                        ? "border-[rgba(18,130,74,0.18)] bg-[rgba(18,130,74,0.08)]"
                        : "border-[color:color-mix(in_srgb,var(--foreground)_8%,transparent)] bg-[color:color-mix(in_srgb,var(--surface)_78%,transparent)] opacity-55"
                    }`}
                  >
                    <p className="font-semibold">{permission}</p>
                    <p className="mt-1 text-xs text-[var(--muted)]">
                      {enabled ? "Allowed" : "Restricted"}
                    </p>
                  </div>
                );
              })}
            </div>
          </AdminPanel>
        </div>

        <div className="grid gap-5 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <AdminPanel>
            <AdminSubhead
              title="Create staff account"
              description="Give each person a focused login instead of sharing Super Admin credentials."
            />
            <div className="grid gap-4">
              <AdminField label="Name">
                <AdminFilterInput
                  value={draft.name}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, name: event.target.value }))
                  }
                />
              </AdminField>
              <AdminField label="Email">
                <AdminFilterInput
                  value={draft.email}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, email: event.target.value }))
                  }
                />
              </AdminField>
              <AdminField label="Phone">
                <AdminFilterInput
                  value={draft.phone}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, phone: event.target.value }))
                  }
                />
              </AdminField>
              <AdminField label="Temporary password" hint="Use at least 8 characters with one letter and one number.">
                <AdminFilterInput
                  type="password"
                  value={draft.password}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, password: event.target.value }))
                  }
                />
              </AdminField>
              <AdminField label="Role">
                <AdminFilterSelect
                  value={draft.adminRole}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      adminRole: event.target.value as AdminRoleId,
                    }))
                  }
                >
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.name}
                    </option>
                  ))}
                </AdminFilterSelect>
              </AdminField>
              <button
                type="button"
                onClick={() => void createStaffUser()}
                disabled={saving}
                className="button-primary px-5 py-3 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? "Saving..." : "Create staff"}
              </button>
            </div>
          </AdminPanel>

          <AdminPanel>
            <AdminSubhead
              title="Staff accounts"
              description="Only Super Admins can assign or change staff roles."
            />
            {loading ? (
              <p className="text-sm text-[var(--muted)]">Loading staff...</p>
            ) : staff.length === 0 ? (
              <p className="text-sm text-[var(--muted)]">No staff accounts yet.</p>
            ) : (
              <div className="space-y-3">
                {staff.map((staffUser) => (
                  <div
                    key={staffUser.id}
                    className="grid gap-4 border border-[color:color-mix(in_srgb,var(--foreground)_8%,transparent)] bg-[color:color-mix(in_srgb,var(--surface)_80%,transparent)] px-4 py-4 lg:grid-cols-[minmax(0,1fr)_260px]"
                  >
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold">{staffUser.name}</p>
                        <AdminBadge tone={staffUser.adminRole === "super-admin" ? "accent" : "default"}>
                          {staffUser.adminRoleName}
                        </AdminBadge>
                      </div>
                      <p className="mt-2 text-sm text-[var(--muted)]">{staffUser.email}</p>
                      <p className="mt-1 text-xs text-[var(--muted)]">
                        Last login:{" "}
                        {staffUser.lastLoginAt
                          ? new Date(staffUser.lastLoginAt).toLocaleString("en-IN")
                          : "Not yet"}
                      </p>
                    </div>
                    <AdminFilterSelect
                      value={staffUser.adminRole}
                      disabled={saving}
                      onChange={(event) =>
                        void updateStaffRole(staffUser, event.target.value as AdminRoleId)
                      }
                    >
                      {roles.map((role) => (
                        <option key={role.id} value={role.id}>
                          {role.name}
                        </option>
                      ))}
                    </AdminFilterSelect>
                  </div>
                ))}
              </div>
            )}
          </AdminPanel>
        </div>
      </div>
    </AdminShell>
  );
}
