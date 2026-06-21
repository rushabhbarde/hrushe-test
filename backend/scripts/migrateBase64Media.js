require("dotenv").config();

const crypto = require("crypto");
const mongoose = require("mongoose");
const connectDB = require("../src/config/db");
const Product = require("../src/models/Product");
const SiteContent = require("../src/models/SiteContent");
const { hasR2Config, uploadR2Object } = require("../src/utils/r2Storage");

const APPLY = process.argv.includes("--apply");
const migratedByHash = new Map();
let discovered = 0;
let migrated = 0;
let bytes = 0;

const parseDataUrl = (value) => {
  const match = String(value || "").match(/^data:(image\/(?:jpeg|png|webp)|video\/(?:mp4|webm|ogg));base64,(.+)$/s);
  if (!match) {
    return null;
  }

  return {
    contentType: match[1],
    buffer: Buffer.from(match[2], "base64"),
  };
};

const getMediaKind = (contentType) =>
  contentType.startsWith("video/") ? "videos" : "images";

const uploadDataUrl = async (value) => {
  const parsed = parseDataUrl(value);
  if (!parsed) {
    return value;
  }

  discovered += 1;
  bytes += parsed.buffer.length;
  const hash = crypto.createHash("sha256").update(parsed.buffer).digest("hex");

  if (migratedByHash.has(hash)) {
    return migratedByHash.get(hash);
  }

  if (!APPLY) {
    migratedByHash.set(hash, value);
    return value;
  }

  const extension = parsed.contentType.split("/")[1].replace("jpeg", "jpg");
  const r2Upload = await uploadR2Object({
    key: `migrated/base64/${getMediaKind(parsed.contentType)}/${hash}.${extension}`,
    body: parsed.buffer,
    contentType: parsed.contentType,
    metadata: {
      migratedFrom: "base64",
      hash,
      size: parsed.buffer.length,
    },
  });

  if (r2Upload) {
    migratedByHash.set(hash, r2Upload.url);
    migrated += 1;
    return r2Upload.url;
  }

  throw new Error("R2 upload did not return a public URL; migration stopped without changing this media value.");
};

const migrateValue = async (value) => {
  if (typeof value === "string") {
    return uploadDataUrl(value);
  }

  if (Array.isArray(value)) {
    return Promise.all(value.map(migrateValue));
  }

  if (value && typeof value === "object") {
    const entries = await Promise.all(
      Object.entries(value).map(async ([key, nestedValue]) => [key, await migrateValue(nestedValue)])
    );
    return Object.fromEntries(entries);
  }

  return value;
};

const run = async () => {
  await connectDB();

  if (APPLY && !hasR2Config()) {
    throw new Error("R2 configuration is required before applying the base64 media migration.");
  }

  const products = await Product.find();
  for (const product of products) {
    const media = await migrateValue({
      images: product.images,
      galleryImages: product.galleryImages,
      videos: product.videos.map((video) => video.toObject()),
    });

    if (APPLY) {
      product.images = media.images;
      product.galleryImages = media.galleryImages;
      product.videos = media.videos;
      await product.save();
    }
  }

  const siteDocuments = await SiteContent.find();
  for (const siteContent of siteDocuments) {
    const migratedContent = await migrateValue(siteContent.toObject());
    if (APPLY) {
      siteContent.homepageBanner = migratedContent.homepageBanner;
      siteContent.adminWorkspace = migratedContent.adminWorkspace;
      await siteContent.save();
    }
  }

  console.log(
    `${APPLY ? "Migrated" : "Found"} ${discovered} embedded media reference(s), ${migratedByHash.size} unique media object(s), ${migrated} uploaded, ${(bytes / 1024 / 1024).toFixed(2)} MB scanned.`
  );
  if (!APPLY) {
    console.log("Dry run only. Re-run with --apply after confirming the database backup.");
  }

  await mongoose.disconnect();
};

run().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect();
  process.exit(1);
});
