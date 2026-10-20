import { ScenarioPicker } from "../molecules/ScenarioPicker";
import { useMoneyContext } from "../../hooks/useMoneyContext";
import { useRecurrentTransactions } from "../../hooks/useRecurrentTransactions";
import { isVariable } from "../../helpers/variable";

/**
 * The scenario picker, in the header of the pages whose figures it moves (dashboard,
 * expenses, Prospect). Nothing to choose until a plan item varies.
 */
export function ScenarioBar() {
  const { scenario, setScenario } = useMoneyContext();
  const { items } = useRecurrentTransactions("EXPENSE");
  if (!items.some((i) => i.active && isVariable(i))) return null;
  return <ScenarioPicker value={scenario} onChange={setScenario} />;
}
