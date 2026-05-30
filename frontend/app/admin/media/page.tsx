"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { AdminShell } from "@/components/admin-shell";
import {
  AdminField,
  AdminFilterInput,
  AdminPageHeader,
  AdminPanel,
  AdminSubhead,
} from "@/components/admin-ui";
import { useToast } from "@/components/toast-provider";
import { compressSingleImage } from "@/lib/image-upload";
import { useAdminWorkspace } from "@/lib/use-admin-workspace";

export default function AdminMediaPage() {
  const { workspace, saveWorkspace } = useAdminWorkspace();
  const { pushToast } = useToast();
  const [query, setQuery] = useState("");
  const [folder, setFolder] = useState("all");

  const filteredAssets = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return workspace.mediaLibrary.filter((asset) => {
      const matchesFolder = folder === "all" || asset.folder === folder;
      const matchesQuery =
        !normalizedQuery ||
        [asset.name, asset.folder, asset.tags.join(" ")].join(" ").toLowerCase().includes(normalizedQuery);
      return matchesFolder && matchesQuery;
    });
  }, [folder, query, workspace.mediaLibrary]);

  async function handleUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const files = event.target.files;
    if (!files?.length) {
      return;
    }

    try {
      const uploads = await Promise.all(
        Array.from(files).map(async (file) => ({
          id: `media-${Date.now()}-${file.name}`,
          name: file.name.replace(/\.[^.]+$/, ""),
          url: await compressSingleImage(file, 1080),
          folder: folder === "all" ? "Product Assets" : folder,
          tags: [],
          createdAt: new Date().toISOString(),
        }))
      );

      await saveWorkspace({
        mediaLibrary: [...uploads, ...workspace.mediaLibrary],
      });
      pushToast("Media uploaded.");
    } catch {
      pushToast("Could not upload those media assets.", "error");
    }
  }

  const folders = Array.from(new Set(workspace.mediaLibrary.map((asset) => asset.folder)));

  return (
    <AdminShell>
      <div className="space-y-6">
        <AdminPageHeader
          eyebrow="Media library"
          title="Keep banner assets and product imagery in one searchable library."
          description="Upload assets, organize them into folders, and reuse them across homepage, products, and campaigns."
        />

        <AdminPanel>
          <AdminSubhead title="Library filters" />
          <div className="grid gap-3 lg:grid-cols-[1.4fr_220px_1fr]">
            <AdminFilterInput
              placeholder="Search assets, tags, folders"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            <select
              value={folder}
              onChange={(event) => setFolder(event.target.value)}
              className="min-h-12 border border-[color:color-mix(in_srgb,var(--foreground)_10%,transparent)] bg-[color:color-mix(in_srgb,var(--surface)_78%,transparent)] px-4 text-sm"
            >
              <option value="all">All folders</option>
              {folders.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
            <AdminField label="Upload images">
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(event) => void handleUpload(event)}
                className="block w-full text-sm text-[var(--muted)] file:mr-4 file:border-0 file:bg-[var(--foreground)] file:px-4 file:py-2.5 file:text-sm file:font-medium file:text-[var(--background)]"
              />
            </AdminField>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {filteredAssets.map((asset) => (
              <div key={asset.id} className="overflow-hidden border border-[color:color-mix(in_srgb,var(--foreground)_8%,transparent)] bg-[color:color-mix(in_srgb,var(--surface)_80%,transparent)]">
                <div className="relative aspect-square">
                  <Image src={asset.url} alt={asset.name} fill unoptimized className="object-cover" />
                </div>
                <div className="space-y-2 px-4 py-4">
                  <p className="text-sm font-semibold">{asset.name}</p>
                  <p className="text-xs uppercase tracking-[0.16em] text-[var(--muted)]">{asset.folder}</p>
                  <button
                    type="button"
                    onClick={() =>
                      void saveWorkspace({
                        mediaLibrary: workspace.mediaLibrary.filter((item) => item.id !== asset.id),
                      }).then(() => pushToast("Asset deleted."))
                    }
                    className="text-xs font-medium uppercase tracking-[0.16em] text-[var(--danger)]"
                  >
                    Delete image
                  </button>
                </div>
              </div>
            ))}
          </div>
        </AdminPanel>
      </div>
    </AdminShell>
  );
}

