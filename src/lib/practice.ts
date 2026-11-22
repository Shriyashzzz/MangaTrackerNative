// The practice shelf ("Try it first"): the website's own practice account
// (core lib/demo.ts), run in the app. While it's on, every request is
// answered by that code from a made-up shelf kept in memory, and the real
// server is never told anything. Nothing of it outlives the app being closed.
//
// Starting it signs "the practice account" in, so every screen works as it
// does for a reader; leaving it signs out and throws its data away
import { router } from "expo-router";
import { API_URL } from "@/core/lib/api";
import { endDemo, isDemo, startDemo, type DemoKind } from "@/core/lib/demo";
import { useAuth } from "@/store/auth";
import { useTour } from "@/store/tour";
import { forgetAccountData } from "./forgetAccount";
import { whenPracticeGoes } from "./practiceBrowser";

// the practice code reaches the real server for public pages only (a
// series' prices): it reads the address from here
(globalThis as { API_URL?: string }).API_URL = API_URL;

export const inPractice = isDemo;

// The website "loads a page" to start and to end: here that's the signal
// to sign the practice account in (the shelf) or out (anywhere else)
whenPracticeGoes((to) => {
  if (isDemo()) {
    // anything left of a guest's visit goes first
    forgetAccountData();
    useAuth.setState({ isSignedIn: true });
    // Kenji's tour starts with it
    useTour.getState().start();
    router.replace("/");
    return;
  }
  useTour.getState().end();
  forgetAccountData();
  useAuth.setState({ isSignedIn: false });
  router.replace(to === "/sign-up" ? "/sign-up" : "/");
});

// the reader's small shelf, or the collector's big one
export const startPractice = (kind: DemoKind) => startDemo(false, kind);
// out of it: to the sign-up form, or back to the front of the app
export const leavePractice = (to: "/sign-up" | "/" = "/") => endDemo(to);
