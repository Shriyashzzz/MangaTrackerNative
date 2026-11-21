// What the web's code uses from the browser's Intl that Hermes (React
// Native's JavaScript engine) doesn't have: "checked 2 days ago"
// (Intl.RelativeTimeFormat, in core lib/prices.ts) and the plural rules it
// needs. Loaded first, before any of the copied code runs (app/_layout.tsx).
// Each one only fills in what's missing
import "@formatjs/intl-getcanonicallocales/polyfill.js";
import "@formatjs/intl-locale/polyfill.js";
import "@formatjs/intl-pluralrules/polyfill.js";
import "@formatjs/intl-pluralrules/locale-data/en.js";
import "@formatjs/intl-relativetimeformat/polyfill.js";
import "@formatjs/intl-relativetimeformat/locale-data/en.js";
