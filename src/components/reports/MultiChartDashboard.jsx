import React, { useState } from 'react';
import { LayoutGrid, Plus, Save, X } from 'lucide-react';
import Card from '../common/Card';
import ReportChart from './ReportChart';
import { runReport } from '../../utils/reportEngine';

const availableTypes = [
  { value: 'consumption_timeseries', label: 'Consumption' },
  { value: 'price_slab', label: 'Price Slab' },
  { value: 'mgo_flowrate', label: 'MGO & Flow Rate' },
];

const MAX_CHARTS = 4;

/* Compose 2-4 mini-charts on one canvas; layout persists per-report in localStorage.
   Parent should pass a `key={storageKey}` so switching reports remounts with the right layout. */
function MultiChartDashboard({ storageKey, baseParams, onShowToast }) {
  const [chartTypes, setChartTypes] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || 'null');
      return Array.isArray(saved) && saved.length ? saved : ['consumption_timeseries', 'price_slab'];
    } catch {
      return ['consumption_timeseries', 'price_slab'];
    }
  });
  const [addValue, setAddValue] = useState(availableTypes[1].value);

  const addChart = () => {
    if (chartTypes.length >= MAX_CHARTS) return;
    setChartTypes((current) => [...current, addValue]);
  };

  const removeChart = (index) => {
    setChartTypes((current) => current.filter((_, i) => i !== index));
  };

  const saveLayout = () => {
    localStorage.setItem(storageKey, JSON.stringify(chartTypes));
    onShowToast('Multi-chart layout saved');
  };

  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="flex items-center gap-2 text-sm font-semibold text-slate-900">
          <LayoutGrid className="h-4 w-4 text-emerald-600" aria-hidden="true" />
          Multi-Chart Dashboard
        </p>
        <div className="flex items-center gap-2">
          <select value={addValue} onChange={(event) => setAddValue(event.target.value)} className="rounded-lg border border-slate-300 px-2 py-1.5 text-xs text-slate-800 outline-none focus:border-emerald-600">
            {availableTypes.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
          <button type="button" onClick={addChart} disabled={chartTypes.length >= MAX_CHARTS} className="flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40">
            <Plus className="h-3.5 w-3.5" aria-hidden="true" />
            Add Chart
          </button>
          <button type="button" onClick={saveLayout} className="flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-700">
            <Save className="h-3.5 w-3.5" aria-hidden="true" />
            Save Layout
          </button>
        </div>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {chartTypes.map((type, index) => {
          const result = runReport(type, baseParams);
          const label = availableTypes.find((t) => t.value === type)?.label || type;
          return (
            <div key={`${type}-${index}`} className="rounded-lg border border-slate-100 p-3">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-semibold text-slate-600">{label}</p>
                <button type="button" onClick={() => removeChart(index)} aria-label={`Remove ${label} chart`} className="rounded p-1 text-slate-400 transition hover:bg-slate-100">
                  <X className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              </div>
              <ReportChart chartType={result.chartType} labels={result.labels} series={result.series} height={180} />
            </div>
          );
        })}
      </div>
    </Card>
  );
}

export default MultiChartDashboard;
