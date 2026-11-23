// Android's bottom sheet, as every sheet in the web app behaves
// (lib/sheetSwipe.ts, index.css .app-sheet-dialog): up from the foot of the
// screen with a handle, over a dimmed page, as tall as what's in it up to
// most of the screen. It follows the finger down and closes past a mark or
// on a quick flick, and springs back otherwise. A long list scrolls inside
// it: dragging up scrolls, dragging down once at the top closes. Built on
// @gorhom/bottom-sheet, which does that nested drag the way the system's
// own sheets do
import { BottomSheet, Group, Host, RNHostView } from "@expo/ui/swift-ui";
import {
  presentationBackground,
  presentationDragIndicator,
} from "@expo/ui/swift-ui/modifiers";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SHEET, useWide } from "@/lib/wide";
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
  BottomSheetTextInput,
  BottomSheetView,
  type BottomSheetBackdropProps,
  type BottomSheetScrollViewMethods,
} from "@gorhom/bottom-sheet";
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  BackHandler,
  Platform,
  ScrollView,
  useWindowDimensions,
} from "react-native";
import { useColors } from "@/lib/colors";

// the few paddings sheets ask for, as Tailwind classes ("px-4 pb-8"), in
// points: the sheet's content view takes plain styles only
function paddingOf(classes: string) {
  const points = (side: string) => {
    const found = classes.match(
      new RegExp(`(?:^|\\s)${side}-(\\d+(?:\\.\\d+)?)`),
    );
    return found ? Number(found[1]) * 4 : 0;
  };
  return {
    paddingHorizontal: points("px"),
    paddingTop: points("pt"),
    paddingBottom: points("pb"),
  };
}

// A text box inside a sheet has to be the sheet's own kind: that's what
// tells the sheet the keyboard is up, so it lifts itself over it (a plain
// box leaves the sheet hidden behind the keyboard). Anything that draws a
// text box asks here whether it's in one (components/Field.tsx Input)
const InSheet = createContext(false);
export const useInSheet = () => useContext(InSheet);
export const SheetTextInput = BottomSheetTextInput;

const Backdrop = (props: BottomSheetBackdropProps) => (
  <BottomSheetBackdrop
    {...props}
    appearsOnIndex={0}
    disappearsOnIndex={-1}
    opacity={0.4}
    pressBehavior="close"
  />
);

// On an iPhone or iPad the sheet is Apple's own (SwiftUI's, through Expo
// UI): it rises from the foot with the page behind it dimmed and drawn back,
// sizes itself to what it holds, swipes down to close, and is a card in the
// middle on an iPad. The app's views are hosted inside it. Elsewhere it's
// the drawn sheet below
function AppleSheet({
  open,
  onClose,
  children,
  fromTheFoot,
  maxHeight,
  contentClassName,
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  fromTheFoot: boolean;
  maxHeight: number;
  contentClassName: string;
}) {
  const c = useColors();
  const { height: screen, width } = useWindowDimensions();
  // a phone's sheet is as wide as the screen; an iPad's is a card in the
  // middle, about this wide
  // On iOS 26 and later a phone's sheet floats in from the screen's sides
  // by about this much each side
  const floatsIn =
    Platform.OS === "ios" && Number(Platform.Version) >= 26 ? 10 : 0;
  const sheetWidth = width >= 700 ? Math.min(width, 580) : width - floatsIn * 2;
  const padding = paddingOf(contentClassName);
  // the sheet's width, once laid out
  const [room, setRoom] = useState(0);
  // closed by a swipe or a tap outside: said once, as a drawn sheet says it
  const closedBy = useRef(false);
  return (
    // (the host takes no room on the page, but is as wide as a sheet can
    // be: the views inside are laid out within its width)
    <Host style={{ position: "absolute", width: sheetWidth, height: 0 }}>
      <BottomSheet
        isPresented={open}
        onIsPresentedChange={(shown) => {
          if (!shown && !closedBy.current) {
            closedBy.current = true;
            onClose();
          }
          if (shown) closedBy.current = false;
        }}
        fitToContents
      >
        {/* the whole sheet in the app's card colour, grab handle and the
            strip by the home indicator too: no grey edge round the page's
            own views */}
        <Group
          modifiers={[
            presentationBackground(c.card),
            presentationDragIndicator("visible"),
          ]}
        >
          <RNHostView
            matchContents={{ vertical: true }}
            // the width Apple gives the sheet (a floating sheet sits in from
            // the screen's edges): the views inside are laid out to it
            onLayout={(e) => setRoom(e.nativeEvent.layout.width)}
          >
            <GestureHandlerRootView
              // as wide as the sheet Apple draws, never wider (its width is
              // the host's; only the height follows what's inside)
              style={{ width: "100%", backgroundColor: c.card }}
            >
              <ScrollView
                style={{ width: "100%", maxHeight: screen * maxHeight }}
                contentContainerStyle={{
                  ...padding,
                  // as wide as the sheet and no wider, so long lines wrap
                  // rather than push the sheet's views past its edge
                  width: Math.min(room || sheetWidth, sheetWidth),
                  paddingTop: (padding.paddingTop ?? 0) + 22,
                  // room under the last thing, clear of the sheet's rounded
                  // foot and the home bar
                  paddingBottom: (padding.paddingBottom ?? 0) + 18,
                  ...(fromTheFoot
                    ? { flexGrow: 1, justifyContent: "flex-end" as const }
                    : {}),
                }}
                keyboardShouldPersistTaps="handled"
                // short ones don't bounce: they're not lists
                alwaysBounceVertical={false}
              >
                {children}
              </ScrollView>
            </GestureHandlerRootView>
          </RNHostView>
        </Group>
      </BottomSheet>
    </Host>
  );
}

export default function Sheet({
  open,
  onClose,
  children,
  // its own scroll inside (most sheets); false when the children scroll
  scroll = true,
  // the list opens scrolled to its foot (rows stacked up from it)
  fromTheFoot = false,
  // as tall as the menu sheet at most, so no sheet ever fills the screen
  maxHeight = 0.7,
  contentClassName = "px-4 pb-8",
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  scroll?: boolean;
  fromTheFoot?: boolean;
  maxHeight?: number;
  contentClassName?: string;
}) {
  if (Platform.OS === "ios")
    return (
      <AppleSheet
        open={open}
        onClose={onClose}
        fromTheFoot={fromTheFoot}
        maxHeight={maxHeight}
        contentClassName={contentClassName}
      >
        {children}
      </AppleSheet>
    );
  return (
    <DrawnSheet
      open={open}
      onClose={onClose}
      scroll={scroll}
      fromTheFoot={fromTheFoot}
      maxHeight={maxHeight}
      contentClassName={contentClassName}
    >
      {children}
    </DrawnSheet>
  );
}

// Android's: the app's own sheet, drawn by the bottom sheet library
function DrawnSheet({
  open,
  onClose,
  children,
  scroll,
  fromTheFoot,
  maxHeight,
  contentClassName,
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  scroll: boolean;
  fromTheFoot: boolean;
  maxHeight: number;
  contentClassName: string;
}) {
  const c = useColors();
  const { height: screen } = useWindowDimensions();
  const sideInset = useWide().sideFor(SHEET);
  const sheet = useRef<BottomSheetModal>(null);
  const list = useRef<BottomSheetScrollViewMethods>(null);
  // in the tree only while it's up: a closed modal left mounted goes on
  // taking the taps meant for the page under it. It mounts when asked to
  // open, presents itself, and leaves once its closing slide has finished
  const [mounted, setMounted] = useState(open);
  // asked to open: in the tree from this render on
  if (open && !mounted) setMounted(true);
  useEffect(() => {
    if (!open) sheet.current?.dismiss();
  }, [open]);
  useEffect(() => {
    if (mounted) sheet.current?.present();
  }, [mounted]);
  useEffect(() => {
    if (!mounted || !fromTheFoot) return;
    const toFoot = () => list.current?.scrollToEnd({ animated: false });
    const timers = [60, 250, 500].map((ms) => setTimeout(toFoot, ms));
    return () => timers.forEach(clearTimeout);
  }, [mounted, fromTheFoot]);
  // Android's back closes the sheet, not the page under it
  useEffect(() => {
    if (!mounted) return;
    const back = BackHandler.addEventListener("hardwareBackPress", () => {
      sheet.current?.dismiss();
      return true;
    });
    return () => back.remove();
  }, [mounted]);
  if (!mounted) return null;

  const padding = paddingOf(contentClassName);
  return (
    <BottomSheetModal
      ref={sheet}
      enableDynamicSizing
      maxDynamicContentSize={screen * maxHeight}
      enablePanDownToClose
      onDismiss={() => {
        setMounted(false);
        onClose();
      }}
      backdropComponent={Backdrop}
      // on a wide screen, a card in the middle rather than a drawer as wide
      // as the screen (lib/wide.ts)
      style={sideInset ? { marginHorizontal: sideInset } : undefined}
      backgroundStyle={{
        backgroundColor: c.card,
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
      }}
      handleIndicatorStyle={{
        backgroundColor: c.lineSoft,
        width: 32,
        height: 4,
      }}
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
    >
      <InSheet.Provider value>
        {scroll ? (
          <BottomSheetScrollView
            ref={list}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={
              fromTheFoot
                ? { ...padding, flexGrow: 1, justifyContent: "flex-end" }
                : padding
            }
            onContentSizeChange={() => {
              if (fromTheFoot) list.current?.scrollToEnd({ animated: false });
            }}
          >
            {children}
          </BottomSheetScrollView>
        ) : (
          <BottomSheetView style={{ ...padding, flex: 1 }}>
            {children}
          </BottomSheetView>
        )}
      </InSheet.Provider>
    </BottomSheetModal>
  );
}
