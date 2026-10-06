import React from 'react';
import { AlertTriangle, Bell, CheckCircle2, Info, Receipt, ShieldCheck, Sparkles } from 'lucide-react';
import Card from './Card';
import SectionHeading from './SectionHeading';

const severityStyles = {
  critical: 'bg-rose-50 text-rose-700 ring-1 ring-rose-600/20',
  warning: 'bg-amber-50 text-amber-700 ring-1 ring-amber-600/20',
  info: 'bg-sky-50 text-sky-700 ring-1 ring-sky-600/20',
};

const severityBorders = {
  critical: 'border-rose-200',
  warning: 'border-amber-200',
  info: 'border-slate-200',
};

const typeIcons = { billing: Receipt, security: ShieldCheck, service: CheckCircle2, tariff: Sparkles };

function severityRank(severity) {
  return severity === 'critical' ? 0 : severity === 'warning' ? 1 : 2;
}

/* Shared presentational list - industrial/commercial wrappers each build their own `notifications` array */
function NotificationsList({
  notifications,
  customerName,
  eyebrow = 'Alerts',
  title = 'Notifications',
  description = `Real-time billing, security, service, and tariff alerts for ${customerName}.`,
  emptyLabel = "You're all caught up - no active notifications.",
}) {
  const sorted = [...notifications].sort((a, b) => severityRank(a.severity) - severityRank(b.severity));

  return (
    <div className="space-y-6">
      <SectionHeading eyebrow={eyebrow} title={title} description={description} />

      {sorted.length === 0 ? (
        <Card className="p-6 text-center text-sm text-slate-500">{emptyLabel}</Card>
      ) : (
        <div className="space-y-3">
          {sorted.map((item) => {
            const TypeIcon = typeIcons[item.type] || Bell;
            return (
              <Card key={item.id} className={`p-4 ${severityBorders[item.severity] || severityBorders.info}`}>
                <div className="flex items-start gap-3">
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${severityStyles[item.severity] || severityStyles.info}`}>
                    {item.severity === 'critical' ? <AlertTriangle className="h-4.5 w-4.5" aria-hidden="true" /> : <TypeIcon className="h-4.5 w-4.5" aria-hidden="true" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                      <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${severityStyles[item.severity] || severityStyles.info}`}>
                        {item.severity}
                      </span>
                    </div>
                    <p className="mt-1 text-xs leading-5 text-slate-600">{item.detail}</p>
                    <p className="mt-1 flex items-center gap-1 text-[11px] text-slate-400">
                      <Info className="h-3 w-3" aria-hidden="true" />
                      {item.date}
                    </p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default NotificationsList;
