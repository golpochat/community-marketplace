import { Injectable } from '@nestjs/common';

import type { Listing, RbacRole } from '@community-marketplace/types';
import {
  rejectListingSchema,
  removeListingSchema,
  restoreListingSchema,
} from '@community-marketplace/validation';

import { CategoriesService } from './services/categories.service';
import { ListingAnalyticsService } from './services/listing-analytics.service';
import { ListingFavoritesService } from './services/listing-favorites.service';
import { ListingFeedsService } from './services/listing-feeds.service';
import { CommunityStatsService } from './services/community-stats.service';
import { ListingImagesService } from './services/listing-images.service';
import { ListingLifecycleService } from './services/listing-lifecycle.service';
import { ListingReviewService } from './services/listing-review.service';
import { ListingReportsService } from './services/listing-reports.service';
import { ListingSearchService } from './services/listing-search.service';
import { ListingsCrudService } from './services/listings-crud.service';
import { ListingDeliveryService } from './services/listing-delivery.service';
import { ListingPricingService } from './services/listing-pricing.service';
import { DeliveryOptionsService } from './services/delivery-options.service';
import { SellerTrustService } from './services/seller-trust.service';
import { GeocodingService } from './services/geocoding.service';
import { NearbyAreasService } from './services/nearby-areas.service';

/** Facade for listing domain operations. */
@Injectable()
export class ListingsService {
  constructor(
    private readonly crud: ListingsCrudService,
    private readonly categories: CategoriesService,
    private readonly images: ListingImagesService,
    private readonly lifecycle: ListingLifecycleService,
    private readonly searchService: ListingSearchService,
    private readonly feeds: ListingFeedsService,
    private readonly communityStats: CommunityStatsService,
    private readonly favorites: ListingFavoritesService,
    private readonly reports: ListingReportsService,
    private readonly review: ListingReviewService,
    private readonly analytics: ListingAnalyticsService,
    private readonly delivery: ListingDeliveryService,
    private readonly pricing: ListingPricingService,
    private readonly deliveryOptions: DeliveryOptionsService,
    private readonly sellerTrust: SellerTrustService,
    private readonly geocoding: GeocodingService,
    private readonly nearbyAreas: NearbyAreasService,
  ) {}

  findAll(page?: number, limit?: number) {
    return this.crud.findPublic(page, limit);
  }

  findById(id: string, incrementView = false): Promise<Listing> {
    return this.crud.findById(id, incrementView);
  }

  findSimilar(listingId: string, limit = 4) {
    return this.crud.findSimilar(listingId, limit);
  }

  findCategories() {
    return this.categories.findAll();
  }

  create(sellerId: string, input: unknown) {
    return this.crud.create(sellerId, input);
  }

  update(listingId: string, actorId: string, actorRole: RbacRole, input: unknown) {
    return this.crud.update(listingId, actorId, actorRole, input);
  }

  remove(listingId: string, actorId: string, actorRole: RbacRole) {
    return this.crud.remove(listingId, actorId, actorRole);
  }

  findBySeller(
    sellerId: string,
    filters: { status?: string; page?: number; limit?: number },
  ) {
    return this.crud.findBySeller(sellerId, filters);
  }

  markSold(listingId: string, actorId: string, actorRole: RbacRole) {
    return this.lifecycle.markSold(listingId, actorId, actorRole);
  }

  markSoldFromPayment(listingId: string) {
    return this.lifecycle.markSoldFromPayment(listingId);
  }

  archive(listingId: string, actorId: string, actorRole: RbacRole) {
    return this.lifecycle.archive(listingId, actorId, actorRole);
  }

  unarchive(listingId: string, actorId: string, actorRole: RbacRole) {
    return this.lifecycle.unarchive(listingId, actorId, actorRole);
  }

  ban(listingId: string, adminId: string, notes?: string) {
    return this.lifecycle.ban(listingId, adminId, notes);
  }

  unban(listingId: string, adminId: string) {
    return this.lifecycle.unban(listingId, adminId);
  }

  approve(listingId: string, adminId: string) {
    return this.lifecycle.approve(listingId, adminId);
  }

  investigateListing(listingId: string, adminId: string, reason?: string) {
    return this.lifecycle.investigateListing(listingId, adminId, reason);
  }

  rejectListing(listingId: string, adminId: string, input: unknown) {
    const parsed = rejectListingSchema.parse(input);
    return this.lifecycle.rejectListing(listingId, adminId, parsed.reason);
  }

  submitForReview(listingId: string, sellerId: string) {
    return this.lifecycle.submitForReview(listingId, sellerId);
  }

  cancelReview(listingId: string, sellerId: string) {
    return this.lifecycle.cancelReview(listingId, sellerId);
  }

  publishWithoutReview(listingId: string, sellerId: string) {
    return this.lifecycle.publishWithoutReview(listingId, sellerId);
  }

  pauseListing(listingId: string, sellerId: string) {
    return this.lifecycle.pauseListing(listingId, sellerId);
  }

  resumeListing(listingId: string, sellerId: string) {
    return this.lifecycle.resumeListing(listingId, sellerId);
  }

  endListing(listingId: string, sellerId: string) {
    return this.lifecycle.endListing(listingId, sellerId);
  }

  removeListing(listingId: string, adminId: string, input: unknown) {
    const parsed = removeListingSchema.parse(input ?? {});
    return this.lifecycle.removeListing(listingId, adminId, parsed.reason);
  }

  restoreListing(listingId: string, adminId: string, input: unknown) {
    const parsed = restoreListingSchema.parse(input ?? {});
    return this.lifecycle.restoreListing(listingId, adminId, parsed.targetStatus);
  }

  renewListing(listingId: string, sellerId: string, input: unknown) {
    return this.lifecycle.renewListing(listingId, sellerId, input);
  }

  upgradePackage(listingId: string, sellerId: string, input: unknown) {
    return this.lifecycle.upgradePackage(listingId, sellerId, input);
  }

  duplicateListing(listingId: string, sellerId: string) {
    return this.crud.duplicate(listingId, sellerId);
  }

  getStatusHistory(listingId: string) {
    return this.lifecycle.getStatusHistory(listingId);
  }

  getReviewContext(listingId: string, actorId: string, role: RbacRole) {
    return this.review.getReviewContext(listingId, actorId, role);
  }

  addReviewMessage(listingId: string, senderId: string, role: RbacRole, input: unknown) {
    return this.review.addMessage(listingId, senderId, role, input);
  }

  requestListingChanges(listingId: string, adminId: string, role: RbacRole, input: unknown) {
    return this.review.requestChanges(listingId, adminId, role, input);
  }

  searchListings(input: unknown) {
    return this.searchService.search(input);
  }

  getFeed(input: unknown) {
    return this.feeds.getFeed(input);
  }

  getNearbyAreas(input: unknown) {
    return this.nearbyAreas.getNearbyAreas(input);
  }

  reverseGeocode(input: unknown) {
    return this.geocoding.reverseGeocode(input);
  }

  getCommunityStats() {
    return this.communityStats.getPublicStats();
  }

  getSellerTrust(sellerId: string) {
    return this.sellerTrust.getProfile(sellerId);
  }

  getImages(listingId: string) {
    return this.images.findByListingId(listingId);
  }

  createImageUploadUrl(listingId: string, sellerId: string, input: unknown) {
    return this.images.createUploadUrl(listingId, sellerId, input);
  }

  confirmImages(listingId: string, sellerId: string, input: unknown) {
    return this.images.confirmUploads(listingId, sellerId, input);
  }

  reorderImages(listingId: string, sellerId: string, input: unknown) {
    return this.images.reorder(listingId, sellerId, input);
  }

  removeImage(
    listingId: string,
    imageId: string,
    actorId: string,
    actorRole: RbacRole,
  ) {
    return this.images.remove(listingId, imageId, actorId, actorRole);
  }

  addFavorite(userId: string, listingId: string) {
    return this.favorites.add(userId, listingId);
  }

  removeFavorite(userId: string, listingId: string) {
    return this.favorites.remove(userId, listingId);
  }

  listFavorites(userId: string, page?: number, limit?: number) {
    return this.favorites.listForUser(userId, page, limit);
  }

  reportListing(reporterId: string, listingId: string, input: unknown) {
    return this.reports.report(reporterId, listingId, input);
  }

  listReports(page?: number, limit?: number) {
    return this.reports.listOpen(page, limit);
  }

  moderateReport(reportId: string, moderatorId: string, input: unknown) {
    return this.reports.takeAction(reportId, moderatorId, input);
  }

  adminList(filters: {
    status?: string;
    categoryId?: string;
    sellerId?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    return this.crud.adminList(filters);
  }

  adminOverride(listingId: string, adminId: string, input: unknown) {
    return this.crud.adminOverride(listingId, adminId, input);
  }

  getAnalytics(listingId: string, sellerId: string) {
    return this.analytics.getForListing(listingId, sellerId);
  }

  getSellerAnalyticsSummary(sellerId: string) {
    return this.analytics.getSellerSummary(sellerId);
  }

  listDeliveryOptions() {
    return this.deliveryOptions.listActive();
  }

  getDeliveryPreview(listingId: string, sellerId: string, role: RbacRole, input: unknown) {
    return this.delivery.buildPreview(listingId, sellerId, role, input);
  }

  updateDelivery(listingId: string, sellerId: string, role: RbacRole, input: unknown) {
    return this.delivery.updateDelivery(listingId, sellerId, role, input);
  }

  getSellerDeliveryState(listingId: string, sellerId: string, role: RbacRole) {
    return this.delivery.getSellerDeliveryState(listingId, sellerId, role);
  }

  listPendingDeliveryReviews(page?: number, limit?: number) {
    return this.delivery.listPendingReviews(page, limit);
  }

  approveDeliveryChange(changeLogId: string, adminId: string, reviewNotes?: string) {
    return this.delivery.approveChange(changeLogId, adminId, reviewNotes);
  }

  rejectDeliveryChange(changeLogId: string, adminId: string, reviewNotes?: string) {
    return this.delivery.rejectChange(changeLogId, adminId, reviewNotes);
  }

  getPricingPreview(listingId: string, sellerId: string, role: RbacRole, input: unknown) {
    return this.pricing.buildPreview(listingId, sellerId, role, input);
  }

  updatePricing(listingId: string, sellerId: string, role: RbacRole, input: unknown) {
    return this.pricing.updatePricing(listingId, sellerId, role, input);
  }

  getSellerPricingState(listingId: string, sellerId: string, role: RbacRole) {
    return this.pricing.getSellerPricingState(listingId, sellerId, role);
  }

  listPendingPriceReviews(page?: number, limit?: number) {
    return this.pricing.listPendingReviews(page, limit);
  }

  approvePriceChange(changeLogId: string, adminId: string, reviewNotes?: string) {
    return this.pricing.approveChange(changeLogId, adminId, reviewNotes);
  }

  rejectPriceChange(changeLogId: string, adminId: string, reviewNotes?: string) {
    return this.pricing.rejectChange(changeLogId, adminId, reviewNotes);
  }
}
