const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;

function parsePositiveInteger(value, fallback) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function parsePaginationQuery(query = {}, options = {}) {
  const maxLimit = parsePositiveInteger(options.maxLimit, MAX_LIMIT);
  const defaultLimit = Math.min(
    parsePositiveInteger(options.defaultLimit, DEFAULT_LIMIT),
    maxLimit
  );
  const page = parsePositiveInteger(query.page, DEFAULT_PAGE);
  const limit = Math.min(parsePositiveInteger(query.limit, defaultLimit), maxLimit);

  return {
    page,
    limit,
    skip: (page - 1) * limit,
  };
}

function wantsPaginatedResponse(query = {}) {
  return (
    query.paginated === "true" ||
    query.page !== undefined ||
    query.limit !== undefined
  );
}

function buildPaginationMeta({ page, limit, total }) {
  const totalItems = Math.max(0, Number(total) || 0);
  const totalPages = totalItems === 0 ? 0 : Math.ceil(totalItems / limit);

  return {
    page,
    limit,
    totalItems,
    totalPages,
    hasNextPage: page * limit < totalItems,
    hasPreviousPage: page > 1,
  };
}

function setPaginationHeaders(res, pagination) {
  res.set("X-Pagination-Page", String(pagination.page));
  res.set("X-Pagination-Limit", String(pagination.limit));
  res.set("X-Pagination-Total-Items", String(pagination.totalItems));
  res.set("X-Pagination-Total-Pages", String(pagination.totalPages));
}

function sendListResponse(res, query, data, pagination) {
  setPaginationHeaders(res, pagination);

  if (wantsPaginatedResponse(query)) {
    return res.json({ data, pagination });
  }

  return res.json(data);
}

module.exports = {
  buildPaginationMeta,
  parsePaginationQuery,
  sendListResponse,
  setPaginationHeaders,
  wantsPaginatedResponse,
};
