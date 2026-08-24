const CHECKOUT_ATTEMPT_INDEX = Object.freeze({
  name: "checkout_attempt_active_key_unique",
  key: Object.freeze({ keyHash: 1, active: 1 }),
  unique: true,
  partialFilterExpression: Object.freeze({ active: true }),
});

module.exports = {
  CHECKOUT_ATTEMPT_INDEX,
};
