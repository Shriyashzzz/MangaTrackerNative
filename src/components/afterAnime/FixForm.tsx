// "Is this wrong? Suggest a fix" (the web's pages/AfterAnime/FixForm.tsx):
// folded away under a season's answer; the last chapter the anime covers or
// the volume to buy, where they read it, and a note. Sent to be checked
import { useState } from "react";
import { Text, View } from "react-native";
import Button from "@/components/Button";
import { Field, Input } from "@/components/Field";
import FoldRow from "@/components/FoldRow";
import { sendFix } from "@/core/lib/afterAnime";

const numberOrNull = (typed: string) =>
  typed.trim() === "" ? null : Number(typed);

export default function FixForm({
  seriesName,
  season,
  open = false,
}: {
  seriesName: string;
  // the season it's about; null when the show has no answer yet
  season: string | null;
  open?: boolean;
}) {
  const [label, setLabel] = useState(season ?? "Season 1");
  const [chapter, setChapter] = useState("");
  const [volume, setVolume] = useState("");
  const [source, setSource] = useState("");
  const [note, setNote] = useState("");
  const [state, setState] = useState<"typing" | "sending" | "sent">("typing");
  const [problem, setProblem] = useState("");

  const submit = async () => {
    if (chapter.trim() === "" && volume.trim() === "") {
      setProblem("Add the last chapter or the volume to buy.");
      return;
    }
    if (!/^https?:\/\/\S+/.test(source.trim())) {
      setProblem("Add the link where you read it.");
      return;
    }
    setState("sending");
    const wrong = await sendFix({
      name: seriesName,
      label,
      chapter: numberOrNull(chapter),
      volume: numberOrNull(volume),
      source,
      note,
    }).catch(() => "That didn't send. Check your connection and try again.");
    setProblem(wrong);
    setState(wrong ? "typing" : "sent");
  };

  let sendLabel = season ? "Send the fix" : "Send it";
  if (state === "sending") sendLabel = "Sending…";

  return (
    <FoldRow
      title={
        season
          ? "Is this wrong? Suggest a fix"
          : "Know where it leaves off? Tell us"
      }
      openAtFirst={open}
    >
      {state === "sent" ? (
        <Text className="font-body text-[14.5px] text-ink-soft">
          Thanks. It will show here once it's been checked against your link.
        </Text>
      ) : (
        <View className="gap-3">
          {!season ? (
            <Field label="Season or movie" required>
              <Input value={label} onChangeText={setLabel} maxLength={60} />
            </Field>
          ) : null}
          <View className="flex-row gap-3">
            <View className="flex-1">
              <Field label="Last chapter the anime covers">
                <Input
                  value={chapter}
                  onChangeText={setChapter}
                  keyboardType="decimal-pad"
                  placeholder="137"
                />
              </Field>
            </View>
            <View className="flex-1">
              <Field label="Volume to buy next">
                <Input
                  value={volume}
                  onChangeText={setVolume}
                  keyboardType="number-pad"
                  placeholder="16"
                />
              </Field>
            </View>
          </View>
          <Field label="Where you read it" required>
            <Input
              value={source}
              onChangeText={setSource}
              keyboardType="url"
              autoCapitalize="none"
              autoCorrect={false}
              placeholder="https://"
              maxLength={500}
            />
          </Field>
          <Field label="Anything else" optional>
            <Input value={note} onChangeText={setNote} maxLength={500} />
          </Field>
          <View className="flex-row flex-wrap items-center gap-3">
            <Button
              kind="primary"
              small
              label={sendLabel}
              disabled={state === "sending"}
              onPress={() => void submit()}
            />
            {problem ? (
              <Text
                accessibilityRole="alert"
                className="flex-1 font-body-medium text-[14px] text-accent"
              >
                {problem}
              </Text>
            ) : null}
          </View>
        </View>
      )}
    </FoldRow>
  );
}
