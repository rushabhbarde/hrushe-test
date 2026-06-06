const env = require("../config/env");

const COLORS = {
  surface: "#ffffff",
  surfaceStrong: "#f7f7f7",
  border: "#e7e1da",
  text: "#111111",
  muted: "#5f5f5f",
  accent: "#111111",
  danger: "#c43a35",
};

const siteBaseUrl = () => String(env.CLIENT_URL || "http://localhost:3000").trim().replace(/\/+$/, "");

const buildSiteUrl = (path = "") => {
  const base = siteBaseUrl();

  if (!path) {
    return base;
  }

  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
};

const escapeHtml = (value = "") =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const formatParagraphs = (...values) =>
  values
    .filter(Boolean)
    .map(
      (value) =>
        `<p style="margin:0 0 14px;color:${COLORS.muted};font-size:15px;line-height:1.8;">${escapeHtml(value)}</p>`
    )
    .join("");

const formatMultilineText = (value = "") => escapeHtml(value).replace(/\r?\n/g, "<br />");

const formatCurrency = (value) =>
  `Rs. ${new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(
    Number(value) || 0
  )}`;

const formatDateTime = (value) => {
  if (!value) {
    return "";
  }

  try {
    return new Intl.DateTimeFormat("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "Asia/Kolkata",
    }).format(new Date(value));
  } catch {
    return "";
  }
};

const humanize = (value = "") =>
  String(value)
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const buildPreheader = (text) =>
  text
    ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all;">${escapeHtml(text)}</div>`
    : "";

const buildLeadBlock = ({ eyebrow, title, intro }) => `
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:28px 0 0;">
    <tr>
      <td style="padding:24px;border:1px solid ${COLORS.border};background:${COLORS.surfaceStrong};">
        ${
          eyebrow
            ? `<div style="font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:${COLORS.muted};">${escapeHtml(
                eyebrow
              )}</div>`
            : ""
        }
        <div style="margin-top:12px;font-family:Georgia,'Times New Roman',serif;font-size:30px;line-height:1.05;font-weight:700;letter-spacing:-0.04em;color:${COLORS.text};">
          ${escapeHtml(title)}
        </div>
        ${
          intro
            ? `<div style="margin-top:12px;">${formatParagraphs(intro)}</div>`
            : ""
        }
      </td>
    </tr>
  </table>
`;

const buildPanel = ({ title, body, tone = "default" }) => {
  const background = tone === "subtle" ? COLORS.surfaceStrong : COLORS.surface;
  const borderColor = tone === "alert" ? COLORS.danger : COLORS.border;

  return `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:18px 0 0;">
      <tr>
        <td style="padding:20px;border:1px solid ${borderColor};background:${background};">
          ${
            title
              ? `<div style="margin:0 0 10px;color:${COLORS.text};font-size:14px;font-weight:700;letter-spacing:0.02em;">${escapeHtml(
                  title
                )}</div>`
              : ""
          }
          <div style="color:${COLORS.muted};font-size:15px;line-height:1.8;">${body}</div>
        </td>
      </tr>
    </table>
  `;
};

const buildInfoTable = (rows = []) => {
  const normalizedRows = rows.filter(
    (row) => row && row.value !== undefined && row.value !== null && row.value !== ""
  );

  if (normalizedRows.length === 0) {
    return "";
  }

  return `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:18px 0 0;border:1px solid ${COLORS.border};border-collapse:collapse;">
      ${normalizedRows
        .map(
          (row, index) => `
            <tr>
              <td style="width:34%;padding:14px 16px;border-bottom:${index < normalizedRows.length - 1 ? `1px solid ${COLORS.border}` : "0"};background:${COLORS.surfaceStrong};color:${COLORS.muted};font-size:12px;letter-spacing:0.12em;text-transform:uppercase;">
                ${escapeHtml(row.label)}
              </td>
              <td style="padding:14px 16px;border-bottom:${index < normalizedRows.length - 1 ? `1px solid ${COLORS.border}` : "0"};color:${COLORS.text};font-size:14px;line-height:1.6;">
                ${escapeHtml(row.value)}
              </td>
            </tr>
          `
        )
        .join("")}
    </table>
  `;
};

const buildButton = ({ label, url }) => {
  if (!label || !url) {
    return "";
  }

  return `
    <table role="presentation" cellspacing="0" cellpadding="0" style="margin:24px 0 0;">
      <tr>
        <td style="background:${COLORS.accent};">
          <a
            href="${escapeHtml(url)}"
            style="display:inline-block;padding:14px 24px;color:#ffffff;font-size:13px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;text-decoration:none;"
          >
            ${escapeHtml(label)}
          </a>
        </td>
      </tr>
    </table>
  `;
};

const buildCodeBlock = ({ label, code }) => `
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:18px 0 0;">
    <tr>
      <td style="padding:18px;border:1px solid ${COLORS.border};background:${COLORS.surface};text-align:center;">
        <div style="margin:0 0 8px;color:${COLORS.muted};font-size:11px;letter-spacing:0.16em;text-transform:uppercase;">${escapeHtml(
          label
        )}</div>
        <div style="color:${COLORS.text};font-size:34px;line-height:1;font-weight:700;letter-spacing:0.24em;">
          ${escapeHtml(code)}
        </div>
      </td>
    </tr>
  </table>
`;

const buildOrderItems = (items = []) => {
  if (items.length === 0) {
    return "";
  }

  return `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:18px 0 0;">
      ${items
        .map((item) => {
          const meta = [
            item.size ? `Size ${item.size}` : "",
            item.color || "",
            item.fit || "",
          ]
            .filter(Boolean)
            .join(" | ");

          return `
            <tr>
              <td style="padding:16px 0;border-bottom:1px solid ${COLORS.border};vertical-align:top;">
                <div style="color:${COLORS.text};font-size:15px;font-weight:700;line-height:1.5;">${escapeHtml(
                  item.name
                )}</div>
                ${
                  meta
                    ? `<div style="margin-top:4px;color:${COLORS.muted};font-size:13px;line-height:1.6;">${escapeHtml(
                        meta
                      )}</div>`
                    : ""
                }
              </td>
              <td style="padding:16px 0 16px 16px;border-bottom:1px solid ${COLORS.border};vertical-align:top;text-align:right;">
                <div style="color:${COLORS.text};font-size:13px;line-height:1.6;">Qty ${escapeHtml(
                  item.quantity
                )}</div>
                <div style="margin-top:4px;color:${COLORS.muted};font-size:13px;line-height:1.6;">${escapeHtml(
                  formatCurrency(Number(item.price) * Number(item.quantity))
                )}</div>
              </td>
            </tr>
          `;
        })
        .join("")}
    </table>
  `;
};

const renderEmailContent = ({
  preheader,
  eyebrow,
  title,
  intro,
  sections = [],
  ctaLabel,
  ctaUrl,
  closingNote,
}) =>
  [
    buildPreheader(preheader),
    buildLeadBlock({ eyebrow, title, intro }),
    ...sections.filter(Boolean),
    buildButton({ label: ctaLabel, url: ctaUrl }),
    closingNote
      ? `<div style="margin:18px 0 0;color:${COLORS.muted};font-size:13px;line-height:1.7;">${escapeHtml(
          closingNote
        )}</div>`
      : "",
  ].join("");

const buildWelcomeEmail = ({ name }) =>
  renderEmailContent({
    preheader: "Your HRUSHE account is ready.",
    eyebrow: "Account Created",
    title: `Welcome${name ? `, ${String(name).trim().split(/\s+/)[0]}` : ""}.`,
    intro:
      "Your HRUSHE account has been created successfully. You can now sign in to track orders, save favourites, and move through checkout faster.",
    sections: [
      buildInfoTable([
        { label: "What you can do", value: "Track orders and saved products" },
        { label: "Account status", value: "Ready to use" },
      ]),
    ],
    ctaLabel: "Open HRUSHE",
    ctaUrl: buildSiteUrl("/login"),
    closingNote: "Need help with your account? Contact team@hrushe.in.",
  });

const buildOtpEmail = ({ purpose, otp, expiryMinutes, email }) => {
  const isSignup = purpose === "signup";

  return renderEmailContent({
    preheader: isSignup ? "Your signup OTP is here." : "Your password reset OTP is here.",
    eyebrow: isSignup ? "Email Verification" : "Password Reset",
    title: isSignup ? "Confirm your email." : "Reset your password.",
    intro: isSignup
      ? "Use the one-time code below to finish creating your HRUSHE account."
      : "Use the one-time code below to continue resetting your HRUSHE password.",
    sections: [
      buildCodeBlock({
        label: "One-time code",
        code: otp,
      }),
      buildInfoTable([
        { label: "Email", value: email },
        { label: "Valid for", value: `${expiryMinutes} minutes` },
      ]),
      buildPanel({
        title: "Security note",
        body: "If you did not request this code, you can safely ignore this email.",
        tone: "subtle",
      }),
    ],
    ctaLabel: "Continue to HRUSHE",
    ctaUrl: buildSiteUrl(isSignup ? "/signup" : "/login"),
    closingNote: "For support, reply to this email or contact team@hrushe.in.",
  });
};

const buildPasswordChangedEmail = ({ name, email }) =>
  renderEmailContent({
    preheader: "Your HRUSHE password was updated.",
    eyebrow: "Security Update",
    title: "Password changed.",
    intro: name
      ? `Hi ${String(name).trim().split(/\s+/)[0]}, your HRUSHE account password was changed successfully.`
      : "Your HRUSHE account password was changed successfully.",
    sections: [
      buildInfoTable([
        { label: "Account", value: email },
        { label: "Status", value: "Password updated successfully" },
      ]),
      buildPanel({
        title: "Did not make this change?",
        body: "Reset your password immediately and contact team@hrushe.in so we can help secure your account.",
        tone: "alert",
      }),
    ],
    ctaLabel: "Sign in to HRUSHE",
    ctaUrl: buildSiteUrl("/login"),
    closingNote: "You are receiving this because a password change was completed on your account.",
  });

const buildOrderStatusEmail = ({ order, summaryLine }) => {
  const reference = order.orderNumber || order._id?.toString?.() || "";
  const trackingLink = order.trackingUrl || buildSiteUrl("/track-order");
  const detailedAddress = order.shippingAddressDetails
    ? [
        order.shippingAddressDetails.fullName,
        order.shippingAddressDetails.house,
        order.shippingAddressDetails.area,
        order.shippingAddressDetails.landmark,
        order.shippingAddressDetails.city,
        order.shippingAddressDetails.state,
        order.shippingAddressDetails.pincode,
      ]
        .filter(Boolean)
        .join(", ")
    : "";
  const address = detailedAddress || order.shippingAddress;

  return renderEmailContent({
    preheader: `Order #${reference} is now ${order.orderStatus}.`,
    eyebrow: "Order Update",
    title: `Order #${reference}`,
    intro: summaryLine,
    sections: [
      buildInfoTable([
        { label: "Status", value: order.orderStatus },
        { label: "Payment", value: humanize(order.paymentStatus) },
        { label: "Total", value: formatCurrency(order.totalAmount) },
        { label: "Tracking ID", value: order.trackingId || "" },
        { label: "Courier", value: order.courierName || "" },
      ]),
      buildPanel({
        title: "Items in this order",
        body: buildOrderItems(order.products),
      }),
      address
        ? buildPanel({
            title: "Shipping address",
            body: formatMultilineText(address),
            tone: "subtle",
          })
        : "",
    ],
    ctaLabel: order.trackingUrl ? "Track shipment" : "Track your order",
    ctaUrl: trackingLink,
    closingNote: "Thank you for shopping with HRUSHE.",
  });
};

const buildSupportStatusEmail = ({ request, customerName }) =>
  renderEmailContent({
    preheader: "Your HRUSHE support request has been updated.",
    eyebrow: "Support Update",
    title: `Hi ${customerName || "there"},`,
    intro: "Your support request has been updated. Here is the latest status from the HRUSHE team.",
    sections: [
      buildInfoTable([
        {
          label: "Ticket",
          value: request.ticketNumber
            ? `HRSH-${String(request.ticketNumber).padStart(4, "0")}`
            : "",
        },
        { label: "Subject", value: request.subject },
        { label: "Category", value: humanize(request.category) },
        { label: "Status", value: humanize(request.status) },
      ]),
      request.resolutionNote
        ? buildPanel({
            title: "Latest note",
            body: formatMultilineText(request.resolutionNote),
          })
        : "",
    ],
    ctaLabel: "Contact HRUSHE",
    ctaUrl: buildSiteUrl("/contact"),
    closingNote: "Need more help? Reply to this email or write to team@hrushe.in.",
  });

const buildSupportRequestAdminEmail = ({
  ticketCode,
  customerName,
  customerEmail,
  customerPhone,
  category,
  priority,
  source,
  assignedRole,
  orderId,
  message,
  subject,
}) =>
  renderEmailContent({
    preheader: "A new HRUSHE support request was submitted.",
    eyebrow: "Customer Support",
    title: ticketCode ? `New support ticket ${ticketCode}.` : "New support request.",
    intro: "A customer has submitted a support request from the storefront.",
    sections: [
      buildInfoTable([
        { label: "Ticket", value: ticketCode || "Pending" },
        { label: "Customer", value: customerName },
        { label: "Email", value: customerEmail },
        { label: "Phone", value: customerPhone || "N/A" },
        { label: "Category", value: humanize(category) },
        { label: "Priority", value: humanize(priority || "normal") },
        { label: "Source", value: humanize(source || "account") },
        { label: "Assigned role", value: humanize(assignedRole || "operations-manager") },
        { label: "Order", value: orderId || "N/A" },
        { label: "Subject", value: subject },
      ]),
      buildPanel({
        title: "Customer message",
        body: formatMultilineText(message),
      }),
    ],
    closingNote: "Follow up with the customer from the admin panel or via email.",
  });

const buildNewsletterSignupAdminEmail = ({ email, source, capturedAt }) =>
  renderEmailContent({
    preheader: "A new newsletter signup just came in.",
    eyebrow: "Audience Growth",
    title: "New newsletter signup.",
    intro: "A visitor joined the HRUSHE newsletter list.",
    sections: [
      buildInfoTable([
        { label: "Email", value: email },
        { label: "Source", value: source },
        { label: "Captured at", value: formatDateTime(capturedAt) },
      ]),
    ],
    closingNote: "You can use this contact for upcoming launch and editorial campaigns.",
  });

module.exports = {
  buildNewsletterSignupAdminEmail,
  buildOrderStatusEmail,
  buildOtpEmail,
  buildPasswordChangedEmail,
  buildSupportRequestAdminEmail,
  buildSupportStatusEmail,
  buildWelcomeEmail,
};
