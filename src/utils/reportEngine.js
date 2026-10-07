import { meters } from '../data/meters';
import { hydraulicSites } from '../data/hydraulicSites';
import { contractProfile } from '../data/contractProfile';
import { currentInvoiceBreakdown } from '../data/billsPayments';
import { DCQ_MMBTU, MAX_FLOW_RATE_SCMH, MIN_OBLIGATION_MMBTU, BILLING_CYCLE as MGO_FLOW_CYCLE, dailyConsumption, takeOrPayQuota } from '../data/mgoFlowAnalysis';
import { SLAB_TIERS, BILLING_CYCLE as PRICE_SLAB_CYCLE, dailySlabDistribution } from '../data/priceSlabAnalysis';
import { enumerateBuckets, formatBucketLabel } from './dateRange';
import { seededRandom } from './seededRandom';

function bucketDurationDays(granularity) {
  if (granularity === 'hourly') return 1 / 24;
  if (granularity === 'monthly') return 30;
  return 1;
}

/* Deterministic synthetic consumption for a meter at a given bucket, with occasional spikes */
function valueForBucket(meter, bucketIso, granularity) {
  const dailyBase = meter.dcq;
  const base = dailyBase * bucketDurationDays(granularity);
  const rand = seededRandom(`${meter.id}-${bucketIso}-${granularity}`);
  const noise = (rand() - 0.5) * 0.16;
  let value = base * (1 + noise);
  const spikeRoll = rand();
  const isAnomaly = spikeRoll > 0.9;
  if (isAnomaly) value *= 1.32;
  return { value: Math.round(value * 10) / 10, isAnomaly };
}

function round1(value) {
  return Math.round(value * 10) / 10;
}

function round2(value) {
  return Math.round(value * 100) / 100;
}

function parseFirstNumber(value) {
  const match = String(value).match(/[\d.]+/);
  return match ? Number(match[0]) : 0;
}

function shiftMonth(dateLike, months) {
  const date = new Date(`${dateLike}T00:00:00Z`);
  const day = date.getUTCDate();
  const targetYear = date.getUTCFullYear();
  const targetMonth = date.getUTCMonth() + months;
  const firstOfTargetMonth = new Date(Date.UTC(targetYear, targetMonth, 1));
  const lastDayOfTargetMonth = new Date(Date.UTC(firstOfTargetMonth.getUTCFullYear(), firstOfTargetMonth.getUTCMonth() + 1, 0)).getUTCDate();
  const clampedDay = Math.min(day, lastDayOfTargetMonth);
  return new Date(Date.UTC(firstOfTargetMonth.getUTCFullYear(), firstOfTargetMonth.getUTCMonth(), clampedDay)).toISOString().slice(0, 10);
}

const PRODUCTION_SLAB_RATES = currentInvoiceBreakdown.rows.reduce((accumulator, row) => {
  const label = row.label.toLowerCase();
  const key = label.includes('non-mgo') ? 'nonMgo' : label.includes('excess') ? 'excess' : 'mgo';
  const quantity = parseFirstNumber(row.qty);
  accumulator[key] = quantity ? round2(row.amount / quantity) : 0;
  return accumulator;
}, { mgo: 0, nonMgo: 0, excess: 0 });

const PRODUCTION_VAT_RATE = currentInvoiceBreakdown.vatRate ?? 0.05;
const PRODUCTION_CONTRACT = {
  dcq: parseFirstNumber(contractProfile.terms.dcq),
  mdcq: parseFirstNumber(contractProfile.terms.mdcq),
  mgoTarget: Number(contractProfile.terms.mgo),
  excessLimit: Number(contractProfile.terms.excessLimit),
};

function splitIntoSlabs(total) {
  const mgo = Math.min(total, 300);
  const nonMgo = Math.min(Math.max(total - 300, 0), 200);
  const excess = Math.max(total - 500, 0);
  return { mgo: round2(mgo), nonMgo: round2(nonMgo), excess: round2(excess) };
}

function calculateSlabCost(slabs) {
  const preTax = round2(slabs.mgo * PRODUCTION_SLAB_RATES.mgo + slabs.nonMgo * PRODUCTION_SLAB_RATES.nonMgo + slabs.excess * PRODUCTION_SLAB_RATES.excess);
  const tax = round2(preTax * PRODUCTION_VAT_RATE);
  return { preTax, tax, total: round2(preTax + tax) };
}

function buildProductionHistory(from, to) {
  const buckets = enumerateBuckets(from, to, 'daily');
  return buckets.map((bucketIso, index) => {
    const source = dailyConsumption[index % dailyConsumption.length];
    const cycle = Math.floor(index / dailyConsumption.length);
    const rand = seededRandom(`production-history-${bucketIso}`);
    const cycleLift = 1 + cycle * 0.025;
    const operationalFactor = source.nonOperational ? 0.42 + rand() * 0.18 : 0.92 + (rand() - 0.5) * 0.14;
    const peakPulse = source.mmbtu > 400 ? 1.1 + rand() * 0.1 : index % 12 === 6 ? 1.14 : 1;
    const total = round2(Math.max(source.mmbtu * cycleLift * operationalFactor * peakPulse, source.nonOperational ? 28 : 120));
    return {
      date: bucketIso.slice(0, 10),
      total,
      sourceDate: source.date,
      nonOperational: source.nonOperational,
    };
  });
}

function smoothProductionHistory(series, mode, balanceStrength) {
  if (mode === 'historical') return series;
  const total = series.reduce((sum, day) => sum + day.total, 0);
  const average = total / Math.max(series.length, 1);
  const strength = Math.max(0, Math.min(100, balanceStrength ?? 45)) / 100;
  const modeBoost = mode === 'mgo_first' ? 0.18 : 0.08;
  const blend = Math.min(0.86, strength + modeBoost);
  const blended = series.map((day) => average + (day.total - average) * (1 - blend));
  const blendedTotal = blended.reduce((sum, value) => sum + value, 0) || 1;
  const normalized = blended.map((value) => round2((value * total) / blendedTotal));
  const roundedTotal = normalized.reduce((sum, value) => sum + value, 0);
  normalized[normalized.length - 1] = round2(normalized[normalized.length - 1] + (total - roundedTotal));
  return series.map((day, index) => ({ ...day, total: normalized[index] }));
}

function buildProductionScenarioRows(series, scenarioLabel) {
  let slabTotals = { mgo: 0, nonMgo: 0, excess: 0 };
  let costTotals = { preTax: 0, tax: 0, total: 0 };

  const rows = series.map((day) => {
    const slabs = splitIntoSlabs(day.total);
    const cost = calculateSlabCost(slabs);
    slabTotals = {
      mgo: slabTotals.mgo + slabs.mgo,
      nonMgo: slabTotals.nonMgo + slabs.nonMgo,
      excess: slabTotals.excess + slabs.excess,
    };
    costTotals = {
      preTax: costTotals.preTax + cost.preTax,
      tax: costTotals.tax + cost.tax,
      total: costTotals.total + cost.total,
    };

    return {
      date: day.date,
      total: day.total,
      slabs,
      cost,
      tier: slabs.excess > 0 ? 'Excess' : slabs.nonMgo > 0 ? 'Non-MGO' : 'MGO',
      highlight: day.nonOperational || slabs.excess > 0,
      sourceDate: day.sourceDate,
    };
  });

  return {
    rows,
    slabTotals: {
      mgo: round2(slabTotals.mgo),
      nonMgo: round2(slabTotals.nonMgo),
      excess: round2(slabTotals.excess),
    },
    costTotals: {
      preTax: round2(costTotals.preTax),
      tax: round2(costTotals.tax),
      total: round2(costTotals.total),
    },
    scenarioLabel,
  };
}

function computeProductionAnalysis(params) {
  const from = params.from || '2026-08-01';
  const to = params.to || '2026-08-31';
  const mode = params.simulationMode || 'peak_shift';
  const balanceStrength = Number(params.balanceStrength ?? 45);

  const history = buildProductionHistory(from, to);
  const forecastSeries = smoothProductionHistory(history, mode, balanceStrength);
  const scenarioLabel = 'Peak-shaved forecast';

  const baseline = buildProductionScenarioRows(history, 'Historical draw');
  const forecast = buildProductionScenarioRows(forecastSeries, scenarioLabel);

  const baselineTotal = baseline.costTotals.total;
  const forecastTotal = forecast.costTotals.total;
  const savings = round2(baselineTotal - forecastTotal);
  const savingsPercent = baselineTotal ? round1((savings / baselineTotal) * 100) : 0;
  const averageDailyForecast = forecast.rows.reduce((sum, row) => sum + row.total, 0) / Math.max(forecast.rows.length, 1);
  const peakDailyForecast = Math.max(...forecast.rows.map((row) => row.total));
  const daysInMgo = forecast.rows.filter((row) => row.total <= 300).length;
  const daysInNonMgo = forecast.rows.filter((row) => row.total > 300 && row.total <= 500).length;
  const daysInExcess = forecast.rows.filter((row) => row.total > 500).length;
  const totalVolume = forecast.rows.reduce((sum, row) => sum + row.total, 0);
  const percentOfDCQ = round1((averageDailyForecast / PRODUCTION_CONTRACT.dcq) * 100);

  const tableRows = forecast.rows.map((row, index) => [
    row.date,
    history[index].total,
    row.total,
    row.tier,
    row.cost.total,
    round2(row.cost.total - baseline.rows[index].cost.total),
  ]);

  const recommendations = [
    `Hold peak days below 500 MMBTU to avoid the premium Excess slab. The current forecast still shows ${daysInExcess} day(s) above that threshold.`,
    `Shift ${Math.max(8, Math.min(15, Math.round((daysInExcess + 1) * 3)))}% of the heaviest draw into lower-load days to keep more of the month inside the MGO tier.`,
    `Track low-draw maintenance windows deliberately: the model shows ${daysInMgo} day(s) already inside MGO, which can absorb redistributed volume more cheaply than the Excess tier.`,
  ];

  const insights = [
    {
      type: savings > 0 ? 'suggestion' : 'kpi',
      severity: savings > 0 ? 'medium' : 'low',
      title: `${savings >= 0 ? '₹' : '-₹'}${Math.abs(savings).toLocaleString('en-IN')} bill delta vs last month`,
      detail: savings > 0 ? `Smoothing the draw curve lowers the forecast by ${savingsPercent}% against replaying the historical pattern.` : 'The current scenario does not create a bill reduction over the historical baseline.',
    },
    {
      type: daysInExcess > 0 ? 'anomaly' : 'kpi',
      severity: daysInExcess > 0 ? 'high' : 'low',
      title: `${daysInExcess} excess-risk day${daysInExcess === 1 ? '' : 's'}`,
      detail: daysInExcess > 0 ? 'Those days are responsible for the highest marginal cost. Rebalance them first before changing the whole month.' : 'The forecast remains within the MGO and Non-MGO slabs only.',
    },
    {
      type: 'kpi',
      severity: 'low',
      title: `${percentOfDCQ}% of DCQ on average`,
      detail: `Average daily draw of ${round2(averageDailyForecast).toLocaleString('en-IN')} MMBTU is being measured against the ${PRODUCTION_CONTRACT.dcq} MMBTU contract baseline.`,
    },
  ];

  const anomalies = forecast.rows
    .filter((row) => row.highlight)
    .map((row) => ({
      title: row.tier === 'Excess' ? `Excess slab day on ${row.date}` : `Maintenance-informed low draw on ${row.date}`,
      detail: row.tier === 'Excess' ? `Projected total of ${row.total.toLocaleString('en-IN')} MMBTU crosses the 500 MMBTU cap.` : `Historical maintenance window on ${row.sourceDate} can be used to preserve the overall average.`,
      severity: row.tier === 'Excess' ? 'high' : 'low',
      label: row.date,
    }));

  return {
    meta: { type: 'production_analysis', params: { from, to, simulationMode: mode, balanceStrength }, generatedAt: new Date().toISOString() },
    chartType: 'line',
    labels: forecast.rows.map((row) => row.date),
    series: [
      { label: 'Historical draw', data: history.map((row) => row.total), anomalies: history.map((row) => row.nonOperational) },
      { label: scenarioLabel, data: forecast.rows.map((row) => row.total), dashed: mode !== 'historical', anomalies: forecast.rows.map((row) => row.tier === 'Excess') },
    ],
    compareSeries: null,
    stats: { total: round2(forecastTotal), avg: round2(forecastTotal / Math.max(forecast.rows.length, 1)), peak: round2(peakDailyForecast), min: round2(Math.min(...forecast.rows.map((row) => row.total))), percentOfDCQ },
    table: {
      columns: ['Date', 'Historical Draw (MMBTU)', 'Forecast Draw (MMBTU)', 'Tier', 'Forecast Bill (₹)', 'Delta vs Baseline (₹)'],
      rows: tableRows,
    },
    insights,
    anomalies,
    production: {
      contract: PRODUCTION_CONTRACT,
      vatRate: PRODUCTION_VAT_RATE,
      rates: PRODUCTION_SLAB_RATES,
      scenarioMode: mode,
      balanceStrength,
      baseline: {
        ...baseline,
        totalVolume: round2(baseline.rows.reduce((sum, row) => sum + row.total, 0)),
        averageDaily: round2(baseline.rows.reduce((sum, row) => sum + row.total, 0) / Math.max(baseline.rows.length, 1)),
      },
      forecast: {
        ...forecast,
        totalVolume: round2(totalVolume),
        averageDaily: round2(averageDailyForecast),
      },
      savings: { amount: savings, percent: savingsPercent },
      daysInMgo,
      daysInNonMgo,
      daysInExcess,
      recommendations,
    },
  };
}

function buildInsights({ total, avg, percentOfDCQ, anomalies, compareTotal }) {
  const insights = [];
  if (anomalies.length > 0) {
    insights.push({
      type: 'anomaly',
      severity: 'high',
      title: `${anomalies.length} anomal${anomalies.length === 1 ? 'y' : 'ies'} detected`,
      detail: anomalies[0].detail,
    });
  }
  if (percentOfDCQ !== undefined) {
    insights.push({
      type: percentOfDCQ > 100 ? 'suggestion' : 'kpi',
      severity: percentOfDCQ > 100 ? 'medium' : 'low',
      title: `${percentOfDCQ}% of MGQ utilised`,
      detail:
        percentOfDCQ > 100
          ? 'Consumption exceeds the minimum guaranteed quantity - review for excess-slab charges.'
          : 'Consumption is within the contracted minimum guaranteed quantity.',
    });
  }
  if (compareTotal !== null && compareTotal !== undefined && compareTotal > 0) {
    const delta = Math.round(((total - compareTotal) / compareTotal) * 1000) / 10;
    insights.push({
      type: 'kpi',
      severity: delta > 15 ? 'medium' : 'low',
      title: `${delta >= 0 ? '+' : ''}${delta}% vs previous period`,
      detail: `Total consumption of ${Math.round(total).toLocaleString('en-IN')} SCM compared with ${Math.round(compareTotal).toLocaleString('en-IN')} SCM previously.`,
    });
  }
  if (avg !== undefined) {
    insights.push({
      type: 'kpi',
      severity: 'low',
      title: `Average ${Math.round(avg).toLocaleString('en-IN')} SCM per bucket`,
      detail: 'Baseline average across the selected date range and meters.',
    });
  }
  return insights;
}

function buildComparisonSeries({ buckets, selectedMeters, granularity, compareTo, from, to }) {
  const buildShiftedSeries = (label, monthShift) => ({
    label,
    data: buckets.map((bucketIso) => {
      const shiftedDate = shiftMonth(bucketIso.slice(0, 10), monthShift);
      const shiftedBucket = `${shiftedDate}T00:00:00Z`;
      return round1(selectedMeters.reduce((sum, meter) => sum + valueForBucket(meter, shiftedBucket, granularity).value, 0));
    }),
  });

  const buildPreviousPeriodSeries = () => {
    const rangeMs = new Date(to) - new Date(from) || 86400000;
    const prevTo = new Date(new Date(`${from}T00:00:00Z`).getTime() - 86400000).toISOString().slice(0, 10);
    const prevFrom = new Date(new Date(`${prevTo}T00:00:00Z`).getTime() - rangeMs).toISOString().slice(0, 10);
    const prevBuckets = enumerateBuckets(prevFrom, prevTo, granularity).slice(0, buckets.length);
    return [{
      label: 'Previous Period',
      data: prevBuckets.map((bucketIso) => round1(selectedMeters.reduce((sum, meter) => sum + valueForBucket(meter, bucketIso, granularity).value, 0))),
    }];
  };

  const normalizedCompareTo = compareTo === '' ? 'none' : (compareTo || null);

  if (normalizedCompareTo === 'none') return null;

  if (granularity === 'monthly') {
    if (normalizedCompareTo === 'same_month_last_year') return [buildShiftedSeries('Same Month Last Year', -12)];
    if (normalizedCompareTo === 'previous_month') return [buildShiftedSeries('Previous Month', -1)];
    return [buildShiftedSeries('Previous Month', -1), buildShiftedSeries('Same Month Last Year', -12)];
  }

  if (normalizedCompareTo === 'previous_month') return [buildShiftedSeries('Previous Month', -1)];
  if (normalizedCompareTo === 'same_month_last_year') return [buildShiftedSeries('Same Month Last Year', -12)];
  if (normalizedCompareTo === 'month_over_month_and_last_year') {
    return [buildShiftedSeries('Previous Month', -1), buildShiftedSeries('Same Month Last Year', -12)];
  }

  return normalizedCompareTo === 'previous_period' ? buildPreviousPeriodSeries() : null;
}

function computeConsumptionTimeseries(params) {
  const { from, to, granularity = 'daily', meterIds = ['MTR-1'], compareTo, aggregation = 'separate' } = params;
  const selectedMeters = meters.filter((meter) => meterIds.includes(meter.id));
  const buckets = enumerateBuckets(from, to, granularity);
  const labels = buckets.map((bucketIso) => formatBucketLabel(bucketIso, granularity));

  const perMeterSeries = selectedMeters.map((meter) => {
    const points = buckets.map((bucketIso) => valueForBucket(meter, bucketIso, granularity));
    return { label: meter.name, meterId: meter.id, data: points.map((p) => p.y ?? p.value), anomalies: points.map((p) => p.isAnomaly) };
  });

  const combinedTotals = buckets.map((_, idx) => perMeterSeries.reduce((sum, s) => sum + s.data[idx], 0));

  const series =
    aggregation === 'combined' && perMeterSeries.length > 1
      ? [{
          label: 'Combined (all selected meters)',
          meterId: 'combined',
          data: combinedTotals,
          anomalies: buckets.map((_, idx) => perMeterSeries.some((s) => s.anomalies[idx])),
        }]
      : perMeterSeries;
  const total = combinedTotals.reduce((a, b) => a + b, 0);
  const avg = combinedTotals.length ? total / combinedTotals.length : 0;
  const peak = combinedTotals.length ? Math.max(...combinedTotals) : 0;
  const min = combinedTotals.length ? Math.min(...combinedTotals) : 0;
  const totalDCQ = selectedMeters.reduce((sum, m) => sum + m.dcq, 0) * buckets.length * bucketDurationDays(granularity);
  const percentOfDCQ = totalDCQ ? round1((total / totalDCQ) * 100) : 0;

  const compareSeries = buckets.length > 0 ? buildComparisonSeries({ buckets, selectedMeters, granularity, compareTo, from, to }) : null;
  const compareInsightTotal = Array.isArray(compareSeries) && compareSeries[0]?.data ? compareSeries[0].data.reduce((a, b) => a + b, 0) : null;

  const anomalies = [];
  series.forEach((s) => {
    s.anomalies.forEach((flag, idx) => {
      if (flag) anomalies.push({ title: `Spike on ${s.label}`, detail: `${labels[idx]}: ${s.data[idx].toLocaleString('en-IN')} SCM - above expected range for ${s.label}.`, severity: 'high', meterId: s.meterId, label: labels[idx] });
    });
  });

  const table = {
    columns: ['Timestamp', 'Meter', 'Consumption (SCM)', 'Anomaly'],
    rows: buckets.flatMap((_, bucketIdx) => series.map((s) => [labels[bucketIdx], s.label, s.data[bucketIdx], s.anomalies[bucketIdx] ? 'Yes' : 'No'])),
  };

  return {
    meta: { type: 'consumption_timeseries', params, generatedAt: new Date().toISOString() },
    chartType: 'line',
    labels,
    series: series.map((s) => ({ label: s.label, data: s.data, anomalies: s.anomalies })),
    compareSeries,
    stats: { total: Math.round(total), avg: Math.round(avg), peak: Math.round(peak), min: Math.round(min), percentOfDCQ },
    table,
    insights: buildInsights({ total, avg, percentOfDCQ, anomalies, compareTotal: compareInsightTotal }),
    anomalies,
  };
}

/* Deterministic fallback generator so custom date ranges still return sensible data outside the canonical demo cycle */
function generatedMgoFlowDay(dateIso) {
  const rand = seededRandom(`mgoflow-${dateIso}`);
  const dayOfMonth = new Date(`${dateIso}T00:00:00Z`).getUTCDate();
  const isShutdown = dayOfMonth % 11 === 3;
  const isPeak = dayOfMonth % 13 === 0;
  let mmbtu = DCQ_MMBTU * (0.92 + (rand() - 0.5) * 0.12);
  if (isShutdown) mmbtu *= 0.18;
  if (isPeak) mmbtu *= 1.55;
  mmbtu = round2(Math.max(mmbtu, 0));
  let flowRateScmHr = round1(mmbtu * 1.05 + (rand() - 0.5) * 20);
  if (isPeak) flowRateScmHr = round1(flowRateScmHr * 1.35);
  return { date: dateIso, mmbtu, flowRateScmHr: Math.max(flowRateScmHr, 0), nonOperational: isShutdown };
}

function getMgoFlowSeries(from, to) {
  if (from === MGO_FLOW_CYCLE.from && to === MGO_FLOW_CYCLE.to) return dailyConsumption;
  const buckets = enumerateBuckets(from, to, 'daily');
  return buckets.length ? buckets.map((iso) => generatedMgoFlowDay(iso.slice(0, 10))) : dailyConsumption;
}

/* Consumption analysis - Price Slab: daily MGO / Non-MGO / Excess segregation for a single-plant customer */
function computePriceSlab(params) {
  const from = params.from || PRICE_SLAB_CYCLE.from;
  const to = params.to || PRICE_SLAB_CYCLE.to;
  const series = from === PRICE_SLAB_CYCLE.from && to === PRICE_SLAB_CYCLE.to ? dailySlabDistribution : generatedPriceSlabSeries(from, to);
  const labels = series.map((d) => formatBucketLabel(`${d.date}T00:00:00Z`, 'daily'));

  const mgoData = series.map((d) => d.mgo);
  const nonMgoData = series.map((d) => d.nonMgo);
  const excessData = series.map((d) => d.excess);

  const totals = {
    mgo: round2(mgoData.reduce((a, b) => a + b, 0)),
    nonMgo: round2(nonMgoData.reduce((a, b) => a + b, 0)),
    excess: round2(excessData.reduce((a, b) => a + b, 0)),
  };
  const grandTotal = round2(totals.mgo + totals.nonMgo + totals.excess);
  const dailyTotals = series.map((d) => round2(d.mgo + d.nonMgo + d.excess));

  const tiers = SLAB_TIERS.map((tier) => ({ ...tier, total: totals[tier.key] }));

  const rows = series.map((d, idx) => [d.date, d.mgo, d.nonMgo, d.excess, dailyTotals[idx]]);

  const insights = [
    {
      type: totals.excess > 0 ? 'suggestion' : 'kpi',
      severity: totals.excess > 0 ? 'medium' : 'low',
      title: `${totals.excess.toFixed(2)} MMBTU in Excess Slab`,
      detail:
        totals.excess > 0
          ? 'Excess-slab volume is flagged "Exceeding MDCQ Cap" - review daily draw to avoid repeat breaches.'
          : 'No consumption exceeded the MDCQ cap in this period.',
    },
    {
      type: 'kpi',
      severity: 'low',
      title: `${totals.mgo.toFixed(2)} MMBTU billed at the Standard Tariff Rate`,
      detail: `MGO slab (≤300 MMBTU/day) accounts for ${grandTotal ? round1((totals.mgo / grandTotal) * 100) : 0}% of total consumption in this cycle.`,
    },
  ];

  return {
    meta: { type: 'price_slab', params: { from, to }, generatedAt: new Date().toISOString() },
    chartType: 'bar',
    stacked: true,
    labels,
    series: [
      { label: 'MGO Slab', data: mgoData },
      { label: 'Non-MGO Slab', data: nonMgoData },
      { label: 'Excess Slab', data: excessData },
    ],
    compareSeries: null,
    stats: { total: grandTotal, avg: round2(grandTotal / Math.max(series.length, 1)), peak: Math.max(...dailyTotals), min: Math.min(...dailyTotals), percentOfDCQ: null },
    table: { columns: ['Date', 'MGO Slab (MMBTU)', 'Non-MGO Slab (MMBTU)', 'Excess Slab (MMBTU)', 'Total (MMBTU)'], rows },
    insights,
    anomalies: [],
    tiers,
  };
}

function generatedPriceSlabSeries(from, to) {
  const buckets = enumerateBuckets(from, to, 'daily');
  if (!buckets.length) return dailySlabDistribution;
  return buckets.map((iso) => {
    const dateIso = iso.slice(0, 10);
    const rand = seededRandom(`priceslab-${dateIso}`);
    const dayOfMonth = new Date(iso).getUTCDate();
    const total = DCQ_MMBTU * (0.75 + rand() * 0.5) * (dayOfMonth % 9 === 0 ? 1.8 : 1);
    const mgo = round2(Math.min(total, 300));
    const nonMgo = round2(Math.min(Math.max(total - 300, 0), 200));
    const excess = round2(Math.max(total - 500, 0));
    return { date: dateIso, mgo, nonMgo, excess };
  });
}

/* Consumption analysis - MGO & Flow Rate: Take-or-Pay efficiency, DCQ tracking, and flow-rate alerts */
function computeMgoFlowRate(params) {
  const from = params.from || MGO_FLOW_CYCLE.from;
  const to = params.to || MGO_FLOW_CYCLE.to;
  const series = getMgoFlowSeries(from, to);
  const labels = series.map((d) => formatBucketLabel(`${d.date}T00:00:00Z`, 'daily'));

  const consumptionData = series.map((d) => d.mmbtu);
  const flowData = series.map((d) => d.flowRateScmHr);
  const today = series[series.length - 1];

  const totalConsumption = consumptionData.reduce((a, b) => a + b, 0);
  const monthlyAverage = round2(totalConsumption / Math.max(series.length, 1));
  const efficiencyIndex = round2((monthlyAverage / DCQ_MMBTU) * 100);
  const peakFlow = Math.max(...flowData);
  const peakFlowDay = series[flowData.indexOf(peakFlow)];
  const peakFlowLabel = formatBucketLabel(`${peakFlowDay.date}T00:00:00Z`, 'daily');

  const alerts = [];
  if (efficiencyIndex < 90) {
    alerts.push({
      id: 'take-or-pay',
      severity: 'high',
      title: 'Take-or-Pay Utilization Warning',
      message: `Monthly average consumption efficiency (${efficiencyIndex}%) is below the mandated 90% Take-or-Pay threshold of the Contracted Capacity (DCQ). Operating below this level may attract under-utilization penalties per industrial tariff agreements.`,
    });
  }
  if (peakFlow > MAX_FLOW_RATE_SCMH) {
    alerts.push({
      id: 'max-flow-rate',
      severity: 'high',
      title: 'Maximum Flow Rate Alert',
      message: `Peak flow rate of ${peakFlow.toFixed(1)} SCM/hr on ${peakFlowLabel} exceeded the maximum allowable flow rate of ${MAX_FLOW_RATE_SCMH} SCM/hr.`,
    });
  }

  const kpis = {
    todaysConsumption: round2(today.mmbtu),
    todaysDate: today.date,
    monthlyAverageConsumption: monthlyAverage,
    minimumObligation: MIN_OBLIGATION_MMBTU,
    dcq: DCQ_MMBTU,
    efficiencyIndex,
    peakFlowRate: peakFlow,
    peakFlowDate: peakFlowDay.date,
    maxAllowedFlowRate: MAX_FLOW_RATE_SCMH,
  };

  const rows = series.map((d) => [d.date, d.mmbtu, d.flowRateScmHr, d.flowRateScmHr > MAX_FLOW_RATE_SCMH ? 'Yes' : 'No', d.nonOperational ? 'Yes' : 'No']);

  const insights = [
    {
      type: efficiencyIndex < 90 ? 'anomaly' : 'kpi',
      severity: efficiencyIndex < 90 ? 'high' : 'low',
      title: `${efficiencyIndex}% Take-or-Pay efficiency`,
      detail: alerts.find((a) => a.id === 'take-or-pay')?.message || 'Consumption is tracking above the 90% Take-or-Pay threshold.',
    },
    {
      type: peakFlow > MAX_FLOW_RATE_SCMH ? 'anomaly' : 'kpi',
      severity: peakFlow > MAX_FLOW_RATE_SCMH ? 'high' : 'low',
      title: `Peak flow ${peakFlow.toFixed(1)} SCM/hr`,
      detail: alerts.find((a) => a.id === 'max-flow-rate')?.message || `Peak flow stayed within the ${MAX_FLOW_RATE_SCMH} SCM/hr contracted limit.`,
    },
  ];

  const anomalies = flowData
    .map((value, idx) =>
      value > MAX_FLOW_RATE_SCMH
        ? { title: `Flow rate breach on ${labels[idx]}`, detail: `${value.toFixed(1)} SCM/hr exceeded the ${MAX_FLOW_RATE_SCMH} SCM/hr limit.`, severity: 'high', label: labels[idx] }
        : null,
    )
    .filter(Boolean);

  return {
    meta: { type: 'mgo_flowrate', params: { from, to }, generatedAt: new Date().toISOString() },
    chartType: 'line',
    labels,
    series: [
      { label: 'Daily Consumption (MMBTU)', data: consumptionData, anomalies: series.map((d) => d.nonOperational) },
      { label: 'Peak Flowrate (SCM/hr)', data: flowData, dashed: true, anomalies: flowData.map((value) => value > MAX_FLOW_RATE_SCMH) },
    ],
    compareSeries: null,
    stats: { total: round2(totalConsumption), avg: monthlyAverage, peak: peakFlow, min: Math.min(...consumptionData), percentOfDCQ: efficiencyIndex },
    table: { columns: ['Date', 'Consumption (MMBTU)', 'Peak Flowrate (SCM/hr)', 'Flow Alert', 'Non-Operational Day'], rows },
    insights,
    anomalies,
    kpis,
    alerts,
    takeOrPay: { series, quota: takeOrPayQuota, minimumObligation: MIN_OBLIGATION_MMBTU },
  };
}

function computeHydraulicFeasibility() {
  const labels = hydraulicSites.map((site) => site.id);
  const insights = [
    { type: 'kpi', severity: 'low', title: `${hydraulicSites.filter((s) => s.verdict === 'Feasible').length} of ${hydraulicSites.length} sites fully feasible`, detail: 'Sites marked "Review required" need further hydraulic modelling before approval.' },
  ];

  return {
    meta: { type: 'hydraulic_feasibility', params: {}, generatedAt: new Date().toISOString() },
    chartType: 'bar',
    labels,
    series: [
      { label: 'Distance (m)', data: hydraulicSites.map((s) => s.distanceMeters) },
      { label: 'Recommended Diameter (mm)', data: hydraulicSites.map((s) => s.recommendedDiameterMm) },
    ],
    compareSeries: null,
    stats: { total: hydraulicSites.length, avg: Math.round(hydraulicSites.reduce((sum, s) => sum + s.distanceMeters, 0) / hydraulicSites.length), peak: Math.max(...hydraulicSites.map((s) => s.distanceMeters)), min: Math.min(...hydraulicSites.map((s) => s.distanceMeters)), percentOfDCQ: null },
    table: { columns: ['Site', 'Customer', 'Distance (m)', 'Recommended Diameter (mm)', 'Pressure Drop (bar)', 'Verdict'], rows: hydraulicSites.map((s) => [s.id, s.customer, s.distanceMeters, s.recommendedDiameterMm, s.pressureDropBar, s.verdict]) },
    insights,
    anomalies: [],
  };
}

export function runReport(type, params = {}) {
  switch (type) {
    case 'consumption_timeseries':
    case 'custom':
      return computeConsumptionTimeseries(params);
    case 'price_slab':
      return computePriceSlab(params);
    case 'mgo_flowrate':
      return computeMgoFlowRate(params);
    case 'production_analysis':
      return computeProductionAnalysis(params);
    case 'hydraulic_feasibility':
      return computeHydraulicFeasibility();
    default:
      return computeConsumptionTimeseries(params);
  }
}
