const express = require("express");
const mongoose = require("mongoose");

const { protect, requireAdminPermission } = require("../middleware/authMiddleware");
const AppError = require("../utils/AppError");
const asyncHandler = require("../utils/asyncHandler");

const router = express.Router();
const MAX_MEDIA_SIZE_BYTES = 25 * 1024 * 1024;
const MEDIA_BUCKET_NAME = "media";
const SUPPORTED_MEDIA_TYPES = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
  ["video/mp4", "mp4"],
  ["video/webm", "webm"],
  ["video/ogg", "ogv"],
]);

const rawMediaBody = express.raw({
  type: Array.from(SUPPORTED_MEDIA_TYPES.keys()),
  limit: "25mb",
});

function getMediaBucket() {
  if (!mongoose.connection.db) {
    throw new AppError("Media storage is not ready. Please try again.", 503);
  }

  return new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
    bucketName: MEDIA_BUCKET_NAME,
  });
}

function getMediaFilesCollection() {
  if (!mongoose.connection.db) {
    throw new AppError("Media storage is not ready. Please try again.", 503);
  }

  return mongoose.connection.db.collection(`${MEDIA_BUCKET_NAME}.files`);
}

function normalizeContentType(contentType = "") {
  return String(contentType).split(";")[0].trim().toLowerCase();
}

function sanitizeFilename(value = "media") {
  const decoded = (() => {
    try {
      return decodeURIComponent(value);
    } catch {
      return value;
    }
  })();

  return String(decoded)
    .replace(/\.[^.]+$/, "")
    .replace(/[^a-z0-9-_]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64) || "media";
}

function streamFile(bucket, id, range, file, res, next) {
  res.set({
    "Accept-Ranges": "bytes",
    "Cache-Control": "public, max-age=31536000, immutable",
    "Content-Type": file.contentType || file.metadata?.contentType || "application/octet-stream",
  });

  if (!range) {
    res.set("Content-Length", String(file.length));
    const downloadStream = bucket.openDownloadStream(id);
    downloadStream.on("error", next);
    downloadStream.pipe(res);
    return;
  }

  const [startValue, endValue] = String(range).replace(/bytes=/, "").split("-");
  const start = Number.parseInt(startValue, 10);
  const end = endValue ? Number.parseInt(endValue, 10) : file.length - 1;
  const safeEnd = Math.min(end, file.length - 1);

  if (Number.isNaN(start) || Number.isNaN(safeEnd) || start > safeEnd) {
    res.status(416).set("Content-Range", `bytes */${file.length}`).end();
    return;
  }

  res.status(206).set({
    "Content-Length": String(safeEnd - start + 1),
    "Content-Range": `bytes ${start}-${safeEnd}/${file.length}`,
  });

  const downloadStream = bucket.openDownloadStream(id, {
    start,
    end: safeEnd + 1,
  });
  downloadStream.on("error", next);
  downloadStream.pipe(res);
}

router.post(
  "/uploads",
  protect,
  requireAdminPermission("media.manage"),
  rawMediaBody,
  asyncHandler(async (req, res) => {
    const contentType = normalizeContentType(req.headers["content-type"]);

    if (!SUPPORTED_MEDIA_TYPES.has(contentType)) {
      throw new AppError("Upload an image or video file in JPG, PNG, WebP, MP4, WebM, or OGG format.", 415);
    }

    if (!Buffer.isBuffer(req.body) || req.body.length === 0) {
      throw new AppError("Choose a media file before uploading.", 400);
    }

    if (req.body.length > MAX_MEDIA_SIZE_BYTES) {
      throw new AppError("Media file must be under 25 MB.", 413);
    }

    const fileId = new mongoose.Types.ObjectId();
    const extension = SUPPORTED_MEDIA_TYPES.get(contentType);
    const originalName = String(req.headers["x-file-name"] || "media");
    const displayName = sanitizeFilename(originalName);
    const filename = `${Date.now()}-${fileId.toString()}-${displayName}.${extension}`;
    const bucket = getMediaBucket();
    const uploadStream = bucket.openUploadStreamWithId(fileId, filename, {
      contentType,
      metadata: {
        contentType,
        originalName,
        size: req.body.length,
        uploadedBy: req.user?._id,
      },
    });

    await new Promise((resolve, reject) => {
      uploadStream.once("finish", resolve);
      uploadStream.once("error", reject);
      uploadStream.end(req.body);
    });

    res.status(201).json({
      id: fileId.toString(),
      filename,
      path: `/media/files/${fileId.toString()}`,
      contentType,
      size: req.body.length,
    });
  })
);

router.get(
  "/files/:id",
  asyncHandler(async (req, res, next) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      throw new AppError("Media file not found.", 404);
    }

    const id = new mongoose.Types.ObjectId(req.params.id);
    const file = await getMediaFilesCollection().findOne({ _id: id });

    if (!file) {
      throw new AppError("Media file not found.", 404);
    }

    streamFile(getMediaBucket(), id, req.headers.range, file, res, next);
  })
);

module.exports = router;
