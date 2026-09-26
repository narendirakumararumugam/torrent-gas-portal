import React, { useEffect, useMemo, useState } from 'react';
import { MessageSquareText, Send } from 'lucide-react';
import Card from './Card';
import {
  CUSTOMER_STATUS_OPTIONS,
  appendCustomerUpdate,
  ensureCustomerThread,
  formatThreadTimestamp,
  subscribeCustomerCollaboration,
  getCustomerThread,
} from '../../utils/customerCollaboration';

function CustomerCollaborationPanel({ customerKey, customerName, viewerLabel = 'Operator', authorName = 'Marketing Operator' }) {
  const [thread, setThread] = useState(() => ensureCustomerThread(customerKey, { status: 'Monitoring' }));
  const [text, setText] = useState('');
  const [status, setStatus] = useState(thread.status || CUSTOMER_STATUS_OPTIONS[0]);
  const [kind, setKind] = useState('comment');

  useEffect(() => {
    setThread(getCustomerThread(customerKey));
    setStatus(getCustomerThread(customerKey).status || CUSTOMER_STATUS_OPTIONS[0]);
  }, [customerKey]);

  useEffect(() => {
    return subscribeCustomerCollaboration(() => {
      const nextThread = getCustomerThread(customerKey);
      setThread(nextThread);
      setStatus(nextThread.status || CUSTOMER_STATUS_OPTIONS[0]);
    });
  }, [customerKey]);

  const lastMessage = thread.messages[thread.messages.length - 1];
  const currentStatusTone = useMemo(() => {
    if (thread.status === 'Resolved') return 'bg-emerald-100 text-emerald-700';
    if (thread.status === 'Action required' || thread.status === 'Billing review') return 'bg-amber-100 text-amber-800';
    return 'bg-sky-100 text-sky-700';
  }, [thread.status]);

  const postUpdate = (event) => {
    event.preventDefault();
    const trimmed = text.trim();
    if (!trimmed && kind === 'comment') return;

    const nextStatus = kind === 'status' ? status : thread.status || status;
    appendCustomerUpdate(customerKey, {
      authorRole: viewerLabel,
      authorName,
      kind,
      status: nextStatus,
      text: trimmed || `Status updated to ${nextStatus}`,
    });
    setText('');
  };

  return (
    <Card className="border-emerald-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-600">Live updates</p>
          <h3 className="mt-1 text-lg font-semibold text-slate-900">Shared operator and customer thread</h3>
          <p className="mt-1 text-sm text-slate-500">Two-way synchronized comments and operational notes for {customerName}.</p>
        </div>
        <div className={`rounded-full px-3 py-1 text-xs font-semibold ${currentStatusTone}`}>{thread.status || 'Monitoring'}</div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl bg-slate-50 p-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Current status</p>
          <p className="mt-1 text-sm font-semibold text-slate-900">{thread.status || 'Monitoring'}</p>
        </div>
        <div className="rounded-xl bg-slate-50 p-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Last update</p>
          <p className="mt-1 text-sm font-semibold text-slate-900">{lastMessage ? formatThreadTimestamp(lastMessage.createdAt) : 'No updates yet'}</p>
        </div>
        <div className="rounded-xl bg-slate-50 p-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Thread count</p>
          <p className="mt-1 text-sm font-semibold text-slate-900">{thread.messages.length} entries</p>
        </div>
      </div>

      <div className="mt-4 max-h-[280px] space-y-3 overflow-y-auto rounded-2xl border border-slate-200 bg-slate-50 p-3">
        {thread.messages.length === 0 && <p className="py-6 text-center text-sm text-slate-500">No comments or status updates yet.</p>}
        {thread.messages.map((message) => (
          <div key={message.id} className={`rounded-2xl border px-3 py-2.5 ${message.authorRole === viewerLabel ? 'border-emerald-200 bg-emerald-50' : 'border-slate-200 bg-white'}`}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">{message.authorName}</p>
                <p className="text-[11px] uppercase tracking-[0.16em] text-slate-400">{message.authorRole} · {message.kind}</p>
              </div>
              <span className="text-[11px] text-slate-400">{formatThreadTimestamp(message.createdAt)}</span>
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-700">{message.text}</p>
            <p className="mt-2 text-xs font-medium text-slate-500">Status: {message.status}</p>
          </div>
        ))}
      </div>

      <form className="mt-4 space-y-3" onSubmit={postUpdate}>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Update type
            <select value={kind} onChange={(event) => setKind(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-emerald-600">
              <option value="comment">Comment</option>
              <option value="status">Operational status</option>
            </select>
          </label>
          <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Status
            <select value={status} onChange={(event) => setStatus(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-emerald-600">
              {CUSTOMER_STATUS_OPTIONS.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          </label>
        </div>

        <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
          Comment or note
          <textarea
            value={text}
            onChange={(event) => setText(event.target.value)}
            rows={3}
            placeholder="Add a customer-visible note or an internal operational update"
            className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-emerald-600"
          />
        </label>

        <button
          type="submit"
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
        >
          <Send className="h-4 w-4" aria-hidden="true" />
          Send update
        </button>
      </form>

      <div className="mt-3 flex items-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs leading-5 text-emerald-800">
        <MessageSquareText className="h-4 w-4" aria-hidden="true" />
        Messages and status changes are shared in real time across operator and customer sessions for this account.
      </div>
    </Card>
  );
}

export default CustomerCollaborationPanel;