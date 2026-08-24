import { expect, test, type Page } from "@playwright/test";

const product = {
  id: "64f1f77bcf86cd799439011",
  name: "Quiet Tee",
  displayName: "Quiet Tee",
  slug: "quiet-tee",
  description: "A quiet everyday tee.",
  price: 1299,
  category: "T-Shirts",
  categories: ["T-Shirts"],
  colors: ["Black"],
  colour: "Black",
  sizes: ["M"],
  imageLabel: "Quiet Tee",
  accent: "#111111",
  featured: true,
  newIn: true,
  gender: "Women",
  images: ["/HRUSHELOGO.png"],
  galleryImages: ["/HRUSHESYLOGO.png"],
  availability: "available",
  status: "Active",
  trackInventory: true,
  variants: [
    {
      sku: "QUIET-TEE-BLK-M",
      size: "M",
      color: "Black",
      stock: 4,
      active: true,
    },
  ],
};

async function mockStorefrontApi(
  page: Page,
  {
    onCheckoutCreate,
    enableCustomerLogin = false,
    enableAdminLogin = false,
  }: {
    onCheckoutCreate?: () => void;
    enableCustomerLogin?: boolean;
    enableAdminLogin?: boolean;
  } = {}
) {
  let customerLoggedIn = false;
  let adminLoggedIn = false;

  await page.route(/\/api\/backend(?:\/|$)/, (route) => {
    const { pathname } = new URL(route.request().url());
    const normalizedPath = pathname.replace(/\/+$/, "");

    if (normalizedPath === "/api/backend/products") {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([product]),
      });
    }

    if (normalizedPath.startsWith("/api/backend/products/")) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(product),
      });
    }

    if (normalizedPath === "/api/backend/content/homepage") {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          announcementText: "DISPATCHES IN 1-3 BUSINESS DAYS",
          eyebrow: "Elevated Everyday",
          title: "Defined Quietly",
          description: "Everyday uniforms with clear proportions.",
          primaryCtaLabel: "Shop Collection",
          primaryCtaHref: "/shop",
          secondaryCtaLabel: "Read the Story",
          secondaryCtaHref: "/story",
          imageUrl: "",
          mediaType: "image",
          mediaUrl: "",
          posterImage: "",
        }),
      });
    }

    if (normalizedPath === "/api/backend/content/homepage-management") {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          sections: [],
          lastPublishedAt: null,
          hasCustomSections: false,
        }),
      });
    }

    if (normalizedPath === "/api/backend/auth/me") {
      if (adminLoggedIn) {
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            user: {
              role: "admin",
              adminRole: "super-admin",
              adminPermissions: ["dashboard.view"],
              name: "Admin",
              email: "admin@example.com",
            },
          }),
        });
      }

      if (customerLoggedIn) {
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            user: {
              id: "customer-1",
              role: "customer",
              name: "Aarav Mehta",
              email: "customer@example.com",
              phone: "9876543210",
              addresses: [],
            },
          }),
        });
      }

      return route.fulfill({
        status: 401,
        contentType: "application/json",
        body: JSON.stringify({ message: "Not signed in" }),
      });
    }

    if (normalizedPath === "/api/backend/auth/login" && enableCustomerLogin) {
      customerLoggedIn = true;
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          user: {
            id: "customer-1",
            role: "customer",
            name: "Aarav Mehta",
            email: "customer@example.com",
            phone: "9876543210",
            addresses: [],
          },
        }),
      });
    }

    if (normalizedPath === "/api/backend/auth/admin-login" && enableAdminLogin) {
      adminLoggedIn = true;
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          user: {
            role: "admin",
            adminRole: "super-admin",
            adminPermissions: ["dashboard.view"],
            name: "Admin",
            email: "admin@example.com",
          },
        }),
      });
    }

    if (normalizedPath === "/api/backend/order/checkout") {
      onCheckoutCreate?.();
      return route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ message: "Checkout should not be created before Razorpay is ready." }),
      });
    }

    return route.fulfill({
      status: 404,
      contentType: "application/json",
      body: JSON.stringify({ message: `No e2e mock for ${normalizedPath}` }),
    });
  });
}

function collectRuntimeErrors(page: Page) {
  const messages: string[] = [];

  page.on("console", (message) => {
    if (message.type() === "error") {
      messages.push(message.text());
    }
  });
  page.on("pageerror", (error) => {
    messages.push(error.message);
  });

  return messages;
}

async function dismissCookieBanner(page: Page) {
  const rejectOptional = page.getByRole("button", { name: /reject optional/i });

  if (await rejectOptional.isVisible().catch(() => false)) {
    await rejectOptional.click();
  }
}

test.describe("pre-launch storefront smoke", () => {
  test("homepage loads without broken customer-facing images", async ({ page }) => {
    await mockStorefrontApi(page);

    await page.goto("/");
    await expect(page.getByRole("heading", { name: /women and men collections/i })).toBeAttached();

    const brokenImages = await page.locator("img").evaluateAll((images) => {
      const imageElements = images as HTMLImageElement[];

      return imageElements
        .filter((image) => image.complete && image.naturalWidth === 0)
        .map((image) => image.getAttribute("src") || "");
    });
    expect(brokenImages).toEqual([]);
  });

  test("customer can enter a collection and see product cards", async ({ page }) => {
    const runtimeErrors = collectRuntimeErrors(page);
    await mockStorefrontApi(page);

    await page.goto("/collection/women");
    const productLink = page.getByRole("link", { name: /view quiet tee/i }).first();
    await expect(productLink).toBeVisible();
    await productLink.click();
    await expect(page.getByText("Quiet Tee").first()).toBeVisible();
    expect(runtimeErrors.filter((message) => /hydration failed|uncaught error/i.test(message))).toEqual([]);
  });

  test("checkout blocks Razorpay launch before provider script readiness", async ({ page }) => {
    let checkoutCreateCalls = 0;
    await mockStorefrontApi(page, {
      onCheckoutCreate: () => {
        checkoutCreateCalls += 1;
      },
    });
    await page.route("https://checkout.razorpay.com/v1/checkout.js", (route) => route.abort());

    await page.addInitScript((cartLine) => {
      window.localStorage.setItem("hrushetest-cart-guest", JSON.stringify([cartLine]));
    }, {
      productId: product.id,
      name: product.name,
      price: product.price,
      size: "M",
      color: "Black",
      quantity: 1,
      accent: product.accent,
      image: product.images[0],
    });

    await page.goto("/checkout");
    await page.getByLabel("Email").fill("customer@example.com");
    await page.getByLabel("Phone").fill("+91 98765 43210");
    await page.getByLabel("Full name").fill("Aarav Mehta");
    await page.getByLabel("Address", { exact: true }).fill("12 Studio House");
    await page.getByLabel("Area / locality").fill("Bandra West");
    await page.getByLabel("City").fill("Mumbai");
    await page.getByLabel("State / region").fill("Maharashtra");
    await page.getByLabel("Postal code").fill("400050");
    await page.getByLabel(/I agree/).check();
    await page.getByRole("button", { name: /pay securely/i }).click();

    await expect(page.getByRole("main").getByRole("alert")).toContainText(/payment checkout/i);
    expect(checkoutCreateCalls).toBe(0);
  });

  test("login, account, tracking, and admin protection pages load", async ({ page }) => {
    await mockStorefrontApi(page);

    await page.goto("/login");
    await expect(page.getByRole("heading", { name: /login to hrushe|sign in/i }).first()).toBeVisible();
    await page.goto("/account");
    await expect(page).toHaveURL(/\/account/);
    await page.goto("/track-order");
    await expect(page.getByRole("heading", { name: /follow every delivery step/i })).toBeVisible();
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/login|\/admin/);
  });

  test("customer login sanitizes malicious and valid next redirects", async ({ page }) => {
    await mockStorefrontApi(page, { enableCustomerLogin: true });

    await page.goto("/login?next=%2F%2Fevil.example");
    await dismissCookieBanner(page);
    await page.getByLabel("Your email address").fill("customer@example.com");
    await page.getByLabel("Enter your password").fill("pass1234");
    await page.getByRole("button", { name: /^sign in$/i }).click();
    await expect(page).toHaveURL(/\/account\?section=orders$/);

    await page.goto("/login?next=/shop");
    await dismissCookieBanner(page);
    await page.getByLabel("Your email address").fill("customer@example.com");
    await page.getByLabel("Enter your password").fill("pass1234");
    await page.getByRole("button", { name: /^sign in$/i }).click();
    await expect(page).toHaveURL(/\/shop$/);
  });

  test("admin login restricts next redirects to admin routes", async ({ page }) => {
    await mockStorefrontApi(page, { enableAdminLogin: true });

    await page.goto("/admin/login?next=/shop");
    await page.getByPlaceholder("Admin email").fill("admin@example.com");
    await page.getByPlaceholder("Password").fill("pass1234");
    await page.getByRole("button", { name: /^login$/i }).click();
    await expect(page).toHaveURL(/\/admin$/);

    await page.goto("/admin/login?next=/admin/orders");
    await page.getByPlaceholder("Admin email").fill("admin@example.com");
    await page.getByPlaceholder("Password").fill("pass1234");
    await page.getByRole("button", { name: /^login$/i }).click();
    await expect(page).toHaveURL(/\/admin\/orders$/);
  });
});
