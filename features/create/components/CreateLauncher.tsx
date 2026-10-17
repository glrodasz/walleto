import { useState } from "react";
import dynamic from "next/dynamic";
import { Modal } from "../../../components/molecules/Modal";
import { Plus } from "../../../components/atoms/Icons";
import { isAccountDomain } from "../../../helpers/accounts";
import { DOMAIN_CONFIG } from "../../domains/helpers/domainConfig";
import type { Domain } from "../../../types";
import { useT } from "../../../hooks/useT";
import { COMMON_MESSAGES } from "../../../messages/common";
import { DOMAIN_MESSAGES } from "../../domains/messages";
import { CREATE_MESSAGES } from "../messages";

// Every page mounts the launcher, but the forms only load once one is picked.
const RecurrentTransactionModal = dynamic(() =>
  import("../../domains/components/RecurrentTransactionModal").then(
    (m) => m.RecurrentTransactionModal
  )
);
const RecordValueModal = dynamic(() =>
  import("../../investments/components/RecordValueModal").then((m) => m.RecordValueModal)
);

interface Props {
  /** Fixed by the page (a domain page); absent = the sheet offers a choice. */
  domain?: Domain;
}

const DOMAINS: Domain[] = ["EXPENSE", "INCOME", "INVESTMENT", "SAVING", "DEBT"];

type Kind = "quick" | "recurring" | "value";

/**
 * The create entry point on every page and every width: a floating +
 * button opening a sheet that asks what to add — the plan first, then a
 * one-off, then (account domains) where a position stands today. The forms mount only while
 * open, so no page pays for their listeners.
 */
export function CreateLauncher({ domain: fixedDomain }: Props) {
  const t = useT(CREATE_MESSAGES);
  const copy = useT(DOMAIN_MESSAGES);
  const common = useT(COMMON_MESSAGES);
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

  return (
    <>
      <button
        type="button"
        className="glass--tap fab"
        aria-label={common("action.add")}
        onClick={openSheet}
      >
        <Plus size={26} />
      </button>

      <Modal open={sheetOpen} title={common("action.add")} onClose={() => setSheetOpen(false)}>
        <div className="sheet">
          {!fixedDomain && (
            <div className="domains" role="group" aria-label={t("sheet.type")}>
              {DOMAINS.map((d) => (
                <button
                  key={d}
                  type="button"
                  className={`glass glass--tap domain${d === domain ? " is-active" : ""}`}
                  aria-pressed={d === domain}
                  style={{ "--tab-accent": DOMAIN_CONFIG[d].accent } as React.CSSProperties}
                  onClick={() => setDomain(d)}
                >
                  {common(`domainOne.${d}`)}
                </button>
              ))}
            </div>
          )}

          <button
            type="button"
            className="glass glass--tap option"
            onClick={() => choose("recurring")}
          >
            <strong>{copy(`plan.add.${domain}`)}</strong>
            <span>{t("sheet.recurringHint")}</span>
          </button>
          <button type="button" className="glass glass--tap option" onClick={() => choose("quick")}>
            <strong>{copy(`oneOff.title.${domain}`)}</strong>
            <span>{t("sheet.oneOffHint")}</span>
          </button>
          {isAccountDomain(domain) && (
            <button
              type="button"
              className="glass glass--tap option"
              onClick={() => choose("value")}
            >
              <strong>{t(`sheet.value.${domain}`)}</strong>
              <span>{t(`sheet.valueHint.${domain}`)}</span>
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

        /* Outranks .glass--tap:hover, whose --glass-hover would swap the
           accent for plain glass and sink the --on-accent icon into it. */
        .fab:hover:not(:disabled) {
          background-color: var(--accent-hover);
          box-shadow:
            inset 0 1px 0 color-mix(in srgb, var(--on-accent) 50%, transparent),
            0 12px 34px -8px var(--accent),
            var(--glass-shadow-lg);
        }

        .sheet {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .domains {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
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

        /* Phone: Expense and Income share the first row in halves, the three
           account domains the second in thirds (6 columns: 3+3, then 2+2+2). */
        @media (max-width: 480px) {
          .domains {
            grid-template-columns: repeat(6, 1fr);
          }

          .domain {
            grid-column: span 2;
          }

          .domain:nth-child(-n + 2) {
            grid-column: span 3;
          }
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
