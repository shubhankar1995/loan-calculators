import {
  FREQUENCY_ADVERBS,
  FREQUENCY_LABELS,
  PERIODS_PER_YEAR,
  REPAYMENT_TYPE_LABELS,
  calculateLoan,
  describeDuration,
  formatCurrency,
  formatRepayment,
  interestOnlyYears,
  todayISODate,
  type Frequency,
  type RepaymentType,
} from '@repayly/core';
import { useMemo, useState } from 'react';
import { View } from 'react-native';

import { BalanceChart } from '@/components/balance-chart';
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

type OutlookView = 'chart' | 'schedule';

const FREQUENCY_OPTIONS = (Object.keys(FREQUENCY_LABELS) as Frequency[]).map((value) => ({
  value,
  label: FREQUENCY_LABELS[value],
}));

const REPAYMENT_TYPE_OPTIONS = (Object.keys(REPAYMENT_TYPE_LABELS) as RepaymentType[]).map(
  (value) => ({ value, label: REPAYMENT_TYPE_LABELS[value] }),
);

export default function HomeLoanScreen() {
  const [amount, setAmount] = useState(1128000);
  const [startDate, setStartDate] = useState(() => todayISODate());
  const [termYears, setTermYears] = useState(30);
  const [ratePercent, setRatePercent] = useState(6.29);
  const [repaymentType, setRepaymentType] = useState<RepaymentType>('principal-and-interest');
  const [frequency, setFrequency] = useState<Frequency>('monthly');
  const [extraRepayment, setExtraRepayment] = useState(0);
  const [homeValue, setHomeValue] = useState(1280000);
  const [homeValueGrowthPercent, setHomeValueGrowthPercent] = useState(0);
  const [offsetBalance, setOffsetBalance] = useState(0);
  const [monthlyIncome, setMonthlyIncome] = useState(0);
  const [monthlyExpenses, setMonthlyExpenses] = useState(0);
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
    <Screen
      title="Home loan"
      subtitle="Adjust the details to see your estimated repayments.">
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
          <NumericField label="Loan amount" value={amount} onChange={setAmount} prefix="$" />
          <Divider />
          <NumericField
            label="Interest rate"
            value={ratePercent}
            onChange={setRatePercent}
            suffix="% p.a."
            decimal
          />
          <Divider />
          <NumericField
            label="Loan term"
            value={termYears}
            onChange={setTermYears}
            suffix="years"
          />
          <Divider />
          <DateField label="Start date" value={startDate} onChange={setStartDate} />
          <Divider />
          <SelectField
            label="Repayment type"
            value={repaymentType}
            options={REPAYMENT_TYPE_OPTIONS}
            onChange={setRepaymentType}
          />
          <Divider />
          <StackedField label="Repayment frequency">
            <Segmented
              fullWidth
              options={FREQUENCY_OPTIONS}
              value={frequency}
              onChange={setFrequency}
            />
          </StackedField>
        </Card>
      </View>

      <View>
        <SectionLabel>Property</SectionLabel>
        <Card>
          <NumericField label="Home value" value={homeValue} onChange={setHomeValue} prefix="$" />
          <Divider />
          <NumericField
            label="Est. value growth"
            value={homeValueGrowthPercent}
            onChange={setHomeValueGrowthPercent}
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
            onChange={setExtraRepayment}
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
            onChange={setOffsetBalance}
            prefix="$"
          />
          <Divider />
          <NumericField
            label="Monthly income"
            value={monthlyIncome}
            onChange={setMonthlyIncome}
            prefix="$"
          />
          <Divider />
          <NumericField
            label="Monthly expenses"
            value={monthlyExpenses}
            onChange={setMonthlyExpenses}
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
    </Screen>
  );
}
