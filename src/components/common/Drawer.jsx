import React from 'react';
import { X } from 'lucide-react';

/* Right-side slide-over for progressive disclosure: primary screens stay minimal, details open on demand */
function Drawer({ open, onClose, title, subtitle, badge, children }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-slate-950/50" onClick={onClose} aria-hidden="true" />
      <div role="dialog" aria-modal="true" aria-label={title} className="relative flex h-full w-full max-w-lg flex-col bg-slate-50 shadow-2xl">
        <div className="flex items-start justify-between gap-3 border-b border-slate-200 bg-white px-5 py-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="truncate text-lg font-semibold text-slate-900">{title}</p>
              {badge}
            </div>
            {subtitle && <p className="mt-0.5 truncate text-sm text-slate-500">{subtitle}</p>}
          </div>
          <button type="button" onClick={onClose} aria-label="Close panel" className="shrink-0 rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600">
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
        <div className="flex-1 space-y-4 overflow-y-auto p-5">{children}</div>
      </div>
    </div>
  );
}

export default Drawer;
