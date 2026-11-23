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

// the two prices as Apple shows them in this person's country ("$3.99",
// "3,99 €"), or null while unknown
export async function storePrices(): Promise<Record<string, string> | null> {
  if (!canBuy()) return null;
  try {
    await connect();
    const products =
      (await fetchProducts({ skus: COLLECTOR, type: "subs" })) ?? [];
    const prices: Record<string, string> = {};
    for (const product of products as { id: string; displayPrice: string }[])
      prices[product.id] = product.displayPrice;
    return Object.keys(prices).length ? prices : null;
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
