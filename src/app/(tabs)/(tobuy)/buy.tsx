// To buy as a tab of its own, on an iPhone (the bag opens the same list on
// Android). Signed out, the way to an account
import { ToBuyScreen } from "@/app/to-buy";
import SignInPrompt from "@/components/SignInPrompt";
import { useAuth } from "@/store/auth";

export default function ToBuyTab() {
  const isSignedIn = useAuth((s) => s.isSignedIn);
  if (!isSignedIn)
    return (
      <SignInPrompt
        title="To buy"
        line="Keep the volumes you want next, with their prices and an alert when one drops."
      />
    );
  return <ToBuyScreen inTab />;
}
