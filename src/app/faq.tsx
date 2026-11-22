// The FAQ, as the web's pages/Faq: the questions people ask, grouped, each
// opening to its answer. The words are the web's own (core content/faq)
import Tap from "@/components/Tap";
import { router } from "expo-router";
import { useState } from "react";
import { Text, View } from "react-native";
import Page, { H2, P, TextLink } from "@/components/Page";
import { ChevronDownIcon } from "@/core/components/icons/Icons";
import { FAQ } from "@/core/lib/content/faq";
import { useColors } from "@/lib/colors";

export default function FaqScreen() {
  const c = useColors();
  const [open, setOpen] = useState<string | null>(null);
  return (
    <Page title="FAQ">
      <P muted>
        Short answers to what people ask most. Tap a question to open it.
      </P>
      {FAQ.map((group) => (
        <View key={group.name} className="gap-1">
          <H2>{group.name}</H2>
          {group.questions.map(({ q, a }) => {
            const on = open === q;
            return (
              <View key={q} className="border-b border-dashed border-line-soft">
                <Tap
                  onPress={() => setOpen(on ? null : q)}
                  accessibilityState={{ expanded: on }}
                  className="flex-row items-center gap-3 py-3"
                >
                  <Text className="flex-1 font-body-semibold text-[15.5px] text-ink">
                    {q}
                  </Text>
                  <View
                    style={{ transform: [{ rotate: on ? "180deg" : "0deg" }] }}
                  >
                    <ChevronDownIcon color={c.muted} width={18} height={18} />
                  </View>
                </Tap>
                {on ? (
                  <View className="pb-3">
                    <P muted>{a}</P>
                  </View>
                ) : null}
              </View>
            );
          })}
        </View>
      ))}
      <P muted>
        Want the story behind Manga Tracker?{" "}
        <TextLink onPress={() => router.push("/about")}>
          Read about Manga Tracker
        </TextLink>
        , or see{" "}
        <TextLink onPress={() => router.push("/updates")}>what's new</TextLink>.
      </P>
    </Page>
  );
}
