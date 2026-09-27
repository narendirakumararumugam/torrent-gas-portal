export interface Customer {
  id: string; name: string; type: string; industry: string; location: string; address: string;
  contractNumber: string; contractStatus: 'Active' | 'Renewal due' | 'Expiring soon'; contractType: string;
  startDate: string; expiry: string; renewalDate: string; dcq: number; mdcq: number; mjo: number; accessLimit: number;
  currentConsumption: number; monthlyConsumption: number; averageDaily: number; peakDaily: number;
  tariff: number; monthlyValue: number; outstanding: number; paymentStatus: string;
  contact: string; designation: string; email: string; phone: string; alternateContact: string; accountManager: string;
  engagement: string; lastInteraction: string; nextFollowUp: string; growth: number;
}

const seeds: Array<[string, string, string, string, string, number, number, string, number]> = [
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

export const CUSTOMERS: Customer[] = seeds.map((s, index) => {
  const [name, id, industry, location, contractStatus, dcq, mdcq, expiry, utilization] = s;
  const daily = Math.round(dcq * utilization / 100);
  return {
    id, name, type: 'Industrial', industry, location, address: `Plot ${18 + index}, GIDC Industrial Estate, ${location}`,
    contractNumber: `TG/CGD/${2023 + (index % 3)}/${1200 + index}`, contractStatus: contractStatus as Customer['contractStatus'],
    contractType: index % 3 === 0 ? 'Firm Supply Agreement' : 'MJO + Non-MJO', startDate: `${15 - index % 9} ${['Jan', 'Feb', 'Mar', 'Apr'][index % 4]} 2024`, expiry,
    renewalDate: expiry, dcq, mdcq, mjo: 90, accessLimit: 110, currentConsumption: daily, monthlyConsumption: daily * 30,
    averageDaily: daily - 3, peakDaily: Math.min(mdcq, Math.round(daily * 1.16)), tariff: 41.75 + index * .35,
    monthlyValue: Math.round(daily * 30 * (41.75 + index * .35) / 1000), outstanding: index % 4 === 0 ? 4.8 + index : 0,
    paymentStatus: index % 4 === 0 ? 'Due in 8 days' : 'Paid on time', contact: ['Meera Shah', 'Karan Patel', 'Anita Desai', 'Vikram Rao'][index % 4],
    designation: ['Plant Head', 'Procurement Manager', 'Operations Director', 'Commercial Manager'][index % 4], email: `contact@${name.toLowerCase().replace(/[^a-z]/g, '').slice(0, 14)}.com`, phone: `+91 98${(12000000 + index * 73421).toString().slice(0, 8)}`,
    alternateContact: 'Sanjay Mehta · +91 98980 44218', accountManager: ['Priya Nair', 'Amit Joshi', 'Neha Mehta'][index % 3],
    engagement: index % 3 === 0 ? 'High engagement' : 'Engaged', lastInteraction: `${3 + index} Aug 2026`, nextFollowUp: `${14 + index} Aug 2026`, growth: 7 + index
  };
});

export const getCustomer = (id: string | null) => CUSTOMERS.find(c => c.id === id) ?? CUSTOMERS[0];
