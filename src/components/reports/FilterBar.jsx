import React from 'react';
import { GitCompareArrows } from 'lucide-react';
import { getPresetRange } from '../../utils/dateRange';

const presets = [
  { value: 'ytd', label: 'Year to Date' },
  { value: 'last12months', label: 'Last 12 Months' },
  { value: 'lastBillingCycle', label: 'Last Billing Cycle' },
  { value: 'custom', label: 'Custom Range' },
];

/* Top filter bar - date range presets, granularity, and compare toggle (single-plant customer, no meter selection) */
function FilterBar({ filters, onChange }) {
  const handlePreset = (preset) => {
    if (preset === 'custom') {
      onChange({ ...filters, preset });
      return;
    }
    onChange({ ...filters, preset, ...getPresetRange(preset) });
  };

  return (
    <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className="block text-xs">
          <span className="text-slate-500">Date Range</span>
          <select value={filters.preset} onChange={(event) => handlePreset(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 outline-none focus:border-emerald-600">
            {presets.map((p) => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
        </label>

        {filters.preset === 'custom' ? (
          <>
            <label className="block text-xs">
              <span className="text-slate-500">From</span>
              <input type="date" value={filters.from} onChange={(event) => onChange({ ...filters, from: event.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 outline-none focus:border-emerald-600" />
            </label>
            <label className="block text-xs">
              <span className="text-slate-500">To</span>
              <input type="date" value={filters.to} onChange={(event) => onChange({ ...filters, to: event.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 outline-none focus:border-emerald-600" />
            </label>
          </>
        ) : (
          <div className="text-xs text-slate-400 sm:pt-5">{filters.from} → {filters.to}</div>
        )}

        <label className="block text-xs">
          <span className="text-slate-500">Granularity</span>
          <select value={filters.granularity} onChange={(event) => onChange({ ...filters, granularity: event.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 outline-none focus:border-emerald-600">
            <option value="hourly">Hourly</option>
            <option value="daily">Daily</option>
            <option value="monthly">Monthly</option>
          </select>
        </label>

        <div className="flex items-end">
          <button
            type="button"
            onClick={() => onChange({ ...filters, compareTo: filters.compareTo === 'previous_period' ? null : 'previous_period' })}
            aria-pressed={filters.compareTo === 'previous_period'}
            className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition ${filters.compareTo === 'previous_period' ? 'border-emerald-600 bg-emerald-50 text-emerald-700' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}
          >
            <GitCompareArrows className="h-3.5 w-3.5" aria-hidden="true" />
            Compare to Last Period
          </button>
        </div>
      </div>
    </div>
  );
}

export default FilterBar;
