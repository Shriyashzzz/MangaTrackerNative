// What's new, as the web's pages/Updates/Updates.tsx: what's been added,
// newest first, and what's coming
import { router } from "expo-router";
import { Text, View } from "react-native";
import Button from "@/components/Button";
import Mascot from "@/components/Mascot";
import Page, { H2, H3, P } from "@/components/Page";
import { usePrefs } from "@/store/prefs";

const UPDATES = [
  {
    name: "Alerts on your phone",
    body: "Switch them on in Settings: a volume for your shelf the day it's out, and price drops on your To buy list. On iPhone, they work in the installed app.",
  },
  {
    name: "The app on your phone",
    body: "Install Manga Tracker from the menu. It opens on your shelf even with no signal, and the chapters and volumes you change offline save when you're back.",
  },
  {
    name: "A weekly email",
    body: "Switch it on in Settings for one email a week: volumes for your shelf that just came out or are due soon, and price drops on your To buy list. Quiet weeks, no email.",
  },
  {
    name: "Your shelf, by edition",
    body: "Collect a series as VIZBIG, Definitive or 3-in-1? Your shelf, your place and the New tab count in that edition's books, and say when its next one is out.",
  },
  {
    name: "Forgot your password?",
    body: "Add an email when you sign up or in Settings, and reset a forgotten password from the sign-in page.",
  },
  {
    name: "After the anime",
    body: "Finished a season? Look up the show and see which chapter of the manga to start at, which volume that's in, and what it costs.",
  },
  {
    name: "Read by volume",
    body: "Keep your place by chapter, by volume, or both. Switch it for one series on its page, or for your whole shelf in Settings.",
  },
  {
    name: "Deluxe and omnibus editions",
    body: "Tell a series which edition you collect, and the next book to buy and the cost to finish follow that edition instead of single volumes.",
  },
  {
    name: "What you've spent",
    body: "Note what you paid for each book and the day you bought it, and see what you've spent on a series and on your whole shelf. Only you can see it.",
  },
  {
    name: "Box sets up front",
    body: "A series' price page shows its box sets first, with its deluxe and omnibus books listed underneath.",
  },
  {
    name: "Upcoming Releases",
    body: "Every volume coming out for your shelf, circled on a calendar. Save the dates to Google, Apple or Outlook, one at a time or a whole month at once.",
  },
  {
    name: "A New tab that keeps up",
    body: "A big shelf's new volumes sort themselves into Next for you, A few behind and Way behind, and the tab opens straight away.",
  },
  {
    name: "What your shelf is worth",
    body: "See what your collection is worth from the prices we've recorded, and which volumes are on sale right now.",
  },
  {
    name: "Preorder upcoming volumes",
    body: "Volumes show up before they're out, with their release date and where to preorder them.",
  },
  {
    name: "Scan your volumes",
    body: "Point your phone at the barcodes on a stack of volumes and they go straight onto your shelf.",
  },
  {
    name: "Finish the series",
    body: "See what the volumes not on your shelf cost, all together.",
  },
  {
    name: "Track the volumes you own",
    body: "Mark which volumes are on your shelf, and see what's next to get.",
  },
  {
    name: "Light novels",
    body: "Add and price light novels alongside your manga.",
  },
  {
    name: "A To read list",
    body: "Save what you want to read next, from your shelf or any series' price page, and start it when you're ready.",
  },
  {
    name: "Import from more places",
    body: "Bring your list from Goodreads, AniList, Kitsu, Book Catalogue, or any CSV, alongside MyAnimeList.",
  },
];

export default function UpdatesScreen() {
  const checksOn = usePrefs((s) => s.prefs.releaseChecks !== "off");
  return (
    <Page title="What's new">
      <View className="flex-row items-center gap-4">
        <Mascot mood="happy" width={80} />
        <View className="min-w-0 flex-1 gap-1">
          <H2>New English volumes</H2>
          <P muted>See which series have a new volume or chapter out.</P>
          {checksOn ? (
            <Button
              label="Check shelf"
              small
              onPress={() => router.push("/new")}
            />
          ) : null}
        </View>
      </View>
      <View className="gap-4">
        {UPDATES.map((update) => (
          <View
            key={update.name}
            className="gap-0.5 border-b border-dashed border-line-soft pb-3"
          >
            <H3>{update.name}</H3>
            <P muted>{update.body}</P>
          </View>
        ))}
      </View>
      <View className="gap-1 rounded-[4px] border-2 border-dashed border-line p-3">
        <Text className="self-start bg-accent px-1.5 font-brand pr-1 text-[14px] tracking-[1px] text-on-accent uppercase">
          Soon!
        </Text>
        <H3>A release calendar for everyone</H3>
        <P muted>
          Every English volume coming out, week by week, whether you have a
          shelf or not.
        </P>
      </View>
    </Page>
  );
}
