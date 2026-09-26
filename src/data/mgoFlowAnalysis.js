/* Contract-derived thresholds for WHEELS INDIA LIMITED (THERVOYKANDIGAI), mirrors contractProfile.terms */
export const DCQ_MMBTU = 300;
export const MGO_PERCENT = 0.9;
export const MIN_OBLIGATION_MMBTU = Math.round(DCQ_MMBTU * MGO_PERCENT * 100) / 100; // 270
export const MAX_FLOW_RATE_SCMH = 368;

export const BILLING_CYCLE = { from: '2026-08-01', to: '2026-08-10' };

/* Canonical demo dataset for the current billing cycle - daily consumption (MMBTU) and peak flow rate (SCM/hr).
   Aug 3 & Aug 6 are flagged non-operational (planned shutdown/maintenance, low draw). Aug 7 is a peak day
   that also breaches the 368 SCM/hr flow-rate limit. Aug 10 is "today". */
export const dailyConsumption = [
  { date: '2026-08-01', mmbtu: 300.0, flowRateScmHr: 292.5, nonOperational: false },
  { date: '2026-08-02', mmbtu: 300.0, flowRateScmHr: 295.0, nonOperational: false },
  { date: '2026-08-03', mmbtu: 55.0, flowRateScmHr: 60.4, nonOperational: true },
  { date: '2026-08-04', mmbtu: 300.0, flowRateScmHr: 301.8, nonOperational: false },
  { date: '2026-08-05', mmbtu: 300.0, flowRateScmHr: 289.6, nonOperational: false },
  { date: '2026-08-06', mmbtu: 45.0, flowRateScmHr: 48.2, nonOperational: true },
  { date: '2026-08-07', mmbtu: 450.8, flowRateScmHr: 580.2, nonOperational: false },
  { date: '2026-08-08', mmbtu: 300.0, flowRateScmHr: 298.0, nonOperational: false },
  { date: '2026-08-09', mmbtu: 300.0, flowRateScmHr: 293.4, nonOperational: false },
  { date: '2026-08-10', mmbtu: 280.0, flowRateScmHr: 310.5, nonOperational: false },
];

/* Annual shut-down / maintenance day allowance under the supply contract, usable to exclude low-draw days from the Take-or-Pay average */
export const takeOrPayQuota = {
  annualQuotaDays: 15,
  usedDaysYTD: 3,
};
