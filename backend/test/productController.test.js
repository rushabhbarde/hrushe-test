const test = require("node:test");
const assert = require("node:assert/strict");

const auditLog = require("../src/utils/auditLog");
auditLog.recordAuditLog = async () => {};

const Product = require("../src/models/Product");
const Order = require("../src/models/Order");
const productRoutes = require("../src/routes/productRoutes");
const {
  deleteProduct,
  getProducts,
  restoreProduct,
  permanentlyDeleteProduct,
  __private: { normalizeProductPayload, normalizeProductVariants },
} = require("../src/controllers/productController");

const buildResponse = () => ({
  statusCode: 200,
  body: null,
  headers: {},
  set(key, value) {
    this.headers[key.toLowerCase()] = value;
    return this;
  },
  status(statusCode) {
    this.statusCode = statusCode;
    return this;
  },
  json(body) {
    this.body = body;
    return this;
  },
});

const callController = async (handler, req, res = buildResponse()) => {
  let nextError;
  await handler(req, res, (error) => {
    nextError = error;
  });
  return { res, nextError };
};

const installModelStubs = (t) => {
  const originals = {
    productFindOne: Product.findOne,
    productFind: Product.find,
    productCountDocuments: Product.countDocuments,
    orderExists: Order.exists,
  };

  t.after(() => {
    Product.findOne = originals.productFindOne;
    Product.find = originals.productFind;
    Product.countDocuments = originals.productCountDocuments;
    Order.exists = originals.orderExists;
  });
};

test("admin review moderation route requires CSRF protection", () => {
  const reviewModerationRoute = productRoutes.stack.find(
    (layer) =>
      layer.route?.path === "/:id/reviews/:reviewId" &&
      layer.route?.methods?.put
  );
  const middlewareNames = reviewModerationRoute?.route?.stack.map(
    (layer) => layer.handle.name
  );

  assert.ok(reviewModerationRoute);
  assert.deepEqual(middlewareNames, [
    "protect",
    "requireCsrf",
    "",
    "",
  ]);
});

test("admin product updates preserve existing reserved inventory by SKU", () => {
  const payload = normalizeProductPayload(
    {
      variants: [
        {
          sku: "hru-white-m",
          size: "M",
          color: "White",
          stock: 7,
          reserved: 0,
          active: true,
        },
      ],
    },
    {
      partial: true,
      preserveReserved: true,
      existingVariants: [
        {
          sku: "HRU-WHITE-M",
          size: "M",
          color: "White",
          stock: 4,
          reserved: 2,
          active: true,
        },
      ],
    }
  );

  assert.equal(payload.variants[0].stock, 7);
  assert.equal(payload.variants[0].reserved, 2);
});

test("new product payloads ignore admin supplied reserved stock", () => {
  const variants = normalizeProductVariants([
    {
      sku: "HRU-BLACK-L",
      size: "L",
      color: "Black",
      stock: 5,
      reserved: 3,
    },
  ]);

  assert.equal(variants[0].reserved, 0);
});

test("negative stock and reserved values are rejected", () => {
  assert.throws(
    () => normalizeProductVariants([{ sku: "HRU-NEG-STOCK", stock: -1 }]),
    /stock must be a non-negative whole number/i
  );
  assert.throws(
    () => normalizeProductVariants([{ sku: "HRU-NEG-RESERVED", stock: 1, reserved: -1 }]),
    /reserved stock must be a non-negative whole number/i
  );
});

test("decimal stock values are rejected", () => {
  assert.throws(
    () => normalizeProductVariants([{ sku: "HRU-DECIMAL-STOCK", stock: 1.5 }]),
    /stock must be a non-negative whole number/i
  );
});

test("public product listing responses do not cache price or availability", async (t) => {
  installModelStubs(t);

  Product.find = () => ({
    sort: () => ({
      skip: () => ({
        limit: () => ({
          lean: async () => [],
        }),
      }),
    }),
  });
  Product.countDocuments = async () => 0;

  const { res, nextError } = await callController(getProducts, {
    query: {},
    headers: {},
    socket: {},
  });

  assert.ifError(nextError);
  assert.equal(res.headers["cache-control"], "private, no-store, max-age=0, must-revalidate");
  assert.deepEqual(res.body, []);
});

test("public product listing includes storefront fields updated by admin", async (t) => {
  installModelStubs(t);

  let listingQuery;
  Product.find = (query) => {
    listingQuery = query;
    return {
      sort: () => ({
        skip: () => ({
          limit: () => ({
            lean: async () => [
              {
                _id: { toString: () => "507f1f77bcf86cd799439011" },
                name: "test test test",
                slug: "updated-tee",
                description: "Updated product detail copy",
                price: 1299,
                pricePaise: 129900,
                category: "T-Shirts",
                categories: ["T-Shirts"],
                colors: ["Black"],
                sizes: ["M"],
                images: ["https://example.com/updated.jpg"],
                galleryImages: ["https://example.com/gallery.jpg"],
                videos: [{ id: "fit", title: "Fit", url: "https://example.com/fit.mp4" }],
                status: "Active",
                fitType: "Regular",
                gender: "Unisex",
                collectionLabels: ["Featured"],
                trackInventory: true,
                variants: [{ size: "M", color: "Black", fit: "Regular", stock: 8, reserved: 2, active: true }],
                fabric: "Cotton",
                gsm: "240 GSM",
                washCare: "Cold wash",
                returnEligible: true,
                sizeGuide: [{ size: "M", chest: "40", length: "27", shoulder: "18", sleeve: "8" }],
                featured: true,
                createdAt: new Date("2026-08-20T00:00:00.000Z"),
                updatedAt: new Date("2026-08-20T00:00:00.000Z"),
              },
            ],
          }),
        }),
      }),
    };
  };
  Product.countDocuments = async () => 1;

  const { res, nextError } = await callController(getProducts, {
    query: {},
    headers: {},
    socket: {},
  });

  assert.ifError(nextError);
  const hasNameFilter = (value) => {
    if (!value || typeof value !== "object") {
      return false;
    }
    return Object.prototype.hasOwnProperty.call(value, "name") ||
      Object.values(value).some(hasNameFilter);
  };
  assert.equal(hasNameFilter(listingQuery), false);
  assert.equal(res.body[0].name, "test test test");
  assert.equal(res.body[0].description, "Updated product detail copy");
  assert.deepEqual(res.body[0].categories, ["T-Shirts"]);
  assert.deepEqual(res.body[0].colors, ["Black"]);
  assert.equal(res.body[0].images[0], "https://example.com/updated.jpg");
  assert.equal(res.body[0].galleryImages[0], "https://example.com/gallery.jpg");
  assert.equal(res.body[0].variants[0].stock, 1);
  assert.equal(res.body[0].variants[0].reserved, undefined);
  assert.equal(res.body[0].fabric, "Cotton");
  assert.equal(res.body[0].returnEligible, true);
});

test("variants with active reservations cannot be removed or renamed", () => {
  assert.throws(
    () =>
      normalizeProductPayload(
        {
          variants: [
            {
              sku: "HRU-NEW-SKU",
              size: "M",
              color: "White",
              stock: 5,
            },
          ],
        },
        {
          partial: true,
          preserveReserved: true,
          existingVariants: [
            {
              sku: "HRU-OLD-SKU",
              size: "M",
              color: "White",
              stock: 0,
              reserved: 1,
            },
          ],
        }
      ),
    /active reserved inventory/i
  );
});

test("variants with active reservations cannot be deactivated", () => {
  assert.throws(
    () =>
      normalizeProductPayload(
        {
          variants: [
            {
              sku: "HRU-RESERVED-SKU",
              size: "M",
              color: "White",
              stock: 5,
              active: false,
            },
          ],
        },
        {
          partial: true,
          preserveReserved: true,
          existingVariants: [
            {
              sku: "HRU-RESERVED-SKU",
              size: "M",
              color: "White",
              stock: 0,
              reserved: 1,
              active: true,
            },
          ],
        }
      ),
    /reserved inventory cannot be deactivated/i
  );
});

test("normal admin delete archives products without active reservations", async (t) => {
  installModelStubs(t);

  let saved = false;
  const product = {
    _id: "507f1f77bcf86cd799439011",
    slug: "quiet-tee",
    status: "Active",
    variants: [{ sku: "HRU-QT-M", reserved: 0 }],
    save: async () => {
      saved = true;
    },
  };
  Product.findOne = async () => product;

  const { res, nextError } = await callController(deleteProduct, {
    params: { id: "quiet-tee" },
    user: { _id: "admin", email: "admin@example.com" },
    headers: {},
    socket: {},
  });

  assert.ifError(nextError);
  assert.equal(saved, true);
  assert.equal(product.status, "archived");
  assert.ok(product.archivedAt instanceof Date);
  assert.equal(product.archivedFromStatus, "Active");
  assert.equal(res.body.message, "Product archived successfully");
});

test("products with active reservations cannot be archived", async (t) => {
  installModelStubs(t);

  Product.findOne = async () => ({
    _id: "507f1f77bcf86cd799439011",
    slug: "reserved-tee",
    status: "Active",
    variants: [{ sku: "HRU-RSV-M", reserved: 1 }],
  });

  const { nextError } = await callController(deleteProduct, {
    params: { id: "reserved-tee" },
    user: { _id: "admin", email: "admin@example.com" },
    headers: {},
    socket: {},
  });

  assert.equal(nextError?.statusCode, 409);
  assert.match(nextError?.message, /reserved inventory cannot be archived/i);
});

test("archived products can be restored to their previous status", async (t) => {
  installModelStubs(t);

  let saved = false;
  const product = {
    _id: "507f1f77bcf86cd799439011",
    slug: "restore-tee",
    name: "Restore Tee",
    description: "A tee ready to restore",
    price: 999,
    category: "T-Shirts",
    colors: ["Black"],
    sizes: ["M"],
    trackInventory: true,
    variants: [{ sku: "HRU-RESTORE-M", stock: 1, reserved: 0, active: true }],
    images: ["https://example.com/tee.jpg"],
    fabric: "Cotton",
    gsm: "220",
    washCare: "Cold wash",
    returnEligible: true,
    status: "archived",
    archivedFromStatus: "Active",
    archivedAt: new Date(),
    save: async () => {
      saved = true;
    },
  };
  Product.findOne = async () => product;

  const { res, nextError } = await callController(restoreProduct, {
    params: { id: "restore-tee" },
    user: { _id: "admin", email: "admin@example.com" },
    headers: {},
    socket: {},
  });

  assert.ifError(nextError);
  assert.equal(saved, true);
  assert.equal(product.status, "Active");
  assert.equal(product.archivedAt, null);
  assert.equal(product.archivedFromStatus, "");
  assert.equal(res.body.message, "Product restored successfully");
});

test("permanent product deletion is blocked for order-referenced products", async (t) => {
  installModelStubs(t);

  Product.findOne = async () => ({
    _id: "507f1f77bcf86cd799439011",
    slug: "ordered-tee",
    variants: [],
  });
  Order.exists = async () => ({ _id: "order-id" });

  const { nextError } = await callController(permanentlyDeleteProduct, {
    params: { id: "ordered-tee" },
    query: { confirmation: "DELETE_PERMANENTLY" },
    body: {},
    user: { _id: "admin", email: "admin@example.com" },
    headers: {},
    socket: {},
  });

  assert.equal(nextError?.statusCode, 409);
  assert.match(nextError?.message, /referenced by orders/i);
});
