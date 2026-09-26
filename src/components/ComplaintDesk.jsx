import React, { useState } from 'react';
import { Send } from 'lucide-react';
import Card from './common/Card';
import Badge from './common/Badge';
import SectionHeading from './common/SectionHeading';
import { complaintTickets, initialComplaint } from '../data/complaints';

function ComplaintDesk({ onSubmit }) {
  const [form, setForm] = useState(initialComplaint);

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit(form);
    setForm(initialComplaint);
  };

  return (
    <div className="space-y-6">
      <SectionHeading eyebrow="Support" title="Register Complaint" description="Submit a new service ticket and track existing tickets against SLA." />

      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="text-slate-600">Category</span>
              <select
                value={form.category}
                onChange={(event) => setForm({ ...form, category: event.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-800 outline-none focus:border-emerald-600"
              >
                {['Gas Pressure Issue', 'Billing Discrepancy', 'Meter Malfunction', 'Pipeline Leakage', 'Other'].map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              <span className="text-slate-600">Priority</span>
              <select
                value={form.priority}
                onChange={(event) => setForm({ ...form, priority: event.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-800 outline-none focus:border-emerald-600"
              >
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </label>
          </div>
          <label className="block text-sm">
            <span className="text-slate-600">Description</span>
            <textarea
              value={form.description}
              onChange={(event) => setForm({ ...form, description: event.target.value })}
              rows={4}
              placeholder="Describe the issue in detail..."
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-800 outline-none focus:border-emerald-600"
            />
          </label>
          <button
            type="submit"
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 sm:w-auto"
          >
            <Send className="h-4 w-4" />
            Submit Complaint
          </button>
        </form>
      </Card>

      <Card className="overflow-hidden">
        <p className="border-b border-slate-200 px-6 py-4 text-sm font-semibold text-slate-900">Existing Tickets - SLA Tracking</p>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-6 py-3 font-medium">Ticket ID</th>
                <th className="px-6 py-3 font-medium">Category</th>
                <th className="px-6 py-3 font-medium">Raised On</th>
                <th className="px-6 py-3 font-medium">Priority</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium">SLA</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {complaintTickets.map((ticket) => (
                <tr key={ticket.id} className="transition hover:bg-slate-50">
                  <td className="px-6 py-3 font-medium text-slate-800">{ticket.id}</td>
                  <td className="px-6 py-3 text-slate-500">{ticket.category}</td>
                  <td className="px-6 py-3 text-slate-500">{ticket.date}</td>
                  <td className="px-6 py-3"><Badge tone={ticket.priority} /></td>
                  <td className="px-6 py-3"><Badge tone={ticket.status} /></td>
                  <td className="px-6 py-3 text-slate-500">{ticket.sla}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

export default ComplaintDesk;
