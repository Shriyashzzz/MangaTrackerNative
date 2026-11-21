// "Your reviews", a row that opens under a series like "Your books" (the
// web's pages/Details/YourReviews.tsx): what the reader has said about each
// volume, latest first, with the way to change it. Only volumes they've
// rated: the ones still to rate are asked about one at a time (RateVolume)
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import type { WrittenReview } from "@/core/lib/reviews";
import FoldRow from "./FoldRow";
import StarRating from "./StarRating";

// how many rows show at first, and how many each press adds
const STEP = 5;

export default function YourReviews({
  written,
  onEdit,
}: {
  written: WrittenReview[];
  // the page opens the review box for this one
  onEdit: (review: WrittenReview) => void;
}) {
  const [shown, setShown] = useState(STEP);
  if (!written.length) return null;
  const rows = written.slice(0, shown);
  const left = written.length - rows.length;
  return (
    <FoldRow title="Your reviews" count={written.length}>
      <View className="gap-3">
        {rows.map((one) => (
          <View
            key={one.volume}
            className="gap-1 border-b border-dotted border-line-soft pb-3"
          >
            <View className="flex-row items-center gap-3">
              <Text className="font-body-semibold text-[15px] text-ink">
                Vol. {one.volume}
              </Text>
              <StarRating value={one.review.rating} />
              <Pressable
                onPress={() => onEdit(one)}
                hitSlop={6}
                className="ml-auto"
              >
                <Text className="font-body-medium text-[14px] text-ink-soft underline">
                  {one.review.text ? "Edit" : "Add words"}
                </Text>
              </Pressable>
            </View>
            <Text
              className={`font-body text-[14.5px] ${one.review.text ? "text-ink" : "text-muted italic"}`}
            >
              {one.review.text || "No written review yet."}
            </Text>
            {one.review.hidden ? (
              <Text className="font-body text-[13px] text-muted">
                Hidden for now: readers reported it, and it's being looked at.
              </Text>
            ) : null}
          </View>
        ))}
        {left > 0 ? (
          <Pressable
            onPress={() => setShown(shown + STEP)}
            className="flex-row items-baseline gap-2 py-1"
          >
            <Text className="font-body-semibold text-[14px] text-ink underline">
              Show {Math.min(STEP, left)} more
            </Text>
            <Text className="font-mono text-[12.5px] text-muted">
              {left} left
            </Text>
          </Pressable>
        ) : null}
        <Text className="font-body text-[13px] text-muted">
          Shown on each volume's price page, under your display name.
        </Text>
      </View>
    </FoldRow>
  );
}
