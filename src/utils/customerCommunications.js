import { CUSTOMERS } from '../data/existing-customers.data.js';

export const MASTER_GCV_DEFAULT = 9300;
export const DEFAULT_EFFECTIVE_GCV_DATE = '10 Aug 2026';
export const DISPATCH_TIMESTAMP = '23 Sep 2026 · 08:00 AM';

export function isCommissioned(customer) {
  return customer.contractStatus === 'Active' || customer.contractStatus === 'Expiring soon';
}

export function buildCustomerProfiles(masterGcv = MASTER_GCV_DEFAULT) {
  return CUSTOMERS.map((customer) => ({
    ...customer,
    mmbtuValue: Number((((customer.currentConsumption ?? 0) * masterGcv) / 252000).toFixed(2)),
  }));
}

export function buildCommunicationProfiles(masterGcv = MASTER_GCV_DEFAULT) {
  return CUSTOMERS.map((customer, index) => {
    const commissioned = isCommissioned(customer);

    return {
      ...customer,
      mmbtuValue: Number((((customer.currentConsumption ?? 0) * masterGcv) / 252000).toFixed(2)),
      dailyCommunication: commissioned && index % 2 === 0,
      lastSentDate: commissioned && index % 2 === 0 ? DISPATCH_TIMESTAMP : '—',
    };
  });
}

export function applyMasterGcvToCommunicationProfiles(profiles, masterGcv) {
  return profiles.map((profile) => ({
    ...profile,
    mmbtuValue: Number((((profile.currentConsumption ?? 0) * masterGcv) / 252000).toFixed(2)),
  }));
}