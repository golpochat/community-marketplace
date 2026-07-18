import type { RbacRole, Role, UserEffectivePermissions, UserPermission } from './rbac';
import type { SellerStatus } from './seller-verification';

export type { RbacRole, RoleCode, UserRole } from './rbac';

export type UserStatus = 'active' | 'inactive' | 'suspended';

export type UserGender = 'male' | 'female' | 'other' | 'prefer_not_to_say';

export type VerificationStatus = 'pending' | 'approved' | 'rejected';

export type UserAuditEventType =
  | 'profile_update'
  | 'profile_completed'
  | 'verification_submitted'
  | 'verification_approved'
  | 'verification_rejected'
  | 'role_changed'
  | 'status_changed'
  | 'password_reset_sent'
  | 'permission_granted'
  | 'permission_revoked'
  | 'user_suspended'
  | 'user_unsuspended'
  | 'user_banned'
  | 'user_unbanned'
  | 'settings_updated'
  | 'deletion_requested'
  | 'avatar_uploaded'
  | 'store_banner_uploaded'
  | 'phone_change_otp_sent'
  | 'phone_changed';

export interface UserLocation {
  latitude?: number;
  longitude?: number;
  label?: string;
}

export interface User {
  id: string;
  email: string;
  displayName?: string;
  avatarUrl?: string;
  primaryRoleId: string;
  role: RbacRole;
  status: UserStatus;
  emailVerified: boolean;
  phoneVerified: boolean;
  profileCompleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfileDetails {
  bio?: string;
  address?: string;
  location?: UserLocation;
  phone?: string;
  dateOfBirth?: string;
  gender?: UserGender;
  storeBannerUrl?: string;
}

export interface UserProfile extends User, UserProfileDetails {
  /** Seller identity verification lifecycle (canonical). */
  sellerStatus?: SellerStatus;
  idVerified?: boolean;
  verificationStatus?: VerificationStatus;
  /** True when seller is identity-verified (sellerStatus / idVerified / legacy badge). */
  verificationBadge?: boolean;
}

export interface UserVerification {
  id: string;
  userId: string;
  status: VerificationStatus;
  idDocumentFrontUrl?: string;
  idDocumentBackUrl?: string;
  selfieUrl?: string;
  addressProofUrl?: string;
  reviewedById?: string;
  reviewedAt?: string;
  rejectionReason?: string;
  badgeGranted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationPreferences {
  email?: boolean;
  push?: boolean;
  inApp?: boolean;
  sms?: boolean;
  marketing?: boolean;
  listingUpdates?: boolean;
  messageAlerts?: boolean;
  events?: Partial<Record<string, boolean>>;
}

export interface PrivacySettings {
  showEmail?: boolean;
  showPhone?: boolean;
  showLocation?: boolean;
  profileVisibility?: 'public' | 'members' | 'private';
}

export interface CommunicationPreferences {
  preferredChannel?: 'email' | 'sms' | 'push';
  language?: string;
  timezone?: string;
}

export interface UserSettings {
  userId: string;
  notificationPreferences: NotificationPreferences;
  privacySettings: PrivacySettings;
  communicationPreferences: CommunicationPreferences;
  deletionRequestedAt?: string;
  updatedAt: string;
}

export interface UserBan {
  id: string;
  userId: string;
  type: 'temporary' | 'permanent';
  reason?: string;
  bannedById?: string;
  expiresAt?: string;
  liftedAt?: string;
  createdAt: string;
}

export interface UserAuditLog {
  id: string;
  eventType: UserAuditEventType;
  actorId?: string;
  targetUserId?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface UserWithRole extends User {
  primaryRole?: Role;
}

export interface UserWithPermissions extends UserWithRole {
  permissionOverrides?: UserPermission[];
  effectivePermissions?: UserEffectivePermissions;
}

export interface AvatarUploadUrlResponse {
  uploadUrl: string;
  publicUrl: string;
  key: string;
  expiresInSeconds: number;
}

export interface UserListFilters {
  role?: RbacRole;
  status?: UserStatus;
  verificationStatus?: VerificationStatus;
  search?: string;
  page?: number;
  limit?: number;
}
