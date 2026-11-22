// Something Kenji points at on his tour (store/tour.ts). While his step is
// about it, it's ringed in the accent so the eye finds it, and the page is
// scrolled so it sits in the upper part of the screen, clear of Kenji at
// the foot. Where the page can't scroll that far (a short page), Kenji is
// told to sit at the top instead. The names are the website's own (its
// data-tour marks), so his script needs no changes. With no tour on, it's
// just its children
import { useEffect, useRef, type ComponentRef, type ReactNode } from "react";
import { useWindowDimensions, View } from "react-native";
import { scrollTourBy } from "@/lib/tourScroll";
import { useTour, useTourTarget } from "@/store/tour";

// where the top of the thing should sit, as a share of the screen's height
const SIT_AT = 0.2;
// Kenji's bubble takes about this much of the foot of the screen
const KENJI_TAKES = 0.34;
// a page just opened needs a moment before it can be measured or scrolled
const SETTLE_MS = 450;

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
    const seat = () =>
      box.current?.measureInWindow(
        (_x: number, y: number, _w: number, height: number) => {
          // still under where Kenji sits: he moves to the top
          useTour.getState().sit(y + height > screen * (1 - KENJI_TAKES));
        },
      );
    const bring = setTimeout(() => {
      box.current?.measureInWindow((_x: number, y: number) => {
        const off = y - screen * SIT_AT;
        if (Math.abs(off) > 24) scrollTourBy(off);
        setTimeout(seat, SETTLE_MS);
      });
    }, SETTLE_MS);
    return () => clearTimeout(bring);
  }, [pointedAt, screen]);
  return (
    <View
      ref={box}
      collapsable={false}
      className={`${className} ${pointedAt ? "rounded-[10px] bg-accent-wash outline-2 outline-offset-4 outline-accent" : ""}`}
    >
      {children}
    </View>
  );
}
