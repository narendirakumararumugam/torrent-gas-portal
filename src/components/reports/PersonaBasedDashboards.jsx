import React, { useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  BarChart3,
  CalendarClock,
  CircleDollarSign,
  Factory,
  Gauge,
  LineChart,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import Card from '../common/Card';
import Badge from '../common/Badge';
import SectionHeading from '../common/SectionHeading';
import ReportChart from './ReportChart';
import { contractProfile } from '../../data/contractProfile';
import { BILLING_REFERENCE_DATE, availablePaymentSecurity, billingCycles, currentInvoiceBreakdown, lastClearedPayment } from '../../data/billsPayments';
import { invoices } from '../../data/invoices';
import { dailyConsumption, takeOrPayQuota } from '../../data/mgoFlowAnalysis';
import { complaintTickets } from '../../data/complaints';
import { LATE_PAYMENT_INTEREST_RATE, getCycleLedger } from '../../utils/billingEngine';

function round1(value) {
  return Math.round(value * 10) / 10;
}

function round2(value) {
  return Math.round(value * 100) / 100;
}

function parseNumber(value) {
  const match = String(value).match(/[\d.]+/);
  return match ? Number(match[0]) : 0;
}

function formatCurrency(value) {
  return `₹${Math.round(value).toLocaleString('en-IN')}`;
}

function formatDecimal(value, digits = 1) {
  return Number(value).toFixed(digits);
}

function pctChange(current, previous) {
  if (!previous) return 0;
  return round1(((current - previous) / previous) * 100);
}

function sum(values, selector) {
  return round2(values.reduce((total, item) => total + selector(item), 0));
}

function isWithinRange(dateLike, from, to) {
  return dateLike >= from && dateLike <= to;
}

function shiftDate(dateLike, days) {
  const date = new Date(`${dateLike}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function mmbtuToScm(value) {
  return round2((value * 252000) / 9300);
}

function getMonthKey(dateLike) {
  return dateLike.slice(0, 7);
}

function getDaysInMonth(dateLike) {
  const date = new Date(`${dateLike}T00:00:00Z`);
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate();
}

function getMinimumShutdownDaysRequired(series, threshold) {
  if (!series.length) return -1;

  const sorted = [...series].sort((left, right) => right.mmbtu - left.mmbtu);
  let keptDays = 0;
  let keptTotal = 0;

  for (const day of sorted) {
    const nextKeptDays = keptDays + 1;
    const nextKeptTotal = keptTotal + day.mmbtu;

    if (nextKeptTotal / nextKeptDays < threshold) break;

    keptDays = nextKeptDays;
    keptTotal = nextKeptTotal;
  }

  if (keptDays === 0) return -1;

  return series.length - keptDays;
}

const contractDcq = parseNumber(contractProfile.terms.dcq);
const contractMdcq = parseNumber(contractProfile.terms.mdcq);
const minimumObligation = round2(contractDcq * parseNumber(contractProfile.terms.mgo) / 100);

const invoiceRows = currentInvoiceBreakdown.rows.map((row) => ({
  ...row,
  quantity: parseNumber(row.qty),
  share: 0,
}));

const invoiceTotal = sum(invoiceRows, (row) => row.amount);
const invoiceQuantity = sum(invoiceRows, (row) => row.quantity);
const slabRows = invoiceRows.map((row) => ({
  ...row,
  share: invoiceTotal ? round1((row.amount / invoiceTotal) * 100) : 0,
}));

const currentExcessRow = slabRows.find((row) => String(row.label).toLowerCase().includes('excess')) || slabRows[slabRows.length - 1];
const currentNonMgoRow = slabRows.find((row) => String(row.label).toLowerCase().includes('non-mgo')) || slabRows[1] || slabRows[0];
const excessShare = invoiceTotal ? round1((currentExcessRow.amount / invoiceTotal) * 100) : 0;

const currentMonthConsumption = dailyConsumption.filter((day) => day.date >= '2026-10-01' && day.date <= '2026-10-08');
const operationalTotal = sum(currentMonthConsumption, (day) => day.mmbtu);
const operationalAverage = currentMonthConsumption.length ? round2(operationalTotal / currentMonthConsumption.length) : 0;
const operationalIntensity = contractDcq ? round2(operationalAverage / contractDcq) : 0;
const operationalPeak = currentMonthConsumption.reduce((peak, day) => (day.mmbtu > peak.mmbtu ? day : peak), currentMonthConsumption[0]);
const operationalLowDrawDays = currentMonthConsumption.filter((day) => day.mmbtu < 100).length;
const operationalBaseLoadDays = currentMonthConsumption.filter((day) => day.mmbtu >= 100 && day.mmbtu <= contractDcq).length;
const operationalHighLoadDays = currentMonthConsumption.filter((day) => day.mmbtu > contractDcq && day.mmbtu <= contractMdcq).length;
const operationalExcessDays = currentMonthConsumption.filter((day) => day.mmbtu > contractMdcq).length;
const billingSpendTotal = sum(billingCycles, (cycle) => cycle.invoiced);
const billingAverage = billingCycles.length ? round2(billingSpendTotal / billingCycles.length) : 0;
const latestCycle = billingCycles[billingCycles.length - 1];
const priorCycle = billingCycles[billingCycles.length - 2];

const julSpend = billingCycles.slice(0, 2).reduce((total, cycle) => total + cycle.invoiced, 0);
const augSpend = billingCycles.slice(2, 4).reduce((total, cycle) => total + cycle.invoiced, 0);
const fortnightTrend = pctChange(latestCycle.invoiced, priorCycle.invoiced);
const monthTrend = pctChange(augSpend, julSpend);
const outstandingLatest = latestCycle.invoiced - latestCycle.paid;
const securityCoverPercent = latestCycle.invoiced ? round1((availablePaymentSecurity / latestCycle.invoiced) * 100) : 0;

/* Corporate-only: internal ledger/risk data, never surfaced to the customer-facing dashboard */
const billingLedger = getCycleLedger(billingCycles, BILLING_REFERENCE_DATE);
const totalAccruedLateInterest = sum(billingLedger, (cycle) => cycle.lateInterest);
const openComplaintTickets = complaintTickets.filter((ticket) => ticket.status !== 'resolved');
const securityDeficit = Math.max(0, outstandingLatest - availablePaymentSecurity);

const invoiceStatusDetail = `Partially paid. Due ${latestCycle.dueDate}.`;

const allowanceRemaining = takeOrPayQuota.annualQuotaDays - takeOrPayQuota.usedDaysYTD;
/* 90% of DCQ is the customer's MGO obligation; the monthly average draw must stay at or above it */
const mgoCompliant = operationalAverage >= minimumObligation;
const mgoShortfall = round2(Math.max(minimumObligation - operationalAverage, 0));
const currentMonthDays = currentMonthConsumption.length ? getDaysInMonth(currentMonthConsumption[0].date) : 0;
const remainingDaysInMonth = Math.max(currentMonthDays - currentMonthConsumption.length, 0);
const maxAllowedShutdownDays = Math.min(allowanceRemaining, remainingDaysInMonth);
const minimumShutdownDaysRequired = getMinimumShutdownDaysRequired(currentMonthConsumption, minimumObligation);


const operationLabels = currentMonthConsumption.map((day) => day.date.slice(5));
const operationSeries = [
  { label: 'Daily consumption', data: currentMonthConsumption.map((day) => day.mmbtu) },
  { label: 'DCQ target', data: currentMonthConsumption.map(() => contractDcq), dashed: true },
];

const financeLabels = billingCycles.map((cycle) => cycle.label);

const managementLabels = billingCycles.map((cycle) => cycle.label);
const managementSeries = [{ label: 'Fortnight spend', data: billingCycles.map((cycle) => cycle.invoiced) }];

const augustInvoiceSummary = invoices.find((invoice) => invoice.period === '01 Aug - 31 Aug 2026');
const septemberInvoiceSummary = invoices.find((invoice) => invoice.period === '01 Sep - 30 Sep 2026');
const augustConsumptionTotal = augustInvoiceSummary ? parseNumber(augustInvoiceSummary.consumption) : 0;
const septemberConsumptionTotal = septemberInvoiceSummary ? parseNumber(septemberInvoiceSummary.consumption) : 0;
const augustBillingTotal = augustInvoiceSummary ? parseNumber(augustInvoiceSummary.amount) : 0;
const septemberBillingTotal = septemberInvoiceSummary ? parseNumber(septemberInvoiceSummary.amount) : 0;
const monthConsumptionTrend = pctChange(septemberConsumptionTotal, augustConsumptionTotal);
const monthBillTrend = pctChange(septemberBillingTotal, augustBillingTotal);

const septemberPeakShaveSeries = dailyConsumption.filter((day) => day.date >= '2026-09-16' && day.date <= '2026-09-30');
const septemberPeakShaveLabels = septemberPeakShaveSeries.map((day) => day.date.slice(5));

const invoiceRates = slabRows.reduce(
  (accumulator, row) => {
    const label = String(row.label).toLowerCase();
    const rate = row.quantity ? row.amount / row.quantity : 0;
    if (label.includes('excess')) accumulator.excess = rate;
    else if (label.includes('non-mgo')) accumulator.nonMgo = rate;
    else accumulator.mgo = rate;
    return accumulator;
  },
  { mgo: 0, nonMgo: 0, excess: 0 },
);

function estimateSeptemberPeakShave(targetCap) {
  const cap = Math.max(260, Math.min(targetCap, contractMdcq));
  const peakDay = septemberPeakShaveSeries.reduce((peak, day) => (day.mmbtu > peak.mmbtu ? day : peak), septemberPeakShaveSeries[0]);
  const daysAboveCap = septemberPeakShaveSeries.filter((day) => day.mmbtu > cap);
  const shavedVolume = daysAboveCap.reduce((total, day) => total + (day.mmbtu - cap), 0);

  let remainingShavedVolume = shavedVolume;
  const excessMoved = Math.min(remainingShavedVolume, currentExcessRow.quantity);
  remainingShavedVolume -= excessMoved;
  const nonMgoMoved = Math.min(remainingShavedVolume, currentNonMgoRow.quantity);

  const preTaxSavings = excessMoved * Math.max(invoiceRates.excess - invoiceRates.mgo, 0) + nonMgoMoved * Math.max(invoiceRates.nonMgo - invoiceRates.mgo, 0);
  const totalSavings = round2(preTaxSavings * (1 + (currentInvoiceBreakdown.vatRate ?? 0.05)));

  return {
    cap,
    peakDay,
    daysAboveCap: daysAboveCap.length,
    shavedVolume: round2(shavedVolume),
    excessMoved: round2(excessMoved),
    nonMgoMoved: round2(nonMgoMoved),
    projectedBill: round2(latestCycle.invoiced - totalSavings),
    totalSavings,
    actualSeries: septemberPeakShaveSeries.map((day) => day.mmbtu),
    shavedSeries: septemberPeakShaveSeries.map((day) => Math.min(day.mmbtu, cap)),
    targetSeries: septemberPeakShaveSeries.map(() => cap),
  };
}

const DEFAULT_RANGE_FROM = '2026-10-01';
const DEFAULT_RANGE_TO = '2026-10-08';

const personaTabs = [
  {
    key: 'management',
    label: 'Management Overview',
    icon: ShieldCheck,
    description: 'Executive trends, contract health, and spend control.',
  },
  {
    key: 'operations',
    label: 'Operations parameter',
    icon: Factory,
    description: 'Daily consumption, fuel efficiency, and inventory mapping.',
  },
  {
    key: 'finance',
    label: 'Financials',
    icon: CircleDollarSign,
    description: 'Cost per unit, spend vs budget, and security exposure.',
  },
];

function MetricCard({ icon: Icon, label, value, detail, tone = 'text-slate-900', badge, className = '' }) {
  return (
    <Card className={`p-4 ${className}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{label}</p>
          <div className="mt-2 flex items-center gap-2">
            <p className={`text-lg font-semibold ${tone}`}>{value}</p>
            {badge}
          </div>
        </div>
        <Icon className="h-4.5 w-4.5 text-emerald-600" aria-hidden="true" />
      </div>
      <p className="mt-2 text-xs leading-5 text-slate-500">{detail}</p>
    </Card>
  );
}

function OperationsView() {
  const [plannedShutdownDays, setPlannedShutdownDays] = useState(minimumShutdownDaysRequired > 0 ? Math.min(minimumShutdownDaysRequired, maxAllowedShutdownDays) : 0);
  const plannedShutdownDaysValue = Math.min(Math.max(Number.isFinite(plannedShutdownDays) ? plannedShutdownDays : 0, 0), maxAllowedShutdownDays);
  const remainingOperationalDays = Math.max(remainingDaysInMonth - plannedShutdownDaysValue, 0);
  const targetMonthlyVolume = minimumObligation * currentMonthDays;
  const requiredDailyAverage = remainingOperationalDays > 0 ? round1(Math.max((targetMonthlyVolume - operationalTotal) / remainingOperationalDays, 0)) : null;
  const isUnachievable = requiredDailyAverage === null || requiredDailyAverage > contractMdcq;

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-slate-900">Planned shutdown days</p>
            <p className="text-xs text-slate-500">Set the number of shutdown days for the rest of October.</p>
          </div>
          <div className="rounded-xl bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-900">
            {plannedShutdownDaysValue} day{plannedShutdownDaysValue === 1 ? '' : 's'}
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_140px]">
          <input
            type="range"
            min="0"
            max={maxAllowedShutdownDays}
            step="1"
            value={plannedShutdownDaysValue}
            onChange={(event) => setPlannedShutdownDays(Number(event.target.value))}
            className="w-full accent-emerald-600"
          />
          <input
            type="number"
            min="0"
            max={maxAllowedShutdownDays}
            step="1"
            value={plannedShutdownDaysValue}
            onChange={(event) => setPlannedShutdownDays(Number(event.target.value))}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-900 outline-none focus:border-emerald-600"
          />
        </div>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <MetricCard
          icon={Activity}
          label="Cumulative current month consumption"
          value={`${formatDecimal(operationalTotal, 1)} MMBTU`}
          detail={`Cumulative draw from ${currentMonthConsumption[0].date} to ${currentMonthConsumption[currentMonthConsumption.length - 1].date} in the current billing cycle.`}
        />
        <MetricCard
          icon={Gauge}
          label="Average per day"
          value={`${formatDecimal(operationalAverage, 1)} MMBTU`}
          detail={`Equivalent to ${formatDecimal(operationalIntensity, 2)}x the contracted DCQ baseline.`}
        />
        <MetricCard
          icon={TrendingUp}
          label="Peak day"
          value={`${formatDecimal(operationalPeak.mmbtu, 1)} MMBTU`}
          detail={`${operationalPeak.date} is the strongest load day in the current sequence.`}
        />
        <MetricCard
          icon={CalendarClock}
          label="Remaining operational days"
          value={`${remainingOperationalDays} day${remainingOperationalDays === 1 ? '' : 's'}`}
          detail={`After ${plannedShutdownDaysValue} planned shutdown day(s), the remaining October operating window is ${remainingOperationalDays} day(s).`}
          className="border-slate-200 bg-slate-50"
          tone="text-slate-700"
        />
        <MetricCard
          icon={Gauge}
          label="Required daily average"
          value={isUnachievable ? 'Unachievable' : `${formatDecimal(requiredDailyAverage, 1)} MMBTU/day`}
          detail={isUnachievable
            ? 'DCQ Target is unachievable with selected shutdown days.'
            : `The remaining operational days must average this much to finish October above ${minimumObligation} MMBTU/day.`}
          className={isUnachievable ? 'border-rose-200 bg-rose-50' : 'border-emerald-200 bg-emerald-50'}
          tone={isUnachievable ? 'text-rose-700' : 'text-emerald-700'}
        />
      </div>

      {isUnachievable && (
        <Card className="border-rose-200 bg-rose-50 p-4 text-rose-900">
          <p className="text-sm font-semibold">DCQ Target is unachievable with selected shutdown days.</p>
          <p className="mt-1 text-xs text-rose-800">
            The required daily average exceeds the maximum daily capacity of {formatDecimal(contractMdcq, 0)} MMBTU/day, or there are no operational days left after the planned shutdowns.
          </p>
        </Card>
      )}

      <Card className={`p-4 ${mgoCompliant ? 'border-emerald-200 bg-emerald-50' : 'border-rose-200 bg-rose-50'}`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${mgoCompliant ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
              {mgoCompliant ? <ShieldCheck className="h-4.5 w-4.5" aria-hidden="true" /> : <AlertTriangle className="h-4.5 w-4.5" aria-hidden="true" />}
            </div>
            <div>
              <p className={`text-sm font-semibold ${mgoCompliant ? 'text-emerald-900' : 'text-rose-900'}`}>
                {mgoCompliant ? 'Minimum off-take obligation is on track' : 'Monthly average is below the MGO obligation'}
              </p>
              <p className={`text-xs ${mgoCompliant ? 'text-emerald-700' : 'text-rose-700'}`}>
                Obligation is 90% of DCQ = {minimumObligation} MMBTU/day. Current monthly average is {formatDecimal(operationalAverage, 1)} MMBTU/day.
              </p>
            </div>
          </div>
          {!mgoCompliant && (
            <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-rose-700 ring-1 ring-rose-200">
              Shortfall {formatDecimal(mgoShortfall, 1)} MMBTU/day
            </span>
          )}
        </div>
      </Card>

      <Card className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-sm font-semibold text-slate-900">Daily consumption tracking</p>
            <p className="text-xs text-slate-500">Draw pattern versus the 300 MMBTU DCQ target.</p>
          </div>
          <LineChart className="h-4.5 w-4.5 text-emerald-600" aria-hidden="true" />
        </div>
        <div className="mt-4">
          <ReportChart chartType="line" labels={operationLabels} series={operationSeries} height={270} />
        </div>
      </Card>
    </div>
  );
}

function FinanceView() {
  const [budgetBaseline, setBudgetBaseline] = useState(billingAverage);
  const [budgetInput, setBudgetInput] = useState(String(Math.round(billingAverage)));
  const [peakShaveCap, setPeakShaveCap] = useState(contractDcq);

  const variance = latestCycle.invoiced - budgetBaseline;

  const handleBudgetChange = (event) => {
    const raw = event.target.value;
    setBudgetInput(raw);
    const parsed = Number(raw);
    if (raw.trim() !== '' && Number.isFinite(parsed) && parsed >= 0) setBudgetBaseline(parsed);
  };

  const resetBudget = () => {
    setBudgetBaseline(billingAverage);
    setBudgetInput(String(Math.round(billingAverage)));
  };

  const peakShaveScenario = estimateSeptemberPeakShave(peakShaveCap);
  const peakShaveSeries = [
    { label: 'Actual September draw', data: peakShaveScenario.actualSeries },
    { label: `Peak-shaved at ${peakShaveScenario.cap} MMBTU`, data: peakShaveScenario.shavedSeries },
    { label: 'Target cap', data: peakShaveScenario.targetSeries, dashed: true },
  ];
  const peakShaveCards = [
    {
      label: 'Latest September bill',
      value: formatCurrency(latestCycle.invoiced),
      detail: `Cycle ${latestCycle.label} billed on ${latestCycle.dueDate}.`,
      icon: Wallet,
    },
    {
      label: 'Peak day',
      value: `${peakShaveScenario.peakDay.date.slice(8)} Sep - ${formatDecimal(peakShaveScenario.peakDay.mmbtu, 1)} MMBTU`,
      detail: 'The 26 Sep spike drives most of the avoidable high-tier exposure.',
      icon: BarChart3,
    },
    {
      label: 'Potential saving',
      value: formatCurrency(peakShaveScenario.totalSavings),
      detail: 'Assumes the shaved volume is re-shaped into lower September load days.',
      icon: TrendingDown,
      tone: 'text-emerald-700',
    },
    {
      label: 'Projected bill after shave',
      value: formatCurrency(peakShaveScenario.projectedBill),
      icon: CircleDollarSign,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={Wallet} label="Latest invoice" value={formatCurrency(latestCycle.invoiced)} detail={invoiceStatusDetail} />
        <MetricCard
          icon={ShieldCheck}
          label="Security cover"
          value={`${formatDecimal(securityCoverPercent, 1)}%`}
          detail={`Available security of ${formatCurrency(availablePaymentSecurity)} against the latest bill.`}
        />
      </div>

      <Card className="p-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-sm font-semibold text-slate-900">Slab-wise cost optimization</p>
            <p className="text-xs text-slate-500">Current invoice mix and where the bill can be trimmed.</p>
          </div>
          <TrendingDown className="h-4.5 w-4.5 text-emerald-600" aria-hidden="true" />
        </div>

        <div className="mt-4 space-y-3">
          {slabRows.map((row) => (
            <div key={row.label} className="rounded-xl border border-slate-200 p-3">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{row.label}</p>
                  <p className="text-xs text-slate-500">
                    {row.quantity.toLocaleString('en-IN')} MMBTU at {row.rate}
                  </p>
                </div>
                <p className="text-sm font-semibold text-slate-900">{formatCurrency(row.amount)}</p>
              </div>
              <div className="mt-2 flex items-center justify-between text-[11px] font-medium text-slate-500">
                <span>{row.share}% of the invoice</span>
                <span>{row.label.includes('Excess') ? 'Optimize peak draw first' : 'Lower-tier carry forward'}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-sm font-semibold text-emerald-900">Optimization signal</p>
          <p className="mt-1 text-xs leading-5 text-emerald-800">
            The Excess slab contributes {formatCurrency(currentExcessRow.amount)}. Keeping peak days below {contractMdcq} MMBTU/day will move spend back into lower tariff bands.
          </p>
        </div>
      </Card>

      <Card className="p-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-700">
              <TrendingDown className="h-3.5 w-3.5" aria-hidden="true" />
              Peak-shave analysis
            </div>
            <h3 className="mt-3 text-xl font-semibold text-slate-900">September 2026 curve</h3>
            <p className="mt-1 max-w-xl text-sm leading-6 text-slate-500">
              The latest billed cycle was 16-30 Sep 2026. This view estimates how much of that bill could have been saved by shaving September peaks down to a lower daily cap.
            </p>
          </div>

          <div className="w-full max-w-xs rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center justify-between gap-3 text-xs font-semibold text-slate-600">
              <span>Target cap</span>
              <span>{peakShaveCap} MMBTU/day</span>
            </div>
            <input
              type="range"
              min="260"
              max={contractMdcq}
              step="5"
              value={peakShaveCap}
              onChange={(event) => setPeakShaveCap(Number(event.target.value))}
              className="mt-3 w-full accent-emerald-600"
              aria-label="Peak shave target cap"
            />
            <p className="mt-2 text-[11px] leading-5 text-slate-500">
              Lower the cap to test how much of the September bill could have been moved out of the higher tariff bands.
            </p>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {peakShaveCards.map((card) => {
            const Icon = card.icon;
            return (
              <div key={card.label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">{card.label}</p>
                  <Icon className="h-4.5 w-4.5 text-emerald-600" aria-hidden="true" />
                </div>
                <p className={`mt-2 text-lg font-semibold ${card.tone || 'text-slate-900'}`}>{card.value}</p>
                <p className="mt-1 text-xs leading-5 text-slate-500">{card.detail}</p>
              </div>
            );
          })}
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-700">Shaved volume</p>
            <p className="mt-1 text-lg font-semibold text-emerald-900">{formatDecimal(peakShaveScenario.shavedVolume, 1)} MMBTU</p>
          </div>
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-700">Moved from Excess</p>
            <p className="mt-1 text-lg font-semibold text-emerald-900">{formatDecimal(peakShaveScenario.excessMoved, 1)} MMBTU</p>
          </div>
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-700">Moved from Non-MGO</p>
            <p className="mt-1 text-lg font-semibold text-emerald-900">{formatDecimal(peakShaveScenario.nonMgoMoved, 1)} MMBTU</p>
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm font-semibold text-amber-900">How the saving is estimated</p>
          <p className="mt-1 text-xs leading-5 text-amber-800">
            The model assumes September peak volume above the cap would have been shifted into lower-load days, reclassifying first from Excess and then from Non-MGO into the cheaper MGO band.
          </p>
        </div>

        <div className="mt-4">
          <ReportChart chartType="line" labels={septemberPeakShaveLabels} series={peakShaveSeries} height={300} />
        </div>
      </Card>

    </div>
  );
}

function ManagementView({ audience }) {
  const [rangeFrom, setRangeFrom] = useState(DEFAULT_RANGE_FROM);
  const [rangeTo, setRangeTo] = useState(DEFAULT_RANGE_TO);

  const selectedRange = useMemo(() => {
    const filteredConsumption = dailyConsumption.filter((day) => isWithinRange(day.date, rangeFrom, rangeTo));
    const filteredBills = billingCycles.filter((cycle) => isWithinRange(cycle.invoicedDate, rangeFrom, rangeTo));
    const selectedDays = Math.max(1, Math.round((new Date(`${rangeTo}T00:00:00Z`) - new Date(`${rangeFrom}T00:00:00Z`)) / 86400000) + 1);
    const comparisonRangeFrom = shiftDate(rangeFrom, -selectedDays);
    const comparisonRangeTo = shiftDate(rangeTo, -selectedDays);
    const comparisonConsumption = dailyConsumption.filter((day) => isWithinRange(day.date, comparisonRangeFrom, comparisonRangeTo));

    const selectedConsumptionMmbtu = sum(filteredConsumption, (day) => day.mmbtu);
    const selectedConsumptionScm = mmbtuToScm(selectedConsumptionMmbtu);
    const selectedBillValue = sum(filteredBills, (cycle) => cycle.invoiced);
    const comparisonConsumptionMmbtu = sum(comparisonConsumption, (day) => day.mmbtu);

    return {
      dayCount: filteredConsumption.length,
      billCount: filteredBills.length,
      selectedConsumptionMmbtu,
      selectedConsumptionScm,
      selectedBillValue,
      consumptionTrend: pctChange(selectedConsumptionMmbtu, comparisonConsumptionMmbtu),
    };
  }, [rangeFrom, rangeTo]);

  const billFortnightTrend = pctChange(latestCycle.invoiced, priorCycle.invoiced);

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-slate-900">Period Range</p>
            <p className="text-xs text-slate-500">Adjust the range to recalculate cumulative gas consumption and bill value.</p>
          </div>
          <button
            type="button"
            onClick={() => {
              setRangeFrom(DEFAULT_RANGE_FROM);
              setRangeTo(DEFAULT_RANGE_TO);
            }}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
          >
            Reset to current period
          </button>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <label className="block text-xs">
            <span className="text-slate-500">From</span>
            <input
              type="date"
              value={rangeFrom}
              onChange={(event) => setRangeFrom(event.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 outline-none focus:border-emerald-600"
            />
          </label>
          <label className="block text-xs">
            <span className="text-slate-500">To</span>
            <input
              type="date"
              value={rangeTo}
              onChange={(event) => setRangeTo(event.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 outline-none focus:border-emerald-600"
            />
          </label>
        </div>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={Factory}
          label="Cumulative Gas Consumption"
          value={`${formatDecimal(selectedRange.selectedConsumptionMmbtu, 1)} MMBTU`}
          detail={`${formatDecimal(selectedRange.selectedConsumptionScm, 1)} SCM across the selected range.`}
        />
        <MetricCard
          icon={Wallet}
          label="Overall Bill Value"
          value={formatCurrency(selectedRange.selectedBillValue)}
          detail="Total invoiced spend across the selected billing-period range."
        />
        <MetricCard
          icon={CircleDollarSign}
          label="Payment status"
          value="Partially paid"
          detail={`Due ${latestCycle.dueDate}`}
          className="border-rose-200 bg-rose-50"
          badge={
            <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-rose-700">
              Due {formatCurrency(outstandingLatest)}
            </span>
          }
          tone="text-rose-700"
        />
        <MetricCard
          icon={ShieldCheck}
          label="Security cover"
          value={`${formatDecimal(securityCoverPercent, 1)}%`}
          detail={`Available security of ${formatCurrency(availablePaymentSecurity)} against the latest bill.`}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr]">
        <Card className="p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-sm font-semibold text-slate-900">Last 5 billing cycles</p>
            </div>
            <BarChart3 className="h-4.5 w-4.5 text-emerald-600" aria-hidden="true" />
          </div>
          <div className="mt-4">
            <ReportChart chartType="bar" labels={managementLabels} series={managementSeries} height={270} />
          </div>
        </Card>
      </div>

      <Card className="p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">Consumption insights</p>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-3 shadow-sm">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Fortnight trend</p>
            <p className={`mt-1 text-2xl font-semibold ${selectedRange.consumptionTrend <= 0 ? 'text-rose-600' : 'text-emerald-700'}`}>{selectedRange.consumptionTrend >= 0 ? '+' : ''}{formatDecimal(selectedRange.consumptionTrend, 1)}%</p>
            <p className="mt-1 text-xs leading-5 text-slate-600">Consumption versus the previous equal-length window.</p>
            <p className={`mt-3 text-sm font-semibold ${billFortnightTrend <= 0 ? 'text-rose-600' : 'text-emerald-700'}`}>{billFortnightTrend >= 0 ? '+' : ''}{formatDecimal(billFortnightTrend, 1)}%</p>
            <p className="text-xs leading-5 text-slate-500">Bill value versus the previous billed fortnight.</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-3 shadow-sm">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Month-on-month</p>
            <p className={`mt-1 text-2xl font-semibold ${monthConsumptionTrend <= 0 ? 'text-rose-600' : 'text-emerald-700'}`}>{monthConsumptionTrend >= 0 ? '+' : ''}{formatDecimal(monthConsumptionTrend, 1)}%</p>
            <p className="mt-1 text-xs leading-5 text-slate-600">September consumption versus August from invoice records.</p>
            <p className={`mt-3 text-sm font-semibold ${monthBillTrend <= 0 ? 'text-rose-600' : 'text-emerald-700'}`}>{monthBillTrend >= 0 ? '+' : ''}{formatDecimal(monthBillTrend, 1)}%</p>
            <p className="text-xs leading-5 text-slate-500">September bill value versus August.</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-3 shadow-sm">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Actual vs Contracted MGO</p>
            <p className={`mt-1 text-2xl font-semibold ${mgoCompliant ? 'text-emerald-700' : 'text-rose-600'}`}>Actual 227.3 MMBTU</p>
            <p className="mt-1 text-sm font-semibold text-slate-700">Contracted 270 MMBTU</p>
            <p className="mt-1 text-xs leading-5 text-slate-600">{mgoCompliant ? 'Monthly average meets the 90% DCQ obligation.' : `Average is ${formatDecimal(mgoShortfall, 1)} MMBTU/day below obligation.`}</p>
          </div>
        </div>
      </Card>

      {audience === 'corporate' && <CorporateInsightsPanel />}
    </div>
  );
}

/* Internal-only account view: full ledger, late-interest accrual, and open service risk - not shown to the customer */
function CorporateInsightsPanel() {
  return (
    <Card className="border-indigo-200 bg-indigo-50/40 p-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-500">Corporate Only</p>
          <p className="text-sm font-semibold text-slate-900">Internal account insights</p>
          <p className="text-xs text-slate-500">Visible to corporate staff only - not shown on the customer's own dashboard.</p>
        </div>
        <ShieldCheck className="h-4.5 w-4.5 shrink-0 text-indigo-600" aria-hidden="true" />
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-indigo-100 bg-white p-3">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Accrued late interest</p>
          <p className="mt-1 text-lg font-semibold text-slate-900">{formatCurrency(totalAccruedLateInterest)}</p>
          <p className="text-xs text-slate-500">Across all tracked cycles at {LATE_PAYMENT_INTEREST_RATE}% p.a.</p>
        </div>
        <div className="rounded-xl border border-indigo-100 bg-white p-3">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Open service risk</p>
          <p className="mt-1 text-lg font-semibold text-slate-900">{openComplaintTickets.length} ticket{openComplaintTickets.length === 1 ? '' : 's'}</p>
          <p className="text-xs text-slate-500">Unresolved complaints that may affect account health.</p>
        </div>
        <div className="rounded-xl border border-indigo-100 bg-white p-3">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Security deficit</p>
          <p className={`mt-1 text-lg font-semibold ${securityDeficit > 0 ? 'text-rose-600' : 'text-slate-900'}`}>{securityDeficit > 0 ? formatCurrency(securityDeficit) : 'None'}</p>
          <p className="text-xs text-slate-500">Outstanding exposure beyond the available payment security.</p>
        </div>
      </div>

      <div className="mt-4 overflow-hidden rounded-2xl border border-indigo-100">
        <div className="grid grid-cols-[1.1fr_0.9fr_0.9fr_0.9fr_0.8fr_0.9fr] bg-indigo-50 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-indigo-600">
          <span>Cycle</span>
          <span>Invoiced</span>
          <span>Paid</span>
          <span>Outstanding</span>
          <span>Delay (d)</span>
          <span>Late interest</span>
        </div>
        <div className="divide-y divide-indigo-100 bg-white">
          {billingLedger.map((cycle) => (
            <div key={cycle.id} className="grid grid-cols-[1.1fr_0.9fr_0.9fr_0.9fr_0.8fr_0.9fr] px-4 py-2.5 text-xs text-slate-700">
              <span className="font-medium text-slate-900">{cycle.label}</span>
              <span>{formatCurrency(cycle.invoiced)}</span>
              <span>{formatCurrency(cycle.paid)}</span>
              <span>{formatCurrency(cycle.outstanding)}</span>
              <span>{cycle.extraDelayDays}</span>
              <span>{formatCurrency(cycle.lateInterest)}</span>
            </div>
          ))}
        </div>
      </div>

      {openComplaintTickets.length > 0 && (
        <div className="mt-4 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Service risk log</p>
          {openComplaintTickets.map((ticket) => (
            <div key={ticket.id} className="rounded-lg border border-indigo-100 bg-white p-2.5 text-xs">
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold text-slate-900">{ticket.id} - {ticket.category}</span>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${ticket.priority === 'high' ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-700'}`}>{ticket.priority}</span>
              </div>
              <p className="mt-1 text-slate-500">Raised {ticket.date} - status {ticket.status.replace('-', ' ')} - SLA {ticket.sla}.</p>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function PersonaBasedDashboards({ audience = 'customer' }) {
  const [activePersona, setActivePersona] = useState('management');

  return (
    <div className="space-y-4">
      <SectionHeading
        title="Dashboard"
      />

      <Card className="overflow-hidden">
        <div className="flex flex-wrap gap-2 border-b border-slate-200 px-4 pt-4 sm:px-5">
          {personaTabs.map((tab) => {
            const active = activePersona === tab.key;
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActivePersona(tab.key)}
                className={`inline-flex items-center gap-2 rounded-t-xl border px-3 py-2 text-sm font-semibold transition ${active ? 'border-emerald-500 bg-emerald-50 text-emerald-800' : 'border-transparent text-slate-500 hover:border-slate-200 hover:bg-slate-50 hover:text-slate-700'}`}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="px-4 py-5 sm:px-5">
          {activePersona === 'operations' && <OperationsView />}
          {activePersona === 'finance' && <FinanceView />}
          {activePersona === 'management' && <ManagementView audience={audience} />}
        </div>
      </Card>
    </div>
  );
}

export default PersonaBasedDashboards;