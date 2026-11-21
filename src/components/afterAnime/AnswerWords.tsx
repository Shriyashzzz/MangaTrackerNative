// The answer with its numbers inked in (the web's pages/AfterAnime/
// AnswerWords.tsx): "chapter 181", "volume 21" and "the whole story" in the
// accent, the rest as the line around them
import { Fragment } from "react";
import { Text } from "react-native";

const ANSWER = /((?:chapter|volume)\s\d+(?:\.\d+)?|the\swhole\sstory)/i;

export default function AnswerWords({ text }: { text: string }) {
  return text.split(ANSWER).map((piece, i) =>
    i % 2 ? (
      <Text key={i} className="font-body-semibold text-accent">
        {piece}
      </Text>
    ) : (
      <Fragment key={i}>{piece}</Fragment>
    ),
  );
}
