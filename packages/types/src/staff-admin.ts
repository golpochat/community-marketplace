export const STAFF_ROLE_CHANGE_REASONS = [
  'scope_change',
  'promotion',
  'demotion',
  'team_restructure',
  'coverage_backup',
  'offboarding_prep',
  'other',
] as const;

export type StaffRoleChangeReason = (typeof STAFF_ROLE_CHANGE_REASONS)[number];

export const STAFF_ROLE_CHANGE_REASON_LABELS: Record<StaffRoleChangeReason, string> = {
  scope_change: 'Scope / responsibility change',
  promotion: 'Promotion',
  demotion: 'Demotion / reduced access',
  team_restructure: 'Team restructure',
  coverage_backup: 'Coverage / backup assignment',
  offboarding_prep: 'Offboarding preparation',
  other: 'Other',
};

export const STAFF_STATUS_CHANGE_REASONS = [
  'leave_of_absence',
  'policy_violation',
  'security_review',
  'account_compromise',
  'return_to_active',
  'end_of_contract',
  'other',
] as const;

export type StaffStatusChangeReason = (typeof STAFF_STATUS_CHANGE_REASONS)[number];

export const STAFF_STATUS_CHANGE_REASON_LABELS: Record<StaffStatusChangeReason, string> = {
  leave_of_absence: 'Leave of absence',
  policy_violation: 'Policy violation',
  security_review: 'Security review',
  account_compromise: 'Suspected account compromise',
  return_to_active: 'Return to active duty',
  end_of_contract: 'End of contract',
  other: 'Other',
};

export interface StaffAdminAuditEntry {
  id: string;
  eventType: 'role_changed' | 'status_changed' | 'password_reset_sent';
  actorId?: string;
  actorLabel?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface StaffAdminDetail {
  profile: {
    id: string;
    email: string;
    displayName?: string;
    role: string;
    status: string;
    createdAt: string;
    updatedAt: string;
  };
  auditHistory: StaffAdminAuditEntry[];
}
