// https://docs.expo.dev/guides/using-eslint/
// Expo's rules, with the web app's allowances: apostrophes in text are fine
// (the web's config has no react plugin), and the copied code (src/core) is
// linted where it is written, in the web app
const { defineConfig } = require("eslint/config");
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ["dist/*", "android/*", ".expo/*", "src/core/*"],
  },
  {
    rules: {
      "react/no-unescaped-entities": "off",
    },
  },
  {
    // a stand-in imports its neighbours as they'll sit once copied beside them
    files: ["src/native/**"],
    rules: { "import/no-unresolved": "off" },
  },
]);
