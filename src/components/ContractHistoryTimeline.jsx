import React from 'react';
import { ArrowRight, CalendarClock, FileText } from 'lucide-react';
import Card from './common/Card';
import Badge from './common/Badge';
import TimelineIcon from './common/TimelineIcon';

function ContractHistoryTimeline({ history = [], currentTerms }) {
  if (!history.length) return null;

  const firstEntry = history[0];
  const latestEntry = history[history.length - 1];
  const revisionCount = Math.max(history.length - 1, 0);

  return (
    <Card className="p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-600">Revision log</p>
          <h2 className="mt-1 text-xl font-semibold text-slate-900">Contract History</h2>
          <p className="mt-1 max-w-2xl text-sm text-slate-500">
            A visual record of every executed amendment, effective period, and contract parameter adjustment since inception.
          </p>
        </div>
        <Badge tone="active" uppercase>
          {history.length} tracked entries
        </Badge>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Inception</p>
          <p className="mt-1 text-sm font-semibold text-slate-900">{firstEntry.executedOn}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Latest execution</p>
          <p className="mt-1 text-sm font-semibold text-slate-900">{latestEntry.executedOn}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Revisions</p>
          <p className="mt-1 text-sm font-semibold text-slate-900">{revisionCount} amendment{revisionCount === 1 ? '' : 's'}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Current band</p>
          <p className="mt-1 text-sm font-semibold text-slate-900">
            {currentTerms?.dcq} / {currentTerms?.mdcq}
          </p>
        </div>
      </div>

      <div className="relative mt-6">
        <div className="absolute left-5 top-0 h-full w-px bg-slate-200" aria-hidden="true" />
        <div className="space-y-4">
          {history.map((entry, index) => {
            const isLatest = index === history.length - 1;

            return (
              <div key={entry.id} className="relative flex gap-4">
                <div className="relative z-10 pt-1">
                  <TimelineIcon Icon={isLatest ? CalendarClock : FileText} status={isLatest ? 'active' : 'completed'} />
                </div>

                <div className="min-w-0 flex-1 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 sm:p-5">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-semibold text-slate-900">{entry.title}</h3>
                        <Badge tone={isLatest ? 'active' : 'completed'} uppercase>
                          {entry.status}
                        </Badge>
                      </div>
                      <p className="mt-1 text-sm text-slate-600">{entry.summary}</p>
                    </div>

                    <div className="shrink-0 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600">
                      <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Executed on</p>
                      <p className="mt-1 font-semibold text-slate-900">{entry.executedOn}</p>
                      <p className="mt-1 text-xs text-slate-500">Effective {entry.effectivePeriod}</p>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    {entry.changes.map((change) => (
                      <div key={`${entry.id}-${change.label}`} className="rounded-xl border border-slate-200 bg-white px-3 py-3">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">{change.label}</p>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600">{change.before}</span>
                          <ArrowRight className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
                          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-600/20">{change.after}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}

export default ContractHistoryTimeline;