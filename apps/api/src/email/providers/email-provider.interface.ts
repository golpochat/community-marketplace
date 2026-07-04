import type { EmailProviderId, EmailSendOutcome } from '@community-marketplace/types';

export interface EmailSender {
  email: string;
  name: string;
}

export interface EmailAttachment {
  filename: string;
  content: Buffer;
  mimeType: string;
}

export interface OutboundEmail {
  to: string;
  subject: string;
  html: string;
  text?: string;
  attachments?: EmailAttachment[];
}

export interface EmailProvider {
  readonly id: EmailProviderId;
  readonly label: string;
  readonly description: string;
  isConfigured(): boolean;
  send(message: OutboundEmail, from: EmailSender): Promise<EmailSendOutcome>;
}
