// Android's bottom sheet, as every sheet in the web app behaves
// (lib/sheetSwipe.ts, index.css .app-sheet-dialog): up from the foot of the
// screen with a handle, over a dimmed page. It follows the finger down from
// its top and closes past a mark or on a quick flick, and springs back
// otherwise. Only while its list is scrolled to its top, so a long list
// still scrolls: dragging up scrolls, dragging down at the top closes
import {
  useEffect,
  useRef,
  useState,
  type ComponentRef,
  type ReactNode,
} from "react";
import {
  Animated,
  Modal,
  Pressable,
  useWindowDimensions,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from "react-native";
import {
  GestureDetector,
  ScrollView,
  usePanGesture,
} from "react-native-gesture-handler";

// how far, or how fast, a swipe closes it
const CLOSE_PX = 90;
const FLICK_PX_PER_MS = 0.6;
type Scroller = ComponentRef<typeof ScrollView>;

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
  onScrollRef,
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  scroll?: boolean;
  fromTheFoot?: boolean;
  maxHeight?: number;
  contentClassName?: string;
  onScrollRef?: (scroller: Scroller | null) => void;
}) {
  const { height: screen } = useWindowDimensions();
  const [slide] = useState(() => new Animated.Value(0));
  const [atTop, setAtTop] = useState(true);
  const dragStart = useRef(0);
  const scroller = useRef<Scroller | null>(null);
  const moved = useRef(0);
  const startedAt = useRef(0);
  useEffect(() => {
    if (open) slide.setValue(0);
  }, [open, slide]);

  const close = () => {
    Animated.timing(slide, {
      toValue: screen,
      duration: 200,
      useNativeDriver: true,
    }).start(onClose);
  };
  const pan = usePanGesture({
    // a drag down takes the sheet; a drag up is the list's own scroll
    activeOffsetY: [8, 8],
    failOffsetY: [-5, 100000],
    enabled: atTop,
    runOnJS: true,
    onActivate: () => {
      moved.current = 0;
      startedAt.current = Date.now();
    },
    onUpdate: (e) => {
      moved.current = e.translationY;
      slide.setValue(Math.max(0, e.translationY));
    },
    onFinalize: () => {
      const fast = moved.current / Math.max(1, Date.now() - startedAt.current);
      if (moved.current > CLOSE_PX || fast > FLICK_PX_PER_MS) close();
      else
        Animated.spring(slide, {
          toValue: 0,
          useNativeDriver: true,
          bounciness: 2,
        }).start();
    },
  });
  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) =>
    setAtTop(e.nativeEvent.contentOffset.y <= 1);

  return (
    <Modal
      visible={open}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable
        className="flex-1 bg-black/40"
        onPress={onClose}
        accessibilityLabel="Close"
      />
      <GestureDetector gesture={pan}>
        <Animated.View
          style={{
            transform: [{ translateY: slide }],
            maxHeight: screen * maxHeight,
          }}
          className="rounded-t-[28px] bg-card"
        >
          <View className="mt-3 mb-1 h-1 w-8 self-center rounded-full bg-line-soft" />
          {scroll ? (
            <ScrollView
              ref={(r) => {
                scroller.current = r;
                onScrollRef?.(r);
              }}
              onScroll={onScroll}
              scrollEventThrottle={32}
              overScrollMode="never"
              bounces={false}
              keyboardShouldPersistTaps="handled"
              contentContainerClassName={contentClassName}
              contentContainerStyle={
                fromTheFoot
                  ? { flexGrow: 1, justifyContent: "flex-end" }
                  : undefined
              }
              onContentSizeChange={() => {
                if (fromTheFoot && dragStart.current === 0) {
                  dragStart.current = 1;
                  scroller.current?.scrollToEnd({ animated: false });
                  setAtTop(false);
                }
              }}
            >
              {children}
            </ScrollView>
          ) : (
            children
          )}
        </Animated.View>
      </GestureDetector>
    </Modal>
  );
}
