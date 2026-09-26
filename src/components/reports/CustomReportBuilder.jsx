import React, { useState } from 'react';
import { Sparkles, X } from 'lucide-react';
import Card from '../common/Card';

const focusOptions = [
  { value: 'consumption_timeseries', label: 'Consumption' },
  { value: 'price_slab', label: 'Price Slab' },
  { value: 'mgo_flowrate', label: 'MGO & Flow Rate' },
];

/* Ad-hoc report builder: pick metric focus + date range + grouping, then generate */
function CustomReportBuilder({ onClose, onGenerate }) {
  const [name, setName] = useState('My Custom Report');
  const [type, setType] = useState(focusOptions[0].value);
  const [granularity, setGranularity] = useState('daily');
  const [from, setFrom] = useState('2026-08-01');
  const [to, setTo] = useState('2026-09-23');

  const handleSubmit = (event) => {
    event.preventDefault();
    onGenerate({
      reportId: `CUSTOM-${Date.now()}`,
      type,
      name,
      description: 'Ad-hoc custom report',
      category: 'Custom',
      audience: 'both',
      createdBy: 'You',
      params: { from, to, granularity },
      scheduledCron: null,
      lastRun: new Date().toISOString(),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4">
      <Card className="w-full max-w-lg p-6" role="dialog" aria-modal="true" aria-labelledby="custom-report-title">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-emerald-600" aria-hidden="true" />
            <h3 id="custom-report-title" className="text-lg font-semibold text-slate-900">New Custom Report</h3>
          </div>
          <button type="button" onClick={onClose} aria-label="Close custom report builder" className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100">
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <label className="block text-sm">
            <span className="text-slate-600">Report Name</span>
            <input value={name} onChange={(event) => setName(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-800 outline-none focus:border-emerald-600" />
          </label>

          <label className="block text-sm">
            <span className="text-slate-600">Metric Focus</span>
            <select value={type} onChange={(event) => setType(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-800 outline-none focus:border-emerald-600">
              {focusOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block text-sm">
              <span className="text-slate-600">From</span>
              <input type="date" value={from} onChange={(event) => setFrom(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-800 outline-none focus:border-emerald-600" />
            </label>
            <label className="block text-sm">
              <span className="text-slate-600">To</span>
              <input type="date" value={to} onChange={(event) => setTo(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-800 outline-none focus:border-emerald-600" />
            </label>
          </div>

          <label className="block text-sm">
            <span className="text-slate-600">Grouping / Granularity</span>
            <select value={granularity} onChange={(event) => setGranularity(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-800 outline-none focus:border-emerald-600">
              <option value="hourly">Hourly</option>
              <option value="daily">Daily</option>
              <option value="monthly">Monthly</option>
            </select>
          </label>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50">
              Cancel
            </button>
            <button type="submit" className="flex-1 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700">
              Generate Report
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
}

export default CustomReportBuilder;
