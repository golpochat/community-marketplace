'use client';

import { useEffect, useState } from 'react';

import type { PlatformSettings } from '@community-marketplace/types';
import { Button, Input, Label, useToast } from '@community-marketplace/ui';

import { adminService } from '@/services/admin.service';

export function SettingsPanel() {
  const { toast } = useToast();
  const [settings, setSettings] = useState<PlatformSettings | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void adminService.getPlatformSettings().then(setSettings);
  }, []);

  async function save() {
    if (!settings) return;
    setSaving(true);
    try {
      const updated = await adminService.updatePlatformSettings(settings);
      setSettings(updated);
      toast({ title: 'Settings saved', variant: 'success' });
    } catch {
      toast({ title: 'Save failed', variant: 'error' });
    } finally {
      setSaving(false);
    }
  }

  if (!settings) return <p className="text-sm text-muted-foreground">Loading settings…</p>;

  return (
    <div className="max-w-xl space-y-6">
      <div className="space-y-2">
        <Label>Platform name</Label>
        <Input
          value={settings.platformName}
          onChange={(e) => setSettings({ ...settings, platformName: e.target.value })}
        />
      </div>
      <div className="space-y-2">
        <Label>Support email</Label>
        <Input
          value={settings.supportEmail}
          onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
        />
      </div>
      <div className="space-y-2">
        <Label>Default currency</Label>
        <Input
          value={settings.defaultCurrency}
          onChange={(e) => setSettings({ ...settings, defaultCurrency: e.target.value })}
        />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={settings.maintenanceMode}
          onChange={(e) => setSettings({ ...settings, maintenanceMode: e.target.checked })}
        />
        Maintenance mode
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={settings.emailNotificationsEnabled}
          onChange={(e) => setSettings({ ...settings, emailNotificationsEnabled: e.target.checked })}
        />
        Email notifications enabled
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={settings.securityMfaRequired}
          onChange={(e) => setSettings({ ...settings, securityMfaRequired: e.target.checked })}
        />
        Require MFA for admins
      </label>
      <Button onClick={() => void save()} disabled={saving}>
        {saving ? 'Saving…' : 'Save settings'}
      </Button>
    </div>
  );
}
