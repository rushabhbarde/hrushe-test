"use client";

import { useEffect, useState } from "react";
import { AccountSectionCard } from "@/components/account-shell";
import { useToast } from "@/components/toast-provider";
import { apiRequest } from "@/lib/api";

type ReferralResponse = {
  code: string;
  shareUrl: string;
  rewards: { code: string; percent: number }[];
};

/** Wardrobe: your friend code, and the thank-you codes it has earned you. */
export function InviteFriends() {
  const { pushToast } = useToast();
  const [referral, setReferral] = useState<ReferralResponse | null>(null);

  useEffect(() => {
    let active = true;
    apiRequest<ReferralResponse>("/account/referral", { cache: "no-store" })
      .then((response) => active && setReferral(response))
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  if (!referral) {
    return null;
  }

  const shareText = `10% off your first HRUSHE order with my code ${referral.code}.`;
  const share = async () => {
    if (typeof navigator.share === "function") {
      await navigator.share({ title: "HRUSHE", text: shareText, url: referral.shareUrl }).catch(() => undefined);
      return;
    }
    try {
      await navigator.clipboard.writeText(`${shareText} ${referral.shareUrl}`);
      pushToast("Link copied");
    } catch {
      pushToast("Copy the code above to share it.", "error");
    }
  };

  return (
    <AccountSectionCard
      eyebrow="Friends"
      title="Invite a friend"
      description="Your friend gets 10% off their first order. When it’s delivered, you get 10% off your next one."
      action={
        <button type="button" onClick={() => void share()} className="fr-mono fr-choice fr-link is-active">
          Share →
        </button>
      }
    >
      <dl className="flex max-w-2xl flex-col">
        <div className="flex items-baseline justify-between gap-6 border-b border-[color-mix(in_srgb,var(--foreground)_8%,transparent)] py-3">
          <dt className="fr-mono fr-muted shrink-0">Your code</dt>
          <dd className="fr-word text-[1.6rem] select-all">{referral.code}</dd>
        </div>
        {referral.rewards.map((reward) => (
          <div
            key={reward.code}
            className="flex items-baseline justify-between gap-6 border-b border-[color-mix(in_srgb,var(--foreground)_8%,transparent)] py-3"
          >
            <dt className="fr-mono fr-muted shrink-0">Thank you · {reward.percent}% off</dt>
            <dd className="text-right text-sm leading-6 select-all">{reward.code}</dd>
          </div>
        ))}
      </dl>
    </AccountSectionCard>
  );
}
