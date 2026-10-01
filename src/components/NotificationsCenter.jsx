import React from 'react';
import NotificationsList from './common/NotificationsList';
import { billingCustomer, billingCycles, currentUnbilledCycle, availablePaymentSecurity, BILLING_REFERENCE_DATE } from '../data/billsPayments';
import { complaintTickets } from '../data/complaints';
import { TARIFF_HISTORY_DATA } from '../data/tariffHistoryData';
import { getCycleLedger, getExposureSummary, formatINR } from '../utils/billingEngine';
import { buildBillingNotifications, buildComplaintNotifications, buildTariffNotification } from '../utils/notificationsEngine';

function NotificationsCenter() {
  const ledger = getCycleLedger(billingCycles, BILLING_REFERENCE_DATE);
  const exposure = getExposureSummary({
    lastCycle: billingCycles[billingCycles.length - 1],
    unbilledCycle: currentUnbilledCycle,
    availableSecurity: availablePaymentSecurity,
  });

  const notifications = [
    ...buildBillingNotifications({ ledger, exposure, referenceDateISO: BILLING_REFERENCE_DATE, formatCurrency: formatINR }),
    ...buildComplaintNotifications(complaintTickets),
    buildTariffNotification(TARIFF_HISTORY_DATA, 'MMBTU'),
  ].filter(Boolean);

  return <NotificationsList notifications={notifications} customerName={billingCustomer.name} />;
}

export default NotificationsCenter;
