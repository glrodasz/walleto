import { computeFlow } from "../../helpers";
import type { MoneyFlow } from "../../helpers";
import { STORY_CTX } from "./rates";
import { recurrentFor } from "./recurrent";

/** The monthly plan across the four domains, converted to USD. */
export const STORY_FLOW_SUMMARY: MoneyFlow = computeFlow(
  {
    INCOME: recurrentFor("INCOME"),
    EXPENSE: recurrentFor("EXPENSE"),
    INVESTMENT: recurrentFor("INVESTMENT"),
    SAVING: recurrentFor("SAVING"),
  },
  STORY_CTX
);
