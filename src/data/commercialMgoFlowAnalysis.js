export const DCQ_MMBTU = 78;
export const MGO_PERCENT = 0.75;
export const MIN_OBLIGATION_MMBTU = Math.round(DCQ_MMBTU * MGO_PERCENT * 100) / 100;
export const MAX_FLOW_RATE_SCMH = 180;

export const BILLING_CYCLE = { from: '2026-09-16', to: '2026-09-30' };

export const dailyConsumption = [
  { date: '2026-09-16', mmbtu: 58.0, flowRateScmHr: 126.4, nonOperational: false },
  { date: '2026-09-17', mmbtu: 61.2, flowRateScmHr: 128.0, nonOperational: false },
  { date: '2026-09-18', mmbtu: 47.5, flowRateScmHr: 94.6, nonOperational: true },
  { date: '2026-09-19', mmbtu: 62.8, flowRateScmHr: 132.1, nonOperational: false },
  { date: '2026-09-20', mmbtu: 64.1, flowRateScmHr: 134.0, nonOperational: false },
  { date: '2026-09-21', mmbtu: 49.0, flowRateScmHr: 101.4, nonOperational: true },
  { date: '2026-09-22', mmbtu: 67.3, flowRateScmHr: 141.6, nonOperational: false },
  { date: '2026-09-23', mmbtu: 69.8, flowRateScmHr: 146.9, nonOperational: false },
  { date: '2026-09-24', mmbtu: 71.5, flowRateScmHr: 151.2, nonOperational: false },
  { date: '2026-09-25', mmbtu: 73.0, flowRateScmHr: 154.4, nonOperational: false },
  { date: '2026-09-26', mmbtu: 68.4, flowRateScmHr: 143.7, nonOperational: false },
  { date: '2026-09-27', mmbtu: 56.2, flowRateScmHr: 116.8, nonOperational: false },
  { date: '2026-09-28', mmbtu: 60.7, flowRateScmHr: 125.5, nonOperational: false },
  { date: '2026-09-29', mmbtu: 74.1, flowRateScmHr: 156.2, nonOperational: false },
  { date: '2026-09-30', mmbtu: 78.6, flowRateScmHr: 164.5, nonOperational: false },
];

export const takeOrPayQuota = {
  annualQuotaDays: 10,
  usedDaysYTD: 2,
};