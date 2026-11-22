// How the tour brings what Kenji is pointing at into view. A page whose
// things he points at says how it scrolls (useTourScroll); the thing
// itself, when its step comes, asks to be moved up to where it shows clear
// of Kenji (components/TourTarget.tsx). One page at a time: the one in front
import { useFocusEffect } from "expo-router";
import { useCallback, type RefObject } from "react";
import type { SharedValue } from "react-native-reanimated";

let scrollBy: ((points: number) => void) | null = null;

// moves the page in front by that many points (down the page when positive)
export const scrollTourBy = (points: number) => scrollBy?.(points);

// a page's scroller, and how far down it is now (its pull-to-refresh
// already keeps that: PullRefresh usePullTop)
type Scrollable = {
  scrollTo: (to: { y: number; animated?: boolean }) => void;
};
export function useTourScroll(
  scroller: RefObject<Scrollable | null>,
  top: SharedValue<number>,
) {
  useFocusEffect(
    useCallback(() => {
      const mine = (points: number) =>
        scroller.current?.scrollTo({
          y: Math.max(0, top.get() + points),
          animated: true,
        });
      scrollBy = mine;
      return () => {
        if (scrollBy === mine) scrollBy = null;
      };
    }, [scroller, top]),
  );
}
