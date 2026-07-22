'use client';

import { useCallback, useEffect, useState } from 'react';

import type {
  DisplayAdCampaign,
  DisplayAdPlacement,
} from '@community-marketplace/types';
import { DISPLAY_AD_PLACEMENTS } from '@community-marketplace/types';
import { DashboardCard } from '@community-marketplace/ui-dashboard';

import { monetizationService } from '@/services/monetization.service';
import type { AdminServiceRole } from '@/services/admin.service';

const PLACEMENT_LABELS: Record<DisplayAdPlacement, string> = {
  homepage_leaderboard: 'Homepage leaderboard (728×90)',
  category_sidebar: 'Category sidebar (300×250)',
  search_results_inline: 'Search inline (320×100)',
};

const STATUS_LABELS: Record<DisplayAdCampaign['status'], string> = {
  draft: 'Draft',
  scheduled: 'Scheduled',
  live: 'Live',
  paused: 'Paused',
  ended: 'Ended',
};

function toDatetimeLocalValue(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function fromDatetimeLocalValue(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error('Invalid date');
  }
  return date.toISOString();
}

function defaultRange(): { startsAt: string; endsAt: string } {
  const start = new Date();
  const end = new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000);
  return {
    startsAt: toDatetimeLocalValue(start.toISOString()),
    endsAt: toDatetimeLocalValue(end.toISOString()),
  };
}

interface AdminMonetizationDisplayCampaignsProps {
  role: AdminServiceRole;
  onMessage: (message: string) => void;
  onError: (error: string) => void;
}

export function AdminMonetizationDisplayCampaigns({
  role,
  onMessage,
  onError,
}: AdminMonetizationDisplayCampaignsProps) {
  const [campaigns, setCampaigns] = useState<DisplayAdCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<DisplayAdCampaign | null>(null);

  const range = defaultRange();
  const [advertiserName, setAdvertiserName] = useState('');
  const [advertiserEmail, setAdvertiserEmail] = useState('');
  const [advertiserNotes, setAdvertiserNotes] = useState('');
  const [placement, setPlacement] = useState<DisplayAdPlacement>('homepage_leaderboard');
  const [startsAt, setStartsAt] = useState(range.startsAt);
  const [endsAt, setEndsAt] = useState(range.endsAt);
  const [clickUrl, setClickUrl] = useState('https://');
  const [altText, setAltText] = useState('');
  const [priority, setPriority] = useState('0');
  const [imageKey, setImageKey] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [publishOnSave, setPublishOnSave] = useState(true);
  const [uploading, setUploading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await monetizationService.listDisplayAdCampaigns(role);
      setCampaigns(data);
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Failed to load display campaigns');
    } finally {
      setLoading(false);
    }
  }, [role, onError]);

  useEffect(() => {
    void load();
  }, [load]);

  function resetForm() {
    const next = defaultRange();
    setEditing(null);
    setAdvertiserName('');
    setAdvertiserEmail('');
    setAdvertiserNotes('');
    setPlacement('homepage_leaderboard');
    setStartsAt(next.startsAt);
    setEndsAt(next.endsAt);
    setClickUrl('https://');
    setAltText('');
    setPriority('0');
    setImageKey('');
    setImageUrl('');
    setPublishOnSave(true);
  }

  function openCreate() {
    resetForm();
    setShowForm(true);
  }

  function openEdit(campaign: DisplayAdCampaign) {
    setEditing(campaign);
    setAdvertiserName(campaign.advertiserName);
    setAdvertiserEmail(campaign.advertiserEmail ?? '');
    setAdvertiserNotes(campaign.advertiserNotes ?? '');
    setPlacement(campaign.placement);
    setStartsAt(toDatetimeLocalValue(campaign.startsAt));
    setEndsAt(toDatetimeLocalValue(campaign.endsAt));
    setClickUrl(campaign.clickUrl);
    setAltText(campaign.altText ?? '');
    setPriority(String(campaign.priority));
    setImageKey(campaign.imageKey);
    setImageUrl(campaign.imageUrl);
    setPublishOnSave(false);
    setShowForm(true);
  }

  async function handleUpload(file: File) {
    setUploading(true);
    onError('');
    try {
      const contentType =
        file.type === 'image/png' || file.type === 'image/webp' || file.type === 'image/jpeg'
          ? file.type
          : null;
      if (!contentType) {
        throw new Error('Use JPEG, PNG, or WebP');
      }
      const upload = await monetizationService.createDisplayAdCreativeUploadUrl(role, {
        contentType,
        fileName: file.name,
      });
      const put = await fetch(upload.uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': contentType },
        body: file,
      });
      if (!put.ok) {
        throw new Error(`Upload failed (${put.status})`);
      }
      setImageKey(upload.key);
      setImageUrl(upload.publicUrl);
      onMessage('Creative uploaded.');
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Failed to upload creative');
    } finally {
      setUploading(false);
    }
  }

  async function handleSave(event: React.FormEvent) {
    event.preventDefault();
    if (!imageKey || !imageUrl) {
      onError('Upload a creative image first.');
      return;
    }
    setSaving(true);
    onError('');
    try {
      const payload = {
        advertiserName,
        advertiserEmail: advertiserEmail || undefined,
        advertiserNotes: advertiserNotes || undefined,
        placement,
        startsAt: fromDatetimeLocalValue(startsAt),
        endsAt: fromDatetimeLocalValue(endsAt),
        imageKey,
        imageUrl,
        clickUrl,
        altText: altText || undefined,
        priority: Number(priority) || 0,
      };
      if (editing) {
        await monetizationService.updateDisplayAdCampaign(role, editing.id, payload);
        onMessage('Campaign updated.');
      } else {
        await monetizationService.createDisplayAdCampaign(role, {
          ...payload,
          publish: publishOnSave,
        });
        onMessage(publishOnSave ? 'Campaign published.' : 'Campaign saved as draft.');
      }
      setShowForm(false);
      resetForm();
      await load();
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Failed to save campaign');
    } finally {
      setSaving(false);
    }
  }

  async function handleStatus(id: string, action: 'publish' | 'pause' | 'end') {
    setSaving(true);
    onError('');
    try {
      await monetizationService.applyDisplayAdCampaignStatus(role, id, action);
      onMessage(
        action === 'publish'
          ? 'Campaign published.'
          : action === 'pause'
            ? 'Campaign paused.'
            : 'Campaign ended.',
      );
      await load();
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Failed to update campaign status');
    } finally {
      setSaving(false);
    }
  }

  return (
    <DashboardCard title="Display campaigns">
      <p className="mb-4 text-xs text-[hsl(var(--dashboard-sidebar-muted))]">
        Admin-run brand banners for existing slots. Payment stays offline. Homepage leaderboard is
        live on the site; other placements are ready when those pages mount the ad section. Requires
        Display advertising published + deploy flags.
      </p>

      <div className="mb-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={openCreate}
          className="rounded-lg bg-[hsl(var(--dashboard-accent))] px-4 py-2 text-sm font-medium text-white"
        >
          New campaign
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={(e) => void handleSave(e)}
          className="mb-6 space-y-3 rounded-lg border border-[hsl(var(--dashboard-sidebar-border))] p-4"
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm">
              <span className="mb-1 block font-medium">Advertiser name</span>
              <input
                required
                value={advertiserName}
                onChange={(e) => setAdvertiserName(e.target.value)}
                className="w-full rounded-lg border border-[hsl(var(--dashboard-sidebar-border))] px-3 py-2 text-sm"
              />
            </label>
            <label className="text-sm">
              <span className="mb-1 block font-medium">Advertiser email (optional)</span>
              <input
                type="email"
                value={advertiserEmail}
                onChange={(e) => setAdvertiserEmail(e.target.value)}
                className="w-full rounded-lg border border-[hsl(var(--dashboard-sidebar-border))] px-3 py-2 text-sm"
              />
            </label>
            <label className="text-sm sm:col-span-2">
              <span className="mb-1 block font-medium">Notes (optional)</span>
              <input
                value={advertiserNotes}
                onChange={(e) => setAdvertiserNotes(e.target.value)}
                className="w-full rounded-lg border border-[hsl(var(--dashboard-sidebar-border))] px-3 py-2 text-sm"
              />
            </label>
            <label className="text-sm">
              <span className="mb-1 block font-medium">Placement</span>
              <select
                value={placement}
                onChange={(e) => setPlacement(e.target.value as DisplayAdPlacement)}
                className="w-full rounded-lg border border-[hsl(var(--dashboard-sidebar-border))] px-3 py-2 text-sm"
              >
                {DISPLAY_AD_PLACEMENTS.map((code) => (
                  <option key={code} value={code}>
                    {PLACEMENT_LABELS[code]}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm">
              <span className="mb-1 block font-medium">Priority</span>
              <input
                type="number"
                min={0}
                max={1000}
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full rounded-lg border border-[hsl(var(--dashboard-sidebar-border))] px-3 py-2 text-sm"
              />
            </label>
            <label className="text-sm">
              <span className="mb-1 block font-medium">Starts</span>
              <input
                type="datetime-local"
                required
                value={startsAt}
                onChange={(e) => setStartsAt(e.target.value)}
                className="w-full rounded-lg border border-[hsl(var(--dashboard-sidebar-border))] px-3 py-2 text-sm"
              />
            </label>
            <label className="text-sm">
              <span className="mb-1 block font-medium">Ends</span>
              <input
                type="datetime-local"
                required
                value={endsAt}
                onChange={(e) => setEndsAt(e.target.value)}
                className="w-full rounded-lg border border-[hsl(var(--dashboard-sidebar-border))] px-3 py-2 text-sm"
              />
            </label>
            <label className="text-sm sm:col-span-2">
              <span className="mb-1 block font-medium">Click URL (HTTPS)</span>
              <input
                type="url"
                required
                value={clickUrl}
                onChange={(e) => setClickUrl(e.target.value)}
                className="w-full rounded-lg border border-[hsl(var(--dashboard-sidebar-border))] px-3 py-2 text-sm"
              />
            </label>
            <label className="text-sm sm:col-span-2">
              <span className="mb-1 block font-medium">Alt text (optional)</span>
              <input
                value={altText}
                onChange={(e) => setAltText(e.target.value)}
                className="w-full rounded-lg border border-[hsl(var(--dashboard-sidebar-border))] px-3 py-2 text-sm"
              />
            </label>
            <label className="text-sm sm:col-span-2">
              <span className="mb-1 block font-medium">Creative image</span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                disabled={uploading || saving}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void handleUpload(file);
                }}
                className="w-full text-sm"
              />
              {imageUrl ? (
                <p className="mt-2 text-xs text-[hsl(var(--dashboard-sidebar-muted))]">
                  Uploaded ·{' '}
                  <a
                    href={imageUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[hsl(var(--dashboard-accent))] underline"
                  >
                    preview
                  </a>
                </p>
              ) : (
                <p className="mt-1 text-xs text-[hsl(var(--dashboard-sidebar-muted))]">
                  Match placement size when possible (e.g. 728×90 for homepage).
                </p>
              )}
            </label>
          </div>

          {!editing && (
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={publishOnSave}
                onChange={(e) => setPublishOnSave(e.target.checked)}
              />
              Publish on save (live or scheduled by dates)
            </label>
          )}

          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              disabled={saving || uploading}
              className="rounded-lg bg-[hsl(var(--dashboard-accent))] px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {saving ? 'Saving…' : editing ? 'Update campaign' : 'Create campaign'}
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={() => {
                setShowForm(false);
                resetForm();
              }}
              className="rounded-lg border border-[hsl(var(--dashboard-sidebar-border))] px-4 py-2 text-sm"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <h3 className="mb-2 text-sm font-medium text-[hsl(var(--dashboard-main-fg))]">Campaigns</h3>
      {loading ? (
        <p className="text-sm text-[hsl(var(--dashboard-sidebar-muted))]">Loading…</p>
      ) : campaigns.length === 0 ? (
        <p className="text-sm text-[hsl(var(--dashboard-sidebar-muted))]">No campaigns yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[40rem] text-left text-sm">
            <thead>
              <tr className="border-b border-[hsl(var(--dashboard-sidebar-border))] text-[hsl(var(--dashboard-sidebar-muted))]">
                <th className="py-2 pr-3 font-medium">Advertiser</th>
                <th className="py-2 pr-3 font-medium">Placement</th>
                <th className="py-2 pr-3 font-medium">Status</th>
                <th className="py-2 pr-3 font-medium">Schedule</th>
                <th className="py-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map((campaign) => (
                <tr
                  key={campaign.id}
                  className="border-b border-[hsl(var(--dashboard-sidebar-border)/0.5)]"
                >
                  <td className="py-2 pr-3">{campaign.advertiserName}</td>
                  <td className="py-2 pr-3 text-xs">{campaign.placement}</td>
                  <td className="py-2 pr-3">{STATUS_LABELS[campaign.status]}</td>
                  <td className="py-2 pr-3 text-xs text-[hsl(var(--dashboard-sidebar-muted))]">
                    {new Date(campaign.startsAt).toLocaleString()} →{' '}
                    {new Date(campaign.endsAt).toLocaleString()}
                  </td>
                  <td className="py-2">
                    <div className="flex flex-wrap gap-2">
                      {campaign.status !== 'ended' && (
                        <button
                          type="button"
                          disabled={saving}
                          onClick={() => openEdit(campaign)}
                          className="text-[hsl(var(--dashboard-accent))] hover:underline disabled:opacity-50"
                        >
                          Edit
                        </button>
                      )}
                      {(campaign.status === 'draft' || campaign.status === 'paused') && (
                        <button
                          type="button"
                          disabled={saving}
                          onClick={() => void handleStatus(campaign.id, 'publish')}
                          className="text-[hsl(var(--dashboard-accent))] hover:underline disabled:opacity-50"
                        >
                          Publish
                        </button>
                      )}
                      {(campaign.status === 'live' || campaign.status === 'scheduled') && (
                        <button
                          type="button"
                          disabled={saving}
                          onClick={() => void handleStatus(campaign.id, 'pause')}
                          className="text-[hsl(var(--dashboard-accent))] hover:underline disabled:opacity-50"
                        >
                          Pause
                        </button>
                      )}
                      {campaign.status !== 'ended' && (
                        <button
                          type="button"
                          disabled={saving}
                          onClick={() => void handleStatus(campaign.id, 'end')}
                          className="text-[hsl(var(--dashboard-accent))] hover:underline disabled:opacity-50"
                        >
                          End
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </DashboardCard>
  );
}
