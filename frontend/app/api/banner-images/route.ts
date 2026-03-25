import { readdir } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

const allowedExtensions = new Set([".jpg", ".jpeg", ".png", ".webp", ".avif"]);

export async function GET() {
  try {
    const bannersDir = path.join(process.cwd(), "public", "uploads", "banners");
    const files = await readdir(bannersDir);

    const images = files
      .filter((file) => allowedExtensions.has(path.extname(file).toLowerCase()))
      .sort((first, second) => first.localeCompare(second))
      .map((file) => `/uploads/banners/${file}`);

    return NextResponse.json({ images });
  } catch {
    return NextResponse.json({ images: [] });
  }
}
