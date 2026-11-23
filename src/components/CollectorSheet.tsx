// Collector, the paid tier (server src/plan/): what it adds beside what a
// free account has, what they've used, and its two prices. One sheet for
// the whole app, opened from Settings or when the server says a limit is
// full (lib/api.ts). It says each thing once and asks for nothing twice.
//
// An early member is told everything is theirs. Where nothing is limited
// (Android and the website, for now) the table is shown without prices.
// Buying is through Apple and arrives with the iPhone app: until then the
// button says so rather than pretending
import { H2 } from "@/components/Page";
import Mascot from "./Mascot";
import {
  buy,
  canBuy,
  MONTHLY,
  restore,
  storeOffers,
  type StoreOffer,
  YEARLY,
} from "@/lib/purchases";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Linking, Platform, Text, View } from "react-native";
import Tap from "@/components/Tap";
import { usePlan, type Counted } from "@/store/plan";
import Button from "./Button";
import Sheet from "./Sheet";

// Yearly comes with a week free (Apple's introductory offer, set on the
// product in App Store Connect); monthly starts straight away
// Apple's standard terms, which App Store subscriptions are sold under, and
// where an Apple ID's subscriptions are managed
const APPLE_TERMS =
  "https://www.apple.com/legal/internet-services/itunes/dev/stdeula/";
const MANAGE = "https://apps.apple.com/account/subscriptions";

const PRICES = [
  {
    key: "year",
    name: "Yearly",
    price: "$24.99",
    note: "Best value",
    after: "7 days free, then $24.99 a year.",
  },
  {
    key: "month",
    name: "Monthly",
    price: "$3.99",
    note: "Cancel any time",
    after: "$3.99 a month, starting today.",
  },
] as const;

// On an iPhone the small print is in Apple's own face (San Francisco), as
// the rest of iOS reads; the headings keep the app's lettering. Android
// keeps the app's faces
const IOS_TEXT = Platform.OS === "ios";
const TEXT = {
  plain: IOS_TEXT ? { fontFamily: "System" } : undefined,
  bold: IOS_TEXT
    ? { fontFamily: "System", fontWeight: "600" as const }
    : undefined,
  count: IOS_TEXT
    ? { fontFamily: "System", fontVariant: ["tabular-nums" as const] }
    : undefined,
};

// What Kenji says as the sheet opens: why it opened, or what they have
function speech(
  plan: ReturnType<typeof usePlan.getState>["plan"],
  reason: Counted | "calendar" | "japan" | null,
) {
  if (plan.plan === "early")
    return {
      shout: "You joined early!",
      line: "So everything here is yours, free, for good.",
    };
  if (plan.plan === "collector")
    return {
      shout: "You're a Collector!",
      line: "Everything here is yours. Thanks for backing the app.",
    };
  if (!plan.limited)
    return {
      shout: "Nothing's limited yet!",
      line: "All of this is open to you here.",
    };
  const shout =
    reason === "series"
      ? "Your shelf's full!"
      : reason === "scans"
        ? "Out of scans!"
        : reason === "priceAlerts"
          ? "Three prices watched!"
          : reason === "calendar"
            ? "The whole calendar!"
            : reason === "japan"
              ? "In Japan!"
              : "Go Collector!";
  return {
    shout,
    line: "Collector takes the limits off. What you have stays yours.",
  };
}

// Kenji in a panel, saying it in a speech bubble
function KenjiSays({ shout, line }: { shout: string; line: string }) {
  return (
    <View className="h-[112px] flex-row items-end gap-2 overflow-hidden rounded-[12px] border-2 border-ink bg-paper-2 px-3 pt-2.5">
      <View style={{ marginBottom: -6 }}>
        <Mascot mood="happy" width={72} />
      </View>
      <View className="mb-auto flex-1" style={{ flexShrink: 1, minWidth: 0 }}>
        <View className="rounded-[18px] border-2 border-ink bg-card px-3 py-2.5">
          <Text className="font-brand pr-[4px] text-[19px] leading-[21px] tracking-[0.5px] text-ink uppercase">
            {shout}
            {"\u00A0"}
          </Text>
          <Text
            style={TEXT.plain}
            className="mt-1 font-body text-[12.5px] leading-[17px] text-ink-soft"
          >
            {line}
          </Text>
        </View>
        {/* the bubble's tail, pointing at him */}
        <View
          className="absolute h-3.5 w-3.5 border-b-2 border-l-2 border-ink bg-card"
          style={{ left: -6, bottom: 18, transform: [{ rotate: "45deg" }] }}
        />
      </View>
    </View>
  );
}

// A shelf with no limit: what they have, inked, and the shelf running on
// past the edge with a NO END! stamp
function OpenShelf({
  label,
  count,
  unit,
}: {
  label: string;
  count: number;
  unit: string;
}) {
  const inked = Math.min(
    10,
    Math.max(count > 0 ? 1 : 0, Math.ceil(count / 10)),
  );
  return (
    <View
      accessible
      accessibilityLabel={`${label}: ${count} ${unit}, no limit`}
      className="gap-1.5"
    >
      <View className="flex-row justify-between">
        <Text
          style={TEXT.bold}
          className="font-body-semibold text-[13px] text-ink"
        >
          {label}
        </Text>
        <Text style={TEXT.count} className="font-mono text-[12px] text-muted">
          {count} {unit}
        </Text>
      </View>
      <View className="flex-row items-end gap-[3px] border-b-[3px] border-double border-ink pb-[2px]">
        {Array.from({ length: 10 }, (_, i) => (
          <View
            key={i}
            className={`flex-1 ${i < inked ? "h-[20px] border-2 border-ink bg-ink" : "h-[16px] border-[1.5px] border-dashed border-muted"}`}
          />
        ))}
        <Text
          className="ml-1.5 font-brand pr-[3px] text-[14px] text-accent"
          style={{ transform: [{ rotate: "-4deg" }] }}
        >
          NO END!{"\u00A0"}
        </Text>
      </View>
    </View>
  );
}

// One of Collector's extras as a small comic panel with a red stamp, as the
// welcome screen draws its panels
function StampPanel({
  stamp,
  big,
  caption,
}: {
  stamp: string;
  big: string;
  caption: string;
}) {
  return (
    <View className="flex-1 overflow-hidden rounded-[12px] border-2 border-ink bg-card">
      <View className="h-[54px] items-center justify-center border-b-2 border-ink bg-paper-2">
        <Text className="font-brand pr-[3px] text-[19px] tracking-[0.5px] text-ink uppercase">
          {big}
          {"\u00A0"}
        </Text>
        <View
          className="absolute top-1 right-1 border-[1.5px] border-ink bg-accent px-1"
          style={{ transform: [{ rotate: "-3deg" }] }}
        >
          <Text className="font-brand pr-[2px] text-[10px] tracking-[0.5px] text-on-accent uppercase">
            {stamp}
            {"\u00A0"}
          </Text>
        </View>
      </View>
      <Text
        style={TEXT.bold}
        numberOfLines={1}
        className="py-1.5 text-center font-body-semibold text-[12px] text-ink"
      >
        {caption}
      </Text>
    </View>
  );
}

// One limit as a shelf of ten spines, inked as far as it's used, ending in
// a red END! stamp
function LimitShelf({
  label,
  what,
  plan,
}: {
  label: string;
  what: Counted;
  plan: ReturnType<typeof usePlan.getState>["plan"];
}) {
  const limit = plan.limits?.[what] ?? 0;
  const used = plan.used[what];
  const share = limit ? Math.min(1, used / limit) : 0;
  const inked = used > 0 ? Math.max(1, Math.round(share * 10)) : 0;
  return (
    <View
      accessible
      accessibilityLabel={`${label}: ${used} of ${limit}`}
      className="gap-1.5"
    >
      <View className="flex-row justify-between">
        <Text
          style={TEXT.bold}
          className="font-body-semibold text-[13px] text-ink"
        >
          {label}
        </Text>
        <Text style={TEXT.count} className="font-mono text-[12px] text-muted">
          {used} of {limit}
        </Text>
      </View>
      <View className="flex-row items-end gap-[3px] border-b-[3px] border-double border-ink pb-[2px]">
        {Array.from({ length: 10 }, (_, i) => (
          <View
            key={i}
            className={`flex-1 ${i < inked ? "h-[20px] border-2 border-ink bg-ink" : "h-[16px] border-[1.5px] border-dashed border-muted"}`}
          />
        ))}
        <Text
          className="ml-1.5 font-brand pr-[3px] text-[14px] text-accent"
          style={{ transform: [{ rotate: "-4deg" }] }}
        >
          END!{"\u00A0"}
        </Text>
      </View>
    </View>
  );
}

export default function CollectorSheet() {
  const { plan, sheet, hideCollector } = usePlan();
  const [picked, setPicked] = useState<"year" | "month">("year");
  const [busy, setBusy] = useState(false);
  const [said, setSaid] = useState("");
  // the prices as Apple shows them in this country, once it's said
  const [store, setStore] = useState<Record<string, StoreOffer> | null>(null);
  useEffect(() => {
    if (sheet.open && plan.limited) void storeOffers().then(setStore);
  }, [sheet.open, plan.limited]);
  // the yearly trial as App Store Connect has it ("1 week"), or none. Until
  // the store has answered, none is promised
  const trial = store?.[YEARLY]?.trial ?? null;
  // a line said last time it was open isn't said again
  const [saidFor, setSaidFor] = useState(sheet.open);
  if (saidFor !== sheet.open) {
    setSaidFor(sheet.open);
    if (!sheet.open) setSaid("");
  }
  const priceOf = (key: "year" | "month") =>
    store?.[key === "year" ? YEARLY : MONTHLY]?.price ??
    PRICES.find((p) => p.key === key)!.price;
  const subscribe = async () => {
    setBusy(true);
    setSaid("");
    const outcome = await buy(picked === "year" ? YEARLY : MONTHLY);
    setBusy(false);
    if (outcome === "bought") setSaid("You're a Collector. Thank you!");
    if (outcome === "failed")
      setSaid("That didn't go through. You weren't charged; try again.");
  };
  const restoreIt = async () => {
    setBusy(true);
    setSaid("");
    const found = await restore().catch(() => false);
    setBusy(false);
    setSaid(
      found
        ? "Restored. You're a Collector."
        : "No Collector subscription on this Apple ID.",
    );
  };
  const collector = plan.plan === "collector";

  return (
    <Sheet
      open={sheet.open}
      onClose={hideCollector}
      // tall enough to show it all without scrolling
      maxHeight={0.94}
      contentClassName="gap-5 px-6 pb-4"
    >
      <KenjiSays {...speech(plan, sheet.reason)} />

      {/* the section's title, in the app's lettering with its red rule */}
      <View className="mt-2">
        <H2>Collector</H2>
      </View>

      {plan.limited ? (
        <>
          {/* their own limits, drawn as shelves of spines that hit the end */}
          <View className="gap-3.5">
            <LimitShelf label="Series" what="series" plan={plan} />
            <LimitShelf label="Barcode scans" what="scans" plan={plan} />
            <LimitShelf label="Price alerts" what="priceAlerts" plan={plan} />
          </View>
          <Text
            style={TEXT.plain}
            className="font-body text-[14px] leading-[20px] text-ink-soft"
          >
            Collector takes the end off: no limits, plus coming soon alerts, the
            full calendar and In Japan.
          </Text>
        </>
      ) : (
        // nothing limited for them (a Collector, an early member, or where
        // there are no limits yet): their shelf with no end, and the extras
        // as the welcome screen's stamped panels
        <>
          <View className="gap-3.5">
            <OpenShelf
              label="Series"
              count={plan.used.series}
              unit="on your shelf"
            />
            <OpenShelf
              label="Barcode scans"
              count={plan.used.scans}
              unit="scanned"
            />
            <OpenShelf
              label="Price alerts"
              count={plan.used.priceAlerts}
              unit="watched"
            />
          </View>
          <View className="flex-row gap-2.5">
            <StampPanel
              stamp="Coming!"
              big="Vol. 115"
              caption="Preorder alerts"
            />
            <StampPanel
              stamp="Calendar!"
              big="Dec 12"
              caption="Every release"
            />
            <StampPanel stamp="Japan!" big="Vol. 31" caption="In Japan" />
          </View>
        </>
      )}

      {/* the prices, only where Collector is sold */}
      {plan.limited ? (
        <>
          <View className="mt-1.5 flex-row gap-2.5">
            {PRICES.map((p) => {
              const on = picked === p.key;
              return (
                <Tap
                  key={p.key}
                  feel="none"
                  onPress={() => setPicked(p.key)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: on }}
                  accessibilityLabel={`${p.name}, ${p.price}. ${p.note}`}
                  className={`flex-1 gap-0.5 rounded-[12px] border-2 px-3.5 py-3 ${on ? "border-accent bg-accent-wash" : "border-ink bg-card"}`}
                >
                  <Text
                    style={TEXT.bold}
                    className="font-body-semibold text-[14px] text-ink-soft"
                  >
                    {p.name}
                  </Text>
                  <Text className="font-brand pr-[4px] text-[26px] text-ink">
                    {p.price}
                    {" "}
                  </Text>
                  <Text
                    style={TEXT.plain}
                    className="font-body text-[13px] text-muted"
                  >
                    {p.key === "year" ? "Best value" : p.note}
                  </Text>
                  {/* the free trial, stamped on the yearly card as the
                      app's other stamps are (only once Apple says there is
                      one, and that this Apple ID can have it) */}
                  {p.key === "year" && trial ? (
                    <View
                      pointerEvents="none"
                      className="absolute -top-3 right-2.5 border-[1.5px] border-ink bg-accent px-1.5"
                      style={{ transform: [{ rotate: "-3deg" }] }}
                    >
                      <Text className="font-brand pr-[3px] text-[13px] tracking-[0.5px] text-on-accent uppercase">
                        {trial} free!{"\u00A0"}
                      </Text>
                    </View>
                  ) : null}
                </Tap>
              );
            })}
          </View>
          {canBuy() ? (
            <Button
              kind="primary"
              wide
              label={
                busy
                  ? "One moment…"
                  : picked === "year"
                    ? trial
                      ? `Start ${trial} free`
                      : `Subscribe for ${priceOf("year")} a year`
                    : `Subscribe for ${priceOf("month")} a month`
              }
              disabled={busy}
              onPress={() => void subscribe()}
            />
          ) : (
            <Text
              style={TEXT.plain}
              className="text-center font-body text-[14px] text-ink-soft"
            >
              Collector is bought in the iPhone app for now.
            </Text>
          )}
          {said ? (
            <Text
              style={TEXT.bold}
              className="text-center font-body-semibold text-[14px] text-ink"
            >
              {said}
            </Text>
          ) : null}
          <Text
            style={TEXT.plain}
            className="text-center font-body text-[13px] leading-[18px] text-muted"
          >
            {/* what is charged and when, said plainly (Apple asks for the
                price after a trial to be clear) */}
            {picked === "year"
              ? trial
                ? `${trial} free, then ${priceOf("year")} a year.`
                : `${priceOf("year")} a year, starting today.`
              : `${priceOf("month")} a month, starting today.`}{" "}
            Paid through the App Store and renews until you cancel in your Apple
            account settings.
            {picked === "year" && trial
              ? " Cancel before the free time ends and you won't be charged."
              : ""}
          </Text>
          {/* Restore, and the terms Apple asks to be a tap away */}
          {canBuy() ? (
            <View className="flex-row flex-wrap justify-center gap-x-5 gap-y-2">
              <Tap onPress={() => void restoreIt()} hitSlop={8}>
                <Text
                  style={TEXT.bold}
                  className="font-body-semibold text-[13px] text-accent-ink"
                >
                  Restore purchases
                </Text>
              </Tap>
              <Tap
                onPress={() => void Linking.openURL(APPLE_TERMS)}
                hitSlop={8}
              >
                <Text
                  style={TEXT.plain}
                  className="font-body text-[13px] text-ink-soft underline"
                >
                  Terms of Use
                </Text>
              </Tap>
              <Tap
                onPress={() => {
                  hideCollector();
                  router.push("/privacy");
                }}
                hitSlop={8}
              >
                <Text
                  style={TEXT.plain}
                  className="font-body text-[13px] text-ink-soft underline"
                >
                  Privacy
                </Text>
              </Tap>
            </View>
          ) : null}
        </>
      ) : (
        <>
          {collector && canBuy() ? (
            <Button
              wide
              label="Manage subscription"
              onPress={() => void Linking.openURL(MANAGE)}
            />
          ) : null}
          <Button wide label="Done" onPress={hideCollector} />
        </>
      )}
    </Sheet>
  );
}
