import { useState } from "react";
import { Modal } from "../../../components/molecules/Modal";
import { Plus } from "../../../components/atoms/Icons";
import { RecurrentTransactionModal } from "../../domains/components/RecurrentTransactionModal";
import { RecordValueModal } from "../../investments/components/RecordValueModal";
import { isAccountDomain } from "../../../helpers/accounts";
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
 * The create entry point on every page and every width: a floating +
 * button opening a sheet that asks what to add. The forms mount only while
 * open, so no page pays for their listeners.
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
      <button type="button" className="glass--tap fab" aria-label="Add" onClick={openSheet}>
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
                  className={`glass glass--tap domain${d === domain ? " is-active" : ""}`}
                  aria-pressed={d === domain}
                  style={{ "--tab-accent": DOMAIN_CONFIG[d].accent } as React.CSSProperties}
                  onClick={() => setDomain(d)}
                >
                  {DOMAIN_LABEL[d]}
                </button>
              ))}
            </div>
          )}

          <button type="button" className="glass glass--tap option" onClick={() => choose("quick")}>
            <strong>{DOMAIN_CONFIG[domain].oneOff.title}</strong>
            <span>A single amount on a date, already paid</span>
          </button>
          <button
            type="button"
            className="glass glass--tap option"
            onClick={() => choose("recurring")}
          >
            <strong>Add a recurring {singular}</strong>
            <span>Something that repeats: a subscription, a salary, rent</span>
          </button>
          {isAccountDomain(domain) && (
            <button
              type="button"
              className="glass glass--tap option"
              onClick={() => choose("value")}
            >
              <strong>Record current value</strong>
              <span>
                What {domain === "SAVING" ? "a pocket" : "an account"} is worth today, as a gain %
                or a value
              </span>
            </button>
          )}
        </div>
      </Modal>

      {kind === "quick" && (
        <RecurrentTransactionModal
          open
          domain={domain}
          initialFrequency="ONE_TIME"
          onClose={() => setKind(null)}
        />
      )}
      {kind === "recurring" && (
        <RecurrentTransactionModal open domain={domain} onClose={() => setKind(null)} />
      )}
      {kind === "value" && isAccountDomain(domain) && (
        <RecordValueModal open domain={domain} onClose={() => setKind(null)} />
      )}

      <style jsx>{`
        /* A bead of accent-coloured glass: lit along the top, pooling its own
           colour onto whatever is behind it. It clears the floating tab bar. */
        .fab {
          display: inline-flex;
          position: fixed;
          right: 16px;
          bottom: calc(86px + env(safe-area-inset-bottom, 0px));
          z-index: var(--z-fab, 110);
          width: 56px;
          height: 56px;
          border: 1px solid color-mix(in srgb, var(--on-accent) 30%, transparent);
          border-radius: 50%;
          background-color: var(--accent);
          background-image: var(--glass-sheen);
          color: var(--on-accent);
          align-items: center;
          justify-content: center;
          cursor: pointer;
          box-shadow:
            inset 0 1px 0 color-mix(in srgb, var(--on-accent) 50%, transparent),
            0 10px 30px -8px var(--accent),
            var(--glass-shadow-lg);
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
          border-radius: var(--r-md);
          color: var(--fg-1);
          font-family: inherit;
          font-size: 0.8rem;
          font-weight: 600;
          cursor: pointer;
        }

        .domain.is-active {
          border-color: color-mix(in srgb, var(--tab-accent) 50%, transparent);
          color: var(--tab-accent);
          background-color: color-mix(in srgb, var(--tab-accent) 16%, transparent);
        }

        .option {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 4px;
          padding: 14px 16px;
          border-radius: var(--r-lg);
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
        }

        /* Desktop: same button, clear of the page corner; no bottom nav to dodge. */
        @media (min-width: 768px) {
          .fab {
            right: 28px;
            bottom: 28px;
          }
        }
      `}</style>
    </>
  );
}
