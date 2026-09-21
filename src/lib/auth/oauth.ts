/**
 * Future SSO adapters.
 * Google and Microsoft are not enabled until client IDs/secrets are configured.
 */
export function ssoProviders() {
  return {
    google: Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
    microsoft: Boolean(process.env.MICROSOFT_CLIENT_ID && process.env.MICROSOFT_CLIENT_SECRET),
  };
}
