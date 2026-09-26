import React from 'react';
import { FileBarChart2, RefreshCcw, ServerCrash } from 'lucide-react';
import Card from '../common/Card';

export function ReportLoadingState() {
  return (
    <div className="space-y-4" role="status" aria-live="polite" aria-label="Generating report">
      <span className="sr-only">Generating report…</span>
      <Card className="h-64 animate-pulse p-5">
        <div className="h-4 w-40 rounded bg-slate-200" />
        <div className="mt-6 h-44 rounded bg-slate-100" />
      </Card>
      <Card className="animate-pulse p-5">
        <div className="h-4 w-32 rounded bg-slate-200" />
        <div className="mt-4 h-24 rounded bg-slate-100" />
      </Card>
    </div>
  );
}

export function ReportEmptyState() {
  return (
    <Card className="flex flex-col items-center gap-3 p-10 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
        <FileBarChart2 className="h-6 w-6 text-slate-400" aria-hidden="true" />
      </div>
      <p className="text-sm font-semibold text-slate-800">No data for the selected filters</p>
      <p className="text-sm text-slate-500">Adjust the date range or granularity to generate a report.</p>
    </Card>
  );
}

export function ReportErrorState({ onRetry }) {
  return (
    <Card className="flex flex-col items-center gap-3 p-10 text-center" role="alert">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-50">
        <ServerCrash className="h-6 w-6 text-rose-600" aria-hidden="true" />
      </div>
      <div>
        <p className="text-sm font-semibold text-slate-800">Report generation failed</p>
        <p className="mt-1 text-sm text-slate-500">The report engine could not be reached. Please try again.</p>
      </div>
      <button
        type="button"
        onClick={onRetry}
        className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
      >
        <RefreshCcw className="h-4 w-4" aria-hidden="true" />
        Retry
      </button>
    </Card>
  );
}
