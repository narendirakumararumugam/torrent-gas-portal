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
    excessLimit: '120%',
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
      effectivePeriod: '17 Jan 2025',
      summary: 'Base industrial gas sale agreement executed for the Wheels India, Padi.',
      changes: [
        { label: 'DCQ', before: 'Not set', after: '250 MMBTU/day' },
        { label: 'MDQ / MDCQ', before: 'Not set', after: '450 MMBTU/day' },
        { label: 'Delivery Pressure', before: '--', after: '1.5 bar(g)' },
      ],
    },
    {
      id: 'amendment-1',
      title: 'Side Letter 01',
      status: 'Amendment 01',
      executedOn: '12 Mar 2026',
      effectivePeriod: '01 Apr 2026',
      changes: [
        { label: 'DCQ', before: '250 MMBTU/day', after: '300 MMBTU/day' },
        { label: 'Excess Limit', before: '110%', after: '120%' },
      ],
    },
    {
      id: 'amendment-2',
      title: 'Side Letter 02',
      status: 'Amendment 02',
      executedOn: '08 Aug 2026',
      effectivePeriod: '01 Sep 2026',
      changes: [
        { label: 'MDQ / MDCQ', before: '450 MMBTU/day', after: '500 MMBTU/day' },
      ],
    },
  ],
};

export const initialContractDocuments = {
  signed: [
    { id: 'DOC-U2', name: 'Side_Letter_01.pdf', size: '480 KB', uploadedAt: '12 Mar 2026' },
  ],
  unsigned: [
    { id: 'DOC-S3', name: 'Side_Letter_02.pdf', size: '860 KB', uploadedAt: '08 Aug 2026' },
  ],
};
