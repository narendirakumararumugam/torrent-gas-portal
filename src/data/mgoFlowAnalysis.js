/* Contract-derived thresholds for WHEELS INDIA LIMITED (THERVOYKANDIGAI), mirrors contractProfile.terms */
export const DCQ_MMBTU = 300;
export const MGO_PERCENT = 0.9;
export const MIN_OBLIGATION_MMBTU = Math.round(DCQ_MMBTU * MGO_PERCENT * 100) / 100; // 270
export const MAX_FLOW_RATE_SCMH = 368;

export const BILLING_CYCLE = { from: '2026-09-16', to: '2026-09-30' };

/* Canonical dataset for the September 2nd fortnight billing cycle - daily consumption (MMBTU) and average
  hourly draw proxy (SCM/hr). One late-September day spikes above the excess threshold so the current bill
  carries a realistic excess slab. */
export const dailyConsumption = [
  { date: '2026-09-16', mmbtu: 291.028, flowRateScmHr: 322.3, nonOperational: false },
  { date: '2026-09-17', mmbtu: 205.623, flowRateScmHr: 227.6, nonOperational: false },
  { date: '2026-09-18', mmbtu: 181.026, flowRateScmHr: 200.3, nonOperational: false },
  { date: '2026-09-19', mmbtu: 171.892, flowRateScmHr: 190.4, nonOperational: false },
  { date: '2026-09-20', mmbtu: 232.847, flowRateScmHr: 258.0, nonOperational: false },
  { date: '2026-09-21', mmbtu: 249.425, flowRateScmHr: 276.5, nonOperational: false },
  { date: '2026-09-22', mmbtu: 260.666, flowRateScmHr: 288.8, nonOperational: false },
  { date: '2026-09-23', mmbtu: 225.597, flowRateScmHr: 249.8, nonOperational: false },
  { date: '2026-09-24', mmbtu: 323.959, flowRateScmHr: 358.7, nonOperational: false },
  { date: '2026-09-25', mmbtu: 216.925, flowRateScmHr: 241.9, nonOperational: false },
  { date: '2026-09-26', mmbtu: 518.756, flowRateScmHr: 606.4, nonOperational: false },
  { date: '2026-09-27', mmbtu: 271.863, flowRateScmHr: 308.7, nonOperational: false },
  { date: '2026-09-28', mmbtu: 289.437, flowRateScmHr: 328.6, nonOperational: false },
  { date: '2026-09-29', mmbtu: 250.505, flowRateScmHr: 284.5, nonOperational: false },
  { date: '2026-09-30', mmbtu: 121.15, flowRateScmHr: 137.7, nonOperational: false },
  { date: '2026-10-01', mmbtu: 291.028, flowRateScmHr: 322.3, nonOperational: false },
  { date: '2026-10-02', mmbtu: 205.623, flowRateScmHr: 227.6, nonOperational: false },
  { date: '2026-10-03', mmbtu: 181.026, flowRateScmHr: 200.3, nonOperational: false },
  { date: '2026-10-04', mmbtu: 171.892, flowRateScmHr: 190.4, nonOperational: false },
  { date: '2026-10-05', mmbtu: 232.847, flowRateScmHr: 258.0, nonOperational: false },
  { date: '2026-10-06', mmbtu: 249.425, flowRateScmHr: 276.5, nonOperational: false },
  { date: '2026-10-07', mmbtu: 260.666, flowRateScmHr: 288.8, nonOperational: false },
  { date: '2026-10-08', mmbtu: 225.597, flowRateScmHr: 249.8, nonOperational: false },
];

export const billingConsumptionTableRows = [
  { date: '01/10/26', totalQtyScm: 7734.88, gcv: 9481.611, totalMmbtu: 291.028, mgoQty: 264.0, nonMgoQty: 27.028, excessQty: 0 },
  { date: '02/10/26', totalQtyScm: 5463.48, gcv: 9484.268, totalMmbtu: 205.623, mgoQty: 205.623, nonMgoQty: 0, excessQty: 0 },
  { date: '03/10/26', totalQtyScm: 4806.52, gcv: 9490.954, totalMmbtu: 181.026, mgoQty: 181.026, nonMgoQty: 0, excessQty: 0 },
  { date: '04/10/26', totalQtyScm: 4569.73, gcv: 9479.068, totalMmbtu: 171.892, mgoQty: 171.892, nonMgoQty: 0, excessQty: 0 },
  { date: '05/10/26', totalQtyScm: 6192.78, gcv: 9475.143, totalMmbtu: 232.847, mgoQty: 232.847, nonMgoQty: 0, excessQty: 0 },
  { date: '06/10/26', totalQtyScm: 6635.42, gcv: 9472.671, totalMmbtu: 249.425, mgoQty: 249.425, nonMgoQty: 0, excessQty: 0 },
  { date: '07/10/26', totalQtyScm: 6932.15, gcv: 9475.806, totalMmbtu: 260.666, mgoQty: 260.666, nonMgoQty: 0, excessQty: 0 },
  { date: '08/10/26', totalQtyScm: 5996.02, gcv: 9481.373, totalMmbtu: 225.597, mgoQty: 225.597, nonMgoQty: 0, excessQty: 0 },
];

/* Annual shut-down / maintenance day allowance under the supply contract, usable to exclude low-draw days from the Take-or-Pay average */
export const takeOrPayQuota = {
  annualQuotaDays: 15,
  usedDaysYTD: 3,
};
