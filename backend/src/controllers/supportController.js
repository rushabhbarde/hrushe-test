const SupportRequest = require("../models/SupportRequest");
const AppError = require("../utils/AppError");
const asyncHandler = require("../utils/asyncHandler");
const { sendEmail } = require("../utils/mailer");
const {
  buildSupportRequestAdminEmail,
  buildSupportStatusEmail,
} = require("../utils/emailTemplates");

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const VALID_CATEGORIES = [
  "track-order",
  "return-request",
  "exchange-request",
  "login-help",
  "signup-help",
  "payment-refund",
  "product-size",
  "coupon-sale",
  "website-issue",
  "contact-support",
  "other",
];
const VALID_STATUSES = ["open", "in-progress", "waiting-customer", "resolved"];
const VALID_PRIORITIES = ["low", "normal", "high", "urgent"];
const VALID_ASSIGNED_ROLES = [
  "",
  "super-admin",
  "brand-growth-manager",
  "operations-manager",
  "catalog-manager",
];
const CATEGORY_LABELS = {
  "track-order": "Order tracking",
  "return-request": "Return request",
  "exchange-request": "Exchange request",
  "login-help": "Login help",
  "signup-help": "Signup help",
  "payment-refund": "Payment or refund",
  "product-size": "Product or size help",
  "coupon-sale": "Coupon or sale",
  "website-issue": "Website issue",
  "contact-support": "General support",
  other: "Other issue",
};
const ROLE_BY_CATEGORY = {
  "product-size": "catalog-manager",
  "coupon-sale": "brand-growth-manager",
  "track-order": "operations-manager",
  "return-request": "operations-manager",
  "exchange-request": "operations-manager",
  "payment-refund": "operations-manager",
  "login-help": "operations-manager",
  "signup-help": "operations-manager",
  "website-issue": "operations-manager",
  "contact-support": "operations-manager",
  other: "operations-manager",
};

function cleanText(value, fallback = "") {
  return String(value || fallback).trim();
}

function normalizeCategory(value) {
  const category = cleanText(value);
  return VALID_CATEGORIES.includes(category) ? category : "contact-support";
}

function normalizePriority(value, category) {
  const priority = cleanText(value);
  if (VALID_PRIORITIES.includes(priority)) {
    return priority;
  }

  if (["payment-refund", "return-request", "exchange-request"].includes(category)) {
    return "high";
  }

  return "normal";
}

function normalizeTranscript(transcript) {
  if (!Array.isArray(transcript)) {
    return [];
  }

  return transcript
    .slice(-20)
    .map((entry) => ({
      role: ["bot", "customer", "system"].includes(entry?.role) ? entry.role : "customer",
      message: cleanText(entry?.message).slice(0, 1200),
    }))
    .filter((entry) => entry.message);
}

function buildTicketCode(request) {
  return request.ticketNumber ? `HRSH-${String(request.ticketNumber).padStart(4, "0")}` : "";
}

function serializeTicket(request) {
  const object = typeof request.toObject === "function" ? request.toObject({ virtuals: true }) : request;

  return {
    ...object,
    id: object._id?.toString?.() || object.id,
    ticketCode: object.ticketCode || buildTicketCode(object),
  };
}

async function notifyTeam(request, customerName, customerEmail) {
  try {
    const delivery = await sendEmail({
      to: "team@hrushe.in",
      subject: `${buildTicketCode(request) || "HRUSHE"} support: ${request.subject}`,
      html: buildSupportRequestAdminEmail({
        ticketCode: buildTicketCode(request),
        customerName,
        customerEmail,
        customerPhone: request.customerPhone,
        category: request.category,
        priority: request.priority,
        source: request.source,
        assignedRole: request.assignedRole,
        orderId: request.orderId,
        message: request.message,
        subject: request.subject,
      }),
    });
    if (!delivery.delivered) {
      throw new Error(delivery.reason || "Support request email delivery failed");
    }
  } catch (error) {
    console.error("Support request email failed", {
      message: error?.message,
      code: error?.code,
      responseCode: error?.responseCode,
    });
  }
}

const createSupportTicket = asyncHandler(async (req, res) => {
  const category = normalizeCategory(req.body.category);
  const linkedCustomer = req.user && req.user.role !== "admin" ? req.user : null;
  const customerName = cleanText(req.body.customerName, linkedCustomer?.name || "");
  const customerEmail = cleanText(req.body.customerEmail, linkedCustomer?.email || "").toLowerCase();
  const customerPhone = cleanText(req.body.customerPhone, linkedCustomer?.phone || "");
  const message = cleanText(req.body.message);
  const subject = cleanText(req.body.subject, CATEGORY_LABELS[category]);
  const priority = normalizePriority(req.body.priority, category);

  if (!customerName) {
    throw new AppError("Please share your name so support can help you", 400);
  }

  if (!customerEmail || !EMAIL_PATTERN.test(customerEmail)) {
    throw new AppError("Please share a valid email for ticket updates", 400);
  }

  if (!message || message.length < 12) {
    throw new AppError("Please describe the issue in a little more detail", 400);
  }

  const supportRequest = await SupportRequest.create({
    userId: linkedCustomer?._id,
    category,
    source: "chatbot",
    customerName,
    customerEmail,
    customerPhone,
    orderId: cleanText(req.body.orderId),
    subject: subject.slice(0, 160),
    message: message.slice(0, 4000),
    priority,
    assignedRole: ROLE_BY_CATEGORY[category] || "operations-manager",
    transcript: normalizeTranscript(req.body.transcript),
    metadata: {
      userAgent: req.headers["user-agent"] || "",
      pageUrl: cleanText(req.body.pageUrl),
    },
  });

  await notifyTeam(supportRequest, customerName, customerEmail);

  return res.status(201).json({
    message: "Ticket created",
    request: serializeTicket(supportRequest),
  });
});

const getSupportRequests = asyncHandler(async (req, res) => {
  const filter = {};

  if (req.query.status) {
    filter.status = String(req.query.status);
  }

  if (req.query.category) {
    filter.category = String(req.query.category);
  }

  if (req.query.priority) {
    filter.priority = String(req.query.priority);
  }

  if (req.query.assignedRole) {
    filter.assignedRole = String(req.query.assignedRole);
  }

  if (req.query.source) {
    filter.source = String(req.query.source);
  }

  if (req.query.query) {
    const query = String(req.query.query).trim();
    if (query) {
      const regex = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      filter.$or = [
        { subject: regex },
        { message: regex },
        { customerName: regex },
        { customerEmail: regex },
        { orderId: regex },
      ];
    }
  }

  const requests = await SupportRequest.find(filter)
    .populate("userId", "name email phone")
    .sort({ createdAt: -1 });

  return res.json(requests.map(serializeTicket));
});

const getSupportRequestById = asyncHandler(async (req, res) => {
  const request = await SupportRequest.findById(req.params.id).populate(
    "userId",
    "name email phone"
  );

  if (!request) {
    throw new AppError("Support request not found", 404);
  }

  return res.json(serializeTicket(request));
});

const updateSupportRequest = asyncHandler(async (req, res) => {
  const request = await SupportRequest.findById(req.params.id).populate(
    "userId",
    "name email phone"
  );

  if (!request) {
    throw new AppError("Support request not found", 404);
  }

  if (req.body.status) {
    if (!VALID_STATUSES.includes(req.body.status)) {
      throw new AppError("Choose a valid support status", 400);
    }
    request.status = req.body.status;
  }

  if (req.body.priority) {
    if (!VALID_PRIORITIES.includes(req.body.priority)) {
      throw new AppError("Choose a valid priority", 400);
    }
    request.priority = req.body.priority;
  }

  if (req.body.assignedRole !== undefined) {
    if (!VALID_ASSIGNED_ROLES.includes(req.body.assignedRole)) {
      throw new AppError("Choose a valid role assignment", 400);
    }
    request.assignedRole = req.body.assignedRole;
  }

  if (req.body.resolutionNote !== undefined) {
    request.resolutionNote = String(req.body.resolutionNote || "").trim();
  }

  await request.save();

  const recipientEmail = request.customerEmail || request.userId?.email;

  if (recipientEmail) {
    try {
      const delivery = await sendEmail({
        to: recipientEmail,
        subject: `${buildTicketCode(request) || "HRUSHE"} support update: ${request.subject}`,
        html: buildSupportStatusEmail({
          request,
          customerName: request.customerName || request.userId?.name || "there",
        }),
      });
      if (!delivery.delivered) {
        throw new Error(delivery.reason || "Support status email delivery failed");
      }
    } catch (error) {
      console.error("Support status email failed", {
        message: error?.message,
        code: error?.code,
        response: error?.response,
        responseCode: error?.responseCode,
      });
    }
  }

  return res.json(serializeTicket(request));
});

module.exports = {
  createSupportTicket,
  getSupportRequests,
  getSupportRequestById,
  updateSupportRequest,
};
