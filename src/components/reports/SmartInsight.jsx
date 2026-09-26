import React from 'react';
import { AlertTriangle, Lightbulb, TrendingUp } from 'lucide-react';
import Card from '../common/Card';

const iconByType = { anomaly: AlertTriangle, suggestion: Lightbulb, kpi: TrendingUp };
const toneByType = {
  anomaly: 'bg-rose-50 text-rose-600',
  suggestion: 'bg-amber-50 text-amber-600',
  kpi: 'bg-emerald-50 text-emerald-600',
};

/* SmartInsight: reusable insights panel - anomalies, suggested actions, KPI callouts */
function SmartInsight({ insights, title = 'Smart Insights' }) {
  return (
    <Card className="p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{title}</p>
      <div className="mt-3 space-y-3">
        {insights.length === 0 && <p className="text-sm text-slate-500">No notable insights for this report yet.</p>}
        {insights.map((insight, index) => {
          const Icon = iconByType[insight.type] || Lightbulb;
          return (
            <div key={index} className="flex gap-3 rounded-lg border border-slate-100 p-3">
              <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${toneByType[insight.type] || toneByType.kpi}`}>
                <Icon className="h-4 w-4" aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800">{insight.title}</p>
                <p className="mt-0.5 text-xs leading-5 text-slate-500">{insight.detail}</p>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

export default SmartInsight;
