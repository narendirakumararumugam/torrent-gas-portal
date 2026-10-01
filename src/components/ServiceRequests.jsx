import React, { useState } from 'react';
import { Send } from 'lucide-react';
import Card from './common/Card';
import Badge from './common/Badge';
import SectionHeading from './common/SectionHeading';
import { serviceRequestTypes, serviceRequestTickets, initialServiceRequest } from '../data/serviceRequests';

/* Non-complaint utility requests (duplicate invoice, meter shift, KYC, etc.), tracked separately from ComplaintDesk's SLA tickets */
function ServiceRequests({ onSubmit }) {
  const [form, setForm] = useState(initialServiceRequest);

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit(form);
    setForm(initialServiceRequest);
  };

  return (
    <div className="space-y-6">
      <SectionHeading eyebrow="Self-Service" title="Service Requests" description="Request common account changes and track them through to completion." />

      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="text-slate-600">Request Type</span>
              <select
                value={form.type}
                onChange={(event) => setForm({ ...form, type: event.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-800 outline-none focus:border-emerald-600"
              >
                {serviceRequestTypes.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              <span className="text-slate-600">Preferred Date</span>
              <input
                type="date"
                value={form.preferredDate}
                onChange={(event) => setForm({ ...form, preferredDate: event.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-800 outline-none focus:border-emerald-600"
              />
            </label>
          </div>
          <label className="block text-sm">
            <span className="text-slate-600">Notes</span>
            <textarea
              value={form.notes}
              onChange={(event) => setForm({ ...form, notes: event.target.value })}
              rows={4}
              placeholder="Add any details that will help us process this request..."
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-800 outline-none focus:border-emerald-600"
            />
          </label>
          <button
            type="submit"
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 sm:w-auto"
          >
            <Send className="h-4 w-4" />
            Submit Request
          </button>
        </form>
      </Card>

      <Card className="overflow-hidden">
        <p className="border-b border-slate-200 px-6 py-4 text-sm font-semibold text-slate-900">Existing Requests</p>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-6 py-3 font-medium">Request ID</th>
                <th className="px-6 py-3 font-medium">Type</th>
                <th className="px-6 py-3 font-medium">Raised On</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium">ETA</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {serviceRequestTickets.map((ticket) => (
                <tr key={ticket.id} className="transition hover:bg-slate-50">
                  <td className="px-6 py-3 font-medium text-slate-800">{ticket.id}</td>
                  <td className="px-6 py-3 text-slate-500">{ticket.type}</td>
                  <td className="px-6 py-3 text-slate-500">{ticket.date}</td>
                  <td className="px-6 py-3"><Badge tone={ticket.status} /></td>
                  <td className="px-6 py-3 text-slate-500">{ticket.eta}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

export default ServiceRequests;
