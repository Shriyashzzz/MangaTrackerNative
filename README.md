# MangaTrackerNative

The Manga Tracker Android app, built with React Native (Expo). It does what
the website's Android app does, screen for screen, against the same server.
The website (`../inventoryApp`) stays the source of every rule.

## Run it

```bash
npm install
npx expo run:android      # build and install on a phone or emulator
npx expo start            # day to day: start Metro, then open the app
```

- `npx expo run:android` again after adding a native package or changing
  `app.json`. Everyday code changes only need Metro.
- Something looks unchanged after an edit: `npx expo start --clear`.
- A phone on USB reaches Metro and the local server through adb:
  `adb reverse tcp:8081 tcp:8081` and `adb reverse tcp:8080 tcp:8080`.
- Native modules in use (a rebuild after adding one): async storage (what
  the device remembers), the date picker, the camera (scanning), haptics,
  notifications, the image picker, the clipboard.

While developing, the app talks to `http://localhost:8080` (the local
server). A release build talks to `https://mangatracker.xyz`.
`EXPO_PUBLIC_API_URL` overrides either.

## Checks

```bash
npm run typecheck
npm run lint
```

## Where things are

| Folder            | What's in it                                                           |
| ----------------- | ---------------------------------------------------------------------- |
| `src/app/`        | Screens. Every file is a route (Expo Router).                          |
| `src/components/` | The app's own building blocks (rows, the bottom bar, the spine strip). |
| `src/store/`      | Who's signed in, the shelf, the account's settings.                    |
| `src/lib/`        | Small app-only helpers (theme colours, polyfills).                     |
| `src/core/`       | **Copied from the website. Never edit.**                               |
| `src/native/`     | The app's own versions of website files that need a browser.           |
| `src/global.css`  | The theme: the website's colours (light and dark) and fonts.           |

## The shared logic (`src/core`)

The shelf maths, editions, Buy next, To get, prices and the API calls are
the website's own code, copied in by:

```bash
npm run sync-core
```

- Change a rule in the website (`../inventoryApp/client/src`), then run
  `sync-core`. Each copied file says where it came from at the top.
- The script follows every import, so nothing is left behind.
- A website file that needs a browser (storage, `window`) is refused. Write
  the app's version at the same path under `src/native/`; the script copies
  that one instead and checks it has every name the other files use.
- The website's icons and logo are converted to React Native as part of it.
- Which files are copied: `ENTRIES` at the top of `scripts/sync-core.mjs`.

## Styling

Tailwind classes through [Uniwind](https://docs.uniwind.dev): `bg-paper`,
`text-ink`, `font-brand`. Android needs one font name per weight, so it's
`font-body-semibold`, not `font-body font-semibold`.

Bangers (`font-brand`) leans right, and React Native sizes text without
the lean, so the last letter gets cut: give every `font-brand` text `pr-1`.

Components that aren't React Native's own (`expo-image`, safe areas) don't
take `className`: wrap them with `withUniwind`, or give them plain styles.

## Where the app does it its own way

The screens follow the Android app's, but where the phone has a better
control the app uses it:

- Pick-one lists (the shelf's tab and sort, genres, editions) are bottom
  sheets, not dropdowns.
- Every sheet is `@gorhom/bottom-sheet`: it follows the finger down and
  closes, and a long list inside it scrolls until it's at the top, as the
  system's own sheets do.
- Changing tab slides the pages sideways, as an iPhone's do.
- Questions (delete a series, clear To buy) are the system's own alerts.
- "Bought on" opens Android's date picker.
- The + button floats above the tab bar; Select starts with a long press.
- A scan buzzes instead of beeping, and the camera reads barcodes itself.
- The release settings' "how many behind" is a − N + counter (the website
  has a slider).
- Share my list and Export my list hand the link or the file to the
  phone's share sheet.
- The import picks files with the phone's file picker; a MyAnimeList
  export is read on the phone (the same reader as the website's, in
  `src/core/lib/imports`), and a book import carries on in the app's store
  if you leave the page.
- After the anime's show list has a "Show more" button instead of page
  numbers.
- Sign in with Google is not in the app yet; the account pages (sign up,
  forgot and reset password) are.

## Google sign-in

The app signs in through the same server route as the website
(`/api/auth/google`): Google's sheet on the phone hands back an ID token made
out to the website's web client, which is the client the server checks.
The client IDs live in `.env.local` (copy `.env.example`); nothing is in git.

- `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`: the website's web client.
- `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID`: an Android client in Google Cloud
  for package `xyz.mangatracker.app.rn` and the signing key's SHA-1. The
  debug keystore (`android/app/debug.keystore`) has one; a Play build needs a
  second client with the SHA-1 from Play app signing.
- `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`: an iOS client for bundle
  `xyz.mangatracker.app.rn`. When it exists, add the library's config plugin
  to `app.json` with its reversed ID as `iosUrlScheme`
  (`com.googleusercontent.apps.<id>`), then prebuild iOS.

Without the IDs the button stays off the sign-in pages. A new `.env.local`
needs Metro restarted, since the values are read when it starts.

## Not done yet

- Google sign-in on iOS: its client ID and the plugin's URL scheme (above)
- Google sign-in on a Play build: the second Android client (above)
- The reset-password screen exists, but a reset email's link opens the
  website: for the app to open it, the site needs an `assetlinks.json` for
  this app's package
- Owner tools (reported reviews, fixes to review, reported books), the
  tour and practice account
- Alerts on the phone (the server sends web push today; the app needs its
  own tokens)
- Linking Google to an account from the app
- Changes made offline: the website keeps and sends them; the app says they
  didn't save
- Live price checks (the website proves a person is there first; the app
  gets stored prices)
- Before release: allow plain http to localhost only, not everywhere

## License

Copyright © 2026 Shriyash Ghimire. All rights reserved.

This app is part of [Manga Tracker](https://github.com/Shriyashzzz/inventoryApp)
and is licensed on the same terms as the web version: the source is public
so you can read and learn from it. No license is granted to copy, modify,
distribute or host it, in whole or in part, without written permission.
See [LICENSE](LICENSE).
