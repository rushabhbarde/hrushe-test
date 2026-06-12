export function shouldBypassImageOptimization(src?: string) {
  return Boolean(src && /^(data:|blob:)/i.test(src));
}
