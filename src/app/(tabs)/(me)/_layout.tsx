// The Me tab's own stack (iPhone): the page draws its own top
import { Stack } from "expo-router";

export default function MeTabLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
