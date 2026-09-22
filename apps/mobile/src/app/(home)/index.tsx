import {
  FREQUENCY_ADVERBS,
  FREQUENCY_LABELS,
  PERIODS_PER_YEAR,
  REPAYMENT_TYPE_LABELS,
  STORAGE_KEYS,
  calculateLoan,
  describeDuration,
  formatCurrency,
  formatRepayment,
  interestOnlyYears,
  parseHomeLoanSettings,
  type Frequency,
  type RepaymentType,
} from '@repayly/core';
import { useMemo, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { BalanceChart } from '@/components/balance-chart';
import { SavedDetails } from '@/components/saved-details';
import { ScheduleList } from '@/components/schedule-list';
import { Screen } from '@/components/screen';
import { SummaryHero, TileGrid, type TileData } from '@/components/summary';
import { Callout, Card, Divider, SectionLabel } from '@/components/ui/card';
import { Collapsible } from '@/components/ui/collapsible';
import {
  DateField,
  NumericField,
  Segmented,
  SelectField,
  StackedField,
} from '@/components/ui/fields';
import { Spacing } from '@/constants/theme';
import { usePersistentSettings } from '@/hooks/use-persistent-settings';

type OutlookView = 'chart' | 'schedule';

const TITLE = 'Home loan';
const SUBTITLE = 'Adjust the details to see your estimated repayments.';

const FREQUENCY_OPTIONS = (Object.keys(FREQUENCY_LABELS) as Frequency[]).map((value) => ({
  value,
  label: FREQUENCY_LABELS[value],
}));

const REPAYMENT_TYPE_OPTIONS = (Object.keys(REPAYMENT_TYPE_LABELS) as RepaymentType[]).map(
  (value) => ({ value, label: REPAYMENT_TYPE_LABELS[value] }),
);

export default function HomeLoanScreen() {
  const { settings, loaded, update, reset } = usePersistentSettings(
    STORAGE_KEYS.homeLoan,
    parseHomeLoanSettings,
  );
  const {
    amount,
    startDate,
    termYears,
    ratePercent,
    repaymentType,
    frequency,
    extraRepayment,
    homeValue,
    homeValueGrowthPercent,
    offsetBalance,
    monthlyIncome,
    monthlyExpenses,
  } = settings;

  const [view, setView] = useState<OutlookView>('chart');

  const result = useMemo(
    () =>
      calculateLoan({
        amount,
        termYears,
        annualRatePercent: ratePercent,
        repaymentType,
        frequency,
        extraRepayment,
        offsetBalance,
        monthlyIncome,
        monthlyExpenses,
      }),
    [
      amount,
      termYears,
      ratePercent,
      repaymentType,
      frequency,
      extraRepayment,
      offsetBalance,
      monthlyIncome,
      monthlyExpenses,
    ],
  );

  // Holding back one frame avoids showing the starting figures and then
  // snapping to the saved ones.
  if (!loaded) {
    return (
      <Screen title={TITLE} subtitle={SUBTITLE}>
        <ActivityIndicator style={{ marginTop: Spacing.xl }} />
      </Screen>
    );
  }

  const periodsPerYear = PERIODS_PER_YEAR[frequency];
  const ioYears = interestOnlyYears(repaymentType);
  const interestOnly = ioYears > 0;

  const tiles: TileData[] = [
    { label: 'Total repayments', value: formatCurrency(result.totalRepayments) },
    { label: 'Total interest charged', value: formatCurrency(result.totalInterest) },
  ];
  if (result.postInterestOnlyRepayment !== undefined) {
    tiles.push({
      label: `After the interest only period (${FREQUENCY_ADVERBS[frequency]})`,
      value: formatRepayment(result.postInterestOnlyRepayment),
    });
  }

  return (
    <Screen title={TITLE} subtitle={SUBTITLE}>
      <SummaryHero
        label="Your repayment"
        value={formatRepayment(result.totalPeriodRepayment)}
        unit={`/ ${FREQUENCY_ADVERBS[frequency]}`}
        caption={`${ratePercent}% p.a. over a ${termYears} year term`}
      />

      <TileGrid tiles={tiles} />

      {extraRepayment > 0 && result.periodsSaved > 0 ? (
        <Callout>
          Paying an extra {formatCurrency(extraRepayment)} {FREQUENCY_ADVERBS[frequency]} clears the
          loan {describeDuration(result.periodsSaved, periodsPerYear)} sooner and saves{' '}
          {formatCurrency(result.interestSaved)} in interest.
        </Callout>
      ) : null}

      {(offsetBalance > 0 || monthlyIncome > 0) && result.offsetPeriodsSaved > 0 ? (
        <Callout>
          Your offset account clears the loan{' '}
          {describeDuration(result.offsetPeriodsSaved, periodsPerYear)} sooner and saves{' '}
          {formatCurrency(result.offsetInterestSaved)} in interest.
        </Callout>
      ) : null}

      {interestOnly ? (
        <Callout muted>
          Interest only repayments for the first {ioYears} year{ioYears === 1 ? '' : 's'} don&apos;t
          reduce the principal.{' '}
          {result.postInterestOnlyRepayment
            ? 'After that, repayments switch to principal and interest for the rest of the term.'
            : `The ${formatCurrency(amount)} borrowed is still owing at the end of the term.`}
        </Callout>
      ) : null}

      <View>
        <SectionLabel>Loan</SectionLabel>
        <Card>
          <NumericField
            label="Loan amount"
            value={amount}
            onChange={(amount) => update({ amount })}
            prefix="$"
          />
          <Divider />
          <NumericField
            label="Interest rate"
            value={ratePercent}
            onChange={(ratePercent) => update({ ratePercent })}
            suffix="% p.a."
            decimal
          />
          <Divider />
          <NumericField
            label="Loan term"
            value={termYears}
            onChange={(termYears) => update({ termYears })}
            suffix="years"
          />
          <Divider />
          <DateField
            label="Start date"
            value={startDate}
            onChange={(startDate) => update({ startDate })}
          />
          <Divider />
          <SelectField
            label="Repayment type"
            value={repaymentType}
            options={REPAYMENT_TYPE_OPTIONS}
            onChange={(repaymentType) => update({ repaymentType })}
          />
          <Divider />
          <StackedField label="Repayment frequency">
            <Segmented
              fullWidth
              options={FREQUENCY_OPTIONS}
              value={frequency}
              onChange={(frequency) => update({ frequency })}
            />
          </StackedField>
        </Card>
      </View>

      <View>
        <SectionLabel>Property</SectionLabel>
        <Card>
          <NumericField
            label="Home value"
            value={homeValue}
            onChange={(homeValue) => update({ homeValue })}
            prefix="$"
          />
          <Divider />
          <NumericField
            label="Est. value growth"
            value={homeValueGrowthPercent}
            onChange={(homeValueGrowthPercent) => update({ homeValueGrowthPercent })}
            suffix="% p.a."
            decimal
          />
        </Card>
      </View>

      <Card>
        <Collapsible
          title="Additional repayments"
          summary={
            extraRepayment > 0
              ? `${formatCurrency(extraRepayment)} ${FREQUENCY_ADVERBS[frequency]}`
              : 'None'
          }>
          <NumericField
            label="Extra per repayment"
            hint={`On top of every ${FREQUENCY_ADVERBS[frequency]} repayment`}
            value={extraRepayment}
            onChange={(extraRepayment) => update({ extraRepayment })}
            prefix="$"
          />
        </Collapsible>
      </Card>

      <Card>
        <Collapsible
          title="Offset account"
          summary={offsetBalance > 0 ? formatCurrency(offsetBalance) : 'None'}>
          <NumericField
            label="Starting balance"
            value={offsetBalance}
            onChange={(offsetBalance) => update({ offsetBalance })}
            prefix="$"
          />
          <Divider />
          <NumericField
            label="Monthly income"
            value={monthlyIncome}
            onChange={(monthlyIncome) => update({ monthlyIncome })}
            prefix="$"
          />
          <Divider />
          <NumericField
            label="Monthly expenses"
            value={monthlyExpenses}
            onChange={(monthlyExpenses) => update({ monthlyExpenses })}
            prefix="$"
          />
          <View style={{ padding: Spacing.lg, paddingTop: 0 }}>
            <Callout muted>
              Whatever&apos;s left of your income after expenses is swept into the offset account
              automatically, reducing the interest-bearing balance from day one.
            </Callout>
          </View>
        </Collapsible>
      </Card>

      <View>
        <SectionLabel>Loan outlook</SectionLabel>
        <Card style={{ padding: Spacing.lg, gap: Spacing.lg }}>
          <Segmented
            fullWidth
            value={view}
            onChange={setView}
            options={[
              { value: 'chart', label: 'Chart' },
              { value: 'schedule', label: 'Schedule' },
            ]}
          />
          {view === 'chart' ? (
            <BalanceChart
              balances={result.balances}
              periodsPerYear={periodsPerYear}
              termYears={termYears}
              homeValue={homeValue}
              homeValueGrowthPercent={homeValueGrowthPercent}
              legend={
                interestOnly
                  ? `Interest only ${ioYears} year${ioYears === 1 ? '' : 's'}, then principal and interest`
                  : 'Principal and interest'
              }
            />
          ) : (
            <ScheduleList startDate={startDate} monthlyBalances={result.monthlyBalances} />
          )}
        </Card>
      </View>

      <SavedDetails onReset={reset} />
    </Screen>
  );
}
