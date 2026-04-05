const nodemailer = require("nodemailer");
const env = require("../config/env");

let transporter;

const normalizedSmtpUser = () => String(env.SMTP_USER || "").trim();

const normalizedSmtpPass = () =>
  String(env.SMTP_PASS || "")
    .trim()
    .replace(/\s+/g, "");

const normalizedMailFrom = () => String(env.MAIL_FROM || "").trim();

const getTransporter = () => {
  if (!env.SMTP_HOST || !normalizedSmtpUser() || !normalizedSmtpPass()) {
    return null;
  }

  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: String(env.SMTP_HOST).trim(),
      port: env.SMTP_PORT,
      secure: env.SMTP_SECURE,
      connectionTimeout: 15000,
      greetingTimeout: 15000,
      auth: {
        user: normalizedSmtpUser(),
        pass: normalizedSmtpPass(),
      },
    });
  }

  return transporter;
};

const sendEmail = async ({ to, subject, text, html }) => {
  const mailer = getTransporter();

  if (!mailer) {
    return { delivered: false, reason: "missing_smtp_config" };
  }

  await mailer.sendMail({
    from: normalizedMailFrom(),
    to,
    subject,
    text,
    html,
  });

  return { delivered: true, provider: "smtp" };
};

module.exports = { sendEmail };
