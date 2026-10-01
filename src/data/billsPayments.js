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
  { id: 'FN-2607-B', label: '16–31 Jul 2026', monthLabel: 'July 2026', invoicedDate: '2026-08-01', dueDate: '2026-08-09', invoiced: 452000, paid: 452000, paidDate: '2026-08-09' },
  { id: 'FN-2608-A', label: '01–15 Aug 2026', monthLabel: 'August 2026', invoicedDate: '2026-08-16', dueDate: '2026-08-24', invoiced: 468500, paid: 468500, paidDate: '2026-08-24' },
  { id: 'FN-2608-B', label: '16–31 Aug 2026', monthLabel: 'August 2026', invoicedDate: '2026-09-01', dueDate: '2026-09-09', invoiced: 479800, paid: 430000, paidDate: '2026-09-08' },
  { id: 'FN-2609-A', label: '01–15 Sep 2026', monthLabel: 'September 2026 ', invoicedDate: '2026-09-16', dueDate: '2026-09-24', invoiced: 873194, paid: 873194, paidDate: '2026-09-24' },
  { id: 'FN-2609-B', label: '16–30 Sep 2026', monthLabel: 'September 2026', invoicedDate: '2026-10-01', dueDate: '2026-10-08', invoiced: 900834, paid: 600000, paidDate: '2026-10-01' },
];

/* Ongoing fortnight - usage metered live, not yet invoiced */
export const currentUnbilledCycle = {
  id: 'FN-2610-A',
  label: '01–15 Oct 2026',
  usageToDate: 46100,
  asOf: BILLING_REFERENCE_DATE,
};

export const lastClearedPayment = {
  amount: 873194,
  method: 'RTGS',
  clearedDate: '2026-09-24',
  reference: 'RTGS-REF-40217',
  forCycle: 'FN-2609-A',
};

export const pendingVerificationPayment = {
  amount: 300834,
  method: 'NEFT',
  submittedDate: '2026-10-01',
  reference: 'NEFT-REF-88213',
};

export const availablePaymentSecurity = 230000;

/* Slab-wise breakup of the current (latest invoiced) fortnight bill */
export const currentInvoiceBreakdown = {
  cycleId: 'FN-2609-B',
  vatRate: 0.05,
  rows: [
  { 
    label: 'MGO Slab (≤300 MMBTU)', 
    qty: '300 MMBTU', 
    rate: '₹1,725.12 / MMBTU', /*[cite: 5] */
    amount: 517536.00 
  },
  { 
    label: 'Non-MGO Slab (300–500 MMBTU)', 
    qty: '180 MMBTU', 
    rate: '₹1,802.97 / MMBTU', /*[cite: 5] */
    amount: 324534.60 
  },
  { 
    label: 'Excess Slab (>500 MMBTU)', 
    qty: '8 MMBTU', 
    rate: '₹1,983.27 / MMBTU', /*[cite: 5] */
    amount: 15866.16 
  },
]
};
