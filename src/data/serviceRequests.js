export const serviceRequestTypes = [
  'Duplicate Invoice Copy',
  'Meter Shifting',
  'Name Transfer / KYC Update',
  'Load Enhancement Request',
  'GCV Certificate Reissue',
  'Other',
];

export const serviceRequestTickets = [
  { id: 'SRQ-2609-2201', type: 'Duplicate Invoice Copy', date: '14 Sep 2026', status: 'resolved', eta: 'Closed' },
  { id: 'SRQ-2608-1894', type: 'Meter Shifting', date: '21 Aug 2026', status: 'in-progress', eta: '3 business day(s)' },
  { id: 'SRQ-2607-1532', type: 'Load Enhancement Request', date: '05 Jul 2026', status: 'open', eta: '5 business day(s)' },
];

export const initialServiceRequest = { type: serviceRequestTypes[0], preferredDate: '', notes: '' };
