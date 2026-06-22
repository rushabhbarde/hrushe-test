import { clearAdminToken, getAdminAuthHeaders } from "@/lib/admin-auth";
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

const mediaExtensions: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "video/mp4": "mp4",
  "video/webm": "webm",
  "video/ogg": "ogv",
};

function bytesToAscii(bytes: Uint8Array) {
  return Array.from(bytes, (byte) => String.fromCharCode(byte)).join("");
}

function detectMediaType(bytes: Uint8Array) {
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  const ascii = bytesToAscii(bytes);

  if (hex.startsWith("ffd8ff")) return "image/jpeg";
  if (hex.startsWith("89504e470d0a1a0a")) return "image/png";
  if (ascii.startsWith("RIFF") && ascii.slice(8, 12) === "WEBP") return "image/webp";
  if (ascii.slice(4, 8) === "ftyp") return "video/mp4";
  if (hex.startsWith("1a45dfa3")) return "video/webm";
  if (ascii.startsWith("OggS")) return "video/ogg";
  return "";
}

async function normalizeMediaFile(file: File) {
  const header = new Uint8Array(await file.slice(0, 16).arrayBuffer());
  const detectedType = detectMediaType(header);

  if (!detectedType || detectedType === file.type.toLowerCase()) {
    return file;
  }

  const baseName = file.name.replace(/\.[^.]+$/, "") || "hrushe-media";
  return new File(
    [file],
    `${baseName}.${mediaExtensions[detectedType] || "bin"}`,
    {
      type: detectedType,
      lastModified: file.lastModified,
    }
  );
}

export async function uploadAdminMedia(file: File): Promise<UploadedAdminMedia> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 60000);

  try {
    const normalizedFile = await normalizeMediaFile(file);
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
        "Content-Type": normalizedFile.type || "application/octet-stream",
        "X-File-Name": encodeURIComponent(normalizedFile.name || "media"),
      },
      body: normalizedFile,
      signal: controller.signal,
    });
    const data = (await response.json().catch(() => ({}))) as Partial<UploadedAdminMediaResponse> & {
      message?: string;
    };

    if (response.status === 401) {
      clearAdminToken();
      throw new Error("Your admin session expired. Sign in again, then retry the upload.");
    }

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
