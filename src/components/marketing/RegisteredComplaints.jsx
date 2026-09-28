import React, { useMemo, useState } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  ClipboardList,
  Mail,
  MapPin,
  MessageSquareMore,
  Phone,
  Search,
  ShieldAlert,
  UserRound,
  XCircle,
} from 'lucide-react';
import Card from '../common/Card';
import SectionHeading from '../common/SectionHeading';
import { registeredComplaints as registeredComplaintsSeed } from '../../data/registeredComplaints';

const statusOptions = ['Open', 'Assigned', 'In Progress', 'On Hold', 'Resolved', 'Closed'];
const categoryOptions = ['Gas Supply', 'Billing', 'Meter', 'Service', 'Pipeline', 'Emergency', 'Other'];
const priorityOptions = ['Critical', 'High', 'Medium', 'Low'];

function currentStamp() {
  return new Date().toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function buildHistoryEntry(action) {
  return { date: currentStamp(), action };
}

function RegisteredComplaints({ onShowToast }) {
  const showToast = onShowToast ?? (() => {});
  const [complaints, setComplaints] = useState(registeredComplaintsSeed);
  const [selectedComplaintId, setSelectedComplaintId] = useState(registeredComplaintsSeed[0]?.id ?? null);
  const [isDetailView, setIsDetailView] = useState(false);
  const [isClosingModalOpen, setIsClosingModalOpen] = useState(false);
  const [newStatusSelection, setNewStatusSelection] = useState('In Progress');
  const [resolutionSummaryInput, setResolutionSummaryInput] = useState('');
  const [closingRemarksInput, setClosingRemarksInput] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterPriority, setFilterPriority] = useState('All');
  const [filterCategory, setFilterCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const selectedComplaint = useMemo(
    () => complaints.find((complaint) => complaint.id === selectedComplaintId) ?? null,
    [complaints, selectedComplaintId],
  );

  const summary = useMemo(() => {
    const totalCount = complaints.length;
    return {
      totalCount,
      openCount: complaints.filter((complaint) => complaint.status === 'Open').length,
      inProgressCount: complaints.filter((complaint) => ['Assigned', 'In Progress', 'On Hold'].includes(complaint.status)).length,
      resolvedCount: complaints.filter((complaint) => complaint.status === 'Resolved').length,
      closedCount: complaints.filter((complaint) => complaint.status === 'Closed').length,
      criticalCount: complaints.filter((complaint) => complaint.priority === 'Critical').length,
      highCount: complaints.filter((complaint) => complaint.priority === 'High').length,
      mediumCount: complaints.filter((complaint) => complaint.priority === 'Medium').length,
      lowCount: complaints.filter((complaint) => complaint.priority === 'Low').length,
    };
  }, [complaints]);

  const filteredComplaints = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();

    return complaints.filter((complaint) => {
      const matchStatus = filterStatus === 'All' || complaint.status === filterStatus;
      const matchPriority = filterPriority === 'All' || complaint.priority === filterPriority;
      const matchCategory = filterCategory === 'All' || complaint.category === filterCategory;
      const matchSearch =
        !query ||
        [complaint.id, complaint.subject, complaint.customerName, complaint.description, complaint.category, complaint.status, complaint.customerId]
          .some((value) => value.toLowerCase().includes(query));

      return matchStatus && matchPriority && matchCategory && matchSearch;
    });
  }, [complaints, filterCategory, filterPriority, filterStatus, searchQuery]);

  const getPriorityBadgeClass = (priority) => {
    switch (priority) {
      case 'Critical':
        return 'bg-rose-100 text-rose-700';
      case 'High':
        return 'bg-amber-100 text-amber-700';
      case 'Medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'Low':
        return 'bg-sky-100 text-sky-700';
      default:
        return 'bg-slate-100 text-slate-600';
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Open':
        return 'bg-amber-100 text-amber-700';
      case 'Assigned':
        return 'bg-sky-100 text-sky-700';
      case 'In Progress':
        return 'bg-blue-100 text-blue-700';
      case 'On Hold':
        return 'bg-slate-100 text-slate-600';
      case 'Resolved':
        return 'bg-emerald-100 text-emerald-700';
      case 'Closed':
        return 'bg-slate-200 text-slate-700';
      default:
        return 'bg-slate-100 text-slate-600';
    }
  };

  const openComplaintDetail = (complaint) => {
    setSelectedComplaintId(complaint.id);
    setNewStatusSelection(complaint.status);
    setIsDetailView(true);
    setIsClosingModalOpen(false);
  };

  const backToList = () => {
    setIsDetailView(false);
    setIsClosingModalOpen(false);
  };

  const replaceComplaint = (complaintId, transform) => {
    let updatedComplaint = null;

    setComplaints((current) =>
      current.map((complaint) => {
        if (complaint.id !== complaintId) return complaint;
        updatedComplaint = transform(complaint);
        return updatedComplaint;
      }),
    );

    if (updatedComplaint) {
      setSelectedComplaintId(updatedComplaint.id);
    }

    return updatedComplaint;
  };

  const updateStatus = () => {
    if (!selectedComplaint) return;
    if (selectedComplaint.status === newStatusSelection) {
      showToast(`Complaint ${selectedComplaint.id} is already marked as ${newStatusSelection}.`);
      return;
    }

    const nextComplaint = replaceComplaint(selectedComplaint.id, (complaint) => ({
      ...complaint,
      status: newStatusSelection,
      lastUpdated: currentStamp(),
      history: [...complaint.history, buildHistoryEntry(`Status updated to ${newStatusSelection} by Corporate Marketing.`)],
    }));

    if (nextComplaint) {
      showToast(`Complaint status updated to ${newStatusSelection}.`);
    }
  };

  const openCloseModal = () => {
    if (!selectedComplaint) return;
    setResolutionSummaryInput(selectedComplaint.resolutionSummary || '');
    setClosingRemarksInput(selectedComplaint.closingRemarks || '');
    setIsClosingModalOpen(true);
  };

  const cancelClose = () => {
    setIsClosingModalOpen(false);
  };

  const confirmCloseComplaint = () => {
    if (!selectedComplaint) return;

    const nextComplaint = replaceComplaint(selectedComplaint.id, (complaint) => ({
      ...complaint,
      status: 'Closed',
      resolutionSummary: resolutionSummaryInput || 'Resolved and verified by Corporate Marketing.',
      closingRemarks: closingRemarksInput || 'Customer confirmed resolution.',
      lastUpdated: currentStamp(),
      history: [...complaint.history, buildHistoryEntry('Complaint closed by Corporate Marketing.')],
    }));

    setNewStatusSelection('Closed');
    setIsClosingModalOpen(false);

    if (nextComplaint) {
      showToast('Complaint has been successfully closed.');
    }
  };

  const detailRows = selectedComplaint
    ? [
        { label: 'Complaint ID', value: selectedComplaint.id },
        { label: 'Customer Name', value: selectedComplaint.customerName },
        { label: 'Customer ID', value: selectedComplaint.customerId },
        { label: 'Complaint Category', value: selectedComplaint.category },
        { label: 'Priority', value: selectedComplaint.priority },
        { label: 'Date/Time Raised', value: selectedComplaint.raisedOn },
        { label: 'Current Status', value: selectedComplaint.status },
        { label: 'Last Updated', value: selectedComplaint.lastUpdated },
      ]
    : [];

  return (
    <div className="space-y-6">
      {!isDetailView && (
        <>
          <SectionHeading
            eyebrow="Marketing"
            title="Registered Complaints"
            description="Real-time synchronized complaint monitoring across all industrial consumers."
          />

          <Card className="p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-600">Torrent Gas - Corporate Marketing Portal</p>
                <h3 className="mt-1 text-lg font-semibold text-slate-900">Shared complaint view</h3>
                <p className="mt-1 text-sm text-slate-500">Use the filters below to track complaint status, priority, and category in one place.</p>
              </div>
              <div className="rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
                Shared database view
              </div>
            </div>
          </Card>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            {[
              ['Total Complaints', summary.totalCount, 'text-slate-900'],
              ['Open', summary.openCount, 'text-amber-600'],
              ['In Progress', summary.inProgressCount, 'text-sky-600'],
              ['Resolved', summary.resolvedCount, 'text-emerald-600'],
              ['Closed', summary.closedCount, 'text-slate-600'],
            ].map(([label, value, tone]) => (
              <Card key={label} className="p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{label}</p>
                <p className={`mt-2 text-3xl font-semibold ${tone}`}>{value}</p>
              </Card>
            ))}
          </div>

          <Card className="p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Priority distribution</h3>
                <p className="mt-1 text-sm text-slate-500">A quick view of complaint load by urgency and resolution pace.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-rose-100 px-3 py-1.5 text-xs font-semibold text-rose-700">Critical: {summary.criticalCount}</span>
                <span className="rounded-full bg-amber-100 px-3 py-1.5 text-xs font-semibold text-amber-700">High: {summary.highCount}</span>
                <span className="rounded-full bg-yellow-100 px-3 py-1.5 text-xs font-semibold text-yellow-800">Medium: {summary.mediumCount}</span>
                <span className="rounded-full bg-sky-100 px-3 py-1.5 text-xs font-semibold text-sky-700">Low: {summary.lowCount}</span>
              </div>
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Filter and search complaints</h3>
                <p className="mt-1 text-sm text-slate-500">Search by complaint ID, subject, customer, category, or current status.</p>
              </div>
              <div className="rounded-full bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600">
                Average Resolution Time: 2.4 Days
              </div>
            </div>

            <div className="mt-5 grid gap-4 lg:grid-cols-4">
              <label className="block text-sm">
                <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Status</span>
                <select value={filterStatus} onChange={(event) => setFilterStatus(event.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-emerald-500">
                  <option value="All">All Statuses</option>
                  {statusOptions.map((status) => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </label>

              <label className="block text-sm">
                <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Priority</span>
                <select value={filterPriority} onChange={(event) => setFilterPriority(event.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-emerald-500">
                  <option value="All">All Priorities</option>
                  {priorityOptions.map((priority) => (
                    <option key={priority} value={priority}>{priority}</option>
                  ))}
                </select>
              </label>

              <label className="block text-sm">
                <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Category</span>
                <select value={filterCategory} onChange={(event) => setFilterCategory(event.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-emerald-500">
                  <option value="All">All Categories</option>
                  {categoryOptions.map((category) => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </label>

              <label className="block text-sm">
                <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Search</span>
                <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 shadow-sm focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500">
                  <Search className="h-4 w-4 shrink-0 text-slate-400" />
                  <input
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="ID, subject, customer, status..."
                    className="w-full border-0 p-0 text-sm text-slate-800 outline-none placeholder:text-slate-400"
                  />
                </div>
              </label>
            </div>
          </Card>

          <Card className="overflow-hidden">
            <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Complaint records</h3>
                <p className="text-sm text-slate-500">{filteredComplaints.length} complaint{filteredComplaints.length === 1 ? '' : 's'} match the current filters.</p>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600">
                <ClipboardList className="h-3.5 w-3.5" />
                Shared database view
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[1100px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-[0.16em] text-slate-500">
                  <tr>
                    <th className="px-5 py-3 font-semibold">Complaint ID</th>
                    <th className="px-5 py-3 font-semibold">Customer Name</th>
                    <th className="px-5 py-3 font-semibold">Category / Subject</th>
                    <th className="px-5 py-3 font-semibold">Priority</th>
                    <th className="px-5 py-3 font-semibold">Raised On</th>
                    <th className="px-5 py-3 font-semibold">Status</th>
                    <th className="px-5 py-3 font-semibold">Last Updated</th>
                    <th className="px-5 py-3 font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredComplaints.map((complaint) => (
                    <tr key={complaint.id} className="transition hover:bg-slate-50/80">
                      <td className="px-5 py-4 font-semibold text-slate-900">{complaint.id}</td>
                      <td className="px-5 py-4 text-slate-700">{complaint.customerName}</td>
                      <td className="px-5 py-4">
                        <div className="font-medium text-slate-900">{complaint.category}</div>
                        <div className="mt-1 text-xs text-slate-500">{complaint.subject}</div>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getPriorityBadgeClass(complaint.priority)}`}>
                          {complaint.priority}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-slate-600">{complaint.raisedOn}</td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusBadgeClass(complaint.status)}`}>
                          {complaint.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-slate-600">{complaint.lastUpdated}</td>
                      <td className="px-5 py-4">
                        <button type="button" onClick={() => openComplaintDetail(complaint)} className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-slate-900 hover:bg-slate-900 hover:text-white">
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredComplaints.length === 0 && (
                    <tr>
                      <td colSpan="8" className="px-5 py-10 text-center text-sm text-slate-500">
                        No complaints match the selected filter criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}

      {isDetailView && selectedComplaint && (
        <div className="space-y-6">
          <button type="button" onClick={backToList} className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 transition hover:text-slate-950">
            <ArrowLeft className="h-4 w-4" />
            Back to Complaints List
          </button>

          <Card className="p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-600">Complaint Management Console</p>
                <h2 className="mt-1 text-2xl font-semibold text-slate-900">{selectedComplaint.id} - {selectedComplaint.subject}</h2>
                <p className="mt-2 text-sm text-slate-500">Customer: <span className="font-semibold text-slate-800">{selectedComplaint.customerName}</span></p>
              </div>
              <span className={`inline-flex w-fit rounded-full px-4 py-2 text-sm font-semibold ${getStatusBadgeClass(selectedComplaint.status)}`}>
                {selectedComplaint.status}
              </span>
            </div>
          </Card>

          <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
            <div className="space-y-6">
              <Card className="p-5">
                <h3 className="text-lg font-semibold text-slate-900">Complaint information</h3>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {detailRows.map((row) => (
                    <div key={row.label} className="rounded-xl bg-slate-50 px-4 py-3">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">{row.label}</p>
                      <p className="mt-1 text-sm font-medium text-slate-900">{row.value}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Description</p>
                  <p className="mt-2 text-sm leading-6 text-slate-700">{selectedComplaint.description}</p>
                </div>
              </Card>

              <Card className="p-5">
                <h3 className="text-lg font-semibold text-slate-900">Customer information</h3>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {[
                    { icon: UserRound, label: 'Contact Person', value: selectedComplaint.contactName },
                    { icon: Mail, label: 'Email', value: selectedComplaint.email },
                    { icon: Phone, label: 'Phone Number', value: selectedComplaint.phone },
                    { icon: MapPin, label: 'Location / Plant', value: selectedComplaint.location },
                    { icon: MessageSquareMore, label: 'Account Manager', value: selectedComplaint.accountManager },
                  ].map((row) => {
                    const Icon = row.icon;
                    return (
                      <div key={row.label} className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4">
                        <div className="rounded-lg bg-slate-50 p-2 text-slate-500">
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">{row.label}</p>
                          <p className="mt-1 break-words text-sm font-medium text-slate-900">{row.value}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            </div>

            <div className="space-y-6">
              <Card className="p-5">
                <h3 className="text-lg font-semibold text-slate-900">Manage complaint status</h3>

                <div className="mt-4">
                  <label className="block text-sm">
                    <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Update Status</span>
                    <div className="flex flex-col gap-3 sm:flex-row">
                      <select value={newStatusSelection} onChange={(event) => setNewStatusSelection(event.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-emerald-500">
                        {statusOptions.filter((status) => status !== 'Closed').map((status) => (
                          <option key={status} value={status}>{status}</option>
                        ))}
                        <option value="Closed" disabled>Closed (Use Close Action)</option>
                      </select>
                      <button type="button" onClick={updateStatus} className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800">
                        <ShieldAlert className="h-4 w-4" />
                        Update Status
                      </button>
                    </div>
                  </label>
                </div>

                <div className="my-5 h-px bg-slate-200" />

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h4 className="text-base font-semibold text-slate-900">Resolution and closure</h4>
                    <p className="mt-1 text-sm text-slate-500">Close this complaint once the issue is fully resolved.</p>
                  </div>
                  <button type="button" onClick={openCloseModal} disabled={selectedComplaint.status === 'Closed'} className="inline-flex items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-slate-300">
                    <CheckCircle2 className="h-4 w-4" />
                    Close Complaint
                  </button>
                </div>

                {selectedComplaint.resolutionSummary && (
                  <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                    <div className="flex items-center gap-2 text-sm font-semibold text-emerald-700">
                      <CheckCircle2 className="h-4 w-4" /> Resolution Details
                    </div>
                    <p className="mt-3 text-sm text-slate-700"><span className="font-semibold text-slate-900">Summary:</span> {selectedComplaint.resolutionSummary}</p>
                    <p className="mt-2 text-sm text-slate-700"><span className="font-semibold text-slate-900">Remarks:</span> {selectedComplaint.closingRemarks || 'No additional closing remarks provided.'}</p>
                  </div>
                )}
              </Card>

              <Card className="p-5">
                <h3 className="text-lg font-semibold text-slate-900">Complaint history and timeline</h3>
                <div className="mt-4 space-y-4 border-l-2 border-slate-200 pl-5">
                  {selectedComplaint.history.map((item, index) => (
                    <div key={`${item.date}-${index}`} className="relative">
                      <span className="absolute -left-[31px] top-1.5 h-3 w-3 rounded-full bg-emerald-500 ring-4 ring-white" />
                      <p className="text-xs font-semibold text-slate-500">{item.date}</p>
                      <p className="mt-1 text-sm text-slate-700">{item.action}</p>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        </div>
      )}

      {isClosingModalOpen && selectedComplaint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4 py-6 backdrop-blur-sm">
          <Card className="w-full max-w-2xl p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-600">Section 6: Closing modal</p>
                <h3 className="mt-1 text-xl font-semibold text-slate-900">Close Complaint ({selectedComplaint.id})</h3>
                <p className="mt-2 text-sm text-slate-500">Provide the resolution summary and closing remarks before finalizing closure. The update reflects immediately in the shared view.</p>
              </div>
              <button type="button" onClick={cancelClose} className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700">
                <XCircle className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-5 space-y-4">
              <label className="block text-sm">
                <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Resolution Summary <span className="text-rose-600">*</span></span>
                <textarea
                  value={resolutionSummaryInput}
                  onChange={(event) => setResolutionSummaryInput(event.target.value)}
                  rows={4}
                  placeholder="Describe how the issue was resolved..."
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-emerald-500"
                />
              </label>

              <label className="block text-sm">
                <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Closing Remarks</span>
                <textarea
                  value={closingRemarksInput}
                  onChange={(event) => setClosingRemarksInput(event.target.value)}
                  rows={3}
                  placeholder="Customer confirmation or follow-up notes..."
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-emerald-500"
                />
              </label>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={cancelClose} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
                Cancel
              </button>
              <button type="button" onClick={confirmCloseComplaint} className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800">
                <CheckCircle2 className="h-4 w-4" />
                Close Complaint
              </button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

export default RegisteredComplaints;