import { generateDownload } from './download';

export function buildCustomerContractText(customer, masterGcv, effectiveGcvDate) {
  const dailyConsumption = customer.currentConsumption ?? customer.scdValue ?? 0;
  const monthlyConsumption = customer.monthlyConsumption ?? dailyConsumption * 30;
  const tariff = Number(customer.tariff ?? 0);
  const mmbtuValue = customer.mmbtuValue ?? Number(((dailyConsumption * masterGcv) / 252000).toFixed(2));

  return [
    'Torrent Gas Limited',
    'Marketing - Existing Customer Contract Dossier',
    '',
    `Customer Name: ${customer.name}`,
    `Customer ID: ${customer.id}`,
    `Contract Number: ${customer.contractNumber}`,
    `Industry: ${customer.industry}`,
    `Location: ${customer.location}`,
    `Address: ${customer.address}`,
    `Contact Person: ${customer.contact}`,
    `Designation: ${customer.designation}`,
    `Contract Status: ${customer.contractStatus}`,
    `Contract Type: ${customer.contractType}`,
    `Start Date: ${customer.startDate}`,
    `Contract Expiry: ${customer.expiry}`,
    `Contract DCQ: ${customer.dcq.toLocaleString()} SCM`,
    `Daily Consumption: ${dailyConsumption.toLocaleString()} SCM`,
    `Monthly Consumption: ${monthlyConsumption.toLocaleString()} SCM`,
    `MMBTU @ Master GCV ${masterGcv}: ${mmbtuValue}`,
    `Tariff: ₹ ${tariff.toFixed(2)} / SCM`,
    `Monthly Value: ₹ ${customer.monthlyValue.toLocaleString('en-IN')}`,
    `Outstanding Balance: ${customer.outstanding > 0 ? `₹ ${customer.outstanding.toFixed(1)}L` : 'Cleared'}`,
    `Payment Status: ${customer.paymentStatus}`,
    `Account Manager: ${customer.accountManager}`,
    `Master GCV Effective Date: ${effectiveGcvDate}`,
    `Email: ${customer.email}`,
    `Phone: ${customer.phone}`,
    `Alternate Contact: ${customer.alternateContact}`,
    `Average Daily: ${customer.averageDaily} SCM`,
    `Peak Daily: ${customer.peakDaily} SCM`,
    `Engagement: ${customer.engagement}`,
    `Last Interaction: ${customer.lastInteraction}`,
    `Next Follow-up: ${customer.nextFollowUp}`,
    `Growth: ${customer.growth}%`,
    `Daily Communication: ${customer.dailyCommunication ? 'Enabled' : 'Disabled'}`,
    `Last Sent Date: ${customer.lastSentDate}`,
    '',
    'This document is a generated marketing summary for contract review and operational use.',
  ].join('\n');
}

export function downloadCustomerContract(customer, masterGcv, effectiveGcvDate) {
  const contractText = buildCustomerContractText(customer, masterGcv, effectiveGcvDate);
  generateDownload(`${customer.id}_contract_dossier.pdf`, contractText, 'application/pdf');
}

