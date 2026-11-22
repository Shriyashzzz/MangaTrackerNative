// The few things of a browser the practice shelf's code uses (core
// lib/demo.ts, the website's own, copied as it is). Loaded before it, from
// lib/polyfills.ts. Each is only put in place when missing.
//
//   sessionStorage   where the website keeps the practice shelf for one
//                    tab. Here: in memory, for one run of the app, so
//                    closing the app ends the practice
//   practiceGo       the website starts and ends the practice by loading a
//                    page afresh (location.assign). The copied code calls
//                    this in its place, and "going" somewhere is handed to
//                    whoever asked to be told (lib/practice.ts), which
//                    signs the practice account in or out and moves the app
//   history, addEventListener
//                    used around those page loads: harmless stand-ins
type Go = (to: string) => void;
let onGo: Go = () => {};
export const whenPracticeGoes = (go: Go) => {
  onGo = go;
};

const scope = globalThis as Record<string, unknown>;

if (!scope.sessionStorage) {
  const kept = new Map<string, string>();
  scope.sessionStorage = {
    getItem: (key: string) => kept.get(key) ?? null,
    setItem: (key: string, value: string) => void kept.set(key, String(value)),
    removeItem: (key: string) => void kept.delete(key),
    clear: () => kept.clear(),
  };
}
// where the copied code "goes" (scripts/sync-core.mjs renames its calls)
scope.practiceGo = (to: string) => onGo(to);
if (!scope.history)
  scope.history = { state: null, replaceState() {}, pushState() {} };
if (!scope.addEventListener) scope.addEventListener = () => {};
