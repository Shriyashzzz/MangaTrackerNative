// COPIED from src/native/lib/country.ts (the app's own stand-in for the web's) by scripts/sync-core.mjs.
// Do not edit here: change src/native/lib/country.ts, then run `npm run sync-core`.
// The app's stand-in for the web's lib/country.ts: whether prices are
// Canadian. Set from the account's settings once they load (setCountry);
// US until then
let canada = false;
export const setCountry = (country: "us" | "ca") => {
  canada = country === "ca";
};
export const inCanada = () => canada;

// an API address, asking for Canadian prices when that's where they shop
export const withCountry = (path: string) =>
  canada ? `${path}${path.includes("?") ? "&" : "?"}country=ca` : path;

// a big amount in whole dollars: "$1,560", "CA$1,560"
export const wholeMoney = (cents: number) =>
  `${canada ? "CA$" : "$"}${Math.round(cents / 100).toLocaleString("en-US")}`;
