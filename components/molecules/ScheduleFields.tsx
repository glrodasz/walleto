import { formatDate } from "../../helpers/dates";
import { usePreferences } from "../../hooks/usePreferences";
import { useT } from "../../hooks/useT";
import { COMMON_MESSAGES } from "../../messages/common";
import { FIELD_MESSAGES } from "../../messages/fields";
import { Select } from "../atoms/Select";
import { TextField } from "../atoms/TextField";
import type { Frequency, Language } from "../../types";

export interface ScheduleValue {
  /** MONTHLY / QUARTERLY / YEARLY / BIWEEKLY: (first) payment day, 1–31. */
  dayOfMonth: number;
  /** BIWEEKLY: the second payment day, 1–31. */
  secondDayOfMonth: number;
  /** YEARLY: month, 0–11. QUARTERLY: the first month of the cycle. */
  month: number;
  /** ONE_TIME / WEEKLY: the date, YYYY-MM-DD. */
  date: string;
}

interface Props {
  frequency: Frequency;
  value: ScheduleValue;
  onChange: (patch: Partial<ScheduleValue>) => void;
  disabled?: boolean;
}

const DAY_OPTIONS = Array.from({ length: 31 }, (_, i) => ({
  value: String(i + 1),
  label: String(i + 1),
}));

const monthOptions = (language: Language) =>
  Array.from({ length: 12 }, (_, i) => ({
    value: String(i),
    label: formatDate(new Date(2026, i, 1), "month", undefined, language),
  }));

/**
 * The date control a frequency actually needs — nothing more. Monthly items
 * repeat on a day; twice-a-month ones on two days; quarterly ones on a day
 * from a first month; yearly ones on a month and day; weekly ones start on a
 * date; a one-time item *is* a date. The caller owns the frequency selector
 * (or fixes the frequency, as the wizard's cadence sections do) and feeds the
 * result to helpers/scheduleAnchor.
 */
export function ScheduleFields({ frequency, value, onChange, disabled }: Props) {
  const { language } = usePreferences();
  const t = useT(FIELD_MESSAGES);
  const tc = useT(COMMON_MESSAGES);
  const MONTH_OPTIONS = monthOptions(language);
  switch (frequency) {
    case "MONTHLY":
      return (
        <Select
          label={t("schedule.paymentDay")}
          options={DAY_OPTIONS}
          value={String(value.dayOfMonth)}
          disabled={disabled}
          onValueChange={(v) => onChange({ dayOfMonth: Number(v) })}
        />
      );
    case "BIWEEKLY":
      return (
        <>
          <Select
            label={t("schedule.firstPaymentDay")}
            options={DAY_OPTIONS}
            value={String(value.dayOfMonth)}
            disabled={disabled}
            onValueChange={(v) => onChange({ dayOfMonth: Number(v) })}
          />
          <Select
            label={t("schedule.secondPaymentDay")}
            options={DAY_OPTIONS}
            value={String(value.secondDayOfMonth)}
            disabled={disabled}
            onValueChange={(v) => onChange({ secondDayOfMonth: Number(v) })}
          />
        </>
      );
    case "QUARTERLY":
      return (
        <>
          <Select
            label={t("schedule.firstMonth")}
            options={MONTH_OPTIONS}
            value={String(value.month)}
            disabled={disabled}
            onValueChange={(v) => onChange({ month: Number(v) })}
          />
          <Select
            label={t("schedule.paymentDay")}
            options={DAY_OPTIONS}
            value={String(value.dayOfMonth)}
            disabled={disabled}
            onValueChange={(v) => onChange({ dayOfMonth: Number(v) })}
          />
        </>
      );
    case "YEARLY":
      return (
        <>
          <Select
            label={tc("noun.month")}
            options={MONTH_OPTIONS}
            value={String(value.month)}
            disabled={disabled}
            onValueChange={(v) => onChange({ month: Number(v) })}
          />
          <Select
            label={t("schedule.day")}
            options={DAY_OPTIONS}
            value={String(value.dayOfMonth)}
            disabled={disabled}
            onValueChange={(v) => onChange({ dayOfMonth: Number(v) })}
          />
        </>
      );
    case "WEEKLY":
      return (
        <TextField
          label={t("schedule.startsOn")}
          type="date"
          value={value.date}
          disabled={disabled}
          onValueChange={(v) => onChange({ date: v })}
        />
      );
    case "ONE_TIME":
      return (
        <TextField
          label={tc("noun.date")}
          type="date"
          value={value.date}
          disabled={disabled}
          onValueChange={(v) => onChange({ date: v })}
        />
      );
  }
}
