// Their name, picture and sharing (the web's ProfileTab): the display name
// people with their link see (with "Surprise me"), the picture from the
// cast, and Share my list with what it includes and its link, shared
// through the phone's own share sheet
import * as Clipboard from "expo-clipboard";
import {
  useEffect,
  useRef,
  useState,
  type ComponentRef,
  type RefObject,
} from "react";
import {
  Linking,
  Pressable,
  ScrollView,
  Share,
  Text,
  View,
  type LayoutChangeEvent,
} from "react-native";
import { shareUrl, type Account } from "@/core/lib/account";
import {
  AVATARS,
  AVATARS_SHOWN_FIRST,
  DEFAULT_AVATAR,
} from "@/core/lib/content/avatars";
import { useAccount } from "@/store/account";
import Avatar from "../Avatar";
import Button from "../Button";
import { Input } from "../Field";
import { Help, Note, Section, Tick } from "./parts";

type NoteOf = {
  where: "name" | "picture" | "share";
  text: string;
  failed?: boolean;
};

export default function ProfileTab({
  account,
  scrollTo,
  page,
}: {
  account: Account;
  scrollTo?: "share";
  // the settings page's scroll, to bring the share section into view
  page: RefObject<ComponentRef<typeof ScrollView> | null>;
}) {
  const saveAccount = useAccount((s) => s.save);
  const [name, setName] = useState(account.displayName ?? "");
  const [note, setNote] = useState<NoteOf | null>(null);
  const [copied, setCopied] = useState(false);
  const [allPictures, setAllPictures] = useState(false);
  const shareY = useRef(0);

  const save = async (
    where: NoteOf["where"],
    patch: Parameters<typeof saveAccount>[0],
    saved = "Saved.",
  ) => {
    setNote(null);
    try {
      await saveAccount(patch);
      setNote({ where, text: saved });
    } catch (e) {
      setNote({ where, text: (e as Error).message, failed: true });
    }
  };
  const noteFor = (where: NoteOf["where"]) => (
    <Note
      text={note?.where === where ? note.text : null}
      failed={note?.failed}
    />
  );
  const unsavedName = name.trim() !== (account.displayName ?? "");
  const surpriseMe = () => {
    const others = account.nameIdeas.filter((idea) => idea !== name);
    setName(others[Math.floor(Math.random() * others.length)] ?? name);
    setNote(null);
  };
  const chosen = account.avatar ?? DEFAULT_AVATAR;
  const firstPictures = AVATARS.slice(0, AVATARS_SHOWN_FIRST);
  const pictures = allPictures
    ? AVATARS
    : firstPictures.some((a) => a.id === chosen)
      ? firstPictures
      : [
          ...firstPictures.slice(0, -1),
          ...AVATARS.filter((a) => a.id === chosen),
        ];
  const morePictures = AVATARS.length - AVATARS_SHOWN_FIRST;
  const link = account.shareCode ? shareUrl(account.shareCode) : "";
  const shareLink = async () => {
    if (!link) return;
    await Share.share({ message: link, url: link }).catch(() => {});
  };
  const copyLink = async () => {
    if (!link) return;
    await Clipboard.setStringAsync(link);
    setCopied(true);
  };
  useEffect(() => {
    if (scrollTo === "share")
      setTimeout(
        () => page.current?.scrollTo({ y: shareY.current, animated: true }),
        300,
      );
  }, [scrollTo]);

  return (
    <View className="gap-7">
      <Text className="font-display text-[26px] text-ink">
        {account.displayName || account.defaultName}
      </Text>
      <Section title="Your name">
        <Input
          value={name}
          maxLength={40}
          placeholder={account.defaultName}
          onChangeText={(next) => {
            setName(next);
            setNote(null);
          }}
          accessibilityLabel="Display name"
        />
        <Help>
          People with your link see this name.
          {!account.displayName
            ? ` Leave it empty to stay ${account.defaultName}.`
            : ""}{" "}
          Your username stays private.
        </Help>
        <View className="flex-row flex-wrap items-center gap-3">
          <Button
            label="Save name"
            kind="primary"
            small
            onPress={() =>
              void save("name", { displayName: name.trim() || null })
            }
          />
          <Button label="Surprise me" small onPress={surpriseMe} />
          {unsavedName && !note ? (
            <Text className="font-body text-[13px] text-muted">
              Not saved yet
            </Text>
          ) : null}
        </View>
        {noteFor("name")}
      </Section>
      <Section title="Your picture">
        <View
          className="flex-row flex-wrap gap-3"
          accessibilityRole="radiogroup"
        >
          {pictures.map((avatar) => {
            const on = chosen === avatar.id;
            return (
              <Pressable
                key={avatar.id}
                onPress={() => void save("picture", { avatar: avatar.id })}
                accessibilityRole="radio"
                accessibilityState={{ checked: on }}
                accessibilityLabel={avatar.label}
                className="w-[30%] items-center gap-1"
              >
                <Avatar id={avatar.id} size={72} border={on ? 3 : 2} />
                <Text
                  numberOfLines={1}
                  className={`text-center text-[12.5px] ${on ? "font-body-semibold text-ink" : "font-body text-ink-soft"}`}
                >
                  {avatar.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <Pressable
          onPress={() => setAllPictures(!allPictures)}
          hitSlop={6}
          className="self-start"
        >
          <Text className="font-body-medium text-[14px] text-ink underline">
            {allPictures ? "Show fewer" : `Show ${morePictures} more`}
          </Text>
        </Pressable>
        {noteFor("picture")}
      </Section>
      <View
        onLayout={(e: LayoutChangeEvent) =>
          (shareY.current = e.nativeEvent.layout.y)
        }
      >
        <Section title="Share your list">
          <Help>Anyone with your link sees:</Help>
          {[
            "Your name and picture",
            "Each series, with your chapter and rating",
            "The volumes you own",
          ].map((line) => (
            <Text key={line} className="font-body text-[14px] text-ink-soft">
              {"  •  "}
              {line}
            </Text>
          ))}
          <Tick
            label="Share my list"
            value={account.shareEnabled}
            onChange={(on) => {
              setCopied(false);
              void save(
                "share",
                { shareEnabled: on },
                on ? "Your list is shared." : "Your list is private again.",
              );
            }}
          />
          {account.shareEnabled ? (
            <>
              <Tick
                label="Include my notes"
                value={account.shareNotes}
                onChange={(on) =>
                  void save(
                    "share",
                    { shareNotes: on },
                    on ? "Your notes are shared." : "Your notes are private.",
                  )
                }
              />
              <Tick
                label="Show my star ratings"
                value={account.shareRatings}
                onChange={(on) =>
                  void save(
                    "share",
                    { shareRatings: on },
                    on
                      ? "Your ratings are shared."
                      : "Your ratings are private.",
                  )
                }
              />
              <Tick
                label="Show how far I've read"
                value={account.shareProgress}
                onChange={(on) =>
                  void save(
                    "share",
                    { shareProgress: on },
                    on
                      ? "How far you've read is shared."
                      : "How far you've read is private.",
                  )
                }
              />
            </>
          ) : null}
          {noteFor("share")}
          {account.shareEnabled && account.shareCode ? (
            <View className="gap-2">
              <Text selectable className="font-mono text-[13px] text-ink">
                {link}
              </Text>
              <View className="flex-row flex-wrap gap-3">
                <Button
                  label="Share link"
                  kind="primary"
                  small
                  onPress={() => void shareLink()}
                />
                <Button
                  label={copied ? "Copied" : "Copy link"}
                  small
                  onPress={() => void copyLink()}
                />
                <Button
                  label="Preview"
                  small
                  onPress={() => void Linking.openURL(link)}
                />
              </View>
            </View>
          ) : null}
        </Section>
      </View>
    </View>
  );
}
