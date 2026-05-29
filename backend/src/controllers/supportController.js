const SupportRequest = require("../models/SupportRequest");
const AppError = require("../utils/AppError");
const asyncHandler = require("../utils/asyncHandler");
const { sendEmail } = require("../utils/mailer");
const { buildSupportStatusEmail } = require("../utils/emailTemplates");

const getSupportRequests = asyncHandler(async (req, res) => {
  const filter = {};

  if (req.query.status) {
    filter.status = String(req.query.status);
  }

  if (req.query.category) {
    filter.category = String(req.query.category);
  }

  const requests = await SupportRequest.find(filter)
    .populate("userId", "name email phone")
    .sort({ createdAt: -1 });

  return res.json(requests);
});

const getSupportRequestById = asyncHandler(async (req, res) => {
  const request = await SupportRequest.findById(req.params.id).populate(
    "userId",
    "name email phone"
  );

  if (!request) {
    throw new AppError("Support request not found", 404);
  }

  return res.json(request);
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
    request.status = req.body.status;
  }

  if (req.body.resolutionNote !== undefined) {
    request.resolutionNote = String(req.body.resolutionNote || "").trim();
  }

  await request.save();

  if (request.userId?.email) {
    try {
      const delivery = await sendEmail({
        to: request.userId.email,
        subject: `HRUSHE support update: ${request.subject}`,
        html: buildSupportStatusEmail({
          request,
          customerName: request.userId.name || "there",
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

  return res.json(request);
});

module.exports = {
  getSupportRequests,
  getSupportRequestById,
  updateSupportRequest,
};
