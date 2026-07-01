import type { Response } from 'express';

import type { StatementExportFile } from '../services/account-statement.service';

export function sendStatementExport(res: Response, file: StatementExportFile): void {
  res.setHeader('Content-Type', file.contentType);
  res.setHeader('Content-Disposition', `attachment; filename="${file.filename}"`);
  res.send(file.buffer);
}
