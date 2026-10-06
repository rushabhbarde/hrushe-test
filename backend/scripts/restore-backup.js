/**
 * Restore a HRUSHE nightly backup file into a MongoDB database.
 *
 *   node scripts/restore-backup.js <backup.json.gz> <target-mongodb-uri> [--replace]
 *
 * Download the file from the private backup bucket first. Without --replace this only
 * reports what the file holds. With --replace every collection in the file REPLACES the
 * same collection in the target database, so point it at a spare database to rehearse.
 */
const fs = require("fs");
const mongoose = require("mongoose");
const { deserializeBackup, restoreCollections } = require("../src/services/databaseBackup");

async function main() {
  const [file, targetUri, flag] = process.argv.slice(2);
  if (!file || !targetUri) {
    console.error("Usage: node scripts/restore-backup.js <backup.json.gz> <target-mongodb-uri> [--replace]");
    process.exit(1);
  }

  const backup = deserializeBackup(fs.readFileSync(file));
  const summary = Object.fromEntries(
    Object.entries(backup.collections).map(([name, documents]) => [name, documents.length])
  );
  console.log(JSON.stringify({ backupTakenAt: backup.createdAt, collections: summary }, null, 2));

  if (flag !== "--replace") {
    console.log("Dry run only. Add --replace to write these collections into the target database.");
    return;
  }

  await mongoose.connect(targetUri);
  try {
    const restored = await restoreCollections(mongoose.connection.db, backup.collections);
    console.log(JSON.stringify({ restored }, null, 2));
  } finally {
    await mongoose.disconnect();
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
