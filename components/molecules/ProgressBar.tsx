interface Props {
  /** 0–1; anything above 1 fills the track. */
  ratio: number;
  color?: string;
  height?: number;
  label: string;
}

/** The thin track used by the month hero and every category row. */
export function ProgressBar({ ratio, color = "var(--accent)", height = 8, label }: Props) {
  const pct = Math.max(0, Math.min(1, Number.isFinite(ratio) ? ratio : 0)) * 100;
  return (
    <div
      className="track"
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(pct)}
      style={{ "--bar-color": color, "--bar-height": `${height}px` } as React.CSSProperties}
    >
      <div className="fill" style={{ width: `${pct}%` }} />
      <style jsx>{`
        .track {
          width: 100%;
          height: var(--bar-height);
          border-radius: 999px;
          background: color-mix(in srgb, var(--bar-color) 16%, var(--glass-inset));
          overflow: hidden;
        }

        .fill {
          height: 100%;
          border-radius: 999px;
          background: var(--bar-color);
          transition: width 0.3s ease;
        }
      `}</style>
    </div>
  );
}
