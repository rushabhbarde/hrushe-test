const ADMIN_PERMISSION_CATALOG = Object.freeze([
  "dashboard.view",
  "home.manage",
  "products.view",
  "products.edit",
  "products.delete",
  "orders.view",
  "orders.manage",
  "operations.view",
  "shipping.manage",
  "support.manage",
  "customers.view",
  "customers.manage",
  "coupons.manage",
  "content.manage",
  "media.manage",
  "reviews.manage",
  "reports.view",
  "settings.manage",
  "roles.manage",
]);

const ADMIN_ROLE_DEFINITIONS = Object.freeze([
  {
    id: "super-admin",
    name: "Super Admin",
    description: "Full control over storefront, operations, staff, settings, and reporting.",
    permissions: [...ADMIN_PERMISSION_CATALOG],
  },
  {
    id: "brand-growth-manager",
    name: "Brand & Growth Manager",
    description: "Owns homepage banners, content, media, reviews, coupons, and sales visibility.",
    permissions: [
      "dashboard.view",
      "home.manage",
      "orders.view",
      "coupons.manage",
      "content.manage",
      "media.manage",
      "reviews.manage",
      "reports.view",
    ],
  },
  {
    id: "operations-manager",
    name: "Operations Manager",
    description: "Owns order fulfillment, tracking, shipping, returns, support, and customer context.",
    permissions: [
      "dashboard.view",
      "orders.view",
      "orders.manage",
      "operations.view",
      "shipping.manage",
      "support.manage",
      "customers.view",
      "reports.view",
    ],
  },
  {
    id: "catalog-manager",
    name: "Catalog Manager",
    description: "Owns product catalog, categories, product media, merchandising status, and review visibility.",
    permissions: [
      "dashboard.view",
      "products.view",
      "products.edit",
      "products.delete",
      "media.manage",
      "reviews.manage",
    ],
  },
]);

const DEFAULT_ADMIN_ROLE_ID = "super-admin";
const ADMIN_ROLE_IDS = Object.freeze(ADMIN_ROLE_DEFINITIONS.map((role) => role.id));

function isAdminRoleId(roleId) {
  return ADMIN_ROLE_IDS.includes(String(roleId || "").trim());
}

function normalizeAdminRoleId(roleId) {
  const normalized = String(roleId || "").trim();
  return isAdminRoleId(normalized) ? normalized : "";
}

function getAdminRoleDefinition(roleId) {
  const normalized = normalizeAdminRoleId(roleId);
  return ADMIN_ROLE_DEFINITIONS.find((role) => role.id === normalized) || null;
}

function getAdminRoleForUser(user) {
  if (!user || user.role !== "admin") {
    return null;
  }

  return getAdminRoleDefinition(user.adminRole);
}

function getAdminPermissionsForUser(user) {
  return getAdminRoleForUser(user)?.permissions || [];
}

function hasAdminPermission(user, permission) {
  if (!permission) {
    return Boolean(user && user.role === "admin");
  }

  return getAdminPermissionsForUser(user).includes(permission);
}

module.exports = {
  ADMIN_PERMISSION_CATALOG,
  ADMIN_ROLE_DEFINITIONS,
  ADMIN_ROLE_IDS,
  DEFAULT_ADMIN_ROLE_ID,
  getAdminPermissionsForUser,
  getAdminRoleDefinition,
  getAdminRoleForUser,
  hasAdminPermission,
  isAdminRoleId,
  normalizeAdminRoleId,
};
