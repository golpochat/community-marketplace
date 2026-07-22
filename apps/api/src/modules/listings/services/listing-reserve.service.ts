import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  LISTING_RESERVE_DEFAULT_WINDOW_HOURS,
  LISTING_RESERVE_PENDING_TTL_HOURS,
  LISTING_RESERVE_WINDOW_HOURS,
  isSellerVerified,
  type ListingReserve,
  type ListingReservationSummary,
  type ListingReserveWindowHours,
  type SellerStatus,
} from '@community-marketplace/types';

import { PrismaService } from '../../../database/prisma.service';
import { EventBusService } from '../../../events/event-bus.service';
import { ChatMessagesService } from '../../chat/services/chat-messages.service';
import { NotificationsService } from '../../notifications/notifications.service';

const OPEN_STATUSES = ['pending_seller', 'active'] as const;

function mapReserve(row: {
  id: string;
  listingId: string;
  buyerId: string;
  sellerId: string;
  status: string;
  windowHours: number | null;
  requestedAt: Date;
  decisionAt: Date | null;
  startsAt: Date | null;
  expiresAt: Date | null;
  pendingExpiresAt: Date;
  listingPriceSnapshot: { toString(): string } | number | null;
  createdAt: Date;
  updatedAt: Date;
  listing?: { title?: string; images?: Array<{ url: string }> } | null;
  buyer?: { displayName?: string | null; email?: string } | null;
}): ListingReserve {
  return {
    id: row.id,
    listingId: row.listingId,
    buyerId: row.buyerId,
    sellerId: row.sellerId,
    status: row.status as ListingReserve['status'],
    windowHours: row.windowHours ?? undefined,
    requestedAt: row.requestedAt.toISOString(),
    decisionAt: row.decisionAt?.toISOString(),
    startsAt: row.startsAt?.toISOString(),
    expiresAt: row.expiresAt?.toISOString(),
    pendingExpiresAt: row.pendingExpiresAt.toISOString(),
    listingPriceSnapshot:
      row.listingPriceSnapshot != null
        ? Number(row.listingPriceSnapshot)
        : undefined,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    listingTitle: row.listing?.title,
    listingImageUrl: row.listing?.images?.[0]?.url,
    buyerDisplayName: row.buyer?.displayName ?? undefined,
    buyerEmail: row.buyer?.email,
  };
}

function normalizeWindowHours(value: number | null | undefined): ListingReserveWindowHours {
  if (value === 4 || value === 12 || value === 24) return value;
  return LISTING_RESERVE_DEFAULT_WINDOW_HOURS;
}

@Injectable()
export class ListingReserveService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventBus: EventBusService,
    private readonly chatMessages: ChatMessagesService,
    private readonly notifications: NotificationsService,
  ) {}

  async request(buyerId: string, listingId: string): Promise<ListingReserve> {
    const buyer = await this.prisma.user.findUnique({
      where: { id: buyerId },
      select: { id: true, status: true, sellerStatus: true },
    });
    if (!buyer || buyer.status !== 'active') {
      throw new ForbiddenException('Account is not eligible to reserve');
    }
    if (!isSellerVerified(buyer.sellerStatus as SellerStatus)) {
      throw new ForbiddenException(
        'Complete identity verification to request a reservation.',
      );
    }

    const listing = await this.prisma.listing.findUnique({
      where: { id: listingId },
      select: {
        id: true,
        sellerId: true,
        status: true,
        price: true,
        title: true,
        reserveWindowHours: true,
      },
    });
    if (!listing) throw new NotFoundException('Listing not found');
    if (listing.sellerId === buyerId) {
      throw new BadRequestException('You cannot reserve your own listing');
    }
    if (listing.status !== 'active') {
      throw new BadRequestException('Listing is not available to reserve');
    }

    const open = await this.prisma.listingReserve.findFirst({
      where: { listingId, status: { in: [...OPEN_STATUSES] } },
    });
    if (open) {
      throw new BadRequestException(
        open.status === 'pending_seller'
          ? 'This listing already has a pending reservation request'
          : 'This listing is already reserved',
      );
    }

    const now = new Date();
    const pendingExpiresAt = new Date(
      now.getTime() + LISTING_RESERVE_PENDING_TTL_HOURS * 60 * 60 * 1000,
    );

    const row = await this.prisma.listingReserve.create({
      data: {
        listingId,
        buyerId,
        sellerId: listing.sellerId,
        status: 'pending_seller',
        pendingExpiresAt,
        listingPriceSnapshot: listing.price,
      },
      include: {
        listing: { select: { title: true, images: { orderBy: { sortOrder: 'asc' }, take: 1 } } },
        buyer: { select: { displayName: true, email: true } },
      },
    });

    await this.notify(
      listing.sellerId,
      'Reservation request',
      `Someone requested to reserve "${listing.title}". Approve or decline within ${LISTING_RESERVE_PENDING_TTL_HOURS} hours.`,
      `/seller/listings/${listingId}`,
    );

    this.eventBus.publish({
      type: 'listing.reserve_requested',
      payload: { reserveId: row.id, listingId, buyerId, sellerId: listing.sellerId },
      timestamp: new Date(),
    });

    return mapReserve(row);
  }

  async listMine(buyerId: string): Promise<ListingReserve[]> {
    const rows = await this.prisma.listingReserve.findMany({
      where: { buyerId },
      orderBy: { updatedAt: 'desc' },
      take: 50,
      include: {
        listing: { select: { title: true, images: { orderBy: { sortOrder: 'asc' }, take: 1 } } },
      },
    });
    return rows.map(mapReserve);
  }

  async listPendingForSeller(sellerId: string): Promise<ListingReserve[]> {
    const rows = await this.prisma.listingReserve.findMany({
      where: { sellerId, status: 'pending_seller' },
      orderBy: { requestedAt: 'asc' },
      include: {
        listing: { select: { title: true, images: { orderBy: { sortOrder: 'asc' }, take: 1 } } },
        buyer: { select: { displayName: true, email: true } },
      },
    });
    return rows.map(mapReserve);
  }

  async cancelByBuyer(buyerId: string, reserveId: string): Promise<ListingReserve> {
    const row = await this.requireReserve(reserveId);
    if (row.buyerId !== buyerId) throw new ForbiddenException('Not your reservation');
    if (row.status !== 'pending_seller' && row.status !== 'active') {
      throw new BadRequestException('Reservation cannot be cancelled');
    }

    const wasActive = row.status === 'active';
    const updated = await this.prisma.listingReserve.update({
      where: { id: reserveId },
      data: { status: 'cancelled_buyer', decisionAt: row.decisionAt ?? new Date() },
      include: {
        listing: { select: { title: true, images: { orderBy: { sortOrder: 'asc' }, take: 1 } } },
      },
    });

    if (wasActive) {
      await this.releaseListingToActive(row.listingId);
      await this.notify(
        row.sellerId,
        'Reservation cancelled',
        'The buyer cancelled their reservation. Your listing is available again.',
        `/seller/listings/${row.listingId}`,
      );
    }

    return mapReserve(updated);
  }

  async approve(sellerId: string, reserveId: string): Promise<ListingReserve> {
    const row = await this.requireReserve(reserveId);
    if (row.sellerId !== sellerId) throw new ForbiddenException('Not your listing');
    if (row.status !== 'pending_seller') {
      throw new BadRequestException('Reservation is not awaiting approval');
    }
    if (row.pendingExpiresAt.getTime() <= Date.now()) {
      throw new BadRequestException('This request has already expired');
    }

    const listing = await this.prisma.listing.findUnique({
      where: { id: row.listingId },
      select: { status: true, reserveWindowHours: true, title: true, price: true },
    });
    if (!listing || listing.status !== 'active') {
      throw new BadRequestException('Listing is no longer available to reserve');
    }

    const windowHours = normalizeWindowHours(listing.reserveWindowHours);
    const now = new Date();
    const expiresAt = new Date(now.getTime() + windowHours * 60 * 60 * 1000);

    const [, updated] = await this.prisma.$transaction([
      this.prisma.listing.update({
        where: { id: row.listingId },
        data: { status: 'reserved' },
      }),
      this.prisma.listingReserve.update({
        where: { id: reserveId },
        data: {
          status: 'active',
          decisionAt: now,
          startsAt: now,
          expiresAt,
          windowHours,
          listingPriceSnapshot: listing.price,
        },
        include: {
          listing: { select: { title: true, images: { orderBy: { sortOrder: 'asc' }, take: 1 } } },
          buyer: { select: { displayName: true, email: true } },
        },
      }),
    ]);

    await this.prisma.listingStatusChangeLog.create({
      data: {
        listingId: row.listingId,
        fromStatus: 'active',
        toStatus: 'reserved',
        changedByType: 'SELLER',
        changedById: sellerId,
        reason: 'reserve_approved',
      },
    });

    await this.openChatWithSystemLine(
      row.buyerId,
      row.sellerId,
      row.listingId,
      `Reservation approved. This listing is held exclusively for ${windowHours} hours (until ${expiresAt.toLocaleString()}). Complete Buy now before the hold ends.`,
    );

    await this.notify(
      row.buyerId,
      'Reservation approved',
      `"${listing.title}" is held for you until ${expiresAt.toLocaleString()}. Complete Buy now before then.`,
      `/listings/${row.listingId}`,
    );

    this.eventBus.publish({
      type: 'listing.reserve_approved',
      payload: { reserveId, listingId: row.listingId, buyerId: row.buyerId, sellerId },
      timestamp: new Date(),
    });
    this.eventBus.publish({
      type: 'listing.updated',
      payload: { listingId: row.listingId },
      timestamp: new Date(),
    });

    return mapReserve(updated);
  }

  async decline(sellerId: string, reserveId: string): Promise<ListingReserve> {
    const row = await this.requireReserve(reserveId);
    if (row.sellerId !== sellerId) throw new ForbiddenException('Not your listing');
    if (row.status !== 'pending_seller') {
      throw new BadRequestException('Reservation is not awaiting a decision');
    }

    const updated = await this.prisma.listingReserve.update({
      where: { id: reserveId },
      data: { status: 'declined', decisionAt: new Date() },
      include: {
        listing: { select: { title: true, images: { orderBy: { sortOrder: 'asc' }, take: 1 } } },
      },
    });

    await this.notify(
      row.buyerId,
      'Reservation declined',
      'The seller declined your reservation request.',
      `/listings/${row.listingId}`,
    );

    return mapReserve(updated);
  }

  async cancelBySeller(sellerId: string, reserveId: string): Promise<ListingReserve> {
    const row = await this.requireReserve(reserveId);
    if (row.sellerId !== sellerId) throw new ForbiddenException('Not your listing');
    if (row.status !== 'active' && row.status !== 'pending_seller') {
      throw new BadRequestException('Reservation cannot be cancelled');
    }

    const wasActive = row.status === 'active';
    const updated = await this.prisma.listingReserve.update({
      where: { id: reserveId },
      data: { status: 'cancelled_seller', decisionAt: new Date() },
      include: {
        listing: { select: { title: true, images: { orderBy: { sortOrder: 'asc' }, take: 1 } } },
      },
    });

    if (wasActive) {
      await this.releaseListingToActive(row.listingId);
    }

    await this.notify(
      row.buyerId,
      'Reservation cancelled',
      'The seller cancelled the reservation. The listing is available again.',
      `/listings/${row.listingId}`,
    );

    return mapReserve(updated);
  }

  /** Cancel open reserves when listing is sold / paused / removed. */
  async cancelOpenForListing(
    listingId: string,
    reason: 'cancelled_seller' | 'converted',
  ): Promise<void> {
    const open = await this.prisma.listingReserve.findMany({
      where: { listingId, status: { in: [...OPEN_STATUSES] } },
    });
    if (open.length === 0) return;

    const now = new Date();
    await this.prisma.listingReserve.updateMany({
      where: { listingId, status: { in: [...OPEN_STATUSES] } },
      data: {
        status: reason,
        decisionAt: now,
      },
    });

    if (reason === 'cancelled_seller') {
      for (const row of open) {
        await this.notify(
          row.buyerId,
          'Reservation cancelled',
          'This listing is no longer available for your reservation.',
          `/listings/${listingId}`,
        );
      }
    }
  }

  async markConvertedForListing(listingId: string, buyerId: string): Promise<void> {
    const active = await this.prisma.listingReserve.findFirst({
      where: { listingId, buyerId, status: 'active' },
    });
    if (!active) {
      // Other buyer bought while pending — cancel pending
      await this.cancelOpenForListing(listingId, 'cancelled_seller');
      return;
    }
    await this.prisma.listingReserve.update({
      where: { id: active.id },
      data: { status: 'converted', decisionAt: new Date() },
    });
  }

  async expireDue(): Promise<{ pending: number; active: number }> {
    const now = new Date();

    const pendingDue = await this.prisma.listingReserve.findMany({
      where: { status: 'pending_seller', pendingExpiresAt: { lte: now } },
      select: { id: true, buyerId: true, listingId: true },
    });
    for (const row of pendingDue) {
      await this.prisma.listingReserve.update({
        where: { id: row.id },
        data: { status: 'expired_pending', decisionAt: now },
      });
      await this.notify(
        row.buyerId,
        'Seller did not respond',
        'Your reservation request expired because the seller did not respond in time.',
        `/listings/${row.listingId}`,
      );
    }

    const activeDue = await this.prisma.listingReserve.findMany({
      where: { status: 'active', expiresAt: { lte: now } },
      select: { id: true, buyerId: true, sellerId: true, listingId: true },
    });
    for (const row of activeDue) {
      await this.prisma.listingReserve.update({
        where: { id: row.id },
        data: { status: 'expired' },
      });
      const listing = await this.prisma.listing.findUnique({
        where: { id: row.listingId },
        select: { status: true },
      });
      if (listing?.status === 'reserved') {
        await this.releaseListingToActive(row.listingId);
      }
      await this.notify(
        row.buyerId,
        'Reservation expired',
        'Your reservation hold ended. The listing is available again.',
        `/listings/${row.listingId}`,
      );
      await this.notify(
        row.sellerId,
        'Reservation expired',
        'The reservation hold ended. Your listing is available again.',
        `/seller/listings/${row.listingId}`,
      );
    }

    return { pending: pendingDue.length, active: activeDue.length };
  }

  /**
   * Reminder nudges (idempotent per reserve via actionUrl dedupe):
   * - Hold ending soon: T-2h when window ≥ 4h (buyer)
   * - Pending seller: within 45 minutes of pending deadline (seller)
   */
  async sendReminders(): Promise<{ holdEnding: number; pendingSeller: number }> {
    const now = new Date();
    let holdEnding = 0;
    let pendingSeller = 0;

    const holdSoonEnd = new Date(now.getTime() + 2 * 60 * 60 * 1000);
    const activeHolds = await this.prisma.listingReserve.findMany({
      where: {
        status: 'active',
        windowHours: { gte: 4 },
        expiresAt: { gt: now, lte: holdSoonEnd },
      },
      select: {
        id: true,
        buyerId: true,
        listingId: true,
        expiresAt: true,
        listing: { select: { title: true } },
      },
    });

    for (const row of activeHolds) {
      const actionUrl = `/listings/${row.listingId}?reserveReminder=hold`;
      const already = await this.prisma.notification.findFirst({
        where: {
          userId: row.buyerId,
          type: 'system',
          actionUrl,
          createdAt: { gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) },
        },
        select: { id: true },
      });
      if (already) continue;

      await this.notify(
        row.buyerId,
        'Reservation ending soon',
        `"${row.listing.title}" hold ends soon. Complete Buy now before it expires.`,
        actionUrl,
      );
      holdEnding += 1;
    }

    const pendingSoonEnd = new Date(now.getTime() + 45 * 60 * 1000);
    const pendingRows = await this.prisma.listingReserve.findMany({
      where: {
        status: 'pending_seller',
        pendingExpiresAt: { gt: now, lte: pendingSoonEnd },
      },
      select: {
        id: true,
        sellerId: true,
        listingId: true,
        listing: { select: { title: true } },
        buyer: { select: { displayName: true, email: true } },
      },
    });

    for (const row of pendingRows) {
      const actionUrl = `/account/listings?reserveReminder=pending&id=${row.id}`;
      const already = await this.prisma.notification.findFirst({
        where: {
          userId: row.sellerId,
          type: 'system',
          actionUrl,
          createdAt: { gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) },
        },
        select: { id: true },
      });
      if (already) continue;

      const buyerLabel = row.buyer.displayName?.trim() || row.buyer.email || 'A buyer';
      await this.notify(
        row.sellerId,
        'Reservation request expiring soon',
        `${buyerLabel} is waiting on “${row.listing.title}”. Approve or decline before the request expires.`,
        actionUrl,
      );
      pendingSeller += 1;
    }

    return { holdEnding, pendingSeller };
  }

  async getSummaryForListing(
    listingId: string,
    viewerId?: string,
  ): Promise<ListingReservationSummary> {
    const listing = await this.prisma.listing.findUnique({
      where: { id: listingId },
      select: {
        id: true,
        sellerId: true,
        status: true,
        reserveWindowHours: true,
      },
    });
    if (!listing) {
      return {
        canRequest: false,
        blockReason: 'not_active',
        reserveWindowHours: LISTING_RESERVE_DEFAULT_WINDOW_HOURS,
        iAmReservingBuyer: false,
      };
    }

    const windowHours = normalizeWindowHours(listing.reserveWindowHours);
    const open = await this.prisma.listingReserve.findFirst({
      where: { listingId, status: { in: [...OPEN_STATUSES] } },
      include: {
        listing: { select: { title: true, images: { orderBy: { sortOrder: 'asc' }, take: 1 } } },
        buyer: { select: { displayName: true, email: true } },
      },
    });

    const active = open?.status === 'active' ? mapReserve(open) : null;
    const mine =
      viewerId && open && open.buyerId === viewerId ? mapReserve(open) : null;
    const iAmReservingBuyer = Boolean(
      viewerId && active && active.buyerId === viewerId,
    );

    if (!viewerId) {
      return {
        canRequest: false,
        blockReason: 'unauthenticated',
        reserveWindowHours: windowHours,
        active,
        mine: null,
        iAmReservingBuyer: false,
      };
    }

    if (viewerId === listing.sellerId) {
      return {
        canRequest: false,
        blockReason: 'own_listing',
        reserveWindowHours: windowHours,
        active,
        mine: null,
        iAmReservingBuyer: false,
      };
    }

    if (listing.status === 'reserved') {
      return {
        canRequest: false,
        blockReason: iAmReservingBuyer ? 'already_reserved' : 'reserved_by_other',
        reserveWindowHours: windowHours,
        active,
        mine,
        iAmReservingBuyer,
      };
    }

    if (listing.status !== 'active') {
      return {
        canRequest: false,
        blockReason: 'not_active',
        reserveWindowHours: windowHours,
        active,
        mine,
        iAmReservingBuyer: false,
      };
    }

    if (open?.status === 'pending_seller') {
      return {
        canRequest: false,
        blockReason: 'already_pending',
        reserveWindowHours: windowHours,
        active: null,
        mine,
        iAmReservingBuyer: false,
      };
    }

    const viewer = await this.prisma.user.findUnique({
      where: { id: viewerId },
      select: { sellerStatus: true },
    });
    if (!isSellerVerified(viewer?.sellerStatus as SellerStatus)) {
      return {
        canRequest: false,
        blockReason: 'unverified',
        reserveWindowHours: windowHours,
        active: null,
        mine: null,
        iAmReservingBuyer: false,
      };
    }

    return {
      canRequest: true,
      reserveWindowHours: windowHours,
      active: null,
      mine: null,
      iAmReservingBuyer: false,
    };
  }

  async assertBuyerCanPurchase(listingId: string, buyerId: string): Promise<void> {
    const listing = await this.prisma.listing.findUnique({
      where: { id: listingId },
      select: { status: true, sellerId: true },
    });
    if (!listing) throw new NotFoundException('Listing not found');

    if (listing.status === 'active') {
      return;
    }

    if (listing.status === 'reserved') {
      const active = await this.prisma.listingReserve.findFirst({
        where: { listingId, status: 'active' },
      });
      if (active && active.buyerId === buyerId) {
        if (active.expiresAt && active.expiresAt.getTime() < Date.now()) {
          throw new BadRequestException('Your reservation has expired');
        }
        return;
      }
      throw new BadRequestException('This listing is reserved for another buyer');
    }

    throw new BadRequestException('Listing is not available for purchase');
  }

  isValidWindowHours(value: number): value is ListingReserveWindowHours {
    return (LISTING_RESERVE_WINDOW_HOURS as readonly number[]).includes(value);
  }

  private async requireReserve(id: string) {
    const row = await this.prisma.listingReserve.findUnique({ where: { id } });
    if (!row) throw new NotFoundException('Reservation not found');
    return row;
  }

  private async releaseListingToActive(listingId: string) {
    const listing = await this.prisma.listing.findUnique({
      where: { id: listingId },
      select: { status: true },
    });
    if (listing?.status !== 'reserved') return;

    await this.prisma.listing.update({
      where: { id: listingId },
      data: { status: 'active' },
    });
    await this.prisma.listingStatusChangeLog.create({
      data: {
        listingId,
        fromStatus: 'reserved',
        toStatus: 'active',
        changedByType: 'SYSTEM',
        reason: 'reserve_released',
      },
    });
    this.eventBus.publish({
      type: 'listing.updated',
      payload: { listingId },
      timestamp: new Date(),
    });
  }

  private async openChatWithSystemLine(
    buyerId: string,
    sellerId: string,
    listingId: string,
    content: string,
  ) {
    try {
      const existing = await this.prisma.chatThread.findUnique({
        where: {
          buyerId_sellerId_listingId: { buyerId, sellerId, listingId },
        },
      });
      let threadId = existing?.id;
      if (!threadId) {
        const created = await this.prisma.chatThread.create({
          data: { buyerId, sellerId, listingId },
        });
        threadId = created.id;
      }
      await this.chatMessages.sendSystemMessage(threadId, content, sellerId);
    } catch {
      // Non-fatal — reserve still succeeds
    }
  }

  private async notify(
    userId: string,
    title: string,
    message: string,
    actionUrl?: string,
  ) {
    try {
      await this.notifications.send({
        userId,
        type: 'system',
        title,
        body: message,
        actionUrl,
      });
    } catch {
      // Non-fatal
    }
  }
}
