// Each profile picture as a small image, for the Me tab on an iPhone:
// Apple's tab bar takes images, not drawings. Made from the website's own
// drawings (components/avatar), in full colour; remake them if one changes
import type { ImageSourcePropType } from "react-native";
import { DEFAULT_AVATAR } from "@/core/lib/content/avatars";

const ICONS: Record<string, ImageSourcePropType> = {
  bookmark: require("../../assets/images/avatar-tabs/bookmark.png"),
  bubble: require("../../assets/images/avatar-tabs/bubble.png"),
  cat: require("../../assets/images/avatar-tabs/cat.png"),
  cool: require("../../assets/images/avatar-tabs/cool.png"),
  crying: require("../../assets/images/avatar-tabs/crying.png"),
  dango: require("../../assets/images/avatar-tabs/dango.png"),
  daruma: require("../../assets/images/avatar-tabs/daruma.png"),
  edgy: require("../../assets/images/avatar-tabs/edgy.png"),
  ghost: require("../../assets/images/avatar-tabs/ghost.png"),
  grandma: require("../../assets/images/avatar-tabs/grandma.png"),
  ink: require("../../assets/images/avatar-tabs/ink.png"),
  kappa: require("../../assets/images/avatar-tabs/kappa.png"),
  kenji: require("../../assets/images/avatar-tabs/kenji.png"),
  kitsune: require("../../assets/images/avatar-tabs/kitsune.png"),
  librarian: require("../../assets/images/avatar-tabs/librarian.png"),
  lost: require("../../assets/images/avatar-tabs/lost.png"),
  mangaka: require("../../assets/images/avatar-tabs/mangaka.png"),
  master: require("../../assets/images/avatar-tabs/master.png"),
  nib: require("../../assets/images/avatar-tabs/nib.png"),
  nook: require("../../assets/images/avatar-tabs/nook.png"),
  onemore: require("../../assets/images/avatar-tabs/onemore.png"),
  oni: require("../../assets/images/avatar-tabs/oni.png"),
  onigiri: require("../../assets/images/avatar-tabs/onigiri.png"),
  panic: require("../../assets/images/avatar-tabs/panic.png"),
  punk: require("../../assets/images/avatar-tabs/punk.png"),
  ramen: require("../../assets/images/avatar-tabs/ramen.png"),
  regular: require("../../assets/images/avatar-tabs/regular.png"),
  rival: require("../../assets/images/avatar-tabs/rival.png"),
  shock: require("../../assets/images/avatar-tabs/shock.png"),
  strategist: require("../../assets/images/avatar-tabs/strategist.png"),
  tanuki: require("../../assets/images/avatar-tabs/tanuki.png"),
  tea: require("../../assets/images/avatar-tabs/tea.png"),
  threeam: require("../../assets/images/avatar-tabs/threeam.png"),
  tower: require("../../assets/images/avatar-tabs/tower.png"),
  training: require("../../assets/images/avatar-tabs/training.png"),
  twintails: require("../../assets/images/avatar-tabs/twintails.png"),
};

export const avatarTabIcon = (id: string | null | undefined) =>
  ICONS[id ?? DEFAULT_AVATAR] ?? ICONS[DEFAULT_AVATAR]!;
