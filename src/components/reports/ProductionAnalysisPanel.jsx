import React, { useState } from 'react';
import { BadgeIndianRupee, Crown, Gauge, LineChart as LineChartIcon, Rows3, Sparkles, TrendingDown } from 'lucide-react';
import Card from '../common/Card';
import CollapsibleSection from '../common/CollapsibleSection';
import ReportChart from './ReportChart';
import DrillDownTable from './DrillDownTable';

const modeHelperText = {
  peak_shift: 'Shift a share of peak load into lower-use days to reduce premium slab exposure.',
};

/* Display-only approximation (~9,350 kcal/SCM GCV); does not affect billing calculations, which stay in MMBTU */
const MMBTU_TO_SCM = 26.85;

function formatCurrency(value) {
  return `₹${Math.abs(value).toLocaleString('en-IN')}`;
}

function round2(value) {
  return Math.round(value * 100) / 100;
}

function toUnit(value, unit) {
  return unit === 'SCM' ? round2(value * MMBTU_TO_SCM) : round2(value);
}

function ProductionAnalysisPanel({ result, filters, onChangeFilters, chartRef }) {
  const [unit, setUnit] = useState('MMBTU');
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
  const balanceStrength = filters.balanceStrength ?? 45;
  const unitLabel = unit === 'SCM' ? 'SCM' : 'MMBTU';

  const summaryCards = [
    {
      label: 'Forecast bill',
      value: `₹${forecast.costTotals.total.toLocaleString('en-IN')}`,
      icon: BadgeIndianRupee,
      detail: 'Projected with the current month slab rates and GST.',
    },
    {
      label: 'Potential saving',
      value: `${savings >= 0 ? '' : '-'}${formatCurrency(savings)}`,
      tone: savings >= 0 ? 'text-emerald-700' : 'text-rose-600',
      icon: TrendingDown,
      detail: savings >= 0 ? `${production.savings.percent}% reduction from peak balancing.` : 'This scenario is slightly more expensive than replaying the month.',
    },
    {
      label: 'Avg daily draw',
      value: `${toUnit(forecast.averageDaily, unit).toLocaleString('en-IN')} ${unitLabel}`,
      icon: Gauge,
      detail: `${result.stats.percentOfDCQ}% of the ${toUnit(production.contract.dcq, unit).toLocaleString('en-IN')} ${unitLabel} DCQ baseline.`,
    },
    {
      label: 'Excess risk days',
      value: `${production.daysInExcess}`,
      tone: production.daysInExcess > 0 ? 'text-rose-600' : 'text-emerald-700',
      icon: Crown,
      detail: `Days above ${toUnit(production.contract.mdcq, unit).toLocaleString('en-IN')} ${unitLabel} where the premium slab becomes unavoidable.`,
    },
  ];

  const topRows = [...forecast.rows]
    .map((row, index) => ({ ...row, baselineCost: baseline.rows[index].cost.total, delta: round2(row.cost.total - baseline.rows[index].cost.total) }))
    .sort((a, b) => b.delta - a.delta)
    .slice(0, 5);

  const detailTable = {
    columns: [`Date`, `Historical Draw (${unitLabel})`, `Forecast Draw (${unitLabel})`, 'Tier', 'Forecast Bill (₹)', 'Delta vs Baseline (₹)'],
    rows: result.table.rows.map((row) => [row[0], toUnit(row[1], unit), toUnit(row[2], unit), row[3], row[4], row[5]]),
  };

  const handleBalance = (event) => {
    onChangeFilters({ ...filters, balanceStrength: Number(event.target.value) });
  };

  const handleDate = (key) => (event) => {
    onChangeFilters({ ...filters, [key]: event.target.value });
  };

  return (
    <div className="space-y-4">
      <Card className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-700">
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              Predictive billing studio
            </div>
            <h3 className="mt-3 text-xl font-semibold text-slate-900">Production Analysis</h3>
            <p className="mt-1 max-w-xl text-sm leading-6 text-slate-500">
              Review the current month peak-shaving scenario and see where reshaping the draw curve lowers the bill.
            </p>
          </div>

          <div className="flex flex-wrap items-end gap-3">
            <label className="text-xs">
              <span className="block font-medium text-slate-500">From</span>
              <input type="date" value={filters.from} onChange={handleDate('from')} className="mt-1 rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm text-slate-800 outline-none focus:border-emerald-600" />
            </label>
            <label className="text-xs">
              <span className="block font-medium text-slate-500">To</span>
              <input type="date" value={filters.to} onChange={handleDate('to')} className="mt-1 rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm text-slate-800 outline-none focus:border-emerald-600" />
            </label>
            <div className="text-xs">
              <span className="block font-medium text-slate-500">Units</span>
              <div className="mt-1 inline-flex rounded-lg border border-slate-300 p-0.5">
                {['MMBTU', 'SCM'].map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setUnit(option)}
                    aria-pressed={unit === option}
                    className={`rounded-md px-2.5 py-1 text-xs font-semibold transition ${unit === option ? 'bg-emerald-600 text-white' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800">Scenario</p>
          <p className="mt-1 text-sm font-semibold text-emerald-900">Peak-shave the curve</p>
          <p className="mt-1 text-xs leading-5 text-emerald-800">{modeHelperText.peak_shift}</p>
        </div>

        <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-semibold text-amber-900">Smoothing intensity - {balanceStrength}%</p>
            <span className="rounded-full bg-white px-2.5 py-0.5 text-[11px] font-semibold text-amber-800 ring-1 ring-amber-200">Adjust live</span>
          </div>
          <input
            type="range"
            min="10"
            max="90"
            step="1"
            value={balanceStrength}
            onChange={handleBalance}
            className="mt-3 w-full accent-emerald-600"
            aria-label="Balance strength"
          />
          <div className="mt-1.5 flex items-center justify-between text-[11px] font-medium text-amber-800">
            <span>Light smoothing</span>
            <span>Strong peak-shaving</span>
          </div>
        </div>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.label} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">{card.label}</p>
                <Icon className="h-4.5 w-4.5 text-emerald-600" aria-hidden="true" />
              </div>
              <p className={`mt-2 text-lg font-semibold ${card.tone || 'text-slate-900'}`}>{card.value}</p>
              <p className="mt-1 text-xs leading-5 text-slate-500">{card.detail}</p>
            </Card>
          );
        })}
      </div>

      <Card className="p-5">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-sm font-semibold text-slate-900">Usage curve</p>
            <p className="text-xs text-slate-500">Historical draw vs forecasted pattern under the current month tariff structure.</p>
          </div>
          <LineChartIcon className="h-4.5 w-4.5 text-emerald-600" aria-hidden="true" />
        </div>
        <div className="mt-4">
          <ReportChart ref={chartRef} chartType="line" labels={result.labels} series={result.series} height={300} />
        </div>
      </Card>

      
    </div>
  );
}

export default ProductionAnalysisPanel;