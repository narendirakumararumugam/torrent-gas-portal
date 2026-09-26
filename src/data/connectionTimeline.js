/* Timeline data for the ConnectionTracker "Connection Tracking" experience */

export const trackerProgress = 65;
export const trackerEta = '15 Oct 2026';

export const projectManager = {
  name: 'Suresh Rathi',
  role: 'Project Manager',
  initials: 'SR',
  phone: '+91 98200 12345',
};

export const timelineEvents = [
  {
    id: 1,
    title: 'Registration & KYC Verification',
    status: 'completed',
    date: '02 Aug 2026',
    officer: 'A. Verma',
    iconType: 'registration',
    note: 'Application received and KYC documents verified successfully.',
    noteLink: 'View Verified Docs',
  },
  {
    id: 2,
    title: 'Agreement Signed',
    status: 'completed',
    date: '06 Aug 2026',
    officer: 'P. Nair',
    iconType: 'agreement',
    note: 'Commercial supply agreement executed and digitally signed.',
  },
  {
    id: 3,
    title: 'Feasibility Survey',
    status: 'completed',
    date: '12 Aug 2026',
    officer: 'R. Saha',
    iconType: 'feasibility',
    note: 'Site survey confirms the pipeline route is technically feasible.',
  },
  {
    id: 4,
    title: 'Pipeline Laid Till Premises',
    status: 'completed',
    date: '28 Sep 2026',
    officer: 'M. Khan',
    iconType: 'pipeline',
    note: 'Pipeline laid up to the premises boundary and pressure tested.',
    action: 'View Survey Map',
  },
  {
    id: 5,
    title: 'Meter Installation Scheduled',
    status: 'upcoming',
    date: '08 Oct 2026',
    officer: 'D. Chatterjee',
    iconType: 'meter',
    note: 'Smart meter installation appointment confirmed with the site team.',
    action: 'Reschedule Appointment',
  },
  {
    id: 6,
    title: 'Final Quality Check',
    status: 'active',
    date: 'In Progress',
    officer: 'Operations Desk',
    iconType: 'quality',
    note: 'Safety and pressure quality checks underway before supply activation.',
  },
  {
    id: 7,
    title: 'Connection Completion & Supply Activation',
    status: 'upcoming',
    date: 'Target: 15 Oct 2026',
    officer: 'Customer Success',
    iconType: 'activation',
    note: 'Final PNG/CNG supply activation and handover to customer success.',
  },
];
