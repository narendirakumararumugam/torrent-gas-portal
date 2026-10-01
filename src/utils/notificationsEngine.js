/* Pure helpers that turn already-computed billing/ticket/tariff data into notification feed items.
   Kept persona-agnostic - each caller supplies its own (industrial or commercial) data. */

function daysBetween(fromISO, toISO) {
  return Math.round((new Date(`${toISO}T00:00:00Z`) - new Date(`${fromISO}T00:00:00Z`)) / 86400000);
}

export function buildBillingNotifications({ ledger, exposure, referenceDateISO, formatCurrency }) {
  const notifications = [];
  const latestCycle = ledger[ledger.length - 1];

  if (latestCycle.outstanding > 0) {
    const daysToDue = daysBetween(referenceDateISO, latestCycle.dueDate);
    if (daysToDue < 0) {
      notifications.push({
        id: `due-${latestCycle.id}`,
        type: 'billing',
        severity: 'critical',
        title: `Payment overdue for ${latestCycle.label}`,
        detail: `${formatCurrency(latestCycle.outstanding)} is outstanding - due date was ${latestCycle.dueDate} (${Math.abs(daysToDue)} day(s) overdue).`,
        date: latestCycle.dueDate,
      });
    } else {
      notifications.push({
        id: `due-${latestCycle.id}`,
        type: 'billing',
        severity: daysToDue <= 3 ? 'warning' : 'info',
        title: `Payment due for ${latestCycle.label}`,
        detail: `${formatCurrency(latestCycle.outstanding)} is due on ${latestCycle.dueDate}${daysToDue <= 3 ? ' - due soon' : ''}.`,
        date: latestCycle.dueDate,
      });
    }
  } else {
    notifications.push({
      id: `settled-${latestCycle.id}`,
      type: 'billing',
      severity: 'info',
      title: `${latestCycle.label} invoice settled`,
      detail: `${formatCurrency(latestCycle.invoiced)} has been paid in full.`,
      date: latestCycle.paidDate || latestCycle.dueDate,
    });
  }

  notifications.push(exposure.isDeficient
    ? {
        id: 'security-shortfall',
        type: 'security',
        severity: 'critical',
        title: 'Payment security shortfall',
        detail: `Total outstanding exposure of ${formatCurrency(exposure.totalOutstanding)} exceeds the available security of ${formatCurrency(exposure.availableSecurity)} by ${formatCurrency(exposure.deficit)}. Top up the security deposit to avoid supply action.`,
        date: referenceDateISO,
      }
    : {
        id: 'security-ok',
        type: 'security',
        severity: 'info',
        title: 'Payment security is adequate',
        detail: `Available security of ${formatCurrency(exposure.availableSecurity)} comfortably covers the current exposure of ${formatCurrency(exposure.totalOutstanding)}.`,
        date: referenceDateISO,
      });

  return notifications;
}

export function buildComplaintNotifications(tickets) {
  return tickets
    .filter((ticket) => ticket.status !== 'resolved')
    .map((ticket) => ({
      id: `ticket-${ticket.id}`,
      type: 'service',
      severity: ticket.priority === 'high' ? 'warning' : 'info',
      title: `Ticket ${ticket.id} is ${ticket.status.replace('-', ' ')}`,
      detail: `${ticket.category} raised on ${ticket.date} - SLA: ${ticket.sla}.`,
      date: ticket.date,
    }));
}

export function buildTariffNotification(history, unit) {
  if (!history || history.length < 2) return null;
  const latest = history[history.length - 1];
  const previous = history[history.length - 2];
  const field = 'mgo' in latest ? 'mgo' : 'rate';
  if (latest[field] === previous[field]) return null;

  const increased = latest[field] > previous[field];
  return {
    id: 'tariff-change',
    type: 'tariff',
    severity: increased ? 'warning' : 'info',
    title: `Tariff rate ${increased ? 'increased' : 'decreased'} for ${latest.period}`,
    detail: `Rate moved from ₹${previous[field].toFixed(2)} to ₹${latest[field].toFixed(2)} per ${unit}.`,
    date: latest.period,
  };
}
