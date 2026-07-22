import ExcelJS from 'exceljs';

import type { FinanceRecordLine } from './finance-records.util';
import { buildPlatformRevenueReportMeta } from './platform-revenue-export-meta';
import type { PlatformRevenueReportData } from './platform-revenue-report.types';

function csvEscape(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function csvRow(cells: Array<string | number>): string {
  return cells.map((cell) => csvEscape(String(cell))).join(',');
}

function addDetailRows(
  lines: string[],
  title: string,
  rows: FinanceRecordLine[],
): void {
  lines.push(title);
  lines.push('Type,Date,Reference,Party,Email,Description,Amount,Currency');
  if (rows.length === 0) {
    lines.push('—,,,,,No records in this period,,');
    lines.push('');
    return;
  }

  for (const row of rows) {
    lines.push(
      csvRow([
        row.typeLabel,
        row.date.slice(0, 10),
        row.reference,
        row.party,
        row.partyEmail,
        row.description,
        row.amount.toFixed(2),
        row.currency,
      ]),
    );
  }
  lines.push('');
}

export function buildPlatformRevenueCsv(data: PlatformRevenueReportData): string {
  const meta = buildPlatformRevenueReportMeta(data);
  const lines: string[] = [
    'SellNearby Platform Revenue Report',
    '',
    'Field,Value',
  ];

  for (const row of meta.headerRows) {
    lines.push(csvRow([row.label, row.value]));
  }

  lines.push('');
  lines.push('Executive summary');
  lines.push('Line,Amount');
  for (const row of meta.summaryRows) {
    lines.push(csvRow([row.label, row.value]));
  }

  lines.push('');
  lines.push('Notes');
  lines.push(csvRow([meta.notes]));
  lines.push('');

  const platformRows = data.records.filter((row) => row.type === 'platform_service');
  const feeRows = data.records.filter((row) => row.type === 'marketplace_fee');
  const activityRows = data.records.filter(
    (row) => row.type === 'buyer_purchase' || row.type === 'seller_sale',
  );

  addDetailRows(lines, 'A. Platform services', platformRows);
  addDetailRows(lines, 'B. Marketplace fees', feeRows);
  if (activityRows.length > 0) {
    addDetailRows(lines, 'C. Marketplace activity (informational)', activityRows);
  }

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

function styleTitleRow(sheet: ExcelJS.Worksheet, rowNumber: number): void {
  const row = sheet.getRow(rowNumber);
  row.font = { bold: true, size: 14, color: { argb: 'FF0F766E' } };
}

function styleSectionHeading(sheet: ExcelJS.Worksheet, rowNumber: number): void {
  const row = sheet.getRow(rowNumber);
  row.font = { bold: true, size: 11 };
}

function addKeyValueRows(
  sheet: ExcelJS.Worksheet,
  rows: Array<{ label: string; value: string }>,
  startRow: number,
): number {
  let current = startRow;
  for (const row of rows) {
    sheet.getCell(`A${current}`).value = row.label;
    sheet.getCell(`A${current}`).font = { bold: true };
    sheet.getCell(`B${current}`).value = row.value;
    current += 1;
  }
  return current;
}

function addRecordsSheet(
  workbook: ExcelJS.Workbook,
  sheetName: string,
  rows: FinanceRecordLine[],
): void {
  const sheet = workbook.addWorksheet(sheetName);
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

  if (rows.length === 0) {
    sheet.addRow({
      type: '—',
      description: 'No records in this period',
    });
    return;
  }

  for (const row of rows) {
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
}

export async function buildPlatformRevenueXlsx(data: PlatformRevenueReportData): Promise<Buffer> {
  const meta = buildPlatformRevenueReportMeta(data);
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'SellNearby';
  workbook.created = new Date();

  const summarySheet = workbook.addWorksheet('Summary');
  summarySheet.columns = [
    { width: 34 },
    { width: 52 },
  ];

  summarySheet.mergeCells('A1:B1');
  summarySheet.getCell('A1').value = 'SellNearby Platform Revenue Report';
  styleTitleRow(summarySheet, 1);

  let row = 3;
  summarySheet.getCell(`A${row}`).value = 'Report metadata';
  styleSectionHeading(summarySheet, row);
  row += 1;
  row = addKeyValueRows(summarySheet, meta.headerRows, row) + 1;

  summarySheet.getCell(`A${row}`).value = 'Executive summary';
  styleSectionHeading(summarySheet, row);
  row += 1;
  row = addKeyValueRows(summarySheet, meta.summaryRows, row) + 1;

  summarySheet.getCell(`A${row}`).value = 'Notes';
  styleSectionHeading(summarySheet, row);
  row += 1;
  summarySheet.mergeCells(`A${row}:B${row + 2}`);
  summarySheet.getCell(`A${row}`).value = meta.notes;
  summarySheet.getCell(`A${row}`).alignment = { wrapText: true, vertical: 'top' };

  const platformRows = data.records.filter((record) => record.type === 'platform_service');
  const feeRows = data.records.filter((record) => record.type === 'marketplace_fee');
  const activityRows = data.records.filter(
    (record) => record.type === 'buyer_purchase' || record.type === 'seller_sale',
  );

  addRecordsSheet(workbook, 'Platform services', platformRows);
  addRecordsSheet(workbook, 'Marketplace fees', feeRows);
  if (activityRows.length > 0) {
    addRecordsSheet(workbook, 'Marketplace activity', activityRows);
  }

  addRecordsSheet(workbook, 'All records', data.records);

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
