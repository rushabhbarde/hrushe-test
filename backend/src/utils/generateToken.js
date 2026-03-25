const jwt = require("jsonwebtoken");
const env = require("../config/env");

const generateToken = (userId) =>
  jwt.sign({ userId }, env.JWT_SECRET, {
    expiresIn: "7d",
  });

module.exports = generateToken;
