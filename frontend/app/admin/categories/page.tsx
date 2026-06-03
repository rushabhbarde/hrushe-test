"use client";

import { useMemo, useState } from "react";
import { AdminShell } from "@/components/admin-shell";
import {
  AdminBadge,
  AdminConfirmDialog,
  AdminField,
  AdminFilterInput,
  AdminPageHeader,
  AdminPanel,
  AdminSectionLabel,
  AdminSubhead,
} from "@/components/admin-ui";
import { useToast } from "@/components/toast-provider";
import { resolveCatalogCategories } from "@/lib/admin-workspace";
import { useAdminWorkspace } from "@/lib/use-admin-workspace";
import { useStorefrontData } from "@/lib/use-storefront";

export default function AdminCategoriesPage() {
  const { workspace, saveWorkspace } = useAdminWorkspace();
  const { products } = useStorefrontData();
  const { pushToast } = useToast();
  const [newCategory, setNewCategory] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const categoryRows = useMemo(() => {
    return resolveCatalogCategories(workspace).map((category) => ({
      category,
      usageCount: products.filter(
        (product) =>
          product.category === category || (product.categories || []).includes(category)
      ).length,
    }));
  }, [products, workspace]);

  async function handleAddCategory() {
    const nextCategory = newCategory.trim();

    if (!nextCategory) {
      pushToast("Enter a category name first.", "error");
      return;
    }

    const exists = categoryRows.some(
      (row) => row.category.toLowerCase() === nextCategory.toLowerCase()
    );

    if (exists) {
      pushToast("That category already exists.", "error");
      return;
    }

    await saveWorkspace({
      catalogCategories: [...categoryRows.map((row) => row.category), nextCategory],
    });
    setNewCategory("");
    pushToast("Category added.");
  }

  async function handleDeleteCategory() {
    if (!deleteTarget) {
      return;
    }

    const row = categoryRows.find((item) => item.category === deleteTarget);

    if (row?.usageCount) {
      pushToast("Reassign products using this category before removing it.", "error");
      setDeleteTarget(null);
      return;
    }

    await saveWorkspace({
      catalogCategories: categoryRows
        .map((item) => item.category)
        .filter((category) => category !== deleteTarget),
    });
    pushToast("Category removed.");
    setDeleteTarget(null);
  }

  return (
    <AdminShell>
      <div className="space-y-6">
        <AdminPageHeader
          eyebrow="Catalog"
          title="Control product categories from one place."
          description="Add the categories you want the team to use, and they will appear automatically in the primary category dropdown for products."
        />

        <div className="grid gap-6 xl:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
          <AdminPanel>
            <AdminSubhead
              title="Add category"
              description="Create a clean category list for product setup and admin filtering."
            />

            <div className="space-y-4">
              <AdminField
                label="Category name"
                hint="Examples: Graphic Tees, Co-ords, Hoodies, Polo T-Shirts."
              >
                <AdminFilterInput
                  value={newCategory}
                  onChange={(event) => setNewCategory(event.target.value)}
                  placeholder="Enter a new category"
                />
              </AdminField>

              <button
                type="button"
                onClick={() => void handleAddCategory()}
                className="button-primary px-5 py-3 text-sm font-medium"
              >
                Add category
              </button>
            </div>

            <div className="mt-6 border border-[color:color-mix(in_srgb,var(--foreground)_8%,transparent)] bg-[color:color-mix(in_srgb,var(--surface)_80%,transparent)] px-4 py-4">
              <AdminSectionLabel>How it works</AdminSectionLabel>
              <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
                Products now use one primary category only. Manage the available category options
                here, then select them from the product form dropdown.
              </p>
            </div>
          </AdminPanel>

          <AdminPanel>
            <AdminSubhead
              title="Live category list"
              description="Only categories not currently used by products can be removed."
            />

            <div className="space-y-3">
              {categoryRows.map((row) => (
                <div
                  key={row.category}
                  className="flex flex-col gap-3 border border-[color:color-mix(in_srgb,var(--foreground)_8%,transparent)] bg-[color:color-mix(in_srgb,var(--surface)_80%,transparent)] px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="text-sm font-semibold text-[var(--foreground)]">
                      {row.category}
                    </p>
                    <p className="mt-1 text-xs leading-5 text-[var(--muted)]">
                      Used by {row.usageCount} product{row.usageCount === 1 ? "" : "s"}.
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <AdminBadge tone={row.usageCount > 0 ? "warning" : "success"}>
                      {row.usageCount > 0 ? "In use" : "Unused"}
                    </AdminBadge>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(row.category)}
                      className="px-4 py-2 text-xs font-medium uppercase tracking-[0.16em] text-[var(--danger)] disabled:cursor-not-allowed disabled:opacity-40"
                      disabled={row.usageCount > 0}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </AdminPanel>
        </div>

        <AdminConfirmDialog
          open={Boolean(deleteTarget)}
          title="Remove this category?"
          description="This only removes it from the admin category list. Products already using it must be reassigned first."
          confirmLabel="Remove category"
          destructive
          onConfirm={() => void handleDeleteCategory()}
          onCancel={() => setDeleteTarget(null)}
        />
      </div>
    </AdminShell>
  );
}
