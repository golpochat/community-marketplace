import {
  buildPlatformRevenueReportNote,
  formatInvoiceAddress,
  formatInvoiceMoney,
  getInvoiceCompanyConfig,
  resolveDocumentWebsite,
  type InvoiceCompanyConfig,
} from '@community-marketplace/config';

import { formatReceiptDate } from '../../payments/lib/payment-receipt.types';
import type { PlatformRevenueReportData } from './platform-revenue-report.types';

export interface PlatformRevenueReportMetaRow {
  label: string;
  value: string;
}

export interface PlatformRevenueReportMeta {
  company: InvoiceCompanyConfig;
  headerRows: PlatformRevenueReportMetaRow[];
  summaryRows: PlatformRevenueReportMetaRow[];
  notes: string;
}

export function buildPlatformRevenueReportMeta(
  data: PlatformRevenueReportData,
): PlatformRevenueReportMeta {
  const company = getInvoiceCompanyConfig();
  const { summary } = data;
  const currency = summary.currency;

  const headerRows: PlatformRevenueReportMetaRow[] = [
    { label: 'Legal entity', value: company.legalName },
    { label: 'Address', value: formatInvoiceAddress(company) },
    { label: 'Support email', value: company.supportEmail },
    { label: 'Website', value: resolveDocumentWebsite(company) },
  ];

  if (company.companyRegNumber.trim()) {
    headerRows.push({ label: 'Company registration', value: company.companyRegNumber });
  }

  if (company.vatStatus === 'registered' && company.vatNumber.trim()) {
    headerRows.push({ label: 'VAT registration', value: company.vatNumber });
  } else {
    headerRows.push({ label: 'VAT status', value: 'Not registered' });
  }

  headerRows.push(
    { label: 'Report reference', value: data.reportNumber },
    { label: 'Reporting period', value: data.periodLabel },
    { label: 'Issued', value: formatReceiptDate(data.issuedAt) },
  );

  if (data.isPartialPeriod) {
    headerRows.push({
      label: 'Period status',
      value: `Partial — activity to ${formatReceiptDate(data.issuedAt)}`,
    });
  }

  const summaryRows: PlatformRevenueReportMetaRow[] = [
    {
      label: `Platform services (${summary.platformInvoiceCount})`,
      value: formatInvoiceMoney(summary.platformServicesGross, currency),
    },
    {
      label: `Marketplace fees (${summary.marketplaceFeeCount})`,
      value: formatInvoiceMoney(summary.marketplaceFeesGross, currency),
    },
  ];

  if (summary.netAmount != null && summary.vatAmount != null) {
    summaryRows.push(
      {
        label: 'Net (excl. VAT)',
        value: formatInvoiceMoney(summary.netAmount, currency),
      },
      {
        label: `VAT @ ${Math.round(company.defaultVatRate * 100)}%`,
        value: formatInvoiceMoney(summary.vatAmount, currency),
      },
    );
  }

  summaryRows.push({
    label: 'Total platform revenue',
    value: formatInvoiceMoney(summary.totalRevenueGross, currency),
  });

  if (summary.activityVolumeGross > 0) {
    summaryRows.push(
      {
        label: `Buyer purchases (${summary.buyerPurchaseCount})`,
        value: formatInvoiceMoney(summary.buyerPurchasesGross, currency),
      },
      {
        label: `Seller sales (${summary.sellerSaleCount})`,
        value: formatInvoiceMoney(summary.sellerSalesGross, currency),
      },
      {
        label: 'Total activity volume (informational)',
        value: formatInvoiceMoney(summary.activityVolumeGross, currency),
      },
    );
  }

  return {
    company,
    headerRows,
    summaryRows,
    notes: buildPlatformRevenueReportNote(company),
  };
}
