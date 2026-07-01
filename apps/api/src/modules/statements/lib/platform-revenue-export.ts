import ExcelJS from 'exceljs';

import type { PlatformRevenueReportData } from './platform-revenue-report.types';

function csvEscape(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function buildPlatformRevenueCsv(data: PlatformRevenueReportData): string {
  const lines: string[] = [
    'Type,Date,Reference,Party,Email,Description,Amount,Currency',
  ];

  for (const row of data.records) {
    lines.push(
      [
        row.typeLabel,
        row.date.slice(0, 10),
        row.reference,
        row.party,
        row.partyEmail,
        row.description,
        row.amount.toFixed(2),
        row.currency,
      ]
        .map((cell) => csvEscape(String(cell)))
        .join(','),
    );
  }

  lines.push('');
  lines.push(`Total,,,,,,${data.summary.totalRevenueGross.toFixed(2)},${data.summary.currency}`);

  return `${lines.join('\n')}\n`;
}

function styleHeaderRow(sheet: ExcelJS.Worksheet): void {
  const row = sheet.getRow(1);
  row.font = { bold: true };
  row.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFF1F5F9' },
  };
}

export async function buildPlatformRevenueXlsx(data: PlatformRevenueReportData): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'SellNearby';
  workbook.created = new Date();

  const sheet = workbook.addWorksheet('Finance records');
  sheet.columns = [
    { header: 'Type', key: 'type', width: 18 },
    { header: 'Date', key: 'date', width: 12 },
    { header: 'Reference', key: 'reference', width: 24 },
    { header: 'Party', key: 'party', width: 24 },
    { header: 'Email', key: 'email', width: 28 },
    { header: 'Description', key: 'description', width: 40 },
    { header: 'Amount', key: 'amount', width: 12 },
    { header: 'Currency', key: 'currency', width: 10 },
  ];
  styleHeaderRow(sheet);

  for (const row of data.records) {
    sheet.addRow({
      type: row.typeLabel,
      date: row.date.slice(0, 10),
      reference: row.reference,
      party: row.party,
      email: row.partyEmail,
      description: row.description,
      amount: row.amount,
      currency: row.currency,
    });
  }

  sheet.addRow({});
  sheet.addRow({
    type: 'Total',
    amount: data.summary.totalRevenueGross,
    currency: data.summary.currency,
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
