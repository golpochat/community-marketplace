import type { PlatformRevenueReportData } from '../../modules/statements/lib/platform-revenue-report.types';
import { renderPdf } from './pdf-buffer.util';
import {
  attachPlatformRevenueFooters,
  renderPlatformRevenueReport,
} from './platform-revenue-pdf.layout';

export function buildPlatformRevenueReportPdf(data: PlatformRevenueReportData): Promise<Buffer> {
  return renderPdf((doc) => {
    renderPlatformRevenueReport(doc, data);
    attachPlatformRevenueFooters(doc, data.reportNumber);
  });
}
