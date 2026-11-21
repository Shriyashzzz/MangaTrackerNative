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

| Folder | What's in it |
|---|---|
| `src/app/` | Screens. Every file is a route (Expo Router). |
| `src/components/` | The app's own building blocks (rows, the bottom bar, the spine strip). |
| `src/store/` | Who's signed in, the shelf, the account's settings. |
| `src/lib/` | Small app-only helpers (theme colours, polyfills). |
| `src/core/` | **Copied from the website. Never edit.** |
| `src/native/` | The app's own versions of website files that need a browser. |
| `src/global.css` | The theme: the website's colours (light and dark) and fonts. |

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
- Questions (delete a series, clear To buy) are the system's own alerts.
- "Bought on" opens Android's date picker.
- The + button floats above the tab bar; Select starts with a long press.
- A scan buzzes instead of beeping, and the camera reads barcodes itself.
- The release settings' "how many behind" is a − N + counter (the website
  has a slider).
- Share my list and Export my list hand the link or the file to the
  phone's share sheet.
- Your year in manga, the import and shared shelves open on the website
  until the app has pages of its own.

## Not done yet

- Your year in manga, the import, shared shelves (web pages for now)
- Alerts on the phone (the server sends web push today; the app needs its
  own tokens)
- Linking Google to an account from the app
- Changes made offline: the website keeps and sends them; the app says they
  didn't save
- Live price checks (the website proves a person is there first; the app
  gets stored prices)
- Before release: allow plain http to localhost only, not everywhere
