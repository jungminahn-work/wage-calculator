'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { saveSettings } from '@/lib/storage';
import type { Settings } from '@/types';

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
  settings: Settings;
  onSave: (settings: Settings) => void;
}

export default function SettingsModal({ open, onClose, settings, onSave }: SettingsModalProps) {
  const [rate, setRate] = useState(String(settings.weekdayRate || ''));

  const weekendRate = rate ? (Number(rate) * settings.weekendMultiplier).toFixed(2) : '—';
  const holidayRate = rate ? (Number(rate) * settings.holidayMultiplier).toFixed(2) : '—';

  function handleSave() {
    const parsed = parseFloat(rate);
    if (isNaN(parsed) || parsed <= 0) return;
    const updated = { ...settings, weekdayRate: parsed };
    saveSettings(updated);
    onSave(updated);
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium">Weekday hourly rate (AUD)</label>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">$</span>
              <input
                type="number"
                min="0"
                step="0.01"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                value={rate}
                onChange={(e) => setRate(e.target.value)}
                placeholder="e.g. 30.00"
              />
            </div>
          </div>

          <div className="rounded-lg bg-muted p-3 space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Weekend (×1.25)</span>
              <span className="font-medium">${weekendRate}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Public holiday (×2.0)</span>
              <span className="font-medium">${holidayRate}</span>
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            Rates are indicative only. Actual pay depends on your Award or Enterprise Agreement.
          </p>
        </div>

        <Button onClick={handleSave} className="w-full" disabled={!rate || Number(rate) <= 0}>
          Save
        </Button>
      </DialogContent>
    </Dialog>
  );
}
