// Buying Collector on an iPhone or iPad, through Apple (expo-iap, which
// speaks StoreKit 2). Apple's sheet takes the payment; the signed
// transaction it hands back goes to the server, which checks it with Apple
// before the plan changes (server src/plan/applePurchases.ts). Only then is
// the transaction finished, so a purchase the server never heard of is
// offered again by Apple the next time, not lost
import {
  fetchProducts,
  finishTransaction,
  getAvailablePurchases,
  initConnection,
  isEligibleForIntroOfferIOS,
  isUserCancelledError,
  purchaseErrorListener,
  purchaseUpdatedListener,
  requestPurchase,
  type Purchase,
} from "expo-iap";
import { Platform } from "react-native";
import { apiFetch } from "@/core/lib/api";
import { usePlan } from "@/store/plan";

// the products (App Store Connect, the Collector subscription group)
export const YEARLY = "collector.yearly";
export const MONTHLY = "collector.monthly";
const COLLECTOR = [YEARLY, MONTHLY];

export const canBuy = () => Platform.OS === "ios";

// connected once, with the listener for purchases Apple completes
let ready: Promise<void> | null = null;
let settle: ((outcome: Outcome) => void) | null = null;
export type Outcome = "bought" | "cancelled" | "failed";

// a purchase Apple completed, now or one left over from before: told to
// the server, and finished once the server has it
async function hand(purchase: Purchase) {
  if (!COLLECTOR.includes(purchase.productId) || !purchase.purchaseToken)
    return false;
  const res = await apiFetch("/api/account/plan/apple", {
    method: "POST",
    body: { signedTransaction: purchase.purchaseToken },
  }).catch(() => null);
  if (!res?.ok) return false;
  await finishTransaction({ purchase, isConsumable: false }).catch(() => {});
  await usePlan.getState().load();
  return true;
}

function connect() {
  ready ??= initConnection().then(() => {
    purchaseUpdatedListener((purchase) => {
      void hand(purchase).then((ok) => {
        settle?.(ok ? "bought" : "failed");
        settle = null;
      });
    });
    purchaseErrorListener((error) => {
      settle?.(isUserCancelledError(error) ? "cancelled" : "failed");
      settle = null;
    });
  });
  return ready;
}

// What the store says, so the sheet never promises what App Store Connect
// doesn't: each price as Apple shows it in this person's country ("$3.99",
// "3,99 €"), and the free trial on each, said as "1 week" or "2 weeks",
// only when it's free and this Apple ID can still have it
export type StoreOffer = { price: string; trial: string | null };
type StoreProduct = {
  id: string;
  displayPrice: string;
  subscriptionGroupIdIOS?: string | null;
  introductoryPricePaymentModeIOS?: string;
  introductoryPriceNumberOfPeriodsIOS?: string | null;
  introductoryPriceSubscriptionPeriodIOS?: string | null;
};
const trialText = (p: StoreProduct) => {
  const unit = p.introductoryPriceSubscriptionPeriodIOS;
  const count = Number(p.introductoryPriceNumberOfPeriodsIOS ?? 1) || 1;
  if (p.introductoryPricePaymentModeIOS !== "free-trial" || !unit) return null;
  if (!["day", "week", "month", "year"].includes(unit)) return null;
  return `${count} ${unit}${count === 1 ? "" : "s"}`;
};
export async function storeOffers(): Promise<Record<
  string,
  StoreOffer
> | null> {
  if (!canBuy()) return null;
  try {
    await connect();
    const products = ((await fetchProducts({
      skus: COLLECTOR,
      type: "subs",
    })) ?? []) as StoreProduct[];
    if (!products.length) return null;
    const group = products.find(
      (p) => p.subscriptionGroupIdIOS,
    )?.subscriptionGroupIdIOS;
    // someone who has had the trial before isn't offered it again
    const eligible = group
      ? await isEligibleForIntroOfferIOS(group).catch(() => true)
      : true;
    return Object.fromEntries(
      products.map((p) => [
        p.id,
        { price: p.displayPrice, trial: eligible ? trialText(p) : null },
      ]),
    );
  } catch {
    return null;
  }
}

// Apple's purchase sheet for one of the two; resolves when it's done
export async function buy(sku: string): Promise<Outcome> {
  await connect();
  return new Promise<Outcome>((resolve) => {
    settle = resolve;
    void requestPurchase({ request: { apple: { sku } }, type: "subs" }).catch(
      (error: unknown) => {
        settle = null;
        resolve(isUserCancelledError(error as never) ? "cancelled" : "failed");
      },
    );
  });
}

// Restore purchases: whatever Collector this Apple ID has, told to the
// server. True when there was one
export async function restore() {
  await connect();
  const purchases = (await getAvailablePurchases().catch(() => [])) ?? [];
  let found = false;
  for (const purchase of purchases) if (await hand(purchase)) found = true;
  return found;
}
