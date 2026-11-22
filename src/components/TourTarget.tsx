// Something Kenji points at on his tour (store/tour.ts). While his step is
// about it, it's ringed in the accent, the page is scrolled so it sits near
// the top of the screen, and Kenji is told where it is so his bubble can
// sit beside it and point (components/Tour.tsx). On a step that's about
// using it (a tap on the chapter counter), using it moves the tour on. The
// names are the website's own (its data-tour marks), so his script needs no
// changes. With no tour on, it's just its children
import { useEffect, useRef, type ComponentRef, type ReactNode } from "react";
import { useWindowDimensions, View } from "react-native";
import { tourGo } from "@/lib/tourGo";
import { scrollTourBy } from "@/lib/tourScroll";
import { useTour, useTourTarget } from "@/store/tour";

// where the top of the thing should sit, as a share of the screen's height
const SIT_AT = 0.16;
// a page just opened needs a moment before it can be measured or scrolled
const SETTLE_MS = 450;
// after they've used it, a beat to see what it did before Kenji moves on
const SEEN_MS = 900;

export default function TourTarget({
  name,
  children,
  className = "",
}: {
  name: string;
  children: ReactNode;
  className?: string;
}) {
  const pointedAt = useTourTarget() === name;
  const box = useRef<ComponentRef<typeof View>>(null);
  const { height: screen } = useWindowDimensions();
  useEffect(() => {
    if (!pointedAt) return;
    const found = () =>
      box.current?.measureInWindow(
        (_x: number, y: number, _w: number, height: number) =>
          useTour.getState().point({ y, height }),
      );
    let settle: ReturnType<typeof setTimeout>;
    const bring = setTimeout(() => {
      box.current?.measureInWindow((_x: number, y: number) => {
        const off = y - screen * SIT_AT;
        if (Math.abs(off) > 24) scrollTourBy(off);
        settle = setTimeout(found, SETTLE_MS);
      });
    }, SETTLE_MS);
    return () => {
      clearTimeout(bring);
      clearTimeout(settle);
    };
  }, [pointedAt, screen]);
  // using the real thing moves on, on a step that's about using it
  const used = () => {
    const { steps, at } = useTour.getState();
    if (pointedAt && steps[at]?.tap) setTimeout(() => tourGo(1), SEEN_MS);
  };
  return (
    <View
      ref={box}
      collapsable={false}
      onTouchEnd={used}
      className={`${className} ${pointedAt ? "rounded-[10px] bg-accent-wash outline-2 outline-offset-4 outline-accent" : ""}`}
    >
      {children}
    </View>
  );
}
