/* Price-slab segregation tiers for daily industrial consumption (MMBTU/day thresholds) */
export const SLAB_TIERS = [
  { key: 'mgo', label: 'MGO Slab', range: '≤ 300 MMBTU/day', tariffLabel: 'Standard Tariff Rate' },
  { key: 'nonMgo', label: 'Non-MGO Slab', range: '300 - 500 MMBTU/day', tariffLabel: 'Secondary Rate Tier' },
  { key: 'excess', label: 'Excess Slab', range: '> 500 MMBTU/day', tariffLabel: 'Exceeding MDCQ Cap' },
];

export const BILLING_CYCLE = { from: '2026-08-01', to: '2026-08-10' };

/* Canonical daily slab segregation for the demo billing cycle (MMBTU). Aug 10 is a peak draw day that
   spills over into the Non-MGO and Excess tiers; all other days stay within the MGO slab. */
export const dailySlabDistribution = [
  { date: '2026-08-01', mgo: 224.0, nonMgo: 0, excess: 0 },
  { date: '2026-08-02', mgo: 226.5, nonMgo: 0, excess: 0 },
  { date: '2026-08-03', mgo: 228.75, nonMgo: 0, excess: 0 },
  { date: '2026-08-04', mgo: 230.0, nonMgo: 0, excess: 0 },
  { date: '2026-08-05', mgo: 225.25, nonMgo: 0, excess: 0 },
  { date: '2026-08-06', mgo: 227.5, nonMgo: 0, excess: 0 },
  { date: '2026-08-07', mgo: 229.0, nonMgo: 0, excess: 0 },
  { date: '2026-08-08', mgo: 226.0, nonMgo: 0, excess: 0 },
  { date: '2026-08-09', mgo: 223.0, nonMgo: 0, excess: 0 },
  { date: '2026-08-10', mgo: 220.0, nonMgo: 350.75, excess: 20.1 },
];
