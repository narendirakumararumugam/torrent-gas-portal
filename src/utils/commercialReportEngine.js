import { meters } from '../data/commercialMeters';
import { currentInvoiceBreakdown, billingCycles } from '../data/commercialBillsPayments';
import { BILLING_CYCLE as DEMAND_CYCLE, DCQ_MMBTU, MAX_FLOW_RATE_SCMH, dailyConsumption, takeOrPayQuota } from '../data/commercialMgoFlowAnalysis';
import { enumerateBuckets, formatBucketLabel } from './dateRange';
import { seededRandom } from './seededRandom';

function bucketDurationDays(granularity) {
  if (granularity === 'hourly') return 1 / 24;
  if (granularity === 'monthly') return 30;
  return 1;
}

function valueForBucket(meter, bucketIso, granularity) {
  const dailyBase = meter.dcq;
  const base = dailyBase * bucketDurationDays(granularity);
  const rand = seededRandom(`${meter.id}-${bucketIso}-${granularity}`);
  const noise = (rand() - 0.5) * 0.16;
  let value = base * (1 + noise);
  const isAnomaly = rand() > 0.9;
  if (isAnomaly) value *= 1.2;
  return { value: Math.round(value * 10) / 10, isAnomaly };
}

function round1(value) {
  return Math.round(value * 10) / 10;
}

function round2(value) {
  return Math.round(value * 100) / 100;
}

function formatCurrency(value) {
  return `₹${Math.round(value).toLocaleString('en-IN')}`;
}

function sum(values) {
  return round2(values.reduce((total, value) => total + value, 0));
}

function computeConsumptionTimeseries(params) {
  const { from, to, granularity = 'daily', meterIds = ['CMTR-1'], compareTo, aggregation = 'separate' } = params;
  const selectedMeters = meters.filter((meter) => meterIds.includes(meter.id));
  const buckets = enumerateBuckets(from, to, granularity);
  const labels = buckets.map((bucketIso) => formatBucketLabel(bucketIso, granularity));

  const perMeterSeries = selectedMeters.map((meter) => {
    const points = buckets.map((bucketIso) => valueForBucket(meter, bucketIso, granularity));
    return { label: meter.name, meterId: meter.id, data: points.map((point) => point.value), anomalies: points.map((point) => point.isAnomaly) };
  });

  const combinedTotals = buckets.map((_, index) => perMeterSeries.reduce((total, series) => total + series.data[index], 0));
  const series =
    aggregation === 'combined' && perMeterSeries.length > 1
      ? [{ label: 'Combined (all selected meters)', meterId: 'combined', data: combinedTotals, anomalies: buckets.map((_, index) => perMeterSeries.some((seriesItem) => seriesItem.anomalies[index])) }]
      : perMeterSeries;

  const total = combinedTotals.reduce((a, b) => a + b, 0);
  const avg = combinedTotals.length ? total / combinedTotals.length : 0;
  const peak = combinedTotals.length ? Math.max(...combinedTotals) : 0;
  const min = combinedTotals.length ? Math.min(...combinedTotals) : 0;
  const totalDCQ = selectedMeters.reduce((totalDcq, meter) => totalDcq + meter.dcq, 0) * buckets.length * bucketDurationDays(granularity);
  const percentOfDCQ = totalDCQ ? round1((total / totalDCQ) * 100) : 0;

  let compareSeries = null;
  if (compareTo === 'previous_period' && buckets.length > 0) {
    const rangeMs = new Date(to) - new Date(from) || 86400000;
    const prevTo = new Date(new Date(`${from}T00:00:00Z`).getTime() - 86400000).toISOString().slice(0, 10);
    const prevFrom = new Date(new Date(`${prevTo}T00:00:00Z`).getTime() - rangeMs).toISOString().slice(0, 10);
    const prevBuckets = enumerateBuckets(prevFrom, prevTo, granularity).slice(0, buckets.length);
    compareSeries = prevBuckets.map((bucketIso) => round1(selectedMeters.reduce((total, meter) => total + valueForBucket(meter, bucketIso, granularity).value, 0)));
  }

  const anomalies = [];
  series.forEach((item) => {
    item.anomalies.forEach((flag, index) => {
      if (flag) anomalies.push({ title: `Spike on ${item.label}`, detail: `${labels[index]}: ${item.data[index].toLocaleString('en-IN')} SCM - above expected range for ${item.label}.`, severity: 'high', meterId: item.meterId, label: labels[index] });
    });
  });

  const table = {
    columns: ['Timestamp', 'Meter', 'Consumption (SCM)', 'Anomaly'],
    rows: buckets.flatMap((_, bucketIndex) => series.map((item) => [labels[bucketIndex], item.label, item.data[bucketIndex], item.anomalies[bucketIndex] ? 'Yes' : 'No'])),
  };

  return {
    meta: { type: 'consumption_timeseries', params, generatedAt: new Date().toISOString() },
    chartType: 'line',
    labels,
    series: series.map((item) => ({ label: item.label, data: item.data, anomalies: item.anomalies })),
    compareSeries,
    stats: { total: Math.round(total), avg: Math.round(avg), peak: Math.round(peak), min: Math.round(min), percentOfDCQ },
    table,
    insights: [
      {
        type: percentOfDCQ > 100 ? 'suggestion' : 'kpi',
        severity: percentOfDCQ > 100 ? 'medium' : 'low',
        title: `${percentOfDCQ}% of meter DCQ utilised`,
        detail: 'Commercial meter consumption is measured against the selected meter set.',
      },
      {
        type: compareSeries ? 'kpi' : 'kpi',
        severity: 'low',
        title: `Average ${Math.round(avg).toLocaleString('en-IN')} SCM per bucket`,
        detail: 'Baseline average across the selected date range and meters.',
      },
    ],
    anomalies,
  };
}

function computeFlatRateBilling(params) {
  const from = params.from || '2026-09-16';
  const to = params.to || '2026-09-30';
  const cycles = billingCycles.filter((cycle) => cycle.invoicedDate >= from && cycle.invoicedDate <= to);
  const activeCycles = cycles.length ? cycles : billingCycles.slice(-3);
  const labels = activeCycles.map((cycle) => cycle.label);
  const invoiceAmounts = activeCycles.map((cycle) => cycle.invoiced);
  const paidAmounts = activeCycles.map((cycle) => cycle.paid);
  const outstandingAmounts = activeCycles.map((cycle) => Math.max(0, cycle.invoiced - cycle.paid));
  const latestCycle = activeCycles[activeCycles.length - 1] || billingCycles[billingCycles.length - 1];
  const latestOutstanding = Math.max(0, latestCycle.invoiced - latestCycle.paid);
  const total = sum(invoiceAmounts);
  const avg = activeCycles.length ? total / activeCycles.length : 0;

  return {
    meta: { type: 'flat_rate_billing', params: { from, to }, generatedAt: new Date().toISOString() },
    chartType: 'bar',
    stacked: false,
    labels,
    series: [
      { label: 'Invoice Amount', data: invoiceAmounts },
      { label: 'Paid Amount', data: paidAmounts, dashed: true },
    ],
    compareSeries: null,
    stats: { total, avg: round2(avg), peak: Math.max(...invoiceAmounts), min: Math.min(...invoiceAmounts), percentOfDCQ: null },
    table: { columns: ['Billing Cycle', 'Invoiced (₹)', 'Paid (₹)', 'Outstanding (₹)'], rows: activeCycles.map((cycle, index) => [cycle.label, cycle.invoiced, cycle.paid, outstandingAmounts[index]]) },
    insights: [
      {
        type: latestOutstanding > 0 ? 'suggestion' : 'kpi',
        severity: latestOutstanding > 0 ? 'medium' : 'low',
        title: latestOutstanding > 0 ? `${formatCurrency(latestOutstanding)} pending on latest bill` : 'Latest bill settled in full',
        detail: latestOutstanding > 0 ? `The latest commercial invoice remains partially open against ${latestCycle.label}.` : 'All visible commercial invoices are settled.',
      },
      {
        type: 'kpi',
        severity: 'low',
        title: `${formatCurrency(total)} billed across the selected cycles`,
        detail: 'Flat-rate commercial billing remains lower than the industrial reference account.',
      },
    ],
    anomalies: latestOutstanding > 0 ? [{ title: 'Open balance on latest cycle', detail: `${latestCycle.label} still has an outstanding amount of ${formatCurrency(latestOutstanding)}.`, severity: 'medium', label: latestCycle.label }] : [],
  };
}

function computeDemandFlowRate(params) {
  const from = params.from || DEMAND_CYCLE.from;
  const to = params.to || DEMAND_CYCLE.to;
  const series = from === DEMAND_CYCLE.from && to === DEMAND_CYCLE.to ? dailyConsumption : dailyConsumption.filter((day) => day.date >= from && day.date <= to);
  const activeSeries = series.length ? series : dailyConsumption;
  const labels = activeSeries.map((day) => formatBucketLabel(`${day.date}T00:00:00Z`, 'daily'));

  const consumptionData = activeSeries.map((day) => day.mmbtu);
  const flowData = activeSeries.map((day) => day.flowRateScmHr);
  const today = activeSeries[activeSeries.length - 1];

  const totalConsumption = consumptionData.reduce((a, b) => a + b, 0);
  const monthlyAverage = round2(totalConsumption / Math.max(activeSeries.length, 1));
  const efficiencyIndex = round2((monthlyAverage / DCQ_MMBTU) * 100);
  const peakFlow = Math.max(...flowData);
  const peakFlowDay = activeSeries[flowData.indexOf(peakFlow)];
  const peakFlowLabel = formatBucketLabel(`${peakFlowDay.date}T00:00:00Z`, 'daily');

  const alerts = [];
  if (efficiencyIndex < 90) {
    alerts.push({
      id: 'usage-efficiency',
      severity: 'high',
      title: 'Usage efficiency warning',
      message: `Average commercial draw (${efficiencyIndex}%) is below the notional 90% target against the contracted capacity baseline of ${DCQ_MMBTU} MMBTU.`,
    });
  }
  if (peakFlow > MAX_FLOW_RATE_SCMH) {
    alerts.push({
      id: 'peak-flow',
      severity: 'high',
      title: 'Maximum flow rate alert',
      message: `Peak flow rate of ${peakFlow.toFixed(1)} SCM/hr on ${peakFlowLabel} exceeded the maximum allowable flow rate of ${MAX_FLOW_RATE_SCMH} SCM/hr.`,
    });
  }

  const rows = activeSeries.map((day) => [day.date, day.mmbtu, day.flowRateScmHr, day.flowRateScmHr > MAX_FLOW_RATE_SCMH ? 'Yes' : 'No', day.nonOperational ? 'Yes' : 'No']);

  const anomalies = flowData
    .map((value, index) =>
      value > MAX_FLOW_RATE_SCMH ? { title: `Flow rate breach on ${labels[index]}`, detail: `${value.toFixed(1)} SCM/hr exceeded the ${MAX_FLOW_RATE_SCMH} SCM/hr limit.`, severity: 'high', label: labels[index] } : null,
    )
    .filter(Boolean);

  return {
    meta: { type: 'mgo_flowrate', params: { from, to }, generatedAt: new Date().toISOString() },
    chartType: 'line',
    labels,
    series: [
      { label: 'Daily Consumption (MMBTU)', data: consumptionData, anomalies: activeSeries.map((day) => day.nonOperational) },
      { label: 'Peak Flowrate (SCM/hr)', data: flowData, dashed: true, anomalies: flowData.map((value) => value > MAX_FLOW_RATE_SCMH) },
    ],
    compareSeries: null,
    stats: { total: round2(totalConsumption), avg: monthlyAverage, peak: peakFlow, min: Math.min(...consumptionData), percentOfDCQ: efficiencyIndex },
    table: { columns: ['Date', 'Consumption (MMBTU)', 'Peak Flowrate (SCM/hr)', 'Flow Alert', 'Non-Operational Day'], rows },
    insights: [
      {
        type: efficiencyIndex < 90 ? 'anomaly' : 'kpi',
        severity: efficiencyIndex < 90 ? 'high' : 'low',
        title: `${efficiencyIndex}% utilisation against contracted capacity`,
        detail: alerts.find((alert) => alert.id === 'usage-efficiency')?.message || 'Commercial usage is tracking comfortably against the contracted capacity baseline.',
      },
      {
        type: peakFlow > MAX_FLOW_RATE_SCMH ? 'anomaly' : 'kpi',
        severity: peakFlow > MAX_FLOW_RATE_SCMH ? 'high' : 'low',
        title: `Peak flow ${peakFlow.toFixed(1)} SCM/hr`,
        detail: alerts.find((alert) => alert.id === 'peak-flow')?.message || `Peak flow stayed within the ${MAX_FLOW_RATE_SCMH} SCM/hr contracted limit.`,
      },
    ],
    anomalies,
    kpis: {
      todaysConsumption: round2(today.mmbtu),
      todaysDate: today.date,
      monthlyAverageConsumption: monthlyAverage,
      minimumObligation: round2((DCQ_MMBTU * 0.9 * 100) / 100),
      dcq: DCQ_MMBTU,
      efficiencyIndex,
      peakFlowRate: peakFlow,
      peakFlowDate: peakFlowDay.date,
      maxAllowedFlowRate: MAX_FLOW_RATE_SCMH,
    },
    alerts,
  };
}

export function runReport(type, params = {}) {
  switch (type) {
    case 'consumption_timeseries':
    case 'custom':
      return computeConsumptionTimeseries(params);
    case 'flat_rate_billing':
      return computeFlatRateBilling(params);
    case 'mgo_flowrate':
      return computeDemandFlowRate(params);
    default:
      return computeConsumptionTimeseries(params);
  }
}