// The box a reader writes their review in, as the web's (pages/Prices/
// reviews/ReviewForm.tsx): stars, a few optional words, and a switch for
// spoilers. Also how they change one they've written
import TextBox from "@/components/TextBox";
import { useState } from "react";
import { Text, View } from "react-native";
import {
  MOST_WORDS,
  type Review,
  type ReviewDraft,
  type SaveResult,
} from "@/core/lib/reviews";
import { useColors } from "@/lib/colors";
import Button from "./Button";
import StarRating from "./StarRating";
import Switch from "./Switch";

export default function ReviewForm({
  save,
  current,
  onSaved,
  onCancel,
}: {
  // sends it: a book's price page and a series' page each have their own way
  save: (draft: ReviewDraft) => Promise<SaveResult>;
  // the review being changed; null for a new one
  current: Review | null;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const c = useColors();
  const [rating, setRating] = useState(current?.rating ?? 0);
  const [text, setText] = useState(current?.text ?? "");
  const [spoiler, setSpoiler] = useState(current?.spoiler ?? false);
  const [saving, setSaving] = useState(false);
  const [problem, setProblem] = useState("");

  const tooLong = text.length > MOST_WORDS;
  const post = async () => {
    if (!rating) return setProblem("Pick a rating first.");
    if (tooLong) return setProblem(`Keep it under ${MOST_WORDS} characters.`);
    setSaving(true);
    setProblem("");
    const result = await save({ rating, text, spoiler });
    setSaving(false);
    if ("problem" in result) setProblem(result.problem);
    else onSaved();
  };

  return (
    <View className="gap-3">
      <Text className="font-mono text-[12px] text-muted">Your rating</Text>
      {/* a second tap on the same star would clear it: a review needs one */}
      <StarRating
        value={rating}
        size="lg"
        onChange={(stars) => setRating(stars || rating)}
      />
      <Text className="mt-1 font-mono text-[12px] text-muted">
        A few words (optional)
      </Text>
      <TextBox
        value={text}
        onChangeText={setText}
        multiline
        placeholder="What should someone know before buying it?"
        placeholderTextColor={c.muted}
        style={{ minHeight: 96, textAlignVertical: "top" }}
        className="rounded-[2px] border-[1.5px] border-line-soft bg-paper px-3 py-2 font-body text-[16px] text-ink"
      />
      <View className="flex-row items-center justify-between gap-3">
        <View className="flex-1">
          <Switch
            label="Contains spoilers"
            value={spoiler}
            onChange={setSpoiler}
          />
        </View>
        <Text
          className={`font-mono text-[12px] ${tooLong ? "text-accent" : "text-muted"}`}
        >
          {text.length} / {MOST_WORDS}
        </Text>
      </View>
      <View className="flex-row items-center gap-4">
        <Button
          label={current ? "Save changes" : "Post review"}
          kind="primary"
          disabled={saving}
          onPress={() => void post()}
        />
        <Button label="Cancel" small onPress={onCancel} />
      </View>
      {problem ? (
        <Text className="font-body-medium text-[14px] text-accent">
          {problem}
        </Text>
      ) : null}
    </View>
  );
}
