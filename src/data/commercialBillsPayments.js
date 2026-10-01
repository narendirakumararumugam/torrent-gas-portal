import { commercialContractProfile } from './commercialContractProfile';

export const BILLING_REFERENCE_DATE = '2026-10-02';

export const billingCustomer = {
  name: 'SEABREEZE HOSPITALITY PVT. LTD.',
  location: 'Besant Nagar, Chennai',
  address: commercialContractProfile.company.address,
  gstin: '33AAACS7821Q1Z4',
  contractNumber: commercialContractProfile.contractNumber,
};

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

export const billingCycles = [
  { id: 'FN-2609-A', label: '01–15 Sep 2026', monthLabel: 'September 2026', invoicedDate: '2026-09-16', dueDate: '2026-09-24', invoiced: 27850, paid: 27850, paidDate: '2026-09-24' },
  { id: 'FN-2609-B', label: '16–30 Sep 2026', monthLabel: 'September 2026', invoicedDate: '2026-10-01', dueDate: '2026-10-08', invoiced: 181339, paid: 100000, paidDate: '2026-10-01' },
];

export const currentUnbilledCycle = {
  id: 'FN-2610-A',
  label: '01–15 Oct 2026',
  usageToDate: 7450,
  asOf: BILLING_REFERENCE_DATE,
};

export const lastClearedPayment = {
  amount: 27850,
  method: 'NEFT',
  clearedDate: '2026-09-24',
  reference: 'NEFT-REF-51024',
  forCycle: 'FN-2609-A',
};

export const pendingVerificationPayment = {
  amount: 81339,
  method: 'UPI',
  submittedDate: '2026-10-01',
  reference: 'UPI-REF-55820',
};

export const availablePaymentSecurity = 45000;

export const currentInvoiceBreakdown = {
  cycleId: 'FN-2609-B',
  vatRate: 0.05,
  rows: [
    {
      label: 'Commercial flat rate (₹1,950.00 / MMBTU @ 9300 KCal/SCM)',
      qty: '2,400 SCM',
      rate: '₹71.96 / SCM',
      amount: 172704.00,
    },
  ],
};