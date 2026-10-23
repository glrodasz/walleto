import { Badge } from "../../../components/atoms/Badge";
import { useDateFormat } from "../../../hooks/usePreferences";
import { usePrivacy } from "../../../hooks/usePrivacy";
import { useT } from "../../../hooks/useT";
import { ADMIN_MESSAGES } from "../messages";
import type { AdminUserRow } from "../types";

/** "guillermo@gmail.com" → "g••••@gmail.com" while privacy mode is on. */
export function maskEmail(email: string): string {
  const at = email.indexOf("@");
  if (at < 1) return "••••";
  return `${email[0]}••••${email.slice(at)}`;
}

/**
 * One row per person. It's a real table — a box that scrolls sideways on a
 * phone, so the page itself never widens.
 */
export function UsersTable({ users }: { users: AdminUserRow[] }) {
  const t = useT(ADMIN_MESSAGES);
  const { formatDate } = useDateFormat();
  const { hidden } = usePrivacy();
  const day = (iso: string | null) =>
    iso ? formatDate(new Date(iso), "dayYear") : t("table.never");

  if (users.length === 0) return <p className="empty">{t("table.empty")}</p>;

  return (
    <div className="scroll">
      <table>
        <thead>
          <tr>
            <th scope="col">{t("table.user")}</th>
            <th scope="col">{t("table.lastActive")}</th>
            <th scope="col">{t("table.signedUp")}</th>
            <th scope="col" className="num">
              {t("table.logins")}
            </th>
            <th scope="col" className="num">
              {t("table.recurring")}
            </th>
            <th scope="col" className="num">
              {t("table.transactions")}
            </th>
            <th scope="col" className="num">
              {t("table.accounts")}
            </th>
            <th scope="col">{t("table.setup")}</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id}>
              <th scope="row">
                <span className="who">
                  <span className="primary">
                    {u.email ? (hidden ? maskEmail(u.email) : u.email) : u.id}
                  </span>
                  {u.email && (
                    <span className="secondary">{u.name && !hidden ? u.name : u.id}</span>
                  )}
                </span>
              </th>
              <td>{day(u.lastActiveAt)}</td>
              <td>{day(u.signedUpAt)}</td>
              <td className="num">{u.logins ?? "—"}</td>
              <td className="num">{u.counts.recurring}</td>
              <td className="num">{u.counts.transactions}</td>
              <td className="num">{u.counts.accounts}</td>
              <td>
                <Badge tone={u.onboarded ? "success" : "neutral"} size="sm">
                  {u.onboarded ? t("table.done") : t("table.pending")}
                </Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <style jsx>{`
        .scroll {
          overflow-x: auto;
          margin: 0 -4px;
          padding: 0 4px;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.85rem;
          white-space: nowrap;
        }

        th,
        td {
          padding: 10px 12px;
          text-align: left;
          border-bottom: 1px solid var(--line);
          vertical-align: middle;
        }

        thead th {
          font-size: 0.72rem;
          font-weight: 600;
          color: var(--fg-2);
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        tbody tr:last-child th,
        tbody tr:last-child td {
          border-bottom: none;
        }

        th:first-child,
        td:first-child {
          padding-left: 0;
        }

        td {
          color: var(--fg-1);
        }

        .num {
          text-align: right;
          font-variant-numeric: tabular-nums;
        }

        .who {
          display: flex;
          flex-direction: column;
          gap: 2px;
          font-weight: 400;
          max-width: 260px;
        }

        .primary {
          color: var(--fg-0);
          font-weight: 600;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .secondary {
          font-size: 0.75rem;
          color: var(--fg-2);
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .empty {
          margin: 0;
          color: var(--fg-2);
          font-size: 0.9rem;
        }
      `}</style>
    </div>
  );
}
