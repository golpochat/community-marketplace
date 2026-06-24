import type { Prisma } from '@prisma/client';

import type {
  Notification,
  NotificationLog,
  NotificationProvider,
  NotificationTemplate,
} from '@community-marketplace/types';

export function mapNotification(row: {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  data: Prisma.JsonValue | null;
  channel: string;
  status: string;
  actionUrl: string | null;
  readAt: Date | null;
  createdAt: Date;
}): Notification {
  return {
    id: row.id,
    userId: row.userId,
    type: row.type as Notification['type'],
    title: row.title,
    message: row.message,
    body: row.message,
    data: (row.data as Record<string, unknown> | null) ?? undefined,
    channel: row.channel as Notification['channel'],
    status: row.status as Notification['status'],
    read: row.readAt != null,
    readAt: row.readAt?.toISOString(),
    actionUrl: row.actionUrl ?? undefined,
    createdAt: row.createdAt.toISOString(),
  };
}

export function mapTemplate(row: {
  id: string;
  key: string;
  titleTemplate: string;
  bodyTemplate: string;
  channel: string;
  variables: Prisma.JsonValue | null;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}): NotificationTemplate {
  return {
    id: row.id,
    key: row.key,
    titleTemplate: row.titleTemplate,
    bodyTemplate: row.bodyTemplate,
    channel: row.channel as NotificationTemplate['channel'],
    variables: (row.variables as string[] | null) ?? undefined,
    version: row.version,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function mapProvider(row: {
  id: string;
  name: string;
  type: string;
  config: Prisma.JsonValue;
  enabled: boolean;
  failureCount: number;
  disabledAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}): NotificationProvider {
  return {
    id: row.id,
    name: row.name,
    type: row.type as NotificationProvider['type'],
    config: row.config as Record<string, unknown>,
    enabled: row.enabled,
    failureCount: row.failureCount,
    disabledAt: row.disabledAt?.toISOString(),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function mapLog(row: {
  id: string;
  notificationId: string | null;
  providerId: string;
  status: string;
  response: Prisma.JsonValue | null;
  attempts: number;
  createdAt: Date;
}): NotificationLog {
  return {
    id: row.id,
    notificationId: row.notificationId ?? undefined,
    providerId: row.providerId,
    status: row.status as NotificationLog['status'],
    response: (row.response as Record<string, unknown> | null) ?? undefined,
    attempts: row.attempts,
    createdAt: row.createdAt.toISOString(),
  };
}
