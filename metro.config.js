// Metro, with Uniwind reading the app's Tailwind classes from src/global.css.
// withUniwindConfig stays the outermost wrapper (Uniwind's docs)
const { getDefaultConfig } = require("expo/metro-config");
const { withUniwindConfig } = require("uniwind/metro");

const config = getDefaultConfig(__dirname);
// Node's own file watcher, not Watchman: Watchman, a background service,
// can lose sight of a folder macOS hasn't let it read (Desktop), and then
// Metro serves old code without saying so
config.resolver.useWatchman = false;

module.exports = withUniwindConfig(config, {
  cssEntryFile: "./src/global.css",
  dtsFile: "./src/uniwind-types.d.ts",
});
