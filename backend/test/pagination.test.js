const test = require("node:test");
const assert = require("node:assert/strict");

const {
  buildPaginationMeta,
  parsePaginationQuery,
  sendListResponse,
} = require("../src/utils/pagination");

const buildResponse = () => ({
  headers: {},
  body: null,
  set(name, value) {
    this.headers[name] = value;
    return this;
  },
  json(body) {
    this.body = body;
    return this;
  },
});

test("pagination parser applies defaults and caps maximum limits", () => {
  assert.deepEqual(parsePaginationQuery({}, { defaultLimit: 25, maxLimit: 50 }), {
    page: 1,
    limit: 25,
    skip: 0,
  });
  assert.deepEqual(parsePaginationQuery({ page: "3", limit: "999" }, { maxLimit: 100 }), {
    page: 3,
    limit: 100,
    skip: 200,
  });
});

test("pagination parser falls back for invalid page and limit values", () => {
  assert.deepEqual(parsePaginationQuery({ page: "-1", limit: "abc" }, { defaultLimit: 20 }), {
    page: 1,
    limit: 20,
    skip: 0,
  });
});

test("pagination metadata handles empty pages", () => {
  assert.deepEqual(buildPaginationMeta({ page: 3, limit: 20, total: 0 }), {
    page: 3,
    limit: 20,
    totalItems: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: true,
  });
});

test("list responses preserve legacy arrays unless pagination is requested", () => {
  const legacyResponse = buildResponse();
  const data = [{ id: 1 }];
  const pagination = buildPaginationMeta({ page: 1, limit: 20, total: 1 });

  sendListResponse(legacyResponse, {}, data, pagination);

  assert.deepEqual(legacyResponse.body, data);
  assert.equal(legacyResponse.headers["X-Pagination-Total-Items"], "1");

  const paginatedResponse = buildResponse();
  sendListResponse(paginatedResponse, { paginated: "true" }, data, pagination);

  assert.deepEqual(paginatedResponse.body, { data, pagination });
});
