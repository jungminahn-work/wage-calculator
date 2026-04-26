'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { saveSettings } from '@/lib/storage';
import type { Settings, TaxCategory } from '@/types';

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
  settings: Settings;
  onSave: (settings: Settings) => void;
}

const CATEGORY_HELP: Record<TaxCategory, string> = {
  resident:
    'Most people living in Australia long-term — permanent residents, citizens, student visa holders (6+ month courses), 485 and 482 visa holders.',
  whm: 'Holders of a 417 (Working Holiday) or 462 (Work and Holiday) visa.',
  foreign_resident:
    'Short-term visitors, stays under 6 months, or working holiday makers whose employer is not registered with the ATO as a WHM employer.',
};

export default function SettingsModal({ open, onClose, settings, onSave }: SettingsModalProps) {
  const [rate, setRate] = useState(String(settings.weekdayRate || ''));
  const [category, setCategory] = useState<TaxCategory>(settings.taxCategory);
  const [medicare, setMedicare] = useState(settings.applyMedicareLevy);
  const [tfn, setTfn] = useState(settings.tfnSubmitted);
  const [employer, setEmployer] = useState(settings.employerRegistered);

  const weekendRate = rate ? (Number(rate) * settings.weekendMultiplier).toFixed(2) : '—';
  const holidayRate = rate ? (Number(rate) * settings.holidayMultiplier).toFixed(2) : '—';

  function handleSave() {
    const parsed = parseFloat(rate);
    if (isNaN(parsed) || parsed <= 0) return;
    const updated: Settings = {
      ...settings,
      weekdayRate: parsed,
      taxCategory: category,
      applyMedicareLevy: medicare,
      tfnSubmitted: tfn,
      employerRegistered: employer,
    };
    saveSettings(updated);
    onSave(updated);
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm max-h-[90vh] overflow-y-auto">
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

          <div className="border-t border-border pt-4 space-y-2">
            <label className="block text-sm font-medium">Tax category (visa status)</label>
            <select
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              value={category}
              onChange={(e) => setCategory(e.target.value as TaxCategory)}
            >
              <option value="resident">Resident (PR / Student / 485 etc.)</option>
              <option value="whm">Working Holiday Maker (417/462)</option>
              <option value="foreign_resident">Foreign Resident (non-resident)</option>
            </select>
            <p className="text-xs text-muted-foreground leading-relaxed">{CATEGORY_HELP[category]}</p>

            {category === 'resident' && (
              <label className="flex items-center gap-2 text-sm pt-1">
                <input
                  type="checkbox"
                  checked={medicare}
                  onChange={(e) => setMedicare(e.target.checked)}
                />
                Apply Medicare Levy (2%)
              </label>
            )}

            {category === 'whm' && (
              <div className="space-y-1.5 pt-1">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={tfn}
                    onChange={(e) => setTfn(e.target.checked)}
                  />
                  TFN submitted to employer
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={employer}
                    onChange={(e) => setEmployer(e.target.checked)}
                  />
                  Employer registered as WHM employer
                </label>
                {(!tfn || !employer) && (
                  <p className="text-xs text-amber-600 dark:text-amber-400">
                    ⚠️ {!tfn ? '45% will be withheld' : 'Foreign resident rates apply'}
                  </p>
                )}
              </div>
            )}

            <a
              href="https://www.ato.gov.au/calculators-and-tools/tax-return-work-out-your-tax-residency"
              target="_blank"
              rel="noreferrer"
              className="block text-xs text-blue-600 dark:text-blue-400 underline pt-1"
            >
              Not sure? → Check the ATO Residency Tool
            </a>
          </div>

          <p className="text-xs text-muted-foreground">
            Tax estimates are simplified PAYG only. Actual figures may differ.
          </p>

          <Button onClick={handleSave} className="w-full" disabled={!rate || Number(rate) <= 0}>
            Save
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
