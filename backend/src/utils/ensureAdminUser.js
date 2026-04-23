const bcrypt = require("bcrypt");
const User = require("../models/User");
const Cart = require("../models/Cart");

const ADMIN_EMAIL = "team@hrushe.in";
const ADMIN_PASSWORD = "admin";
const ADMIN_NAME = "Admin";

async function ensureAdminUser() {
  let adminUser = await User.findOne({ email: ADMIN_EMAIL });

  if (!adminUser) {
    adminUser = await User.create({
      name: ADMIN_NAME,
      email: ADMIN_EMAIL,
      password: await bcrypt.hash(ADMIN_PASSWORD, 10),
      role: "admin",
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
