import { generateDownload } from './download';

export function tableToCsv(columns, rows) {
  const header = columns.join(',');
  const body = rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
  return `${header}\n${body}`;
}

export function exportTableCsv(filename, columns, rows) {
  generateDownload(filename, tableToCsv(columns, rows), 'text/csv');
}
