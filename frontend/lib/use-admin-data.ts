"use client";

import { useEffect, useState } from "react";
import { getAdminAuthHeaders } from "@/lib/admin-auth";
import { type AdminCustomer } from "@/lib/admin";
import { apiRequest } from "@/lib/api";
import { type OrderRecord } from "@/lib/orders";

type AdminDataCache = {
  orders: OrderRecord[];
  customers: AdminCustomer[];
  timestamp: number;
};

const ADMIN_DATA_CACHE_TTL = 45_000;

let adminDataCache: AdminDataCache | null = null;
let adminDataRequest: Promise<AdminDataCache> | null = null;

function isCacheFresh() {
  return adminDataCache && Date.now() - adminDataCache.timestamp < ADMIN_DATA_CACHE_TTL;
}

async function fetchAdminData() {
  if (isCacheFresh()) {
    return adminDataCache as AdminDataCache;
  }

  if (!adminDataRequest) {
    adminDataRequest = Promise.all([
      apiRequest<OrderRecord[]>("/order/all", {
        headers: getAdminAuthHeaders(),
        cache: "no-store",
      }),
      apiRequest<AdminCustomer[]>("/admin/customers", {
        headers: getAdminAuthHeaders(),
        cache: "no-store",
      }),
    ])
      .then(([orders, customers]) => {
        adminDataCache = {
          orders,
          customers,
          timestamp: Date.now(),
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
  const [orders, setOrders] = useState<OrderRecord[]>(adminDataCache?.orders || []);
  const [customers, setCustomers] = useState<AdminCustomer[]>(adminDataCache?.customers || []);
  const [loading, setLoading] = useState(!adminDataCache);

  useEffect(() => {
    let active = true;

    void fetchAdminData()
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
  }, []);

  function updateOrders(nextOrders: OrderRecord[]) {
    setOrders(nextOrders);
    adminDataCache = {
      orders: nextOrders,
      customers,
      timestamp: Date.now(),
    };
  }

  function updateCustomers(nextCustomers: AdminCustomer[]) {
    setCustomers(nextCustomers);
    adminDataCache = {
      orders,
      customers: nextCustomers,
      timestamp: Date.now(),
    };
  }

  async function refresh() {
    adminDataCache = null;
    const payload = await fetchAdminData();
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

