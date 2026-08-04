"use client";

import { useEffect, useMemo, useState } from "react";
import { apiRequest } from "@/lib/api";

export type AdminDashboardDatePreset =
  | "today"
  | "yesterday"
  | "last7"
  | "last30"
  | "thisMonth"
  | "previousMonth"
  | "custom";

export type AdminDashboardActionCard = {
  id: string;
  title: string;
  description: string;
  count: number;
  href: string;
  tone: "default" | "accent" | "success" | "warning";
  severity: "normal" | "medium" | "high" | "critical";
  available: boolean;
};

export type AdminDashboardRecentOrder = {
  id: string;
  orderNumber: number | null;
  customerName: string;
  customerEmail: string;
  paymentStatus: string;
  orderStatus: string;
  totalAmount: number;
  totalPaise: number;
  createdAt: string;
};

export type AdminDashboardTopProduct = {
  productId: string;
  name: string;
  quantity: number;
  revenuePaise: number;
};

export type AdminDashboardOverview = {
  dateRange: {
    preset: AdminDashboardDatePreset;
    label: string;
    from: string;
    to: string;
    timezone: string;
  };
  revenue: {
    todayPaise: number;
    weekPaise: number;
    monthPaise: number;
    selectedPaise: number;
    selectedPaidOrders: number;
    averageOrderValuePaise: number;
  };
  orders: {
    today: number;
    selectedTotal: number;
    awaitingPayment: number;
    awaitingFulfillment: number;
    awaitingShipment: number;
    initiatedOlderThan20Minutes: number;
  };
  payments: {
    failed: number;
    manualReview: number;
    reconciliationIssues: number;
    expiredReservations: number;
    warningTotal: number;
  };
  inventory: {
    trackedVariants: number;
    physicalStock: number;
    reservedUnits: number;
    reservedVariants: number;
    lowStockVariants: number;
    outOfStockVariants: number;
    lowStockThreshold: number;
    activeReservations: number;
  };
  fulfilment: {
    delayedShipments: number;
    failedShipments: number;
    providerConfigured: boolean;
  };
  returns: {
    pending: number;
    exchangesPending: number;
    modelConfigured: boolean;
  };
  storefront: {
    scheduledCampaigns: number;
    missingMobileMedia: number;
    brokenLinks: number;
    draftStorefrontChanges: number;
    recentPublishedAt: string | null;
    version: number;
  };
  support: {
    attention: number;
  };
  actionCards: AdminDashboardActionCard[];
  recentOrders: AdminDashboardRecentOrder[];
  topProducts: AdminDashboardTopProduct[];
  unsupportedMetrics: Array<{
    key: string;
    label: string;
    reason: string;
  }>;
  generatedAt: string;
  cached: boolean;
};

const emptyOverview: AdminDashboardOverview = {
  dateRange: {
    preset: "last7",
    label: "Last 7 days",
    from: "",
    to: "",
    timezone: "Asia/Kolkata",
  },
  revenue: {
    todayPaise: 0,
    weekPaise: 0,
    monthPaise: 0,
    selectedPaise: 0,
    selectedPaidOrders: 0,
    averageOrderValuePaise: 0,
  },
  orders: {
    today: 0,
    selectedTotal: 0,
    awaitingPayment: 0,
    awaitingFulfillment: 0,
    awaitingShipment: 0,
    initiatedOlderThan20Minutes: 0,
  },
  payments: {
    failed: 0,
    manualReview: 0,
    reconciliationIssues: 0,
    expiredReservations: 0,
    warningTotal: 0,
  },
  inventory: {
    trackedVariants: 0,
    physicalStock: 0,
    reservedUnits: 0,
    reservedVariants: 0,
    lowStockVariants: 0,
    outOfStockVariants: 0,
    lowStockThreshold: 3,
    activeReservations: 0,
  },
  fulfilment: {
    delayedShipments: 0,
    failedShipments: 0,
    providerConfigured: false,
  },
  returns: {
    pending: 0,
    exchangesPending: 0,
    modelConfigured: false,
  },
  storefront: {
    scheduledCampaigns: 0,
    missingMobileMedia: 0,
    brokenLinks: 0,
    draftStorefrontChanges: 0,
    recentPublishedAt: null,
    version: 1,
  },
  support: {
    attention: 0,
  },
  actionCards: [],
  recentOrders: [],
  topProducts: [],
  unsupportedMetrics: [],
  generatedAt: "",
  cached: false,
};

function buildOverviewPath({
  range,
  from,
  to,
}: {
  range: AdminDashboardDatePreset;
  from?: string;
  to?: string;
}) {
  const params = new URLSearchParams({ range });

  if (range === "custom") {
    if (from) params.set("from", from);
    if (to) params.set("to", to);
  }

  return `/admin/dashboard/overview?${params.toString()}`;
}

export function useAdminDashboardOverview({
  range,
  from,
  to,
}: {
  range: AdminDashboardDatePreset;
  from?: string;
  to?: string;
}) {
  const [overview, setOverview] = useState<AdminDashboardOverview>(emptyOverview);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const path = useMemo(() => buildOverviewPath({ range, from, to }), [from, range, to]);

  useEffect(() => {
    let active = true;

    const loadOverview = async () => {
      setLoading(true);
      setError("");

      try {
        const payload = await apiRequest<AdminDashboardOverview>(path, { cache: "no-store" });
        if (active) {
          setOverview(payload);
        }
      } catch (requestError) {
        if (active) {
          setError(requestError instanceof Error ? requestError.message : "Could not load dashboard.");
          setOverview(emptyOverview);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void loadOverview();

    return () => {
      active = false;
    };
  }, [path]);

  return { overview, loading, error };
}
