// The last screen of an import (the web's pages/Import/ImportDone.tsx and the
// book import's own): Kenji pleased, what went in, and the way to the shelf
import { router } from "expo-router";
import type { ReactNode } from "react";
import { Text, View } from "react-native";
import Button from "@/components/Button";
import Mascot from "@/components/Mascot";
import type { ImportTotals } from "@/core/lib/imports/malImport";
import { doneTitle, series } from "@/core/pages/Import/bookImportText";
import { Note } from "./ImportParts";

export function alreadyThereLine(totals: ImportTotals) {
  if (totals.alreadyThere <= 0) return "";
  const already = series(totals.alreadyThere);
  return totals.volumesAdded
    ? `${already} already on your shelf; ${series(totals.volumesAdded)} got the new volumes from your file, nothing else changed. `
    : `${already} already on your shelf, so we left them alone. `;
}

export default function ImportDone({
  totals,
  children,
}: {
  totals: ImportTotals;
  // the book import's extra lines (what wasn't ticked, complete sets)
  children?: ReactNode;
}) {
  return (
    <View className="items-center gap-4 pt-4">
      <Mascot mood="happy" width={120} />
      <Text className="text-center font-brand pr-1 text-[30px] tracking-[1px] text-ink uppercase">
        {doneTitle(totals)}
      </Text>
      <Note>
        {alreadyThereLine(totals)}
        {totals.noCover > 0 &&
          `${series(totals.noCover)} came in without a cover. You can add one with Edit details.`}
      </Note>
      {children}
      <Button
        kind="primary"
        label="Go to my shelf"
        onPress={() => router.replace("/(tabs)")}
      />
    </View>
  );
}
