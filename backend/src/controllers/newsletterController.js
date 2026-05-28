const env = require("../config/env");
const NewsletterSubscriber = require("../models/NewsletterSubscriber");
const AppError = require("../utils/AppError");
const asyncHandler = require("../utils/asyncHandler");
const { sendEmail } = require("../utils/mailer");

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const subscribeToNewsletter = asyncHandler(async (req, res) => {
  const email = String(req.body.email || "")
    .trim()
    .toLowerCase();
  const source = String(req.body.source || "homepage").trim() || "homepage";

  if (!emailRegex.test(email)) {
    throw new AppError("Enter a valid email address", 400);
  }

  const existingSubscriber = await NewsletterSubscriber.findOne({ email });

  if (!existingSubscriber) {
    await NewsletterSubscriber.create({
      email,
      source,
    });
  }

  if (env.MAIL_FROM) {
    try {
      const delivery = await sendEmail({
        to: env.MAIL_FROM,
        subject: "New HRUSHE newsletter signup",
        html: `
          <p>A new newsletter signup was received for HRUSHE.</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Source:</strong> ${source}</p>
          <p><strong>Captured at:</strong> ${new Date().toLocaleString("en-IN", {
            timeZone: "Asia/Kolkata",
          })}</p>
        `,
      });
      if (!delivery.delivered) {
        throw new Error(delivery.reason || "Newsletter email delivery failed");
      }
    } catch (error) {
      console.error("Newsletter notification email failed", {
        message: error?.message,
        code: error?.code,
        response: error?.response,
        responseCode: error?.responseCode,
      });
    }
  }

  return res.status(existingSubscriber ? 200 : 201).json({
    message: existingSubscriber
      ? "You’re already on the list."
      : "You’re on the list. We’ll keep you posted.",
  });
});

module.exports = {
  subscribeToNewsletter,
};
