const crypto = require("crypto");
const env = require("../config/env");
const AppError = require("../utils/AppError");

const CSRF_COOKIE_NAME = "hrushe-csrf";

const csrfCookieOptions = {
  sameSite: env.COOKIE_SAME_SITE,
  httpOnly: false,
  secure: env.COOKIE_SECURE,
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: "/",
  ...(env.COOKIE_DOMAIN ? { domain: env.COOKIE_DOMAIN } : {}),
};

function readCookie(req, name) {
  const cookieHeader = req.headers.cookie || "";
  const cookie = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`));

  return cookie ? decodeURIComponent(cookie.slice(name.length + 1)) : "";
}

function createCsrfToken() {
  return crypto.randomBytes(32).toString("hex");
}

function setCsrfCookie(res, token = createCsrfToken()) {
  res.cookie(CSRF_COOKIE_NAME, token, csrfCookieOptions);
  return token;
}

function ensureCsrfCookie(req, res) {
  return readCookie(req, CSRF_COOKIE_NAME) || setCsrfCookie(res);
}

function clearCsrfCookie(res) {
  res.clearCookie(CSRF_COOKIE_NAME, csrfCookieOptions);
}

function requireCsrf(req, res, next) {
  const cookieToken = readCookie(req, CSRF_COOKIE_NAME);
  const headerToken = String(req.headers["x-csrf-token"] || "");
  if (!cookieToken || !headerToken) {
    return next(new AppError("Security token missing. Refresh the page and try again.", 403));
  }

  const expected = Buffer.from(cookieToken, "utf8");
  const received = Buffer.from(headerToken, "utf8");
  if (expected.length !== received.length || !crypto.timingSafeEqual(expected, received)) {
    return next(new AppError("Security token invalid. Refresh the page and try again.", 403));
  }

  return next();
}

function requireCsrfIfAuthenticated(req, res, next) {
  if (!req.user) {
    return next();
  }

  return requireCsrf(req, res, next);
}

module.exports = {
  clearCsrfCookie,
  ensureCsrfCookie,
  requireCsrf,
  requireCsrfIfAuthenticated,
  setCsrfCookie,
};
