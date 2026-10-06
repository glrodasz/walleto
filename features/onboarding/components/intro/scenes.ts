import type { ComponentType } from "react";
import type { IntroSlideId } from "../../data/introSlides";
import { PlanScene } from "./PlanScene";
import { FlowScene } from "./FlowScene";
import { LaterScene } from "./LaterScene";
import { CurrencyScene } from "./CurrencyScene";
import { IncomeScene } from "./IncomeScene";
import { BillsScene } from "./BillsScene";
import { WorthScene } from "./WorthScene";

/** The scene each intro slide draws above its text. */
export const INTRO_SCENES: Record<IntroSlideId, ComponentType> = {
  planner: PlanScene,
  clarity: FlowScene,
  later: LaterScene,
  currencies: CurrencyScene,
  income: IncomeScene,
  expenses: BillsScene,
  worth: WorthScene,
};
