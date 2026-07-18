import type { Prisma } from '@prisma/client';

import type {
  RbacRole,
  SellerStatus,
  User,
  UserProfile,
  UserProfileDetails,
  UserVerification,
  VerificationStatus,
} from '@community-marketplace/types';
import { isSellerVerified } from '@community-marketplace/types';

import { resolveOptionalAssetPublicUrl } from '../../../libs/asset-url.lib';

type DbUser = Prisma.UserGetPayload<{
  include: {
    primaryRole: true;
    profile: true;
    verifications: { orderBy: { createdAt: 'desc' }; take: 1 };
  };
}>;

type DbVerification = Prisma.UserVerificationGetPayload<object>;

export function mapUser(
  dbUser: Prisma.UserGetPayload<{ include: { primaryRole: true } }>,
): User {
  return {
    id: dbUser.id,
    email: dbUser.email,
    displayName: dbUser.displayName ?? undefined,
    avatarUrl: resolveOptionalAssetPublicUrl(dbUser.avatarUrl),
    primaryRoleId: dbUser.primaryRoleId,
    role: dbUser.primaryRole.code as RbacRole,
    status: dbUser.status,
    emailVerified: Boolean(dbUser.emailVerifiedAt),
    phoneVerified: Boolean(dbUser.phoneVerifiedAt),
    profileCompleted: dbUser.profileCompleted,
    createdAt: dbUser.createdAt.toISOString(),
    updatedAt: dbUser.updatedAt.toISOString(),
  };
}

export function mapProfileDetails(
  profile: Prisma.UserProfileGetPayload<object> | null | undefined,
): UserProfileDetails {
  if (!profile) return {};

  return {
    bio: profile.bio ?? undefined,
    address: profile.address ?? undefined,
    phone: profile.phone ?? undefined,
    dateOfBirth: profile.dateOfBirth
      ? profile.dateOfBirth.toISOString().slice(0, 10)
      : undefined,
    gender: profile.gender ?? undefined,
    location:
      profile.latitude != null || profile.longitude != null || profile.location
        ? {
            latitude: profile.latitude != null ? Number(profile.latitude) : undefined,
            longitude: profile.longitude != null ? Number(profile.longitude) : undefined,
            label: profile.location ?? undefined,
          }
        : undefined,
    storeBannerUrl: resolveOptionalAssetPublicUrl(profile.storeBannerUrl),
  };
}

export function mapUserProfile(dbUser: DbUser): UserProfile {
  const latestVerification = dbUser.verifications?.[0];
  const legacyBadge = Boolean(latestVerification?.badgeGranted);
  const sellerStatus = dbUser.sellerStatus as SellerStatus;
  const sellerVerified = isSellerVerified(sellerStatus) || Boolean(dbUser.idVerified);

  return {
    ...mapUser(dbUser),
    ...mapProfileDetails(dbUser.profile),
    sellerStatus,
    idVerified: Boolean(dbUser.idVerified),
    verificationStatus: latestVerification?.status as VerificationStatus | undefined,
    verificationBadge: sellerVerified || legacyBadge,
  };
}

export function mapVerification(db: DbVerification): UserVerification {
  return {
    id: db.id,
    userId: db.userId,
    status: db.status as VerificationStatus,
    idDocumentFrontUrl: resolveOptionalAssetPublicUrl(db.idDocumentFrontUrl),
    idDocumentBackUrl: resolveOptionalAssetPublicUrl(db.idDocumentBackUrl),
    selfieUrl: resolveOptionalAssetPublicUrl(db.selfieUrl),
    addressProofUrl: resolveOptionalAssetPublicUrl(db.addressProofUrl),
    reviewedById: db.reviewedById ?? undefined,
    reviewedAt: db.reviewedAt?.toISOString(),
    rejectionReason: db.rejectionReason ?? undefined,
    badgeGranted: db.badgeGranted,
    createdAt: db.createdAt.toISOString(),
    updatedAt: db.updatedAt.toISOString(),
  };
}

export const userProfileInclude = {
  primaryRole: true,
  profile: true,
  verifications: {
    orderBy: { createdAt: 'desc' as const },
    take: 1,
  },
} satisfies Prisma.UserInclude;
