/* Timeline data for the ConnectionTracker "Connection Tracking" experience */

export const trackerProgress = 65;
export const trackerEta = '15 Oct 2026';

export const projectManager = {
  name: 'Mr. Pawan',
  role: 'Project Manager',
  initials: 'PW',
  phone: '+91 98200 12345',
};

export const timelineEvents = [
  {
    id: 1,
    title: 'Agreement signed',
    status: 'completed',
    date: '02 Aug 2026',
    iconType: 'registration',
    note: 'Customer KYC verified and virtual account created and shared successfully',
    noteLink: 'View Verified Docs',
  },
  {
    id: 2,
    title: 'Pipeline laid till your premises',
    status: 'completed',
    date: '06 Aug 2026',
    iconType: 'agreement',
    note: 'Underground MDPE network extended in your boundary',
  },
  {
    id: 3,
    title: 'Meter installation',
    status: 'completed',
    date: '12 Aug 2026',
    iconType: 'feasibility',
    note: 'Meter installed successfully',
  },
  {
    id: 4,
    title: 'PNG made available till your meter',
    status: 'completed',
    date: '28 Sep 2026',
    iconType: 'pipeline',
    note: 'Meter hookup completed and PNG made available till the outlet of meter',
  },
  {
    id: 5,
    title: 'TPI received',
    status: 'upcoming',
    iconType: 'meter',
    note: 'Awaiting for TPI certificate'
  },
  {
    id: 6,
    title: 'Final Quality Check',
    status: 'upcoming',
    iconType: 'quality',
    note: 'Awaiting for TPI certificate for scheduling final QC visit'
  },
  {
    id: 7,
    title: 'Connection Completion & Supply Activation',
    status: 'upcoming',
    iconType: 'activation',
    note: 'PNG commissioned successfully'
  },
];
