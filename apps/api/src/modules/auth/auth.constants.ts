export const AUTH_CONSTANTS = {
  BCRYPT_ROUNDS:        12,
  REFRESH_COOKIE_NAME:  'refresh_token',
  // How long a refresh token keeps working after it has been rotated. Covers
  // a new cookie that never reached the browser (the visitor reloaded or
  // navigated while the refresh response was in flight) and two tabs
  // refreshing at once.
  ROTATION_GRACE_MS:    30_000,
} as const;
