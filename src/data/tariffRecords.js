/* Historical tariff records: pricePerUnit (INR/SCM) by slab, keyed by effectiveDate */
export const tariffRecords = [
  { effectiveDate: '2025-04-01', slab: 'MGO', pricePerUnit: 43.1 },
  { effectiveDate: '2025-04-01', slab: 'Non-MGO', pricePerUnit: 46.25 },
  { effectiveDate: '2025-04-01', slab: 'Excess', pricePerUnit: 51.8 },
  { effectiveDate: '2026-04-01', slab: 'MGO', pricePerUnit: 45.6 },
  { effectiveDate: '2026-04-01', slab: 'Non-MGO', pricePerUnit: 48.9 },
  { effectiveDate: '2026-04-01', slab: 'Excess', pricePerUnit: 54.75 },
];

export function tariffRateFor(slab, dateISO) {
  const applicable = tariffRecords.filter((rec) => rec.slab === slab && rec.effectiveDate <= dateISO).sort((a, b) => (a.effectiveDate < b.effectiveDate ? 1 : -1));
  return applicable[0]?.pricePerUnit ?? 0;
}
