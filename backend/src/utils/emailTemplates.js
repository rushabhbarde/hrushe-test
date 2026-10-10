const env = require("../config/env");

// The storefront's palette: ink on white, quiet greys, hairlines, burgundy only as the full stop.
const COLORS = {
  surface: "#ffffff",
  border: "#e6e3de",
  text: "#111111",
  muted: "#6b6760",
  mark: "#5e0110",
};
const MONO = "'SFMono-Regular',Menlo,Consolas,'Courier New',monospace";
const SANS = "'Helvetica Neue',Helvetica,Arial,sans-serif";
const monoLabel = `font-family:${MONO};font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:${COLORS.muted};`;

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
        `<p style="margin:0 0 12px;color:${COLORS.text};font-size:15px;line-height:1.7;">${escapeHtml(value)}</p>`
    )
    .join("");

const formatMultilineText = (value = "") => escapeHtml(value).replace(/\r?\n/g, "<br />");

const formatCurrency = (value) =>
  `₹${new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(
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

// A title's closing full stop takes the logo's burgundy, as on the site.
const withMark = (title) => {
  const text = String(title || "");
  return text.endsWith(".")
    ? `${escapeHtml(text.slice(0, -1))}<span style="color:${COLORS.mark};">.</span>`
    : escapeHtml(text);
};

const buildLeadBlock = ({ eyebrow, title, intro }) => `
  <div style="padding:36px 0 0;">
    ${eyebrow ? `<div style="${monoLabel}">${escapeHtml(eyebrow)}</div>` : ""}
    <div style="margin-top:14px;font-family:${SANS};font-size:38px;line-height:0.98;font-weight:700;letter-spacing:-0.045em;text-transform:uppercase;color:${COLORS.text};">
      ${withMark(title)}
    </div>
    ${intro ? `<div style="margin-top:18px;">${formatParagraphs(intro)}</div>` : ""}
  </div>
`;

const buildPanel = ({ title, body }) => `
  <div style="margin:12px 0 0;padding:18px 0 0;border-top:1px solid ${COLORS.border};">
    ${title ? `<div style="margin:0 0 10px;${monoLabel}">${escapeHtml(title)}</div>` : ""}
    <div style="color:${COLORS.text};font-size:15px;line-height:1.7;">${body}</div>
  </div>
`;

const buildInfoTable = (rows = []) => {
  const normalizedRows = rows.filter(
    (row) => row && row.value !== undefined && row.value !== null && row.value !== ""
  );

  if (normalizedRows.length === 0) {
    return "";
  }

  return `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:24px 0 0;border-top:1px solid ${COLORS.border};border-collapse:collapse;">
      ${normalizedRows
        .map(
          (row, index) => `
            <tr>
              <td style="width:38%;padding:13px 12px 13px 0;${index < normalizedRows.length - 1 ? `border-bottom:1px solid ${COLORS.border};` : ""}vertical-align:top;${monoLabel}">
                ${escapeHtml(row.label)}
              </td>
              <td style="padding:13px 0;${index < normalizedRows.length - 1 ? `border-bottom:1px solid ${COLORS.border};` : ""}color:${COLORS.text};font-size:14px;line-height:1.6;text-align:right;">
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
    <table role="presentation" cellspacing="0" cellpadding="0" style="margin:28px 0 0;">
      <tr>
        <td style="background:${COLORS.text};">
          <a
            href="${escapeHtml(url)}"
            style="display:inline-block;padding:17px 30px;color:#ffffff;font-family:${MONO};font-size:11px;letter-spacing:0.18em;text-transform:uppercase;text-decoration:none;"
          >
            ${escapeHtml(label)}
          </a>
        </td>
      </tr>
    </table>
  `;
};

const buildCodeBlock = ({ label, code }) => `
  <div style="margin:28px 0 0;padding:20px 0;border-top:1px solid ${COLORS.border};border-bottom:1px solid ${COLORS.border};">
    <div style="${monoLabel}">${escapeHtml(label)}</div>
    <div style="margin-top:12px;font-family:${SANS};color:${COLORS.text};font-size:44px;line-height:1;font-weight:700;letter-spacing:0.14em;">
      ${escapeHtml(code)}
    </div>
  </div>
`;

const buildOrderItems = (items = []) => {
  if (items.length === 0) {
    return "";
  }

  return `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
      ${items
        .map((item, index) => {
          const line = index < items.length - 1 ? `border-bottom:1px solid ${COLORS.border};` : "";
          const meta = [item.size ? `Size ${item.size}` : "", item.color || "", item.fit || "", `Qty ${item.quantity}`]
            .filter(Boolean)
            .join(" · ");

          return `
            <tr>
              <td style="padding:12px 12px 12px 0;${line}vertical-align:top;">
                <div style="color:${COLORS.text};font-size:15px;line-height:1.4;">${escapeHtml(item.name)}</div>
                <div style="margin-top:5px;${monoLabel}">${escapeHtml(meta)}</div>
              </td>
              <td style="padding:12px 0;${line}vertical-align:top;text-align:right;color:${COLORS.text};font-size:15px;line-height:1.4;white-space:nowrap;">
                ${escapeHtml(formatCurrency(Number(item.price) * Number(item.quantity)))}
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
      ? `<div style="margin:22px 0 0;color:${COLORS.muted};font-size:13px;line-height:1.7;">${escapeHtml(
          closingNote
        )}</div>`
      : "",
  ].join("");

const firstName = (name) => String(name || "").trim().split(/\s+/)[0] || "";

const buildWelcomeEmail = ({ name }) =>
  renderEmailContent({
    preheader: "Your HRUSHE wardrobe is ready.",
    eyebrow: "Your wardrobe",
    title: `Welcome${firstName(name) ? `, ${firstName(name)}` : ""}.`,
    intro:
      "Your HRUSHE wardrobe is ready. It keeps your orders, the pieces you save, and your details for a quicker checkout.",
    ctaLabel: "Open your wardrobe",
    ctaUrl: buildSiteUrl("/account"),
    closingNote: "Questions? Write to team@hrushe.in.",
  });

const buildOtpEmail = ({ purpose, otp, expiryMinutes, email }) => {
  const isSignup = purpose === "signup";
  const isEmailChange = purpose === "email-change";

  return renderEmailContent({
    preheader: isSignup
      ? "Your code to finish signing up."
      : isEmailChange
        ? "Your code to confirm your new email."
        : "Your code to reset your password.",
    eyebrow: isSignup || isEmailChange ? "Email verification" : "Password reset",
    title: isSignup
      ? "Confirm your email."
      : isEmailChange
        ? "Confirm your new email."
        : "Reset your password.",
    intro: isSignup
      ? "Enter this code to finish creating your HRUSHE account."
      : isEmailChange
        ? "Enter this code to confirm this new email for your HRUSHE account."
        : "Enter this code to reset your HRUSHE password.",
    sections: [
      buildCodeBlock({
        label: "One-time code",
        code: otp,
      }),
      buildInfoTable([
        { label: "Sent to", value: email },
        { label: "Valid for", value: `${expiryMinutes} minutes` },
      ]),
      buildPanel({
        title: "Did not ask for this?",
        body: "Ignore this email. Nothing changes unless the code is entered.",
      }),
    ],
    ctaLabel: "Continue to HRUSHE",
    ctaUrl: buildSiteUrl(isSignup ? "/signup" : isEmailChange ? "/account" : "/login"),
    closingNote: "Need help? Reply to this email or write to team@hrushe.in.",
  });
};

const buildPasswordChangedEmail = ({ name, email }) =>
  renderEmailContent({
    preheader: "Your HRUSHE password was updated.",
    eyebrow: "Security",
    title: "Password changed.",
    intro: name
      ? `Hi ${firstName(name)}, the password for your HRUSHE account was changed.`
      : "The password for your HRUSHE account was changed.",
    sections: [
      buildInfoTable([
        { label: "Account", value: email },
      ]),
      buildPanel({
        title: "Was this not you?",
        body: "Reset your password now, then write to team@hrushe.in so we can help secure your account.",
      }),
    ],
    ctaLabel: "Sign in to HRUSHE",
    ctaUrl: buildSiteUrl("/login"),
    closingNote: "Sent because the password on your account was changed.",
  });

// Each stage of an order gets one big word and one plain line, as on the site.
const ORDER_MOMENTS = {
  Confirmed: {
    title: "Thank you.",
    line: "Your order is confirmed. We will write when it is packed, and again when it leaves.",
  },
  Packed: { title: "Packed.", line: "Your order is packed and waiting for the courier." },
  Shipped: { title: "Shipped.", line: "Your order has left us. Use the tracking details below to follow it." },
  "Out for delivery": { title: "Out for delivery.", line: "Your order is with the courier and should reach you today." },
  Delivered: {
    title: "Delivered.",
    line: "Your order has arrived. If the size is not right, one size exchange is free, and returns are open for 7 days.",
  },
  Cancelled: {
    title: "Cancelled.",
    line: "Your order has been cancelled. Any payment made is refunded to the original payment method.",
  },
  Returned: { title: "Returned.", line: "We have received your return. An approved refund goes to the original payment method." },
};

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

  const moment = ORDER_MOMENTS[order.orderStatus];

  return renderEmailContent({
    preheader: `Order #${reference} is now ${order.orderStatus}.`,
    eyebrow: `Order #${reference}`,
    title: moment?.title || `${order.orderStatus || "Order update"}.`,
    intro: moment?.line || summaryLine,
    sections: [
      buildInfoTable([
        { label: "Status", value: order.orderStatus },
        { label: "Payment", value: humanize(order.paymentStatus) },
        { label: "Total", value: formatCurrency(order.totalAmount) },
        { label: "Tracking ID", value: order.trackingId || "" },
        { label: "Courier", value: order.courierName || "" },
      ]),
      buildPanel({
        title: "In this order",
        body: buildOrderItems(order.products),
      }),
      address
        ? buildPanel({
            title: "Delivering to",
            body: formatMultilineText(address),
          })
        : "",
    ],
    ctaLabel: order.trackingUrl ? "Track shipment" : "Track your order",
    ctaUrl: trackingLink,
    closingNote: "Questions about this order? Reply to this email or write to team@hrushe.in.",
  });
};

const buildSupportStatusEmail = ({ request, customerName }) =>
  renderEmailContent({
    preheader: "Your HRUSHE support request has been updated.",
    eyebrow: "Help",
    title: "An update.",
    intro: `Hi ${firstName(customerName) || "there"}, there is news on your request. The latest from the HRUSHE team is below.`,
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
    ctaLabel: "Write to us",
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
    eyebrow: "Help",
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
    eyebrow: "Newsletter",
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
