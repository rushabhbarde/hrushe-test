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

type PaginatedResponse<T> = {
  data: T[];
  pagination: {
    page: number;
    hasNextPage: boolean;
  };
};

const ADMIN_DATA_CACHE_TTL = 45_000;
const ADMIN_DATA_PAGE_LIMIT = 100;
const ADMIN_DATA_MAX_PAGES = 50;

let adminDataCache: AdminDataCache | null = null;
let adminDataRequest: { cacheKey: string; promise: Promise<AdminDataCache> } | null = null;

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

function appendQuery(path: string, params: URLSearchParams) {
  return `${path}${path.includes("?") ? "&" : "?"}${params.toString()}`;
}

function isPaginatedResponse<T>(payload: T[] | PaginatedResponse<T>): payload is PaginatedResponse<T> {
  return (
    Boolean(payload) &&
    !Array.isArray(payload) &&
    Array.isArray((payload as PaginatedResponse<T>).data)
  );
}

async function fetchAllAdminPages<T>(path: string) {
  const rows: T[] = [];
  let page = 1;
  let hasNextPage = true;

  while (hasNextPage && page <= ADMIN_DATA_MAX_PAGES) {
    const params = new URLSearchParams({
      paginated: "true",
      limit: String(ADMIN_DATA_PAGE_LIMIT),
      page: String(page),
    });
    const payload = await apiRequest<T[] | PaginatedResponse<T>>(appendQuery(path, params), {
      headers: getAdminAuthHeaders(),
      cache: "no-store",
    });

    if (!isPaginatedResponse(payload)) {
      return payload;
    }

    rows.push(...payload.data);
    hasNextPage = payload.pagination.hasNextPage;
    page = payload.pagination.page + 1;
  }

  return rows;
}

async function fetchAdminData(canViewOrders: boolean, canViewCustomers: boolean) {
  const cacheKey = buildCacheKey(canViewOrders, canViewCustomers);

  if (isCacheFresh(cacheKey)) {
    return adminDataCache as AdminDataCache;
  }

  if (!adminDataRequest || adminDataRequest.cacheKey !== cacheKey) {
    adminDataRequest = {
      cacheKey,
      promise: Promise.all([
        canViewOrders
          ? fetchAllAdminPages<OrderRecord>("/order/all")
          : Promise.resolve([]),
        canViewCustomers
          ? fetchAllAdminPages<AdminCustomer>("/admin/customers")
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
          if (adminDataRequest?.cacheKey === cacheKey) {
            adminDataRequest = null;
          }
        }),
    };
  }

  return adminDataRequest.promise;
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
