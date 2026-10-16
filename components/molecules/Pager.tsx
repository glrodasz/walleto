import { Button } from "../atoms/Button";
import { useT } from "../../hooks/useT";
import { UI_MESSAGES } from "../../messages/ui";
import { COMMON_MESSAGES } from "../../messages/common";

interface Props {
  page: number;
  pageCount: number;
  onChange: (page: number) => void;
}

/** Previous · Page 2 of 5 · Next. Renders nothing for a single page. */
export function Pager({ page, pageCount, onChange }: Props) {
  const t = useT(UI_MESSAGES);
  const tc = useT(COMMON_MESSAGES);
  if (pageCount <= 1) return null;
  return (
    <nav className="pager" aria-label={t("pager.label")}>
      <Button variant="ghost" size="sm" onClick={() => onChange(page - 1)} disabled={page <= 1}>
        {t("pager.previous")}
      </Button>
      <span className="status" aria-live="polite">
        {t("pager.status", { page, count: pageCount })}
      </span>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onChange(page + 1)}
        disabled={page >= pageCount}
      >
        {tc("action.next")}
      </Button>

      <style jsx>{`
        .pager {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          padding-top: 8px;
        }

        .status {
          font-size: 0.78rem;
          color: var(--fg-2);
        }
      `}</style>
    </nav>
  );
}
