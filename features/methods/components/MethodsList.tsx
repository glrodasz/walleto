import { Card } from "../../../components/atoms/Card";
import { SectionTitle } from "../../../components/atoms/SectionTitle";
import { KebabMenu } from "../../../components/molecules/KebabMenu";
import { EmptyState } from "../../../components/atoms/EmptyState";
import { groupMethodsByType } from "../../../helpers/paymentMethodOptions";
import type { PaymentMethod } from "../../../types";

interface Props {
  methods: PaymentMethod[];
  loading: boolean;
  archivingId: string | null;
  onEdit: (method: PaymentMethod) => void;
  onArchive: (id: string) => void;
}

export function MethodsList({ methods, loading, archivingId, onEdit, onArchive }: Props) {
  return (
    <Card>
      <SectionTitle title="Saved methods" />

      {loading ? (
        <p className="empty">Loading…</p>
      ) : methods.length === 0 ? (
        <EmptyState
          title="No payment methods yet"
          description="Add one above to link it to your incomes and expenses."
        />
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Network</th>
              <th>Last 4</th>
              <th>Default currency</th>
              <th />
            </tr>
          </thead>
          {groupMethodsByType(methods).map((group) => (
            <tbody key={group.type}>
              <tr className="group">
                <th colSpan={5} scope="rowgroup">
                  {group.label}
                  <span className="count">{group.methods.length}</span>
                </th>
              </tr>
              {group.methods.map((m) => (
                <tr key={m.id}>
                  <td>{m.name}</td>
                  <td className="muted">{m.network || "—"}</td>
                  <td className="muted mono">{m.last4 ? `••${m.last4}` : "—"}</td>
                  <td className="muted">{m.defaultCurrency ?? "—"}</td>
                  <td className="actions">
                    <KebabMenu
                      aria-label={`Actions for ${m.name}`}
                      actions={[
                        { label: "Edit", onSelect: () => onEdit(m) },
                        {
                          label: archivingId === m.id ? "Archiving…" : "Archive",
                          onSelect: () => m.id && onArchive(m.id),
                          danger: true,
                          disabled: archivingId === m.id,
                        },
                      ]}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          ))}
        </table>
      )}

      <style jsx>{`
        .empty {
          margin: 0;
          font-size: 0.85rem;
          color: var(--fg-2);
        }

        .table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.85rem;
        }

        .table th {
          text-align: left;
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--fg-2);
          padding: 0 12px 10px 0;
          border-bottom: 1px solid var(--line);
          white-space: nowrap;
        }

        .table th:last-child {
          padding-right: 0;
        }

        .group th {
          padding: 20px 0 8px;
          font-size: 0.9rem;
          font-weight: 700;
          color: var(--fg-0);
          border-bottom: none;
        }

        .group .count {
          margin-left: 8px;
          font-size: 0.72rem;
          font-weight: 600;
          color: var(--fg-2);
        }

        tbody:first-of-type .group th {
          padding-top: 10px;
        }

        .table td {
          padding: 12px 12px 12px 0;
          color: var(--fg-1);
          border-bottom: 1px solid var(--line);
          vertical-align: middle;
        }

        .table td:last-child {
          padding-right: 0;
        }

        .table tr:last-child td {
          border-bottom: none;
        }

        .muted {
          color: var(--fg-2);
        }

        .mono {
          font-family: var(--font-mono, "JetBrains Mono", ui-monospace, monospace);
          font-variant-numeric: tabular-nums;
        }

        .actions {
          text-align: right;
          width: 32px;
        }

        @media (max-width: 700px) {
          .table thead th:nth-child(2),
          .table td:nth-child(2),
          .table thead th:nth-child(4),
          .table td:nth-child(4) {
            display: none;
          }
        }
      `}</style>
    </Card>
  );
}
