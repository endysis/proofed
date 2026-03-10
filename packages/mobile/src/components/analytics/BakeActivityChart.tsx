import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';
import { colors, spacing, fontFamily, fontSize, borderRadius } from '../../theme';
import type { MonthlyActivity } from '../../hooks/useAnalytics';

interface BakeActivityChartProps {
  data: MonthlyActivity[];
}

export default function BakeActivityChart({ data }: BakeActivityChartProps) {
  const screenWidth = Dimensions.get('window').width;
  const chartWidth = screenWidth - spacing[4] * 2 - spacing[4] * 2;

  // Calculate totals for the period
  const totalBakesInPeriod = data.reduce((sum, d) => sum + d.value, 0);
  const monthsWithBakes = data.filter((d) => d.value > 0).length;

  // Transform data for the chart - show all month labels
  const chartData = data.map((item) => ({
    value: item.value,
    label: item.label,
    dataPointText: item.value > 0 ? String(item.value) : '',
    hideDataPoint: item.value === 0,
  }));

  const maxValue = Math.max(...data.map((d) => d.value), 1);

  // Generate integer Y-axis labels
  const yAxisLabelTexts = Array.from({ length: maxValue + 2 }, (_, i) => String(i));

  if (data.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Monthly Baking Activity</Text>
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No baking activity yet</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Monthly Baking Activity</Text>
      <Text style={styles.subtitle}>
        {totalBakesInPeriod} bake{totalBakesInPeriod !== 1 ? 's' : ''} across {monthsWithBakes} month{monthsWithBakes !== 1 ? 's' : ''} in the last 6 months
      </Text>

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.primary }]} />
          <Text style={styles.legendText}>Bakes per month</Text>
        </View>
      </View>

      <View style={styles.chartContainer}>
        <LineChart
          data={chartData}
          width={chartWidth}
          height={150}
          spacing={chartWidth / 6}
          color={colors.primary}
          thickness={2}
          startFillColor={colors.primary}
          endFillColor={colors.pastelPink}
          startOpacity={0.3}
          endOpacity={0.05}
          areaChart
          curved
          hideDataPoints={false}
          dataPointsColor={colors.primary}
          dataPointsRadius={4}
          maxValue={maxValue + 1}
          noOfSections={maxValue + 1}
          yAxisLabelTexts={yAxisLabelTexts}
          yAxisColor="transparent"
          xAxisColor={colors.cardBorder}
          yAxisTextStyle={styles.axisLabel}
          xAxisLabelTextStyle={styles.axisLabel}
          rulesColor={colors.cardBorder}
          rulesType="dashed"
          adjustToWidth
          showVerticalLines
          verticalLinesColor={colors.cardBorder}
          verticalLinesThickness={1}
          verticalLinesStrokeDashArray={[3, 3]}
        />
      </View>

      {/* X-axis label */}
      <Text style={styles.axisTitle}>Month</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing[4],
    marginHorizontal: spacing[4],
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  title: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.base,
    color: colors.text,
  },
  subtitle: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
    color: colors.dustyMauve,
    marginTop: spacing[1],
    marginBottom: spacing[2],
  },
  legend: {
    flexDirection: 'row',
    marginBottom: spacing[3],
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: spacing[2],
  },
  legendText: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
    color: colors.text,
  },
  chartContainer: {
    marginLeft: -spacing[2],
  },
  axisLabel: {
    fontFamily: fontFamily.regular,
    fontSize: 9,
    color: colors.dustyMauve,
  },
  axisTitle: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
    color: colors.dustyMauve,
    textAlign: 'center',
    marginTop: spacing[2],
  },
  emptyState: {
    height: 150,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: colors.dustyMauve,
  },
});
