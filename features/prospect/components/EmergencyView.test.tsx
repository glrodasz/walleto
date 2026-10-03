import { render, screen } from "@testing-library/react";
import type { EmergencyPlan } from "../../../types";

type Value = { value: number; loading: boolean; error: Error | null };
let values: Record<"SAVING" | "INVESTMENT", Value>;
let planState: { plan: EmergencyPlan; loading: boolean };

jest.mock("../../investments/hooks/useDomainValue", () => ({
  useDomainValue: (domain: "SAVING" | "INVESTMENT") => ({ rows: [], ...values[domain] }),
}));
jest.mock("../hooks/useEmergencyPlan", () => ({
  useEmergencyPlan: () => ({ ...planState, save: jest.fn(), error: null }),
}));
jest.mock("../../../hooks/useEnabledCurrencies", () => ({
  useEnabledCurrencies: () => ({ optionsFor: () => [{ value: "USD", label: "$ USD" }] }),
}));
jest.mock("../../../components/molecules/FlowChart", () => ({
  FlowChart: () => <div data-testid="chart" />,
}));

import { EmergencyView } from "./EmergencyView";
import { IDENTITY_RATES } from "../../../helpers/fx";

const plan: EmergencyPlan = {
  currency: "USD",
  benefitMonthly: 0,
  benefitMonths: 0,
  severance: 0,
  includeInvestments: false,
};

const view = () =>
  render(
    <EmergencyView
      groups={{ nonEssential: [], essential: [], contributions: [], debts: [] }}
      categories={[]}
      ctx={{ rates: IDENTITY_RATES, target: "USD" }}
      currency="USD"
      loading={false}
      approximate={false}
      list={<div />}
    />
  );

beforeEach(() => {
  values = {
    SAVING: { value: 6_000, loading: false, error: null },
    INVESTMENT: { value: 0, loading: false, error: null },
  };
  planState = { plan, loading: false };
});

describe("EmergencyView", () => {
  it("shows the runway once everything has loaded", () => {
    view();
    expect(screen.getByText("Emergency runway")).toBeInTheDocument();
    expect(screen.getByLabelText("Benefit per month")).toBeInTheDocument();
  });

  it("shows a failed savings read as an error, never as a zero runway", () => {
    values.SAVING = { value: 0, loading: false, error: new Error("permission-denied") };
    view();
    expect(screen.getByText("Couldn't read your savings")).toBeInTheDocument();
    expect(screen.queryByText("Emergency runway")).toBeNull();
    expect(screen.queryByTestId("chart")).toBeNull();
  });

  it("only minds a failed investments read when investments count", () => {
    values.INVESTMENT = { value: 0, loading: false, error: new Error("permission-denied") };
    const { unmount } = view();
    expect(screen.getByText("Emergency runway")).toBeInTheDocument();
    unmount();

    planState = { plan: { ...plan, includeInvestments: true }, loading: false };
    view();
    expect(screen.getByText("Couldn't read your savings")).toBeInTheDocument();
  });

  it("holds the runway and the panel until the saved plan arrives", () => {
    planState = { plan, loading: true };
    view();
    expect(screen.queryByText(/months/)).toBeNull();
    expect(screen.queryByLabelText("Benefit per month")).toBeNull();
  });
});
