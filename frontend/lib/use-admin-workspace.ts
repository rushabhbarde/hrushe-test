"use client";

import { useEffect, useState } from "react";
import { getAdminAuthHeaders } from "@/lib/admin-auth";
import { apiRequest } from "@/lib/api";
import {
  deepMergeWorkspace,
  defaultAdminWorkspace,
  normalizeAdminWorkspace,
  type AdminWorkspace,
} from "@/lib/admin-workspace";

const ADMIN_WORKSPACE_CACHE_TTL = 60_000;

let adminWorkspaceCache: { value: AdminWorkspace; timestamp: number } | null = null;
let adminWorkspaceRequest: Promise<AdminWorkspace> | null = null;

function isCacheFresh() {
  return (
    adminWorkspaceCache &&
    Date.now() - adminWorkspaceCache.timestamp < ADMIN_WORKSPACE_CACHE_TTL
  );
}

async function fetchAdminWorkspace() {
  if (isCacheFresh()) {
    return adminWorkspaceCache!.value;
  }

  if (!adminWorkspaceRequest) {
    adminWorkspaceRequest = apiRequest<Partial<AdminWorkspace>>("/content/admin-workspace", {
      headers: getAdminAuthHeaders(),
      cache: "no-store",
    })
      .then((payload) => {
        const normalized = normalizeAdminWorkspace(payload);
        adminWorkspaceCache = {
          value: normalized,
          timestamp: Date.now(),
        };
        return normalized;
      })
      .finally(() => {
        adminWorkspaceRequest = null;
      });
  }

  return adminWorkspaceRequest;
}

export function useAdminWorkspace() {
  const [workspace, setWorkspace] = useState<AdminWorkspace>(
    adminWorkspaceCache?.value || defaultAdminWorkspace
  );
  const [loading, setLoading] = useState(!adminWorkspaceCache);

  useEffect(() => {
    let active = true;

    void fetchAdminWorkspace()
      .then((nextWorkspace) => {
        if (active) {
          setWorkspace(nextWorkspace);
        }
      })
      .catch(() => {
        if (active) {
          setWorkspace(defaultAdminWorkspace);
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  async function saveWorkspace(
    nextValue:
      | Partial<AdminWorkspace>
      | ((current: AdminWorkspace) => AdminWorkspace | Partial<AdminWorkspace>)
  ) {
    const current = adminWorkspaceCache?.value || workspace;
    const patch =
      typeof nextValue === "function" ? nextValue(current) : nextValue;
    const normalized = normalizeAdminWorkspace(
      deepMergeWorkspace(current, patch as Partial<AdminWorkspace>)
    );

    setWorkspace(normalized);
    adminWorkspaceCache = {
      value: normalized,
      timestamp: Date.now(),
    };

    const saved = await apiRequest<Partial<AdminWorkspace>>("/content/admin-workspace", {
      method: "PUT",
      body: JSON.stringify({
        ...(patch as Partial<AdminWorkspace>),
        version: current.version,
      }),
      headers: getAdminAuthHeaders(),
    });
    const normalizedSaved = normalizeAdminWorkspace(saved);
    adminWorkspaceCache = {
      value: normalizedSaved,
      timestamp: Date.now(),
    };
    setWorkspace(normalizedSaved);
    return normalizedSaved;
  }

  async function refreshWorkspace() {
    adminWorkspaceCache = null;
    const fresh = await fetchAdminWorkspace();
    setWorkspace(fresh);
    return fresh;
  }

  return {
    workspace,
    loading,
    saveWorkspace,
    setWorkspace,
    refreshWorkspace,
  };
}
