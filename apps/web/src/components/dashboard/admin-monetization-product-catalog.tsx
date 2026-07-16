'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Loader2, Pencil } from 'lucide-react';

import type { MonetizationProduct } from '@community-marketplace/types';
import type { MonetizationProductUpsertInput } from '@community-marketplace/validation';
import { cn } from '@community-marketplace/ui';
import { DashboardCard } from '@community-marketplace/ui-dashboard';

import { AdminMonetizationProductModal } from '@/components/dashboard/admin-monetization-product-modal';
import { monetizationService } from '@/services/monetization.service';
import type { AdminServiceRole } from '@/services/admin.service';

interface AdminMonetizationProductCatalogProps {
  role: AdminServiceRole;
  boostsEnabled: boolean;
  featuredEnabled: boolean;
  onMessage: (message: string) => void;
  onError: (error: string) => void;
  onGoToAdvertising?: () => void;
}

function formatProductType(type: MonetizationProduct['type']): string {
  return type === 'listing_boost' ? 'Listing boost' : 'Featured slot';
}

function formatDuration(product: MonetizationProduct): string {
  if (product.durationDays != null) return `${product.durationDays}d`;
  if (product.durationHours != null) return `${product.durationHours}h`;
  return '—';
}

function isProductPublished(status: MonetizationProduct['status']): boolean {
  return status === 'published';
}

function nextStatusFromToggle(checked: boolean): MonetizationProduct['status'] {
  return checked ? 'published' : 'draft';
}

function ProductStatusToggle({
  product,
  disabled,
  onToggle,
}: {
  product: MonetizationProduct;
  disabled: boolean;
  onToggle: (product: MonetizationProduct, checked: boolean) => void;
}) {
  const published = isProductPublished(product.status);

  return (
    <button
      type="button"
      role="switch"
      aria-checked={published}
      aria-label={`${published ? 'Unpublish' : 'Publish'} ${product.name}`}
      disabled={disabled}
      onClick={() => onToggle(product, !published)}
      className={cn(
        'relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-[hsl(var(--dashboard-accent))] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
        published
          ? 'bg-[hsl(var(--dashboard-accent))]'
          : 'bg-[hsl(var(--dashboard-sidebar-border))]',
      )}
    >
      <span
        className={cn(
          'pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transition-transform',
          published ? 'translate-x-5' : 'translate-x-0',
        )}
      />
    </button>
  );
}

export function AdminMonetizationProductCatalog({
  role,
  boostsEnabled,
  featuredEnabled,
  onMessage,
  onError,
  onGoToAdvertising,
}: AdminMonetizationProductCatalogProps) {
  const [products, setProducts] = useState<MonetizationProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<MonetizationProduct | null>(null);
  const [statusUpdatingId, setStatusUpdatingId] = useState<string | null>(null);
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;

  const loadProducts = useCallback(async (opts?: { silent?: boolean }) => {
    if (!opts?.silent) setLoading(true);
    try {
      const data = await monetizationService.listMonetizationProducts(role);
      setProducts(data);
    } catch (err) {
      onErrorRef.current(err instanceof Error ? err.message : 'Failed to load products');
    } finally {
      setLoading(false);
    }
  }, [role]);

  useEffect(() => {
    void loadProducts();
  }, [loadProducts]);

  function openCreateModal() {
    setEditingProduct(null);
    setModalOpen(true);
  }

  function openEditModal(product: MonetizationProduct) {
    setEditingProduct(product);
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingProduct(null);
  }

  async function handleSaveProduct(
    payload: MonetizationProductUpsertInput | Partial<MonetizationProductUpsertInput>,
    productId?: string,
  ) {
    onError('');
    if (productId) {
      await monetizationService.updateMonetizationProduct(
        role,
        productId,
        payload as Partial<MonetizationProductUpsertInput>,
      );
      onMessage('Product updated.');
    } else {
      await monetizationService.createMonetizationProduct(
        role,
        payload as MonetizationProductUpsertInput,
      );
      onMessage('Product created.');
    }
    await loadProducts({ silent: true });
  }

  async function handleToggleStatus(product: MonetizationProduct, checked: boolean) {
    const nextStatus = nextStatusFromToggle(checked);
    if (product.status === nextStatus) return;

    setStatusUpdatingId(product.id);
    onError('');
    try {
      await monetizationService.updateMonetizationProduct(role, product.id, {
        status: nextStatus,
      });
      setProducts((current) =>
        current.map((row) => (row.id === product.id ? { ...row, status: nextStatus } : row)),
      );
      onMessage(nextStatus === 'published' ? 'Product published.' : 'Product moved to draft.');
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Failed to update product status');
    } finally {
      setStatusUpdatingId(null);
    }
  }

  return (
    <div className="space-y-4">
      {(!boostsEnabled || !featuredEnabled) && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {!boostsEnabled && !featuredEnabled
            ? 'Listing boosts and featured slots are turned off.'
            : !boostsEnabled
              ? 'Listing boosts are turned off — boost SKUs will not appear for sellers.'
              : 'Featured slots are turned off — featured SKUs will not appear for sellers.'}{' '}
          {onGoToAdvertising ? (
            <button
              type="button"
              onClick={onGoToAdvertising}
              className="font-medium underline hover:no-underline"
            >
              Enable modules on Advertising
            </button>
          ) : (
            'Enable them on the Advertising tab.'
          )}
        </div>
      )}

      <DashboardCard title="Listing promotions">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-[hsl(var(--dashboard-sidebar-muted))]">
            Manage boost and featured SKUs. Toggle the slider to publish a product for sellers.
            Module on/off switches live on the Advertising tab.
          </p>
          <button
            type="button"
            onClick={openCreateModal}
            className="rounded-lg bg-[hsl(var(--dashboard-accent))] px-4 py-2 text-sm font-medium text-white sm:shrink-0"
          >
            Add product
          </button>
        </div>

        {loading && products.length === 0 ? (
          <p className="text-sm text-[hsl(var(--dashboard-sidebar-muted))]">Loading products…</p>
        ) : products.length === 0 ? (
          <div className="rounded-lg border border-dashed border-[hsl(var(--dashboard-sidebar-border))] px-4 py-8 text-center">
            <p className="text-sm text-[hsl(var(--dashboard-sidebar-muted))]">
              No products yet. Add a listing boost or featured slot to get started.
            </p>
            <button
              type="button"
              onClick={openCreateModal}
              className="mt-4 rounded-lg border border-[hsl(var(--dashboard-sidebar-border))] px-4 py-2 text-sm font-medium hover:bg-[hsl(var(--dashboard-sidebar-active)/0.35)]"
            >
              Add product
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[hsl(var(--dashboard-sidebar-border))] text-[hsl(var(--dashboard-sidebar-muted))]">
                  <th className="py-2 pr-4 font-medium">Type</th>
                  <th className="py-2 pr-4 font-medium">Code</th>
                  <th className="py-2 pr-4 font-medium">Name</th>
                  <th className="py-2 pr-4 font-medium">Price</th>
                  <th className="py-2 pr-4 font-medium">Duration</th>
                  <th className="py-2 pr-4 font-medium">Status</th>
                  <th className="py-2 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr
                    key={product.id}
                    className="border-b border-[hsl(var(--dashboard-sidebar-border)/0.5)]"
                  >
                    <td className="py-2 pr-4">{formatProductType(product.type)}</td>
                    <td className="py-2 pr-4 font-mono text-xs">{product.code}</td>
                    <td className="py-2 pr-4">{product.name}</td>
                    <td className="py-2 pr-4">
                      {product.price.toFixed(2)} {product.currency}
                    </td>
                    <td className="py-2 pr-4">{formatDuration(product)}</td>
                    <td className="py-2 pr-4">
                      {statusUpdatingId === product.id ? (
                        <Loader2 className="h-5 w-5 animate-spin text-[hsl(var(--dashboard-sidebar-muted))]" />
                      ) : (
                        <ProductStatusToggle
                          product={product}
                          disabled={statusUpdatingId != null}
                          onToggle={(row, checked) => void handleToggleStatus(row, checked)}
                        />
                      )}
                    </td>
                    <td className="py-2">
                      <button
                        type="button"
                        onClick={() => openEditModal(product)}
                        aria-label={`Edit ${product.name}`}
                        className="rounded-lg p-2 text-[hsl(var(--dashboard-sidebar-muted))] transition-colors hover:bg-[hsl(var(--dashboard-sidebar-active)/0.35)] hover:text-[hsl(var(--dashboard-main-fg))]"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </DashboardCard>

      <AdminMonetizationProductModal
        open={modalOpen}
        product={editingProduct}
        onClose={closeModal}
        onSave={handleSaveProduct}
      />
    </div>
  );
}
