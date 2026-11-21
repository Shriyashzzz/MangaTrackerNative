// The privacy policy, as the web's pages/Privacy/Privacy.tsx, word for word
import { router } from "expo-router";
import { View } from "react-native";
import Page, { H2, H3, P, TextLink } from "@/components/Page";
import { CONTACT_EMAIL } from "@/core/lib/contact";

const UPDATED = "November 19, 2026";
type Entry = { name: string; body: string };

const KEPT: Entry[] = [
  {
    name: "Your account",
    body: "Your username and your password, stored only as a secure hash. If you sign in with Google, your Google account's ID number and the email Google has verified. Your Google name is used once, to make your username.",
  },
  {
    name: "Your email, if you add one",
    body: "Added by you, or from Google if you sign in with it. Used for password reset links, and the weekly email once you say yes to it. Never shown to anyone else.",
  },
  {
    name: "Your shelf",
    body: "The series you add, the volumes you own, where you are, ratings, notes, your To buy list, what you paid for books, and your settings.",
  },
  {
    name: "Your shelf's history",
    body: "When you add a series, tick a volume, read on or finish one, with the date. It's what your year in manga is made from, and it's only shown to you.",
  },
  {
    name: "Your reviews",
    body: "Volume reviews you write, and reports you make about other reviews.",
  },
  {
    name: "Alerts on your phone",
    body: "If you switch them on: the address your browser gives for sending alerts to that device. Nothing else about the device.",
  },
  {
    name: "Signing in",
    body: "One cookie keeps you signed in for a week. There are no advertising or analytics cookies.",
  },
];
const ON_DEVICE: Entry[] = [
  {
    name: "A copy of your shelf",
    body: "So it opens without a connection. It's removed when you sign out.",
  },
  {
    name: "Changes made offline",
    body: "Kept until they can be sent, then deleted from the device.",
  },
  {
    name: "Small preferences",
    body: "Things like light or dark mode and which tab you were on.",
  },
  {
    name: "The barcode scanner",
    body: "Reads the camera on your device. The picture never leaves it; only the barcode number is used.",
  },
];
const OTHERS: Entry[] = [
  {
    name: "Railway and Cloudflare",
    body: "Host Manga Tracker and its database, and pass its traffic. Like any web host, they see your IP address.",
  },
  {
    name: "Resend",
    body: "Sends Manga Tracker's emails (password resets, confirm links, the weekly email). It sees your email address and the email.",
  },
  {
    name: "Google sign-in",
    body: "If you choose Continue with Google, Google confirms it's you and tells us your Google account's ID, name and email. Google sees that you signed in to Manga Tracker.",
  },
  {
    name: "Impact",
    body: "A script from the affiliate network Impact loads in Manga Tracker, to turn some store links into affiliate links and count them. It may set its own cookies.",
  },
  {
    name: "Stores, when you follow a link",
    body: "Amazon, eBay, Books-A-Million and the others see your visit like any visit, and an affiliate link tells them it came from here. What you do there is under their privacy policy.",
  },
  {
    name: "Cover images",
    body: "Some covers load straight from MangaDex, AniList, Open Library and Google Books, which see the request.",
  },
  {
    name: "Imports",
    body: "Importing from AniList or Kitsu asks them for that account's list. A file you import is read in your browser.",
  },
  {
    name: "Push services",
    body: "Phone alerts are delivered by your browser's own service (Google, Apple or Mozilla). They carry the alert, not your shelf.",
  },
];
const SHARED: Entry[] = [
  {
    name: "Your shared shelf",
    body: "Off until you switch it on in Settings. Anyone with its link sees what you picked to show. Switch it off and the link stops working.",
  },
  {
    name: "Reviews",
    body: "Shown with your display name and picture, never your username.",
  },
  {
    name: "Matches that help everyone",
    body: "When several readers' imports agree that a title is a certain series, the match is used for everyone. It never says whose import it came from.",
  },
];

function Section({
  title,
  lines = [],
  entries = [],
}: {
  title: string;
  lines?: string[];
  entries?: Entry[];
}) {
  return (
    <View className="gap-2">
      <H2>{title}</H2>
      {lines.map((line) => (
        <P key={line}>{line}</P>
      ))}
      {entries.map((entry) => (
        <View key={entry.name} className="gap-0.5">
          <H3>{entry.name}</H3>
          <P muted>{entry.body}</P>
        </View>
      ))}
    </View>
  );
}

export default function PrivacyScreen() {
  return (
    <Page title="Privacy policy">
      <P muted>Updated {UPDATED}</P>
      <P>
        Your shelf is yours. No ads, nothing sold, and only what Manga Tracker
        needs to work. This covers the website and the Android app, which shows
        the same site.
      </P>
      <Section title="What's kept" entries={KEPT} />
      <Section title="What stays on your device" entries={ON_DEVICE} />
      <Section
        title="What it's used for"
        lines={[
          "Only to run Manga Tracker: showing your shelf, checking for new volumes and prices, and sending the emails and alerts you ask for.",
          "It's never sold, never used for ads, and never shared with anyone except the services below, for the job each one does.",
        ]}
      />
      <Section title="Who else sees anything" entries={OTHERS} />
      <Section title="Shared only if you choose" entries={SHARED} />
      <Section
        title="Deleting your data"
        lines={[
          "Settings, Account, Delete my account removes your account and everything on your shelf for good. Download your list first if you might want it.",
          "Copies in the database's backups are replaced in time.",
          `Can't sign in? Email ${CONTACT_EMAIL} from the address on your account and it'll be deleted for you.`,
        ]}
      />
      <Section
        title="Children"
        lines={[
          "Manga Tracker isn't meant for children under 13, and doesn't knowingly keep anything about them. If you think a child has an account, email and it'll be removed.",
        ]}
      />
      <View className="gap-2">
        <H2>Questions and changes</H2>
        <P>
          Ask anything at{" "}
          <TextLink href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</TextLink>.
          If this policy changes, the date above changes with it, and big
          changes are listed on{" "}
          <TextLink onPress={() => router.push("/updates")}>
            What's new
          </TextLink>
          .
        </P>
      </View>
    </Page>
  );
}
