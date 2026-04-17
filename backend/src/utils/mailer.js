const env = require("../config/env");

const normalizedMailFrom = () => String(env.MAIL_FROM || "").trim();
const normalizedMailFromName = () => String(env.MAIL_FROM_NAME || "Hrushe").trim();
const normalizedZeptoMailApiKey = () => String(env.ZEPTOMAIL_API_KEY || "").trim();
const normalizedZeptoMailUrl = () =>
  String(env.ZEPTOMAIL_API_URL || "https://api.zeptomail.com/v1.1/email").trim();
const normalizedZeptoMailTemplateUrl = () =>
  String(env.ZEPTOMAIL_TEMPLATE_API_URL || "https://api.zeptomail.com/v1.1/email/template").trim();

const buildFromAddress = () => ({
  address: normalizedMailFrom(),
  name: normalizedMailFromName(),
});

const sendEmail = async ({ to, subject, html, templateKey, mergeInfo }) => {
  if (!normalizedZeptoMailApiKey()) {
    return { delivered: false, reason: "missing_zeptomail_api_key" };
  }

  if (!normalizedMailFrom()) {
    return { delivered: false, reason: "missing_mail_from" };
  }

  const isTemplateSend = Boolean(String(templateKey || "").trim());
  const response = await fetch(
    isTemplateSend ? normalizedZeptoMailTemplateUrl() : normalizedZeptoMailUrl(),
    {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Zoho-enczapikey ${normalizedZeptoMailApiKey()}`,
      },
      body: JSON.stringify({
        from: buildFromAddress(),
        to: [{ email_address: { address: to } }],
        ...(isTemplateSend
          ? {
              template_key: String(templateKey).trim(),
              merge_info: mergeInfo || {},
            }
          : {
              subject,
              htmlbody: html,
            }),
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    const error = new Error(`ZeptoMail request failed with status ${response.status}`);
    error.code = "ZEPTOMAIL_REQUEST_FAILED";
    error.response = errorText;
    error.responseCode = response.status;
    throw error;
  }

  return { delivered: true, provider: "zeptomail" };
};

module.exports = { sendEmail };
