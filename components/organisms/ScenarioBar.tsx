import { ScenarioToggle } from "../molecules/ScenarioToggle";
import { useMoneyContext } from "../../hooks/useMoneyContext";
import { useRecurrentTransactions } from "../../hooks/useRecurrentTransactions";
import { isVariable } from "../../helpers/variable";

/**
 * The scenario toggle, on the pages whose figures it moves (dashboard,
 * expenses, Prospect). Nothing to choose until a plan item varies.
 */
export function ScenarioBar() {
  const { scenario, setScenario } = useMoneyContext();
  const { items } = useRecurrentTransactions("EXPENSE");
  if (!items.some((i) => i.active && isVariable(i))) return null;
  return <ScenarioToggle value={scenario} onChange={setScenario} />;
}
