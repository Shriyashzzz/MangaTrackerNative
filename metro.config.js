// Metro, with Uniwind reading the app's Tailwind classes from src/global.css.
// withUniwindConfig stays the outermost wrapper (Uniwind's docs)
const { getDefaultConfig } = require("expo/metro-config");
const { withUniwindConfig } = require("uniwind/metro");

const config = getDefaultConfig(__dirname);

module.exports = withUniwindConfig(config, {
  cssEntryFile: "./src/global.css",
  dtsFile: "./src/uniwind-types.d.ts",
});
