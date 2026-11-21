// COPIED from src/native/store/auth.ts (the app's own stand-in for the web's) by scripts/sync-core.mjs.
// Do not edit here: change src/native/store/auth.ts, then run `npm run sync-core`.
// The app's stand-in for the web's store/auth.ts: the shared hooks read
// who's signed in from the app's own store
export { useAuth } from "@/store/auth";
// the web guesses from a cookie before the server answers; the app knows
export const probablySignedIn = () => true;
