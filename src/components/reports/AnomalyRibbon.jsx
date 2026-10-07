import React from 'react';
import { AlertTriangle } from 'lucide-react';

/* Highlights out-of-threshold datapoints with a contextual explanation */
function AnomalyRibbon({ anomalies }) {
  if (!anomalies || anomalies.length === 0) return null;

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
      <div className="flex items-center gap-2 text-amber-800">
        <AlertTriangle className="h-4 w-4" aria-hidden="true" />
        <p className="text-xs font-semibold uppercase tracking-wide">{anomalies.length} alert{anomalies.length === 1 ? '' : 's'} detected</p>
      </div>
      <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
        {anomalies.map((item, index) => (
          <div key={`${item.label}-${index}`} className="min-w-[220px] rounded-lg border border-amber-200 bg-white p-3 text-xs">
            <p className="font-semibold text-slate-800">{item.title}</p>
            <p className="mt-1 text-slate-500">{item.detail}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default AnomalyRibbon;
