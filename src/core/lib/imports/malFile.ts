// COPIED from src/native/lib/imports/malFile.ts (the app's own stand-in for the web's) by scripts/sync-core.mjs.
// Do not edit here: change src/native/lib/imports/malFile.ts, then run `npm run sync-core`.
// A MyAnimeList export as the app's picker hands it over: a path on the
// device, read in one go. Takes the place of the web's lib/imports/malFile.ts
// (a browser File); the reading itself is shared (malImport.ts)
import { File } from "expo-file-system";
import {
  ImportFileError,
  MAL_FILE_TOO_BIG,
  malItemsFromXml,
  MAX_MAL_FILE_BYTES,
  unpackMalExport,
  type MalItem,
} from "./malImport";

export type MalFile = { uri: string; name: string; size: number };

export async function readMalExport(file: MalFile): Promise<MalItem[]> {
  if (file.size > MAX_MAL_FILE_BYTES)
    throw new ImportFileError(MAL_FILE_TOO_BIG);
  const bytes = new Uint8Array(await new File(file.uri).arrayBuffer());
  return malItemsFromXml(unpackMalExport(bytes));
}
