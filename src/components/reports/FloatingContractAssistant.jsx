import React, { useState } from 'react';
import { Bot, MessageSquareText, Send, X } from 'lucide-react';
import { contractProfile } from '../../data/contractProfile';
import { availablePaymentSecurity, billingCycles, currentInvoiceBreakdown, currentUnbilledCycle } from '../../data/billsPayments';
import { takeOrPayQuota } from '../../data/mgoFlowAnalysis';

function parseNumber(value) {
  const match = String(value).match(/[\d.]+/);
  return match ? Number(match[0]) : 0;
}

function round2(value) {
  return Math.round(value * 100) / 100;
}

function formatCurrency(value) {
  return `₹${Math.round(value).toLocaleString('en-IN')}`;
}

const contractDcq = parseNumber(contractProfile.terms.dcq);
const contractMdcq = parseNumber(contractProfile.terms.mdcq);
const minimumObligation = round2((contractDcq * parseNumber(contractProfile.terms.mgo)) / 100);
const allowanceRemaining = takeOrPayQuota.annualQuotaDays - takeOrPayQuota.usedDaysYTD;

const invoiceRows = currentInvoiceBreakdown.rows.map((row) => ({ ...row, quantity: parseNumber(row.qty) }));
const currentExcessRow = invoiceRows.find((row) => String(row.label).toLowerCase().includes('excess')) || invoiceRows[invoiceRows.length - 1];

const latestCycle = billingCycles[billingCycles.length - 1];
/* Forecast basis matches Persona Dashboard's Finance view: historical average across all recorded cycles + 2% trend factor */
const billingAverage = round2(billingCycles.reduce((total, cycle) => total + cycle.invoiced, 0) / billingCycles.length);
const projectedNextCycle = round2(billingAverage * 1.02);

const quickPrompts = [
  'Why is my bill higher than expected?',
  'Will I miss the minimum off-take obligation?',
  'How can I reduce excess slab charges?',
  'What is the next billing cycle forecast?',
];

function generateAssistantReply(message) {
  const normalized = message.toLowerCase();

  if (normalized.includes('bill') && (normalized.includes('higher') || normalized.includes('why') || normalized.includes('increase') || normalized.includes('spike'))) {
    return `The latest bill is elevated because the invoice mix includes ${currentExcessRow.quantity.toLocaleString('en-IN')} MMBTU in the Excess slab, which adds ${formatCurrency(currentExcessRow.amount)} to the total. The fastest way to reduce the next cycle is to flatten peak draw days, keep daily usage below ${contractMdcq} MMBTU where possible, and pull more volume into the MGO band.`;
  }

  if (normalized.includes('minimum') || normalized.includes('off-take') || normalized.includes('offtake') || normalized.includes('take-or-pay') || normalized.includes('penalt') || normalized.includes('shutdown') || normalized.includes('maintenance')) {
    return `Your monthly protection floor is ${minimumObligation} MMBTU/day, based on 90% of the ${contractDcq} MMBTU DCQ. You still have ${allowanceRemaining} shutdown/maintenance days left this year. If a low-load period is coming, place it inside those allowance days so the average draw stays protected and take-or-pay penalties are avoided.`;
  }

  if (normalized.includes('forecast') || normalized.includes('next bill') || normalized.includes('upcoming cycle') || normalized.includes('future bill')) {
    return `Based on the recent fortnights, the next billing cycle is projected near ${formatCurrency(projectedNextCycle)}. That forecast assumes the current draw pattern continues. If peak days are shaved below ${contractMdcq} MMBTU, the actual bill should move down further.`;
  }

  if (normalized.includes('contract') || normalized.includes('dcq') || normalized.includes('mdcq') || normalized.includes('rate')) {
    return `The contract is currently active with a DCQ of ${contractDcq} MMBTU and an MDCQ of ${contractMdcq} MMBTU. The latest invoice is split across MGO, Non-MGO, and Excess slabs; the assistant can explain the commercial effect of each clause, the load-shaping options, and the settlement impact.`;
  }

  return `I can help interpret the contract, bill spikes, off-take risk, and forecasted spend. For example, ask why the bill is higher, how to avoid Excess slab charges, or how to use shutdown allowance days to protect the minimum monthly average.`;
}

/* Floating bottom-right chat launcher - keeps the AI assistant out of the main report layout until requested */
function FloatingContractAssistant() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: `I am the AI Contract Assistant for ${contractProfile.company.name}. Ask me about the bill, contract terms, off-take risk, or how to optimize the daily draw pattern.`,
    },
  ]);
  const [draft, setDraft] = useState('');

  const sendMessage = (text) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    setMessages((current) => [
      ...current,
      { role: 'user', text: trimmed },
      { role: 'assistant', text: generateAssistantReply(trimmed) },
    ]);
    setDraft('');
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        aria-label={open ? 'Close AI Contract Assistant' : 'Open AI Contract Assistant'}
        className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-600 text-white shadow-lg transition hover:bg-emerald-700"
      >
        {open ? <X className="h-5.5 w-5.5" aria-hidden="true" /> : <Bot className="h-6 w-6" aria-hidden="true" />}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="AI Contract Assistant"
          className="fixed bottom-24 right-4 z-40 flex max-h-[75vh] w-[calc(100vw-2rem)] max-w-[380px] flex-col overflow-hidden rounded-2xl border border-emerald-200 bg-white shadow-2xl sm:right-6"
        >
          <div className="flex items-start justify-between gap-3 border-b border-slate-100 p-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-600">Chat Assistance</p>
              <h3 className="mt-1 text-base font-semibold text-slate-900">AI Contract Assistant</h3>
              <p className="mt-1 text-xs text-slate-500">Grounded in contract terms, usage behaviour, and billing history.</p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close assistant"
              className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 border-b border-slate-100 p-3">
            <div className="rounded-xl bg-slate-50 p-2.5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">Latest bill</p>
              <p className="mt-0.5 text-sm font-semibold text-slate-900">{formatCurrency(latestCycle.invoiced)}</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-2.5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">Maintenance days left</p>
              <p className="mt-0.5 text-sm font-semibold text-slate-900">{allowanceRemaining} days</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-2.5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">Security cover</p>
              <p className="mt-0.5 text-sm font-semibold text-slate-900">{formatCurrency(availablePaymentSecurity)}</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-2.5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">Usage to date</p>
              <p className="mt-0.5 text-sm font-semibold text-slate-900">{currentUnbilledCycle.usageToDate.toLocaleString('en-IN')}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5 border-b border-slate-100 p-3">
            {quickPrompts.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => sendMessage(prompt)}
                className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-600 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700"
              >
                {prompt}
              </button>
            ))}
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto bg-slate-50 p-3">
            {messages.map((message, index) => (
              <div key={`${message.role}-${index}`} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[88%] rounded-2xl px-3 py-2 text-sm leading-6 ${message.role === 'user' ? 'bg-emerald-600 text-white' : 'bg-white text-slate-700 shadow-sm ring-1 ring-slate-200'}`}>
                  {message.text}
                </div>
              </div>
            ))}
          </div>

          <form
            className="flex items-center gap-2 border-t border-slate-100 p-3"
            onSubmit={(event) => {
              event.preventDefault();
              sendMessage(draft);
            }}
          >
            <div className="relative flex-1">
              <MessageSquareText className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
              <input
                type="text"
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder="Ask about billing, contract terms..."
                className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
              />
            </div>
            <button
              type="submit"
              aria-label="Send message"
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white transition hover:bg-emerald-700"
            >
              <Send className="h-4 w-4" aria-hidden="true" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}

export default FloatingContractAssistant;
