import { Card } from "../../../components/atoms/Card";
import { SectionTitle } from "../../../components/atoms/SectionTitle";
import { KebabMenu } from "../../../components/molecules/KebabMenu";
import { EmptyState } from "../../../components/atoms/EmptyState";
import { MethodFaceButton } from "../../../components/molecules/MethodFace";
import { groupMethodsByType } from "../../../helpers/paymentMethodOptions";
import { paymentMethodDescription } from "../../../helpers/paymentMethodLabel";
import type { PaymentMethod } from "../../../types";
import { usePreferences } from "../../../hooks/usePreferences";
import { useT } from "../../../hooks/useT";
import { COMMON_MESSAGES } from "../../../messages/common";
import { METHOD_MESSAGES } from "../messages";

interface Props {
  methods: PaymentMethod[];
  loading: boolean;
  archivingId: string | null;
  onEdit: (method: PaymentMethod) => void;
  onArchive: (id: string) => void;
}

export function MethodsList({ methods, loading, archivingId, onEdit, onArchive }: Props) {
  const { language } = usePreferences();
  const t = useT(METHOD_MESSAGES);
  const tc = useT(COMMON_MESSAGES);
  return (
    <Card>
      <SectionTitle title={t("list.title")} />

      {loading ? (
        <p className="empty">{tc("state.loading")}</p>
      ) : methods.length === 0 ? (
        <EmptyState title={t("list.emptyTitle")} description={t("list.emptyDescription")} />
      ) : (
        <div className="groups">
          {groupMethodsByType(methods, language).map((group) => (
            <section key={group.type} className="group" aria-label={group.label}>
              <h3 className="group-title">
                {group.label}
                <span className="count">{group.methods.length}</span>
              </h3>
              <ul className="wallet">
                {group.methods.map((m) => (
                  <li key={m.id} className="method">
                    <MethodFaceButton
                      label={t("list.edit", { name: paymentMethodDescription(m, language) })}
                      onClick={() => onEdit(m)}
                      type={m.type}
                      name={m.name}
                      network={m.network}
                      last4={m.last4}
                      currency={m.defaultCurrency}
                    />
                    <div className="caption">
                      <span className="muted">
                        {m.defaultCurrency
                          ? t("list.defaultCurrency", { currency: m.defaultCurrency })
                          : t("list.noDefaultCurrency")}
                      </span>
                      <KebabMenu
                        aria-label={tc("action.actionsFor", { name: m.name })}
                        actions={[
                          { label: tc("action.edit"), onSelect: () => onEdit(m) },
                          {
                            label:
                              archivingId === m.id ? t("list.archiving") : tc("action.archive"),
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
