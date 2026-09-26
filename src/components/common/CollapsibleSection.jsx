import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

function CollapsibleSection({ title, subtitle, icon: Icon, defaultOpen = false, badge, tone = 'emerald', className = '', children }) {
  const [open, setOpen] = useState(defaultOpen);
  const toneClass = tone === 'rose' ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600';

  return (
    <div className={`rounded-xl border border-slate-200 bg-white shadow-sm ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 p-4 text-left"
      >
        <div className="flex min-w-0 items-center gap-3">
          {Icon && (
            <div className={`shrink-0 rounded-xl p-2 ${toneClass}`}>
              <Icon className="h-4 w-4" aria-hidden="true" />
            </div>
          )}
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-900">{title}</p>
            {subtitle && <p className="mt-0.5 truncate text-xs text-slate-500">{subtitle}</p>}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {badge}
          <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
        </div>
      </button>
      {open && <div className="border-t border-slate-100 p-4">{children}</div>}
    </div>
  );
}

export default CollapsibleSection;
