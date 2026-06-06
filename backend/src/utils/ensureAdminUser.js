const bcrypt = require("bcrypt");
const User = require("../models/User");
const Cart = require("../models/Cart");
const env = require("../config/env");
const { normalizeAdminRoleId } = require("../config/adminRoles");

const ADMIN_EMAIL = env.ADMIN_EMAIL;
const ADMIN_PASSWORD = env.ADMIN_PASSWORD;
const ADMIN_NAME = env.ADMIN_NAME;
const ADMIN_ROLE = normalizeAdminRoleId(env.ADMIN_ROLE);

function validateAdminCredentials() {
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    throw new Error("ADMIN_EMAIL and ADMIN_PASSWORD must be configured.");
  }

  if (
    env.NODE_ENV === "production" &&
    (ADMIN_PASSWORD === "admin" || ADMIN_PASSWORD.length < 12)
  ) {
    throw new Error(
      "ADMIN_PASSWORD must be at least 12 characters and cannot be the default password in production."
    );
  }
}

async function ensureAdminUser() {
  validateAdminCredentials();

  let adminUser = await User.findOne({ email: ADMIN_EMAIL });

  if (!adminUser) {
    adminUser = await User.create({
      name: ADMIN_NAME,
      email: ADMIN_EMAIL,
      password: await bcrypt.hash(ADMIN_PASSWORD, 10),
      role: "admin",
      adminRole: ADMIN_ROLE,
      isVerified: true,
      emailVerifiedAt: new Date(),
    });
    console.log("Admin user created in database.");
  } else {
    let shouldSave = false;

    if (adminUser.role !== "admin") {
      adminUser.role = "admin";
      shouldSave = true;
    }

    if (adminUser.adminRole !== ADMIN_ROLE) {
      adminUser.adminRole = ADMIN_ROLE;
      shouldSave = true;
    }

    if (!adminUser.name) {
      adminUser.name = ADMIN_NAME;
      shouldSave = true;
    }

    if (adminUser.isVerified !== true) {
      adminUser.isVerified = true;
      adminUser.emailVerifiedAt = adminUser.emailVerifiedAt || new Date();
      shouldSave = true;
    }

    const isPasswordMatch = await bcrypt.compare(ADMIN_PASSWORD, adminUser.password);
    if (!isPasswordMatch) {
      adminUser.password = await bcrypt.hash(ADMIN_PASSWORD, 10);
      shouldSave = true;
    }

    if (shouldSave) {
      await adminUser.save();
      console.log("Admin user refreshed in database.");
    }
  }

  const existingCart = await Cart.findOne({ userId: adminUser._id });
  if (!existingCart) {
    await Cart.create({ userId: adminUser._id, items: [] });
  }

  return adminUser;
}

module.exports = {
  ensureAdminUser,
  ADMIN_EMAIL,
  ADMIN_PASSWORD,
};
