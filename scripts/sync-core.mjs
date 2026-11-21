// Copies the web app's pure logic into src/core, so both apps follow the same
// rules (the shelf maths, editions, Buy next, To get...). The web app is the
// source: never edit a copy here; change it there and run `npm run sync-core`.
// Each entry's imports are followed, so a copied file never misses one, and a
// file that needs a browser (window, document, storage) is refused: a native
// stand-in replaces it, at the same path under src/native (the API client,
// offline handling...). Each stand-in must export every name the copied files
// import from it; a missing one is said here, not found as a crash.
//   node scripts/sync-core.mjs            copy
//   node scripts/sync-core.mjs --check    only list what would be copied
import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "..");
const WEB = resolve(ROOT, "../inventoryApp/client/src");
const OUT = join(ROOT, "src/core");
const NATIVE = join(ROOT, "src/native");

// web files that use the browser in a part the app never calls: copied as
// they are. lib/shelf.ts: openReleasesOnShelf (sessionStorage), web only;
// lib/volumeShelf.ts: pageScale (the page's font size), web only;
// pages/Home/shelfViews.ts: its session storage is inside try, so the app
// just gets the default
const BROWSER_OK = new Set([
  "lib/shelf.ts",
  "lib/volumeShelf.ts",
  "pages/Home/shelfViews.ts",
]);

// what the native screens use; everything they import comes along
const ENTRIES = [
  "lib/types.ts",
  "lib/ownedVolumes.ts",
  "lib/reading.ts",
  "lib/editions.ts",
  "lib/editionShelf.ts",
  "lib/chapterVolumes.ts",
  "lib/ownedBar.ts",
  "lib/toGetLines.ts",
  "components/mangaCard/cardText.ts",
  // the series page (phase 2): the strip's maths, release days, prices
  "lib/volumeShelf.ts",
  "lib/releaseDate.ts",
  "lib/prices.ts",
  "lib/editionNews.ts",
  "lib/volumeRuns.ts",
  "lib/coverSizes.ts",
  // the series page's own hooks: plain React, the same in the app
  "pages/Details/useEditions.ts",
  "pages/Details/useBuyOptions.ts",
  "pages/Details/releaseNews.ts",
  "pages/Details/useOwnedVolumes.ts",
  // the New tab (phase 3): who's in which pile, what each card says and links to
  "pages/Home/piles.ts",
  "pages/Home/newTabLinks.ts",
  "pages/Home/farBehind.ts",
  // prices (phase 3): which store row gets which award
  "pages/Prices/offerLabels.ts",
  // the Volumes tab (phase 3): worth and what finishing costs
  "pages/Home/useShelfTools.ts",
  // deleting with Undo, Select's Move to (phase 4)
  "lib/restorePieces.ts",
  // the rest of the series page: their books, reviews, Buy next's rules,
  // the red bar, the edit form's rules
  "lib/reviews.ts",
  "lib/books.ts",
  "lib/booksApi.ts",
  "lib/titleKey.ts",
  "lib/anilist.ts",
  "lib/formChecks.ts",
  "lib/seriesFormRules.ts",
  "lib/content/genres.ts",
  "pages/Details/yourBooksRows.ts",
  "pages/Details/useShelfReviews.ts",
  "pages/Details/useRateVolume.ts",
  "pages/Details/upcomingClosed.ts",
  "components/coverPicker/useCoverSearch.ts",
  // the account, To buy, scanning, the avatars (the shelf's header and menu)
  "lib/account.ts",
  "lib/toBuy.ts",
  "lib/content/avatars.ts",
  "lib/scan.ts",
  "lib/year.ts",
  // "Watched the anime?" on the add form
  "lib/afterAnime.ts",
  "lib/afterAnimeText.ts",
  // the menu's pages: FAQ, Friends, the contact address
  "lib/content/faq.ts",
  "lib/friends.ts",
  "lib/contact.ts",
  // To buy's "Out Dec 3", and a volume page's rules
  "pages/Prices/volumePageRules.ts",
  // release dates into a calendar (New's Upcoming Releases, the calendar page)
  "lib/addToCalendar.ts",
  // "Checked 6 h ago" (the app's own stand-in)
  "lib/releaseCache.ts",
  // the price pages' rules: the series grid, box sets, reviews' words, what
  // a series costs, which book holds a volume, loading a volume with a live
  // check, the recent searches
  "pages/Prices/seriesPageRules.ts",
  "pages/Prices/boxSetRules.ts",
  "pages/Prices/setsBoxRules.ts",
  "pages/Prices/reviews/reviewText.ts",
  "pages/Prices/useVolumeLoad.ts",
  "pages/Prices/reviews/useVolumeReviews.ts",
  "pages/Prices/useSeriesData.ts",
  "pages/Prices/canada/useCanadaPrices.ts",
  "lib/finishCost.ts",
  "lib/editionLookup.ts",
  "lib/recentSearches.ts",
  "lib/support.ts",
  // the editions index page
  "lib/editionsIndex.ts",
  "lib/editionsWords.ts",
  // a shared shelf's rules, and your year in manga
  "pages/SharedShelf/shareParts.ts",
  "pages/SharedShelf/shelfNumbers.ts",
  "pages/SharedShelf/sharedShelfView.ts",
  "pages/SharedShelf/compare.ts",
  "pages/SharedShelf/addToRead.ts",
  "lib/sharePicks.ts",
  // importing a list (MyAnimeList, AniList, Kitsu) or a book app's files:
  // the readers, the matching, and the pages' words. malFile.ts and the
  // CSV text are read the app's way (src/native)
  "lib/imports/malImport.ts",
  "lib/imports/malFile.ts",
  "lib/imports/accountImport.ts",
  "lib/imports/bookImport.ts",
  "lib/imports/sharedMatches.ts",
  "lib/imports/openBookFiles.ts",
  "pages/Import/useListImport.ts",
  "pages/Import/bookImportText.ts",
  "pages/Import/importRowText.ts",
  "pages/Import/useNearNames.ts",
  "lib/passwordRule.ts",
];

// browser-only things a copied file may not use
const BROWSER = /\b(window|document|sessionStorage|localStorage|navigator)\.|import\.meta\./;

const check = process.argv.includes("--check");
const files = new Map();
const refused = [];

function resolveImport(from, spec) {
  const base = resolve(dirname(from), spec);
  for (const ext of ["", ".ts", ".tsx", "/index.ts"]) {
    const p = base.replace(/\.js$/, "") + ext;
    if (existsSync(p) && !p.endsWith("/")) return p;
  }
  return null;
}

// what each file imports, by name, from each stand-in (to check them)
const needs = new Map();

function visit(abs) {
  if (files.has(abs)) return;
  const rel = relative(WEB, abs);
  // a native stand-in takes the web file's place, and its imports are its own
  const standIn = join(NATIVE, rel);
  const isStandIn = existsSync(standIn);
  const text = readFileSync(isStandIn ? standIn : abs, "utf8");
  // comments aside: a word in a comment isn't a use
  const code = text.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
  if (!isStandIn && !BROWSER_OK.has(rel) && BROWSER.test(code))
    refused.push(`${rel} (needs a native stand-in at src/native/${rel})`);
  files.set(abs, { text, isStandIn });
  for (const m of text.matchAll(/(?:import|export)\s+(type\s+)?(\{[^}]*\}|\*[^"']*|[\w$]+)?[^"']*?from\s+["'](\.[^"']+)["']/g)) {
    const dep = resolveImport(abs, m[3]);
    if (!dep) {
      refused.push(`${rel}: can't find ${m[3]}`);
      continue;
    }
    if (m[2]?.startsWith("{")) {
      const names = m[2].slice(1, -1).split(",").map((n) => n.trim().replace(/^type\s+/, "").split(/\s+as\s+/)[0]).filter(Boolean);
      const had = needs.get(dep) ?? new Set();
      names.forEach((n) => had.add(n));
      needs.set(dep, had);
    }
    visit(dep);
  }
}

for (const entry of ENTRIES) visit(join(WEB, entry));

// every stand-in exports what's asked of it
for (const [abs, { text, isStandIn }] of files) {
  if (!isStandIn) continue;
  for (const name of needs.get(abs) ?? []) {
    const exported = new RegExp(`export\\s+(?:async\\s+)?(?:const|function|class|type|interface|let)\\s+${name}\\b|export\\s*\\{[^}]*\\b${name}\\b`).test(text);
    if (!exported) refused.push(`src/native/${relative(WEB, abs)} doesn't export ${name}`);
  }
}

const list = [...files].map(([f, { isStandIn }]) => relative(WEB, f) + (isStandIn ? "  (native stand-in)" : "")).sort();
console.log(`${list.length} files:\n  ${list.join("\n  ")}`);
if (refused.length) {
  console.error(`\nrefused (they need a browser, or an import is missing):\n  ${refused.join("\n  ")}`);
  process.exit(1);
}
if (check) process.exit(0);

rmSync(OUT, { recursive: true, force: true });
for (const [abs, { text, isStandIn }] of files) {
  const rel = relative(WEB, abs);
  const dest = join(OUT, rel);
  mkdirSync(dirname(dest), { recursive: true });
  const banner = isStandIn
    ? `// COPIED from src/native/${rel} (the app's own stand-in for the web's) by scripts/sync-core.mjs.\n// Do not edit here: change src/native/${rel}, then run \`npm run sync-core\`.\n`
    : `// COPIED from inventoryApp/client/src/${rel} by scripts/sync-core.mjs.\n// Do not edit here: change the web app, then run \`npm run sync-core\`.\n`;
  writeFileSync(dest, banner + text);
}
console.log(`\ncopied into src/core`);

// The web's icons (components/icons/Icons.tsx), as React Native SVG: the same
// drawings, element for element. Their colour is the `color` prop, which
// their strokes and fills follow (currentColor)
const ICONS = "components/icons/Icons.tsx";
let icons = readFileSync(join(WEB, ICONS), "utf8")
  .replace('import type { SVGProps } from "react";', 'import Svg, { Circle, Path, Rect, type SvgProps } from "react-native-svg";')
  .replace("type IconProps = SVGProps<SVGSVGElement>;", "type IconProps = SvgProps;")
  .replace(/\s*"aria-hidden": true,/, "")
  .replace(/\s+aria-hidden="true"/g, "")
  .replace(/<svg\b/g, "<Svg").replace(/<\/svg>/g, "</Svg>")
  .replace(/<path\b/g, "<Path").replace(/<circle\b/g, "<Circle").replace(/<rect\b/g, "<Rect");
const leftover = icons.match(/<(?!Svg|Path|Circle|Rect|\/)[a-z]+/g);
if (leftover) {
  console.error(`\nicons: elements the app can't draw yet: ${[...new Set(leftover)].join(", ")}`);
  process.exit(1);
}
const iconsDest = join(OUT, ICONS);
mkdirSync(dirname(iconsDest), { recursive: true });
writeFileSync(iconsDest, `// CONVERTED from inventoryApp/client/src/${ICONS} by scripts/sync-core.mjs.\n// Do not edit here: change the web app, then run \`npm run sync-core\`.\n` + icons);
console.log(`icons converted into src/core/${ICONS}`);

// The web's drawings (Kenji the mascot, the profile pictures' art), as React
// Native SVG. Their ink and paper are Tailwind classes on each shape
// ("fill-card stroke-line stroke-[3]"): the app reads those at run time
// (src/lib/svgClass.ts), from the theme's colours, so the drawing files stay
// the web's, element for element
const DRAWINGS = ["components/mascot/Mascot.tsx", "components/avatar/avatarArt.tsx"];
const SVG_TAGS = { svg: "Svg", path: "Path", circle: "Circle", rect: "Rect", ellipse: "Ellipse", g: "G", text: "SvgText", line: "Line", polygon: "Polygon", polyline: "Polyline" };
for (const rel of DRAWINGS) {
  let art = readFileSync(join(WEB, rel), "utf8")
    .replace(/\s+aria-hidden(="true")?/g, "")
    // a class on a shape (a lowercase SVG tag) becomes its ink and paper
    // props; a drawing's own parts (Bust, Head) keep passing className down.
    // A template literal ("`${INK} ...`") has braces of its own
    .replace(
      /<([a-z]+)((?:(?!>)[\s\S])*?)className=(?:\{(`[^`]*`|[^}]*)\}|"([^"]*)")/g,
      (_, tag, before, expr, text) => `<${tag}${before}{...svgClass(${expr ?? JSON.stringify(text)})}`,
    )
;
  for (const [tag, native] of Object.entries(SVG_TAGS))
    art = art.replace(new RegExp(`<${tag}\\b`, "g"), `<${native}`).replace(new RegExp(`</${tag}>`, "g"), `</${native}>`);
  const unknown = art.match(/<(?!Svg|Path|Circle|Rect|Ellipse|G|SvgText|Line|Polygon|Polyline|Art|Bust|Head|DotEyes|BigEyes|[A-Z]|\/|>)[a-z]+/g);
  if (unknown) {
    console.error(`\n${rel}: elements the app can't draw yet: ${[...new Set(unknown)].join(", ")}`);
    process.exit(1);
  }
  const imports = `import Svg, { Circle, Ellipse, G, Line, Path, Polygon, Polyline, Rect, Text as SvgText } from "react-native-svg";\nimport { svgClass } from "@/lib/svgClass";\n`;
  const dest = join(OUT, rel);
  mkdirSync(dirname(dest), { recursive: true });
  writeFileSync(dest, `// CONVERTED from inventoryApp/client/src/${rel} by scripts/sync-core.mjs.\n// Do not edit here: change the web app, then run \`npm run sync-core\`.\n// eslint-disable-next-line @typescript-eslint/no-unused-vars\n` + imports + art);
  console.log(`drawing converted into src/core/${rel}`);
}

// The logo, as the SVG text the app draws (react-native-svg's SvgXml)
const LOGO = "assets/logo.svg";
const logoDest = join(OUT, "assets/logo.ts");
mkdirSync(dirname(logoDest), { recursive: true });
writeFileSync(logoDest, `// COPIED from inventoryApp/client/src/${LOGO} by scripts/sync-core.mjs.\n// Do not edit here: change the web app, then run \`npm run sync-core\`.\nexport const LOGO_SVG = ${JSON.stringify(readFileSync(join(WEB, LOGO), "utf8"))};\n`);
console.log("logo copied into src/core/assets/logo.ts");
