// The new tab's own stack: on iOS it carries Apple's navigation bar for the
// tab (lib/tabHeader.ts); the pages it opens stay on the app's stack
import { Stack } from "expo-router";
import { useColors } from "@/lib/colors";
import { tabHeaderOptions } from "@/lib/tabHeader";

export default function NewTabLayout() {
  const c = useColors();
  return <Stack screenOptions={tabHeaderOptions(c)} />;
}
