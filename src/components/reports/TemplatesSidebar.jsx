import React from 'react';
import { Clock3, FilePlus2 } from 'lucide-react';

/* Left rail: saved reports/templates + quick category filters + new custom report trigger */
function TemplatesSidebar({ templates, activeReportId, onSelect, category, onCategoryChange, onNewCustomReport }) {
  const categories = ['All', ...new Set(templates.map((t) => t.category))];

  const visible = category === 'All' ? templates : templates.filter((t) => t.category === category);

  return (
    <div className="flex h-full flex-col gap-4">
      <button
        type="button"
        onClick={onNewCustomReport}
        className="flex items-center justify-center gap-2 rounded-lg border border-dashed border-emerald-300 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100"
      >
        <FilePlus2 className="h-4 w-4" aria-hidden="true" />
        New Custom Report
      </button>

      <div className="flex flex-wrap gap-1.5">
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => onCategoryChange(cat)}
            aria-pressed={category === cat}
            className={`rounded-full px-2.5 py-1 text-xs font-medium transition ${category === cat ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
          >
            {cat}
          </button>
        ))}
      </div>

      <nav aria-label="Saved reports" className="flex-1 space-y-1.5 overflow-y-auto">
        {visible.map((template) => {
          const active = activeReportId === template.reportId;
          return (
            <button
              key={template.reportId}
              type="button"
              onClick={() => onSelect(template)}
              aria-current={active ? 'true' : undefined}
              className={`w-full rounded-lg border px-3 py-2.5 text-left transition ${active ? 'border-emerald-600 bg-emerald-50' : 'border-transparent hover:bg-slate-50'}`}
            >
              <p className={`text-sm font-medium ${active ? 'text-emerald-700' : 'text-slate-800'}`}>{template.name}</p>
              <p className="mt-0.5 text-xs text-slate-400">{template.description}</p>
              {template.scheduledCron && (
                <p className="mt-1.5 flex items-center gap-1 text-[11px] font-medium text-slate-400">
                  <Clock3 className="h-3 w-3" aria-hidden="true" />
                  Scheduled
                </p>
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}

export default TemplatesSidebar;
