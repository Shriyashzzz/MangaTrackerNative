// "Missing a book?" under an edition's tiles (the web's ReportBook): the
// book's number and the volumes it holds, sent for others to confirm
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { ChevronDownIcon } from "@/core/components/icons/Icons";
import { shownBooks, type LookupLine } from "@/core/lib/editionLookup";
import { reportBook } from "@/core/lib/editionsIndex";
import { useColors } from "@/lib/colors";
import Button from "../Button";
import { Field, Input } from "../Field";
import PickSheet from "../PickSheet";

const whole = (typed: string) =>
  /^\d+$/.test(typed.trim()) ? Number(typed) : null;

export default function ReportBook({
  seriesName,
  lines,
}: {
  seriesName: string;
  lines: LookupLine[];
}) {
  const c = useColors();
  const [open, setOpen] = useState(false);
  const [edition, setEdition] = useState(lines[0]?.key ?? "");
  const [picking, setPicking] = useState(false);
  const [number, setNumber] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [state, setState] = useState<"typing" | "sending" | "sent">("typing");
  const [problem, setProblem] = useState("");
  const line = lines.find((l) => l.key === edition) ?? lines[0];
  const last = line ? shownBooks(line).at(-1) : undefined;
  const size = last?.volumes.length ?? 3;
  const nextFrom = (last ? Math.max(...last.volumes) : 0) + 1;
  const submit = async () => {
    const n = whole(number);
    const first = whole(from);
    const final = whole(to) ?? first;
    if (!n || !first || !final || final < first || final - first > 11)
      return setProblem("Add the book's number and the volumes it holds.");
    setState("sending");
    const wrong = await reportBook({
      name: seriesName,
      edition,
      number: n,
      volumes: Array.from({ length: final - first + 1 }, (_, i) => first + i),
    }).catch(() => "That didn't send. Check your connection and try again.");
    setProblem(wrong);
    setState(wrong ? "typing" : "sent");
  };
  if (!lines.length) return null;
  return (
    <View className="gap-3">
      <Pressable
        onPress={() => setOpen(!open)}
        className="flex-row items-center gap-2 self-start"
        accessibilityState={{ expanded: open }}
      >
        <Text className="font-body-medium text-[14px] text-ink-soft border-b pb-[2px] border-ink-soft self-start">
          Missing a book?
        </Text>
        <View style={{ transform: [{ rotate: open ? "180deg" : "0deg" }] }}>
          <ChevronDownIcon color={c.muted} width={14} height={14} />
        </View>
      </Pressable>
      {!open ? null : state === "sent" ? (
        <Text className="font-body text-[14px] text-ink-soft">
          Thanks. It shows here once three readers say the same, or once it's
          checked.
        </Text>
      ) : (
        <View className="gap-3">
          {lines.length > 1 ? (
            <Field label="Edition">
              <Pressable
                onPress={() => setPicking(true)}
                className="min-h-[46px] flex-row items-center justify-between rounded-[2px] border-[1.5px] border-line-soft bg-paper px-3"
              >
                <Text className="font-body text-[16px] text-ink">
                  {line?.label}
                </Text>
                <ChevronDownIcon color={c.inkSoft} width={18} height={18} />
              </Pressable>
              <PickSheet
                open={picking}
                title="Edition"
                options={lines.map((l) => ({ value: l.key, label: l.label }))}
                picked={edition}
                onPick={setEdition}
                onClose={() => setPicking(false)}
              />
            </Field>
          ) : null}
          <View className="flex-row gap-3">
            <View className="flex-1">
              <Field label="Book">
                <Input
                  keyboardType="number-pad"
                  value={number}
                  onChangeText={setNumber}
                  placeholder={String((last?.number ?? 0) + 1)}
                />
              </Field>
            </View>
            <View className="flex-1">
              <Field label="From vol.">
                <Input
                  keyboardType="number-pad"
                  value={from}
                  onChangeText={setFrom}
                  placeholder={String(nextFrom)}
                />
              </Field>
            </View>
            <View className="flex-1">
              <Field label="To vol.">
                <Input
                  keyboardType="number-pad"
                  value={to}
                  onChangeText={setTo}
                  placeholder={String(nextFrom + size - 1)}
                />
              </Field>
            </View>
          </View>
          <View className="flex-row items-center gap-3">
            <Button
              label={state === "sending" ? "Sending…" : "Send it"}
              kind="primary"
              small
              disabled={state === "sending"}
              onPress={() => void submit()}
            />
            {problem ? (
              <Text className="shrink font-body text-[13.5px] text-accent">
                {problem}
              </Text>
            ) : null}
          </View>
        </View>
      )}
    </View>
  );
}
