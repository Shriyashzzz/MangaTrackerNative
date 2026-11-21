// COPIED from inventoryApp/client/src/lib/passwordRule.ts by scripts/sync-core.mjs.
// Do not edit here: change the web app, then run `npm run sync-core`.
// The server's rule for a new password's length (authController.ts), for the
// forms that check it before sending: sign-up and the password reset. A
// server test fails if the two differ (tests/site/passwordRule.test.ts)
export const NEW_PASSWORD_MIN = 8;
