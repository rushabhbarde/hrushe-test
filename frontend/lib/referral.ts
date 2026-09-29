const STORAGE_KEY = "hrushe.referral";
const REFERRAL_PATTERN = /^HRU-[A-Z0-9]{4,8}$/;

/** A friend code from a shared link (hrushe.in/?ref=HRU-XXXXX), or "" if it isn't one. */
export function parseReferralCode(value: string | null | undefined) {
  const code = String(value || "").trim().toUpperCase();
  return REFERRAL_PATTERN.test(code) ? code : "";
}

/** Keeps a shared friend code until checkout, so it can be filled in for the customer. */
export function rememberReferralFromSearch(search: string) {
  const code = parseReferralCode(new URLSearchParams(search).get("ref"));
  if (!code) {
    return;
  }
  try {
    window.localStorage.setItem(STORAGE_KEY, code);
  } catch {
    // Storage can be blocked; the customer can still type the code.
  }
}

export function readRememberedReferral() {
  try {
    return parseReferralCode(window.localStorage.getItem(STORAGE_KEY));
  } catch {
    return "";
  }
}
