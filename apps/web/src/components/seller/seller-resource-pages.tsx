"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import type {
  Listing,
  ListingDeliverySelection,
  ListingReviewContext,
  PendingReviewItem,
  UserVerification,
} from "@community-marketplace/types";
import {
  formatCurrency,
  formatListedAgo,
  formatLocationLabel,
  formatUpdatedAgo,
  resolveListingListedAt,
} from "@community-marketplace/utils";
import {
  Card,
  formatExpiredAgo,
  formatExpiresIn,
  ListingStatusBadge,
  TruncatedText,
} from "@community-marketplace/ui-dashboard";

import {
  DashboardPageShell,
  DataTable,
} from "@/components/dashboard/async-resource";
import { ListingPriceDisplay } from "@/components/listings/listing-price-display";
import { listingImageVariantUrl } from "@/lib/listing-image-url";
import {
  DEFAULT_RENEW_PACKAGE,
  ListingSellerActions,
  type SellerListingAction,
} from "@/components/seller/listing-seller-actions";
import { ListingPackageDialog } from "@/components/seller/listing-package-dialog";
import { ListingReviewThread } from "@/components/dashboard/listing-review-thread";
import { SellerConnectBanner } from "@/components/seller/seller-connect-banner";
import {
  ListingFormRouter,
  type SellerCategoryOption,
} from "@/components/seller/listing-form-router";
import {
  type ListingFormData,
} from "@/components/seller/listing-form";
import type { VehicleFormData } from "@/components/seller/vehicle-listing-form";
import { buildVehicleDeliverySelections } from "@/components/seller/vehicle-delivery.helpers";
import {
  buildVehicleListingCreatePayload,
  buildVehicleListingUpdatePayload,
  vehicleFormDataFromListing,
} from "@/lib/vehicle-listing-payload";
import { isVehicleCategory } from "@/lib/vehicle-catalog";
import { selectionsFromDeliveryState } from "@/components/seller/delivery-options-section";
import { useAuth } from "@/hooks/use-auth";
import { deliveryService } from "@/services/delivery.service";
import {
  formPricingFromFields,
  pricingService,
} from "@/services/pricing.service";
import { sellerService } from "@/services/marketplace.service";
import { listingsService } from "@/services/listings.service";
import { ReviewBuyerPromptDialog } from "@/components/trust/review-buyer-prompt-dialog";
import { trustService } from "@/services/trust.service";

function buildListingCreatePayload(
  data: ListingFormData,
  categories: Array<{ id: string; name: string }>,
  deliverySelections: ListingDeliverySelection[],
) {
  const categoryId = data.categoryId || categories[0]?.id;
  if (!categoryId) {
    throw new Error(
      "No categories are available. Run `pnpm seed:dev-users` from the repo root, then refresh this page.",
    );
  }
  const salePrice = Number(data.salePrice);
  const originalPrice = data.originalPrice.trim()
    ? Number(data.originalPrice)
    : undefined;
  return {
    title: data.title.trim(),
    description: data.description.trim(),
    price: salePrice,
    salePrice,
    originalPrice: originalPrice ?? null,
    currency: "EUR",
    categoryId,
    condition: data.condition,
    location: {
      label: data.location.trim() || "Ireland",
      latitude: 53.3498,
      longitude: -6.2603,
    },
    deliverySelections: deliverySelections.map((s) => ({
      deliveryOptionId: s.deliveryOptionId,
      customLabel: s.customLabel,
      customPrice: s.customPrice,
    })),
    status: "draft" as const,
  };
}

function buildListingUpdatePayload(
  data: ListingFormData,
  categories: Array<{ id: string; name: string }>,
  deliverySelections: ListingDeliverySelection[],
  includeDelivery: boolean,
  includePricing: boolean,
) {
  const payload = buildListingCreatePayload(
    data,
    categories,
    deliverySelections,
  );
  const { status: _status, ...rest } = payload;
  const result: Record<string, unknown> = { ...rest };
  if (!includeDelivery) {
    delete result.deliverySelections;
  }
  if (!includePricing) {
    delete result.price;
    delete result.salePrice;
    delete result.originalPrice;
  }
  return result;
}

const STATUS_FILTER_OPTIONS = [
  { value: "", label: "All" },
  { value: "draft", label: "Draft" },
  { value: "pending_review", label: "Pending review" },
  { value: "active", label: "Live" },
  { value: "paused", label: "Paused" },
  { value: "expired", label: "Expired" },
  { value: "sold", label: "Sold" },
  { value: "ended", label: "Ended" },
  { value: "rejected", label: "Rejected" },
  { value: "removed", label: "Removed" },
] as const;

function SellerListingThumb({ listing }: { listing: Listing }) {
  const cover = listing.images[0];
  const src = cover ? listingImageVariantUrl(cover.url, "tiny") : undefined;

  if (!src) {
    return (
      <div className="flex h-12 w-12 items-center justify-center rounded-md bg-gray-100 text-[10px] text-gray-400">
        —
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      className="aspect-square h-12 w-12 rounded-md object-cover"
    />
  );
}

export function SellerListingsPage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("");
  const [packageDialog, setPackageDialog] = useState<{
    listingId: string;
    mode: "renew" | "upgrade";
  } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await sellerService.getListings(
        1,
        100,
        statusFilter || undefined,
      );
      setListings(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load listings");
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  async function runAction(listingId: string, action: SellerListingAction) {
    setActionId(listingId);
    setError(null);
    try {
      switch (action) {
        case "submit":
          await sellerService.submitForReview(listingId);
          break;
        case "publish":
          await sellerService.publishListing(listingId);
          break;
        case "cancel-review":
          await sellerService.cancelReview(listingId);
          break;
        case "pause":
          await sellerService.pauseListing(listingId);
          break;
        case "resume":
          await sellerService.resumeListing(listingId);
          break;
        case "sold":
          await sellerService.markListingSold(listingId);
          break;
        case "end":
          await sellerService.endListing(listingId);
          break;
        case "renew":
        case "upgrade":
          setActionId(null);
          setPackageDialog({ listingId, mode: action });
          return;
        case "duplicate": {
          const dup = await sellerService.duplicateListing(listingId);
          if (dup.data?.id) {
            window.location.href = `/seller/listings/${dup.data.id}/edit`;
            return;
          }
          break;
        }
        case "delete":
          await sellerService.deleteListing(listingId);
          break;
        default:
          break;
      }
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed");
    } finally {
      setActionId(null);
    }
  }

  async function handlePackageConfirm(
    packageType: typeof DEFAULT_RENEW_PACKAGE,
  ) {
    if (!packageDialog) return;
    const { listingId, mode } = packageDialog;
    setPackageDialog(null);
    setActionId(listingId);
    setError(null);
    try {
      if (mode === "renew") {
        await sellerService.renewListing(listingId, packageType);
      } else {
        await sellerService.upgradePackage(listingId, packageType);
      }
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed");
    } finally {
      setActionId(null);
    }
  }

  return (
    <DashboardPageShell
      title="My Listings"
      description="Manage your active and draft listings."
      loading={loading}
      error={error}
      empty={!loading && !error && listings.length === 0}
      emptyTitle="No listings yet"
      emptyDescription="Create your first listing to start selling."
    >
      <Card>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700"
            aria-label="Filter by status"
          >
            {STATUS_FILTER_OPTIONS.map((option) => (
              <option key={option.value || "all"} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <Link
            href="/seller/listings/create"
            className="inline-flex rounded-lg bg-[hsl(var(--dashboard-accent))] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
          >
            Create listing
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead>
              <tr className="text-left text-gray-700">
                <th className="px-3 py-2 font-medium">Photo</th>
                <th className="px-3 py-2 font-medium">Title</th>
                <th className="px-3 py-2 font-medium">Price</th>
                <th className="px-3 py-2 font-medium">Status</th>
                <th className="px-3 py-2 font-medium">Listed</th>
                <th className="px-3 py-2 font-medium">Views</th>
                <th className="px-3 py-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {listings.map((listing) => (
                <tr key={listing.id}>
                  <td className="px-3 py-2">
                    <SellerListingThumb listing={listing} />
                  </td>
                  <td className="max-w-xs px-3 py-2 font-medium text-gray-900">
                    <TruncatedText text={listing.title} />
                  </td>
                  <td className="px-3 py-2 text-gray-700">
                    <ListingPriceDisplay
                      price={listing.price}
                      originalPrice={listing.originalPrice}
                      salePrice={listing.salePrice}
                      discountPercent={listing.discountPercent}
                      currency={listing.currency}
                      size="sm"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <ListingStatusBadge status={listing.status} />
                    {(listing.status === "active" ||
                      listing.status === "paused") &&
                      listing.expiresAt && (
                        <p className="mt-1 text-xs text-gray-500">
                          {formatExpiresIn(listing.expiresAt)}
                        </p>
                      )}
                    {listing.status === "expired" && listing.expiresAt && (
                      <p className="mt-1 text-xs text-gray-500">
                        {formatExpiredAgo(listing.expiresAt)}
                      </p>
                    )}
                    {listing.status === "removed" && listing.removalReason && (
                      <p className="mt-1 text-xs text-red-600">
                        {listing.removalReason}
                      </p>
                    )}
                    {listing.status === "rejected" &&
                      listing.rejectionReason && (
                        <p className="mt-1 text-xs text-red-600">
                          {listing.rejectionReason}
                        </p>
                      )}
                  </td>
                  <td className="px-3 py-2 text-xs text-gray-500">
                    <p>
                      {formatListedAgo(
                        resolveListingListedAt(
                          listing.createdAt,
                          listing.activatedAt,
                        ),
                      )}
                    </p>
                    <p className="mt-1">
                      Listed on{" "}
                      {new Date(
                        resolveListingListedAt(
                          listing.createdAt,
                          listing.activatedAt,
                        ),
                      ).toLocaleDateString()}
                    </p>
                    <p className="mt-1">
                      {formatUpdatedAgo(listing.updatedAt)}
                    </p>
                  </td>
                  <td className="px-3 py-2 text-gray-700">
                    {listing.viewCount}
                  </td>
                  <td className="px-3 py-2">
                    <ListingSellerActions
                      listing={listing}
                      actionId={actionId}
                      onAction={(id, action) => void runAction(id, action)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      <ListingPackageDialog
        open={packageDialog != null}
        title={
          packageDialog?.mode === "upgrade"
            ? "Upgrade listing package"
            : "Renew listing"
        }
        confirmLabel={packageDialog?.mode === "upgrade" ? "Upgrade" : "Renew"}
        defaultPackage={DEFAULT_RENEW_PACKAGE}
        onClose={() => setPackageDialog(null)}
        onConfirm={(packageType) => void handlePackageConfirm(packageType)}
      />
    </DashboardPageShell>
  );
}

export function SellerSalesPage() {
  const [rows, setRows] = useState<Array<Array<React.ReactNode>>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingReviews, setPendingReviews] = useState<PendingReviewItem[]>([]);
  const [dismissedReviewIds, setDismissedReviewIds] = useState<Set<string>>(new Set());

  const loadPendingReviews = useCallback(async () => {
    try {
      const pending = await trustService.getPendingSellerReviews();
      setPendingReviews(pending);
    } catch {
      setPendingReviews([]);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void Promise.all([sellerService.getSoldListings(), loadPendingReviews()])
      .then(([result]) => {
        if (cancelled) return;
        setRows(
          result.data.map((listing) => [
            <TruncatedText key={listing.id} text={listing.title} />,
            formatCurrency(listing.price, listing.currency),
            new Date(listing.updatedAt).toLocaleDateString(),
          ]),
        );
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [loadPendingReviews]);

  const visiblePendingReview = pendingReviews.find(
    (item) => !dismissedReviewIds.has(item.listingId),
  );

  return (
    <DashboardPageShell
      title="Sales"
      description="Track completed sales."
      loading={loading}
      error={error}
      empty={!loading && !error && rows.length === 0}
      emptyTitle="No sales yet"
    >
      {visiblePendingReview && (
        <div className="mb-6">
          <ReviewBuyerPromptDialog
            listingId={visiblePendingReview.listingId}
            buyerId={visiblePendingReview.counterpartyId}
            buyerName={visiblePendingReview.counterpartyName}
            onSubmitted={() => {
              void loadPendingReviews();
            }}
            onDismiss={() => {
              setDismissedReviewIds((current) =>
                new Set(current).add(visiblePendingReview.listingId),
              );
            }}
          />
        </div>
      )}
      <Card>
        <DataTable columns={["Title", "Price", "Sold"]} rows={rows} />
      </Card>
    </DashboardPageShell>
  );
}

export function SellerVerificationPage() {
  const [verification, setVerification] = useState<UserVerification | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [files, setFiles] = useState<{
    idDocumentFront?: File;
    idDocumentBack?: File;
    selfie?: File;
    addressProof?: File;
  }>({});

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const response = await sellerService.getVerification();
      setVerification(response.data ?? null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load verification",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  function handleFileChange(field: keyof typeof files, file: File | undefined) {
    setFiles((current) => ({ ...current, [field]: file }));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (
      !files.idDocumentFront ||
      !files.idDocumentBack ||
      !files.selfie ||
      !files.addressProof
    ) {
      setError("Please upload all required documents.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const [
        idDocumentFrontUrl,
        idDocumentBackUrl,
        selfieUrl,
        addressProofUrl,
      ] = await Promise.all([
        sellerService.uploadVerificationDocument(files.idDocumentFront),
        sellerService.uploadVerificationDocument(files.idDocumentBack),
        sellerService.uploadVerificationDocument(files.selfie),
        sellerService.uploadVerificationDocument(files.addressProof),
      ]);

      await sellerService.submitVerification({
        idDocumentFrontUrl,
        idDocumentBackUrl,
        selfieUrl,
        addressProofUrl,
      });
      setFiles({});
      await load();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to submit verification",
      );
    } finally {
      setSubmitting(false);
    }
  }

  const canSubmit = !verification || verification.status === "rejected";

  return (
    <DashboardPageShell
      title="Verification"
      description="Complete identity verification to earn a trusted seller badge."
      loading={loading}
      error={error}
      empty={false}
    >
      <Card title="Verification status">
        {verification ? (
          <dl className="mb-6 space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-[hsl(var(--dashboard-sidebar-muted))]">
                Status
              </dt>
              <dd className="font-medium capitalize">{verification.status}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-[hsl(var(--dashboard-sidebar-muted))]">
                Submitted
              </dt>
              <dd>{new Date(verification.createdAt).toLocaleString()}</dd>
            </div>
            {verification.rejectionReason && (
              <div className="flex justify-between gap-4">
                <dt className="text-[hsl(var(--dashboard-sidebar-muted))]">
                  Rejection reason
                </dt>
                <dd className="text-right text-red-700">
                  {verification.rejectionReason}
                </dd>
              </div>
            )}
          </dl>
        ) : (
          <p className="mb-6 text-sm text-[hsl(var(--dashboard-sidebar-muted))]">
            Upload your identity documents to begin verification.
          </p>
        )}

        {canSubmit && (
          <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
            {(
              [
                ["idDocumentFront", "ID document (front)"],
                ["idDocumentBack", "ID document (back)"],
                ["selfie", "Selfie photo"],
                ["addressProof", "Proof of address"],
              ] as const
            ).map(([field, label]) => (
              <div key={field}>
                <label className="mb-1 block text-sm font-medium text-[hsl(var(--dashboard-main-fg))]">
                  {label}
                </label>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  onChange={(event) =>
                    handleFileChange(field, event.target.files?.[0])
                  }
                  className="block w-full text-sm text-[hsl(var(--dashboard-main-fg))]"
                />
              </div>
            ))}
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-[hsl(var(--dashboard-accent))] px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
            >
              {submitting ? "Uploading…" : "Submit verification"}
            </button>
          </form>
        )}
      </Card>
    </DashboardPageShell>
  );
}

export function SellerCreateListingPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<SellerCategoryOption[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setCategoriesLoading(true);
    setCategoriesError(null);
    void listingsService
      .getCategories()
      .then((cats) => {
        if (cancelled) return;
        if (cats.length === 0) {
          setCategoriesError(
            "No categories are configured. Run `pnpm seed:dev-users` from the repo root, then refresh this page.",
          );
          setCategories([]);
          return;
        }
        setCategories(cats.map((c) => ({ id: c.id, name: c.name, slug: c.slug })));
      })
      .catch((err: Error) => {
        if (!cancelled) {
          setCategoriesError(
            err.message || "Failed to load categories from the API.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) setCategoriesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleGenericSubmit(data: ListingFormData) {
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      const catalog = await deliveryService.getCatalog();
      const deliverySelections = selectionsFromDeliveryState(
        catalog,
        data.delivery,
      );
      const payload = buildListingCreatePayload(
        data,
        categories,
        deliverySelections,
      );
      const response = await sellerService.createListing(payload);
      const listingId = response.data?.id;
      if (listingId && data.images.length > 0) {
        await sellerService.uploadListingImages(listingId, data.images);
      }
      setSuccess(
        "Draft saved. An admin will review it before it goes live on the marketplace.",
      );
      window.setTimeout(() => router.push("/seller/listings"), 1200);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to save listing draft",
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleVehicleSubmit(data: VehicleFormData) {
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      const categoryId =
        data.categoryId || categories.find((c) => isVehicleCategory(c))?.id;
      if (!categoryId) {
        throw new Error("Select the Vehicles category.");
      }
      const catalog = await deliveryService.getCatalog();
      const deliverySelections = buildVehicleDeliverySelections(
        catalog,
        data.deliveryMode,
        data.feeDublin,
        data.feeIreland,
        data.customDeliveryLabel,
      );
      const payload = buildVehicleListingCreatePayload(
        data,
        categoryId,
        deliverySelections,
      );
      const response = await sellerService.createListing(payload);
      const listingId = response.data?.id;
      if (listingId && data.images.length > 0) {
        await sellerService.uploadListingImages(listingId, data.images);
      }
      setSuccess(
        "Draft saved. An admin will review it before it goes live on the marketplace.",
      );
      window.setTimeout(() => router.push("/seller/listings"), 1200);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to save listing draft",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <DashboardPageShell
      title="Create Listing"
      description="Add a new item to your store."
    >
      <SellerConnectBanner className="mb-4" />
      {categoriesLoading && (
        <p className="mb-4 text-sm text-[hsl(var(--dashboard-sidebar-muted))]">
          Loading categories…
        </p>
      )}
      {categoriesError && (
        <p className="mb-4 text-sm text-red-600">{categoriesError}</p>
      )}
      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
      {success && <p className="mb-4 text-sm text-green-700">{success}</p>}
      {submitting && (
        <p className="mb-4 text-sm text-gray-700">Saving draft…</p>
      )}
      <Card>
        <ListingFormRouter
          categories={categories}
          disabled={
            categoriesLoading || !!categoriesError || categories.length === 0
          }
          submitLabel="Save draft"
          onGenericSubmit={(data) => void handleGenericSubmit(data)}
          onVehicleSubmit={(data) => void handleVehicleSubmit(data)}
        />
      </Card>
    </DashboardPageShell>
  );
}

export function SellerEditListingPage({ listingId }: { listingId: string }) {
  const router = useRouter();
  const { user } = useAuth();
  const [categories, setCategories] = useState<SellerCategoryOption[]>([]);
  const [initialData, setInitialData] =
    useState<Partial<ListingFormData> | null>(null);
  const [vehicleInitialData, setVehicleInitialData] =
    useState<Partial<VehicleFormData> | null>(null);
  const [initialCategoryId, setInitialCategoryId] = useState<string | undefined>();
  const [listingStatus, setListingStatus] = useState<string | null>(null);
  const [moderationNotes, setModerationNotes] = useState<string | undefined>();
  const [review, setReview] = useState<ListingReviewContext | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deliverySelections, setDeliverySelections] = useState<
    ListingDeliverySelection[]
  >([]);
  const [deliveryReviewStatus, setDeliveryReviewStatus] = useState<
    "none" | "pending-review" | "rejected"
  >("none");
  const [priceReviewStatus, setPriceReviewStatus] = useState<
    "none" | "pending-review" | "rejected"
  >("none");
  const [deliveryReviewNotes, setDeliveryReviewNotes] = useState<
    string | undefined
  >();
  const [priceReviewNotes, setPriceReviewNotes] = useState<
    string | undefined
  >();
  const [deliveryMessage, setDeliveryMessage] = useState<string | null>(null);
  const [pricingMessage, setPricingMessage] = useState<string | null>(null);
  const [existingImages, setExistingImages] = useState<Listing["images"]>([]);
  const [removingImageId, setRemovingImageId] = useState<string | null>(null);
  const [reorderingImages, setReorderingImages] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [cats, listing] = await Promise.all([
          listingsService.getCategories(),
          listingsService.getById(listingId),
        ]);
        setCategories(cats.map((c) => ({ id: c.id, name: c.name, slug: c.slug })));
        if (!listing) {
          setError("Listing not found.");
          return;
        }
        setListingStatus(listing.status);
        setModerationNotes(listing.moderationNotes);
        setExistingImages(listing.images ?? []);
        setDeliverySelections(listing.deliveryOptions ?? []);

        setInitialCategoryId(listing.categoryId);
        let pricingFields = formPricingFromFields({
          price: listing.price,
          salePrice: listing.salePrice,
          originalPrice: listing.originalPrice,
        });

        try {
          const [deliveryState, pricingState] = await Promise.all([
            deliveryService.getSellerState(listingId),
            pricingService.getSellerState(listingId),
          ]);
          const formDelivery = deliveryState.pendingDeliveryOptions?.length
            ? deliveryState.pendingDeliveryOptions
            : deliveryState.deliveryOptions;
          setDeliverySelections(formDelivery);
          setDeliveryReviewStatus(deliveryState.deliveryReviewStatus ?? "none");
          setDeliveryReviewNotes(deliveryState.reviewNotes);
          pricingFields = formPricingFromFields(
            pricingState.pendingPricing ?? pricingState.pricing,
          );
          setPriceReviewStatus(pricingState.priceReviewStatus ?? "none");
          setPriceReviewNotes(pricingState.reviewNotes);
        } catch {
          setDeliveryReviewStatus("none");
          setPriceReviewStatus("none");
        }

        const isVehicleListing =
          listing.category && isVehicleCategory(listing.category);

        if (isVehicleListing) {
          setVehicleInitialData(
            vehicleFormDataFromListing(listing, pricingFields),
          );
          setInitialData(null);
        } else {
          setInitialData({
            title: listing.title,
            description: listing.description,
            salePrice: pricingFields.salePrice,
            originalPrice: pricingFields.originalPrice,
            condition: listing.condition,
            categoryId: listing.categoryId,
            location: listing.location.label,
            images: [],
          });
          setVehicleInitialData(null);
        }
        if (
          listing.status === "draft" ||
          listing.status === "pending_review" ||
          listing.status === "rejected"
        ) {
          try {
            const reviewData = await sellerService.getListingReview(listingId);
            setReview(reviewData);
          } catch {
            setReview(null);
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load listing");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [listingId]);

  async function handleReviewReply(content: string) {
    const data = await sellerService.sendListingReviewMessage(
      listingId,
      content,
    );
    setReview(data);
    setModerationNotes(data.listing.moderationNotes);
  }

  async function handleReorderExistingImages(images: Listing["images"]) {
    setReorderingImages(true);
    setError(null);
    try {
      const reordered = await sellerService.reorderListingImages(
        listingId,
        images,
      );
      setExistingImages(reordered);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reorder photos");
    } finally {
      setReorderingImages(false);
    }
  }

  async function handleRemoveExistingImage(imageId: string) {
    setRemovingImageId(imageId);
    setError(null);
    try {
      await sellerService.removeListingImage(listingId, imageId);
      setExistingImages((prev) => prev.filter((image) => image.id !== imageId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove photo");
    } finally {
      setRemovingImageId(null);
    }
  }

  async function handleGenericSubmit(data: ListingFormData) {
    setSubmitting(true);
    setError(null);
    try {
      const catalog = await deliveryService.getCatalog();
      const selections = selectionsFromDeliveryState(catalog, data.delivery);
      const includeDelivery =
        listingStatus !== "active" && listingStatus !== "paused";
      const includePricing =
        listingStatus !== "active" && listingStatus !== "paused";
      const payload = buildListingUpdatePayload(
        data,
        categories,
        selections,
        includeDelivery,
        includePricing,
      );
      await sellerService.updateListing(listingId, payload);
      if (data.images.length > 0) {
        await sellerService.uploadListingImages(listingId, data.images);
      }
      router.push("/seller/listings");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update listing");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleVehicleSubmit(data: VehicleFormData) {
    setSubmitting(true);
    setError(null);
    try {
      const categoryId = data.categoryId || initialCategoryId;
      if (!categoryId) throw new Error("Missing category.");
      const catalog = await deliveryService.getCatalog();
      const selections = buildVehicleDeliverySelections(
        catalog,
        data.deliveryMode,
        data.feeDublin,
        data.feeIreland,
        data.customDeliveryLabel,
      );
      const includeDelivery =
        listingStatus !== "active" && listingStatus !== "paused";
      const includePricing =
        listingStatus !== "active" && listingStatus !== "paused";
      const payload = buildVehicleListingUpdatePayload(
        data,
        categoryId,
        selections,
        includeDelivery,
        includePricing,
      );
      await sellerService.updateListing(listingId, payload);
      if (data.images.length > 0) {
        await sellerService.uploadListingImages(listingId, data.images);
      }
      router.push("/seller/listings");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update listing");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <DashboardPageShell
      title="Edit Listing"
      description="Update your listing details."
      loading={loading}
      error={error}
    >
      {submitting && (
        <p className="mb-4 text-sm text-gray-700">Saving changes…</p>
      )}
      {deliveryMessage && (
        <p className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-2 text-sm text-green-800">
          {deliveryMessage}
        </p>
      )}
      {pricingMessage && (
        <p className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-2 text-sm text-green-800">
          {pricingMessage}
        </p>
      )}
      {listingStatus &&
        (listingStatus === "draft" ||
          listingStatus === "pending_review" ||
          listingStatus === "rejected") &&
        (moderationNotes || (review?.messages.length ?? 0) > 0) && (
          <Card className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900">
              Admin review feedback
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              {listingStatus === "pending_review"
                ? "Your listing is awaiting admin review. Reply below if you need to clarify anything."
                : listingStatus === "rejected"
                  ? "Your listing was rejected. Address the feedback below, edit your listing, then resubmit."
                  : "Your listing is pending approval. Reply below if you need to clarify anything after making edits."}
            </p>
            {moderationNotes && (
              <div className="mt-4 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-900">
                <p className="font-medium">Latest request</p>
                <p className="mt-1 whitespace-pre-wrap">{moderationNotes}</p>
              </div>
            )}
            <div className="mt-4">
              <ListingReviewThread
                messages={review?.messages ?? []}
                currentUserId={user?.id}
                onSend={handleReviewReply}
                sendLabel="Reply to admin"
                placeholder="Explain what you changed or ask a question…"
              />
            </div>
          </Card>
        )}
      {(initialData || vehicleInitialData) && (
        <Card>
          <ListingFormRouter
            categories={categories}
            initialCategoryId={initialCategoryId}
            genericInitialData={initialData ?? undefined}
            vehicleInitialData={vehicleInitialData ?? undefined}
            initialDeliverySelections={deliverySelections}
            existingImages={existingImages}
            listingId={listingId}
            listingStatus={listingStatus ?? undefined}
            deliveryReviewStatus={deliveryReviewStatus}
            priceReviewStatus={priceReviewStatus}
            deliveryReviewNotes={deliveryReviewNotes}
            priceReviewNotes={priceReviewNotes}
            submitLabel="Save changes"
            onGenericSubmit={(data) => void handleGenericSubmit(data)}
            onVehicleSubmit={(data) => void handleVehicleSubmit(data)}
            onDeliveryUpdated={({ message }) => {
              setDeliveryMessage(message);
              setDeliveryReviewStatus(
                message.includes("pending") ? "pending-review" : "none",
              );
            }}
            onPricingUpdated={({ message, status }) => {
              setPricingMessage(message);
              if (status === "pending-review")
                setPriceReviewStatus("pending-review");
            }}
            onRemoveExistingImage={(imageId) =>
              void handleRemoveExistingImage(imageId)
            }
            onReorderExistingImages={(images) =>
              void handleReorderExistingImages(images)
            }
            removingExistingImageId={removingImageId}
            reorderingImages={reorderingImages}
          />
        </Card>
      )}
    </DashboardPageShell>
  );
}
