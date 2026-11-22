// Signed out (by the menu, a deleted account, or a session that lapsed):
// everything kept in memory about the account goes, so the next person to
// sign in on this phone never sees a flash of someone else's shelf or list
import { useAccount } from "@/store/account";
import { useBookImport } from "@/store/bookImport";
import { usePrefs } from "@/store/prefs";
import { forgetChanges } from "@/core/lib/offlineChanges";
import { KEPT_SHELF, useShelf } from "@/store/shelf";
import { removeLocal } from "./deviceStore";
import { forgetAnswers } from "./keptAnswers";
import { useToBuy } from "@/store/toBuy";

export function forgetAccountData() {
  useShelf.getState().reset();
  useAccount.getState().clear();
  useToBuy.getState().reset();
  useBookImport.getState().clear();
  usePrefs.getState().reset();
  // what was kept for offline: the last shelf, the pages they opened, and changes not sent yet
  removeLocal(KEPT_SHELF);
  void forgetChanges();
  void forgetAnswers();
}
