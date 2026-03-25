export function getCompareAtPrice(price: number) {
  const uplifted = Math.ceil((price * 1.22) / 10) * 10;
  return uplifted > price ? uplifted : price + 200;
}

export function getDiscountPercent(price: number, compareAtPrice = getCompareAtPrice(price)) {
  return Math.round(((compareAtPrice - price) / compareAtPrice) * 100);
}
