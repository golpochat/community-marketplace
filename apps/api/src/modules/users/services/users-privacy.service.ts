import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';

import type { AccountDataExport } from '@community-marketplace/types';

import { assertBootstrapSuperAdminImmutable } from '../../../common/constants/bootstrap-users';
import { PrismaService } from '../../../database/prisma.service';
import { SessionService } from '../../auth/services/session.service';
import { UserAuditService } from './user-audit.service';

const OPEN_LISTING_STATUSES = [
  'draft',
  'pending_review',
  'active',
  'paused',
  'reserved',
  'flagged',
  'under_investigation',
  'suspended_seller',
] as const;

@Injectable()
export class UsersPrivacyService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: UserAuditService,
    private readonly sessions: SessionService,
  ) {}

  async exportAccount(userId: string): Promise<{ filename: string; body: Buffer }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        primaryRole: { select: { code: true } },
        profile: true,
        settings: true,
      },
    });
    if (!user) throw new NotFoundException('User not found');

    const [listings, buyerPayments, sellerPayments, buyerThreads, sellerThreads, stores, sellerReviewsGiven, sellerReviewsReceived, buyerReviewsGiven, buyerReviewsReceived] =
      await Promise.all([
        this.prisma.listing.findMany({
          where: { sellerId: userId },
          select: {
            id: true,
            title: true,
            status: true,
            price: true,
            currency: true,
            createdAt: true,
            updatedAt: true,
          },
          take: 500,
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.payment.findMany({
          where: { buyerId: userId },
          select: { id: true, status: true, amount: true, currency: true, createdAt: true },
          take: 200,
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.payment.findMany({
          where: { sellerId: userId },
          select: { id: true, status: true, amount: true, currency: true, createdAt: true },
          take: 200,
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.chatThread.findMany({
          where: { buyerId: userId },
          select: { id: true, listingId: true, createdAt: true },
          take: 200,
        }),
        this.prisma.chatThread.findMany({
          where: { sellerId: userId },
          select: { id: true, listingId: true, createdAt: true },
          take: 200,
        }),
        this.prisma.store.findMany({
          where: { userId },
          select: { id: true, name: true, slug: true, createdAt: true },
        }),
        this.prisma.sellerReview.findMany({
          where: { buyerId: userId },
          select: { id: true, rating: true, createdAt: true },
          take: 100,
        }),
        this.prisma.sellerReview.findMany({
          where: { sellerId: userId },
          select: { id: true, rating: true, createdAt: true },
          take: 100,
        }),
        this.prisma.buyerReview.findMany({
          where: { sellerId: userId },
          select: { id: true, rating: true, createdAt: true },
          take: 100,
        }),
        this.prisma.buyerReview.findMany({
          where: { buyerId: userId },
          select: { id: true, rating: true, createdAt: true },
          take: 100,
        }),
      ]);

    const payload: AccountDataExport = {
      exportedAt: new Date().toISOString(),
      account: {
        id: user.id,
        email: user.email,
        displayName: user.displayName ?? undefined,
        role: user.primaryRole.code,
        status: user.status,
        createdAt: user.createdAt.toISOString(),
      },
      profile: user.profile
        ? {
            bio: user.profile.bio,
            location: user.profile.location,
            communityArea: user.profile.communityArea,
            phone: user.profile.phone,
            businessName: user.profile.businessName,
          }
        : undefined,
      settings: user.settings
        ? {
            notificationPreferences: user.settings.notificationPreferences,
            privacySettings: user.settings.privacySettings,
            communicationPreferences: user.settings.communicationPreferences,
            deletionRequestedAt: user.settings.deletionRequestedAt?.toISOString(),
          }
        : undefined,
      listings: listings.map((row) => ({
        id: row.id,
        title: row.title,
        status: row.status,
        price: Number(row.price),
        currency: row.currency,
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
      })),
      payments: [
        ...buyerPayments.map((row) => ({
          id: row.id,
          role: 'buyer',
          status: row.status,
          amount: Number(row.amount),
          currency: row.currency,
          createdAt: row.createdAt.toISOString(),
        })),
        ...sellerPayments.map((row) => ({
          id: row.id,
          role: 'seller',
          status: row.status,
          amount: Number(row.amount),
          currency: row.currency,
          createdAt: row.createdAt.toISOString(),
        })),
      ],
      chatThreads: [...buyerThreads, ...sellerThreads].map((row) => ({
        id: row.id,
        listingId: row.listingId,
        createdAt: row.createdAt.toISOString(),
      })),
      stores: stores.map((row) => ({
        id: row.id,
        name: row.name,
        slug: row.slug,
        createdAt: row.createdAt.toISOString(),
      })),
      reviews: {
        given: [...sellerReviewsGiven, ...buyerReviewsGiven].map((row) => ({
          id: row.id,
          rating: row.rating,
          createdAt: row.createdAt.toISOString(),
        })),
        received: [...sellerReviewsReceived, ...buyerReviewsReceived].map((row) => ({
          id: row.id,
          rating: row.rating,
          createdAt: row.createdAt.toISOString(),
        })),
      },
    };

    await this.audit.record('data_exported', userId, userId);

    const body = Buffer.from(`${JSON.stringify(payload, null, 2)}\n`, 'utf8');
    return { filename: `sellnearby-data-export-${userId.slice(0, 8)}.json`, body };
  }

  async requestDeletion(userId: string) {
    assertBootstrapSuperAdminImmutable(userId);

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { primaryRole: true, settings: true, profile: true },
    });
    if (!user) throw new NotFoundException('User not found');

    const roleCode = user.primaryRole.code;
    if (roleCode === 'SUPER_ADMIN' || roleCode === 'ADMIN') {
      throw new ForbiddenException(
        'Platform operator accounts cannot be self-deactivated. Contact a Super Admin to revoke admin access.',
      );
    }

    if (user.settings?.deletionRequestedAt) {
      return {
        deletionRequestedAt: user.settings.deletionRequestedAt.toISOString(),
        message:
          'Account deletion is already in progress. Financial records are kept where Irish law requires.',
      };
    }

    const now = new Date();
    const anonymizedEmail = `deleted-${userId}@deleted.sellnearby.invalid`;

    await this.prisma.$transaction(async (tx) => {
      await tx.userSettings.upsert({
        where: { userId },
        create: {
          userId,
          deletionRequestedAt: now,
        },
        update: { deletionRequestedAt: now },
      });

      await tx.user.update({
        where: { id: userId },
        data: {
          status: 'inactive',
          email: anonymizedEmail,
          displayName: 'Deleted user',
          avatarUrl: null,
          passwordHash: null,
        },
      });

      if (user.profile) {
        await tx.userProfile.update({
          where: { userId },
          data: {
            bio: null,
            address: null,
            location: null,
            phone: null,
            dateOfBirth: null,
            legalName: null,
            businessWebsite: null,
            latitude: null,
            longitude: null,
          },
        });
      }

      await tx.listing.updateMany({
        where: { sellerId: userId, status: { in: [...OPEN_LISTING_STATUSES] } },
        data: { status: 'ended', endedAt: now },
      });

      await tx.deviceToken.deleteMany({ where: { userId } });
    });

    await this.sessions.revokeAllForUser(userId);
    await this.audit.record('deletion_requested', userId, userId, { status: 'inactive' });
    await this.audit.record('status_changed', userId, userId, {
      previousStatus: user.status,
      status: 'inactive',
      reason: 'gdpr_erasure',
    });

    return {
      deletionRequestedAt: now.toISOString(),
      message:
        'Your account is deactivated and personal profile data is removed. Payment records are retained where Irish law requires. You will be signed out.',
    };
  }
}
