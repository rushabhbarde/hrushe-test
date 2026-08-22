const test = require("node:test");
const assert = require("node:assert/strict");

const auditLog = require("../src/utils/auditLog");
auditLog.recordAuditLog = async () => {};

const SiteContent = require("../src/models/SiteContent");
const {
  getAdminWorkspace,
  updateAdminWorkspace,
} = require("../src/controllers/contentController");

const buildResponse = () => ({
  statusCode: 200,
  body: null,
  headers: {},
  set(name, value) {
    this.headers[name] = value;
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

function buildContent(version = 2, adminWorkspace = {}) {
  return {
    _id: "site-content-id",
    homepageBanner: { toObject: () => ({}) },
    adminWorkspace: {
      websiteSettings: {
        brandName: "HRUSHE",
      },
      ...adminWorkspace,
    },
    adminWorkspaceVersion: version,
    save: async () => {},
  };
}

function installSiteContentStubs(t) {
  const originals = {
    findOne: SiteContent.findOne,
    create: SiteContent.create,
    findOneAndUpdate: SiteContent.findOneAndUpdate,
  };

  t.after(() => {
    SiteContent.findOne = originals.findOne;
    SiteContent.create = originals.create;
    SiteContent.findOneAndUpdate = originals.findOneAndUpdate;
  });
}

test("admin workspace responses include the current version", async (t) => {
  installSiteContentStubs(t);
  SiteContent.findOne = async () => buildContent(7);

  const { res, nextError } = await callController(getAdminWorkspace, {
    user: { role: "admin", adminRole: "super-admin" },
  });

  assert.ifError(nextError);
  assert.equal(res.body.version, 7);
  assert.equal(res.body.websiteSettings.brandName, "HRUSHE");
});

test("admin workspace updates require and increment the loaded version", async (t) => {
  installSiteContentStubs(t);

  let updateQuery;
  let updatePayload;
  SiteContent.findOne = async () => buildContent(2);
  SiteContent.findOneAndUpdate = async (query, update) => {
    updateQuery = query;
    updatePayload = update;
    return {
      _id: "site-content-id",
      adminWorkspaceVersion: 3,
      adminWorkspace: update.$set.adminWorkspace,
    };
  };

  const { res, nextError } = await callController(updateAdminWorkspace, {
    user: {
      _id: "admin-id",
      email: "admin@example.com",
      role: "admin",
      adminRole: "super-admin",
    },
    body: {
      version: 2,
      websiteSettings: {
        brandName: "HRUSHE Studio",
      },
    },
    headers: {},
    socket: {},
  });

  assert.ifError(nextError);
  assert.deepEqual(updateQuery, { key: "main", adminWorkspaceVersion: 2 });
  assert.equal(updatePayload.$inc.adminWorkspaceVersion, 1);
  assert.equal(res.body.version, 3);
  assert.equal(res.body.websiteSettings.brandName, "HRUSHE Studio");
});

test("stale admin workspace writes return a conflict response", async (t) => {
  installSiteContentStubs(t);

  SiteContent.findOne = async () => buildContent(5);
  SiteContent.findOneAndUpdate = async () => null;

  const { res, nextError } = await callController(updateAdminWorkspace, {
    user: {
      _id: "admin-id",
      email: "admin@example.com",
      role: "admin",
      adminRole: "super-admin",
    },
    body: {
      version: 4,
      websiteSettings: {
        brandName: "Stale",
      },
    },
    headers: {},
    socket: {},
  });

  assert.ifError(nextError);
  assert.equal(res.statusCode, 409);
  assert.equal(res.body.error, "CONTENT_VERSION_CONFLICT");
  assert.equal(res.body.currentVersion, 5);
});

test("stale product metadata writes merge into the latest workspace", async (t) => {
  installSiteContentStubs(t);

  let attempt = 0;
  const latestWorkspace = {
    productMeta: {
      existing: {
        productId: "existing",
        status: "Active",
        fitType: "Regular",
        gender: "Unisex",
        collectionLabels: [],
        galleryImages: [],
      },
    },
  };
  SiteContent.findOne = async () => buildContent(5, latestWorkspace);
  SiteContent.findOneAndUpdate = async (query, update) => {
    attempt += 1;
    assert.equal(query.key, "main");
    if (attempt === 1) {
      assert.equal(query.adminWorkspaceVersion, 4);
      return null;
    }

    assert.equal(query.adminWorkspaceVersion, 5);
    return {
      _id: "site-content-id",
      adminWorkspaceVersion: 6,
      adminWorkspace: update.$set.adminWorkspace,
    };
  };

  const { res, nextError } = await callController(updateAdminWorkspace, {
    user: {
      _id: "admin-id",
      email: "admin@example.com",
      role: "admin",
      adminRole: "super-admin",
    },
    body: {
      version: 4,
      productMeta: {
        created: {
          productId: "created",
          status: "Active",
          fitType: "Regular",
          gender: "Unisex",
          collectionLabels: [],
          galleryImages: [],
        },
      },
    },
    headers: {},
    socket: {},
  });

  assert.ifError(nextError);
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.version, 6);
  assert.equal(res.body.productMeta.existing.status, "Active");
  assert.equal(res.body.productMeta.created.status, "Active");
});

test("homepage publish blocks visible sections with missing media", async (t) => {
  installSiteContentStubs(t);
  SiteContent.findOne = async () => buildContent(2);
  SiteContent.findOneAndUpdate = async () => {
    throw new Error("publish should not reach persistence");
  };

  const { nextError } = await callController(updateAdminWorkspace, {
    user: {
      _id: "admin-id",
      email: "admin@example.com",
      role: "admin",
      adminRole: "super-admin",
    },
    body: {
      version: 2,
      homeManagement: {
        lastPublishedAt: new Date().toISOString(),
        sections: [
          {
            id: "women-hero",
            audience: "women",
            sectionType: "audience-hero",
            label: "Women hero",
            title: "Women",
            image: "",
            isVisible: true,
            cards: [],
          },
        ],
      },
    },
    headers: {},
    socket: {},
  });

  assert.match(nextError?.message, /uploaded media before publishing/i);
});

test("homepage publish rejects missing legacy banner defaults", async (t) => {
  installSiteContentStubs(t);
  SiteContent.findOne = async () => buildContent(2);
  SiteContent.findOneAndUpdate = async () => {
    throw new Error("publish should not reach persistence");
  };

  const { nextError } = await callController(updateAdminWorkspace, {
    user: {
      _id: "admin-id",
      email: "admin@example.com",
      role: "admin",
      adminRole: "super-admin",
    },
    body: {
      version: 2,
      homeManagement: {
        lastPublishedAt: new Date().toISOString(),
        sections: [
          {
            id: "women-hero",
            audience: "women",
            sectionType: "audience-hero",
            label: "Women hero",
            title: "Women",
            image: "/uploads/banners/banner2.png",
            isVisible: true,
            cards: [],
          },
        ],
      },
    },
    headers: {},
    socket: {},
  });

  assert.match(nextError?.message, /missing default banner paths/i);
});

test("homepage draft can keep incomplete media while hidden from publish", async (t) => {
  installSiteContentStubs(t);

  SiteContent.findOne = async () => buildContent(2);
  SiteContent.findOneAndUpdate = async (query, update) => ({
    _id: "site-content-id",
    adminWorkspaceVersion: 3,
    adminWorkspace: update.$set.adminWorkspace,
  });

  const { res, nextError } = await callController(updateAdminWorkspace, {
    user: {
      _id: "admin-id",
      email: "admin@example.com",
      role: "admin",
      adminRole: "super-admin",
    },
    body: {
      version: 2,
      homeManagement: {
        sections: [
          {
            id: "draft-hero",
            audience: "women",
            sectionType: "audience-hero",
            label: "Draft hero",
            title: "Draft",
            image: "",
            isVisible: true,
            cards: [],
          },
        ],
      },
    },
    headers: {},
    socket: {},
  });

  assert.ifError(nextError);
  assert.equal(res.body.version, 3);
});
