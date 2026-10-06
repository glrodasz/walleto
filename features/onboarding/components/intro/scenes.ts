import type { ComponentType } from "react";
import type { IntroSlideId } from "../../data/introSlides";
import { PlanScene } from "./PlanScene";
import { FlowScene } from "./FlowScene";
import { LaterScene } from "./LaterScene";
import { EssentialsScene } from "./EssentialsScene";
import { WorthScene } from "./WorthScene";
import { CurrencyScene } from "./CurrencyScene";

/** The scene each slide draws: in the Welcome, the tour and a step's lead. */
export const INTRO_SCENES: Record<IntroSlideId, ComponentType> = {
  planner: PlanScene,
  clarity: FlowScene,
  later: LaterScene,
  essentials: EssentialsScene,
  worth: WorthScene,
  currencies: CurrencyScene,
};
