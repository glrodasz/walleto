import { InfoTip } from "../../../components/atoms/InfoTip";
import { useT } from "../../../hooks/useT";
import { ONBOARDING_MESSAGES } from "../messages";

interface Props {
  /** 1-based wizard step: step 1 skips, later steps continue later. */
  step: number;
  onClick: () => void;
  busy?: boolean;
}

/** The way out of the wizard, on every step, with a note on how to come back. */
export function ContinueLater({ step, onClick, busy }: Props) {
  const t = useT(ONBOARDING_MESSAGES);
  const label = step === 1 ? t("later.skip") : t("later.continue");

  return (
    <span className="later">
      <button type="button" className="link" onClick={onClick} disabled={busy}>
        {label}
      </button>
      <InfoTip label={t("later.tipLabel")}>{t("later.tip")}</InfoTip>

      <style jsx>{`
        .later {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          flex-shrink: 0;
        }

        .link {
          border: none;
          background: none;
          padding: 0;
          font-family: inherit;
          font-size: 0.875rem;
          color: var(--fg-2);
          cursor: pointer;
          text-decoration: underline;
          white-space: nowrap;
        }

        .link:hover:not(:disabled) {
          color: var(--fg-1);
        }

        .link:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>
    </span>
  );
}
