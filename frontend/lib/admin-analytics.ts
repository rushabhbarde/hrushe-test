import type { Product } from "@/lib/catalog";
import type { AdminCustomer } from "@/lib/admin";
import type { OrderRecord } from "@/lib/orders";

type SalesPeriod = "daily" | "weekly" | "monthly";

function startOfWeek(date: Date) {
  const next = new Date(date);
  const day = next.getDay();
  const difference = day === 0 ? -6 : 1 - day;
  next.setDate(next.getDate() + difference);
  next.setHours(0, 0, 0, 0);
  return next;
}

export function buildSalesSeries(orders: OrderRecord[], period: SalesPeriod) {
  const buckets = new Map<string, { label: string; revenue: number; orders: number }>();

  orders.forEach((order) => {
    const orderDate = new Date(order.createdAt);
    let key = "";
    let label = "";

    if (period === "daily") {
      key = orderDate.toISOString().slice(0, 10);
      label = new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short" }).format(orderDate);
    } else if (period === "weekly") {
      const weekStart = startOfWeek(orderDate);
      key = weekStart.toISOString().slice(0, 10);
      label = `Week of ${new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short" }).format(weekStart)}`;
    } else {
      key = `${orderDate.getFullYear()}-${orderDate.getMonth() + 1}`;
      label = new Intl.DateTimeFormat("en-IN", { month: "short", year: "numeric" }).format(orderDate);
    }

    const current = buckets.get(key) || { label, revenue: 0, orders: 0 };
    current.revenue += order.totalAmount;
    current.orders += 1;
    buckets.set(key, current);
  });

  return Array.from(buckets.entries())
    .sort(([left], [right]) => left.localeCompare(right))
    .slice(-8)
    .map(([, value]) => value);
}

export function buildTopSellingProducts(orders: OrderRecord[], products: Product[]) {
  const tally = new Map<
    string,
    { productId: string; name: string; quantity: number; revenue: number; image?: string; category?: string }
  >();
  const productLookup = new Map(products.map((product) => [product.id, product]));

  orders.forEach((order) => {
    order.products.forEach((item) => {
      const current = tally.get(item.productId) || {
        productId: item.productId,
        name: item.name,
        quantity: 0,
        revenue: 0,
        image: item.image,
        category: productLookup.get(item.productId)?.category,
      };
      current.quantity += item.quantity;
      current.revenue += item.price * item.quantity;
      tally.set(item.productId, current);
    });
  });

  return Array.from(tally.values()).sort((left, right) => right.quantity - left.quantity).slice(0, 6);
}

export function buildRecentCustomerActivity(orders: OrderRecord[], customers: AdminCustomer[]) {
  const orderActivity = orders.map((order) => ({
    id: `order-${order.id}`,
    label: `${order.customerName} placed an order`,
    detail: `#${order.orderNumber || order.id.slice(-6)} · Rs. ${Math.round(order.totalAmount).toLocaleString("en-IN")}`,
    date: order.createdAt,
    href: `/admin/orders/${order.id}`,
  }));

  const customerActivity = customers.map((customer) => ({
    id: `customer-${customer.id}`,
    label: `${customer.name} created an account`,
    detail: `${customer.orderCount} orders · ${customer.wishlist.length} wishlist items`,
    date: customer.createdAt,
    href: `/admin/customers/${customer.id}`,
  }));

  return [...orderActivity, ...customerActivity]
    .sort((left, right) => new Date(right.date).getTime() - new Date(left.date).getTime())
    .slice(0, 10);
}

