import { getAdminAuthHeaders } from "@/lib/admin-auth";
import { apiUrl } from "@/lib/api";

export const ADMIN_MEDIA_UPLOAD_LIMIT_BYTES = 25 * 1024 * 1024;

type UploadedAdminMediaResponse = {
  id: string;
  filename: string;
  path: string;
  contentType: string;
  size: number;
};

export type UploadedAdminMedia = UploadedAdminMediaResponse & {
  url: string;
};

function resolveUploadedMediaUrl(path: string) {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  return apiUrl(path);
}

export async function uploadAdminMedia(file: File): Promise<UploadedAdminMedia> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 60000);

  try {
    const csrfCookie = document.cookie
      .split(";")
      .map((part) => part.trim())
      .find((part) => part.startsWith("hrushe-csrf="));
    const csrfToken = csrfCookie ? decodeURIComponent(csrfCookie.slice("hrushe-csrf=".length)) : "";
    const response = await fetch(apiUrl("/media/uploads"), {
      method: "POST",
      credentials: "include",
      headers: {
        ...getAdminAuthHeaders(),
        ...(csrfToken ? { "X-CSRF-Token": csrfToken } : {}),
        "Content-Type": file.type || "application/octet-stream",
        "X-File-Name": encodeURIComponent(file.name || "media"),
      },
      body: file,
      signal: controller.signal,
    });
    const data = (await response.json().catch(() => ({}))) as Partial<UploadedAdminMediaResponse> & {
      message?: string;
    };

    if (!response.ok) {
      throw new Error(data.message || "Media upload failed.");
    }

    const uploaded = data as UploadedAdminMediaResponse;

    return {
      ...uploaded,
      url: resolveUploadedMediaUrl(uploaded.path),
    };
  } catch (error) {
    if (controller.signal.aborted) {
      throw new Error("Media upload timed out. Please try a smaller file.");
    }

    throw error;
  } finally {
    window.clearTimeout(timeout);
  }
}
