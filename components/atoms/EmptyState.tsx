interface Props {
  title: string;
  description?: string;
}

export function EmptyState({ title, description }: Props) {
  return (
    <div className="empty-state">
      <span className="title">{title}</span>
      {description && <span className="desc">{description}</span>}
      <style jsx>{`
        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 6px;
          text-align: center;
          padding: 48px 24px;
        }

        .title {
          font-size: 1rem;
          font-weight: 600;
          color: var(--fg-1);
        }

        .desc {
          font-size: 0.85rem;
          color: var(--fg-2);
          max-width: 320px;
        }
      `}</style>
    </div>
  );
}
