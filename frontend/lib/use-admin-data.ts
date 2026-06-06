"use client";

import { useEffect, useState } from "react";
import { useAdminAuth } from "@/components/admin-auth-provider";
import { getAdminAuthHeaders } from "@/lib/admin-auth";
import { type AdminCustomer } from "@/lib/admin";
import { apiRequest } from "@/lib/api";
import { type OrderRecord } from "@/lib/orders";

type AdminDataCache = {
  orders: OrderRecord[];
  customers: AdminCustomer[];
  timestamp: number;
  cacheKey: string;
};

const ADMIN_DATA_CACHE_TTL = 45_000;

let adminDataCache: AdminDataCache | null = null;
let adminDataRequest: Promise<AdminDataCache> | null = null;

function buildCacheKey(canViewOrders: boolean, canViewCustomers: boolean) {
  return `${canViewOrders ? "orders" : "no-orders"}:${canViewCustomers ? "customers" : "no-customers"}`;
}

function isCacheFresh(cacheKey: string) {
  return (
    adminDataCache &&
    adminDataCache.cacheKey === cacheKey &&
    Date.now() - adminDataCache.timestamp < ADMIN_DATA_CACHE_TTL
  );
}

async function fetchAdminData(canViewOrders: boolean, canViewCustomers: boolean) {
  const cacheKey = buildCacheKey(canViewOrders, canViewCustomers);

  if (isCacheFresh(cacheKey)) {
    return adminDataCache as AdminDataCache;
  }

  if (!adminDataRequest) {
    adminDataRequest = Promise.all([
      canViewOrders
        ? apiRequest<OrderRecord[]>("/order/all", {
            headers: getAdminAuthHeaders(),
            cache: "no-store",
          })
        : Promise.resolve([]),
      canViewCustomers
        ? apiRequest<AdminCustomer[]>("/admin/customers", {
            headers: getAdminAuthHeaders(),
            cache: "no-store",
          })
        : Promise.resolve([]),
    ])
      .then(([orders, customers]) => {
        adminDataCache = {
          orders,
          customers,
          timestamp: Date.now(),
          cacheKey,
        };

        return adminDataCache;
      })
      .finally(() => {
        adminDataRequest = null;
      });
  }

  return adminDataRequest;
}

export function useAdminData() {
  const { hasPermission } = useAdminAuth();
  const canViewOrders = hasPermission("orders.view");
  const canViewCustomers = hasPermission("customers.view");
  const cacheKey = buildCacheKey(canViewOrders, canViewCustomers);
  const [orders, setOrders] = useState<OrderRecord[]>(adminDataCache?.orders || []);
  const [customers, setCustomers] = useState<AdminCustomer[]>(adminDataCache?.customers || []);
  const [loading, setLoading] = useState(!isCacheFresh(cacheKey));

  useEffect(() => {
    let active = true;

    void fetchAdminData(canViewOrders, canViewCustomers)
      .then((payload) => {
        if (!active) {
          return;
        }

        setOrders(payload.orders);
        setCustomers(payload.customers);
      })
      .catch(() => {
        if (!active) {
          return;
        }

        setOrders([]);
        setCustomers([]);
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [canViewCustomers, canViewOrders]);

  function updateOrders(nextOrders: OrderRecord[]) {
    setOrders(nextOrders);
    adminDataCache = {
      orders: nextOrders,
      customers,
      timestamp: Date.now(),
      cacheKey,
    };
  }

  function updateCustomers(nextCustomers: AdminCustomer[]) {
    setCustomers(nextCustomers);
    adminDataCache = {
      orders,
      customers: nextCustomers,
      timestamp: Date.now(),
      cacheKey,
    };
  }

  async function refresh() {
    adminDataCache = null;
    const payload = await fetchAdminData(canViewOrders, canViewCustomers);
    setOrders(payload.orders);
    setCustomers(payload.customers);
    return payload;
  }

  return {
    orders,
    customers,
    loading,
    updateOrders,
    updateCustomers,
    refresh,
  };
}
