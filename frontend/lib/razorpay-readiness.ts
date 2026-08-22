export const RAZORPAY_LOADING_MESSAGE =
  "Payment checkout is still loading. Please try again in a moment.";

export function getRazorpayLaunchBlocker({
  scriptReady,
  hasConstructor,
  loadError = "",
}: {
  scriptReady: boolean;
  hasConstructor: boolean;
  loadError?: string;
}) {
  if (scriptReady && hasConstructor) {
    return "";
  }

  return loadError || RAZORPAY_LOADING_MESSAGE;
}
