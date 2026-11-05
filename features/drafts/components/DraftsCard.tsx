import { useState } from "react";
import dynamic from "next/dynamic";
import { Card } from "../../../components/atoms/Card";
import { SectionTitle } from "../../../components/atoms/SectionTitle";
import { Button } from "../../../components/atoms/Button";
import { Pencil } from "../../../components/atoms/Icons";
import { IconDisc } from "../../../components/molecules/IconDisc";
import { KebabMenu } from "../../../components/molecules/KebabMenu";
import { ListItem, ListItems } from "../../../components/molecules/ListItem";
import { useMoneyContext } from "../../../hooks/useMoneyContext";
import { useMoneyFormat } from "../../../hooks/useMoneyFormat";
import { useDateFormat } from "../../../hooks/usePreferences";
import { useT } from "../../../hooks/useT";
import { COMMON_MESSAGES } from "../../../messages/common";
import { DRAFT_MESSAGES } from "../messages";
import { removeDraft, useExpenseDrafts } from "../hooks/useExpenseDrafts";
import type { ExpenseDraft } from "../../../types";

// The full form loads only once a draft is being turned into an expense.
const RecurrentTransactionModal = dynamic(() =>
  import("../../domains/components/RecurrentTransactionModal").then(
    (m) => m.RecurrentTransactionModal
  )
);

/**
 * The drafts waiting to become expenses, on top of the Dashboard and the
 * Expenses page. Nothing here counts anywhere: "Turn into expense" opens the
 * full form filled in, and saving it drops the draft.
 */
export function DraftsCard() {
  const t = useT(DRAFT_MESSAGES);
  const drafts = useExpenseDrafts();
  const [completing, setCompleting] = useState<ExpenseDraft | null>(null);

  const discard = (draft: ExpenseDraft) =>
    removeDraft(draft.id).catch((err) => console.error("discard draft failed:", err));

  return (
    <>
      {drafts.length > 0 && (
        <Card>
          <SectionTitle title={t("card.title")} info={t("card.info")} />
          <ListItems>
            {drafts.map((draft) => (
              <DraftRow
                key={draft.id}
                draft={draft}
                onTurn={() => setCompleting(draft)}
                onDiscard={() => discard(draft)}
              />
            ))}
          </ListItems>
        </Card>
      )}
      {completing && (
        <RecurrentTransactionModal
          open
          domain="EXPENSE"
          draft={completing}
          initialFrequency={completing.frequency ?? "MONTHLY"}
          onSaved={() => discard(completing)}
          onClose={() => setCompleting(null)}
        />
      )}
    </>
  );
}

interface RowProps {
  draft: ExpenseDraft;
  onTurn: () => void;
  onDiscard: () => void;
}

function DraftRow({ draft, onTurn, onDiscard }: RowProps) {
  const t = useT(DRAFT_MESSAGES);
  const tc = useT(COMMON_MESSAGES);
  const { target } = useMoneyContext();
  const { formatNative } = useMoneyFormat();
  const { formatDate } = useDateFormat();
  const when =
    draft.frequency === "MONTHLY" && draft.dayOfMonth
      ? t("row.day", { day: draft.dayOfMonth })
      : draft.date
        ? formatDate(
            new Date(`${draft.date}T12:00:00`),
            draft.frequency === "YEARLY" ? "day" : "dayYear"
          )
        : null;
  const meta = draft.frequency
    ? [tc(`frequency.${draft.frequency}`), when].filter(Boolean).join(" · ")
    : t("row.noFrequency");
  return (
    <ListItem
      leading={
        <IconDisc color="var(--fg-2)" size={36}>
          <Pencil size={16} />
        </IconDisc>
      }
      name={draft.name}
      meta={meta}
      amount={
        draft.amount !== undefined && draft.currency ? (
          formatNative(draft.amount, draft.currency, target)
        ) : (
          <span className="none">{t("row.noAmount")}</span>
        )
      }
      onClick={onTurn}
      aria-label={t("row.complete", { name: draft.name })}
      trailing={
        <span className="actions">
          <span className="turn">
            <Button variant="secondary" size="sm" onClick={onTurn}>
              {t("row.turn")}
            </Button>
          </span>
          <KebabMenu
            aria-label={tc("action.actionsFor", { name: draft.name })}
            actions={[
              { label: t("row.turn"), onSelect: onTurn },
              { label: t("row.discard"), onSelect: onDiscard, danger: true },
            ]}
          />
          <style jsx>{`
            .actions {
              display: inline-flex;
              align-items: center;
              gap: 6px;
            }

            .none {
              font-family: var(--font-sans, "Inter", system-ui, sans-serif);
              font-size: 0.8rem;
              font-weight: 500;
              color: var(--fg-2);
            }

            /* Phones keep the row for the name; the kebab still offers it. */
            @media (max-width: 560px) {
              .turn {
                display: none;
              }
            }
          `}</style>
        </span>
      }
    />
  );
}
