'use client';

import { FileSpreadsheet, FileText, Loader2, Table2 } from 'lucide-react';

import { IconActionGroup, Tooltip } from '@community-marketplace/ui-dashboard';

import type { StatementExportFormat } from '@/services/monetization.service';

const FORMAT_CONFIG: Record<
  StatementExportFormat,
  { label: string; Icon: typeof FileText }
> = {
  pdf: { label: 'Download PDF', Icon: FileText },
  csv: { label: 'Download CSV', Icon: Table2 },
  xlsx: { label: 'Download Excel', Icon: FileSpreadsheet },
};

const BUTTON_CLASSES =
  'inline-flex h-8 w-8 items-center justify-center rounded-md border border-[hsl(var(--dashboard-sidebar-border))] text-[hsl(var(--dashboard-sidebar-muted))] transition-colors hover:bg-[hsl(var(--dashboard-sidebar-active)/0.5)] hover:text-[hsl(var(--dashboard-main-fg))] disabled:cursor-not-allowed disabled:opacity-50';

interface StatementExportButtonsProps {
  onDownload: (format: StatementExportFormat) => Promise<void>;
  downloading: StatementExportFormat | null;
  disabled?: boolean;
}

export function StatementExportButtons({
  onDownload,
  downloading,
  disabled = false,
}: StatementExportButtonsProps) {
  return (
    <IconActionGroup>
      {(['pdf', 'csv', 'xlsx'] as const).map((format) => {
        const { label, Icon } = FORMAT_CONFIG[format];
        const isLoading = downloading === format;
        const isDisabled = disabled || (downloading !== null && !isLoading);

        return (
          <Tooltip key={format} label={isLoading ? 'Preparing…' : label}>
            <button
              type="button"
              onClick={() => void onDownload(format)}
              disabled={isDisabled}
              aria-label={isLoading ? 'Preparing download' : label}
              className={BUTTON_CLASSES}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : (
                <Icon className="h-4 w-4" aria-hidden />
              )}
            </button>
          </Tooltip>
        );
      })}
    </IconActionGroup>
  );
}
