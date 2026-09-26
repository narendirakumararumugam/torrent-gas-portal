import { jsPDF } from 'jspdf';
import autoTable, { applyPlugin } from 'jspdf-autotable';
import { getInvoiceNumber } from './billingEngine';

applyPlugin(jsPDF);

const NAVY_RGB = [30, 58, 138];
const SLATE_RGB = [71, 85, 105];
const LIGHT_RGB = [241, 245, 249];

function formatDisplayDate(iso) {
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatAmount(value) {
  return value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/* Renders a professional, self-contained tax invoice (header, parties, slab table, totals, footer) as a downloadable PDF */
export function generateTaxInvoicePdf({ cycle, invoiceBreakdown, customer, supplier }) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 40;
  const invoiceNumber = getInvoiceNumber(cycle);

  doc.setFillColor(...NAVY_RGB);
  doc.rect(0, 0, pageWidth, 92, 'F');
  doc.setTextColor('#ffffff');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text(supplier.name, margin, 36);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(supplier.tagline, margin, 52);
  doc.text(supplier.address, margin, 66, { maxWidth: pageWidth / 2 });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('TAX INVOICE', pageWidth - margin, 36, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`GSTIN: ${supplier.gstin}`, pageWidth - margin, 52, { align: 'right' });
  doc.text(`CIN: ${supplier.cin}`, pageWidth - margin, 66, { align: 'right' });

  let y = 118;
  doc.setTextColor('#0f172a');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('Bill To', margin, y);
  doc.text('Invoice Details', pageWidth / 2 + 10, y);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...SLATE_RGB);
  const billToLines = [customer.name, customer.address, `Location: ${customer.location}`, `GSTIN: ${customer.gstin}`, `Contract No: ${customer.contractNumber}`];
  billToLines.forEach((line, index) => doc.text(line, margin, y + 16 + index * 13, { maxWidth: pageWidth / 2 - margin - 10 }));

  const metaLines = [
    `Invoice No: ${invoiceNumber}`,
    `Invoice Date: ${formatDisplayDate(cycle.invoicedDate)}`,
    `Billing Cycle: ${cycle.label}`,
    `Due Date: ${formatDisplayDate(cycle.dueDate)}`,
    `HSN/SAC: ${supplier.hsnCode}`,
  ];
  metaLines.forEach((line, index) => doc.text(line, pageWidth / 2 + 10, y + 16 + index * 13));

  y += 16 + billToLines.length * 13 + 18;

  autoTable(doc, {
    startY: y,
    head: [['Component', 'Quantity', 'Rate', 'Amount (₹)']],
    body: invoiceBreakdown.rows.map((row) => [row.label, row.qty, row.rate, formatAmount(row.amount)]),
    foot: [
      ['Subtotal', '', '', formatAmount(invoiceBreakdown.subtotal)],
      [`Statutory Levies & VAT (${(invoiceBreakdown.vatRate * 100).toFixed(0)}%)`, '', '', formatAmount(invoiceBreakdown.vat)],
      ['Total Invoice Payable', '', '', formatAmount(invoiceBreakdown.total)],
    ],
    theme: 'grid',
    styles: { font: 'helvetica', fontSize: 9, cellPadding: 6, textColor: [15, 23, 42] },
    headStyles: { fillColor: NAVY_RGB, textColor: '#ffffff', fontStyle: 'bold' },
    footStyles: { fillColor: LIGHT_RGB, textColor: [15, 23, 42], fontStyle: 'bold' },
    columnStyles: { 1: { halign: 'center' }, 2: { halign: 'right' }, 3: { halign: 'right' } },
    margin: { left: margin, right: margin },
  });

  const finalY = doc.lastAutoTable.finalY + 24;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...SLATE_RGB);
  doc.text('This is a system-generated tax invoice and does not require a physical signature.', margin, finalY);
  doc.text(`For billing queries, contact ${supplier.email} / ${supplier.phone}`, margin, finalY + 13);

  doc.setDrawColor(...LIGHT_RGB);
  doc.line(margin, finalY + 26, pageWidth - margin, finalY + 26);
  doc.setFontSize(8);
  doc.text(`${supplier.name} · Amount is inclusive of statutory levies and VAT`, margin, finalY + 40);

  doc.save(`${invoiceNumber.replace(/\//g, '-')}-tax-invoice.pdf`);
}
