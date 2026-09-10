import { Button } from "../atoms/Button";

interface Props {
  page: number;
  pageCount: number;
  onChange: (page: number) => void;
}

/** Previous · Page 2 of 5 · Next. Renders nothing for a single page. */
export function Pager({ page, pageCount, onChange }: Props) {
  if (pageCount <= 1) return null;
  return (
    <nav className="pager" aria-label="Pages">
      <Button variant="ghost" size="sm" onClick={() => onChange(page - 1)} disabled={page <= 1}>
        Previous
      </Button>
      <span className="status" aria-live="polite">
        Page {page} of {pageCount}
      </span>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onChange(page + 1)}
        disabled={page >= pageCount}
      >
        Next
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
