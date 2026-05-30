"use client";

import { useState } from "react";
import { AdminShell } from "@/components/admin-shell";
import {
  AdminField,
  AdminPageHeader,
  AdminPanel,
  AdminSubhead,
} from "@/components/admin-ui";
import { useToast } from "@/components/toast-provider";
import {
  adminPermissionCatalog,
  type AdminPermission,
  type AdminRoleRecord,
} from "@/lib/admin-workspace";
import { useAdminWorkspace } from "@/lib/use-admin-workspace";

export default function AdminRolesPage() {
  const { workspace, saveWorkspace } = useAdminWorkspace();
  const { pushToast } = useToast();
  const [selectedRoleId, setSelectedRoleId] = useState(workspace.roles[0]?.id || "");

  const selectedRole =
    workspace.roles.find((role) => role.id === selectedRoleId) || workspace.roles[0];

  async function updateRole(nextRole: AdminRoleRecord) {
    await saveWorkspace({
      roles: workspace.roles.map((role) => (role.id === nextRole.id ? nextRole : role)),
    });
    pushToast("Role permissions updated.");
  }

  return (
    <AdminShell>
      <div className="space-y-6">
        <AdminPageHeader
          eyebrow="Roles & permissions"
          title="Configure staff access with clear operational boundaries."
          description="Assign exactly what each admin role can view and manage across the storefront, catalog, customers, and operations."
        />

        <div className="grid gap-5 xl:grid-cols-[260px_minmax(0,1fr)]">
          <AdminPanel>
            <AdminSubhead title="Roles" />
            <div className="space-y-2">
              {workspace.roles.map((role) => (
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
            <div className="grid gap-4 md:grid-cols-2">
              {adminPermissionCatalog.map((permission) => {
                const checked = selectedRole.permissions.includes(permission);

                return (
                  <label
                    key={permission}
                    className="flex items-start gap-3 border border-[color:color-mix(in_srgb,var(--foreground)_8%,transparent)] bg-[color:color-mix(in_srgb,var(--surface)_80%,transparent)] px-4 py-4"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => {
                        const nextPermissions: AdminPermission[] = checked
                          ? selectedRole.permissions.filter((item) => item !== permission)
                          : [...selectedRole.permissions, permission];
                        void updateRole({
                          ...selectedRole,
                          permissions: nextPermissions,
                        });
                      }}
                    />
                    <div>
                      <p className="text-sm font-semibold">{permission}</p>
                      <p className="mt-1 text-xs text-[var(--muted)]">
                        Controls whether this role can access the {permission.split(".")[0]} module.
                      </p>
                    </div>
                  </label>
                );
              })}
            </div>

            <div className="mt-5">
              <AdminField label="Role description">
                <textarea
                  value={selectedRole.description}
                  onChange={(event) =>
                    void updateRole({ ...selectedRole, description: event.target.value })
                  }
                  className="min-h-[120px] w-full border border-[color:color-mix(in_srgb,var(--foreground)_10%,transparent)] bg-[color:color-mix(in_srgb,var(--surface)_78%,transparent)] px-4 py-3 text-sm"
                />
              </AdminField>
            </div>
          </AdminPanel>
        </div>
      </div>
    </AdminShell>
  );
}

