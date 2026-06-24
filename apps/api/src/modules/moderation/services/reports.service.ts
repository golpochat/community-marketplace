import { Injectable, NotFoundException } from '@nestjs/common';

import { EventBusService } from '../../../events/event-bus.service';
import { ReportEntity } from '../entities/report.entity';
import type { CreateReportDto, ResolveReportDto } from '../dto/moderation.dto';

@Injectable()
export class ReportsService {
  private readonly reports = new Map<string, ReportEntity>();

  constructor(private readonly eventBus: EventBusService) {}

  create(reporterId: string, dto: CreateReportDto): ReportEntity {
    const report = new ReportEntity();
    report.id = `report-${Date.now()}`;
    report.reporterId = reporterId;
    report.targetType = dto.targetType;
    report.targetId = dto.targetId;
    report.reason = dto.reason;
    report.description = dto.description;
    report.status = 'open';
    report.createdAt = new Date();
    report.updatedAt = new Date();

    this.reports.set(report.id, report);

    this.eventBus.publish({
      type: 'moderation.report_created',
      payload: { reportId: report.id, targetType: dto.targetType },
      timestamp: new Date(),
    });

    return report;
  }

  findAll(): ReportEntity[] {
    return [...this.reports.values()];
  }

  findById(id: string): ReportEntity {
    const report = this.reports.get(id);
    if (!report) {
      throw new NotFoundException(`Report ${id} not found`);
    }
    return report;
  }

  resolve(id: string, moderatorId: string, dto: ResolveReportDto): ReportEntity {
    const report = this.findById(id);
    report.status = dto.status;
    report.resolvedBy = moderatorId;
    report.resolvedAt = new Date();
    report.updatedAt = new Date();
    return report;
  }
}
