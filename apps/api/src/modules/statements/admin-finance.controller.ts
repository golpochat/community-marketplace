import { Controller, Get, Query, Res } from '@nestjs/common';
import type { Response } from 'express';

import { PERMISSIONS } from '@community-marketplace/types';
import { adminFinanceDateRangeQuerySchema } from '@community-marketplace/validation';

import { RequirePermissions, RequireRole } from '../../common/decorators/rbac.decorator';
import { PlatformRevenueReportService } from './services/platform-revenue-report.service';

@RequireRole('ADMIN', 'SUPER_ADMIN')
@Controller('admin/finance')
export class AdminFinanceController {
  constructor(private readonly platformRevenue: PlatformRevenueReportService) {}

  @RequirePermissions(PERMISSIONS.MANAGE_PAYMENTS)
  @Get('report/summary')
  getReportSummary(@Query() query: Record<string, string>) {
    const filters = adminFinanceDateRangeQuerySchema.parse(query);
    return this.platformRevenue.loadFilteredReport(filters);
  }

  @RequirePermissions(PERMISSIONS.MANAGE_PAYMENTS)
  @Get('report/pdf')
  async downloadReportPdf(@Query() query: Record<string, string>, @Res() res: Response) {
    const filters = adminFinanceDateRangeQuerySchema.parse(query);
    const buffer = await this.platformRevenue.buildPdfForQuery(filters);
    const filename = this.platformRevenue.reportFilename(filters.dateFrom, filters.dateTo, 'pdf');
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  }

  @RequirePermissions(PERMISSIONS.MANAGE_PAYMENTS)
  @Get('report/csv')
  async downloadReportCsv(@Query() query: Record<string, string>, @Res() res: Response) {
    const filters = adminFinanceDateRangeQuerySchema.parse(query);
    const csv = await this.platformRevenue.buildCsvForQuery(filters);
    const filename = this.platformRevenue.reportFilename(filters.dateFrom, filters.dateTo, 'csv');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csv);
  }

  @RequirePermissions(PERMISSIONS.MANAGE_PAYMENTS)
  @Get('report/xlsx')
  async downloadReportXlsx(@Query() query: Record<string, string>, @Res() res: Response) {
    const filters = adminFinanceDateRangeQuerySchema.parse(query);
    const buffer = await this.platformRevenue.buildXlsxForQuery(filters);
    const filename = this.platformRevenue.reportFilename(filters.dateFrom, filters.dateTo, 'xlsx');
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  }
}
