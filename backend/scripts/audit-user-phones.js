require("dotenv").config();

const mongoose = require("mongoose");
const env = require("../src/config/env");
const User = require("../src/models/User");
const {
  isValidIndianPhone,
  maskPhone,
  normalizeIndianPhone,
} = require("../src/utils/phone");

const shouldApply = process.argv.includes("--apply");
const backupConfirmed =
  process.argv.includes("--backup-created") ||
  process.env.PHONE_MIGRATION_BACKUP_CONFIRMED === "true";

function buildReport(users) {
  const report = {
    totalUsersScanned: users.length,
    validNumbers: 0,
    invalidNumbers: 0,
    missingNumbers: 0,
    duplicateGroups: [],
    manualReviewUserIds: [],
    updates: [],
  };
  const groups = new Map();

  users.forEach((user) => {
    const rawPhone = String(user.phone || "").trim();
    const normalizedPhone = normalizeIndianPhone(rawPhone);
    const userId = user._id.toString();

    if (!rawPhone) {
      report.missingNumbers += 1;
      return;
    }

    if (!isValidIndianPhone(rawPhone)) {
      report.invalidNumbers += 1;
      report.manualReviewUserIds.push(userId);
      return;
    }

    report.validNumbers += 1;
    const group = groups.get(normalizedPhone) || [];
    group.push(userId);
    groups.set(normalizedPhone, group);

    if (rawPhone !== normalizedPhone) {
      report.updates.push({
        userId,
        from: maskPhone(rawPhone),
        to: maskPhone(normalizedPhone),
        normalizedPhone,
      });
    }
  });

  groups.forEach((userIds, normalizedPhone) => {
    if (userIds.length <= 1) {
      return;
    }
    report.duplicateGroups.push({
      phone: maskPhone(normalizedPhone),
      userIds,
    });
    report.manualReviewUserIds.push(...userIds);
  });

  report.manualReviewUserIds = Array.from(new Set(report.manualReviewUserIds));
  return report;
}

function summarizeReport(report, safeUpdates, mode) {
  return {
    mode,
    canonicalFormat: "10-digit Indian mobile number, without country code",
    totalUsersScanned: report.totalUsersScanned,
    emptyPhoneValues: report.missingNumbers,
    validNormalizedNumbers: report.validNumbers,
    invalidPhoneValues: report.invalidNumbers,
    duplicateNormalizedNumbers: report.duplicateGroups.length,
    duplicateUsers: report.duplicateGroups.reduce(
      (count, group) => count + group.userIds.length,
      0
    ),
    usersThatWouldBeModified: safeUpdates.length,
    usersRequiringManualReview: report.manualReviewUserIds.length,
    duplicateGroups: report.duplicateGroups,
    manualReviewUserIds: report.manualReviewUserIds,
    normalizableUsers: report.updates.map(({ userId, from, to }) => ({
      userId,
      from,
      to,
    })),
    appliedUpdates: mode === "apply" ? safeUpdates.length : 0,
    skippedUpdatesRequiringReview: report.updates.length - safeUpdates.length,
  };
}

async function main() {
  if (shouldApply && !backupConfirmed) {
    throw new Error(
      "Refusing to apply phone migration without --backup-created or PHONE_MIGRATION_BACKUP_CONFIRMED=true."
    );
  }

  await mongoose.connect(env.MONGODB_URI, {
    serverSelectionTimeoutMS: Number(process.env.MONGODB_SERVER_SELECTION_TIMEOUT_MS || 5000),
  });

  const users = await User.find({})
    .select("_id phone")
    .lean();
  const report = buildReport(users);
  const duplicateUserIds = new Set(
    report.duplicateGroups.flatMap((group) => group.userIds)
  );
  const safeUpdates = report.updates.filter(
    (update) => !duplicateUserIds.has(update.userId)
  );

  if (shouldApply) {
    for (const update of safeUpdates) {
      await User.updateOne(
        { _id: update.userId },
        { $set: { phone: update.normalizedPhone } }
      );
    }
  }

  console.log(
    JSON.stringify(
      summarizeReport(report, safeUpdates, shouldApply ? "apply" : "report"),
      null,
      2
    )
  );
}

if (require.main === module) {
  main()
    .catch((error) => {
      console.error("Phone audit failed", { message: error?.message });
      process.exitCode = 1;
    })
    .finally(async () => {
      await mongoose.disconnect().catch(() => undefined);
    });
}

module.exports = {
  buildReport,
  summarizeReport,
};
