import React, { useMemo, useState } from 'react';
import { Activity, BarChart3, Building2, CalendarClock, CircleDollarSign, Gauge, LineChart, Receipt, ShieldCheck, TrendingUp, Wallet } from 'lucide-react';
import SectionHeading from './common/SectionHeading';
import Card from './common/Card';
import ReportChart from './reports/ReportChart';
import { commercialContractProfile } from '../data/commercialContractProfile';
import { BILLING_REFERENCE_DATE, availablePaymentSecurity, billingCycles, currentInvoiceBreakdown, lastClearedPayment, pendingVerificationPayment } from '../data/commercialBillsPayments';
import { dailyConsumption } from '../data/commercialMgoFlowAnalysis';

function round2(value) {
  return Math.round(value * 100) / 100;
}

function daysBetween(fromISO, toISO) {
  return Math.round((new Date(`${toISO}T00:00:00Z`) - new Date(`${fromISO}T00:00:00Z`)) / 86400000);
}

function formatCurrency(value) {
  return `₹${Math.round(value).toLocaleString('en-IN')}`;
}

function formatDecimal(value, digits = 1) {
  return Number(value).toFixed(digits);
}

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

function CommercialPersonaDashboard() {
  const [activePersona, setActivePersona] = useState('operations');

  const operationalTotal = useMemo(() => dailyConsumption.reduce((total, day) => total + day.mmbtu, 0), []);
  const operationalAverage = dailyConsumption.length ? round2(operationalTotal / dailyConsumption.length) : 0;
  const peakDay = dailyConsumption.reduce((currentPeak, day) => (day.mmbtu > currentPeak.mmbtu ? day : currentPeak), dailyConsumption[0]);
  const billingAverage = billingCycles.length ? round2(billingCycles.reduce((total, cycle) => total + cycle.invoiced, 0) / billingCycles.length) : 0;
  const latestCycle = billingCycles[billingCycles.length - 1];
  const priorCycle = billingCycles[billingCycles.length - 2];
  const varianceToBudget = latestCycle.invoiced - billingAverage;
  const daysToDue = daysBetween(BILLING_REFERENCE_DATE, latestCycle.dueDate);
  const paymentCoverage = latestCycle.invoiced ? round2((availablePaymentSecurity / latestCycle.invoiced) * 100) : 0;
  const demandChartLabels = dailyConsumption.map((day) => day.date.slice(5));
  const demandSeries = [{ label: 'Daily demand', data: dailyConsumption.map((day) => day.mmbtu) }];
  const billingLabels = billingCycles.map((cycle) => cycle.label);
  const billingSeries = [{ label: 'Invoice amount', data: billingCycles.map((cycle) => cycle.invoiced) }];

  return (
    <div className="space-y-4">
      <SectionHeading
        eyebrow="Commercial Intelligence"
        title="Persona Dashboard"
        description="Hospitality-focused operations, finance, and management snapshots for commercial customers."
      />

      <Card className="overflow-hidden">
        <div className="flex flex-wrap gap-2 border-b border-slate-200 px-4 pt-4 sm:px-5">
          {[
            { key: 'operations', label: 'Operations', icon: Activity },
            { key: 'finance', label: 'Finance', icon: CircleDollarSign },
            { key: 'management', label: 'Management', icon: ShieldCheck },
          ].map((tab) => {
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
          {activePersona === 'operations' && (
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <MetricCard
                  icon={Building2}
                  label="Fortnight consumption"
                  value={`${formatDecimal(operationalTotal, 1)} MMBTU`}
                  detail="Commercial usage across the second-half September billing window."
                />
                <MetricCard
                  icon={Gauge}
                  label="Average per day"
                  value={`${formatDecimal(operationalAverage, 1)} MMBTU`}
                  detail="Average daily draw across the tracked period."
                />
                <MetricCard
                  icon={TrendingUp}
                  label="Peak service day"
                  value={`${formatDecimal(peakDay.mmbtu, 1)} MMBTU`}
                  detail={`${peakDay.date} delivered the heaviest service load.`}
                />
                <MetricCard
                  icon={Receipt}
                  label="Flat tariff"
                  value={currentInvoiceBreakdown.rows[0].rate}
                  detail="Single commercial rate applied to the full invoice."
                />
              </div>

              <div className="grid gap-4 lg:grid-cols-[1.18fr_0.82fr]">
                <Card className="p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">Daily demand profile</p>
                      <p className="text-xs text-slate-500">September second-fortnight operating pattern.</p>
                    </div>
                    <LineChart className="h-4.5 w-4.5 text-emerald-600" aria-hidden="true" />
                  </div>
                  <div className="mt-4">
                    <ReportChart chartType="line" labels={demandChartLabels} series={demandSeries} height={270} />
                  </div>
                </Card>

                <Card className="p-4">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">Service mix</p>
                      <p className="text-xs text-slate-500">Operational demand remains comfortably below the commercial ceiling.</p>
                    </div>
                    <BarChart3 className="h-4.5 w-4.5 text-emerald-600" aria-hidden="true" />
                  </div>
                  <div className="mt-4 space-y-3">
                    {dailyConsumption.slice(0, 4).map((day) => (
                      <div key={day.date} className="rounded-xl border border-slate-200 p-3">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-slate-900">{day.date}</p>
                            <p className="text-xs text-slate-500">{day.flowRateScmHr.toFixed(1)} SCM/hr peak flow</p>
                          </div>
                          <span className="rounded-full bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-600">{day.mmbtu.toFixed(1)} MMBTU</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            </div>
          )}

          {activePersona === 'finance' && (
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <MetricCard icon={Wallet} label="Latest invoice" value={formatCurrency(latestCycle.invoiced)} detail={`Flat-rate bill issued for ${latestCycle.label}.`} />
                <MetricCard icon={CircleDollarSign} label="Collected payment" value={formatCurrency(lastClearedPayment.amount)} detail={`Settled via ${lastClearedPayment.method} on ${lastClearedPayment.clearedDate}.`} />
                <MetricCard icon={Receipt} label="Outstanding balance" value={formatCurrency(Math.max(0, latestCycle.invoiced - latestCycle.paid))} detail="Remaining amount on the latest commercial invoice." />
                <MetricCard
                  icon={CalendarClock}
                  label={daysToDue < 0 ? 'Days overdue' : 'Days to due date'}
                  value={`${Math.abs(daysToDue)} day(s)`}
                  detail={`Latest invoice ${latestCycle.label} is ${daysToDue < 0 ? 'overdue' : 'due'} on ${latestCycle.dueDate}.`}
                  tone={daysToDue < 0 ? 'text-rose-600' : 'text-slate-900'}
                />
              </div>

              <div className="grid gap-4 lg:grid-cols-[1.18fr_0.82fr]">
                <Card className="p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">Billing history</p>
                      <p className="text-xs text-slate-500">Commercial billing stays in the lower second-fortnight band.</p>
                    </div>
                    <LineChart className="h-4.5 w-4.5 text-emerald-600" aria-hidden="true" />
                  </div>
                  <div className="mt-4">
                    <ReportChart chartType="line" labels={billingLabels} series={billingSeries} height={270} />
                  </div>
                </Card>

                <Card className="p-4">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">Finance snapshot</p>
                      <p className="text-xs text-slate-500">Flat tariff billing with a smaller spend envelope than industrial usage.</p>
                    </div>
                    <Wallet className="h-4.5 w-4.5 text-emerald-600" aria-hidden="true" />
                  </div>

                  <div className="mt-4 space-y-3">
                    <div className="rounded-xl border border-slate-200 p-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Current invoice mix</p>
                      <p className="mt-1 text-lg font-semibold text-slate-900">{currentInvoiceBreakdown.rows[0].label}</p>
                      <p className="text-xs text-slate-500">{currentInvoiceBreakdown.rows[0].qty} at {currentInvoiceBreakdown.rows[0].rate}</p>
                    </div>
                    <div className="rounded-xl border border-slate-200 p-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Budget variance</p>
                      <p className={`mt-1 text-lg font-semibold ${varianceToBudget >= 0 ? 'text-rose-600' : 'text-emerald-700'}`}>{varianceToBudget >= 0 ? '+' : '-'}{formatCurrency(Math.abs(varianceToBudget))}</p>
                      <p className="text-xs text-slate-500">Latest bill versus the rolling average across recorded cycles.</p>
                    </div>
                    <div className="rounded-xl border border-slate-200 p-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Security cover</p>
                      <p className="mt-1 text-lg font-semibold text-slate-900">{formatCurrency(availablePaymentSecurity)} buffer</p>
                      <p className="text-xs text-slate-500">Covers {formatDecimal(paymentCoverage, 1)}% of the latest billed amount.</p>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          )}

          {activePersona === 'management' && (
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <MetricCard icon={Building2} label="Commercial profile" value={commercialContractProfile.terms.establishmentType} detail="Hospitality-focused service account." />
                <MetricCard icon={Wallet} label="Total billed" value={formatCurrency(billingCycles.reduce((total, cycle) => total + cycle.invoiced, 0))} detail="All tracked commercial invoices combined." />
                <MetricCard icon={TrendingUp} label="Latest cycle trend" value={`${latestCycle.invoiced - priorCycle.invoiced >= 0 ? '+' : '-'}${formatCurrency(Math.abs(latestCycle.invoiced - priorCycle.invoiced))}`} detail="Second-fortnight bill compared with the previous cycle." />
                <MetricCard icon={ShieldCheck} label="Security cover" value={`${formatDecimal(paymentCoverage, 1)}%`} detail="Payment security versus the latest invoice amount." />
              </div>

              <div className="grid gap-4 lg:grid-cols-[1.18fr_0.82fr]">
                <Card className="p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">Management spend trend</p>
                      <p className="text-xs text-slate-500">Commercial billing stays in a compact, flat-rate spend band.</p>
                    </div>
                    <BarChart3 className="h-4.5 w-4.5 text-emerald-600" aria-hidden="true" />
                  </div>
                  <div className="mt-4">
                    <ReportChart chartType="bar" labels={billingLabels} series={billingSeries} height={270} />
                  </div>
                </Card>

                <Card className="p-4">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">Commercial controls</p>
                      <p className="text-xs text-slate-500">Operationally simple flat-rate account with lower month-end risk.</p>
                    </div>
                    <ShieldCheck className="h-4.5 w-4.5 text-emerald-600" aria-hidden="true" />
                  </div>

                  <div className="mt-4 space-y-3">
                    <div className="rounded-xl border border-slate-200 p-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Reference date</p>
                      <p className="mt-1 text-lg font-semibold text-slate-900">{BILLING_REFERENCE_DATE}</p>
                      <p className="text-xs text-slate-500">Commercial reports are anchored to the latest September cycle.</p>
                    </div>
                    <div className="rounded-xl border border-slate-200 p-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Latest payment</p>
                      <p className="mt-1 text-lg font-semibold text-slate-900">{formatCurrency(lastClearedPayment.amount)}</p>
                      <p className="text-xs text-slate-500">Cleared on {lastClearedPayment.clearedDate} via {lastClearedPayment.method}.</p>
                    </div>
                    <div className="rounded-xl border border-slate-200 p-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Average service draw</p>
                      <p className="mt-1 text-lg font-semibold text-slate-900">{formatDecimal(operationalAverage, 1)} MMBTU</p>
                      <p className="text-xs text-slate-500">Average across the commercial second-fortnight demand profile.</p>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

export default CommercialPersonaDashboard;