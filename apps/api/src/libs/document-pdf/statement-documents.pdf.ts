import type { AccountStatementData } from '../../modules/statements/lib/account-statement.types';
import { renderPdf } from './pdf-buffer.util';
import { attachStatementPageFooters, renderAccountStatement } from './statement-pdf.layout';

export function buildAccountStatementPdf(data: AccountStatementData): Promise<Buffer> {
  return renderPdf((doc) => {
    renderAccountStatement(doc, data);
    attachStatementPageFooters(doc, data.statementNumber);
  });
}
