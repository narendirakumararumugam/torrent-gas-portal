import React from 'react';
import Card from './common/Card';
import SectionHeading from './common/SectionHeading';

function CorporateWorkspace({ department, onShowToast }) {
  const stats = [
    { label: 'Open Requests', value: '18' },
    { label: 'Pending Approvals', value: '5' },
    { label: 'Active Projects', value: '9' },
  ];

  return (
    <div className="space-y-6">
      <SectionHeading eyebrow="Corporate" title={`${department} Workspace`} description="Departmental overview of requests, approvals, and ongoing initiatives." />
      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.label} className="p-5">
            <p className="text-xs text-slate-500">{stat.label}</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">{stat.value}</p>
          </Card>
        ))}
      </div>
      <Card className="p-6">
        <label className="block text-sm">
          <span className="text-slate-600">Department Note</span>
          <textarea
            rows={3}
            placeholder="Add a note for the team..."
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-800 outline-none focus:border-emerald-600"
          />
        </label>
        <button
          type="button"
          onClick={() => onShowToast('Department note saved')}
          className="mt-4 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
        >
          Save Note
        </button>
      </Card>
    </div>
  );
}

export default CorporateWorkspace;
