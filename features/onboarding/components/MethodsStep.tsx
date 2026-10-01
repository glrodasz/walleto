import { Chip } from "../../../components/atoms/Chip";
import { WalletItem } from "./WalletItem";
import { rowProblem, useMethodsStep } from "../hooks/useMethodsStep";
import { useOpenRow } from "../hooks/useOpenRow";

interface Props {
  state: ReturnType<typeof useMethodsStep>;
}

/**
 * The owner's payment methods as a wallet: each one drawn as what it is (a
 * card, a check, a phone…), collapsed to a strip, and opened one at a time to
 * edit. Saved methods are editable too; only their type is locked.
 */
export function MethodsStep({ state }: Props) {
  const { rows, add, update, removeAt, attempted, attempt } = state;
  const problemOf = (row: (typeof rows)[number]) => (attempted ? rowProblem(row) : null);
  const firstInvalid = rows.find((row) => problemOf(row));
  const { openKey, toggle, close } = useOpenRow(rows, firstInvalid?.key ?? null, attempt);

  return (
    <div className="wallet">
      {rows.map((row) => (
        <WalletItem
          key={row.key}
          row={row}
          open={row.key === openKey}
          attempted={attempted}
          problem={problemOf(row)}
          canRemove={rows.length > 1 || Boolean(row.id)}
          onToggle={() => toggle(row.key)}
          onClose={close}
          onChange={(patch) => update(row.key, patch)}
          onRemove={() => removeAt(row.key)}
        />
      ))}

      <div>
        {/* Never `onClick={add}`: add() takes overrides, so the click event got
            spread into the new row and its `type` became "click". */}
        <Chip variant="add" onClick={() => add()}>
          Add more
        </Chip>
      </div>

      <style jsx>{`
        .wallet {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
      `}</style>
    </div>
  );
}
