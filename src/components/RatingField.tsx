// "Rate the series" and its five stars, as the web's RatingField: saved on
// the tap, put back when it fails
import { useState } from "react";
import { Text, View } from "react-native";
import { apiFetch } from "@/core/lib/api";
import { saveOrKeep } from "@/core/lib/offlineChanges";
import { useShelf } from "@/store/shelf";
import StarRating from "./StarRating";

export default function RatingField({
  mangaId,
  initial,
}: {
  mangaId: number;
  initial: number;
}) {
  const [rating, setRating] = useState(initial);
  const [failed, setFailed] = useState(false);

  const save = async (next: number) => {
    const previous = rating;
    setRating(next);
    setFailed(false);
    try {
      await saveOrKeep(mangaId, "rating", previous, next, () =>
        apiFetch(`/api/manga/${mangaId}/rating`, {
          method: "PATCH",
          body: { rating: next },
        }),
      );
      void useShelf.getState().load();
    } catch {
      setRating(previous);
      setFailed(true);
    }
  };

  return (
    <View className="gap-2.5">
      <Text className="font-body text-[14.5px] text-ink-soft">
        {rating ? "Your rating of the series" : "Rate the series"}
      </Text>
      <StarRating value={rating} size="lg" onChange={save} />
      {failed ? (
        <Text className="font-body-medium text-[14px] text-accent">
          That didn't save. Try again.
        </Text>
      ) : null}
    </View>
  );
}
