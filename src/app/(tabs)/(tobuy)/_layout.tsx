// The To buy tab's own stack (iPhone): the list draws its own top
import { Stack } from "expo-router";

export default function ToBuyTabLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
