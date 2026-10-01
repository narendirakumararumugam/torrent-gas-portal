export const reportTemplates = [
  {
    reportId: 'COM-CONSUMPTION',
    type: 'consumption_timeseries',
    name: 'Consumption Time-Series',
    description: 'Daily and monthly consumption trends for commercial meters.',
    audience: 'customer',
    category: 'Consumption',
    createdBy: 'System',
    params: { granularity: 'daily', meters: ['CMTR-1'], compareTo: 'previous_period' },
    scheduledCron: null,
    lastRun: '2026-09-30T06:00:00Z',
  },
  {
    reportId: 'COM-FLAT-RATE',
    type: 'flat_rate_billing',
    name: 'Flat Rate Billing Summary',
    description: 'Second-fortnight commercial bill totals at a single flat tariff rate.',
    audience: 'customer',
    category: 'Billing',
    createdBy: 'System',
    params: { from: '2026-09-16', to: '2026-09-30' },
    scheduledCron: null,
    lastRun: '2026-09-30T06:00:00Z',
  },
  {
    reportId: 'COM-DEMAND',
    type: 'mgo_flowrate',
    name: 'Demand & Peak Flow',
    description: 'Commercial load tracking, peak-hour demand, and flow alerts.',
    audience: 'customer',
    category: 'Operational',
    createdBy: 'System',
    params: { from: '2026-09-16', to: '2026-09-30' },
    scheduledCron: null,
    lastRun: '2026-09-30T06:00:00Z',
  },
];

export const reportRunHistory = {
  'COM-FLAT-RATE': [
    { runAt: '2026-09-30T06:00:00Z', status: 'success', recipients: ['finance@seabreezehotel.in'] },
  ],
  'COM-DEMAND': [
    { runAt: '2026-09-30T06:00:00Z', status: 'success', recipients: ['ops@seabreezehotel.in'] },
  ],
};