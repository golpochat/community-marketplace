export interface AuditActivityLabels {
  eventType: string;
  source: 'user' | 'moderation';
  actorLabel?: string;
  targetLabel?: string;
  subjectLabel?: string;
  metadata?: Record<string, unknown>;
}

const ACRONYMS = new Set(['mfa', 'otp', 'id', 'rbac', 'api', 'sms']);

const USER_EVENT_LABELS: Record<string, string> = {
  profile_update: 'Profile updated',
  profile_completed: 'Profile completed',
  verification_submitted: 'Verification submitted',
  verification_approved: 'Verification approved',
  verification_rejected: 'Verification rejected',
  role_changed: 'Role changed',
  status_changed: 'Status changed',
  password_reset_sent: 'Password reset email sent',
  permission_granted: 'Permission granted',
  permission_revoked: 'Permission revoked',
  user_suspended: 'User suspended',
  user_unsuspended: 'User reinstated',
  user_banned: 'User banned',
  user_unbanned: 'Ban lifted',
  settings_updated: 'Settings updated',
  deletion_requested: 'Account deletion requested',
  avatar_uploaded: 'Avatar uploaded',
  store_banner_uploaded: 'Store banner uploaded',
  phone_change_otp_sent: 'Phone change verification sent',
  phone_changed: 'Phone number changed',
  seller_fee_override_set: 'Seller fee override applied',
  seller_fee_override_cleared: 'Seller fee override cleared',
  identity_mfa_setup_started: 'MFA setup started',
  identity_mfa_enabled: 'MFA enabled',
  identity_mfa_disabled: 'MFA disabled',
};

const MODERATION_EVENT_LABELS: Record<string, string> = {
  report_created: 'Report filed',
  report_assigned: 'Report assigned',
  report_reviewed: 'Report reviewed',
  action_warn: 'Warning issued',
  action_suspend: 'User suspended (moderation)',
  action_ban: 'User banned (moderation)',
  action_delete_listing: 'Listing removed',
  action_delete_message: 'Message removed',
  suspension_lifted: 'Suspension lifted',
  ban_lifted: 'Ban lifted',
  appeal_submitted: 'Appeal submitted',
  appeal_approved: 'Appeal approved',
  appeal_rejected: 'Appeal rejected',
  auto_flag: 'Content auto-flagged',
  auto_hide: 'Content auto-hidden',
};

function capitalizeWord(word: string): string {
  if (!word) return word;
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}

function formatEventTypeFallback(eventType: string): string {
  return eventType
    .split(/[._]/)
    .filter(Boolean)
    .map((word) => (ACRONYMS.has(word.toLowerCase()) ? word.toUpperCase() : capitalizeWord(word)))
    .join(' ');
}

export function formatAuditEventLabel(eventType: string, source: AuditActivityLabels['source']): string {
  const map = source === 'moderation' ? MODERATION_EVENT_LABELS : USER_EVENT_LABELS;
  return map[eventType] ?? formatEventTypeFallback(eventType);
}

export function formatAuditUserLabel(input?: {
  displayName?: string | null;
  email?: string | null;
} | null): string | undefined {
  if (!input) return undefined;
  const name = input.displayName?.trim();
  const email = input.email?.trim();
  if (name && email) return `${name} (${email})`;
  return name || email || undefined;
}

function asString(value: unknown): string | undefined {
  if (typeof value === 'string' && value.trim()) return value.trim();
  return undefined;
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
}

function formatMetadataDetail(
  eventType: string,
  source: AuditActivityLabels['source'],
  metadata?: Record<string, unknown>,
): string | undefined {
  if (!metadata || Object.keys(metadata).length === 0) return undefined;

  const fields = asStringArray(metadata.fields);
  if (fields.length > 0) {
    const label = eventType === 'settings_updated' ? 'Settings changed' : 'Fields changed';
    return `${label}: ${fields.join(', ')}`;
  }

  const role = asString(metadata.role) ?? asString(metadata.roleCode);
  const previousRole = asString(metadata.previousRole);
  if (eventType === 'role_changed') {
    if (previousRole && role) return `Role: ${previousRole} → ${role}`;
    if (role) return `New role: ${role}`;
  }

  const status = asString(metadata.status);
  const previousStatus = asString(metadata.previousStatus);
  if (eventType === 'status_changed') {
    if (previousStatus && status) return `Status: ${previousStatus} → ${status}`;
    if (status) return `New status: ${status}`;
  }

  const reason = asString(metadata.reason);
  if (reason) return `Reason: ${reason}`;

  const phone = asString(metadata.phone);
  if (phone && (eventType === 'phone_changed' || eventType === 'phone_change_otp_sent')) {
    return `Phone: ${phone}`;
  }

  if (typeof metadata.customPlatformFeePercent === 'number') {
    return `Custom seller fee: ${metadata.customPlatformFeePercent}%`;
  }

  const notes = metadata.notes === true ? 'Review notes added' : asString(metadata.notes);
  if (notes && eventType === 'report_reviewed') return notes;

  if (source === 'moderation' && metadata.metadata && typeof metadata.metadata === 'object') {
    const nested = formatMetadataDetail(eventType, source, metadata.metadata as Record<string, unknown>);
    if (nested) return nested;
  }

  const summary = asString(metadata.summary) ?? asString(metadata.message);
  if (summary) return summary;

  return undefined;
}

export function formatAuditActivityDetail(event: AuditActivityLabels): string {
  const parts: string[] = [];

  const metaDetail = formatMetadataDetail(event.eventType, event.source, event.metadata);
  if (metaDetail) parts.push(metaDetail);

  const actor = event.actorLabel;
  const target = event.targetLabel;
  const subject = event.subjectLabel;

  if (actor && target && actor === target) {
    parts.push(`By ${actor}`);
  } else {
    if (actor) parts.push(`By ${actor}`);
    if (target) parts.push(`User: ${target}`);
    else if (subject) parts.push(`User: ${subject}`);
  }

  return parts.length > 0 ? parts.join(' · ') : '—';
}
