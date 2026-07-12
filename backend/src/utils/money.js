const MAX_SAFE_PAISE = Number.MAX_SAFE_INTEGER;

function rupeesToPaise(value) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) {
    return 0;
  }
  return Math.round(amount * 100);
}

function paiseToRupees(value) {
  const paise = normalizePaise(value);
  return paise / 100;
}

function normalizePaise(value, { allowNegative = false } = {}) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed)) {
    throw new Error("Money values must be integer paise.");
  }
  if (!allowNegative && parsed < 0) {
    throw new Error("Money values cannot be negative.");
  }
  if (Math.abs(parsed) > MAX_SAFE_PAISE) {
    throw new Error("Money value exceeds safe integer range.");
  }
  return parsed;
}

function getPaiseValue(record = {}, paiseField, rupeeField) {
  if (record[paiseField] !== undefined && record[paiseField] !== null) {
    return normalizePaise(record[paiseField]);
  }
  return rupeesToPaise(record[rupeeField]);
}

function addPaise(values = []) {
  return values.reduce((sum, value) => sum + normalizePaise(value), 0);
}

function multiplyPaise(unitPaise, quantity) {
  const normalizedQuantity = Number(quantity);
  if (!Number.isInteger(normalizedQuantity) || normalizedQuantity < 0) {
    throw new Error("Quantity must be a non-negative integer.");
  }
  return normalizePaise(unitPaise) * normalizedQuantity;
}

function percentageDiscountPaise(amountPaise, percentage) {
  const normalizedAmount = normalizePaise(amountPaise);
  const normalizedPercentage = Number(percentage);
  if (!Number.isFinite(normalizedPercentage) || normalizedPercentage < 0) {
    throw new Error("Percentage discount must be non-negative.");
  }
  return Math.round((normalizedAmount * normalizedPercentage) / 100);
}

function fixedDiscountPaise(amountPaise, discountPaise) {
  return Math.min(normalizePaise(amountPaise), normalizePaise(discountPaise));
}

function calculateOrderTotals({
  items = [],
  discountPaise = 0,
  shippingPaise = 0,
  taxPaise = 0,
} = {}) {
  const subtotalPaise = addPaise(
    items.map((item) =>
      multiplyPaise(
        getPaiseValue(item, "pricePaise", "price"),
        item.quantity
      )
    )
  );
  const normalizedDiscount = fixedDiscountPaise(subtotalPaise, discountPaise);
  const totalPaise =
    subtotalPaise -
    normalizedDiscount +
    normalizePaise(shippingPaise) +
    normalizePaise(taxPaise);

  return {
    subtotalPaise,
    discountPaise: normalizedDiscount,
    shippingPaise: normalizePaise(shippingPaise),
    taxPaise: normalizePaise(taxPaise),
    totalPaise: normalizePaise(totalPaise),
  };
}

module.exports = {
  addPaise,
  calculateOrderTotals,
  fixedDiscountPaise,
  getPaiseValue,
  multiplyPaise,
  normalizePaise,
  paiseToRupees,
  percentageDiscountPaise,
  rupeesToPaise,
};
