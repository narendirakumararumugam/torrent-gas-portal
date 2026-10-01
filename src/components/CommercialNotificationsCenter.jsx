import React from 'react';
import NotificationsList from './common/NotificationsList';
import { billingCustomer, billingCycles, currentUnbilledCycle, availablePaymentSecurity, BILLING_REFERENCE_DATE } from '../data/commercialBillsPayments';
import { complaintTickets } from '../data/complaints';
import { COMMERCIAL_TARIFF_HISTORY_DATA } from '../data/commercialTariffHistoryData';
import { getCycleLedger, getExposureSummary, formatINR } from '../utils/commercialBillingEngine';
import { buildBillingNotifications, buildComplaintNotifications, buildTariffNotification } from '../utils/notificationsEngine';

function CommercialNotificationsCenter() {
  const ledger = getCycleLedger(billingCycles, BILLING_REFERENCE_DATE);
  const exposure = getExposureSummary({
    lastCycle: billingCycles[billingCycles.length - 1],
    unbilledCycle: currentUnbilledCycle,
    availableSecurity: availablePaymentSecurity,
  });

  const notifications = [
    ...buildBillingNotifications({ ledger, exposure, referenceDateISO: BILLING_REFERENCE_DATE, formatCurrency: formatINR }),
    ...buildComplaintNotifications(complaintTickets),
    buildTariffNotification(COMMERCIAL_TARIFF_HISTORY_DATA, 'MMBTU'),
  ].filter(Boolean);

  return <NotificationsList notifications={notifications} customerName={billingCustomer.name} />;
}

export default CommercialNotificationsCenter;
