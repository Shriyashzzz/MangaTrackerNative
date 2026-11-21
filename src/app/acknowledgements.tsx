// Acknowledgements, as the web's pages/Acknowledgements: the services and
// tools behind Manga Tracker, where its prices come from, the fonts, and how
// its affiliate links work
import { View } from "react-native";
import Page, { H2, P, TextLink } from "@/components/Page";

type Credit = { name: string; url: string; body: string };

const DATA: Credit[] = [
  {
    name: "MangaDex",
    url: "https://mangadex.org",
    body: "Chapter and volume data behind the next release dates, and which chapters are in which volume.",
  },
  {
    name: "MangaUpdates",
    url: "https://www.mangaupdates.com",
    body: "Chapter counts, whether a series has finished, and a rating for series the others have no score for.",
  },
  {
    name: "Wikipedia",
    url: "https://www.wikipedia.org",
    body: "Which chapters are in which volume, from its chapter lists, where MangaDex doesn't say.",
  },
  {
    name: "AniList",
    url: "https://anilist.co",
    body: "Series details, scores, genres and what's trending.",
  },
  {
    name: "MyAnimeList",
    url: "https://myanimelist.net",
    body: "Series scores, through its own API.",
  },
  {
    name: "Kitsu",
    url: "https://kitsu.app",
    body: "Importing a list from a Kitsu account.",
  },
  {
    name: "Open Library",
    url: "https://openlibrary.org",
    body: "Volume details and cover images.",
  },
  {
    name: "Google Books",
    url: "https://books.google.com",
    body: "New and upcoming volumes, their release dates, covers Open Library doesn't have, and ebook prices.",
  },
];

const PRICES: Credit[] = [
  {
    name: "eBay",
    url: "https://www.ebay.com",
    body: "New and used prices, through eBay's own API.",
  },
  {
    name: "Books-A-Million",
    url: "https://www.booksamillion.com",
    body: "Prices and box sets.",
  },
  {
    name: "Better World Books",
    url: "https://www.betterworldbooks.com",
    body: "Used prices, through Impact.",
  },
];

const TOOLS: Credit[] = [
  {
    name: "ZXing",
    url: "https://github.com/zxing-js/library",
    body: "Reading barcodes with your camera on the website.",
  },
  {
    name: "sharp",
    url: "https://sharp.pixelplumbing.com",
    body: "Resizing covers so pages load fast.",
  },
  {
    name: "Expo and React Native",
    url: "https://expo.dev",
    body: "What this app is built with.",
  },
];

function CreditList({ title, credits }: { title: string; credits: Credit[] }) {
  return (
    <View className="gap-3">
      <H2>{title}</H2>
      {credits.map((credit) => (
        <View key={credit.name} className="gap-0.5">
          <TextLink href={credit.url}>{credit.name}</TextLink>
          <P muted>{credit.body}</P>
        </View>
      ))}
    </View>
  );
}

export default function Acknowledgements() {
  return (
    <Page title="Acknowledgements">
      <P>
        Manga Tracker is built on the work of these services and tools. Thank
        you.
      </P>
      <CreditList title="Manga and book data" credits={DATA} />
      <CreditList title="Prices" credits={PRICES} />
      <View className="gap-3">
        <H2>Fonts</H2>
        <P>
          Bangers, Caveat, Comic Neue, Dela Gothic One, Fraunces, IBM Plex Mono
          and IBM Plex Sans, by{" "}
          <TextLink href="https://fonts.google.com">Google Fonts</TextLink>.
        </P>
      </View>
      <View className="gap-3">
        <H2>Affiliate links</H2>
        <P>
          Some store links are affiliate links: buying through one pays Manga
          Tracker a small commission, at no extra cost to you.
        </P>
        <P>As an Amazon Associate I earn from qualifying purchases.</P>
        <P>
          As an eBay Partner Network Affiliate, I earn from qualifying
          purchases.
        </P>
        <P>
          I also earn from qualifying purchases through Bookshop.org links,
          Books-A-Million links and Better World Books links (through Impact).
        </P>
      </View>
      <CreditList title="Open-source tools" credits={TOOLS} />
      <View className="gap-3">
        <H2>Manga titles and covers</H2>
        <P>Manga titles and covers belong to their creators and publishers.</P>
      </View>
    </Page>
  );
}
