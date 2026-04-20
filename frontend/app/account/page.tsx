"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AccountGuard } from "@/components/account-guard";
import {
  AccountSectionCard,
  AccountShell,
  type AccountSectionId,
} from "@/components/account-shell";
import { useCart } from "@/components/cart-provider";
import { useCustomerAuth } from "@/components/customer-auth-provider";
import { EmptyState } from "@/components/empty-state";
import { LoadingState } from "@/components/loading-state";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { useToast } from "@/components/toast-provider";
import { useWishlist } from "@/components/wishlist-provider";
import { apiRequest, downloadApiFile } from "@/lib/api";
import type {
  AccountPreferences,
  AccountSummary,
  AccountUser,
  AddressRecord,
  CommunicationPreferences,
  SupportCategory,
  WishlistProduct,
} from "@/lib/account";
import { compressSingleImage } from "@/lib/image-upload";
import { formatOrderDate, type OrderRecord } from "@/lib/orders";

type WishlistResponse = {
  products: WishlistProduct[];
};

const sectionIds: AccountSectionId[] = [
  "dashboard",
  "profile",
  "addresses",
  "orders",
  "wishlist",
  "preferences",
  "notifications",
  "support",
];

const emptyPreferences: AccountPreferences = {
  preferredSize: "",
  preferredFit: "",
  favoriteColors: [],
};

const emptyNotifications: CommunicationPreferences = {
  emailNotifications: true,
  whatsappOrderUpdates: true,
  marketingMessages: false,
};

const emptyProfileForm = {
  name: "",
  email: "",
  phone: "",
  gender: "",
  dateOfBirth: "",
  profilePictureUrl: "",
};

const emptyAddressForm = {
  id: "",
  label: "Home" as AddressRecord["label"],
  fullName: "",
  mobile: "",
  pincode: "",
  city: "",
  state: "",
  house: "",
  area: "",
  landmark: "",
  isDefault: false,
};

const emptySupportForm = {
  category: "contact-support" as SupportCategory,
  subject: "",
  message: "",
  orderId: "",
};

const sizeOptions = ["XS", "S", "M", "L", "XL", "XXL"];
const fitOptions = ["Oversize", "Regular"] as const;
const genderOptions = ["", "Male", "Female", "Non-binary", "Prefer not to say"];
const supportOptions: { value: SupportCategory; label: string; description: string }[] = [
  {
    value: "track-order",
    label: "Track order",
    description: "Ask for movement updates or delivery ETA help.",
  },
  {
    value: "return-request",
    label: "Return request",
    description: "Start a return flow for the pieces that did not work out.",
  },
  {
    value: "exchange-request",
    label: "Exchange request",
    description: "Request a different size or replacement option.",
  },
  {
    value: "contact-support",
    label: "Contact support",
    description: "General help with payments, delivery, or your account.",
  },
];

function sanitizeSection(value: string | null): AccountSectionId {
  return sectionIds.includes(value as AccountSectionId)
    ? (value as AccountSectionId)
    : "dashboard";
}

function buildAddressPreview(address: AddressRecord) {
  return [address.house, address.area, address.landmark, address.city, address.state, address.pincode]
    .filter(Boolean)
    .join(", ");
}

function buildProfileForm(user: AccountUser | null) {
  return {
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    gender: user?.gender || "",
    dateOfBirth: user?.dateOfBirth ? user.dateOfBirth.slice(0, 10) : "",
    profilePictureUrl: user?.profilePictureUrl || "",
  };
}

function AccountMetric({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note: string;
}) {
  return (
    <div className="rounded-[1.5rem] border border-[var(--border)] bg-white/70 p-5">
      <p className="text-xs uppercase tracking-[0.18em] text-[var(--accent)]">{label}</p>
      <p className="mt-3 text-2xl font-semibold tracking-tight">{value}</p>
      <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{note}</p>
    </div>
  );
}

export default function AccountPage() {
  const { user, isChecking, refreshUser, changePassword } = useCustomerAuth();
  const { pushToast } = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { refreshCart } = useCart();
  const { refreshWishlist } = useWishlist();

  const activeSection = sanitizeSection(searchParams.get("section"));
  const [loading, setLoading] = useState(true);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [summary, setSummary] = useState<AccountSummary | null>(null);
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [wishlistProducts, setWishlistProducts] = useState<WishlistProduct[]>([]);
  const [addresses, setAddresses] = useState<AddressRecord[]>([]);
  const [profileForm, setProfileForm] = useState(emptyProfileForm);
  const [preferences, setPreferences] = useState<AccountPreferences>(emptyPreferences);
  const [notifications, setNotifications] =
    useState<CommunicationPreferences>(emptyNotifications);
  const [addressForm, setAddressForm] = useState(emptyAddressForm);
  const [supportForm, setSupportForm] = useState(emptySupportForm);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [profileEditing, setProfileEditing] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [addressEditing, setAddressEditing] = useState(false);
  const [submitting, setSubmitting] = useState<string>("");
  const [error, setError] = useState("");

  const loadAccountData = useCallback(async () => {
    setLoading(true);
    setOrdersLoading(true);
    setError("");

    try {
      const [summaryResponse, ordersResponse, wishlistResponse] = await Promise.all([
        apiRequest<AccountSummary>("/account/summary", { cache: "no-store" }),
        apiRequest<OrderRecord[]>("/order/myorders", { cache: "no-store" }),
        apiRequest<WishlistResponse>("/account/wishlist", { cache: "no-store" }),
      ]);

      setSummary(summaryResponse);
      setOrders(ordersResponse);
      setWishlistProducts(wishlistResponse.products);
      setAddresses(summaryResponse.user.addresses || []);
      setProfileForm(buildProfileForm(summaryResponse.user));
      setPreferences(summaryResponse.user.preferences || emptyPreferences);
      setNotifications(
        summaryResponse.user.communicationPreferences || emptyNotifications
      );
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "We could not load your account right now."
      );
    } finally {
      setLoading(false);
      setOrdersLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isChecking || !user) {
      return;
    }

    void loadAccountData();
  }, [isChecking, loadAccountData, user]);

  const changeSection = (section: AccountSectionId) => {
    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.set("section", section);
    router.replace(`${pathname}?${nextParams.toString()}`, { scroll: false });
  };

  const dashboardBadges = useMemo(
    () => ({
      orders: `${summary?.counts.orders || orders.length}`,
      addresses: `${summary?.counts.addresses || addresses.length}`,
      wishlist: `${summary?.counts.wishlist || wishlistProducts.length}`,
    }),
    [
      addresses.length,
      orders.length,
      summary?.counts.addresses,
      summary?.counts.orders,
      summary?.counts.wishlist,
      wishlistProducts.length,
    ]
  );

  const saveProfile = useCallback(async () => {
    setSubmitting("profile");
    setError("");

    try {
      const response = await apiRequest<{ user: AccountUser }>("/account/profile", {
        method: "PUT",
        body: JSON.stringify({
          ...profileForm,
          dateOfBirth: profileForm.dateOfBirth || null,
        }),
      });

      setSummary((current) =>
        current
          ? {
              ...current,
              user: {
                ...current.user,
                ...response.user,
              },
            }
          : current
      );
      setProfileForm(buildProfileForm(response.user));
      setProfileEditing(false);
      void loadAccountData();
      await refreshUser();
      pushToast("Profile saved");
    } catch (saveError) {
      setError(
        saveError instanceof Error ? saveError.message : "Could not save your profile."
      );
      pushToast("Could not save profile", "error");
    } finally {
      setSubmitting("");
    }
  }, [loadAccountData, profileForm, pushToast, refreshUser]);

  const uploadProfilePhoto = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];

      if (!file) {
        return;
      }

      setUploadingPhoto(true);

      try {
        const profilePictureUrl = await compressSingleImage(file, 420);
        setProfileForm((current) => ({
          ...current,
          profilePictureUrl,
        }));
        pushToast("Profile photo ready");
      } catch (uploadError) {
        setError(
          uploadError instanceof Error
            ? uploadError.message
            : "Could not process profile photo."
        );
        pushToast("Could not process profile photo", "error");
      } finally {
        setUploadingPhoto(false);
        event.target.value = "";
      }
    },
    [pushToast]
  );

  const saveAddress = useCallback(async () => {
    setSubmitting("address");
    setError("");

    try {
      const endpoint = addressForm.id
        ? `/account/addresses/${addressForm.id}`
        : "/account/addresses";
      const method = addressForm.id ? "PUT" : "POST";
      const response = await apiRequest<{ addresses: AddressRecord[] }>(endpoint, {
        method,
        body: JSON.stringify(addressForm),
      });

      setAddresses(response.addresses);
      setAddressEditing(false);
      setAddressForm(emptyAddressForm);
      void loadAccountData();
      await refreshUser();
      pushToast(addressForm.id ? "Address updated" : "Address added");
    } catch (saveError) {
      setError(
        saveError instanceof Error ? saveError.message : "Could not save address."
      );
      pushToast("Could not save address", "error");
    } finally {
      setSubmitting("");
    }
  }, [addressForm, loadAccountData, pushToast, refreshUser]);

  const deleteAddress = useCallback(async (addressId: string) => {
    setSubmitting(`delete-address-${addressId}`);

    try {
      const response = await apiRequest<{ addresses: AddressRecord[] }>(
        `/account/addresses/${addressId}`,
        {
          method: "DELETE",
        }
      );
      setAddresses(response.addresses);
      void loadAccountData();
      await refreshUser();
      pushToast("Address removed");
    } catch (deleteError) {
      setError(
        deleteError instanceof Error ? deleteError.message : "Could not remove address."
      );
      pushToast("Could not remove address", "error");
    } finally {
      setSubmitting("");
    }
  }, [loadAccountData, pushToast, refreshUser]);

  const makeDefaultAddress = useCallback(async (addressId: string) => {
    setSubmitting(`default-address-${addressId}`);

    try {
      const response = await apiRequest<{ addresses: AddressRecord[] }>(
        `/account/addresses/${addressId}/default`,
        {
          method: "PUT",
        }
      );
      setAddresses(response.addresses);
      void loadAccountData();
      await refreshUser();
      pushToast("Default address updated");
    } catch (defaultError) {
      setError(
        defaultError instanceof Error
          ? defaultError.message
          : "Could not update default address."
      );
      pushToast("Could not update default address", "error");
    } finally {
      setSubmitting("");
    }
  }, [loadAccountData, pushToast, refreshUser]);

  const savePreferences = useCallback(async () => {
    setSubmitting("preferences");

    try {
      const response = await apiRequest<{ preferences: AccountPreferences }>(
        "/account/preferences",
        {
          method: "PUT",
          body: JSON.stringify(preferences),
        }
      );
      setPreferences(response.preferences);
      pushToast("Preferences saved");
    } catch (preferencesError) {
      setError(
        preferencesError instanceof Error
          ? preferencesError.message
          : "Could not save preferences."
      );
      pushToast("Could not save preferences", "error");
    } finally {
      setSubmitting("");
    }
  }, [preferences, pushToast]);

  const saveNotifications = useCallback(async () => {
    setSubmitting("notifications");

    try {
      const response = await apiRequest<{
        communicationPreferences: CommunicationPreferences;
      }>("/account/notifications", {
        method: "PUT",
        body: JSON.stringify(notifications),
      });
      setNotifications(response.communicationPreferences);
      pushToast("Notification preferences saved");
    } catch (notificationError) {
      setError(
        notificationError instanceof Error
          ? notificationError.message
          : "Could not save notification preferences."
      );
      pushToast("Could not save notifications", "error");
    } finally {
      setSubmitting("");
    }
  }, [notifications, pushToast]);

  const moveWishlistToCart = useCallback(async (productId: string) => {
    setSubmitting(`wishlist-cart-${productId}`);

    try {
      await apiRequest(`/account/wishlist/${productId}/move-to-cart`, {
        method: "POST",
      });
      await Promise.all([refreshCart(), refreshWishlist(), loadAccountData()]);
      pushToast("Moved to cart");
    } catch (wishlistError) {
      setError(
        wishlistError instanceof Error
          ? wishlistError.message
          : "Could not move product to cart."
      );
      pushToast("Could not move to cart", "error");
    } finally {
      setSubmitting("");
    }
  }, [loadAccountData, pushToast, refreshCart, refreshWishlist]);

  const removeWishlistItem = useCallback(async (productId: string) => {
    setSubmitting(`wishlist-remove-${productId}`);

    try {
      await apiRequest(`/account/wishlist/${productId}`, {
        method: "DELETE",
      });
      await Promise.all([refreshWishlist(), loadAccountData()]);
      pushToast("Removed from wishlist");
    } catch (wishlistError) {
      setError(
        wishlistError instanceof Error
          ? wishlistError.message
          : "Could not remove from wishlist."
      );
      pushToast("Could not update wishlist", "error");
    } finally {
      setSubmitting("");
    }
  }, [loadAccountData, pushToast, refreshWishlist]);

  const reorderOrder = useCallback(async (orderId: string) => {
    setSubmitting(`reorder-${orderId}`);

    try {
      await apiRequest(`/order/${orderId}/reorder`, {
        method: "POST",
      });
      await refreshCart();
      pushToast("Items added to cart");
      router.push("/cart");
    } catch (reorderError) {
      setError(
        reorderError instanceof Error ? reorderError.message : "Could not reorder right now."
      );
      pushToast("Could not reorder", "error");
    } finally {
      setSubmitting("");
    }
  }, [pushToast, refreshCart, router]);

  const submitSupport = useCallback(async () => {
    setSubmitting("support");

    try {
      await apiRequest("/account/support", {
        method: "POST",
        body: JSON.stringify(supportForm),
      });
      setSupportForm(emptySupportForm);
      pushToast("Support request sent");
    } catch (supportError) {
      setError(
        supportError instanceof Error
          ? supportError.message
          : "Could not send support request."
      );
      pushToast("Could not send support request", "error");
    } finally {
      setSubmitting("");
    }
  }, [pushToast, supportForm]);

  const submitPasswordChange = useCallback(async () => {
    if (!passwordForm.currentPassword || !passwordForm.newPassword) {
      setError("Current password and new password are required.");
      pushToast("Add both current and new password", "error");
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError("New password and confirm password must match.");
      pushToast("Passwords do not match", "error");
      return;
    }

    setSubmitting("password");

    try {
      const success = await changePassword(
        passwordForm.currentPassword,
        passwordForm.newPassword
      );

      if (!success) {
        throw new Error("Could not change password right now.");
      }

      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      pushToast("Password changed");
    } catch (passwordError) {
      setError(
        passwordError instanceof Error
          ? passwordError.message
          : "Could not change password right now."
      );
      pushToast("Could not change password", "error");
    } finally {
      setSubmitting("");
    }
  }, [changePassword, passwordForm, pushToast]);

  const downloadInvoice = useCallback(
    async (orderId: string, orderNumber?: number | null) => {
      try {
        await downloadApiFile(
          `/order/${orderId}/invoice`,
          `hrushe-invoice-${orderNumber || orderId}.pdf`
        );
        pushToast("Invoice downloaded");
      } catch (downloadError) {
        setError(
          downloadError instanceof Error
            ? downloadError.message
            : "Could not download invoice."
        );
        pushToast("Could not download invoice", "error");
      }
    },
    [pushToast]
  );

  if (isChecking || loading) {
    return (
      <div className="page-shell">
        <SiteHeader />
        <AccountGuard>
          <main className="mx-auto max-w-[1600px] px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
            <LoadingState
              title="Preparing your account."
              description="We are loading orders, saved pieces, addresses, and account preferences."
            />
          </main>
        </AccountGuard>
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="page-shell">
      <SiteHeader />
      <AccountGuard>
        <main className="mx-auto max-w-[1600px] px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
          {error ? (
            <div className="mb-6 rounded-[1.5rem] border border-[var(--accent)]/15 bg-[var(--accent)]/6 px-5 py-4 text-sm text-[var(--accent)]">
              {error}
            </div>
          ) : null}

          <AccountShell
            activeSection={activeSection}
            onSectionChange={changeSection}
            userName={summary?.user.name || user?.name || "HRUSHE member"}
            summaryBadges={dashboardBadges}
          >
            {activeSection === "dashboard" ? (
              <>
                <AccountSectionCard
                  eyebrow="Dashboard"
                  title={`Welcome back, ${(summary?.user.name || user?.name || "member").split(" ")[0]}.`}
                  description="Scan your recent activity, jump back into repeat buying, and keep the essentials of your account within quick reach."
                >
                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <AccountMetric
                      label="Recent orders"
                      value={`${orders.length}`}
                      note="See every recent checkout and reorder in one tap."
                    />
                    <AccountMetric
                      label="Saved addresses"
                      value={`${addresses.length}`}
                      note="Keep multiple shipping locations ready for faster checkout."
                    />
                    <AccountMetric
                      label="Wishlist"
                      value={`${wishlistProducts.length}`}
                      note="Saved pieces stay ready for later when you want to convert quickly."
                    />
                    <AccountMetric
                      label="Preferred fit"
                      value={preferences.preferredFit || "Not set"}
                      note="Use saved fit preferences to speed up repeat buying."
                    />
                  </div>
                </AccountSectionCard>

                <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
                  <AccountSectionCard
                    eyebrow="Recent orders"
                    title="What happened lately."
                    description="A compact view of your latest purchases with fast links to details and tracking."
                    action={
                      <button
                        type="button"
                        onClick={() => changeSection("orders")}
                        className="button-secondary rounded-full px-4 py-2.5 text-sm transition"
                      >
                        View all orders
                      </button>
                    }
                  >
                    {orders.length === 0 ? (
                      <EmptyState
                        title="No orders yet."
                        description="Your first purchase will appear here with tracking, status, and reorder actions."
                        ctaHref="/shop"
                        ctaLabel="Shop now"
                      />
                    ) : (
                      <div className="space-y-4">
                        {orders.slice(0, 3).map((order) => (
                          <div
                            key={order.id}
                            className="rounded-[1.5rem] border border-[var(--border)] bg-white/70 p-4"
                          >
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                              <div>
                                <p className="text-lg font-semibold">
                                  Order #{order.orderNumber || order.id}
                                </p>
                                <p className="mt-1 text-sm text-[var(--muted)]">
                                  {formatOrderDate(order.createdAt)} · {order.products.length} items
                                </p>
                              </div>
                              <span className="text-sm font-medium text-[var(--accent)]">
                                {order.orderStatus}
                              </span>
                            </div>
                            <div className="mt-4 flex flex-wrap gap-2.5 sm:gap-3">
                              <Link
                                href={`/my-orders/${order.id}`}
                                className="button-secondary rounded-full px-4 py-2.5 text-sm transition"
                              >
                                View details
                              </Link>
                              {order.trackingUrl ? (
                                <a
                                  href={order.trackingUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="rounded-full px-4 py-2.5 text-sm font-medium text-[#1f7a39] transition hover:text-[#17622d]"
                                >
                                  Track shipment
                                </a>
                              ) : null}
                              <button
                                type="button"
                                onClick={() => void reorderOrder(order.id)}
                                className="button-primary rounded-full px-4 py-2.5 text-sm transition"
                              >
                                {submitting === `reorder-${order.id}` ? "Adding..." : "Reorder"}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </AccountSectionCard>

                  <div className="space-y-6">
                    <AccountSectionCard
                      eyebrow="Account details"
                      title="Identity and delivery at a glance."
                      description="The essentials we use for checkout, support, and order updates."
                    >
                      <div className="grid gap-4">
                        <div className="rounded-[1.5rem] border border-[var(--border)] bg-white/70 p-4">
                          <p className="text-xs uppercase tracking-[0.18em] text-[var(--accent)]">
                            Email
                          </p>
                          <p className="mt-2 text-lg font-semibold">
                            {summary?.user.email || user?.email || "Not available"}
                          </p>
                        </div>
                        <div className="rounded-[1.5rem] border border-[var(--border)] bg-white/70 p-4">
                          <p className="text-xs uppercase tracking-[0.18em] text-[var(--accent)]">
                            Phone
                          </p>
                          <p className="mt-2 text-lg font-semibold">
                            {summary?.user.phone || user?.phone || "Not available"}
                          </p>
                        </div>
                        <div className="rounded-[1.5rem] border border-[var(--border)] bg-white/70 p-4">
                          <p className="text-xs uppercase tracking-[0.18em] text-[var(--accent)]">
                            Default delivery address
                          </p>
                          <p className="mt-2 text-base leading-7">
                            {summary?.user.address || "Add an address to keep checkout faster."}
                          </p>
                        </div>
                      </div>
                    </AccountSectionCard>

                    <AccountSectionCard
                      eyebrow="Quick links"
                      title="Use the account like a repeat customer."
                      description="The fastest actions for retention, repurchase, and post-purchase care."
                    >
                      <div className="grid gap-3 sm:grid-cols-2">
                        {[
                          { id: "wishlist", label: "Open wishlist" },
                          { id: "addresses", label: "Manage addresses" },
                          { id: "preferences", label: "Update preferences" },
                          { id: "support", label: "Contact support" },
                        ].map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => changeSection(item.id as AccountSectionId)}
                            className="rounded-[1.3rem] border border-[var(--border)] bg-white/70 px-4 py-4 text-left transition hover:border-black/25"
                          >
                            <p className="font-semibold">{item.label}</p>
                          </button>
                        ))}
                      </div>
                    </AccountSectionCard>
                  </div>
                </div>
              </>
            ) : null}

            {activeSection === "profile" ? (
              <AccountSectionCard
                eyebrow="Profile"
                title="Personal details"
                description="Keep your details current so checkout, order updates, and support stay frictionless."
                action={
                  <button
                    type="button"
                    onClick={() => {
                      setProfileEditing((current) => !current);
                      setProfileForm(buildProfileForm(summary?.user || null));
                    }}
                    className="button-secondary rounded-full px-4 py-2.5 text-sm transition"
                  >
                    {profileEditing ? "Close editor" : "Edit profile"}
                  </button>
                }
              >
                <div className="grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
                  <div className="rounded-[1.8rem] border border-[var(--border)] bg-white/70 p-5 text-center">
                    <div className="relative mx-auto h-24 w-24 overflow-hidden rounded-full border border-[var(--border)] bg-[#f4f4f4]">
                      {profileForm.profilePictureUrl ? (
                        <Image
                          src={profileForm.profilePictureUrl}
                          alt={summary?.user.name || user?.name || "Profile"}
                          fill
                          unoptimized
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-[var(--accent)] text-3xl font-semibold uppercase text-white">
                          {(summary?.user.name || user?.name || "H").charAt(0)}
                        </div>
                      )}
                    </div>
                    <p className="mt-4 text-xl font-semibold">{summary?.user.name || user?.name}</p>
                    <p className="mt-2 text-sm text-[var(--muted)]">
                      {summary?.user.gender || "Customer"} ·{" "}
                      {summary?.user.dateOfBirth
                        ? new Intl.DateTimeFormat("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          }).format(new Date(summary.user.dateOfBirth))
                        : "Date of birth not added"}
                    </p>
                    {profileEditing ? (
                      <label className="button-secondary mt-4 inline-flex cursor-pointer rounded-full px-4 py-2 text-sm transition">
                        {uploadingPhoto ? "Processing..." : "Upload photo"}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(event) => void uploadProfilePhoto(event)}
                          className="hidden"
                        />
                      </label>
                    ) : null}
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    {[
                      { label: "Full name", value: profileForm.name, key: "name", type: "text" },
                      { label: "Email", value: profileForm.email, key: "email", type: "email" },
                      { label: "Phone", value: profileForm.phone, key: "phone", type: "text" },
                      {
                        label: "Date of birth",
                        value: profileForm.dateOfBirth,
                        key: "dateOfBirth",
                        type: "date",
                      },
                    ].map((field) => (
                      <label key={field.key} className="space-y-2">
                        <span className="text-sm text-[var(--muted)]">{field.label}</span>
                        <input
                          type={field.type}
                          value={field.value}
                          disabled={!profileEditing}
                          onChange={(event) =>
                            setProfileForm((current) => ({
                              ...current,
                              [field.key]: event.target.value,
                            }))
                          }
                          className="w-full rounded-[1.2rem] border border-[var(--border)] bg-white/80 px-4 py-3 disabled:opacity-70"
                        />
                      </label>
                    ))}
                    <label className="space-y-2">
                      <span className="text-sm text-[var(--muted)]">Gender</span>
                      <select
                        value={profileForm.gender}
                        disabled={!profileEditing}
                        onChange={(event) =>
                          setProfileForm((current) => ({
                            ...current,
                            gender: event.target.value,
                          }))
                        }
                        className="w-full rounded-[1.2rem] border border-[var(--border)] bg-white/80 px-4 py-3 disabled:opacity-70"
                      >
                        {genderOptions.map((option) => (
                          <option key={option || "none"} value={option}>
                            {option || "Select"}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                </div>

                {profileEditing ? (
                  <div className="mt-6 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => void saveProfile()}
                      disabled={submitting === "profile"}
                      className="button-primary rounded-full px-5 py-3 transition disabled:opacity-60"
                    >
                      {submitting === "profile" ? "Saving..." : "Save changes"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setProfileEditing(false);
                        setProfileForm(buildProfileForm(summary?.user || null));
                      }}
                      className="button-secondary rounded-full px-5 py-3 transition"
                    >
                      Cancel
                    </button>
                  </div>
                ) : null}

                <div className="section-divider mt-8" />
                <div className="mt-8 rounded-[1.6rem] border border-[var(--border)] bg-white/70 p-5">
                  <p className="text-sm uppercase tracking-[0.18em] text-[var(--accent)]">
                    Security
                  </p>
                  <h3 className="mt-3 text-xl font-semibold">Change password</h3>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">
                    Update your password without leaving the account area. Forgot-password still
                    remains available from the login popup if you ever get locked out.
                  </p>
                  <div className="mt-5 grid gap-4 md:grid-cols-3">
                    <input
                      type="password"
                      value={passwordForm.currentPassword}
                      onChange={(event) =>
                        setPasswordForm((current) => ({
                          ...current,
                          currentPassword: event.target.value,
                        }))
                      }
                      placeholder="Current password"
                      className="w-full rounded-[1.2rem] border border-[var(--border)] bg-white/80 px-4 py-3"
                    />
                    <input
                      type="password"
                      value={passwordForm.newPassword}
                      onChange={(event) =>
                        setPasswordForm((current) => ({
                          ...current,
                          newPassword: event.target.value,
                        }))
                      }
                      placeholder="New password"
                      className="w-full rounded-[1.2rem] border border-[var(--border)] bg-white/80 px-4 py-3"
                    />
                    <input
                      type="password"
                      value={passwordForm.confirmPassword}
                      onChange={(event) =>
                        setPasswordForm((current) => ({
                          ...current,
                          confirmPassword: event.target.value,
                        }))
                      }
                      placeholder="Confirm password"
                      className="w-full rounded-[1.2rem] border border-[var(--border)] bg-white/80 px-4 py-3"
                    />
                  </div>
                  <div className="mt-5">
                    <button
                      type="button"
                      onClick={() => void submitPasswordChange()}
                      disabled={submitting === "password"}
                      className="button-primary rounded-full px-5 py-3 transition disabled:opacity-60"
                    >
                      {submitting === "password" ? "Updating..." : "Change password"}
                    </button>
                  </div>
                </div>
              </AccountSectionCard>
            ) : null}

            {activeSection === "addresses" ? (
              <AccountSectionCard
                eyebrow="Address book"
                title="Saved delivery addresses"
                description="Keep Home, Work, and alternate delivery locations ready so checkout stays fast and accurate."
                action={
                  <button
                    type="button"
                    onClick={() => {
                      setAddressEditing((current) => !current);
                      setAddressForm(emptyAddressForm);
                    }}
                    className="button-primary rounded-full px-4 py-2.5 text-sm transition"
                  >
                    {addressEditing ? "Close form" : "Add new address"}
                  </button>
                }
              >
                <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
                  <div className="space-y-4">
                    {addresses.length === 0 ? (
                      <EmptyState
                        title="No saved addresses yet."
                        description="Add your first shipping address to make repeat purchases much faster."
                      />
                    ) : (
                      addresses.map((address) => (
                        <div
                          key={address.id}
                          className="rounded-[1.6rem] border border-[var(--border)] bg-white/70 p-5"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <span className="rounded-full border border-[var(--border)] px-3 py-1 text-xs uppercase tracking-[0.18em] text-[var(--accent)]">
                                {address.label}
                              </span>
                              {address.isDefault ? (
                                <span className="rounded-full bg-black px-3 py-1 text-xs uppercase tracking-[0.18em] text-white">
                                  Default
                                </span>
                              ) : null}
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {!address.isDefault ? (
                                <button
                                  type="button"
                                  onClick={() => void makeDefaultAddress(address.id)}
                                  className="button-secondary rounded-full px-3 py-2 text-xs transition"
                                >
                                  Set default
                                </button>
                              ) : null}
                              <button
                                type="button"
                                onClick={() => {
                                  setAddressForm(address);
                                  setAddressEditing(true);
                                }}
                                className="button-secondary rounded-full px-3 py-2 text-xs transition"
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => void deleteAddress(address.id)}
                                className="rounded-full px-3 py-2 text-xs text-[var(--accent)] transition hover:bg-[var(--accent)]/6"
                              >
                                {submitting === `delete-address-${address.id}` ? "Removing..." : "Delete"}
                              </button>
                            </div>
                          </div>
                          <p className="mt-4 font-semibold">{address.fullName}</p>
                          <p className="mt-1 text-sm text-[var(--muted)]">{address.mobile}</p>
                          <p className="mt-3 text-sm leading-6 text-[var(--foreground)]">
                            {buildAddressPreview(address)}
                          </p>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="rounded-[1.8rem] border border-[var(--border)] bg-white/70 p-5">
                    <p className="text-sm uppercase tracking-[0.18em] text-[var(--accent)]">
                      {addressForm.id ? "Edit address" : "New address"}
                    </p>
                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                      <label className="space-y-2 sm:col-span-2">
                        <span className="text-sm text-[var(--muted)]">Address type</span>
                        <select
                          value={addressForm.label}
                          onChange={(event) =>
                            setAddressForm((current) => ({
                              ...current,
                              label: event.target.value as AddressRecord["label"],
                            }))
                          }
                          className="w-full rounded-[1.2rem] border border-[var(--border)] bg-white/80 px-4 py-3"
                        >
                          {["Home", "Work", "Other"].map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      </label>
                      {[
                        ["fullName", "Full name"],
                        ["mobile", "Mobile"],
                        ["pincode", "Pincode"],
                        ["city", "City"],
                        ["state", "State"],
                        ["house", "House / Building"],
                        ["area", "Area / Street"],
                        ["landmark", "Landmark"],
                      ].map(([key, label]) => (
                        <label
                          key={key}
                          className={`space-y-2 ${key === "landmark" ? "sm:col-span-2" : ""}`}
                        >
                          <span className="text-sm text-[var(--muted)]">{label}</span>
                          <input
                            value={addressForm[key as keyof typeof addressForm] as string}
                            onChange={(event) =>
                              setAddressForm((current) => ({
                                ...current,
                                [key]: event.target.value,
                              }))
                            }
                            className="w-full rounded-[1.2rem] border border-[var(--border)] bg-white/80 px-4 py-3"
                          />
                        </label>
                      ))}
                    </div>
                    <label className="mt-4 flex items-center gap-3 text-sm text-[var(--muted)]">
                      <input
                        type="checkbox"
                        checked={addressForm.isDefault}
                        onChange={(event) =>
                          setAddressForm((current) => ({
                            ...current,
                            isDefault: event.target.checked,
                          }))
                        }
                      />
                      Make this my default delivery address
                    </label>
                    <div className="mt-5 flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={() => void saveAddress()}
                        disabled={submitting === "address"}
                        className="button-primary rounded-full px-5 py-3 transition disabled:opacity-60"
                      >
                        {submitting === "address" ? "Saving..." : addressForm.id ? "Save address" : "Add address"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setAddressForm(emptyAddressForm);
                          setAddressEditing(false);
                        }}
                        className="button-secondary rounded-full px-5 py-3 transition"
                      >
                        Reset
                      </button>
                    </div>
                  </div>
                </div>
              </AccountSectionCard>
            ) : null}

            {activeSection === "orders" ? (
              <AccountSectionCard
                eyebrow="Orders"
                title="Your complete order history"
                description="Track every purchase, jump to detail pages, download invoices later, and reorder in one click."
              >
                {ordersLoading ? (
                  <LoadingState
                    title="Loading your orders."
                    description="We are preparing your order history and status updates."
                  />
                ) : orders.length === 0 ? (
                  <EmptyState
                    title="No orders yet."
                    description="Your purchases will show up here once you complete checkout."
                    ctaHref="/shop"
                    ctaLabel="Shop now"
                  />
                ) : (
                  <div className="space-y-4">
                    {orders.map((order) => (
                      <div
                        key={order.id}
                        className="rounded-[1.7rem] border border-[var(--border)] bg-white/70 p-5"
                      >
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                          <div>
                            <p className="text-xl font-semibold">
                              Order #{order.orderNumber || order.id}
                            </p>
                            <p className="mt-1 text-sm text-[var(--muted)]">
                              {formatOrderDate(order.createdAt)} · {order.paymentMethod} ·{" "}
                              {order.paymentStatus}
                            </p>
                          </div>
                          <div className="flex flex-wrap items-center gap-3">
                            <span className="rounded-full border border-[var(--border)] px-3 py-1 text-xs uppercase tracking-[0.18em] text-[var(--accent)]">
                              {order.orderStatus}
                            </span>
                            <span className="text-lg font-semibold">
                              Rs. {order.totalAmount.toLocaleString("en-IN")}
                            </span>
                          </div>
                        </div>

                        <div className="mt-5 space-y-3">
                          {order.products.map((product, index) => (
                            <div
                              key={`${order.id}-${product.productId}-${index}`}
                              className="flex gap-4 rounded-[1.4rem] border border-[var(--border)] bg-white/70 p-4"
                            >
                              <div className="relative h-24 w-20 overflow-hidden rounded-[1rem] bg-[#f4f4f4]">
                                {product.image ? (
                                  <Image
                                    src={product.image}
                                    alt={product.name}
                                    fill
                                    unoptimized
                                    className="object-cover"
                                  />
                                ) : null}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="font-semibold">{product.name}</p>
                                <p className="mt-1 text-sm text-[var(--muted)]">
                                  Size {product.size || "Standard"}
                                  {product.color ? ` · ${product.color}` : ""}
                                  {product.fit ? ` · ${product.fit}` : ""}
                                </p>
                                <p className="mt-1 text-sm text-[var(--muted)]">
                                  Qty {product.quantity}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="mt-5 flex flex-wrap gap-3">
                          <Link
                            href={`/my-orders/${order.id}`}
                            className="button-secondary rounded-full px-4 py-2.5 text-sm transition"
                          >
                            View details
                          </Link>
                          {order.trackingUrl ? (
                            <a
                              href={order.trackingUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="rounded-full px-4 py-2.5 text-sm font-medium text-[#1f7a39] transition hover:text-[#17622d]"
                            >
                              Track shipment
                            </a>
                          ) : (
                            <button
                              type="button"
                              onClick={() => pushToast("Tracking link will appear after dispatch")}
                              className="button-secondary rounded-full px-4 py-2.5 text-sm transition"
                            >
                              Tracking pending
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => void downloadInvoice(order.id, order.orderNumber)}
                            className="button-secondary rounded-full px-4 py-2.5 text-sm transition"
                          >
                            Download invoice
                          </button>
                          <button
                            type="button"
                            onClick={() => void reorderOrder(order.id)}
                            className="button-primary rounded-full px-4 py-2.5 text-sm transition"
                          >
                            {submitting === `reorder-${order.id}` ? "Adding..." : "Reorder"}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </AccountSectionCard>
            ) : null}

            {activeSection === "wishlist" ? (
              <AccountSectionCard
                eyebrow="Wishlist"
                title="Saved for your next drop"
                description="Keep shortlisted pieces together, remove them, or move them straight into cart when you are ready."
              >
                {wishlistProducts.length === 0 ? (
                  <EmptyState
                    title="Your wishlist is empty."
                    description="Save products you want to revisit and they will stay here for later."
                    ctaHref="/shop"
                    ctaLabel="Explore products"
                  />
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {wishlistProducts.map((product) => (
                      <div
                        key={product.id}
                        className="rounded-[1.8rem] border border-[var(--border)] bg-white/70 p-4"
                      >
                        <div className="relative aspect-[4/5] overflow-hidden rounded-[1.4rem] bg-[#f4f4f4]">
                          {product.images[0] ? (
                            <Image
                              src={product.images[0]}
                              alt={product.name}
                              fill
                              unoptimized
                              className="object-cover"
                            />
                          ) : null}
                        </div>
                        <p className="mt-4 text-xs uppercase tracking-[0.18em] text-[var(--accent)]">
                          {product.category}
                        </p>
                        <p className="mt-2 text-xl font-semibold leading-tight">{product.name}</p>
                        <div className="mt-3 flex items-center gap-3">
                          <span className="text-lg font-semibold">
                            Rs. {product.price.toLocaleString("en-IN")}
                          </span>
                          {product.compareAtPrice ? (
                            <span className="text-sm text-[var(--muted)] line-through">
                              Rs. {product.compareAtPrice.toLocaleString("en-IN")}
                            </span>
                          ) : null}
                        </div>
                        <div className="mt-4 flex flex-wrap gap-2">
                          <Link
                            href={product.slug ? `/product/${product.slug}` : "/shop"}
                            className="button-secondary rounded-full px-4 py-2.5 text-sm transition"
                          >
                            View product
                          </Link>
                          <button
                            type="button"
                            onClick={() => void moveWishlistToCart(product.id)}
                            className="button-primary rounded-full px-4 py-2.5 text-sm transition"
                          >
                            {submitting === `wishlist-cart-${product.id}` ? "Moving..." : "Move to cart"}
                          </button>
                          <button
                            type="button"
                            onClick={() => void removeWishlistItem(product.id)}
                            className="rounded-full px-4 py-2.5 text-sm text-[var(--accent)] transition hover:bg-[var(--accent)]/6"
                          >
                            {submitting === `wishlist-remove-${product.id}` ? "Removing..." : "Remove"}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </AccountSectionCard>
            ) : null}

            {activeSection === "preferences" ? (
              <AccountSectionCard
                eyebrow="My preferences"
                title="Size, fit, and style memory"
                description="Use saved preferences to make future shopping feel faster and more personal."
              >
                <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
                  <div className="space-y-5">
                    <label className="space-y-2">
                      <span className="text-sm text-[var(--muted)]">Preferred size</span>
                      <div className="flex flex-wrap gap-2">
                        {sizeOptions.map((size) => (
                          <button
                            key={size}
                            type="button"
                            onClick={() =>
                              setPreferences((current) => ({
                                ...current,
                                preferredSize: size,
                              }))
                            }
                            className={`rounded-full border px-4 py-2.5 text-sm transition ${
                              preferences.preferredSize === size
                                ? "border-black bg-black text-white"
                                : "border-[var(--border)] bg-white"
                            }`}
                          >
                            {size}
                          </button>
                        ))}
                      </div>
                    </label>
                    <label className="space-y-2">
                      <span className="text-sm text-[var(--muted)]">Preferred fit</span>
                      <div className="flex flex-wrap gap-2">
                        {fitOptions.map((fit) => (
                          <button
                            key={fit}
                            type="button"
                            onClick={() =>
                              setPreferences((current) => ({
                                ...current,
                                preferredFit: fit,
                              }))
                            }
                            className={`rounded-full border px-4 py-2.5 text-sm transition ${
                              preferences.preferredFit === fit
                                ? "border-black bg-black text-white"
                                : "border-[var(--border)] bg-white"
                            }`}
                          >
                            {fit}
                          </button>
                        ))}
                      </div>
                    </label>
                  </div>

                  <div className="rounded-[1.6rem] border border-[var(--border)] bg-white/70 p-5">
                    <p className="text-sm uppercase tracking-[0.18em] text-[var(--accent)]">
                      Favorite colors
                    </p>
                    <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                      Add up to 8 color names so future recommendations can feel more relevant to your wardrobe taste.
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {preferences.favoriteColors.map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() =>
                            setPreferences((current) => ({
                              ...current,
                              favoriteColors: current.favoriteColors.filter((item) => item !== color),
                            }))
                          }
                          className="rounded-full border border-[var(--border)] bg-white px-3 py-2 text-sm transition hover:border-black/30"
                        >
                          {color} ×
                        </button>
                      ))}
                    </div>
                    <div className="mt-4 flex gap-3">
                      <input
                        placeholder="Add favorite color and press Enter"
                        className="w-full rounded-[1.2rem] border border-[var(--border)] bg-white/80 px-4 py-3"
                        onKeyDown={(event) => {
                          if (event.key !== "Enter") {
                            return;
                          }

                          event.preventDefault();
                          const value = event.currentTarget.value.trim();

                          if (!value) {
                            return;
                          }

                          setPreferences((current) => ({
                            ...current,
                            favoriteColors: Array.from(
                              new Set([...current.favoriteColors, value])
                            ).slice(0, 8),
                          }));
                          event.currentTarget.value = "";
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-6">
                  <button
                    type="button"
                    onClick={() => void savePreferences()}
                    disabled={submitting === "preferences"}
                    className="button-primary rounded-full px-5 py-3 transition disabled:opacity-60"
                  >
                    {submitting === "preferences" ? "Saving..." : "Save preferences"}
                  </button>
                </div>
              </AccountSectionCard>
            ) : null}

            {activeSection === "notifications" ? (
              <AccountSectionCard
                eyebrow="Notifications"
                title="Communication preferences"
                description="Keep operational messages clear while letting customers decide how much brand communication they want."
              >
                <div className="grid gap-4">
                  {[
                    {
                      key: "emailNotifications" as const,
                      label: "Email notifications",
                      note: "Order updates, account changes, and important delivery information.",
                    },
                    {
                      key: "whatsappOrderUpdates" as const,
                      label: "SMS / WhatsApp order updates",
                      note: "Helpful shipment and delivery communications for Indian e-commerce flow.",
                    },
                    {
                      key: "marketingMessages" as const,
                      label: "Marketing and promotional messages",
                      note: "New drops, offers, and curated campaign updates.",
                    },
                  ].map((setting) => (
                    <label
                      key={setting.key}
                      className="flex items-center justify-between gap-4 rounded-[1.5rem] border border-[var(--border)] bg-white/70 p-5"
                    >
                      <div>
                        <p className="font-semibold">{setting.label}</p>
                        <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                          {setting.note}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setNotifications((current) => ({
                            ...current,
                            [setting.key]: !current[setting.key],
                          }))
                        }
                        className={`relative h-8 w-14 rounded-full transition ${
                          notifications[setting.key] ? "bg-black" : "bg-black/15"
                        }`}
                      >
                        <span
                          className={`absolute top-1 h-6 w-6 rounded-full bg-white transition ${
                            notifications[setting.key] ? "left-7" : "left-1"
                          }`}
                        />
                      </button>
                    </label>
                  ))}
                </div>

                <div className="mt-6">
                  <button
                    type="button"
                    onClick={() => void saveNotifications()}
                    disabled={submitting === "notifications"}
                    className="button-primary rounded-full px-5 py-3 transition disabled:opacity-60"
                  >
                    {submitting === "notifications" ? "Saving..." : "Save preferences"}
                  </button>
                </div>
              </AccountSectionCard>
            ) : null}

            {activeSection === "support" ? (
              <AccountSectionCard
                eyebrow="Support"
                title="Help after purchase"
                description="A lightweight service hub for tracking, return support, exchanges, and direct contact."
              >
                <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
                  <div className="space-y-4">
                    {supportOptions.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() =>
                          setSupportForm((current) => ({
                            ...current,
                            category: option.value,
                            subject: option.label,
                          }))
                        }
                        className={`w-full rounded-[1.5rem] border p-5 text-left transition ${
                          supportForm.category === option.value
                            ? "border-black bg-black text-white"
                            : "border-[var(--border)] bg-white/70"
                        }`}
                      >
                        <p className="font-semibold">{option.label}</p>
                        <p
                          className={`mt-2 text-sm leading-6 ${
                            supportForm.category === option.value
                              ? "text-white/75"
                              : "text-[var(--muted)]"
                          }`}
                        >
                          {option.description}
                        </p>
                      </button>
                    ))}
                  </div>

                  <div className="rounded-[1.7rem] border border-[var(--border)] bg-white/70 p-5">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <label className="space-y-2 sm:col-span-2">
                        <span className="text-sm text-[var(--muted)]">Subject</span>
                        <input
                          value={supportForm.subject}
                          onChange={(event) =>
                            setSupportForm((current) => ({
                              ...current,
                              subject: event.target.value,
                            }))
                          }
                          className="w-full rounded-[1.2rem] border border-[var(--border)] bg-white/80 px-4 py-3"
                        />
                      </label>
                      <label className="space-y-2 sm:col-span-2">
                        <span className="text-sm text-[var(--muted)]">Order ID (optional)</span>
                        <input
                          value={supportForm.orderId}
                          onChange={(event) =>
                            setSupportForm((current) => ({
                              ...current,
                              orderId: event.target.value,
                            }))
                          }
                          className="w-full rounded-[1.2rem] border border-[var(--border)] bg-white/80 px-4 py-3"
                          placeholder="Order number or id"
                        />
                      </label>
                      <label className="space-y-2 sm:col-span-2">
                        <span className="text-sm text-[var(--muted)]">Message</span>
                        <textarea
                          value={supportForm.message}
                          onChange={(event) =>
                            setSupportForm((current) => ({
                              ...current,
                              message: event.target.value,
                            }))
                          }
                          className="min-h-40 w-full rounded-[1.2rem] border border-[var(--border)] bg-white/80 px-4 py-3"
                          placeholder="Tell the support team exactly what you need help with."
                        />
                      </label>
                    </div>

                    <div className="mt-5 flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={() => void submitSupport()}
                        disabled={submitting === "support"}
                        className="button-primary rounded-full px-5 py-3 transition disabled:opacity-60"
                      >
                        {submitting === "support" ? "Sending..." : "Submit support request"}
                      </button>
                      <Link
                        href="/track-order"
                        className="button-secondary rounded-full px-5 py-3 transition"
                      >
                        Public track order
                      </Link>
                    </div>
                  </div>
                </div>
              </AccountSectionCard>
            ) : null}
          </AccountShell>
        </main>
      </AccountGuard>
      <SiteFooter />
    </div>
  );
}
