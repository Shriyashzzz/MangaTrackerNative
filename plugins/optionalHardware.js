// Hardware the app can do without, said so in the Android manifest.
// Asking for portrait, or for the camera permission, makes Android assume
// the phone must have a portrait screen and a camera, and Google Play then
// refuses the app to every device that hasn't (it stopped a release for
// "android.hardware.screen.portrait"). Marked optional, the app installs
// everywhere; barcode scanning simply isn't there without a camera
const { withAndroidManifest } = require("expo/config-plugins");

const OPTIONAL = [
  "android.hardware.screen.portrait",
  "android.hardware.camera",
  "android.hardware.camera.autofocus",
  "android.hardware.camera.any",
];

module.exports = (config) =>
  withAndroidManifest(config, (mod) => {
    const manifest = mod.modResults.manifest;
    const others = (manifest["uses-feature"] ?? []).filter(
      (feature) => !OPTIONAL.includes(feature.$["android:name"]),
    );
    manifest["uses-feature"] = [
      ...others,
      ...OPTIONAL.map((name) => ({
        $: { "android:name": name, "android:required": "false" },
      })),
    ];
    return mod;
  });
