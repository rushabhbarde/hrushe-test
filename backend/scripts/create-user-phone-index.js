require("dotenv").config();

const mongoose = require("mongoose");
const env = require("../src/config/env");
const User = require("../src/models/User");
const {
  isValidIndianPhone,
  maskPhone,
  normalizeIndianPhone,
} = require("../src/utils/phone");

const INDEX_NAME = "users_phone_unique_non_empty";
const shouldApply = process.argv.includes("--apply");
const backupConfirmed =
  process.argv.includes("--backup-created") ||
  process.env.PHONE_INDEX_BACKUP_CONFIRMED === "true";

async function assertPhoneDataIsIndexable() {
  const users = await User.find({ phone: { $type: "string", $gt: "" } })
    .select("_id phone")
    .lean();
  const byPhone = new Map();
  const invalidUserIds = [];
  const normalizableUsers = [];

  users.forEach((user) => {
    const rawPhone = String(user.phone || "").trim();
    const normalizedPhone = normalizeIndianPhone(rawPhone);

    if (!isValidIndianPhone(rawPhone)) {
      invalidUserIds.push(user._id.toString());
      return;
    }

    if (rawPhone !== normalizedPhone) {
      normalizableUsers.push({
        userId: user._id.toString(),
        from: maskPhone(rawPhone),
        to: maskPhone(normalizedPhone),
      });
    }

    const group = byPhone.get(normalizedPhone) || [];
    group.push(user._id.toString());
    byPhone.set(normalizedPhone, group);
  });

  const duplicateGroups = Array.from(byPhone.entries())
    .filter(([, userIds]) => userIds.length > 1)
    .map(([phone, userIds]) => ({
      phone: maskPhone(phone),
      userIds,
    }));

  if (invalidUserIds.length > 0 || duplicateGroups.length > 0 || normalizableUsers.length > 0) {
    const error = new Error(
      "Phone data is not ready for a unique index. Run audit-user-phones.js and resolve manual review items first."
    );
    error.report = {
      invalidUserIds,
      duplicateGroups,
      normalizableUsers,
    };
    throw error;
  }
}

async function main() {
  if (shouldApply && !backupConfirmed) {
    throw new Error(
      "Refusing to create phone index without --backup-created or PHONE_INDEX_BACKUP_CONFIRMED=true."
    );
  }

  await mongoose.connect(env.MONGODB_URI, {
    serverSelectionTimeoutMS: Number(process.env.MONGODB_SERVER_SELECTION_TIMEOUT_MS || 5000),
  });
  await assertPhoneDataIsIndexable();
  const existingIndexes = await User.collection.indexes();
  const alreadyExists = existingIndexes.some((index) => index.name === INDEX_NAME);

  if (shouldApply && !alreadyExists) {
    await User.collection.createIndex(
      { phone: 1 },
      {
        unique: true,
        name: INDEX_NAME,
        partialFilterExpression: {
          phone: { $type: "string", $gt: "" },
        },
      }
    );
  }

  console.log(
    JSON.stringify(
      {
        mode: shouldApply ? "apply" : "report",
        status: alreadyExists ? "exists" : shouldApply ? "created" : "ready",
        indexName: INDEX_NAME,
        key: { phone: 1 },
        partialFilterExpression: { phone: { $type: "string", $gt: "" } },
      },
      null,
      2
    )
  );
}

if (require.main === module) {
  main()
    .catch((error) => {
      console.error(
        "Phone index creation failed",
        JSON.stringify(
          {
            message: error?.message,
            report: error?.report,
          },
          null,
          2
        )
      );
      process.exitCode = 1;
    })
    .finally(async () => {
      await mongoose.disconnect().catch(() => undefined);
    });
}

module.exports = {
  INDEX_NAME,
  assertPhoneDataIsIndexable,
};
