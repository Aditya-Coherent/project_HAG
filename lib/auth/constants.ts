/** Edge-safe auth constants (no node:crypto import — usable in middleware/proxy). */
export const SESSION_COOKIE = 'db_session'
export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7 // 7 days
