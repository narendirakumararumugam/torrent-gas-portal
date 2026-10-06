import React, { useState } from 'react';
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
const operationalIntensity = contractDcq ? round2(operationalAverage / contractDcq) : 0;
const operationalPeak = dailyConsumption.reduce((peak, day) => (day.mmbtu > peak.mmbtu ? day : peak), dailyConsumption[0]);
const operationalLowDrawDays = dailyConsumption.filter((day) => day.mmbtu < 100).length;
const operationalBaseLoadDays = dailyConsumption.filter((day) => day.mmbtu >= 100 && day.mmbtu <= contractDcq).length;
const operationalHighLoadDays = dailyConsumption.filter((day) => day.mmbtu > contractDcq && day.mmbtu <= contractMdcq).length;
const operationalExcessDays = dailyConsumption.filter((day) => day.mmbtu > contractMdcq).length;
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

const invoiceStatus = latestCycle.paid >= latestCycle.invoiced
  ? 'paid'
  : new Date(BILLING_REFERENCE_DATE) > new Date(latestCycle.dueDate)
    ? 'overdue'
    : 'pending';
const invoiceStatusDetail = {
  paid: `Invoice ${latestCycle.label} has been paid in full.`,
  pending: `Invoice ${latestCycle.label} is awaiting settlement, due ${latestCycle.dueDate}.`,
  overdue: `Invoice ${latestCycle.label} is overdue - payment was due ${latestCycle.dueDate}.`,
}[invoiceStatus];

const allowanceRemaining = takeOrPayQuota.annualQuotaDays - takeOrPayQuota.usedDaysYTD;
/* 90% of DCQ is the customer's MGO obligation; the monthly average draw must stay at or above it */
const mgoCompliant = operationalAverage >= minimumObligation;
const mgoShortfall = round2(Math.max(minimumObligation - operationalAverage, 0));

const operationLabels = dailyConsumption.map((day) => day.date.slice(5));
const operationSeries = [
  { label: 'Daily consumption', data: dailyConsumption.map((day) => day.mmbtu) },
  { label: 'DCQ target', data: dailyConsumption.map(() => contractDcq), dashed: true },
];

const financeLabels = billingCycles.map((cycle) => cycle.label);

const managementLabels = billingCycles.map((cycle) => cycle.label);
const managementSeries = [{ label: 'Fortnight spend', data: billingCycles.map((cycle) => cycle.invoiced) }];

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

function MetricCard({ icon: Icon, label, value, detail, tone = 'text-slate-900', badge }) {
  return (
    <Card className="p-4">
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
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={Activity}
          label="Cumulative current month consumption"
          value={`${formatDecimal(operationalTotal, 1)} MMBTU`}
          detail={`Cumulative draw from ${dailyConsumption[0].date} to ${dailyConsumption[dailyConsumption.length - 1].date} in the current billing cycle.`}
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
  const [budgetBaseline, setBudgetBaseline] = useState(billingAverage);
  const [budgetInput, setBudgetInput] = useState(String(Math.round(billingAverage)));

  const variance = latestCycle.invoiced - budgetBaseline;
  const financeSeries = [
    { label: 'Actual spend', data: billingCycles.map((cycle) => cycle.invoiced) },
    { label: 'Budget envelope', data: billingCycles.map(() => budgetBaseline), dashed: true },
  ];

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

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={Wallet}
          label="Latest invoice"
          value={formatCurrency(latestCycle.invoiced)}
          badge={<Badge tone={invoiceStatus} />}
          detail={invoiceStatusDetail}
        />
        <Card className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Budget baseline</p>
              <div className="mt-2 flex items-center gap-1.5">
                <span className="text-lg font-semibold text-slate-900">₹</span>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={budgetInput}
                  onChange={handleBudgetChange}
                  aria-label="Custom budget baseline"
                  className="w-full min-w-0 rounded-lg border border-slate-200 px-2 py-1 text-lg font-semibold text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>
            <CircleDollarSign className="h-4.5 w-4.5 shrink-0 text-emerald-600" aria-hidden="true" />
          </div>
          <div className="mt-2 flex items-end justify-between gap-2">
            <p className="text-xs leading-5 text-slate-500">Type a custom planning envelope - defaults to the rolling average of completed fortnights.</p>
            {budgetBaseline !== billingAverage && (
              <button type="button" onClick={resetBudget} className="shrink-0 text-xs font-semibold text-emerald-700 hover:underline">
                Reset
              </button>
            )}
          </div>
        </Card>
        <MetricCard
          icon={TrendingUp}
          label="Variance to budget"
          value={`${variance >= 0 ? '+' : '-'}${formatCurrency(Math.abs(variance))}`}
          detail={`The latest bill is ${variance >= 0 ? 'above' : 'below'} the chosen planning baseline.`}
          tone={variance >= 0 ? 'text-rose-600' : 'text-emerald-700'}
        />
        <MetricCard
          icon={ShieldCheck}
          label="Security cover"
          value={`${formatDecimal(securityCoverPercent, 1)}%`}
          detail={`Available security of ${formatCurrency(availablePaymentSecurity)} against the latest bill.`}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.18fr_0.82fr]">
        <Card className="p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-sm font-semibold text-slate-900">Historical spend vs budget</p>
              <p className="text-xs text-slate-500">Fortnight totals compared with the chosen planning envelope.</p>
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
            <p className="text-sm font-semibold text-slate-900">Billing cycle history</p>
            <p className="text-xs text-slate-500">All completed fortnightly cycles on record.</p>
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
        </div>
      </Card>
    </div>
  );
}

function ManagementView({ audience }) {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
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
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">MGO compliance</p>
            <p className={`mt-1 text-lg font-semibold ${mgoCompliant ? 'text-emerald-700' : 'text-rose-600'}`}>{mgoCompliant ? 'On track' : 'Shortfall'}</p>
            <p className="text-xs text-slate-500">{mgoCompliant ? 'Monthly average meets the 90% DCQ obligation.' : `Average is ${formatDecimal(mgoShortfall, 1)} MMBTU/day below obligation.`}</p>
          </div>
          <div className="rounded-xl bg-slate-50 p-3">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Billing history</p>
            <p className="mt-1 text-lg font-semibold text-slate-900">{formatCurrency(lastClearedPayment.amount)} cleared</p>
            <p className="text-xs text-slate-500">Most recent settlement: {lastClearedPayment.clearedDate} via {lastClearedPayment.method}.</p>
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