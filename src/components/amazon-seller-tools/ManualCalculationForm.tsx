import { Button, CardContent, Input, Label } from '@/components/ui';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { CurrencySelector } from './CurrencySelector';
import React, { ChangeEvent, useCallback, useEffect, useState } from 'react';
import { getItem, setItem } from '@/lib/indexeddb-service';
import { toast } from 'sonner';
import { Save, FolderOpen } from 'lucide-react';

interface ManualCalculationFormProps {
  selectedCurrency: {
    label: string;
    value: string;
    symbol: string;
  };
  setSelectedCurrency: (currency: {
    label: string;
    value: string;
    symbol: string;
  }) => void;
  manualCampaign: {
    campaign: string;
    adSpend: string;
    sales: string;
    impressions: string;
    clicks: string;
  };
  setManualCampaign: React.Dispatch<
    React.SetStateAction<{
      campaign: string;
      adSpend: string;
      sales: string;
      impressions: string;
      clicks: string;
    }>
  >;
  handleManualCalculate: () => Promise<void>;
  isManualInputValid: boolean;
  isLoading: boolean;
}

export function ManualCalculationForm({
  selectedCurrency,
  setSelectedCurrency,
  manualCampaign,
  setManualCampaign,
  handleManualCalculate,
  isManualInputValid,
  isLoading,
}: ManualCalculationFormProps) {
  const [presetName, setPresetName] = useState('');
  const [savedPresets, setSavedPresets] = useState<
    Record<
      string,
      {
        campaign: string;
        adSpend: string;
        sales: string;
        impressions: string;
        clicks: string;
      }
    >
  >({});

  useEffect(() => {
    const loadPresets = async () => {
      try {
        const presets = await getItem<
          Record<
            string,
            {
              campaign: string;
              adSpend: string;
              sales: string;
              impressions: string;
              clicks: string;
            }
          >
        >('cache', 'acos_manual_presets'); // Use 'cache' store
        setSavedPresets(presets || {});
      } catch (error) {
        console.error('Failed to load presets:', error);
        toast.error('Failed to load saved presets.');
      }
    };
    loadPresets();
  }, []);

  const handleInputChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;
      let sanitizedValue = value;
      if (name === 'adSpend' || name === 'sales') {
        sanitizedValue = value
          .replace(/[^\d.]/g, '')
          .replace(/(\..*)\./g, '$1')
          .replace(/^\./, '0.')
          .replace(/^0+(?=\d)/, '');
      } else if (name === 'campaign') {
        sanitizedValue = value.trimStart().slice(0, 100);
      }
      setManualCampaign(
        (prev: {
          campaign: string;
          adSpend: string;
          sales: string;
          impressions: string;
          clicks: string;
        }) => ({ ...prev, [name]: sanitizedValue }),
      );
    },
    [setManualCampaign],
  );

  const handleSavePreset = async () => {
    if (!presetName.trim()) {
      toast.error('Please enter a name for the preset.');
      return;
    }
    const newPresets = { ...savedPresets, [presetName.trim()]: manualCampaign };
    try {
      await setItem('cache', 'acos_manual_presets', newPresets); // Use 'cache' store
      setSavedPresets(newPresets);
      toast.success(`Preset "${presetName.trim()}" saved!`);
      setPresetName(''); // Clear preset name input
    } catch (error) {
      console.error('Failed to save preset:', error);
      toast.error('Failed to save preset.');
    }
  };

  const handleLoadPreset = (name: string) => {
    const preset = savedPresets[name];
    if (preset) {
      setManualCampaign(preset);
      toast.success(`Preset "${name}" loaded!`);
    } else {
      toast.error('Preset not found.');
    }
  };

  return (
    <CardContent className="space-y-4">
      <CurrencySelector
        onCurrencyChange={(currency) => setSelectedCurrency(currency)}
      />
      <div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <Label htmlFor="manual-campaign">Campaign Name*</Label>
            </TooltipTrigger>
            <TooltipContent>Enter the name of the campaign.</TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <Input
          id="manual-campaign"
          name="campaign"
          value={manualCampaign.campaign}
          onChange={handleInputChange}
          placeholder="e.g., SP - Auto - Product A"
          disabled={isLoading}
        />
      </div>
      <div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <Label htmlFor="manual-adSpend">Ad Spend ($)*</Label>
            </TooltipTrigger>
            <TooltipContent>
              Enter the amount spent on advertising for this campaign.
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <Input
          id="manual-adSpend"
          name="adSpend"
          type="text"
          inputMode="decimal"
          value={manualCampaign.adSpend}
          onChange={handleInputChange}
          placeholder="e.g., 150.75"
          disabled={isLoading}
        />
      </div>
      <div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <Label htmlFor="manual-sales">Sales ($)*</Label>
            </TooltipTrigger>
            <TooltipContent>
              Enter the total sales generated by this campaign.
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <Input
          id="manual-sales"
          name="sales"
          type="text"
          inputMode="decimal"
          value={manualCampaign.sales}
          onChange={handleInputChange}
          placeholder="e.g., 600.50"
          disabled={isLoading}
        />
      </div>
      <div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <Label htmlFor="manual-impressions">Impressions</Label>
            </TooltipTrigger>
            <TooltipContent>
              Enter the number of impressions for this campaign.
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <Input
          id="manual-impressions"
          name="impressions"
          type="text"
          inputMode="numeric"
          value={manualCampaign.impressions}
          onChange={handleInputChange}
          placeholder="e.g., 1000"
          disabled={isLoading}
        />
      </div>
      <div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <Label htmlFor="manual-clicks">Clicks</Label>
            </TooltipTrigger>
            <TooltipContent>
              Enter the number of clicks for this campaign.
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <Input
          id="manual-clicks"
          name="clicks"
          type="text"
          inputMode="numeric"
          value={manualCampaign.clicks}
          onChange={handleInputChange}
          placeholder="e.g., 50"
          disabled={isLoading}
        />
      </div>
      <Button
        onClick={handleManualCalculate}
        disabled={!isManualInputValid || isLoading}
        className="w-full"
      >
        {isLoading ? 'Calculating...' : 'Calculate & Add'}
      </Button>

      <div className="border-t pt-4 mt-4 space-y-3">
        <h4 className="text-md font-semibold">Save/Load Presets</h4>
        <div>
          <Label htmlFor="preset-name">Preset Name</Label>
          <Input
            id="preset-name"
            value={presetName}
            onChange={(e) => setPresetName(e.target.value)}
            placeholder="e.g., My Default Campaign"
            disabled={isLoading}
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleSavePreset}
            disabled={isLoading || !presetName.trim()}
            className="flex-1"
          >
            <Save className="mr-2 h-4 w-4" /> Save Current as Preset
          </Button>
        </div>
        {Object.keys(savedPresets).length > 0 && (
          <div className="space-y-2">
            <Label>Load Existing Preset</Label>
            <div className="grid grid-cols-2 gap-2">
              {Object.keys(savedPresets).map((name) => (
                <Button
                  key={name}
                  variant="secondary"
                  onClick={() => handleLoadPreset(name)}
                  disabled={isLoading}
                  className="flex items-center justify-center"
                >
                  <FolderOpen className="mr-2 h-4 w-4" /> {name}
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>
    </CardContent>
  );
}
