import React from 'react';
import { Clock3, FilePlus2 } from 'lucide-react';

/* Single dropdown report picker (grouped by category) replacing the always-visible templates rail */
function ReportSelector({ templates, activeReportId, onSelect, onNewCustomReport }) {
  const categories = [...new Set(templates.map((t) => t.category))];
  const activeTemplate = templates.find((t) => t.reportId === activeReportId);

  const handleChange = (event) => {
    const next = templates.find((t) => t.reportId === event.target.value);
    if (next) onSelect(next);
  };

  return (
    <div className="flex flex-wrap items-end gap-3">
      <label className="block min-w-[240px] flex-1 text-xs">
        <span className="font-medium text-slate-500">Select report</span>
        <select
          value={activeReportId}
          onChange={handleChange}
          className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm font-medium text-slate-800 outline-none focus:border-emerald-600"
        >
          {categories.map((cat) => (
            <optgroup key={cat} label={cat}>
              {templates
                .filter((t) => t.category === cat)
                .map((t) => (
                  <option key={t.reportId} value={t.reportId}>
                    {t.name}
                    {t.scheduledCron ? ' · Scheduled' : ''}
                  </option>
                ))}
            </optgroup>
          ))}
        </select>
      </label>

      {activeTemplate?.scheduledCron && (
        <span className="flex items-center gap-1 pb-2.5 text-[11px] font-medium text-slate-400">
          <Clock3 className="h-3 w-3" aria-hidden="true" />
          Scheduled
        </span>
      )}

      <button
        type="button"
        onClick={onNewCustomReport}
        className="flex items-center gap-1.5 rounded-lg border border-dashed border-emerald-300 bg-emerald-50 px-3 py-2.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100"
      >
        <FilePlus2 className="h-3.5 w-3.5" aria-hidden="true" />
        New Custom Report
      </button>
    </div>
  );
}

export default ReportSelector;
