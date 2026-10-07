import { contractProfile } from './contractProfile';

export const BILLING_REFERENCE_DATE = '2026-10-02';

export const billingCustomer = {
  name: 'WHEELS INDIA LIMITED',
  location: 'THERVOYKANDIGAI',
  address: contractProfile.company.address,
  gstin: '33AAACW1234B1Z8',
  contractNumber: contractProfile.contractNumber,
};

/* Issuer details printed on the tax invoice letterhead */
export const supplierProfile = {
  name: 'Torrent Gas Limited',
  tagline: 'Piped Natural Gas Distribution',
  address: 'Torrent House, Off Ashram Road, Ahmedabad, Gujarat, India - 380009',
  gstin: '24AABCT1234F1Z5',
  cin: 'U40200GJ2018PLC101234',
  email: 'billing@torrentgas.in',
  phone: '+91 79 2661 1111',
  hsnCode: '2711',
};

/* Last 5 completed/current fortnightly billing cycles, oldest first */
export const billingCycles = [
  { id: 'FN-2607-B', label: '16–31 Jul 2026', monthLabel: 'July 2026', invoicedDate: '2026-08-01', dueDate: '2026-08-09', invoiced: 5742118.52, paid: 5742118.52, paidDate: '2026-08-09' },
  { id: 'FN-2608-A', label: '01–15 Aug 2026', monthLabel: 'August 2026', invoicedDate: '2026-08-16', dueDate: '2026-08-24', invoiced: 5881445.96, paid: 5881445.96, paidDate: '2026-08-24' },
  { id: 'FN-2608-B', label: '16–31 Aug 2026', monthLabel: 'August 2026', invoicedDate: '2026-09-01', dueDate: '2026-09-09', invoiced: 6042889.34, paid: 6042889.34, paidDate: '2026-09-08' },
  { id: 'FN-2609-A', label: '01–15 Sep 2026', monthLabel: 'September 2026 ', invoicedDate: '2026-09-16', dueDate: '2026-09-24', invoiced: 6228104.66, paid: 6228104.66, paidDate: '2026-09-25' },
  { id: 'FN-2609-B', label: '16–30 Sep 2026', monthLabel: 'September 2026', invoicedDate: '2026-10-01', dueDate: '2026-10-08', invoiced: 6654993.73, paid: 6413249.73, paidDate: '2026-10-06' },
];

/* Ongoing fortnight - usage metered live, not yet invoiced */
export const currentUnbilledCycle = {
  id: 'FN-2610-A',
  label: '01–08 Oct 2026',
  usageToDate: 3138551.50,
  asOf: BILLING_REFERENCE_DATE,
};

export const lastClearedPayment = {
  amount: 6413249.73,
  method: 'RTGS',
  clearedDate: '2026-10-06',
  reference: 'RTGS-REF-40217',
  forCycle: 'FN-2609-B',
};

export const pendingVerificationPayment = {
  amount: 241744,
  method: 'NEFT',
  submittedDate: '2026-10-06',
  reference: 'NEFT-REF-88213',
};

export const availablePaymentSecurity = 3200000;

/* Slab-wise breakup of the current (latest invoiced) fortnight bill */
export const currentInvoiceBreakdown = {
  cycleId: 'FN-2609-B',
  vatRate: 0.05,
  rows: [
  { 
    label: 'Gas Consumption Charges (MGO)', 
    qty: '3435.656 MMBTU', 
    rate: '₹1,641.48 / MMBTU',
    amount: 5639560.61 
  },
  { 
    label: 'Gas Consumption Charges (Non-MGO)', 
    qty: '167.293 MMBTU', 
    rate: '₹1,712.59 / MMBTU',
    amount: 286504.32 
  },
  { 
    label: 'Gas Consumption Charges (Excess)', 
    qty: '207.750 MMBTU', 
    rate: '₹1,983.27 / MMBTU',
    amount: 412024.34 
  },
]
};
