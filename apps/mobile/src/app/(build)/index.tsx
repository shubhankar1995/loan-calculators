import {
  DEFAULT_CONSTRUCTION_STAGES,
  PERIODS_PER_YEAR,
  calculateHouseAndLand,
  describeDuration,
  formatCurrency,
  formatRepayment,
  todayISODate,
  type ConstructionStage,
} from '@loanlab/core';
import * as Haptics from 'expo-haptics';
import { SymbolView } from 'expo-symbols';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { BalanceChart } from '@/components/balance-chart';
import { ScheduleList } from '@/components/schedule-list';
import { Screen } from '@/components/screen';
import { SummaryHero, TileGrid, type TileData } from '@/components/summary';
import { Callout, Card, Divider, SectionLabel } from '@/components/ui/card';
import { Collapsible } from '@/components/ui/collapsible';
import {
  DateField,
  NumericField,
  NumericInput,
  Segmented,
  TextField,
} from '@/components/ui/fields';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type OutlookView = 'chart' | 'schedule';

export default function HouseAndLandScreen() {
  const [landAmount, setLandAmount] = useState(780000);
  const [constructionAmount, setConstructionAmount] = useState(501660);
  const [landDepositAmount, setLandDepositAmount] = useState(0);
  const [constructionDepositAmount, setConstructionDepositAmount] = useState(0);
  const [startDate, setStartDate] = useState(() => todayISODate());
  const [termYears, setTermYears] = useState(30);
  const [ratePercent, setRatePercent] = useState(6.29);
  const [constructionMonths, setConstructionMonths] = useState(9);
  const [stages, setStages] = useState<ConstructionStage[]>(DEFAULT_CONSTRUCTION_STAGES);
  const [homeValue, setHomeValue] = useState(1281660);
  const [homeValueGrowthPercent, setHomeValueGrowthPercent] = useState(0);
  const [startingAccountBalance, setStartingAccountBalance] = useState(0);
  const [monthlyIncome, setMonthlyIncome] = useState(0);
  const [monthlyExpenses, setMonthlyExpenses] = useState(0);
  const [constructionRent, setConstructionRent] = useState(0);
  const [view, setView] = useState<OutlookView>('chart');

  const result = useMemo(
    () =>
      calculateHouseAndLand({
        landAmount,
        constructionAmount,
        landDepositAmount,
        constructionDepositAmount,
        termYears,
        annualRatePercent: ratePercent,
        constructionMonths,
        stages,
        homeValue,
        homeValueGrowthPercent,
        startingAccountBalance,
        monthlyIncome,
        monthlyExpenses,
        constructionRent,
      }),
    [
      landAmount,
      constructionAmount,
      landDepositAmount,
      constructionDepositAmount,
      termYears,
      ratePercent,
      constructionMonths,
      stages,
      homeValue,
      homeValueGrowthPercent,
      startingAccountBalance,
      monthlyIncome,
      monthlyExpenses,
      constructionRent,
    ],
  );

  const tiles: TileData[] = [
    { label: 'Once fully drawn down', value: formatRepayment(result.finalConstructionRepayment) },
    { label: 'After construction (P&I)', value: formatRepayment(result.postConstructionRepayment) },
    { label: 'Total repayments', value: formatCurrency(result.totalRepayments) },
    { label: 'Total interest charged', value: formatCurrency(result.totalInterest) },
  ];

  const homeValueLegend = `(ramps from the land value up to the completed home value, then ${
    homeValueGrowthPercent > 0 ? `grows ${homeValueGrowthPercent}% a year` : 'stays constant'
  })`;

  return (
    <Screen
      title="House and land"
      subtitle="See how repayments step up as your build draws down, then settle once it's finished.">
      <SummaryHero
        label="Repayment during construction"
        value={formatRepayment(result.landRepayment)}
        unit="/ month"
        caption={`${ratePercent}% p.a. over a ${termYears} year term`}
      />

      <TileGrid tiles={tiles} />

      {result.offsetMonthsSaved > 0 ? (
        <Callout>
          Your offset account clears the loan{' '}
          {describeDuration(result.offsetMonthsSaved, PERIODS_PER_YEAR.monthly)} sooner and saves{' '}
          {formatCurrency(result.offsetInterestSaved)} in interest.
        </Callout>
      ) : null}

      <Callout muted>
        Interest only during the {constructionMonths} month build, charged on the amount drawn so
        far. Once construction completes, the full {formatCurrency(result.totalAmount)} switches to
        principal and interest for the rest of the term.
      </Callout>

      <View>
        <SectionLabel>Land</SectionLabel>
        <Card>
          <NumericField label="Land price" value={landAmount} onChange={setLandAmount} prefix="$" />
          <Divider />
          <NumericField
            label="Deposit paid"
            value={landDepositAmount}
            onChange={setLandDepositAmount}
            prefix="$"
          />
          <Divider />
          <DateField label="Settlement date" value={startDate} onChange={setStartDate} />
          <Divider />
          <NumericField
            label="Interest rate"
            value={ratePercent}
            onChange={setRatePercent}
            suffix="% p.a."
            decimal
          />
          <Divider />
          <NumericField label="Loan term" value={termYears} onChange={setTermYears} suffix="years" />
        </Card>
      </View>

      <View>
        <SectionLabel>Construction</SectionLabel>
        <Card>
          <NumericField
            label="Construction price"
            value={constructionAmount}
            onChange={setConstructionAmount}
            prefix="$"
          />
          <Divider />
          <NumericField
            label="Deposit paid"
            value={constructionDepositAmount}
            onChange={setConstructionDepositAmount}
            prefix="$"
          />
          <Divider />
          <NumericField
            label="Build period"
            value={constructionMonths}
            onChange={setConstructionMonths}
            suffix="months"
          />
        </Card>
      </View>

      <View>
        <SectionLabel>Property</SectionLabel>
        <Card>
          <NumericField
            label="Completed home value"
            value={homeValue}
            onChange={setHomeValue}
            prefix="$"
          />
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
        <Collapsible title="Build stages" summary={`${stages.length} stages`}>
          <StageEditor stages={stages} onChange={setStages} />
        </Collapsible>
      </Card>

      <Card>
        <Collapsible
          title="Offset account"
          summary={
            startingAccountBalance > 0 ? formatCurrency(startingAccountBalance) : 'None'
          }>
          <NumericField
            label="Starting balance"
            value={startingAccountBalance}
            onChange={setStartingAccountBalance}
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
          <Divider />
          <NumericField
            label="Rent during build"
            hint="Assumed to stop once you move in"
            value={constructionRent}
            onChange={setConstructionRent}
            prefix="$"
          />
          <View style={styles.calloutWrap}>
            <Callout muted>
              While you&apos;re renting, {formatCurrency(result.offsetContributionDuringConstruction)}{' '}
              a month is swept into the offset account, rising to{' '}
              {formatCurrency(result.offsetContributionAfterConstruction)} once the build finishes.
            </Callout>
          </View>
        </Collapsible>
      </Card>

      <View>
        <SectionLabel>Loan outlook</SectionLabel>
        <Card style={styles.outlookCard}>
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
              periodsPerYear={12}
              termYears={termYears}
              propertyValues={result.propertyValues}
              homeValueLegend={homeValueLegend}
              legend={`Interest only during the ${constructionMonths} month build, then principal and interest`}
            />
          ) : (
            <ScheduleList startDate={startDate} monthlyBalances={result.monthlyBalances} />
          )}
        </Card>
      </View>
    </Screen>
  );
}

interface StageEditorProps {
  stages: ConstructionStage[];
  onChange: (stages: ConstructionStage[]) => void;
}

/** Add, rename, reweight and remove the progress-payment stages of the build. */
function StageEditor({ stages, onChange }: StageEditorProps) {
  const theme = useTheme();
  const total = stages.reduce((sum, stage) => sum + Math.max(stage.percent, 0), 0);

  const update = (index: number, patch: Partial<ConstructionStage>) =>
    onChange(stages.map((stage, i) => (i === index ? { ...stage, ...patch } : stage)));

  const remove = (index: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onChange(stages.filter((_stage, i) => i !== index));
  };

  const add = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onChange([...stages, { name: `Stage ${stages.length + 1}`, percent: 0 }]);
  };

  return (
    <View>
      {stages.map((stage, index) => (
        <View key={index}>
          {index > 0 ? <Divider /> : null}
          <View style={styles.stageRow}>
            <View style={styles.stageName}>
              <TextField
                value={stage.name}
                onChange={(name) => update(index, { name })}
                placeholder="Stage name"
                accessibilityLabel={`Stage ${index + 1} name`}
              />
            </View>
            <View style={styles.stagePercent}>
              <NumericInput
                compact
                value={stage.percent}
                onChange={(percent) => update(index, { percent })}
                suffix="%"
                decimal
                accessibilityLabel={`${stage.name} share of the build`}
              />
            </View>
            <Pressable
              onPress={() => remove(index)}
              accessibilityRole="button"
              accessibilityLabel={`Remove ${stage.name}`}
              hitSlop={8}>
              <SymbolView name="minus.circle.fill" size={22} tintColor={theme.muted} />
            </Pressable>
          </View>
        </View>
      ))}

      <View style={styles.stageFooter}>
        <Pressable onPress={add} accessibilityRole="button" style={styles.addStage} hitSlop={8}>
          <SymbolView name="plus.circle.fill" size={20} tintColor={theme.accent} />
          <Text style={[styles.addStageText, { color: theme.accent }]}>Add stage</Text>
        </Pressable>
        <Text
          style={[
            styles.stageTotal,
            { color: Math.round(total) === 100 ? theme.muted : theme.homeValue },
          ]}>
          {Math.round(total)}% of the build
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  calloutWrap: {
    padding: Spacing.lg,
    paddingTop: 0,
  },
  outlookCard: {
    padding: Spacing.lg,
    gap: Spacing.lg,
  },
  stageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  stageName: {
    flex: 1,
  },
  stagePercent: {
    width: 104,
  },
  stageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.lg,
  },
  addStage: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  addStageText: {
    fontSize: 15,
    fontWeight: '600',
  },
  stageTotal: {
    fontSize: 12,
    fontWeight: '600',
  },
});
