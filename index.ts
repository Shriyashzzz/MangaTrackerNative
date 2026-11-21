// The app's entry: what the copied web code needs from Intl first, before
// Expo Router loads any screen (each screen's imports run as it's loaded)
import "./src/lib/polyfills";
import "expo-router/entry";
