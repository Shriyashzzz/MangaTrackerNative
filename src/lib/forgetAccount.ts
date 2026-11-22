// Signed out (by the menu, a deleted account, or a session that lapsed):
// everything kept in memory about the account goes, so the next person to
// sign in on this phone never sees a flash of someone else's shelf or list
import { useAccount } from "@/store/account";
import { useBookImport } from "@/store/bookImport";
import { usePrefs } from "@/store/prefs";
import { useShelf } from "@/store/shelf";
import { useToBuy } from "@/store/toBuy";

export function forgetAccountData() {
  useShelf.getState().reset();
  useAccount.getState().clear();
  useToBuy.getState().reset();
  useBookImport.getState().clear();
  usePrefs.getState().reset();
}
