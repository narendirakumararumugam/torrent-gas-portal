export const contractProfile = {
  contractNumber: 'CGN-IND-2025-WIL-01',
  status: 'active',
  company: {
    name: 'Wheels India',
    address: 'MTH Road, Padi, Chennai, Tamil Nadu, India - 600050',
    email: 'operations@wheelsindia.in',
    phone: '+91 99740 05581',
    agreementSignedDate: '17 Jan 2025',
    commissionedDate: '27 Jun 2025',
  },
  terms: {
    category: 'Industrial',
    contractType: 'MGO + Non-MGO',
    dcq: '300 MMBTU',
    mdcq: '500 MMBTU',
    mgo: '90%',
    mgoObligation: 'Monthly',
    excessLimit: '20%',
    excessLimitCriteria: 'Daily',
    meterType: 'G100 RPD',
    deliveryPressure: '1.5 bar(g)',
    maxAllowableFlowRate: '368 SCMH',
  },
  history: [
    {
      id: 'amendment-0',
      title: 'Original agreement executed',
      status: 'Inception',
      executedOn: '17 Jan 2025',
      effectivePeriod: '27 Jun 2025 - 31 Mar 2026',
      summary: 'Base commercial agreement commissioned for the Wheels India industrial site.',
      changes: [
        { label: 'DCQ', before: 'Not set', after: '250 MMBTU/day' },
        { label: 'MDQ / MDCQ', before: 'Not set', after: '450 MMBTU/day' },
        { label: 'Delivery Pressure', before: '--', after: '1.4 bar(g)' },
      ],
    },
    {
      id: 'amendment-1',
      title: 'Amendment 01 - Load ramp-up',
      status: 'Revision 01',
      executedOn: '12 Mar 2026',
      effectivePeriod: '01 Apr 2026 - 31 Aug 2026',
      summary: 'Supply allocation was lifted to match sustained furnace utilisation and higher daily swing requirements.',
      changes: [
        { label: 'DCQ', before: '250 MMBTU/day', after: '300 MMBTU/day' },
        { label: 'Excess Limit', before: '15%', after: '20%' },
        { label: 'MGO Obligation', before: 'Quarterly true-up', after: 'Monthly settlement' },
      ],
    },
    {
      id: 'amendment-2',
      title: 'Amendment 02 - Operational rebaseline',
      status: 'Current',
      executedOn: '08 Aug 2026',
      effectivePeriod: '01 Sep 2026 - Present',
      summary: 'Latest revision aligned the agreement to the current operating profile and metering configuration.',
      changes: [
        { label: 'MDQ / MDCQ', before: '450 MMBTU/day', after: '500 MMBTU/day' },
        { label: 'Delivery Pressure', before: '1.4 bar(g)', after: '1.5 bar(g)' },
        { label: 'Maximum Allowable Flow Rate', before: '345 SCMH', after: '368 SCMH' },
      ],
    },
  ],
};

export const initialContractDocuments = {
  unsigned: [
    { id: 'DOC-U1', name: 'Draft Agreement - v3.pdf', size: '1.2 MB', uploadedAt: '10 Jan 2025' },
    { id: 'DOC-U2', name: 'Annexure B - Pending Signature.pdf', size: '480 KB', uploadedAt: '12 Jan 2025' },
  ],
  signed: [
    { id: 'DOC-S1', name: 'Signed Agreement - Final.pdf', size: '1.3 MB', uploadedAt: '17 Jan 2025' },
    { id: 'DOC-S2', name: 'Annexure B - Countersigned.pdf', size: '512 KB', uploadedAt: '17 Jan 2025' },
    { id: 'DOC-S3', name: 'KYC Verification Letter.pdf', size: '860 KB', uploadedAt: '18 Jan 2025' },
  ],
};
