// Signed out (by the menu, a deleted account, or a session that lapsed):
// everything kept in memory about the account goes, so the next person to
// sign in on this phone never sees a flash of someone else's shelf or list
import { usePlan } from "@/store/plan";
import { useAccount } from "@/store/account";
import { useBookImport } from "@/store/bookImport";
import { usePrefs } from "@/store/prefs";
import { forgetChanges } from "@/core/lib/offlineChanges";
import { KEPT_SHELF, KEPT_TOTALS, useShelf } from "@/store/shelf";
import { removeLocal } from "./deviceStore";
import { forgetAnswers } from "./keptAnswers";
import { useToBuy } from "@/store/toBuy";
import { useLook } from "./mangaThemes";

export function forgetAccountData() {
  useShelf.getState().reset();
  useAccount.getState().clear();
  useToBuy.getState().reset();
  useBookImport.getState().clear();
  usePrefs.getState().reset();
  usePlan.getState().reset();
  // a theme being tried on ends with the account (its timer would otherwise
  // offer Premium to someone signed out)
  useLook.getState().takeOff();
  // and the theme picked here goes with the account, so the next one to
  // sign in on this phone starts on the app's own look
  useLook.getState().pick(null);
  // what was kept for offline: the last shelf, the pages they opened, and changes not sent yet
  removeLocal(KEPT_SHELF);
  removeLocal(KEPT_TOTALS);
  void forgetChanges();
  void forgetAnswers();
}
