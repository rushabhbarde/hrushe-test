const env = require("../config/env");
const AppError = require("./AppError");

const normalizePhone = (phone) => {
  const digits = String(phone || "").replace(/\D/g, "");

  if (!digits) {
    throw new AppError("Valid phone number is required", 400);
  }

  if (digits.length === 10) {
    return `${env.MSG91_COUNTRY_CODE}${digits}`;
  }

  return digits;
};

const buildMessage = (otp) =>
  (env.MSG91_OTP_MESSAGE || `${otp} is your OTP for HRUSHE. It is valid for 10 minutes.`)
    .replace(/##OTP##/g, otp)
    .replace(/\{OTP\}/g, otp);

const sendMsg91Otp = async (phone, otp) => {
  if (!env.MSG91_AUTH_KEY || !env.MSG91_SENDER_ID) {
    return { delivered: false, reason: "missing_credentials" };
  }

  const mobile = normalizePhone(phone);
  const message = buildMessage(otp);

  const query = new URLSearchParams({
    authkey: env.MSG91_AUTH_KEY,
    mobiles: mobile,
    sender: env.MSG91_SENDER_ID,
    otp,
    message,
  });

  if (env.MSG91_DLT_TEMPLATE_ID) {
    query.set("DLT_TE_ID", env.MSG91_DLT_TEMPLATE_ID);
  }

  const response = await fetch(`https://control.msg91.com/api/sendotp.php?${query.toString()}`, {
    method: "GET",
  });

  const responseText = await response.text();

  if (!response.ok) {
    throw new AppError(
      `MSG91 OTP send failed${responseText ? `: ${responseText}` : ""}`,
      502
    );
  }

  return {
    delivered: true,
    provider: "msg91",
    responseText,
  };
};

module.exports = { sendMsg91Otp };
