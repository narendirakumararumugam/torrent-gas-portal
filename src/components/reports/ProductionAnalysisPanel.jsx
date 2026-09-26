import React from 'react';
import { ArrowRightLeft, BadgeIndianRupee, Crown, Gauge, LineChart, Sparkles, TrendingDown } from 'lucide-react';
import Card from '../common/Card';
import ReportChart from './ReportChart';

const modeOptions = [
  {
    value: 'historical',
    label: 'Replay last month as-is',
    helper: 'Use the historical draw curve and apply the current month rates without smoothing.',
  },
  {
    value: 'peak_shift',
    label: 'Peak-shave the curve',
    helper: 'Shift a share of peak load into lower-use days to reduce premium slab exposure.',
  },
  {
    value: 'mgo_first',
    label: 'MGO-first balance',
    helper: 'Pull the month toward the MGO band so more days stay near the lowest tariff tier.',
  },
];

function formatCurrency(value) {
  return `₹${Math.abs(value).toLocaleString('en-IN')}`;
}

function round2(value) {
  return Math.round(value * 100) / 100;
}

function ProductionAnalysisPanel({ result, filters, onChangeFilters, chartRef }) {
  const production = result?.production;
  if (!production) {
    return (
      <div className="space-y-5">
        <Card className="p-5">
          <p className="text-sm font-semibold text-slate-900">Production Analysis is loading</p>
          <p className="mt-1 text-sm text-slate-500">
            The forecast payload is not ready yet. The report will refresh automatically once the scenario engine responds.
          </p>
        </Card>
        {result?.labels?.length > 0 && result?.series?.length > 0 && (
          <Card className="p-5">
            <ReportChart ref={chartRef} chartType={result.chartType || 'line'} labels={result.labels} series={result.series} compareSeries={result.compareSeries} height={300} />
          </Card>
        )}
      </div>
    );
  }

  const forecast = production.forecast;
  const baseline = production.baseline;
  const savings = production.savings.amount;
  const mode = filters.simulationMode || 'historical';
  const balanceStrength = filters.balanceStrength ?? 45;

  const summaryCards = [
    {
      label: 'Forecast bill',
      value: `₹${forecast.costTotals.total.toLocaleString('en-IN')}`,
      tone: 'text-slate-950',
      icon: BadgeIndianRupee,
      detail: 'Projected with the current month slab rates and GST.',
    },
    {
      label: 'Baseline replay',
      value: `₹${baseline.costTotals.total.toLocaleString('en-IN')}`,
      tone: 'text-slate-950',
      icon: LineChart,
      detail: 'Cost if last month repeats without any draw smoothing.',
    },
    {
      label: 'Potential saving',
      value: `${savings >= 0 ? '' : '-'}${formatCurrency(savings)}`,
      tone: savings >= 0 ? 'text-emerald-700' : 'text-rose-600',
      icon: TrendingDown,
      detail: savings >= 0 ? `${production.savings.percent}% reduction from peak balancing.` : 'This scenario is slightly more expensive than replaying the month.',
    },
    {
      label: 'Excess risk days',
      value: `${production.daysInExcess}`,
      tone: production.daysInExcess > 0 ? 'text-rose-600' : 'text-emerald-700',
      icon: Crown,
      detail: 'Days above 500 MMBTU where the premium slab becomes unavoidable.',
    },
  ];

  const topRows = [...forecast.rows]
    .map((row, index) => ({ ...row, baselineCost: baseline.rows[index].cost.total, delta: round2(row.cost.total - baseline.rows[index].cost.total) }))
    .sort((a, b) => b.delta - a.delta)
    .slice(0, 5);

  const handleMode = (modeValue) => {
    onChangeFilters({ ...filters, simulationMode: modeValue });
  };

  const handleBalance = (event) => {
    onChangeFilters({ ...filters, balanceStrength: Number(event.target.value) });
  };

  return (
    <div className="space-y-5">
      <Card className="overflow-hidden border-slate-200 bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 text-white shadow-lg">
        <div className="relative p-6 sm:p-7">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.24),transparent_34%),radial-gradient(circle_at_bottom_left,rgba(59,130,246,0.18),transparent_24%)]" />
          <div className="relative grid gap-6 lg:grid-cols-[1.25fr_0.85fr]">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-200">
                <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                Predictive billing studio
              </div>
              <h3 className="mt-4 text-2xl font-semibold sm:text-3xl">Production Analysis</h3>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
                Replay last month&apos;s draw profile against the current month&apos;s slab pricing and contract terms. The model highlights where peak-load reshaping can lower the bill,
                reduce Excess slab exposure, and keep more of the month inside the optimal MGO band.
              </p>

              <div className="mt-5 flex flex-wrap gap-2 text-xs text-slate-200">
                <span className="rounded-full border border-white/15 bg-white/8 px-3 py-1">DCQ {production.contract.dcq} MMBTU</span>
                <span className="rounded-full border border-white/15 bg-white/8 px-3 py-1">MDCQ {production.contract.mdcq} MMBTU</span>
                <span className="rounded-full border border-white/15 bg-white/8 px-3 py-1">GST {Math.round(production.vatRate * 100)}%</span>
                <span className="rounded-full border border-white/15 bg-white/8 px-3 py-1">Balance strength {balanceStrength}%</span>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              {summaryCards.map((card) => {
                const Icon = card.icon;
                return (
                  <div key={card.label} className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-sm">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-medium text-slate-300">{card.label}</p>
                      <Icon className="h-4 w-4 text-emerald-300" aria-hidden="true" />
                    </div>
                    <p className={`mt-2 text-2xl font-semibold ${card.tone}`}>{card.value}</p>
                    <p className="mt-1 text-xs leading-5 text-slate-300">{card.detail}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </Card>

      <div className="grid gap-5 xl:grid-cols-[1.25fr_0.75fr]">
        <Card className="p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-600">Scenario controls</p>
              <h4 className="mt-1 text-lg font-semibold text-slate-900">How much of the peak should be flattened?</h4>
              <p className="mt-1 max-w-2xl text-sm text-slate-500">
                Higher smoothing moves volume out of expensive excess days and into cheaper off-peak windows. The month&apos;s total gas stays the same, but the slab mix changes.
              </p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
              <ArrowRightLeft className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" />
              Forecast mode
            </div>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {modeOptions.map((option) => {
              const active = mode === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleMode(option.value)}
                  className={`rounded-2xl border p-4 text-left transition ${active ? 'border-emerald-500 bg-emerald-50 shadow-sm' : 'border-slate-200 bg-white hover:border-emerald-200 hover:bg-emerald-50/40'}`}
                >
                  <p className={`text-sm font-semibold ${active ? 'text-emerald-800' : 'text-slate-900'}`}>{option.label}</p>
                  <p className={`mt-1 text-xs leading-5 ${active ? 'text-emerald-700' : 'text-slate-500'}`}>{option.helper}</p>
                </button>
              );
            })}
          </div>

          {mode !== 'historical' && (
            <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-amber-900">Smoothing intensity</p>
                  <p className="text-xs text-amber-800">
                    {balanceStrength}% smoothing is shifting usage away from peak days and towards lower-cost windows.
                  </p>
                </div>
                <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-amber-800 ring-1 ring-amber-200">Adjust live</span>
              </div>
              <input
                type="range"
                min="10"
                max="90"
                step="1"
                value={balanceStrength}
                onChange={handleBalance}
                className="mt-4 w-full accent-emerald-600"
                aria-label="Balance strength"
              />
              <div className="mt-2 flex items-center justify-between text-[11px] font-medium text-amber-800">
                <span>Light smoothing</span>
                <span>Strong peak-shaving</span>
              </div>
            </div>
          )}

          <div className="mt-5 grid gap-4 lg:grid-cols-[1.55fr_0.9fr]">
            <Card className="border-slate-200 p-4">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-slate-900">Usage curve</p>
                  <p className="text-xs text-slate-500">Historical draw vs forecasted pattern under the current month tariff structure.</p>
                </div>
                <Gauge className="h-4.5 w-4.5 text-emerald-600" aria-hidden="true" />
              </div>
              <div className="mt-4">
                <ReportChart ref={chartRef} chartType="line" labels={result.labels} series={result.series} height={300} />
              </div>
            </Card>

            <Card className="border-slate-200 p-4">
              <p className="text-sm font-semibold text-slate-900">Contract lens</p>
              <div className="mt-3 space-y-2">
                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="text-[11px] uppercase tracking-wide text-slate-400">MGO target</p>
                  <p className="mt-1 text-sm font-semibold text-slate-800">{production.contract.mgoTarget}% of DCQ</p>
                </div>
                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="text-[11px] uppercase tracking-wide text-slate-400">Excess trigger</p>
                  <p className="mt-1 text-sm font-semibold text-slate-800">Beyond {production.contract.mdcq} MMBTU/day</p>
                </div>
                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="text-[11px] uppercase tracking-wide text-slate-400">Current slab rates</p>
                  <p className="mt-1 text-xs leading-5 text-slate-600">
                    MGO {formatCurrency(production.rates.mgo)} / MMBTU, Non-MGO {formatCurrency(production.rates.nonMgo)} / MMBTU, Excess {formatCurrency(production.rates.excess)} / MMBTU.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </Card>

        <div className="space-y-5">
          <Card className="p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-600">Top cost days</p>
            <div className="mt-3 space-y-3">
              {topRows.map((row) => (
                <div key={row.date} className="rounded-2xl border border-slate-200 p-3.5">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{row.date}</p>
                      <p className="text-xs text-slate-500">{row.tier} · {row.total.toLocaleString('en-IN')} MMBTU</p>
                    </div>
                    <p className={`text-sm font-semibold ${row.delta >= 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                      {row.delta >= 0 ? '+' : '-'}₹{Math.abs(row.delta).toLocaleString('en-IN')}
                    </p>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
                    <span>Historical cost ₹{row.baselineCost.toLocaleString('en-IN')}</span>
                    <span>Forecast cost ₹{row.cost.total.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-600">What to do next</p>
            <div className="mt-3 space-y-3">
              {production.recommendations.map((item) => (
                <div key={item} className="flex gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-3">
                  <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                    <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                  </div>
                  <p className="text-sm leading-6 text-slate-700">{item}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default ProductionAnalysisPanel;