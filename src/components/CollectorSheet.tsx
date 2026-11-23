// Collector, the paid tier (server src/plan/): what it adds beside what a
// free account has, what they've used, and its two prices. One sheet for
// the whole app, opened from Settings or when the server says a limit is
// full (lib/api.ts). It says each thing once and asks for nothing twice.
//
// An early member is told everything is theirs. Where nothing is limited
// (Android and the website, for now) the table is shown without prices.
// Buying is through Apple and arrives with the iPhone app: until then the
// button says so rather than pretending
import { useState } from "react";
import { Text, View } from "react-native";
import { H2 } from "@/components/Page";
import Tap from "@/components/Tap";
import { usePlan, type Counted } from "@/store/plan";
import Button from "./Button";
import Sheet from "./Sheet";

// each row: what it is, a free account's share, Collector's
const ROWS: { name: string; free: string; collector: string }[] = [
  { name: "Series on your shelf", free: "100", collector: "No limit" },
  { name: "Barcode scans", free: "80", collector: "No limit" },
  { name: "Price alerts on To buy", free: "3 books", collector: "Every book" },
  { name: "Coming soon and preorder alerts", free: "No", collector: "Yes" },
  { name: "Release calendar", free: "Next one", collector: "Every one" },
  { name: "In Japan", free: "No", collector: "Yes" },
];

// why the sheet came up, said first
const BECAUSE: Record<Counted | "calendar" | "japan", string> = {
  series: "Your shelf has its 100 series.",
  scans: "You've used your 80 scans.",
  priceAlerts: "You're watching 3 prices.",
  calendar: "The full calendar is part of Collector.",
  japan: "In Japan is part of Collector.",
};

// Yearly comes with a week free (Apple's introductory offer, set on the
// product in App Store Connect); monthly starts straight away
const PRICES = [
  {
    key: "year",
    name: "Yearly",
    price: "$24.99",
    note: "7 days free first",
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

function Row({
  name,
  free,
  collector,
  first,
}: {
  name: string;
  free: string;
  collector: string;
  first?: boolean;
}) {
  return (
    <View
      className={`flex-row items-center gap-3 py-2.5 ${first ? "" : "border-t border-dotted border-line-soft"}`}
    >
      <Text
        // (wraps rather than pushing the columns off the edge)
        style={{ flex: 1, flexShrink: 1, minWidth: 0 }}
        className="font-body text-[15px] leading-[20px] text-ink"
      >
        {name}
      </Text>
      <Text className="w-[70px] text-right font-body text-[14px] text-muted">
        {free}
      </Text>
      <Text className="w-[84px] text-right font-body-semibold text-[14px] text-accent-ink">
        {collector}
      </Text>
    </View>
  );
}

export default function CollectorSheet() {
  const { plan, sheet, hideCollector } = usePlan();
  const [picked, setPicked] = useState<"year" | "month">("year");
  const early = plan.plan === "early";
  const collector = plan.plan === "collector";
  const used = (what: Counted, unit: string) =>
    plan.limits ? `${plan.used[what]} of ${plan.limits[what]} ${unit}` : null;

  return (
    <Sheet
      open={sheet.open}
      onClose={hideCollector}
      contentClassName="gap-4 px-5 pb-8"
    >
      <H2>Collector</H2>

      {early ? (
        <Text className="font-body text-[16px] leading-[23px] text-ink">
          You joined early, so everything below is yours, free, for good.
        </Text>
      ) : collector ? (
        <Text className="font-body text-[16px] leading-[23px] text-ink">
          You're a Collector. Everything below is yours.
        </Text>
      ) : (
        <View className="gap-1">
          {sheet.reason ? (
            <Text className="font-body-semibold text-[16px] leading-[23px] text-ink">
              {BECAUSE[sheet.reason]}
            </Text>
          ) : null}
          <Text className="font-body text-[15px] leading-[22px] text-ink-soft">
            {plan.limited
              ? "Everything on your shelf stays yours. Collector lifts the limits for a big collection."
              : "Nothing is limited here yet, so all of it is open to you."}
          </Text>
        </View>
      )}

      {/* free beside Collector, one thing a line */}
      <View>
        <View className="flex-row gap-3 pb-1">
          <View className="flex-1" />
          <Text className="w-[70px] text-right font-mono text-[11px] tracking-[1px] text-muted uppercase">
            Free
          </Text>
          <Text className="w-[84px] text-right font-mono text-[11px] tracking-[1px] text-accent-ink uppercase">
            Collector
          </Text>
        </View>
        {ROWS.map((row, i) => (
          <Row key={row.name} {...row} first={i === 0} />
        ))}
      </View>

      {plan.limited ? (
        <Text className="font-mono text-[12px] leading-[18px] text-muted">
          {[
            used("series", "series"),
            used("scans", "scans"),
            used("priceAlerts", "alerts"),
          ]
            .filter(Boolean)
            .join("  ·  ")}
        </Text>
      ) : null}

      {/* the prices, only where Collector is sold */}
      {plan.limited ? (
        <>
          <View className="flex-row gap-2.5">
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
                  className={`flex-1 gap-0.5 rounded-[12px] border-[1.5px] px-3.5 py-3 ${on ? "border-accent bg-accent-wash" : "border-line-soft bg-card"}`}
                >
                  <Text className="font-body-semibold text-[14px] text-ink-soft">
                    {p.name}
                  </Text>
                  <Text className="font-brand pr-[4px] text-[26px] text-ink">
                    {p.price}
                    {" "}
                  </Text>
                  <Text className="font-body text-[13px] text-muted">
                    {p.note}
                  </Text>
                </Tap>
              );
            })}
          </View>
          <Button
            kind="primary"
            label="Subscriptions open soon"
            disabled
            onPress={() => {}}
          />
          <Text className="text-center font-body text-[13px] leading-[18px] text-muted">
            {/* what is charged and when, said plainly (Apple asks for the
                price after a trial to be clear) */}
            {PRICES.find((p) => p.key === picked)!.after} Paid through the App
            Store and renews until you cancel in your Apple account settings.
            {picked === "year"
              ? " Cancel before the week ends and you won't be charged."
              : ""}
          </Text>
        </>
      ) : (
        <Button label="Done" onPress={hideCollector} />
      )}
    </Sheet>
  );
}
