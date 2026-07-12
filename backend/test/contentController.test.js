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

function buildContent(version = 2) {
  return {
    _id: "site-content-id",
    homepageBanner: { toObject: () => ({}) },
    adminWorkspace: {
      websiteSettings: {
        brandName: "HRUSHE",
      },
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
