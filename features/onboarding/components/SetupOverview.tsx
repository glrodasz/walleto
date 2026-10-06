import { Card } from "../../../components/atoms/Card";
import { SectionTitle } from "../../../components/atoms/SectionTitle";
import { IconDisc } from "../../../components/molecules/IconDisc";
import { ListItem, ListItems } from "../../../components/molecules/ListItem";
import { ONBOARDING_STEPS, stepAccent } from "../data/steps";

/** The Welcome's right-hand side: every setup step ahead, one line each. */
export function SetupOverview() {
  return (
    <Card>
      <SectionTitle
        title="What we'll set up"
        subtitle="Six short steps. Skip any of them and come back later."
      />
      <ListItems>
        {ONBOARDING_STEPS.map((step) => (
          <ListItem
            key={step.href}
            leading={
              <IconDisc color={stepAccent(step)} size={36}>
                <step.Icon size={16} />
              </IconDisc>
            }
            name={step.label}
            meta={step.summary}
          />
        ))}
      </ListItems>
    </Card>
  );
}
