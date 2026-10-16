import { Card } from "../../../components/atoms/Card";
import { SectionTitle } from "../../../components/atoms/SectionTitle";
import { IconDisc } from "../../../components/molecules/IconDisc";
import { ListItem, ListItems } from "../../../components/molecules/ListItem";
import { ONBOARDING_STEPS, stepLabel, stepSummary } from "../data/steps";
import { usePreferences } from "../../../hooks/usePreferences";
import { useT } from "../../../hooks/useT";
import { ONBOARDING_MESSAGES } from "../messages";

/**
 * The Welcome's right-hand side: every setup step ahead, one line each, each
 * icon in its step's own hue.
 */
export function SetupOverview() {
  const { language } = usePreferences();
  const t = useT(ONBOARDING_MESSAGES);
  return (
    <Card>
      <SectionTitle title={t("overview.title")} subtitle={t("overview.subtitle")} />
      <ListItems>
        {ONBOARDING_STEPS.map((step) => (
          <ListItem
            key={step.href}
            leading={
              <IconDisc color={step.tint} size={36}>
                <step.Icon size={16} />
              </IconDisc>
            }
            name={stepLabel(step.id, language)}
            meta={stepSummary(step.id, language)}
          />
        ))}
      </ListItems>
    </Card>
  );
}
