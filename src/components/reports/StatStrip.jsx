import React from 'react';
import Card from '../common/Card';

/* Metric strip - reusable small StatCards row driven by a report's computed stats */
function StatStrip({ stats, unit = 'SCM' }) {
  const items = [
    { label: 'Total', value: stats.total, suffix: unit },
    { label: 'Average', value: stats.avg, suffix: unit },
    { label: 'Peak', value: stats.peak, suffix: unit },
    { label: 'Min', value: stats.min, suffix: unit },
  ];
  if (stats.percentOfDCQ !== null && stats.percentOfDCQ !== undefined) {
    items.push({ label: '% of MGQ', value: stats.percentOfDCQ, suffix: '%' });
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {items.map((item) => (
        <Card key={item.label} className="p-3.5">
          <p className="text-xs font-medium text-slate-500">{item.label}</p>
          <p className="mt-1 text-lg font-bold text-slate-900">
            {Number(item.value).toLocaleString('en-IN')}
            <span className="ml-1 text-xs font-medium text-slate-400">{item.suffix}</span>
          </p>
        </Card>
      ))}
    </div>
  );
}

export default StatStrip;
