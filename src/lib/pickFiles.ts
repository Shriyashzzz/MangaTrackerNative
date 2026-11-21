// The files an import reads, picked with the device's own file picker and
// handed over the way the shared readers want them (core lib/imports): a
// MyAnimeList export, or a book app's CSV files
import { getDocumentAsync } from "expo-document-picker";
import { File } from "expo-file-system";
import type { MalFile } from "@/core/lib/imports/malFile";
import type { PickedCsv } from "@/core/lib/imports/openBookFiles";

// a size the picker didn't give: the file is opened for it
const sizeOf = (uri: string, size?: number) => {
  if (size !== undefined) return size;
  try {
    return new File(uri).size ?? 0;
  } catch {
    return 0;
  }
};

export async function pickMalFile(): Promise<MalFile | null> {
  // any file: the export is .xml.gz, which pickers file under odd types
  const picked = await getDocumentAsync({ copyToCacheDirectory: true });
  const asset = picked.canceled ? null : picked.assets[0];
  if (!asset) return null;
  return {
    uri: asset.uri,
    name: asset.name,
    size: sizeOf(asset.uri, asset.size),
  };
}

export async function pickCsvFiles(): Promise<PickedCsv[]> {
  const picked = await getDocumentAsync({
    copyToCacheDirectory: true,
    multiple: true,
  });
  if (picked.canceled) return [];
  return picked.assets.map((asset) => ({
    name: asset.name,
    size: sizeOf(asset.uri, asset.size),
    type: asset.mimeType,
    lastModified: asset.lastModified ?? 0,
    bytes: () => new File(asset.uri).arrayBuffer(),
  }));
}
