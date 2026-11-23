// The reader's plan (server src/plan/): what a free account may do on this
// device, what's used of it, and Collector's extras. Read when signed in,
// and again after anything that counts towards a limit. A refusal from the
// server for want of Collector opens the Collector sheet (lib/api.ts)
import { create } from "zustand";
import { getJson } from "@/core/lib/api";

export type Counted = "series" | "scans" | "priceAlerts";
export type Plan = {
  plan: "free" | "collector" | "early";
  // held to the limits on this device
  limited: boolean;
  limits: Record<Counted, number> | null;
  used: Record<Counted, number>;
  soonAlerts: boolean;
  calendar: boolean;
  japan: boolean;
  // for a Collector or an early member, what their member card shows
  // (server src/plan/membership.ts); missing from an older server
  member?: Member | null;
};
export type Member = {
  since: string;
  sinceKind: "collector" | "account";
  period: "year" | "month" | null;
  until: string | null;
  renews: boolean | null;
  caughtOnSale: number;
};

// what everyone has while nothing is known: nothing locked, so a slow or
// failed answer never hides a feature
const OPEN: Plan = {
  plan: "free",
  limited: false,
  limits: null,
  used: { series: 0, scans: 0, priceAlerts: 0 },
  soonAlerts: true,
  calendar: true,
  japan: true,
};

type PlanState = {
  plan: Plan;
  // the Collector sheet: open, and what brought it up (null: from Settings)
  sheet: {
    open: boolean;
    reason: Counted | "calendar" | "japan" | null;
    n: number;
  };
  load: () => Promise<void>;
  showCollector: (reason?: PlanState["sheet"]["reason"]) => void;
  hideCollector: () => void;
  reset: () => void;
};

export const usePlan = create<PlanState>()((set) => ({
  plan: OPEN,
  sheet: { open: false, reason: null, n: 0 },
  load: async () => {
    try {
      set({ plan: await getJson<Plan>("/api/account/plan") });
    } catch {
      // kept as it was: the next load tries again
    }
  },
  // each opening is a new sheet (n): Apple's payment window can close the
  // last one without our state hearing of it, and a sheet still marked open
  // would never open again
  showCollector: (reason = null) =>
    set((s) => ({ sheet: { open: true, reason, n: s.sheet.n + 1 } })),
  hideCollector: () => set((s) => ({ sheet: { ...s.sheet, open: false } })),
  reset: () =>
    set((s) => ({
      plan: OPEN,
      sheet: { open: false, reason: null, n: s.sheet.n },
    })),
}));
