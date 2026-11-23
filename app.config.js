// The app's config is app.json; this adds the one thing that differs by
// build. A development build talks to the local server over plain http
// (localhost:8080), so cleartext is allowed there; a production build only
// ever talks to https://mangatracker.xyz, and cleartext is off.
// Production: an EAS build on the production profile, or APP_ENV=production
// for a release built on this machine
const production =
  process.env.EAS_BUILD_PROFILE === "production" ||
  process.env.APP_ENV === "production";

const PLAY_PACKAGE = "xyz.mangatracker.app";

module.exports = ({ config }) => ({
  ...config,
  android: {
    ...config.android,
    // On Play the app is the same listing the Chrome app had, so a
    // production build carries its package name (and Play's version codes
    // go on from there: app.json android.versionCode). A development build
    // keeps its own name, so it installs beside the one from Play
    package: production ? PLAY_PACKAGE : config.android.package,
    // the session cookie stays out of Android's cloud backups
    allowBackup: false,
  },
  plugins: [
    ...(config.plugins ?? []).map((plugin) =>
      Array.isArray(plugin) && plugin[0] === "expo-build-properties"
        ? [
            plugin[0],
            {
              ...plugin[1],
              android: {
                ...plugin[1]?.android,
                usesCleartextTraffic: !production,
              },
            },
          ]
        : plugin,
    ),
    // (so Play offers the app to devices with no camera or portrait screen)
    "./plugins/optionalHardware",
  ],
});
