import { Card } from "../../../components/atoms/Card";
import { InfoTip } from "../../../components/atoms/InfoTip";
import { useT } from "../../../hooks/useT";
import { UI_MESSAGES } from "../../../messages/ui";
import { ADMIN_MESSAGES } from "../messages";
import type { UsageSummary } from "../types";

interface Tile {
  key: string;
  label: string;
  value: number;
  sub: string;
  info?: string;
}

/** The headline counts: users, active today / week / month, new this week. */
export function KpiTiles({ totals }: { totals: UsageSummary["totals"] }) {
  const t = useT(ADMIN_MESSAGES);
  const ui = useT(UI_MESSAGES);
  const activeInfo = t("kpi.activeInfo");
  const tiles: Tile[] = [
    {
      key: "users",
      label: t("kpi.users"),
      value: totals.users,
      sub: t("kpi.usersSub", { onboarded: totals.onboarded }),
    },
    {
      key: "dau",
      label: t("kpi.dau"),
      value: totals.dau,
      sub: t("kpi.activeTodaySub"),
      info: activeInfo,
    },
    {
      key: "wau",
      label: t("kpi.wau"),
      value: totals.wau,
      sub: t("kpi.activeSub", { days: 7 }),
      info: activeInfo,
    },
    {
      key: "mau",
      label: t("kpi.mau"),
      value: totals.mau,
      sub: t("kpi.activeSub", { days: 30 }),
      info: activeInfo,
    },
    {
      key: "signups",
      label: t("kpi.signups"),
      value: totals.signups7d,
      sub: t("kpi.signupsSub", { count: totals.signups30d }),
    },
  ];

  return (
    <ul className="tiles">
      {tiles.map((tile) => (
        <li key={tile.key}>
          <Card padding="sm">
            <span className="label">
              {tile.label}
              {tile.info && (
                <InfoTip label={ui("field.moreInfo")} placement="bottom">
                  {tile.info}
                </InfoTip>
              )}
            </span>
            <span className="value">{tile.value}</span>
            <span className="sub">{tile.sub}</span>
          </Card>
        </li>
      ))}
      <style jsx>{`
        .tiles {
          list-style: none;
          margin: 0;
          padding: 0;
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
          gap: 12px;
        }

        .tiles > li {
          min-width: 0;
          display: flex;
          flex-direction: column;
        }

        .tiles > li > :global(.card) {
          flex: 1;
        }

        .label {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 0.78rem;
          font-weight: 600;
          color: var(--fg-1);
        }

        .value {
          font-size: 1.9rem;
          font-weight: 700;
          letter-spacing: -0.02em;
          line-height: 1.1;
          color: var(--fg-0);
          font-variant-numeric: tabular-nums;
        }

        .sub {
          font-size: 0.75rem;
          color: var(--fg-2);
        }

        @media (max-width: 480px) {
          .tiles {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .tiles > li:first-child {
            grid-column: 1 / -1;
          }
        }
      `}</style>
    </ul>
  );
}
