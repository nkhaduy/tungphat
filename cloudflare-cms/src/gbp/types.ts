export type GbpEnv = {
  DB: D1Database;
  CMS_ALLOWED_ORIGINS: string;
  CMS_SESSION_SECRET: string;
  CORS_ALLOWED_ORIGINS?: string;
  GBP_GOOGLE_PROJECT_ID: string;
  GBP_GOOGLE_CLIENT_ID?: string;
  GBP_GOOGLE_CLIENT_SECRET?: string;
  GBP_GOOGLE_REDIRECT_URI?: string;
  GBP_TOKEN_ENCRYPTION_KEY?: string;
};

export type GbpTokenResponse = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  scope?: string;
  error?: string;
};
