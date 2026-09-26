import React from 'react';
import Card from './common/Card';
import SectionHeading from './common/SectionHeading';

const approvalRequests = [
  { id: 'APR-2026-0091', title: 'Vendor PO - Pipeline Fittings', amount: '₹8,40,000' },
  { id: 'APR-2026-0088', title: 'Contractor Invoice - Survey Team', amount: '₹2,15,000' },
];

function ApprovalsPanel({ onShowToast }) {
  return (
    <div className="space-y-6">
      <SectionHeading eyebrow="Corporate" title="Approvals" description="Review and action pending approval requests." />
      <div className="space-y-3">
        {approvalRequests.map((req) => (
          <Card key={req.id} className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-900">{req.title}</p>
              <p className="text-xs text-slate-500">{req.id} · {req.amount}</p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => onShowToast(`${req.id} approved`)}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
              >
                Approve
              </button>
              <button
                type="button"
                onClick={() => onShowToast(`${req.id} rejected`)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
              >
                Reject
              </button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default ApprovalsPanel;
