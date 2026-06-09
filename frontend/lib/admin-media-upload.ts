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

export async function uploadAdminMedia(file: File): Promise<UploadedAdminMedia> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 60000);

  try {
    const response = await fetch(apiUrl("/media/uploads"), {
      method: "POST",
      credentials: "include",
      headers: {
        ...getAdminAuthHeaders(),
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
      url: apiUrl(uploaded.path),
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
