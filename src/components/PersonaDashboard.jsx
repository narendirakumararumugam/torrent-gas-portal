import React, { useEffect, useRef, useState } from 'react';
import { AlertTriangle, Info, ShieldCheck } from 'lucide-react';
import Card from './common/Card';
import PersonaBasedDashboards from './reports/PersonaBasedDashboards';
import FloatingContractAssistant from './reports/FloatingContractAssistant';
import { getExposureSummary } from '../utils/billingEngine';
import { contractProfile } from '../data/contractProfile';
import { complaintTickets } from '../data/complaints';
import { trackerProgress } from '../data/connectionTimeline';
import { serviceRequestTickets } from '../data/serviceRequests';
import { BILLING_REFERENCE_DATE, availablePaymentSecurity, billingCycles, currentInvoiceBreakdown, currentUnbilledCycle } from '../data/billsPayments';
import { DCQ_MMBTU, dailyConsumption, MIN_OBLIGATION_MMBTU } from '../data/mgoFlowAnalysis';

const CONTRACT_HEALTH_WEIGHTS = {
  paymentStanding: 15,
  onTimePayments: 10,
  mgoCompliance: 15,
  excessExposure: 10,
  dcqUtilization: 10,
  securityDeposit: 10,
  tenureRenewal: 5,
  complaints: 10,
  hseCompliance: 10,
  operationalPredictability: 5,
};

function clamp(value, min = 0, max = 100) {
  return Math.min(max, Math.max(min, value));
}

function roundToOneDecimal(value) {
  return Math.round(value * 10) / 10;
}

function daysBetweenISO(fromISO, toISO) {
  return Math.round((new Date(`${toISO}T00:00:00Z`) - new Date(`${fromISO}T00:00:00Z`)) / 86400000);
}

function parseDisplayDate(dateText) {
  const match = String(dateText).match(/^(\d{1,2})\s+([A-Za-z]{3})\s+(\d{4})$/);
  if (!match) return new Date(dateText);
  const [, day, monthText, year] = match;
  const monthIndex = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].indexOf(monthText);
  return new Date(Date.UTC(Number(year), monthIndex, Number(day)));
}

function buildScoreFactor(label, score, weight, detail) {
  return {
    label,
    score: roundToOneDecimal(clamp(score)),
    weight,
    detail,
  };
}

function buildContractHealthAssessment() {
  const latestCycle = billingCycles[billingCycles.length - 1];
  const invoiceTotal = currentInvoiceBreakdown.rows.reduce((total, row) => total + row.amount, 0);
  const currentExcessRow = currentInvoiceBreakdown.rows.find((row) => String(row.label).toLowerCase().includes('excess')) || currentInvoiceBreakdown.rows[currentInvoiceBreakdown.rows.length - 1];
  const excessShare = invoiceTotal ? (currentExcessRow.amount / invoiceTotal) * 100 : 0;

  const exposure = getExposureSummary({ lastCycle: latestCycle, unbilledCycle: currentUnbilledCycle, availableSecurity: availablePaymentSecurity });
  const averageConsumption = dailyConsumption.reduce((total, day) => total + day.mmbtu, 0) / Math.max(dailyConsumption.length, 1);
  const utilisationRatio = DCQ_MMBTU ? (averageConsumption / DCQ_MMBTU) * 100 : 0;
  const overdrawDays = dailyConsumption.filter((day) => day.mmbtu > DCQ_MMBTU * 1.1).length;

  const outstandingCycles = billingCycles.map((cycle) => {
    const outstanding = Math.max(0, cycle.invoiced - cycle.paid);
    const overdueDays = outstanding > 0 ? Math.max(0, daysBetweenISO(cycle.dueDate, BILLING_REFERENCE_DATE)) : 0;
    return { ...cycle, outstanding, overdueDays };
  });

  const openBalanceCycles = outstandingCycles.filter((cycle) => cycle.outstanding > 0);
  const overdueBalanceCycles = openBalanceCycles.filter((cycle) => cycle.overdueDays > 0);
  const maxOverdueDays = overdueBalanceCycles.length ? Math.max(...overdueBalanceCycles.map((cycle) => cycle.overdueDays)) : 0;
  const settledOnTime = billingCycles.filter((cycle) => cycle.paid >= cycle.invoiced && parseDisplayDate(cycle.paidDate) <= parseDisplayDate(cycle.dueDate)).length;
  const onTimeRate = billingCycles.length ? (settledOnTime / billingCycles.length) * 100 : 0;

  const mgoComplianceScore = clamp((averageConsumption / MIN_OBLIGATION_MMBTU) * 100);

  const excessExposureScore = (() => {
    const exposureScore = excessShare <= 5 ? 100 : excessShare <= 10 ? 50 : 0;
    const frequencyScore = overdrawDays === 0 ? 100 : overdrawDays <= 2 ? 50 : 0;
    return (exposureScore + frequencyScore) / 2;
  })();

  const dcqUtilizationScore = (() => {
    if (utilisationRatio >= 85 && utilisationRatio <= 105) return 100;
    if (utilisationRatio < 50 || utilisationRatio > 120) return 0;
    if (utilisationRatio < 85) return (utilisationRatio / 85) * 100;
    return ((120 - utilisationRatio) / 15) * 100;
  })();

  const securityCoverageRatio = exposure.totalOutstanding ? (availablePaymentSecurity / exposure.totalOutstanding) * 100 : 100;
  const securityDepositScore = (() => {
    if (securityCoverageRatio >= 100) return 100;
    if (securityCoverageRatio >= 80) return 70;
    if (securityCoverageRatio >= 50) return 30;
    return 0;
  })();

  const contractTenureScore = contractProfile.status === 'active' ? 100 : 0;

  const unresolvedComplaints = complaintTickets.filter((ticket) => ticket.status !== 'resolved');
  const unresolvedServiceRequests = serviceRequestTickets.filter((ticket) => ticket.status !== 'resolved');
  const hasHighSeverityDispute = unresolvedComplaints.some((ticket) => String(ticket.priority).toLowerCase() === 'high');
  const complaintsScore = hasHighSeverityDispute ? 0 : unresolvedComplaints.length + unresolvedServiceRequests.length > 0 ? 50 : 100;

  const hseComplianceScore = trackerProgress >= 80 ? 100 : trackerProgress >= 60 ? 70 : 40;

  const predictabilityVolatility = dailyConsumption.reduce((total, day) => total + Math.abs(day.mmbtu - DCQ_MMBTU), 0) / Math.max(dailyConsumption.length, 1);
  const operationalPredictabilityScore = clamp(100 - (predictabilityVolatility / DCQ_MMBTU) * 100 - dailyConsumption.filter((day) => day.nonOperational).length * 5);

  const factors = [
    buildScoreFactor(
      'Payment Standing & Aging',
      overdueBalanceCycles.length ? (maxOverdueDays > 30 ? 0 : 50) : 100,
      CONTRACT_HEALTH_WEIGHTS.paymentStanding,
      openBalanceCycles.length
        ? overdueBalanceCycles.length
          ? `${openBalanceCycles.length} cycle(s) are open; ${overdueBalanceCycles.length} are overdue and the worst item is ${maxOverdueDays} day(s) late with ₹${Math.round(Math.max(...overdueBalanceCycles.map((cycle) => cycle.outstanding))).toLocaleString('en-IN')} outstanding.`
          : `${openBalanceCycles.length} cycle(s) are open, but none are overdue yet.`
        : 'No overdue balance is outstanding on the billing ledger.',
    ),
    buildScoreFactor(
      'On-Time Payment Track Record',
      onTimeRate,
      CONTRACT_HEALTH_WEIGHTS.onTimePayments,
      `${settledOnTime} of ${billingCycles.length} billed cycles were fully paid on or before the due date.`,
    ),
    buildScoreFactor(
      'Minimum Guaranteed Offtake (MGO) Compliance',
      mgoComplianceScore,
      CONTRACT_HEALTH_WEIGHTS.mgoCompliance,
      `Average intake is ${roundToOneDecimal(averageConsumption)} MMBTU/day against the ${MIN_OBLIGATION_MMBTU} MMBTU minimum obligation.`,
    ),
    buildScoreFactor(
      'Excess Slab Exposure & Overdraw Frequency',
      roundToOneDecimal(excessExposureScore),
      CONTRACT_HEALTH_WEIGHTS.excessExposure,
      `${roundToOneDecimal(excessShare)}% of the current invoice is in excess slab and ${overdrawDays} day(s) exceeded the 110% DCQ tolerance.`,
    ),
    buildScoreFactor(
      'DCQ Utilization Ratio',
      dcqUtilizationScore,
      CONTRACT_HEALTH_WEIGHTS.dcqUtilization,
      `Average utilization is ${roundToOneDecimal(utilisationRatio)}% of DCQ.`,
    ),
    buildScoreFactor(
      'Security Deposit Adequacy',
      securityDepositScore,
      CONTRACT_HEALTH_WEIGHTS.securityDeposit,
      `Available security covers ${roundToOneDecimal(securityCoverageRatio)}% of current exposure; deficit is ₹${Math.round(exposure.deficit).toLocaleString('en-IN')}.`,
    ),
    buildScoreFactor(
      'Contract Tenure & Renewal Proximity',
      contractTenureScore,
      CONTRACT_HEALTH_WEIGHTS.tenureRenewal,
      'Contract status is active and no expiry or holdover date is listed in the current dataset.',
    ),
    buildScoreFactor(
      'Complaint & Dispute History',
      complaintsScore,
      CONTRACT_HEALTH_WEIGHTS.complaints,
      `${unresolvedComplaints.length} complaint(s) and ${unresolvedServiceRequests.length} service request(s) remain open or in progress.`,
    ),
    buildScoreFactor(
      'HSE Compliance',
      hseComplianceScore,
      CONTRACT_HEALTH_WEIGHTS.hseCompliance,
      `Connection tracker progress is ${trackerProgress}% with no safety violation recorded in the available data.`,
    ),
    buildScoreFactor(
      'Operational Predictability',
      operationalPredictabilityScore,
      CONTRACT_HEALTH_WEIGHTS.operationalPredictability,
      `${dailyConsumption.filter((day) => day.nonOperational).length} planned non-operational day(s) and moderate day-to-day variance were observed in the tracked window.`,
    ),
  ];

  const totalScore = factors.reduce((total, factor) => total + (factor.score * factor.weight) / 100, 0);

  return {
    score: Math.round(clamp(totalScore)),
    factors: factors.map((factor) => ({
      ...factor,
      points: roundToOneDecimal((factor.score * factor.weight) / 100),
    })),
  };
}

function buildTickerItems() {
  const latestCycle = billingCycles[billingCycles.length - 1];
  const outstanding = Math.max(latestCycle.invoiced - latestCycle.paid, 0);
  const excessAmount = currentInvoiceBreakdown.rows.find((row) => row.label.toLowerCase().includes('excess'))?.amount || 0;
  const exposure = getExposureSummary({ lastCycle: latestCycle, unbilledCycle: currentUnbilledCycle, availableSecurity: availablePaymentSecurity });
  const averageConsumption = dailyConsumption.reduce((total, day) => total + day.mmbtu, 0) / dailyConsumption.length;
  const mgoShortfall = Math.max(0, MIN_OBLIGATION_MMBTU - averageConsumption);

  return [
    `Critical alert: security shortfall of ₹${Math.round(exposure.deficit).toLocaleString('en-IN')} remains against the available payment security.`,
    `Critical alert: MGO obligation shortfall is ${mgoShortfall.toFixed(1)} MMBTU/day below the ${MIN_OBLIGATION_MMBTU} MMBTU minimum average.`,
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
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-xs font-semibold text-slate-700">{factor.score}/100</p>
                  <p className="mt-0.5 text-[11px] leading-4 text-slate-400">{factor.weight}% weight</p>
                </div>
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
  const contractHealthAssessment = buildContractHealthAssessment();
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
        score={contractHealthAssessment.score}
        tone={contractHealthAssessment.score >= 80 ? 'text-emerald-700' : contractHealthAssessment.score >= 65 ? 'text-amber-700' : 'text-rose-600'}
        factors={contractHealthAssessment.factors}
      />

      <PersonaBasedDashboards audience={audience} />
      <FloatingContractAssistant />
    </div>
  );
}

export default PersonaDashboard;
