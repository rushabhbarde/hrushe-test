const jwt = require("jsonwebtoken");
const env = require("../config/env");

const generateToken = (user) =>
  jwt.sign({
    userId: user._id,
    tokenVersion: Number(user.tokenVersion || 0),
  }, env.JWT_SECRET, {
    expiresIn: "7d",
  });

module.exports = generateToken;
