import React from 'react';
import NotificationsList from './common/NotificationsList';
import { billingCustomer, billingCycles } from '../data/billsPayments';
import { complaintTickets } from '../data/complaints';
import { TARIFF_HISTORY_DATA } from '../data/tariffHistoryData';
import { formatINR } from '../utils/billingEngine';
import { buildPastBillingNotifications, buildPastTariffNotifications, buildResolvedComplaintNotifications } from '../utils/notificationsEngine';

/* Past-only feed: the latest billing/security/tariff status is already surfaced on the dashboard's critical alerts banner. */
function NotificationsCenter() {
  const notifications = [
    ...buildPastBillingNotifications(billingCycles, formatINR),
    ...buildResolvedComplaintNotifications(complaintTickets),
    ...buildPastTariffNotifications(TARIFF_HISTORY_DATA, 'MMBTU'),
  ];

  return (
    <NotificationsList
      notifications={notifications}
      customerName={billingCustomer.name}
      eyebrow="History"
      title="Past Notifications"
      description={`Settled invoices, closed tickets, and earlier tariff changes for ${billingCustomer.name}. The latest alerts are shown on the dashboard.`}
      emptyLabel="No past notifications on record yet."
    />
  );
}

export default NotificationsCenter;
