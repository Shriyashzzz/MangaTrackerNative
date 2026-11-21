// What readers say of a volume (the web's reviews/VolumeReviews.tsx, with
// ReviewScore and ReviewItem): the score and its spread, their own review
// with Edit and Delete, the others with spoilers inked out until tapped,
// Spoiler? and Report, and the way to write one (if they've read it)
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { timeAgo } from "@/core/lib/prices";
import {
  deleteReview,
  flagReview,
  saveReview,
  type Review,
  type VolumeReviews as Data,
} from "@/core/lib/reviews";
import {
  barWidth,
  scoreText,
  whoRated,
  writtenText,
} from "@/core/pages/Prices/reviews/reviewText";
import Button from "../Button";
import ReviewForm from "../ReviewForm";
import StarRating from "../StarRating";

const FIRST = 5;
const STEP = 10;

function ReviewScore({
  average,
  count,
  spread,
}: {
  average: number;
  count: number;
  spread: number[];
}) {
  return (
    <View className="flex-row items-center gap-5">
      <View className="items-center">
        <Text className="font-brand pr-1 text-[34px] leading-[36px] text-ink">
          {scoreText(average)}
          <Text className="text-[16px] text-muted"> / 5</Text>
        </Text>
        <StarRating value={Math.round(average)} />
        <Text className="font-mono text-[11.5px] text-muted">
          {whoRated(count)}
        </Text>
      </View>
      <View
        className="flex-1 gap-0.5"
        accessibilityLabel="How many readers gave each rating"
      >
        {[5, 4, 3, 2, 1].map((stars) => {
          const amount = spread[stars - 1] ?? 0;
          return (
            <View key={stars} className="flex-row items-center gap-2">
              <Text className="w-3 font-mono text-[11px] text-muted">
                {stars}
              </Text>
              <View className="h-1.5 flex-1 overflow-hidden rounded-full bg-line-soft">
                <View
                  className="h-full bg-star"
                  style={{
                    width: amount
                      ? (barWidth(amount, spread) as `${number}%`)
                      : 0,
                  }}
                />
              </View>
              <Text className="w-5 text-right font-mono text-[11px] text-muted">
                {amount}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

function ReviewItem({
  review,
  hasRead,
  mayFlag,
}: {
  review: Review;
  hasRead: boolean;
  mayFlag: boolean;
}) {
  const [revealed, setRevealed] = useState(false);
  const [sent, setSent] = useState<{ spoiler?: boolean; report?: boolean }>({});
  const [failed, setFailed] = useState(false);
  const flag = async (kind: "spoiler" | "report") => {
    setFailed(false);
    if (await flagReview(review.id, kind))
      setSent((before) => ({ ...before, [kind]: true }));
    else setFailed(true);
  };
  const inkedOut = review.spoiler && !hasRead && !revealed;
  const link = "font-body text-[12.5px] text-muted underline";
  return (
    <View className="gap-1.5 border-b border-dotted border-line-soft py-3">
      <View className="flex-row flex-wrap items-center gap-x-2 gap-y-1">
        <Text className="font-body-semibold text-[14.5px] text-ink">
          {review.by}
        </Text>
        <StarRating value={review.rating} />
        <Text className="ml-auto font-mono text-[11.5px] text-muted">
          {writtenText(review.writtenAt, timeAgo)}
          {review.edited ? " · edited" : ""}
        </Text>
      </View>
      {inkedOut ? (
        <Pressable
          onPress={() => setRevealed(true)}
          className="self-start rounded-[3px] bg-ink px-3 py-2"
        >
          <Text className="font-body-semibold text-[13px] text-paper">
            Spoiler · tap to read
          </Text>
        </Pressable>
      ) : review.text ? (
        <Text className="font-body text-[14.5px] leading-[21px] text-ink">
          {review.text}
        </Text>
      ) : null}
      {mayFlag && !review.yours ? (
        <View className="flex-row flex-wrap items-center gap-3">
          {!review.spoiler ? (
            sent.spoiler ? (
              <Text className="font-body text-[12.5px] text-muted">
                Thanks, noted
              </Text>
            ) : (
              <Pressable onPress={() => void flag("spoiler")} hitSlop={6}>
                <Text className={link}>Spoiler?</Text>
              </Pressable>
            )
          ) : null}
          {sent.report ? (
            <Text className="font-body text-[12.5px] text-muted">Reported</Text>
          ) : (
            <Pressable onPress={() => void flag("report")} hitSlop={6}>
              <Text className={link}>Report</Text>
            </Pressable>
          )}
          {failed ? (
            <Text className="font-body text-[12.5px] text-accent">
              That didn't send. Try again.
            </Text>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

export default function VolumeReviews({
  isbn13,
  volumeLabel,
  data,
  reload,
}: {
  isbn13: string;
  volumeLabel: string;
  data: Data;
  reload: () => Promise<void>;
}) {
  const [writing, setWriting] = useState(false);
  const [most, setMost] = useState(FIRST);
  const [turnedAway, setTurnedAway] = useState(false);
  const [deleteFailed, setDeleteFailed] = useState(false);
  const { yours, mayWrite } = data;
  const hasRead = mayWrite === "yes";
  const others = data.reviews.filter((review) => !review.yours);
  const shown = others.slice(0, most);
  const left = others.length - shown.length;
  const startWriting = async () => {
    if (mayWrite === "not-read") await reload();
    setWriting(true);
    setTurnedAway(true);
  };
  const afterSaving = async () => {
    await reload();
    setWriting(false);
  };
  const remove = async () => {
    setDeleteFailed(false);
    if (await deleteReview(isbn13)) await reload();
    else setDeleteFailed(true);
  };
  return (
    <View className="gap-3">
      <View className="flex-row items-baseline justify-between">
        <Text className="font-brand pr-1 text-[22px] tracking-[1px] text-ink uppercase">
          What readers say
        </Text>
        {data.count > 0 && !yours && !writing ? (
          <Button
            label="Write a review"
            small
            onPress={() => void startWriting()}
          />
        ) : null}
      </View>
      {writing && hasRead ? (
        <ReviewForm
          save={(draft) => saveReview(isbn13, draft)}
          current={yours}
          onSaved={afterSaving}
          onCancel={() => setWriting(false)}
        />
      ) : null}
      {writing && turnedAway && mayWrite === "not-read" ? (
        <Text className="font-body text-[14px] text-ink-soft">
          <Text className="font-body-semibold text-ink">Read it?</Text> Mark{" "}
          {volumeLabel} as owned or read on your shelf first. Then you can
          review it.
        </Text>
      ) : null}
      {yours && !writing ? (
        <View className="gap-2 rounded-[4px] border-[1.5px] border-line bg-card p-3">
          <View className="flex-row flex-wrap items-center gap-2">
            <Text className="font-body-semibold text-[14.5px] text-ink">
              Your review
            </Text>
            <StarRating value={yours.rating} />
            <Text className="ml-auto font-mono text-[11.5px] text-muted">
              {writtenText(yours.writtenAt, timeAgo)}
            </Text>
          </View>
          {yours.text ? (
            <Text className="font-body text-[14.5px] leading-[21px] text-ink">
              {yours.text}
            </Text>
          ) : null}
          {yours.hidden ? (
            <Text className="font-body text-[13px] text-muted">
              Readers reported it. It's hidden until we've had a look.
            </Text>
          ) : null}
          <View className="flex-row items-center gap-4">
            <Pressable onPress={() => setWriting(true)} hitSlop={6}>
              <Text className="font-body-medium text-[14px] text-ink underline">
                Edit
              </Text>
            </Pressable>
            <Pressable onPress={() => void remove()} hitSlop={6}>
              <Text className="font-body-medium text-[14px] text-ink-soft underline">
                Delete
              </Text>
            </Pressable>
            {deleteFailed ? (
              <Text className="font-body text-[13px] text-accent">
                That didn't delete. Try again.
              </Text>
            ) : null}
          </View>
        </View>
      ) : null}
      {others.length === 0 && data.average === null ? (
        !writing && !yours ? (
          <View className="gap-2 rounded-[4px] border-[1.5px] border-dashed border-line-soft p-3">
            <Text className="font-body-semibold text-[15px] text-ink">
              Read this one?
            </Text>
            <Text className="font-body text-[14px] text-ink-soft">
              Say what you thought, out of five. Reviews come from readers who
              own or have read it.
            </Text>
            <Button
              label="Write the first review"
              kind="primary"
              small
              onPress={() => void startWriting()}
            />
          </View>
        ) : null
      ) : (
        <View className="gap-2">
          {data.average !== null ? (
            <ReviewScore
              average={data.average}
              count={data.count}
              spread={data.spread}
            />
          ) : null}
          {others.length === 0 ? (
            <Text className="font-body text-[14px] text-ink-soft">
              Rated, with no written reviews yet.
            </Text>
          ) : (
            shown.map((review) => (
              <ReviewItem
                key={review.id}
                review={review}
                hasRead={hasRead}
                mayFlag={mayWrite !== "sign-in"}
              />
            ))
          )}
          {left > 0 ? (
            <Pressable onPress={() => setMost(most + STEP)} className="py-1">
              <Text className="font-body-semibold text-[14px] text-ink underline">
                Show {Math.min(STEP, left)} more
              </Text>
            </Pressable>
          ) : null}
        </View>
      )}
    </View>
  );
}
