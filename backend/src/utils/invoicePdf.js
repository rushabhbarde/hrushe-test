const escapePdfText = (value = "") =>
  String(value)
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");

const buildTextLine = (text, x, y, font = "F1", size = 12) =>
  `BT /${font} ${size} Tf 1 0 0 1 ${x} ${y} Tm (${escapePdfText(text)}) Tj ET`;

const createPdfBuffer = (lines) => {
  const content = lines.join("\n");
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> >>",
    `<< /Length ${Buffer.byteLength(content, "utf8")} >>\nstream\n${content}\nendstream`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>",
  ];

  let pdf = "%PDF-1.4\n";
  const offsets = [0];

  objects.forEach((object, index) => {
    offsets.push(Buffer.byteLength(pdf, "utf8"));
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });

  const xrefStart = Buffer.byteLength(pdf, "utf8");
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";
  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;

  return Buffer.from(pdf, "utf8");
};

const formatDate = (value) =>
  new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));

const formatCurrency = (value) => `Rs. ${Number(value || 0).toLocaleString("en-IN")}`;

const buildInvoicePdf = (order) => {
  const orderReference = order.orderNumber || order._id.toString();
  const lines = [
    buildTextLine("HRUSHE", 48, 790, "F2", 26),
    buildTextLine("Tax Invoice", 48, 765, "F2", 16),
    buildTextLine(`Invoice for Order #${orderReference}`, 48, 742, "F1", 11),
    buildTextLine(`Invoice Date: ${formatDate(order.createdAt)}`, 400, 790, "F1", 11),
    buildTextLine(`Payment Status: ${order.paymentStatus}`, 400, 774, "F1", 11),
    buildTextLine(`Order Status: ${order.orderStatus}`, 400, 758, "F1", 11),
    buildTextLine("Bill To", 48, 715, "F2", 13),
    buildTextLine(order.customerName || "-", 48, 697, "F1", 11),
    buildTextLine(order.customerEmail || "-", 48, 681, "F1", 11),
    buildTextLine(order.customerPhone || "-", 48, 665, "F1", 11),
    buildTextLine("Ship To", 300, 715, "F2", 13),
    buildTextLine(order.shippingAddress || "-", 300, 697, "F1", 11),
    buildTextLine("Items", 48, 630, "F2", 14),
    buildTextLine("Product", 48, 610, "F2", 11),
    buildTextLine("Variant", 280, 610, "F2", 11),
    buildTextLine("Qty", 430, 610, "F2", 11),
    buildTextLine("Amount", 490, 610, "F2", 11),
  ];

  let y = 590;

  order.products.forEach((item) => {
    const variant = [
      item.size ? `Size ${item.size}` : "",
      item.color || "",
      item.fit ? `Fit ${item.fit}` : "",
    ]
      .filter(Boolean)
      .join(" • ");

    lines.push(buildTextLine(item.name || "Product", 48, y, "F1", 11));
    lines.push(buildTextLine(variant || "-", 280, y, "F1", 10));
    lines.push(buildTextLine(String(item.quantity || 1), 436, y, "F1", 11));
    lines.push(
      buildTextLine(
        formatCurrency((item.price || 0) * (item.quantity || 1)),
        490,
        y,
        "F1",
        11
      )
    );
    y -= 18;
  });

  y -= 10;
  lines.push(buildTextLine(`Subtotal: ${formatCurrency(order.totalAmount)}`, 390, y, "F2", 12));
  y -= 18;
  lines.push(buildTextLine("Shipping: Included", 390, y, "F1", 11));
  y -= 18;
  lines.push(buildTextLine(`Total: ${formatCurrency(order.totalAmount)}`, 390, y, "F2", 14));
  y -= 40;
  lines.push(
    buildTextLine(
      "This is a system-generated invoice for your HRUSHE order.",
      48,
      y,
      "F1",
      10
    )
  );
  y -= 16;
  lines.push(buildTextLine("Support: team@hrushe.in", 48, y, "F1", 10));

  return createPdfBuffer(lines);
};

module.exports = { buildInvoicePdf };
