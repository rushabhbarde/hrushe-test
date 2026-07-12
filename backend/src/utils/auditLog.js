const AuditLog = require("../models/AuditLog");
const { logEvent } = require("./logger");

async function recordAuditLog(req, action, target = {}, metadata = {}) {
  try {
    await AuditLog.create({
      actorId: req.user?._id || null,
      actorEmail: req.user?.email || "",
      action,
      targetType: target.type || "",
      targetId: String(target.id || ""),
      metadata,
      ip: req.ip || req.socket?.remoteAddress || "",
      userAgent: String(req.headers["user-agent"] || "").slice(0, 500),
    });
  } catch (error) {
    logEvent("audit_log.write_failed", { action, message: error?.message }, "error");
  }
}

module.exports = { recordAuditLog };
