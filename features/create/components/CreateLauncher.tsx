import { useState } from "react";
import { Modal } from "../../../components/molecules/Modal";
import { Plus } from "../../../components/atoms/Icons";
import {
  QuickTransactionModal,
  QUICK_COPY,
} from "../../transactions/components/QuickTransactionModal";
import { RecurrentTransactionModal } from "../../domains/components/RecurrentTransactionModal";
import { RecordValueModal } from "../../investments/components/RecordValueModal";
import { DOMAIN_CONFIG } from "../../domains/helpers/domainConfig";
import type { Domain } from "../../../types";

interface Props {
  /** Fixed by the page (a domain page); absent = the sheet offers a choice. */
  domain?: Domain;
}

const DOMAINS: Domain[] = ["EXPENSE", "INCOME", "INVESTMENT", "SAVING"];
const DOMAIN_LABEL: Record<Domain, string> = {
  EXPENSE: "Expense",
  INCOME: "Income",
  INVESTMENT: "Investment",
  SAVING: "Saving",
};

type Kind = "quick" | "recurring" | "value";

/**
 * The phone's create entry point: a floating + button (hidden on desktop,
 * where the header buttons remain) opening a sheet that asks what to add.
 * The two forms mount only while open, so no page pays for their listeners.
 */
export function CreateLauncher({ domain: fixedDomain }: Props) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [domain, setDomain] = useState<Domain>(fixedDomain ?? "EXPENSE");
  const [kind, setKind] = useState<Kind | null>(null);

  const openSheet = () => {
    setDomain(fixedDomain ?? "EXPENSE");
    setSheetOpen(true);
  };
  const choose = (next: Kind) => {
    setSheetOpen(false);
    setKind(next);
  };

  const singular = DOMAIN_CONFIG[domain].noun.replace(/s$/, "");

  return (
    <>
      <button type="button" className="fab" aria-label="Add" onClick={openSheet}>
        <Plus size={26} />
      </button>

      <Modal open={sheetOpen} title="Add" onClose={() => setSheetOpen(false)}>
        <div className="sheet">
          {!fixedDomain && (
            <div className="domains" role="group" aria-label="Type">
              {DOMAINS.map((d) => (
                <button
                  key={d}
                  type="button"
                  className={`domain${d === domain ? " is-active" : ""}`}
                  aria-pressed={d === domain}
                  style={{ "--tab-accent": DOMAIN_CONFIG[d].accent } as React.CSSProperties}
                  onClick={() => setDomain(d)}
                >
                  {DOMAIN_LABEL[d]}
                </button>
              ))}
            </div>
          )}

          <button type="button" className="option" onClick={() => choose("quick")}>
            <strong>{QUICK_COPY[domain].title}</strong>
            <span>A single amount on a date, already paid</span>
          </button>
          <button type="button" className="option" onClick={() => choose("recurring")}>
            <strong>Add a recurring {singular}</strong>
            <span>Something that repeats: a subscription, a salary, rent</span>
          </button>
          {domain === "INVESTMENT" && (
            <button type="button" className="option" onClick={() => choose("value")}>
              <strong>Record current value</strong>
              <span>What an investment is worth today, as a gain % or a value</span>
            </button>
          )}
        </div>
      </Modal>

      {kind === "quick" && (
        <QuickTransactionModal open domain={domain} onClose={() => setKind(null)} />
      )}
      {kind === "recurring" && (
        <RecurrentTransactionModal open domain={domain} onClose={() => setKind(null)} />
      )}
      {kind === "value" && <RecordValueModal open onClose={() => setKind(null)} />}

      <style jsx>{`
        .fab {
          display: inline-flex;
          position: fixed;
          right: 16px;
          bottom: calc(80px + env(safe-area-inset-bottom, 0px));
          z-index: var(--z-fab, 110);
          width: 56px;
          height: 56px;
          border: none;
          border-radius: 50%;
          background: var(--accent);
          color: #0a0a0f;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.45);
          -webkit-tap-highlight-color: transparent;
        }

        .sheet {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .domains {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 6px;
          margin-bottom: 6px;
        }

        .domain {
          min-height: 40px;
          padding: 8px 4px;
          border: 1px solid var(--line);
          border-radius: var(--r-sm);
          background: var(--bg-2);
          color: var(--fg-1);
          font-family: inherit;
          font-size: 0.8rem;
          font-weight: 600;
          cursor: pointer;
        }

        .domain.is-active {
          border-color: var(--tab-accent);
          color: var(--tab-accent);
          background: color-mix(in srgb, var(--tab-accent) 12%, transparent);
        }

        .option {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 4px;
          padding: 14px 16px;
          border: 1px solid var(--line);
          border-radius: var(--r-md);
          background: var(--bg-2);
          color: var(--fg-0);
          font-family: inherit;
          text-align: left;
          cursor: pointer;
        }

        .option strong {
          font-size: 0.95rem;
          font-weight: 700;
        }

        .option span {
          font-size: 0.8rem;
          color: var(--fg-2);
        }

        .option:hover {
          border-color: var(--line-strong);
          background: var(--bg-3);
        }

        /* Desktop keeps the header buttons; the FAB is a phone affordance. */
        @media (min-width: 768px) {
          .fab {
            display: none;
          }
        }
      `}</style>
    </>
  );
}
