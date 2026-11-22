// "Sales right now", across the top of the price pages (the web's
// components/deals/DealsStrip.tsx): the stores' sales, each a link, a code
// copied with a tap, hidden with its cross until the sales change
import { openOutside } from "@/lib/openOutside";
import * as Clipboard from "expo-clipboard";
import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { CloseIcon } from "@/core/components/icons/Icons";
import { getDeals, type Deal } from "@/core/lib/collector";
import { inCanada } from "@/core/lib/country";
import { useColors } from "@/lib/colors";
import { readLocal, writeLocal } from "@/lib/deviceStore";

const HIDDEN_KEY = "dealsHidden";
const idOf = (d: Deal) => `${d.store}|${d.text}|${d.ends}`;
const setId = (deals: Deal[]) => deals.map(idOf).sort().join("\n");
let asked: Promise<Deal[]> | null = null;
const loadDeals = () =>
  (asked ??= getDeals().catch(() => {
    asked = null;
    return [];
  }));

export default function DealsStrip() {
  const c = useColors();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [hidden, setHidden] = useState(() => readLocal(HIDDEN_KEY) ?? "");
  const [copied, setCopied] = useState<string | null>(null);
  useEffect(() => {
    let live = true;
    void loadDeals().then((d) => live && setDeals(d));
    return () => {
      live = false;
    };
  }, []);
  if (!deals.length || hidden === setId(deals) || inCanada()) return null;
  const copy = async (code: string) => {
    await Clipboard.setStringAsync(code);
    setCopied(code);
    setTimeout(() => setCopied((now) => (now === code ? null : now)), 2000);
  };
  return (
    <View className="gap-2 rounded-[14px] border border-line-soft bg-card px-3 py-2.5">
      <View className="flex-row items-center justify-between">
        <Text className="font-brand pr-[4px] text-[16px] tracking-[1px] text-ink uppercase">
          Sales right now
          {"\u00A0"}
        </Text>
        <Pressable
          onPress={() => {
            const id = setId(deals);
            writeLocal(HIDDEN_KEY, id);
            setHidden(id);
          }}
          hitSlop={8}
          accessibilityLabel="Hide these sales"
        >
          <CloseIcon color={c.inkSoft} width={16} height={16} />
        </Pressable>
      </View>
      {deals.map((d) => (
        <View key={idOf(d)} className="flex-row flex-wrap items-center gap-2">
          <Pressable
            onPress={() => openOutside(d.url)}
            className="min-w-0 shrink"
          >
            <Text className="font-body text-[14px] text-ink border-b pb-[2px] border-ink self-start">
              <Text className="font-body-semibold">{d.store}</Text>: {d.text}
            </Text>
          </Pressable>
          {d.code ? (
            <Pressable
              onPress={() => void copy(d.code!)}
              accessibilityLabel={`Copy code ${d.code}`}
              className="rounded-[2px] border border-dashed border-line px-1.5 py-0.5"
            >
              <Text className="font-mono-medium text-[12px] text-ink">
                {copied === d.code ? "Copied" : d.code}
              </Text>
            </Pressable>
          ) : null}
        </View>
      ))}
    </View>
  );
}
