const nodemailer = require("nodemailer");
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

const hasSmtpConfig = () =>
  Boolean(String(env.SMTP_HOST || "").trim() && String(env.SMTP_USER || "").trim() && String(env.SMTP_PASS || "").trim());

const buildSmtpTransporter = () =>
  nodemailer.createTransport({
    host: String(env.SMTP_HOST || "").trim(),
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE,
    auth: {
      user: String(env.SMTP_USER || "").trim(),
      pass: String(env.SMTP_PASS || "").trim(),
    },
  });

const buildAuthorizationHeader = () => {
  const token = normalizedZeptoMailApiKey();

  if (!token) {
    return "";
  }

  return token.startsWith("Zoho-enczapikey ") ? token : `Zoho-enczapikey ${token}`;
};

const buildMailHtml = ({ subject = "HRUSHE", html = "" }) => `
  <!doctype html>
  <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>${subject}</title>
    </head>
    <body style="margin:0;background:#f5f5f3;color:#111111;font-family:Arial,Helvetica,sans-serif;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f5f5f3;padding:28px 16px;">
        <tr>
          <td align="center">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px;border:1px solid #d8d8d4;background:#ffffff;">
              <tr>
                <td style="border-bottom:1px solid #d8d8d4;padding:26px 28px 22px;">
                  <div style="font-size:12px;letter-spacing:0.28em;text-transform:uppercase;color:#6c6c68;">HRUSHE</div>
                  <div style="margin-top:12px;font-size:26px;line-height:1.05;font-weight:700;letter-spacing:-0.04em;">Quiet pieces. Everyday ease.</div>
                </td>
              </tr>
              <tr>
                <td style="padding:28px;font-size:15px;line-height:1.75;color:#222222;">
                  ${html}
                </td>
              </tr>
              <tr>
                <td style="border-top:1px solid #d8d8d4;padding:20px 28px;font-size:12px;line-height:1.6;color:#6c6c68;">
                  HRUSHE support: team@hrushe.in<br />
                  This is an automated brand notification.
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
  </html>
`;

const sendViaZeptoMail = async ({ to, subject, html, templateKey, mergeInfo }) => {
  const isTemplateSend = Boolean(String(templateKey || "").trim());
  const response = await fetch(
    isTemplateSend ? normalizedZeptoMailTemplateUrl() : normalizedZeptoMailUrl(),
    {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: buildAuthorizationHeader(),
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
              htmlbody: buildMailHtml({ subject, html }),
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
    error.meta = {
      url: isTemplateSend ? normalizedZeptoMailTemplateUrl() : normalizedZeptoMailUrl(),
      from: buildFromAddress().address,
      to,
      templateKey: isTemplateSend ? String(templateKey).trim() : "",
    };
    throw error;
  }

  return { delivered: true, provider: "zeptomail" };
};

const sendViaSmtp = async ({ to, subject, html, text }) => {
  const transporter = buildSmtpTransporter();

  await transporter.sendMail({
    from: {
      address: normalizedMailFrom(),
      name: normalizedMailFromName(),
    },
    to,
    subject,
    text,
    html: buildMailHtml({ subject, html }),
  });

  return { delivered: true, provider: "smtp" };
};

const sendEmail = async ({ to, subject, html, text, templateKey, mergeInfo }) => {
  if (!normalizedZeptoMailApiKey()) {
    if (!hasSmtpConfig()) {
      return { delivered: false, reason: "missing_mail_provider" };
    }

    return sendViaSmtp({ to, subject, html, text });
  }

  if (!normalizedMailFrom()) {
    return { delivered: false, reason: "missing_mail_from" };
  }

  try {
    return await sendViaZeptoMail({ to, subject, html, templateKey, mergeInfo });
  } catch (error) {
    if (!hasSmtpConfig()) {
      throw error;
    }

    console.error("ZeptoMail failed, falling back to SMTP", {
      message: error?.message,
      code: error?.code,
      responseCode: error?.responseCode,
    });
    return sendViaSmtp({ to, subject, html, text });
  }
};

module.exports = { sendEmail };
