const AppError = require("../utils/AppError");

const stores = new Map();

const createRateLimiter = ({ windowMs = 15 * 60 * 1000, max = 100, name = "api" } = {}) => {
  if (!stores.has(name)) {
    stores.set(name, new Map());
  }

  const store = stores.get(name);

  return (req, res, next) => {
    const now = Date.now();
    const key = req.ip || req.socket?.remoteAddress || "unknown";
    const current = store.get(key);

    if (!current || current.resetAt <= now) {
      store.set(key, { count: 1, resetAt: now + windowMs });
      res.set("RateLimit-Limit", String(max));
      res.set("RateLimit-Remaining", String(max - 1));
      return next();
    }

    current.count += 1;
    res.set("RateLimit-Limit", String(max));
    res.set("RateLimit-Remaining", String(Math.max(0, max - current.count)));
    res.set("RateLimit-Reset", String(Math.ceil(current.resetAt / 1000)));

    if (current.count > max) {
      res.set("Retry-After", String(Math.ceil((current.resetAt - now) / 1000)));
      return next(new AppError("Too many requests. Please try again shortly.", 429));
    }

    if (store.size > 5000) {
      for (const [storedKey, entry] of store.entries()) {
        if (entry.resetAt <= now) {
          store.delete(storedKey);
        }
      }
    }

    return next();
  };
};

module.exports = { createRateLimiter };
