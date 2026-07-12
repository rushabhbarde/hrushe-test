const nodemailer = require("nodemailer");
const env = require("../config/env");
const { logEvent } = require("./logger");

const normalizedMailFrom = () => String(env.MAIL_FROM || "").trim();
const normalizedMailFromName = () => String(env.MAIL_FROM_NAME || "Hrushe").trim();
const normalizedZeptoMailApiKey = () =>
  String(env.ZEPTOMAIL_API_KEY || "")
    .trim()
    .replace(/^zoho-enczapikey\s+/i, "")
    .replace(/\s+/g, "");
const normalizedZeptoMailUrl = () =>
  String(env.ZEPTOMAIL_API_URL || "https://api.zeptomail.com/v1.1/email").trim();
const normalizedZeptoMailTemplateUrl = () =>
  String(env.ZEPTOMAIL_TEMPLATE_API_URL || "https://api.zeptomail.com/v1.1/email/template").trim();
const mailTimeoutMs = () => Math.max(Number(env.MAIL_TIMEOUT_MS) || 10000, 1000);
const normalizedSmtpPass = () =>
  String(env.SMTP_PASS || "")
    .trim()
    .replace(/\s+/g, "");
const normalizedClientUrl = () =>
  String(env.CLIENT_URL || "http://localhost:3000").trim().replace(/\/+$/, "");

const buildFromAddress = () => ({
  address: normalizedMailFrom(),
  name: normalizedMailFromName(),
});

const buildSiteUrl = (path = "") => {
  const base = normalizedClientUrl();

  if (!path) {
    return base;
  }

  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
};

const hasSmtpConfig = () =>
  Boolean(
    String(env.SMTP_HOST || "").trim() &&
      String(env.SMTP_USER || "").trim() &&
      normalizedSmtpPass()
  );

const buildSmtpTransporter = () =>
  nodemailer.createTransport({
    host: String(env.SMTP_HOST || "").trim(),
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE,
    connectionTimeout: mailTimeoutMs(),
    greetingTimeout: mailTimeoutMs(),
    socketTimeout: mailTimeoutMs(),
    auth: {
      user: String(env.SMTP_USER || "").trim(),
      pass: normalizedSmtpPass(),
    },
  });

const buildAuthorizationHeader = () => {
  const token = normalizedZeptoMailApiKey();

  if (!token) {
    return "";
  }

  return `Zoho-enczapikey ${token}`;
};

const sanitizeMailError = (error) => ({
  message: error?.message,
  code: error?.code,
  responseCode: error?.responseCode,
  response:
    typeof error?.response === "string" ? error.response.slice(0, 500) : undefined,
  endpoint: error?.meta?.endpoint,
  usedTemplate: Boolean(error?.meta?.usedTemplate),
});

const buildMailHtml = ({ subject = "HRUSHE", html = "" }) => `
  <!doctype html>
  <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>${subject}</title>
    </head>
    <body style="margin:0;background:#f3f1ed;color:#111111;font-family:Arial,Helvetica,sans-serif;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f3f1ed;padding:28px 16px;">
        <tr>
          <td align="center">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:680px;border:1px solid #e7e1da;background:#ffffff;">
              <tr>
                <td style="padding:14px 28px;border-bottom:1px solid #e7e1da;color:#5f5f5f;font-size:11px;letter-spacing:0.16em;text-transform:uppercase;">
                  India wide delivery
                </td>
              </tr>
              <tr>
                <td style="border-bottom:1px solid #e7e1da;padding:28px;background:#f7f7f7;">
                  <div style="font-size:12px;letter-spacing:0.28em;text-transform:uppercase;color:#5f5f5f;">HRUSHE</div>
                  <div style="margin-top:14px;font-family:Georgia,'Times New Roman',serif;font-size:34px;line-height:1.02;font-weight:700;letter-spacing:-0.04em;color:#111111;">
                    Quiet pieces.<br />
                    Everyday ease.
                  </div>
                  <div style="margin-top:12px;color:#5f5f5f;font-size:14px;line-height:1.75;">
                    Designed for everyday dressing.
                  </div>
                </td>
              </tr>
              <tr>
                <td style="padding:0 28px 32px;font-size:15px;line-height:1.75;color:#222222;">
                  ${html}
                </td>
              </tr>
              <tr>
                <td style="border-top:1px solid #e7e1da;padding:24px 28px;background:#2f2d2b;color:#f8f8f5;">
                  <div style="font-size:12px;letter-spacing:0.18em;text-transform:uppercase;color:#d7d2cc;">Stay connected</div>
                  <div style="margin-top:10px;font-size:13px;line-height:1.8;">
                    <a href="${buildSiteUrl("/shop")}" style="color:#f8f8f5;text-decoration:none;">Shop</a>
                    &nbsp;&nbsp;|&nbsp;&nbsp;
                    <a href="${buildSiteUrl("/track-order")}" style="color:#f8f8f5;text-decoration:none;">Track order</a>
                    &nbsp;&nbsp;|&nbsp;&nbsp;
                    <a href="${buildSiteUrl("/contact")}" style="color:#f8f8f5;text-decoration:none;">Contact</a>
                  </div>
                  <div style="margin-top:12px;font-size:12px;line-height:1.7;color:#d7d2cc;">
                    HRUSHE support: team@hrushe.in<br />
                    This is an automated brand notification.
                  </div>
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
  const isTemplateSend = Boolean(String(templateKey || "").trim() && !String(html || "").trim());
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), mailTimeoutMs());
  let response;

  try {
    response = await fetch(
      isTemplateSend ? normalizedZeptoMailTemplateUrl() : normalizedZeptoMailUrl(),
      {
        method: "POST",
        signal: controller.signal,
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
  } catch (error) {
    if (error?.name === "AbortError") {
      const timeoutError = new Error(`Mail provider timed out after ${mailTimeoutMs()}ms`);
      timeoutError.code = "MAIL_PROVIDER_TIMEOUT";
      timeoutError.responseCode = 504;
      throw timeoutError;
    }

    throw error;
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    const errorText = await response.text();
    const error = new Error(`ZeptoMail request failed with status ${response.status}`);
    error.code = "ZEPTOMAIL_REQUEST_FAILED";
    error.response = errorText;
    error.responseCode = response.status;
    error.meta = {
      endpoint: isTemplateSend ? "template" : "html",
      usedTemplate: isTemplateSend,
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
    const shouldRetryWithoutTemplate = Boolean(error?.meta?.usedTemplate && html);

    if (shouldRetryWithoutTemplate) {
      logEvent(
        "email.zeptomail.template_failed_retrying_html",
        sanitizeMailError(error),
        "error"
      );

      try {
        return await sendViaZeptoMail({ to, subject, html });
      } catch (htmlError) {
        error = htmlError;
        logEvent("email.zeptomail.html_retry_failed", sanitizeMailError(error), "error");
      }
    }

    if (!hasSmtpConfig()) {
      throw error;
    }

    logEvent("email.zeptomail.failed_falling_back_to_smtp", sanitizeMailError(error), "error");

    try {
      return await sendViaSmtp({ to, subject, html, text });
    } catch (smtpError) {
      logEvent("email.smtp.fallback_failed", sanitizeMailError(smtpError), "error");
      throw smtpError;
    }
  }
};

module.exports = { sendEmail };
