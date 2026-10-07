import React from 'react';
import { GitCompareArrows } from 'lucide-react';
import { getPresetRange } from '../../utils/dateRange';

const presets = [
  { value: 'ytd', label: 'Year to Date' },
  { value: 'last12months', label: 'Last 12 Months' },
  { value: 'lastBillingCycle', label: 'Last Billing Cycle' },
  { value: 'custom', label: 'Custom Range' },
];

const compareLabels = {
  previous_period: 'Previous Period',
  previous_month: 'Previous Month',
  same_month_last_year: 'Same Month Last Year',
  month_over_month_and_last_year: 'Previous Month + Same Month Last Year',
};

/* Top filter bar - date range presets, granularity, and compare toggle (single-plant customer, no meter selection) */
function FilterBar({ filters, onChange, compareOptions = ['previous_period'] }) {
  const showComparisonSelect = compareOptions.length > 1;

  const handlePreset = (preset) => {
    if (preset === 'custom') {
      onChange({ ...filters, preset });
      return;
    }
    onChange({ ...filters, preset, ...getPresetRange(preset) });
  };

  const handleGranularity = (granularity) => {
    const nextFilters = { ...filters, granularity };
    if ((granularity === 'daily' || granularity === 'monthly') && (!filters.compareTo || filters.compareTo === 'previous_period')) {
      nextFilters.compareTo = 'month_over_month_and_last_year';
    }
    onChange(nextFilters);
  };

  const compareValue = showComparisonSelect
    ? (filters.compareTo === '' ? '' : filters.compareTo && filters.compareTo !== 'previous_period' ? filters.compareTo : 'month_over_month_and_last_year')
    : filters.compareTo === 'previous_period';

  return (
    <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <label className="block text-xs">
          <span className="text-slate-500">Date Range</span>
          <select value={filters.preset} onChange={(event) => handlePreset(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 outline-none focus:border-emerald-600">
            {presets.map((preset) => (
              <option key={preset.value} value={preset.value}>
                {preset.label}
              </option>
            ))}
          </select>
        </label>

        {filters.preset === 'custom' ? (
          <>
            <label className="block text-xs">
              <span className="text-slate-500">From</span>
              <input
                type="date"
                value={filters.from}
                onChange={(event) => onChange({ ...filters, from: event.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 outline-none focus:border-emerald-600"
              />
            </label>
            <label className="block text-xs">
              <span className="text-slate-500">To</span>
              <input
                type="date"
                value={filters.to}
                onChange={(event) => onChange({ ...filters, to: event.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 outline-none focus:border-emerald-600"
              />
            </label>
          </>
        ) : (
          <div className="text-xs text-slate-400 sm:pt-5">
            {filters.from} → {filters.to}
          </div>
        )}

        <label className="block text-xs">
          <span className="text-slate-500">Granularity</span>
          <select value={filters.granularity} onChange={(event) => handleGranularity(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 outline-none focus:border-emerald-600">
            <option value="daily">Daily</option>
            <option value="monthly">Monthly</option>
          </select>
        </label>

        {showComparisonSelect ? (
          <label className="block text-xs">
            <span className="text-slate-500">Compare</span>
            <select
              value={compareValue}
              onChange={(event) => onChange({ ...filters, compareTo: event.target.value })}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 outline-none focus:border-emerald-600"
            >
              <option value="month_over_month_and_last_year">{compareLabels.month_over_month_and_last_year}</option>
              {compareOptions.includes('previous_month') && <option value="previous_month">{compareLabels.previous_month}</option>}
              {compareOptions.includes('same_month_last_year') && <option value="same_month_last_year">{compareLabels.same_month_last_year}</option>}
              <option value="">No Compare</option>
            </select>
          </label>
        ) : (
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
        )}
      </div>
    </div>
  );
}

export default FilterBar;
