export function getCompareAtPrice(price: number, compareAtPrice?: number) {
  return Number(compareAtPrice) > Number(price) ? Number(compareAtPrice) : undefined;
}

export function getDiscountPercent(price: number, compareAtPrice?: number) {
  const validCompareAtPrice = getCompareAtPrice(price, compareAtPrice);
  return validCompareAtPrice
    ? Math.round(((validCompareAtPrice - price) / validCompareAtPrice) * 100)
    : 0;
}

export type CartMoneyLine = {
  pricePaise: number;
  quantity: number;
};

export function formatPaise(valuePaise: number) {
  const safePaise = Number.isFinite(valuePaise) ? Math.round(valuePaise) : 0;
  const hasFraction = Math.abs(safePaise % 100) > 0;

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: hasFraction ? 2 : 0,
    maximumFractionDigits: hasFraction ? 2 : 0,
  }).format(safePaise / 100);
}

export function calculateCartSubtotalPaise(items: readonly CartMoneyLine[]) {
  return items.reduce((sum, item) => {
    const pricePaise = Number.isFinite(item.pricePaise) ? Math.round(item.pricePaise) : 0;
    const quantity = Number.isFinite(item.quantity) ? Math.max(Math.floor(item.quantity), 0) : 0;

    return sum + pricePaise * quantity;
  }, 0);
}

export function calculateDeliveryChargePaise(
  subtotalPaise: number,
  { freeAbovePaise = 0, chargePaise = 0 }: { freeAbovePaise?: number; chargePaise?: number } = {}
) {
  if (chargePaise <= 0 || subtotalPaise >= freeAbovePaise) {
    return 0;
  }

  return Math.round(chargePaise);
}

export function calculateCartTotalPaise(
  items: readonly CartMoneyLine[],
  deliveryOptions?: { freeAbovePaise?: number; chargePaise?: number }
) {
  const subtotalPaise = calculateCartSubtotalPaise(items);
  const deliveryPaise = calculateDeliveryChargePaise(subtotalPaise, deliveryOptions);

  return {
    subtotalPaise,
    deliveryPaise,
    totalPaise: subtotalPaise + deliveryPaise,
  };
}
