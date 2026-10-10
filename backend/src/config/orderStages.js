/**
 * The journey of a made-to-order piece. `status` is the value stored on the order and shown
 * to the team in Atelier; `word` and `line` are what the customer reads on the tracking page
 * and in emails. The frontend keeps the same words in frontend/lib/orders.ts.
 */
const ORDER_STAGES = [
  { status: "Pending", key: "placed", word: "Placed", line: "We have your order and are waiting for the payment to confirm." },
  {
    status: "Confirmed",
    key: "received",
    word: "Received",
    line: "Your order is with the atelier. Each piece is made to order, so stitching starts next.",
    email: true,
  },
  { status: "Stitching", key: "on-the-table", word: "On the table", line: "Your piece is being cut and stitched." },
  {
    status: "Quality check",
    key: "inspected",
    word: "Inspected",
    line: "Your piece has been checked by hand: seams, measurements and finish.",
  },
  { status: "Packed", key: "wrapped", word: "Wrapped", line: "Your order is wrapped and waiting for the courier.", email: true },
  {
    status: "Shipped",
    key: "on-its-way",
    word: "On its way",
    line: "Your order has left the atelier. Use the tracking details below to follow it.",
    email: true,
  },
  {
    status: "Out for delivery",
    key: "nearly-home",
    word: "Nearly home",
    line: "Your order is with the courier and should reach you today.",
  },
  {
    status: "Delivered",
    key: "home",
    word: "Home",
    line: "Your order has arrived. If the size is not right, one size exchange is free, and returns are open for 7 days.",
    email: true,
  },
];

const CLOSED_STAGES = [
  {
    status: "Cancelled",
    key: "cancelled",
    word: "Cancelled",
    line: "Your order has been cancelled. Any payment made is refunded to the original payment method.",
    email: true,
  },
  {
    status: "Returned",
    key: "returned",
    word: "Returned",
    line: "We have received your return. An approved refund goes to the original payment method.",
    email: true,
  },
];

const ALL_STAGES = [...ORDER_STAGES, ...CLOSED_STAGES];
const stageByStatus = new Map(ALL_STAGES.map((stage) => [stage.status, stage]));

/** Statuses in the order a piece moves through them (excludes Cancelled / Returned). */
const FULFILLMENT_STATUSES = ORDER_STAGES.map((stage) => stage.status);
const ALL_ORDER_STATUSES = ALL_STAGES.map((stage) => stage.status);
/** Stages that only happen once the order is paid. */
const PAID_STATUSES = FULFILLMENT_STATUSES.filter((status) => status !== "Pending");
/** Paid and still in the atelier: not yet handed to the courier. */
const IN_ATELIER_STATUSES = ["Confirmed", "Stitching", "Quality check", "Packed"];

const getOrderStage = (status) => stageByStatus.get(status) || null;
/** Customers hear about four moments, plus a cancellation or return, not every step. */
const shouldEmailOrderStage = (status) => Boolean(getOrderStage(status)?.email);

module.exports = {
  ALL_ORDER_STATUSES,
  FULFILLMENT_STATUSES,
  IN_ATELIER_STATUSES,
  ORDER_STAGES,
  PAID_STATUSES,
  getOrderStage,
  shouldEmailOrderStage,
};
