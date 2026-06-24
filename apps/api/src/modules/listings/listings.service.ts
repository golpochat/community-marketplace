import { Injectable } from '@nestjs/common';

import type { Listing, RbacRole } from '@community-marketplace/types';

import { CategoriesService } from './services/categories.service';
import { ListingAnalyticsService } from './services/listing-analytics.service';
import { ListingFavoritesService } from './services/listing-favorites.service';
import { ListingFeedsService } from './services/listing-feeds.service';
import { ListingImagesService } from './services/listing-images.service';
import { ListingLifecycleService } from './services/listing-lifecycle.service';
import { ListingReportsService } from './services/listing-reports.service';
import { ListingSearchService } from './services/listing-search.service';
import { ListingsCrudService } from './services/listings-crud.service';

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
    private readonly favorites: ListingFavoritesService,
    private readonly reports: ListingReportsService,
    private readonly analytics: ListingAnalyticsService,
  ) {}

  findAll(page?: number, limit?: number) {
    return this.crud.findPublic(page, limit);
  }

  findById(id: string, incrementView = false): Promise<Listing> {
    return this.crud.findById(id, incrementView);
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

  searchListings(input: unknown) {
    return this.searchService.search(input);
  }

  getFeed(input: unknown) {
    return this.feeds.getFeed(input);
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
}
