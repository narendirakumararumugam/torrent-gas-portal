/*
 * Report metadata schema:
 * { reportId, type, name, description, audience: 'customer'|'corporate'|'both',
 *   category, createdBy, params, scheduledCron, lastRun }
 */
export const reportTemplates = [
  {
    reportId: 'RPT-CONSUMPTION',
    type: 'consumption_timeseries',
    name: 'Consumption Time-Series',
    description: 'Hourly, daily, or monthly consumption trends per meter.',
    audience: 'both',
    category: 'Consumption',
    createdBy: 'System',
    params: { granularity: 'daily', meters: ['MTR-1'], compareTo: 'previous_period' },
    scheduledCron: null,
    lastRun: '2026-09-22T06:00:00Z',
  },
  {
    reportId: 'RPT-PRICE-SLAB',
    type: 'price_slab',
    name: 'Consumption Analysis - Price Slab',
    description: 'Daily MGO / Non-MGO / Excess slab segregation for billing.',
    audience: 'both',
    category: 'Tariff',
    createdBy: 'System',
    params: { from: '2026-08-01', to: '2026-08-10' },
    scheduledCron: null,
    lastRun: '2026-09-20T06:00:00Z',
  },
  {
    reportId: 'RPT-MGO-FLOW',
    type: 'mgo_flowrate',
    name: 'Consumption Analysis - MGO & Flow Rate',
    description: 'Take-or-Pay efficiency, DCQ tracking, and peak flow-rate alerts.',
    audience: 'both',
    category: 'Operational',
    createdBy: 'System',
    params: { from: '2026-08-01', to: '2026-08-10' },
    scheduledCron: '0 6 * * 1',
    lastRun: '2026-09-21T06:00:00Z',
  },
  {
    reportId: 'RPT-PRODUCTION',
    type: 'production_analysis',
    name: 'Production Analysis',
    description: 'Replay last month’s draw profile against current slab rates to forecast the next bill.',
    audience: 'customer',
    category: 'Forecasting',
    createdBy: 'System',
    params: { from: '2026-08-01', to: '2026-08-31', simulationMode: 'historical', balanceStrength: 45 },
    scheduledCron: null,
    lastRun: '2026-09-23T06:00:00Z',
  },
  {
    reportId: 'RPT-HYDRAULIC',
    type: 'hydraulic_feasibility',
    name: 'Hydraulic Feasibility Summary',
    description: 'Distance, recommended diameter, and feasibility verdict across sites.',
    audience: 'corporate',
    category: 'Engineering',
    createdBy: 'R. Saha',
    params: {},
    scheduledCron: null,
    lastRun: '2026-09-10T06:00:00Z',
  },
];

export const reportRunHistory = {
  'RPT-MGO-FLOW': [
    { runAt: '2026-09-21T06:00:00Z', status: 'success', recipients: ['ops.desk@cngportal.example'] },
    { runAt: '2026-09-14T06:00:00Z', status: 'success', recipients: ['ops.desk@cngportal.example'] },
  ],
};
