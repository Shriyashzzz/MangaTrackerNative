// The app's stand-in for the web's lib/offlineChanges.ts. The website keeps a
// change made offline and sends it once the connection is back; the app
// doesn't yet, so a save that can't reach the server fails and says so

// what a change kept on this device says (never, yet, in the app)
export const KEPT_NOTE = "Kept on this device. It saves when you're back.";

export async function keepOwnedChange(
  _mangaId: number,
  _started: number[],
  _ended: number[],
): Promise<void> {
  throw new Error("Not saved: you're offline. Try again when you're back.");
}

// the web's saveOrKeep, saving only: `send` is the ordinary save, and a
// refusal throws, as the web's does
export async function saveOrKeep(
  _mangaId: number,
  _kind: string,
  _from: unknown,
  _to: unknown,
  send: () => Promise<Response>,
): Promise<"saved" | "kept"> {
  const res = await send();
  if (!res.ok) throw new Error(`answered ${res.status}`);
  return "saved";
}
