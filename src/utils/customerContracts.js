import { generateDownload } from './download';

export function buildCustomerContractText(customer, masterGcv, effectiveGcvDate) {
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
    `Contract DCQ: ${customer.dcq.toLocaleString()} SCM`,
    `Daily Consumption: ${customer.scdValue.toLocaleString()} SCM`,
    `MMBTU @ Master GCV ${masterGcv}: ${customer.mmbtuValue}`,
    `Master GCV Effective Date: ${effectiveGcvDate}`,
    `Email: ${customer.email}`,
    `Phone: ${customer.phone}`,
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

