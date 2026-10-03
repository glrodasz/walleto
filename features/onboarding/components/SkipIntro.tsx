interface Props {
  label: string;
  onClick: () => void;
}

/** The intro's way out, styled like the wizard's "Skip for now" link. */
export function SkipIntro({ label, onClick }: Props) {
  return (
    <button type="button" className="link" onClick={onClick}>
      {label}
      <style jsx>{`
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

        .link:hover {
          color: var(--fg-1);
        }
      `}</style>
    </button>
  );
}
