// The small pieces of the import pages (the web's pages/Import/
// BookImportParts.tsx and the page's own bits): a numbered step, the
// progress bar, the waiting dots, the files in an import, the two-step Stop
// button and the complete sets question
import Tap from "@/components/Tap";
import { useEffect, useState, type ReactNode } from "react";
import { Text, View } from "react-native";
import Button from "@/components/Button";
import { ChevronDownIcon } from "@/core/components/icons/Icons";
import { useColors } from "@/lib/colors";
import { useBookImport } from "@/store/bookImport";
import { useShelf } from "@/store/shelf";

// "1" in a ring, then what to do
export function Step({ n, children }: { n: number; children: ReactNode }) {
  return (
    <View className="flex-row gap-3">
      <View className="h-7 w-7 items-center justify-center rounded-full bg-accent">
        <Text
          className="font-body-semibold text-[14px] text-on-accent"
          style={{
            lineHeight: 18,
            textAlign: "center",
            includeFontPadding: false,
          }}
        >
          {n}
        </Text>
      </View>
      <View className="min-w-0 flex-1 gap-2 pt-[3px]">{children}</View>
    </View>
  );
}

export const Note = ({ children }: { children: ReactNode }) => (
  <Text className="font-body text-[14.5px] leading-[21px] text-ink-soft">
    {children}
  </Text>
);
export const Problem = ({ children }: { children: ReactNode }) => (
  <Text
    accessibilityRole="alert"
    className="font-body-medium text-[14px] text-accent"
  >
    {children}
  </Text>
);

// how far an import has gone, out of its whole
export function ProgressBar({ done, of }: { done: number; of: number }) {
  const percent = Math.min(100, (done / Math.max(of, 1)) * 100);
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: of, now: done }}
      className="h-2 overflow-hidden rounded-full bg-line-soft"
    >
      <View className="h-full bg-accent" style={{ width: `${percent}%` }} />
    </View>
  );
}

// three dots, one more every half second, after "waiting a moment"
export function WaitingDots() {
  const [shown, setShown] = useState(1);
  useEffect(() => {
    const timer = setInterval(() => setShown((n) => (n % 3) + 1), 500);
    return () => clearInterval(timer);
  }, []);
  return <Text>{".".repeat(shown)}</Text>;
}

export function FilesInImport({ names }: { names: string[] }) {
  const c = useColors();
  const [open, setOpen] = useState(false);
  return (
    <View>
      <Tap
        onPress={() => setOpen(!open)}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        className="flex-row items-center gap-1 self-start py-1"
      >
        <Text className="font-body-medium text-[14px] text-ink-soft border-b pb-[2px] border-ink-soft self-start">
          {names.length} {names.length === 1 ? "file" : "files"} in this import
        </Text>
        <View style={{ transform: [{ rotate: open ? "180deg" : "0deg" }] }}>
          <ChevronDownIcon color={c.inkSoft} width={16} height={16} />
        </View>
      </Tap>
      {open
        ? names.map((name) => (
            <Text
              key={name}
              className="pl-3 font-mono text-[13px] leading-[20px] text-ink-soft"
            >
              {name}
            </Text>
          ))
        : null}
    </View>
  );
}

const CONFIRM_FOR_MS = 5000;

// Stop (or Cancel) asks once, then forgets the question after a few seconds
export function StopButton({ cancel = false }: { cancel?: boolean }) {
  const [asking, setAsking] = useState(false);
  useEffect(() => {
    if (!asking) return;
    const timer = setTimeout(() => setAsking(false), CONFIRM_FOR_MS);
    return () => clearTimeout(timer);
  }, [asking]);
  if (!asking)
    return (
      <Button
        small
        label={cancel ? "Cancel import" : "Stop import"}
        onPress={() => setAsking(true)}
      />
    );
  return (
    <View className="gap-2">
      <Text className="font-body-medium text-[14px] text-ink">
        {cancel ? "Cancel and clear the list?" : "Stop and clear?"}
      </Text>
      <View className="flex-row gap-2">
        <Button
          small
          kind="danger"
          label="Yes"
          onPress={() => useBookImport.getState().stop()}
        />
        <Button
          small
          label={cancel ? "Keep it" : "Keep going"}
          onPress={() => setAsking(false)}
        />
      </View>
    </View>
  );
}

// new series that are complete sets: were they read?
export function CompleteSets({ ids }: { ids: number[] }) {
  const [state, setState] = useState<"asking" | "saving" | "done" | "left">(
    "asking",
  );
  const [failed, setFailed] = useState(false);
  if (!ids.length || state === "left") return null;
  const count = ids.length === 1 ? "1 series is a" : `${ids.length} series are`;
  if (state === "done") return <Note>Marked finished.</Note>;
  const markFinished = async () => {
    setState("saving");
    setFailed(false);
    const moved = await useShelf.getState().moveMany(ids, "finished");
    if (moved) setState("done");
    else {
      setFailed(true);
      setState("asking");
    }
  };
  return (
    <View className="gap-3 rounded-[4px] border-[1.5px] border-line-soft bg-card p-3">
      <Note>
        {count} complete {ids.length === 1 ? "set" : "sets"}: you own every
        volume. Have you read {ids.length === 1 ? "it" : "them"}?
      </Note>
      <View className="flex-row flex-wrap gap-2">
        <Button
          small
          kind="primary"
          disabled={state === "saving"}
          label={`Mark ${ids.length === 1 ? "it" : "them"} finished`}
          onPress={() => void markFinished()}
        />
        <Button
          small
          label="Leave as Reading"
          onPress={() => setState("left")}
        />
      </View>
      {failed ? <Problem>That didn't save. Try again.</Problem> : null}
    </View>
  );
}
