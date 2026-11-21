// The menu behind their picture in the top bar, as the Android app's (web
// components/settingsMenu/SettingsMenu.tsx): who's signed in and the way to
// their settings, then the pages the app has no other way to (Share my
// list, Your year, Friends, Import your list), light or dark, Canadian
// prices, What's new, FAQ, About, Privacy, and Sign out
import { router } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { useUniwind } from "uniwind";
import {
  CheckIcon,
  ChevronRightIcon,
  EyeIcon,
  ImportIcon,
  InfoIcon,
  LinkIcon,
  MoonIcon,
  ShareIcon,
  SignOutIcon,
  StarIcon,
  SunIcon,
  TagIcon,
} from "@/core/components/icons/Icons";
import { useColors } from "@/lib/colors";
import { useAccount } from "@/store/account";
import { useAuth } from "@/store/auth";
import { usePrefs } from "@/store/prefs";
import { useShelf } from "@/store/shelf";
import Avatar from "./Avatar";
import Sheet from "./Sheet";

type Icon = typeof StarIcon;

// a row of the menu: its icon and words, a tick when it's the one in force.
// Pressing one closes the menu, unless it changes something shown in it
function Item({
  icon: Icon,
  label,
  onPress,
  on,
  keepOpen = false,
  onClose,
}: {
  icon: Icon;
  label: string;
  onPress: () => void;
  on?: boolean;
  keepOpen?: boolean;
  onClose: () => void;
}) {
  const c = useColors();
  return (
    <Pressable
      onPress={() => {
        if (!keepOpen) onClose();
        onPress();
      }}
      accessibilityState={on === undefined ? undefined : { selected: on }}
      className="min-h-[44px] flex-row items-center gap-3 rounded-[3px] px-3 active:bg-accent-wash"
    >
      <Icon color={c.inkSoft} width={18} height={18} />
      <Text
        className={`flex-1 text-[15.5px] ${on ? "font-body-semibold text-ink" : "font-body text-ink-soft"}`}
      >
        {label}
      </Text>
      {on ? <CheckIcon color={c.accent} width={16} height={16} /> : null}
    </Pressable>
  );
}

const Divider = () => <View className="my-1.5 h-px bg-line-soft" />;

export default function SettingsMenu({
  open,
  onClose,
  hasYear,
}: {
  open: boolean;
  onClose: () => void;
  hasYear: boolean;
}) {
  const c = useColors();
  const { theme } = useUniwind();
  const account = useAccount((s) => s.account);
  const prefs = usePrefs((s) => s.prefs);
  const savePrefs = usePrefs((s) => s.save);
  const logOut = useAuth((s) => s.logOut);
  const name = account?.displayName || account?.username;
  const dark = theme === "dark";
  const go = (to: Parameters<typeof router.push>[0]) => {
    onClose();
    router.push(to);
  };
  return (
    <Sheet
      open={open}
      onClose={onClose}
      maxHeight={0.8}
      contentClassName="px-2 pt-2 pb-8"
    >
      {/* who's signed in, and the way to everything about them */}
      <Pressable
        onPress={() => go("/settings")}
        className="flex-row items-center gap-3 rounded-[3px] px-3 py-2 active:bg-accent-wash"
      >
        <Avatar id={account?.avatar} size={40} />
        <View className="min-w-0 flex-1">
          <Text
            numberOfLines={1}
            className="font-body-semibold text-[16px] text-ink"
          >
            {name ?? "Your profile"}
          </Text>
          <Text className="font-body text-[13px] text-ink-soft">
            Profile and settings
          </Text>
        </View>
        <ChevronRightIcon color={c.muted} width={18} height={18} />
      </Pressable>
      <Divider />
      <Item
        onClose={onClose}
        icon={ShareIcon}
        label="Share my list"
        onPress={() =>
          router.push({
            pathname: "/settings",
            params: { tab: "profile", at: "share" },
          })
        }
      />
      {/* the year and the import open on the website until the app has
              its own pages for them */}
      {hasYear ? (
        <Item
          onClose={onClose}
          icon={StarIcon}
          label="Your year in manga"
          onPress={() => router.push("/year")}
        />
      ) : null}
      <Item
        onClose={onClose}
        icon={LinkIcon}
        label="Friends"
        onPress={() => router.push("/friends")}
      />
      <Item
        onClose={onClose}
        icon={ImportIcon}
        label="Import your list"
        onPress={() => router.push("/import")}
      />
      <Divider />
      <Item
        onClose={onClose}
        icon={dark ? SunIcon : MoonIcon}
        label={dark ? "Light mode" : "Dark mode"}
        keepOpen
        onPress={() =>
          void savePrefs({ theme: dark ? "light" : "dark" }).catch(() => {})
        }
      />
      <Item
        onClose={onClose}
        icon={TagIcon}
        label="Canadian prices"
        on={prefs.country === "ca"}
        keepOpen
        onPress={() =>
          void savePrefs({
            country: prefs.country === "ca" ? "us" : "ca",
          }).catch(() => {})
        }
      />
      <Divider />
      <Item
        onClose={onClose}
        icon={StarIcon}
        label="What's new"
        onPress={() => router.push("/updates")}
      />
      <Item
        onClose={onClose}
        icon={InfoIcon}
        label="FAQ"
        onPress={() => router.push("/faq")}
      />
      <Item
        onClose={onClose}
        icon={InfoIcon}
        label="About"
        onPress={() => router.push("/about")}
      />
      <Item
        onClose={onClose}
        icon={EyeIcon}
        label="Privacy"
        onPress={() => router.push("/privacy")}
      />
      <Divider />
      <Item
        onClose={onClose}
        icon={SignOutIcon}
        label="Sign out"
        onPress={() => {
          void logOut().then(() => {
            useShelf.getState().reset();
            usePrefs.getState().reset();
            useAccount.getState().clear();
          });
        }}
      />
    </Sheet>
  );
}
