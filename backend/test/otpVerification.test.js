const test = require("node:test");
const assert = require("node:assert/strict");

const VerificationCode = require("../src/models/VerificationCode");
const {
  createOtpVerification,
  deleteOtpVerifications,
  verifyOtpCode,
} = require("../src/utils/otpVerification");

function createQuery(result) {
  return {
    sort: async () => result,
    then: (resolve, reject) => Promise.resolve(result).then(resolve, reject),
    catch: (reject) => Promise.resolve(result).catch(reject),
  };
}

function matchesQuery(record, query) {
  if (query.email !== undefined && record.email !== query.email) return false;
  if (query.purpose !== undefined && record.purpose !== query.purpose) return false;
  if (query.userId !== undefined && String(record.userId || "") !== String(query.userId || "")) return false;
  if (query.createdAt?.$gt && !(record.createdAt > query.createdAt.$gt)) return false;
  return true;
}

function installVerificationStore(t) {
  const originals = {
    findOne: VerificationCode.findOne,
    deleteMany: VerificationCode.deleteMany,
    create: VerificationCode.create,
  };
  const records = [];

  VerificationCode.findOne = (query) => {
    const record = records
      .filter((item) => matchesQuery(item, query))
      .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime())[0] || null;
    return createQuery(record);
  };
  VerificationCode.deleteMany = async (query) => {
    let deletedCount = 0;
    for (let index = records.length - 1; index >= 0; index -= 1) {
      if (matchesQuery(records[index], query)) {
        records.splice(index, 1);
        deletedCount += 1;
      }
    }
    return { deletedCount };
  };
  VerificationCode.create = async (payload) => {
    const record = {
      _id: `verification-${records.length + 1}`,
      createdAt: new Date(),
      failedAttempts: 0,
      lockedAt: null,
      ...payload,
      save: async () => record,
    };
    records.push(record);
    return record;
  };

  t.after(() => {
    VerificationCode.findOne = originals.findOne;
    VerificationCode.deleteMany = originals.deleteMany;
    VerificationCode.create = originals.create;
  });

  return records;
}

test("OTP utility accepts a valid code and consumes records explicitly", async (t) => {
  const records = installVerificationStore(t);
  const created = await createOtpVerification({
    email: "Customer@Example.com",
    purpose: "signup",
  });

  const verification = await verifyOtpCode({
    email: "customer@example.com",
    purpose: "signup",
    otp: created.otp,
  });

  assert.equal(verification.email, "customer@example.com");
  assert.equal(records.length, 1);

  await deleteOtpVerifications({ email: "customer@example.com", purpose: "signup" });
  assert.equal(records.length, 0);
});

test("OTP utility rejects invalid codes and locks on the fifth failure", async (t) => {
  const records = installVerificationStore(t);
  await createOtpVerification({
    email: "customer@example.com",
    purpose: "password-reset",
    userId: "507f1f77bcf86cd799439011",
  });

  for (let index = 0; index < 5; index += 1) {
    await assert.rejects(
      () =>
        verifyOtpCode({
          email: "customer@example.com",
          purpose: "password-reset",
          userId: "507f1f77bcf86cd799439011",
          otp: "000000",
        }),
      /otp is invalid or expired/i
    );
  }

  assert.equal(records[0].failedAttempts, 5);
  assert.ok(records[0].lockedAt instanceof Date);
});

test("OTP utility rejects attempts after lock even with the right code", async (t) => {
  installVerificationStore(t);
  const created = await createOtpVerification({
    email: "customer@example.com",
    purpose: "signup",
  });

  for (let index = 0; index < 5; index += 1) {
    await assert.rejects(
      () =>
        verifyOtpCode({
          email: "customer@example.com",
          purpose: "signup",
          otp: "000000",
        }),
      /otp is invalid or expired/i
    );
  }

  await assert.rejects(
    () =>
      verifyOtpCode({
        email: "customer@example.com",
        purpose: "signup",
        otp: created.otp,
      }),
    /otp is invalid or expired/i
  );
});

test("OTP utility rejects and removes expired records", async (t) => {
  const records = installVerificationStore(t);
  const created = await createOtpVerification({
    email: "customer@example.com",
    purpose: "signup",
  });
  records[0].expiresAt = new Date(Date.now() - 1000);

  await assert.rejects(
    () =>
      verifyOtpCode({
        email: "customer@example.com",
        purpose: "signup",
        otp: created.otp,
      }),
    /otp is invalid or expired/i
  );

  assert.equal(records.length, 0);
});

test("OTP utility enforces resend cooldown", async (t) => {
  installVerificationStore(t);
  await createOtpVerification({
    email: "customer@example.com",
    purpose: "signup",
  });

  await assert.rejects(
    () =>
      createOtpVerification({
        email: "customer@example.com",
        purpose: "signup",
      }),
    /wait a minute/i
  );
});

test("OTP utility invalidates older records when a new code is issued", async (t) => {
  const records = installVerificationStore(t);
  const first = await createOtpVerification({
    email: "customer@example.com",
    purpose: "signup",
  });
  records[0].createdAt = new Date(Date.now() - 61_000);

  const second = await createOtpVerification({
    email: "customer@example.com",
    purpose: "signup",
  });

  assert.equal(records.length, 1);
  await assert.rejects(
    () =>
      verifyOtpCode({
        email: "customer@example.com",
        purpose: "signup",
        otp: first.otp,
      }),
    /otp is invalid or expired/i
  );
  await assert.doesNotReject(() =>
    verifyOtpCode({
      email: "customer@example.com",
      purpose: "signup",
      otp: second.otp,
    })
  );
});
