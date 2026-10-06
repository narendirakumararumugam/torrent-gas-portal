import React, { useEffect, useRef, useState } from 'react';
import { AlertTriangle, Info, ShieldCheck } from 'lucide-react';
import Card from './common/Card';
import PersonaBasedDashboards from './reports/PersonaBasedDashboards';
import FloatingContractAssistant from './reports/FloatingContractAssistant';
import { contractProfile } from '../data/contractProfile';
import { availablePaymentSecurity, billingCycles, currentInvoiceBreakdown } from '../data/billsPayments';
import { takeOrPayQuota } from '../data/mgoFlowAnalysis';

function buildTickerItems() {
  const latestCycle = billingCycles[billingCycles.length - 1];
  const outstanding = Math.max(latestCycle.invoiced - latestCycle.paid, 0);
  const excessAmount = currentInvoiceBreakdown.rows.find((row) => row.label.toLowerCase().includes('excess'))?.amount || 0;

  return [
    `Critical alert: ${latestCycle.label} has ₹${outstanding.toLocaleString('en-IN')} outstanding against the latest bill.`,
    `Important update: ${contractProfile.company.name} contract ${contractProfile.contractNumber} is active and under executive review.`,
    `Operational watch: excess slab exposure is ₹${Math.round(excessAmount).toLocaleString('en-IN')} for the current billing cycle.`,
  ];
}

function parseNumber(value) {
  const match = String(value).match(/[\d.]+/);
  return match ? Number(match[0]) : 0;
}

function ContractHealthCard({ score, tone, factors }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const handleClick = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) setOpen(false);
    };
    const handleKey = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open]);

  return (
    <div className="relative" ref={containerRef}>
      <Card className="p-5 shadow-sm">
        <button
          type="button"
          onClick={() => setOpen((current) => !current)}
          aria-expanded={open}
          aria-haspopup="dialog"
          className="w-full text-left"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Contract Health</p>
              <p className={`mt-2 text-3xl font-semibold ${tone}`}>{score}/100</p>
            </div>
            <ShieldCheck className="h-5 w-5 text-emerald-700" aria-hidden="true" />
          </div>
          <p className="mt-2 flex items-center gap-1 text-xs leading-5 text-slate-500">
            Hover or click to view the score breakdown.
            <Info className="h-3 w-3 shrink-0 text-slate-400" aria-hidden="true" />
          </p>
        </button>
      </Card>

      {open && (
        <div role="dialog" aria-label="Contract health breakdown" className="absolute left-0 top-full z-20 mt-2 w-80 max-w-[90vw] rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Score breakdown</p>
          <div className="mt-2 space-y-2">
            {factors.map((factor) => (
              <div key={factor.label} className="flex items-start justify-between gap-3 rounded-lg border border-slate-100 p-2.5">
                <div>
                  <p className="text-xs font-semibold text-slate-800">{factor.label}</p>
                  <p className="mt-0.5 text-[11px] leading-4 text-slate-500">{factor.detail}</p>
                </div>
                <span className={`shrink-0 text-xs font-semibold ${factor.delta > 0 ? 'text-emerald-600' : factor.delta < 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                  {factor.delta > 0 ? '+' : ''}{factor.delta}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2 text-sm font-semibold text-slate-900">
            <span>Total score</span>
            <span>{score}/100</span>
          </div>
        </div>
      )}
    </div>
  );
}

/* Top-level page for the persona-specific (Operations/Finance/Management) dashboards, split out of Reports Hub */
function PersonaDashboard({ audience = 'customer' }) {
  const latestCycle = billingCycles[billingCycles.length - 1];
  const invoiceTotal = currentInvoiceBreakdown.rows.reduce((total, row) => total + row.amount, 0);
  const currentExcessRow = currentInvoiceBreakdown.rows.find((row) => String(row.label).toLowerCase().includes('excess')) || currentInvoiceBreakdown.rows[currentInvoiceBreakdown.rows.length - 1];
  const excessShare = invoiceTotal ? Math.round((currentExcessRow.amount / invoiceTotal) * 100) : 0;
  const securityCoverPercent = latestCycle.invoiced ? Math.round((availablePaymentSecurity / latestCycle.invoiced) * 1000) / 10 : 0;
  const allowanceRemaining = takeOrPayQuota.annualQuotaDays - takeOrPayQuota.usedDaysYTD;
  const healthFactors = [
    { label: 'Baseline score', delta: 100, detail: 'Starting executive health baseline.' },
    {
      label: 'Payment standing',
      delta: latestCycle.paid === 0 ? -12 : 0,
      detail: latestCycle.paid === 0 ? 'Latest invoice is fully unpaid.' : 'Latest invoice has at least a partial payment recorded.',
    },
    {
      label: 'Excess slab exposure',
      delta: excessShare > 5 ? -8 : 0,
      detail: `Excess slab is ${excessShare}% of the current invoice${excessShare > 5 ? ' (above the 5% threshold)' : ' (within the 5% threshold)'}.`,
    },
    {
      label: 'Security cover',
      delta: securityCoverPercent < 30 ? -10 : 0,
      detail: `Available security covers ${securityCoverPercent.toFixed(1)}% of the latest bill${securityCoverPercent < 30 ? ' (below the 30% threshold)' : ''}.`,
    },
    {
      label: 'Maintenance allowance',
      delta: allowanceRemaining > 10 ? 4 : 0,
      detail: `${allowanceRemaining} shutdown/maintenance days remain${allowanceRemaining > 10 ? ', reducing off-take risk' : ''}.`,
    },
  ];
  const contractHealthScore = Math.max(0, Math.min(100, healthFactors.reduce((total, factor) => total + factor.delta, 0)));
  const tickerItems = buildTickerItems();

  return (
    <div className="space-y-6">
      {/* Plain div instead of Card: Card's default bg-white utility can win over a later bg-slate-950 override
          in the compiled Tailwind stylesheet, which previously left this banner unreadable. */}
      <div className="overflow-hidden rounded-xl border border-amber-200 bg-slate-950 text-white shadow-sm">
        <div className="flex items-start gap-3 border-b border-white/10 px-4 py-4 sm:px-5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-400/15 text-amber-300 ring-1 ring-amber-300/30">
            <AlertTriangle className="h-5 w-5" aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-200">Critical Alerts</p>
            <div className="mt-2 overflow-hidden rounded-lg bg-white/5 ring-1 ring-white/10">
              <div className="flex whitespace-nowrap py-2 text-sm font-semibold text-amber-100 drop-shadow-[0_1px_0_rgba(0,0,0,0.45)]" style={{ animation: 'dashboard-ticker 24s linear infinite' }}>
                {[...tickerItems, ...tickerItems].map((item, index) => (
                  <span key={`${item}-${index}`} className="inline-flex items-center gap-2 px-4">
                    <span className="h-2 w-2 rounded-full bg-amber-300 shadow-[0_0_10px_rgba(253,224,71,0.7)]" aria-hidden="true" />
                    {item}
                    <span className="mx-2 text-amber-300/60">|</span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <ContractHealthCard
        score={contractHealthScore}
        tone={contractHealthScore >= 80 ? 'text-emerald-700' : contractHealthScore >= 65 ? 'text-amber-700' : 'text-rose-600'}
        factors={healthFactors}
      />

      <PersonaBasedDashboards audience={audience} />
      <FloatingContractAssistant />
    </div>
  );
}

export default PersonaDashboard;
