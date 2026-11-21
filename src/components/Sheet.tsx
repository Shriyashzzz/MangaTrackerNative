// Android's bottom sheet, as every sheet in the web app behaves
// (lib/sheetSwipe.ts, index.css .app-sheet-dialog): up from the foot of the
// screen with a handle, over a dimmed page, as tall as what's in it up to
// most of the screen. It follows the finger down and closes past a mark or
// on a quick flick, and springs back otherwise. A long list scrolls inside
// it: dragging up scrolls, dragging down once at the top closes. Built on
// @gorhom/bottom-sheet, which does that nested drag the way the system's
// own sheets do
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
  BottomSheetView,
  type BottomSheetBackdropProps,
  type BottomSheetScrollViewMethods,
} from "@gorhom/bottom-sheet";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useWindowDimensions } from "react-native";
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

const Backdrop = (props: BottomSheetBackdropProps) => (
  <BottomSheetBackdrop
    {...props}
    appearsOnIndex={0}
    disappearsOnIndex={-1}
    opacity={0.4}
    pressBehavior="close"
  />
);

export default function Sheet({
  open,
  onClose,
  children,
  // its own scroll inside (most sheets); false when the children scroll
  scroll = true,
  // the list opens scrolled to its foot (rows stacked up from it)
  fromTheFoot = false,
  maxHeight = 0.88,
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
  const c = useColors();
  const { height: screen } = useWindowDimensions();
  const sheet = useRef<BottomSheetModal>(null);
  const list = useRef<BottomSheetScrollViewMethods>(null);
  // in the tree only while it's up: a closed modal left mounted goes on
  // taking the taps meant for the page under it. It mounts when asked to
  // open, presents itself, and leaves once its closing slide has finished
  const [mounted, setMounted] = useState(open);
  useEffect(() => {
    if (open) setMounted(true);
    else sheet.current?.dismiss();
  }, [open]);
  useEffect(() => {
    if (mounted) sheet.current?.present();
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
      android_keyboardInputMode="adjustResize"
    >
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
    </BottomSheetModal>
  );
}
