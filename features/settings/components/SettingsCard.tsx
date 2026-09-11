import type { ComponentType, ReactNode } from "react";
import { Card } from "../../../components/atoms/Card";
import { IconDisc } from "../../../components/molecules/IconDisc";
import type { IconProps } from "../../../components/atoms/Icons";

interface Props {
  title: string;
  subtitle?: string;
  icon: ComponentType<IconProps>;
  /** Something at the top right: a button, a link. */
  action?: ReactNode;
  children: ReactNode;
}

/** A Settings section: icon disc, title, one-line purpose, then its rows. */
export function SettingsCard({ title, subtitle, icon: Icon, action, children }: Props) {
  return (
    <Card>
      <header className="head">
        <IconDisc size={40}>
          <Icon size={18} />
        </IconDisc>
        <div className="text">
          <h2 className="title">{title}</h2>
          {subtitle && <p className="subtitle">{subtitle}</p>}
        </div>
        {action && <div className="action">{action}</div>}
      </header>
      <div className="body">{children}</div>
      <style jsx>{`
        .head {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .text {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .title {
          margin: 0;
          font-size: 1.05rem;
          font-weight: 700;
          color: var(--fg-0);
        }

        .subtitle {
          margin: 0;
          font-size: 0.8rem;
          color: var(--fg-2);
        }

        .action {
          flex-shrink: 0;
        }

        .body {
          display: flex;
          flex-direction: column;
        }
      `}</style>
    </Card>
  );
}
