// Global Vitest setup. These values are test-only and are never used by a
// development or production process. They allow route modules to retain their
// fail-fast production security checks while integration tests boot in a fully
// isolated process.
process.env.NODE_ENV = "test";
process.env.VITEST = "true";
process.env.USE_IN_MEMORY_DB = "true";
process.env.JWT_SECRET = "adaptly-vitest-only-jwt-secret-at-least-32-chars";
