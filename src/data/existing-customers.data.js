import { contractProfile } from './contractProfile';
import { billingCycles, currentInvoiceBreakdown } from './billsPayments';
import { dailyConsumption } from './mgoFlowAnalysis';

const MASTER_GCV_DEFAULT = 9300;

function parseNumber(value) {
  const match = String(value).match(/[\d.]+/);
  return match ? Number(match[0]) : 0;
}

const wheelsAverageMmbtu = dailyConsumption.reduce((total, day) => total + day.mmbtu, 0) / dailyConsumption.length;
const wheelsAverageScm = Math.round((wheelsAverageMmbtu * 252000) / MASTER_GCV_DEFAULT);
const wheelsPeakMmbtu = Math.max(...dailyConsumption.map((day) => day.mmbtu));
const wheelsPeakScm = Math.round((wheelsPeakMmbtu * 252000) / MASTER_GCV_DEFAULT);
const latestBillingCycle = billingCycles[billingCycles.length - 1];

const wheelsIndiaCustomer = {
  id: 'CUST-WIL01',
  name: contractProfile.company.name,
  contractNumber: contractProfile.contractNumber,
  type: 'Industrial',
  industry: 'Automotive Components',
  location: 'Padi, Chennai',
  address: contractProfile.company.address,
  contractStatus: 'Active',
  contractType: contractProfile.terms.contractType,
  startDate: contractProfile.company.agreementSignedDate,
  expiry: 'Active under Amendment 02 (effective 01 Sep 2026)',
  renewalDate: '01 Sep 2026',
  dcq: parseNumber(contractProfile.terms.dcq),
  mdcq: parseNumber(contractProfile.terms.mdcq),
  mjo: 90,
  accessLimit: 110,
  currentConsumption: wheelsAverageScm,
  monthlyConsumption: Math.round((dailyConsumption.reduce((total, day) => total + day.mmbtu, 0) * 252000) / MASTER_GCV_DEFAULT),
  averageDaily: wheelsAverageScm,
  peakDaily: wheelsPeakScm,
  tariff: parseNumber(currentInvoiceBreakdown.rows[0].rate),
  monthlyValue: latestBillingCycle.invoiced,
  outstanding: Number(((latestBillingCycle.invoiced - latestBillingCycle.paid) / 100000).toFixed(2)),
  paymentStatus: 'Pending verification',
  contact: 'Operations Team',
  designation: 'Commercial Manager',
  email: contractProfile.company.email,
  phone: contractProfile.company.phone,
  alternateContact: 'Billing Desk · billing@torrentgas.in',
  accountManager: 'Torrent Gas Commercial Team',
  engagement: 'High engagement',
  lastInteraction: '23 Sep 2026',
  nextFollowUp: '30 Sep 2026',
  growth: 12,
  portalLinked: true,
};

const seeds = [
  ['Wheels India Ltd.', 'CUST-10021', 'Automotive', 'Padi, Chennai', 'Active', 300, 500, '2027-02-18', 82],
  ['SFL ', 'CUST-10022', 'Textile', 'Chennai', 'Renewal due', 180, 280, '2026-11-12', 68],
  ['Brakes India Pvt. Ltd.', 'CUST-10023', 'Food Processing', 'Chennai', 'Active', 150, 220, '2027-06-30', 74],
  ['Natcopharma Pvt. Ltd. ', 'CUST-10024', 'Pharma', 'Chennai', 'Active', 110, 170, '2027-09-14', 91],
  ['Tube Investments of India', 'CUST-10025', 'Ceramics', 'Chennai', 'Expiring soon', 320, 480, '2026-10-03', 64],
  ['Finelead Pvt. Ltd.', 'CUST-10026', 'Chemicals', 'Chennai', 'Active', 275, 410, '2028-01-22', 79],
  ['Godrej & Boyce Pvt. Ltd.', 'CUST-10027', 'Glass', 'Chennai', 'Active', 400, 600, '2027-04-16', 87],
  ['Green SIgnal Bio pharma Pvt. Ltd..', 'CUST-10028', 'Manufacturing', 'Chennai', 'Active', 130, 195, '2027-07-09', 72],
  ['Star Exstrusions', 'CUST-10029', 'Manufacturing', 'Chennai', 'Renewal due', 210, 315, '2026-12-20', 61],
  ['Mass Glass', 'CUST-10030', 'Food Processing', 'Chennai', 'Active', 95, 145, '2027-03-01', 76],
  ['SNJ Pvt. Ltd.', 'CUST-10031', 'Chemicals', 'Chennai', 'Active', 190, 285, '2027-08-25', 84],
  ['Raj Petro Pvt. Ltd.', 'CUST-10032', 'Ceramics', 'Chennai', 'Expiring soon', 260, 390, '2026-10-28', 58],
];

export const CUSTOMERS = seeds.map((seed, index) => {
  const [name, id, industry, location, contractStatus, dcq, mdcq, expiry, utilization] = seed;
  const daily = Math.round((dcq * utilization) / 100);

  return {
    id,
    name,
    type: 'Industrial',
    industry,
    location,
    address: `Plot ${18 + index}, GIDC Industrial Estate, ${location}`,
    contractNumber: `TG/CGD/${2023 + (index % 3)}/${1200 + index}`,
    contractStatus,
    contractType: index % 3 === 0 ? 'Firm Supply Agreement' : 'MGO + Non-MGO',
    startDate: `${15 - (index % 9)} ${['Jan', 'Feb', 'Mar', 'Apr'][index % 4]} 2024`,
    expiry,
    renewalDate: expiry,
    dcq,
    mdcq,
    mjo: 90,
    accessLimit: 110,
    currentConsumption: daily,
    monthlyConsumption: daily * 30,
    averageDaily: daily - 3,
    peakDaily: Math.min(mdcq, Math.round(daily * 1.16)),
    tariff: 41.75 + index * 0.35,
    monthlyValue: Math.round((daily * 30 * (41.75 + index * 0.35)) / 1000),
    outstanding: index % 4 === 0 ? 4.8 + index : 0,
    paymentStatus: index % 4 === 0 ? 'Due in 8 days' : 'Paid on time',
    contact: ['Meera Shah', 'Karan Patel', 'Anita Desai', 'Vikram Rao'][index % 4],
    designation: ['Plant Head', 'Procurement Manager', 'Operations Director', 'Commercial Manager'][index % 4],
    email: `contact@${name.toLowerCase().replace(/[^a-z]/g, '').slice(0, 14)}.com`,
    phone: `+91 98${(12000000 + index * 73421).toString().slice(0, 8)}`,
    alternateContact: 'Sanjay Mehta · +91 98980 44218',
    accountManager: ['Priya Nair', 'Amit Joshi', 'Neha Mehta'][index % 3],
    engagement: index % 3 === 0 ? 'High engagement' : 'Engaged',
    lastInteraction: `${3 + index} Aug 2026`,
    nextFollowUp: `${14 + index} Aug 2026`,
    growth: 7 + index,
  };
});

CUSTOMERS[0] = wheelsIndiaCustomer;

export const getCustomer = (id) => CUSTOMERS.find((customer) => customer.id === id) ?? CUSTOMERS[0];

export const campaignHistorySeed = [
  {
    id: 'CMP-2609-001',
    name: 'Renewal Save Sprint',
    segment: 'Retention',
    channel: 'Email',
    sentAt: '23 Sep 2026 · 09:00 AM',
    reach: 4,
    openRate: '71%',
    response: '2 callbacks',
    status: 'Live',
  },
  {
    id: 'CMP-2609-002',
    name: 'Premium Loyalty Offer',
    segment: 'Premium',
    channel: 'Phone',
    sentAt: '21 Sep 2026 · 04:30 PM',
    reach: 3,
    openRate: '100%',
    response: '1 upsell',
    status: 'Completed',
  },
  {
    id: 'CMP-2608-015',
    name: 'Growth Segment Nudge',
    segment: 'Growth',
    channel: 'WhatsApp',
    sentAt: '17 Aug 2026 · 01:15 PM',
    reach: 2,
    openRate: '83%',
    response: '1 site visit',
    status: 'Completed',
  },
];