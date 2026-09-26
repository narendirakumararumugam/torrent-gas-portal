import { generateDownload } from './download';

function formatAmount(amount) {
  return `₹ ${amount} L`;
}

export function buildCustomerContractText(customer, masterGcv, effectiveGcvDate) {
  const securityTotal = customer.paymentSecurityDetails.reduce((sum, item) => sum + item.amount, 0);

  return [
    'Torrent Gas Limited',
    'Marketing - Existing Customer Contract Dossier',
    '',
    `Customer Name: ${customer.name}`,
    `Customer ID: ${customer.id}`,
    `Contract Number: ${customer.contractNumber}`,
    `Industry: ${customer.industry}`,
    `Location: ${customer.location}`,
    `Contract Status: ${customer.contractStatus}`,
    `Contract Expiry: ${customer.expiry}`,
    `Daily Consumption: ${customer.scdValue.toLocaleString()} SCM`,
    `MMBTU @ Master GCV ${masterGcv}: ${customer.mmbtuValue}`,
    `Master GCV Effective Date: ${effectiveGcvDate}`,
    `Engagement Score: ${customer.engagementScore}%`,
    `Preferred Channel: ${customer.preferredChannel}`,
    `Last Campaign: ${customer.lastCampaign}`,
    `Campaign Outcome: ${customer.campaignOutcome}`,
    `Security Total: ${formatAmount(securityTotal)}`,
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
