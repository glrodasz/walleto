import { Card } from "../../../components/atoms/Card";
import { SectionTitle } from "../../../components/atoms/SectionTitle";
import { KebabMenu } from "../../../components/molecules/KebabMenu";
import { EmptyState } from "../../../components/atoms/EmptyState";
import { MethodFaceButton } from "../../../components/molecules/MethodFace";
import { groupMethodsByType } from "../../../helpers/paymentMethodOptions";
import { paymentMethodDescription } from "../../../helpers/paymentMethodLabel";
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
        <div className="groups">
          {groupMethodsByType(methods).map((group) => (
            <section key={group.type} className="group" aria-label={group.label}>
              <h3 className="group-title">
                {group.label}
                <span className="count">{group.methods.length}</span>
              </h3>
              <ul className="wallet">
                {group.methods.map((m) => (
                  <li key={m.id} className="method">
                    <MethodFaceButton
                      label={`Edit ${paymentMethodDescription(m)}`}
                      onClick={() => onEdit(m)}
                      type={m.type}
                      name={m.name}
                      network={m.network}
                      last4={m.last4}
                      currency={m.defaultCurrency}
                    />
                    <div className="caption">
                      <span className="muted">
                        {m.defaultCurrency ? `Default ${m.defaultCurrency}` : "No default currency"}
                      </span>
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
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}

      <style jsx>{`
        .empty {
          margin: 0;
          font-size: 0.85rem;
          color: var(--fg-2);
        }

        .groups {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .group {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .group-title {
          margin: 0;
          font-size: 0.9rem;
          font-weight: 700;
          color: var(--fg-0);
        }

        .count {
          margin-left: 8px;
          font-size: 0.72rem;
          font-weight: 600;
          color: var(--fg-2);
        }

        /* Cards side by side where they fit, one per row on a phone. */
        .wallet {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
          gap: 14px;
          margin: 0;
          padding: 0;
          list-style: none;
        }

        .method {
          display: flex;
          flex-direction: column;
          gap: 4px;
          min-width: 0;
        }

        /* Outside the face's button: a kebab can't live inside another button. */
        .caption {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          padding-left: 4px;
        }

        .muted {
          font-size: 0.75rem;
          color: var(--fg-2);
        }
      `}</style>
    </Card>
  );
}
