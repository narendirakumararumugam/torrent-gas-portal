import React, { useState } from 'react';
import { CalendarClock, CheckCircle2, X, XCircle } from 'lucide-react';
import Card from '../common/Card';

const frequencyOptions = [
  { value: '0 6 * * *', label: 'Daily, 06:00' },
  { value: '0 6 * * 1', label: 'Weekly, Monday 06:00' },
  { value: '0 7 1 * *', label: 'Monthly, 1st at 07:00' },
];

/* Configure recurring report delivery + view historical run log */
function ScheduleModal({ template, runHistory = [], onClose, onSave }) {
  const [cron, setCron] = useState(template.scheduledCron || frequencyOptions[0].value);
  const [recipients, setRecipients] = useState('ops.desk@cngportal.example');

  const handleSubmit = (event) => {
    event.preventDefault();
    onSave(cron, recipients.split(',').map((r) => r.trim()).filter(Boolean));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4">
      <Card className="w-full max-w-lg p-6" role="dialog" aria-modal="true" aria-labelledby="schedule-modal-title">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Schedule Report</p>
            <h3 id="schedule-modal-title" className="mt-1 text-lg font-semibold text-slate-900">{template.name}</h3>
          </div>
          <button type="button" onClick={onClose} aria-label="Close schedule dialog" className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100">
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <label className="block text-sm">
            <span className="text-slate-600">Frequency</span>
            <select value={cron} onChange={(event) => setCron(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-800 outline-none focus:border-emerald-600">
              {frequencyOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="text-slate-600">Recipients (comma-separated)</span>
            <input
              value={recipients}
              onChange={(event) => setRecipients(event.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-800 outline-none focus:border-emerald-600"
            />
          </label>

          {runHistory.length > 0 && (
            <div>
              <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
                <CalendarClock className="h-3.5 w-3.5" aria-hidden="true" />
                Run History
              </p>
              <ul className="max-h-32 space-y-1.5 overflow-y-auto rounded-lg border border-slate-200 p-2">
                {runHistory.map((run, index) => (
                  <li key={index} className="flex items-center justify-between gap-2 rounded-md px-2 py-1.5 text-xs">
                    <span className="text-slate-600">{new Date(run.runAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                    <span className={`flex items-center gap-1 font-medium ${run.status === 'success' ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {run.status === 'success' ? <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" /> : <XCircle className="h-3.5 w-3.5" aria-hidden="true" />}
                      {run.status}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50">
              Cancel
            </button>
            <button type="submit" className="flex-1 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700">
              Save Schedule
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
}

export default ScheduleModal;
