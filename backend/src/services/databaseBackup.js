const zlib = require("zlib");
const mongoose = require("mongoose");
const {
  DeleteObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
} = require("@aws-sdk/client-s3");
const env = require("../config/env");
const { logEvent } = require("../utils/logger");
const { getR2Client } = require("../utils/r2Storage");

const BACKUP_PREFIX = "backups/";
const BACKUP_RETENTION_DAYS = 30;
const { EJSON } = mongoose.mongo.BSON;

const backupKeyForDate = (date = new Date()) =>
  `${BACKUP_PREFIX}hrushe-${date.toISOString().slice(0, 10)}.json.gz`;

/** Backups older than the retention window, judged by the date in their name. */
function selectExpiredBackupKeys(keys, now = new Date(), retentionDays = BACKUP_RETENTION_DAYS) {
  const cutoff = new Date(now.getTime() - retentionDays * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  return keys.filter((key) => {
    const match = /hrushe-(\d{4}-\d{2}-\d{2})\.json\.gz$/.exec(key);
    return Boolean(match) && match[1] < cutoff;
  });
}

/** Every collection as Extended JSON (keeps ObjectIds and dates exact), gzipped. */
function serializeBackup(collections, createdAt = new Date()) {
  const payload = EJSON.stringify({ format: "hrushe-backup-v1", createdAt, collections }, { relaxed: false });
  return zlib.gzipSync(Buffer.from(payload, "utf8"));
}

function deserializeBackup(buffer) {
  const backup = EJSON.parse(zlib.gunzipSync(buffer).toString("utf8"), { relaxed: false });
  if (backup?.format !== "hrushe-backup-v1" || typeof backup.collections !== "object") {
    throw new Error("Not a HRUSHE backup file.");
  }
  return backup;
}

async function readAllCollections(db) {
  const collections = {};
  const infos = await db.listCollections({}, { nameOnly: true }).toArray();
  for (const { name } of infos) {
    if (name.startsWith("system.")) continue;
    collections[name] = await db.collection(name).find({}).toArray();
  }
  return collections;
}

/** Write a backup's collections into a database, replacing what is there. */
async function restoreCollections(db, collections) {
  const restored = {};
  for (const [name, documents] of Object.entries(collections)) {
    const collection = db.collection(name);
    await collection.deleteMany({});
    if (documents.length > 0) {
      await collection.insertMany(documents, { ordered: false });
    }
    restored[name] = documents.length;
  }
  return restored;
}

const isBackupConfigured = () => Boolean(env.BACKUP_R2_BUCKET && getR2Client());

/**
 * Once a day: if today's backup is not in the private bucket yet, write it and drop backups
 * older than 30 days. Safe to call often; it does nothing when today's file already exists.
 */
async function runDailyBackupIfDue(now = new Date()) {
  if (!isBackupConfigured()) {
    return { ran: false, reason: "not-configured" };
  }

  const client = getR2Client();
  const Bucket = env.BACKUP_R2_BUCKET;
  const Key = backupKeyForDate(now);

  try {
    await client.send(new HeadObjectCommand({ Bucket, Key }));
    return { ran: false, reason: "already-done", key: Key };
  } catch (error) {
    const status = error?.$metadata?.httpStatusCode;
    if (status !== 404 && error?.name !== "NotFound") {
      throw error;
    }
  }

  const collections = await readAllCollections(mongoose.connection.db);
  const body = serializeBackup(collections, now);
  const documents = Object.values(collections).reduce((total, list) => total + list.length, 0);

  await client.send(
    new PutObjectCommand({ Bucket, Key, Body: body, ContentType: "application/gzip", CacheControl: "private, no-store" })
  );

  const listed = await client.send(new ListObjectsV2Command({ Bucket, Prefix: BACKUP_PREFIX }));
  const expired = selectExpiredBackupKeys((listed.Contents || []).map((item) => item.Key), now);
  for (const expiredKey of expired) {
    await client.send(new DeleteObjectCommand({ Bucket, Key: expiredKey }));
  }

  logEvent("backup.completed", {
    key: Key,
    collections: Object.keys(collections).length,
    documents,
    bytes: body.length,
    expiredRemoved: expired.length,
  });

  return { ran: true, key: Key, documents, bytes: body.length };
}

module.exports = {
  BACKUP_RETENTION_DAYS,
  backupKeyForDate,
  deserializeBackup,
  isBackupConfigured,
  readAllCollections,
  restoreCollections,
  runDailyBackupIfDue,
  selectExpiredBackupKeys,
  serializeBackup,
};
