import dynamic from "next/dynamic";

/**
 * Per-bar overrides for recharts (a lighter fill for the month in progress, a
 * dimmed one for the months that are not selected).
 *
 * It has to be its own module because of how recharts reads it: `findAllByType`
 * matches children by `displayName` and takes their props without ever
 * rendering them. `next/dynamic` names its wrapper "LoadableComponent", so
 * every opacity the charts passed was silently dropped and the highlight never
 * worked. Putting the name back is the whole fix — and the colocated test is
 * the only thing that would catch it breaking again, since recharts draws
 * nothing in jsdom.
 *
 * TODO: recharts 3.8 deprecates `Cell` in favour of the `shape` prop.
 */
export const Cell = dynamic(() => import("recharts").then((m) => m.Cell), { ssr: false });
Cell.displayName = "Cell";
