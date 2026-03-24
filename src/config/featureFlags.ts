/**
 * Feature flags configuration.
 * Extracted to a separate module so it can be mocked in tests.
 */

// Use action-based API instead of full state sync
export const USE_ACTION_API =
  typeof import.meta !== 'undefined' && import.meta.env?.VITE_USE_ACTION_API === 'true';
