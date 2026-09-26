import React, { useState } from 'react';
import {
  Activity,
  ArrowRightLeft,
  BarChart3,
  Bot,
  CalendarClock,
  CircleDollarSign,
  Factory,
  Gauge,
  LineChart,
  MessageSquareText,
  Send,
  ShieldCheck,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import Card from '../common/Card';
import SectionHeading from '../common/SectionHeading';
import ReportChart from './ReportChart';
import { contractProfile } from '../../data/contractProfile';
import { availablePaymentSecurity, billingCycles, currentInvoiceBreakdown, currentUnbilledCycle, lastClearedPayment } from '../../data/billsPayments';
import { dailyConsumption, takeOrPayQuota } from '../../data/mgoFlowAnalysis';

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

function getMonthKey(dateLike) {
  return dateLike.slice(0, 7);
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
const excessShare = invoiceTotal ? round1((currentExcessRow.amount / invoiceTotal) * 100) : 0;

const operationalTotal = sum(dailyConsumption, (day) => day.mmbtu);
const operationalAverage = dailyConsumption.length ? round2(operationalTotal / dailyConsumption.length) : 0;
const operationalPeak = dailyConsumption.reduce((peak, day) => (day.mmbtu > peak.mmbtu ? day : peak), dailyConsumption[0]);
const operationalLowDrawDays = dailyConsumption.filter((day) => day.mmbtu < 100).length;
const operationalBaseLoadDays = dailyConsumption.filter((day) => day.mmbtu >= 100 && day.mmbtu <= contractDcq).length;
const operationalHighLoadDays = dailyConsumption.filter((day) => day.mmbtu > contractDcq && day.mmbtu <= contractMdcq).length;
const operationalExcessDays = dailyConsumption.filter((day) => day.mmbtu > contractMdcq).length;
const operationalIntensity = contractDcq ? round2(operationalAverage / contractDcq) : 0;

const billingSpendTotal = sum(billingCycles, (cycle) => cycle.invoiced);
const billingAverage = billingCycles.length ? round2(billingSpendTotal / billingCycles.length) : 0;
const latestCycle = billingCycles[billingCycles.length - 1];
const priorCycle = billingCycles[billingCycles.length - 2];
const latestCycleVariance = latestCycle.invoiced - billingAverage;
const projectedNextCycle = round2(((latestCycle.invoiced + priorCycle.invoiced) / 2) * 1.02);

const julSpend = billingCycles.slice(0, 2).reduce((total, cycle) => total + cycle.invoiced, 0);
const augSpend = billingCycles.slice(2, 4).reduce((total, cycle) => total + cycle.invoiced, 0);
const fortnightTrend = pctChange(latestCycle.invoiced, priorCycle.invoiced);
const monthTrend = pctChange(augSpend, julSpend);
const outstandingLatest = latestCycle.invoiced - latestCycle.paid;
const securityCoverPercent = latestCycle.invoiced ? round1((availablePaymentSecurity / latestCycle.invoiced) * 100) : 0;

const allowanceRemaining = takeOrPayQuota.annualQuotaDays - takeOrPayQuota.usedDaysYTD;
const healthScore = Math.max(
  0,
  Math.min(
    100,
    100 - (latestCycle.paid === 0 ? 12 : 0) - (excessShare > 5 ? 8 : 0) - (securityCoverPercent < 30 ? 10 : 0) + (allowanceRemaining > 10 ? 4 : 0),
  ),
);

const operationLabels = dailyConsumption.map((day) => day.date.slice(5));
const operationSeries = [
  { label: 'Daily consumption', data: dailyConsumption.map((day) => day.mmbtu) },
  { label: 'DCQ target', data: dailyConsumption.map(() => contractDcq), dashed: true },
];

const financeLabels = billingCycles.map((cycle) => cycle.label);
const financeSeries = [
  { label: 'Actual spend', data: billingCycles.map((cycle) => cycle.invoiced) },
  { label: 'Budget envelope', data: billingCycles.map(() => billingAverage), dashed: true },
];

const managementLabels = billingCycles.map((cycle) => cycle.label);
const managementSeries = [{ label: 'Fortnight spend', data: billingCycles.map((cycle) => cycle.invoiced) }];

const personaTabs = [
  {
    key: 'operations',
    label: 'Operations Analysis',
    icon: Factory,
    description: 'Daily consumption, fuel efficiency, and inventory mapping.',
  },
  {
    key: 'finance',
    label: 'Finance Analysis',
    icon: CircleDollarSign,
    description: 'Cost per unit, spend vs budget, and bill forecasting.',
  },
  {
    key: 'management',
    label: 'Management Overview',
    icon: ShieldCheck,
    description: 'Executive trends, contract health, and spend control.',
  },
];

function MetricCard({ icon: Icon, label, value, detail, tone = 'text-slate-900' }) {
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{label}</p>
          <p className={`mt-2 text-lg font-semibold ${tone}`}>{value}</p>
        </div>
        <Icon className="h-4.5 w-4.5 text-emerald-600" aria-hidden="true" />
      </div>
      <p className="mt-2 text-xs leading-5 text-slate-500">{detail}</p>
    </Card>
  );
}

function OperationsView() {
  const inventoryMap = [
    { label: 'Shutdown / maintenance', range: '< 100 MMBTU', count: operationalLowDrawDays, tone: 'bg-emerald-50 text-emerald-700' },
    { label: 'Base load production', range: '100-300 MMBTU', count: operationalBaseLoadDays, tone: 'bg-sky-50 text-sky-700' },
    { label: 'High-load production', range: '300-500 MMBTU', count: operationalHighLoadDays, tone: 'bg-amber-50 text-amber-700' },
    { label: 'Excess draw risk', range: '> 500 MMBTU', count: operationalExcessDays, tone: 'bg-rose-50 text-rose-700' },
  ];

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={Activity}
          label="Daily gas draw"
          value={`${formatDecimal(operationalTotal, 1)} MMBTU`}
          detail="Ten-day operational sample from the live meter profile."
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
          label="Shutdown allowance left"
          value={`${allowanceRemaining} days`}
          detail="Use scheduled low-load days to protect the monthly off-take average."
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.18fr_0.82fr]">
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

        <Card className="p-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-sm font-semibold text-slate-900">Fuel efficiency lens</p>
              <p className="text-xs text-slate-500">Lower intensity means more output from each gas unit.</p>
            </div>
            <Sparkles className="h-4.5 w-4.5 text-emerald-600" aria-hidden="true" />
          </div>
          <div className="mt-4 rounded-2xl bg-slate-50 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Normalized gas intensity</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">{formatDecimal(operationalIntensity, 2)}x DCQ</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Average daily draw is {formatDecimal(operationalAverage, 1)} MMBTU against the {contractDcq} MMBTU contract baseline. The model should be pushed closer to the base-load band on stable production days.
            </p>
          </div>

          <div className="mt-4 space-y-2">
            {inventoryMap.map((band) => (
              <div key={band.label} className="rounded-xl border border-slate-200 p-3">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{band.label}</p>
                    <p className="text-xs text-slate-500">{band.range}</p>
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${band.tone}`}>{band.count} days</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-sm font-semibold text-slate-900">Inventory mapping</p>
            <p className="text-xs text-slate-500">Gas draw mapped to production-load bands so maintenance windows and high-output days can be planned deliberately.</p>
          </div>
          <BarChart3 className="h-4.5 w-4.5 text-emerald-600" aria-hidden="true" />
        </div>
        <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200">
          <div className="grid grid-cols-[1.1fr_0.8fr_0.9fr] bg-slate-50 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
            <span>Date</span>
            <span>Gas used</span>
            <span>Inventory band</span>
          </div>
          <div className="divide-y divide-slate-200">
            {dailyConsumption.map((day) => {
              const band = day.mmbtu < 100 ? 'Shutdown / maintenance' : day.mmbtu <= contractDcq ? 'Base load' : day.mmbtu <= contractMdcq ? 'High-load production' : 'Excess draw risk';
              return (
                <div key={day.date} className="grid grid-cols-[1.1fr_0.8fr_0.9fr] px-4 py-3 text-sm text-slate-700">
                  <span className="font-medium text-slate-900">{day.date}</span>
                  <span>{formatDecimal(day.mmbtu, 1)} MMBTU</span>
                  <span>{band}</span>
                </div>
              );
            })}
          </div>
        </div>
      </Card>
    </div>
  );
}

function FinanceView() {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={Wallet}
          label="Latest invoice"
          value={formatCurrency(latestCycle.invoiced)}
          detail={`Invoice ${latestCycle.label} is currently unpaid and awaiting settlement.`}
        />
        <MetricCard
          icon={CircleDollarSign}
          label="Budget baseline"
          value={formatCurrency(billingAverage)}
          detail="Rolling average of the completed fortnights used as the planning envelope."
        />
        <MetricCard
          icon={TrendingUp}
          label="Variance to budget"
          value={`${latestCycleVariance >= 0 ? '+' : '-'}${formatCurrency(Math.abs(latestCycleVariance))}`}
          detail="The latest bill is above the historical planning average."
          tone={latestCycleVariance >= 0 ? 'text-rose-600' : 'text-emerald-700'}
        />
        <MetricCard
          icon={ArrowRightLeft}
          label="Next-cycle forecast"
          value={formatCurrency(projectedNextCycle)}
          detail="Projection assumes the current spend pattern continues with modest smoothing."
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.18fr_0.82fr]">
        <Card className="p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-sm font-semibold text-slate-900">Historical spend vs budget</p>
              <p className="text-xs text-slate-500">Fortnight totals compared with the planning envelope.</p>
            </div>
            <LineChart className="h-4.5 w-4.5 text-emerald-600" aria-hidden="true" />
          </div>
          <div className="mt-4">
            <ReportChart chartType="line" labels={financeLabels} series={financeSeries} height={270} />
          </div>
        </Card>

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
                    <p className="text-xs text-slate-500">{row.quantity.toLocaleString('en-IN')} MMBTU at {row.rate}</p>
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
      </div>

      <Card className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-sm font-semibold text-slate-900">Cycle forecast table</p>
            <p className="text-xs text-slate-500">Completed cycles plus the next projected billing amount.</p>
          </div>
          <Wallet className="h-4.5 w-4.5 text-emerald-600" aria-hidden="true" />
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          {billingCycles.map((cycle, index) => (
            <div key={cycle.id} className="rounded-xl border border-slate-200 p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">{index === billingCycles.length - 1 ? 'Current cycle' : 'Historical cycle'}</p>
              <p className="mt-2 text-sm font-semibold text-slate-900">{cycle.label}</p>
              <p className="mt-1 text-lg font-bold text-slate-900">{formatCurrency(cycle.invoiced)}</p>
              <p className="mt-1 text-xs text-slate-500">Paid {formatCurrency(cycle.paid)} / due {cycle.dueDate}</p>
            </div>
          ))}
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">Forecast</p>
            <p className="mt-2 text-sm font-semibold text-emerald-900">Upcoming cycle</p>
            <p className="mt-1 text-lg font-bold text-emerald-900">{formatCurrency(projectedNextCycle)}</p>
            <p className="mt-1 text-xs text-emerald-800">Projected from the latest run-rate and current slab mix.</p>
          </div>
        </div>
      </Card>
    </div>
  );
}

function ManagementView() {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={Factory}
          label="Total gas consumed"
          value={`${formatDecimal(operationalTotal, 1)} MMBTU`}
          detail="Current operational sample used to anchor the executive summary."
        />
        <MetricCard
          icon={Wallet}
          label="Overall expenditure"
          value={formatCurrency(billingSpendTotal)}
          detail="Total invoiced spend across the tracked billing cycles."
        />
        <MetricCard
          icon={TrendingUp}
          label="Fortnight trend"
          value={`${fortnightTrend >= 0 ? '+' : ''}${formatDecimal(fortnightTrend, 1)}%`}
          detail="Latest fortnight versus the previous fortnight."
          tone={fortnightTrend >= 0 ? 'text-rose-600' : 'text-emerald-700'}
        />
        <MetricCard
          icon={ShieldCheck}
          label="Contract health"
          value={`${healthScore}/100`}
          detail="Payment standing, security cover, and slab exposure rolled into one executive view."
          tone={healthScore >= 80 ? 'text-emerald-700' : healthScore >= 65 ? 'text-amber-700' : 'text-rose-600'}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.18fr_0.82fr]">
        <Card className="p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-sm font-semibold text-slate-900">Executive spend trend</p>
              <p className="text-xs text-slate-500">Fortnight-to-fortnight invoice movement across the tracked cycle history.</p>
            </div>
            <BarChart3 className="h-4.5 w-4.5 text-emerald-600" aria-hidden="true" />
          </div>
          <div className="mt-4">
            <ReportChart chartType="bar" labels={managementLabels} series={managementSeries} height={270} />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-sm font-semibold text-slate-900">Key contract health indicators</p>
              <p className="text-xs text-slate-500">The operating signals that matter most to management.</p>
            </div>
            <ShieldCheck className="h-4.5 w-4.5 text-emerald-600" aria-hidden="true" />
          </div>

          <div className="mt-4 space-y-3">
            <div className="rounded-xl border border-slate-200 p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Outstanding balance</p>
              <p className="mt-1 text-lg font-semibold text-slate-900">{formatCurrency(outstandingLatest)}</p>
              <p className="text-xs text-slate-500">Latest invoice is still open for settlement.</p>
            </div>
            <div className="rounded-xl border border-slate-200 p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Security cover</p>
              <p className="mt-1 text-lg font-semibold text-slate-900">{formatCurrency(availablePaymentSecurity)} buffer</p>
              <p className="text-xs text-slate-500">Covers {formatDecimal(securityCoverPercent, 1)}% of the latest billed amount.</p>
            </div>
            <div className="rounded-xl border border-slate-200 p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Minimum off-take reference</p>
              <p className="mt-1 text-lg font-semibold text-slate-900">{minimumObligation} MMBTU/day</p>
              <p className="text-xs text-slate-500">90% of the contracted DCQ acts as the core monthly protection threshold.</p>
            </div>
            <div className="rounded-xl border border-slate-200 p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Maintenance allowance</p>
              <p className="mt-1 text-lg font-semibold text-slate-900">{allowanceRemaining} days remaining</p>
              <p className="text-xs text-slate-500">Use these days to manage average draw and avoid penalty exposure.</p>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-4">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-xl bg-slate-50 p-3">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Fortnight comparison</p>
            <p className={`mt-1 text-lg font-semibold ${fortnightTrend >= 0 ? 'text-rose-600' : 'text-emerald-700'}`}>{fortnightTrend >= 0 ? '+' : ''}{formatDecimal(fortnightTrend, 1)}%</p>
            <p className="text-xs text-slate-500">Latest cycle versus the previous cycle.</p>
          </div>
          <div className="rounded-xl bg-slate-50 p-3">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Month-on-month</p>
            <p className={`mt-1 text-lg font-semibold ${monthTrend >= 0 ? 'text-rose-600' : 'text-emerald-700'}`}>{monthTrend >= 0 ? '+' : ''}{formatDecimal(monthTrend, 1)}%</p>
            <p className="text-xs text-slate-500">August spend compared with July in the current record.</p>
          </div>
          <div className="rounded-xl bg-slate-50 p-3">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Bill forecast</p>
            <p className="mt-1 text-lg font-semibold text-slate-900">{formatCurrency(projectedNextCycle)}</p>
            <p className="text-xs text-slate-500">Expected next billing cycle if the current pattern persists.</p>
          </div>
          <div className="rounded-xl bg-slate-50 p-3">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Billing history</p>
            <p className="mt-1 text-lg font-semibold text-slate-900">{formatCurrency(lastClearedPayment.amount)} cleared</p>
            <p className="text-xs text-slate-500">Most recent settlement: {lastClearedPayment.clearedDate} via {lastClearedPayment.method}.</p>
          </div>
        </div>
      </Card>
    </div>
  );
}

function generateAssistantReply(message) {
  const normalized = message.toLowerCase();

  if (normalized.includes('bill') && (normalized.includes('higher') || normalized.includes('why') || normalized.includes('increase') || normalized.includes('spike'))) {
    return `The latest bill is elevated because the invoice mix includes ${currentExcessRow.quantity.toLocaleString('en-IN')} MMBTU in the Excess slab, which adds ${formatCurrency(currentExcessRow.amount)} to the total. The fastest way to reduce the next cycle is to flatten peak draw days, keep daily usage below ${contractMdcq} MMBTU where possible, and pull more volume into the MGO band.`;
  }

  if (normalized.includes('minimum') || normalized.includes('off-take') || normalized.includes('offtake') || normalized.includes('take-or-pay') || normalized.includes('penalt') || normalized.includes('shutdown') || normalized.includes('maintenance')) {
    return `Your monthly protection floor is ${minimumObligation} MMBTU/day, based on 90% of the ${contractDcq} MMBTU DCQ. You still have ${allowanceRemaining} shutdown/maintenance days left this year. If a low-load period is coming, place it inside those allowance days so the average draw stays protected and take-or-pay penalties are avoided.`;
  }

  if (normalized.includes('forecast') || normalized.includes('next bill') || normalized.includes('upcoming cycle') || normalized.includes('future bill')) {
    return `Based on the recent fortnights, the next billing cycle is projected near ${formatCurrency(projectedNextCycle)}. That forecast assumes the current draw pattern continues. If peak days are shaved below ${contractMdcq} MMBTU, the actual bill should move down further.`;
  }

  if (normalized.includes('contract') || normalized.includes('dcq') || normalized.includes('mdcq') || normalized.includes('rate')) {
    return `The contract is currently active with a DCQ of ${contractDcq} MMBTU and an MDCQ of ${contractMdcq} MMBTU. The latest invoice is split across MGO, Non-MGO, and Excess slabs; the assistant can explain the commercial effect of each clause, the load-shaping options, and the settlement impact.`;
  }

  return `I can help interpret the contract, bill spikes, off-take risk, and forecasted spend. For example, ask why the bill is higher, how to avoid Excess slab charges, or how to use shutdown allowance days to protect the minimum monthly average.`;
}

function ContractAssistantCard() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: `I am the AI Contract Assistant for ${contractProfile.company.name}. Ask me about the bill, contract terms, off-take risk, or how to optimize the daily draw pattern.`,
    },
  ]);
  const [draft, setDraft] = useState('');

  const quickPrompts = [
    'Why is my bill higher than expected?',
    'Will I miss the minimum off-take obligation?',
    'How can I reduce excess slab charges?',
    'What is the next billing cycle forecast?',
  ];

  const sendMessage = (text) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    setMessages((current) => [
      ...current,
      { role: 'user', text: trimmed },
      { role: 'assistant', text: generateAssistantReply(trimmed) },
    ]);
    setDraft('');
  };

  return (
    <Card className="border-emerald-200 bg-white/95 p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-600">Chat Assistance</p>
          <h3 className="mt-1 text-lg font-semibold text-slate-900">AI Contract Assistant</h3>
          <p className="mt-1 text-sm text-slate-500">Built from contract terms, usage behaviour, and billing history for industrial customers.</p>
        </div>
        <div className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">Live guidance</div>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <div className="rounded-xl bg-slate-50 p-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Contract</p>
          <p className="mt-1 text-sm font-semibold text-slate-900">{contractProfile.contractNumber}</p>
        </div>
        <div className="rounded-xl bg-slate-50 p-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Latest bill</p>
          <p className="mt-1 text-sm font-semibold text-slate-900">{formatCurrency(latestCycle.invoiced)}</p>
        </div>
        <div className="rounded-xl bg-slate-50 p-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Maintenance days left</p>
          <p className="mt-1 text-sm font-semibold text-slate-900">{allowanceRemaining} days</p>
        </div>
        <div className="rounded-xl bg-slate-50 p-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Security cover</p>
          <p className="mt-1 text-sm font-semibold text-slate-900">{formatCurrency(availablePaymentSecurity)}</p>
        </div>
        <div className="rounded-xl bg-slate-50 p-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Live usage to date</p>
          <p className="mt-1 text-sm font-semibold text-slate-900">{currentUnbilledCycle.usageToDate.toLocaleString('en-IN')}</p>
          <p className="text-[11px] text-slate-500">As of {currentUnbilledCycle.asOf}</p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {quickPrompts.map((prompt) => (
          <button
            key={prompt}
            type="button"
            onClick={() => sendMessage(prompt)}
            className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700"
          >
            {prompt}
          </button>
        ))}
      </div>

      <div className="mt-4 max-h-[420px] space-y-3 overflow-y-auto rounded-2xl border border-slate-200 bg-slate-50 p-3">
        {messages.map((message, index) => (
          <div key={`${message.role}-${index}`} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[88%] rounded-2xl px-3 py-2 text-sm leading-6 ${message.role === 'user' ? 'bg-emerald-600 text-white' : 'bg-white text-slate-700 shadow-sm ring-1 ring-slate-200'}`}>
              {message.text}
            </div>
          </div>
        ))}
      </div>

      <form
        className="mt-4 flex items-center gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          sendMessage(draft);
        }}
      >
        <div className="relative flex-1">
          <MessageSquareText className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
          <input
            type="text"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Ask about billing spikes, contract terms, or optimization steps"
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
          />
        </div>
        <button
          type="submit"
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
        >
          <Send className="h-4 w-4" aria-hidden="true" />
          Send
        </button>
      </form>

      <div className="mt-3 rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs leading-5 text-emerald-800">
        The assistant grounds its answers in the active contract, the latest invoice, and the current draw profile. It can explain slab triggers, penalty risk, and the maintenance-day strategy used to protect the average.
      </div>
    </Card>
  );
}

function PersonaBasedDashboards() {
  const [activePersona, setActivePersona] = useState('operations');

  return (
    <div className="space-y-4">
      <SectionHeading
        eyebrow="Executive Intelligence"
        title="Persona-Based Dashboards"
        description="Role-specific views for industrial gas operations, finance, and management, plus a contract-aware assistant for real-time guidance."
      />

      <div className="grid gap-4 xl:grid-cols-[1.32fr_0.68fr]">
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
            {activePersona === 'management' && <ManagementView />}
          </div>
        </Card>

        <ContractAssistantCard />
      </div>
    </div>
  );
}

export default PersonaBasedDashboards;