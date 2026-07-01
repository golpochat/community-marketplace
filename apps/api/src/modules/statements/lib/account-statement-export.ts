import ExcelJS from 'exceljs';

import {
  type AccountStatementData,
  isSellerStatementSummary,
} from './account-statement.types';

export type StatementExportFormat = 'pdf' | 'csv' | 'xlsx';

export const STATEMENT_EXPORT_CONTENT_TYPES: Record<Exclude<StatementExportFormat, 'pdf'>, string> = {
  csv: 'text/csv; charset=utf-8',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
};

function csvEscape(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function csvRow(cells: (string | number)[]): string {
  return cells.map((cell) => csvEscape(String(cell))).join(',');
}

function formatDate(iso: string): string {
  return iso.slice(0, 10);
}

function formatMoney(amount: number, currency: string): string {
  return `${currency} ${amount.toFixed(2)}`;
}

export function buildStatementCsv(data: AccountStatementData): string {
  const lines: string[] = [];

  lines.push(csvRow(['SellNearby account statement']));
  lines.push(csvRow(['Statement ref', data.statementNumber]));
  lines.push(csvRow(['Role', data.role]));
  lines.push(csvRow(['Period', data.periodLabel]));
  lines.push(csvRow(['Account holder', data.accountHolderName]));
  lines.push(csvRow(['Email', data.accountHolderEmail]));
  lines.push(csvRow(['Issued', formatDate(data.issuedAt)]));
  if (data.isPartialPeriod) {
    lines.push(csvRow(['Note', 'Partial period — activity to issue date']));
  }
  lines.push('');

  if (data.role === 'seller') {
    lines.push(csvRow(['A — Marketplace sales']));
    lines.push(csvRow(['Date', 'Listing', 'Receipt', 'Gross', 'Marketplace fee', 'Net to seller', 'Currency']));
    for (const row of data.salesLines) {
      lines.push(
        csvRow([
          formatDate(row.date),
          row.listingTitle,
          row.receiptRef,
          row.gross.toFixed(2),
          row.marketplaceFee.toFixed(2),
          row.netToSeller.toFixed(2),
          row.currency,
        ]),
      );
    }
    lines.push('');

    lines.push(csvRow(['B — Platform services']));
    lines.push(csvRow(['Date', 'Service', 'Invoice', 'Amount', 'Currency']));
    for (const row of data.platformServiceLines) {
      lines.push(
        csvRow([
          formatDate(row.date),
          row.serviceLabel,
          row.invoiceNumber,
          row.amount.toFixed(2),
          row.currency,
        ]),
      );
    }
    lines.push('');

    lines.push(csvRow(['C — Bank payouts']));
    lines.push(csvRow(['Date', 'Reference', 'Status', 'Amount', 'Currency']));
    for (const row of data.payoutLines) {
      lines.push(
        csvRow([
          formatDate(row.date),
          row.reference,
          row.status,
          row.amount.toFixed(2),
          row.currency,
        ]),
      );
    }
    lines.push('');

    if (isSellerStatementSummary(data.summary)) {
      const s = data.summary;
      lines.push(csvRow(['Period summary']));
      lines.push(csvRow(['Gross sales', s.grossSales.toFixed(2), s.currency]));
      lines.push(csvRow(['Marketplace fees on sales', s.marketplaceFeesOnSales.toFixed(2), s.currency]));
      lines.push(csvRow(['Net from sales', s.netFromSales.toFixed(2), s.currency]));
      lines.push(csvRow(['Platform services', s.platformServices.toFixed(2), s.currency]));
      lines.push(csvRow(['Net period activity', s.netPeriodActivity.toFixed(2), s.currency]));
      lines.push(csvRow(['Payouts received', s.payoutsReceivedInPeriod.toFixed(2), s.currency]));
      if (s.pendingSettlementNet > 0) {
        lines.push(csvRow(['Pending settlement', s.pendingSettlementNet.toFixed(2), s.currency]));
      }
    }
  } else if (!isSellerStatementSummary(data.summary)) {
    const buyerSummary = data.summary;
    lines.push(csvRow(['Purchases']));
    lines.push(csvRow(['Date', 'Listing', 'Receipt', 'Amount', 'Currency']));
    for (const row of data.buyerPurchaseLines) {
      lines.push(
        csvRow([
          formatDate(row.date),
          row.listingTitle,
          row.receiptRef,
          row.amount.toFixed(2),
          row.currency,
        ]),
      );
    }
    lines.push('');
    lines.push(csvRow(['Period summary']));
    lines.push(
      csvRow([
        'Total purchases',
        buyerSummary.totalPurchases.toFixed(2),
        buyerSummary.currency,
      ]),
    );
    lines.push(csvRow(['Purchase count', buyerSummary.purchaseCount]));
  }

  return `${lines.join('\n')}\n`;
}

function addKeyValueRows(
  sheet: ExcelJS.Worksheet,
  rows: Array<[string, string | number]>,
): void {
  for (const [label, value] of rows) {
    sheet.addRow([label, value]);
  }
}

function styleHeaderRow(sheet: ExcelJS.Worksheet, rowNumber: number): void {
  const row = sheet.getRow(rowNumber);
  row.font = { bold: true };
  row.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFF1F5F9' },
  };
}

export async function buildStatementXlsx(data: AccountStatementData): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'SellNearby';
  workbook.created = new Date();

  const summarySheet = workbook.addWorksheet('Summary');
  summarySheet.columns = [
    { header: 'Field', key: 'field', width: 28 },
    { header: 'Value', key: 'value', width: 48 },
  ];
  styleHeaderRow(summarySheet, 1);

  addKeyValueRows(summarySheet, [
    ['Statement ref', data.statementNumber],
    ['Role', data.role],
    ['Period', data.periodLabel],
    ['Account holder', data.accountHolderName],
    ['Email', data.accountHolderEmail],
    ['Issued', formatDate(data.issuedAt)],
    ...(data.isPartialPeriod
      ? [['Note', 'Partial period — activity to issue date'] as [string, string]]
      : []),
  ]);

  if (data.role === 'seller' && isSellerStatementSummary(data.summary)) {
    const s = data.summary;
    summarySheet.addRow([]);
    addKeyValueRows(summarySheet, [
      ['Gross sales', formatMoney(s.grossSales, s.currency)],
      ['Marketplace fees on sales', formatMoney(s.marketplaceFeesOnSales, s.currency)],
      ['Net from sales', formatMoney(s.netFromSales, s.currency)],
      ['Platform services', formatMoney(s.platformServices, s.currency)],
      ['Net period activity', formatMoney(s.netPeriodActivity, s.currency)],
      ['Payouts received', formatMoney(s.payoutsReceivedInPeriod, s.currency)],
      ...(s.pendingSettlementNet > 0
        ? [['Pending settlement', formatMoney(s.pendingSettlementNet, s.currency)] as [string, string]]
        : []),
      ['Sale count', s.saleCount],
      ['Platform service count', s.platformServiceCount],
      ['Payout count', s.payoutCount],
    ]);

    const salesSheet = workbook.addWorksheet('Sales');
    salesSheet.columns = [
      { header: 'Date', key: 'date', width: 12 },
      { header: 'Listing', key: 'listing', width: 36 },
      { header: 'Receipt', key: 'receipt', width: 18 },
      { header: 'Gross', key: 'gross', width: 12 },
      { header: 'Marketplace fee', key: 'fee', width: 16 },
      { header: 'Net to seller', key: 'net', width: 14 },
      { header: 'Currency', key: 'currency', width: 10 },
    ];
    styleHeaderRow(salesSheet, 1);
    for (const row of data.salesLines) {
      salesSheet.addRow({
        date: formatDate(row.date),
        listing: row.listingTitle,
        receipt: row.receiptRef,
        gross: row.gross,
        fee: row.marketplaceFee,
        net: row.netToSeller,
        currency: row.currency,
      });
    }

    const servicesSheet = workbook.addWorksheet('Platform services');
    servicesSheet.columns = [
      { header: 'Date', key: 'date', width: 12 },
      { header: 'Service', key: 'service', width: 32 },
      { header: 'Invoice', key: 'invoice', width: 22 },
      { header: 'Amount', key: 'amount', width: 12 },
      { header: 'Currency', key: 'currency', width: 10 },
    ];
    styleHeaderRow(servicesSheet, 1);
    for (const row of data.platformServiceLines) {
      servicesSheet.addRow({
        date: formatDate(row.date),
        service: row.serviceLabel,
        invoice: row.invoiceNumber,
        amount: row.amount,
        currency: row.currency,
      });
    }

    const payoutsSheet = workbook.addWorksheet('Payouts');
    payoutsSheet.columns = [
      { header: 'Date', key: 'date', width: 12 },
      { header: 'Reference', key: 'reference', width: 22 },
      { header: 'Status', key: 'status', width: 12 },
      { header: 'Amount', key: 'amount', width: 12 },
      { header: 'Currency', key: 'currency', width: 10 },
    ];
    styleHeaderRow(payoutsSheet, 1);
    for (const row of data.payoutLines) {
      payoutsSheet.addRow({
        date: formatDate(row.date),
        reference: row.reference,
        status: row.status,
        amount: row.amount,
        currency: row.currency,
      });
    }
  } else if (!isSellerStatementSummary(data.summary)) {
    const buyerSummary = data.summary;
    summarySheet.addRow([]);
    addKeyValueRows(summarySheet, [
      ['Total purchases', formatMoney(buyerSummary.totalPurchases, buyerSummary.currency)],
      ['Purchase count', buyerSummary.purchaseCount],
    ]);

    const purchasesSheet = workbook.addWorksheet('Purchases');
    purchasesSheet.columns = [
      { header: 'Date', key: 'date', width: 12 },
      { header: 'Listing', key: 'listing', width: 36 },
      { header: 'Receipt', key: 'receipt', width: 18 },
      { header: 'Amount', key: 'amount', width: 12 },
      { header: 'Currency', key: 'currency', width: 10 },
    ];
    styleHeaderRow(purchasesSheet, 1);
    for (const row of data.buyerPurchaseLines) {
      purchasesSheet.addRow({
        date: formatDate(row.date),
        listing: row.listingTitle,
        receipt: row.receiptRef,
        amount: row.amount,
        currency: row.currency,
      });
    }
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
