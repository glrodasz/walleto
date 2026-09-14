import { createContext, useContext, useMemo } from "react";
import type { ReactNode } from "react";

/*
 * Which overlay layer the surrounding UI lives on: 0 is the page, a Modal puts
 * its children on 1, a modal opened from that modal on 2.
 *
 * Everything that floats portals onto document.body — Combobox's list,
 * KebabMenu's menu, Modal's own scrim — so they all land as siblings in the
 * root stacking context, and z-index is the only thing left to rank them. The
 * page's dropdowns belong under a modal, exactly as globals.css says; a
 * modal's *own* dropdown has to clear that modal's scrim while still staying
 * under the next one. That is a step per layer, not one global order.
 */

/** Mirrors --z-menu in styles/globals.css; keep the two in step. */
const MENU_BASE = 150;
/** Mirrors --z-overlay. */
const OVERLAY_BASE = 200;
const LAYER_STEP = 100;

export interface OverlayLayer {
  /** 0 on the page, 1 inside a modal, 2 inside a modal opened from that one. */
  depth: number;
  /** z-index for a scrim owned by this layer. */
  overlayZIndex: number;
  /** z-index for a dropdown owned by this layer. */
  menuZIndex: number;
}

const layerAt = (depth: number): OverlayLayer => ({
  depth,
  overlayZIndex: OVERLAY_BASE + depth * LAYER_STEP,
  menuZIndex: MENU_BASE + depth * LAYER_STEP,
});

// Unlike useSelectedMonth the default is a real value rather than null: "no
// provider" means "on the page", which is the right answer for almost every
// consumer, so nothing has to guard against being used outside one.
const OverlayLayerContext = createContext<OverlayLayer>(layerAt(0));

export function useOverlayLayer(): OverlayLayer {
  return useContext(OverlayLayerContext);
}

/** Everything inside renders one layer up. Modal wraps its children in this. */
export function OverlayLayerProvider({ children }: { children: ReactNode }) {
  const { depth } = useOverlayLayer();
  const value = useMemo(() => layerAt(depth + 1), [depth]);
  return <OverlayLayerContext.Provider value={value}>{children}</OverlayLayerContext.Provider>;
}
