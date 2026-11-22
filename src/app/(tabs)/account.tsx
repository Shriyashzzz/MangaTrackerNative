// The third tab for someone not signed in: the sign-in page itself, as the
// Android app's bar has it. Signed in, the tab is gone and New takes its place
import { Redirect } from "expo-router";
import { useAuth } from "@/store/auth";
import SignIn from "../sign-in";

export default function AccountTab() {
  const isSignedIn = useAuth((s) => s.isSignedIn);
  if (isSignedIn) return <Redirect href="/" />;
  return <SignIn />;
}
