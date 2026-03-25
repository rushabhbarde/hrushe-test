const nodemailer = require("nodemailer");
const env = require("../config/env");

let transporter;

const getTransporter = () => {
  if (!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASS) {
    return null;
  }

  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_SECURE,
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS,
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
    from: env.MAIL_FROM,
    to,
    subject,
    text,
    html,
  });

  return { delivered: true, provider: "smtp" };
};

module.exports = { sendEmail };
