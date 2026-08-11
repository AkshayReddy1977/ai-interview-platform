/**
 * The access token is kept in memory only — never in localStorage or
 * sessionStorage, which are readable by any injected script (XSS risk).
 * On a full page reload, it's gone; App bootstraps a fresh one by calling
 * POST /api/auth/refresh, which relies on the httpOnly refresh cookie the
 * browser already holds.
 */
let accessToken: string | null = null;

export const tokenManager = {
  get: (): string | null => accessToken,
  set: (token: string | null): void => {
    accessToken = token;
  },
  clear: (): void => {
    accessToken = null;
  },
};
