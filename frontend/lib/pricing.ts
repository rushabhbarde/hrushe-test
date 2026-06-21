export function getCompareAtPrice(price: number, compareAtPrice?: number) {
  return Number(compareAtPrice) > Number(price) ? Number(compareAtPrice) : undefined;
}

export function getDiscountPercent(price: number, compareAtPrice?: number) {
  const validCompareAtPrice = getCompareAtPrice(price, compareAtPrice);
  return validCompareAtPrice
    ? Math.round(((validCompareAtPrice - price) / validCompareAtPrice) * 100)
    : 0;
}
