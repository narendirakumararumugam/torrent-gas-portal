import React from 'react';
import { AlertTriangle, Gauge, Ratio, Wind } from 'lucide-react';
import Card from '../common/Card';

const alertIconMap = { 'take-or-pay': Ratio, 'max-flow-rate': Wind };

/* KPI cards + automated contractual threshold alerts for the MGO & Flow Rate report */
function MgoFlowKpiPanel({ kpis, alerts }) {
  const cards = [
    { label: "Today's Consumption", value: `${kpis.todaysConsumption.toFixed(2)} MMBTU`, icon: Gauge, tone: 'text-blue-900' },
    { label: 'Monthly Average Consumption', value: `${kpis.monthlyAverageConsumption.toFixed(2)} MMBTU`, icon: Gauge, tone: 'text-blue-900' },
    { label: 'Minimum Obligation (90% DCQ)', value: `${kpis.minimumObligation.toFixed(2)} MMBTU`, icon: Ratio, tone: 'text-slate-600' },
    {
      label: 'Efficiency Index',
      value: `${kpis.efficiencyIndex.toFixed(2)}%`,
      icon: Ratio,
      tone: kpis.efficiencyIndex < 90 ? 'text-rose-600' : 'text-emerald-600',
    },
  ];

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <Card key={card.label} className="p-4">
            <div className="flex items-center gap-2">
              <card.icon className={`h-4 w-4 ${card.tone}`} aria-hidden="true" />
              <p className="text-xs font-medium text-slate-500">{card.label}</p>
            </div>
            <p className={`mt-2 text-xl font-bold ${card.tone}`}>{card.value}</p>
          </Card>
        ))}
      </div>

      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((alert) => {
            const Icon = alertIconMap[alert.id] || AlertTriangle;
            return (
              <div key={alert.id} className="flex gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-rose-100">
                  <Icon className="h-4.5 w-4.5 text-rose-600" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-rose-800">{alert.title}</p>
                  <p className="mt-0.5 text-xs leading-5 text-rose-700">{alert.message}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default MgoFlowKpiPanel;
