import React from 'react';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Settings, Brain, Thermometer, Key } from 'lucide-react';
import { AIModel } from '@/lib/prompt-generator/types';
import {
  AI_MODELS,
  DEFAULT_TEMPERATURE,
} from '@/lib/prompt-generator/constants';
import { cn } from '@/lib/utils';

// Constants for temperature labels to avoid duplicate strings
const TEMPERATURE_LABELS = {
  CONSERVATIVE: 'Conservative',
  BALANCED: 'Balanced',
  CREATIVE: 'Creative',
} as const;

// Constants for CSS classes to avoid duplicate strings
const CSS_CLASSES = {
  BUTTON_BASE: 'h-8 px-2 text-xs',
  BUTTON_ACTIVE: 'bg-purple-100 border-purple-300 text-purple-700',
} as const;

interface AISettingsProps {
  aiModel: AIModel;
  temperature: number;
  geminiApiKey?: string;
  onModelChange: (model: AIModel) => void;
  onTemperatureChange: (temperature: number) => void;
  onGeminiApiKeyChange?: (apiKey: string) => void;
  className?: string;
}

export const AISettings: React.FC<AISettingsProps> = ({
  aiModel,
  temperature,
  geminiApiKey,
  onModelChange,
  onTemperatureChange,
  onGeminiApiKeyChange,
  className,
}) => {
  const [isExpanded, setIsExpanded] = React.useState(false);

  const currentModel = AI_MODELS.find((model) => model.value === aiModel);

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="w-4 h-4 text-purple-600" />
          <Label className="text-sm font-medium">AI Settings</Label>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="h-8 px-2"
        >
          <Settings className="w-4 h-4" />
        </Button>
      </div>

      {isExpanded && (
        <div className="space-y-4 p-4 bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-950/20 dark:to-indigo-950/20 rounded-lg border border-purple-100 dark:border-purple-800">
          {/* Model Selection */}
          <div className="space-y-2">
            <Label htmlFor="ai-model" className="text-sm">
              Model
            </Label>
            <Select<AIModel> value={aiModel} onValueChange={onModelChange}>
              <SelectTrigger
                id="ai-model"
                className="bg-background border-border"
              >
                <SelectValue>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{currentModel?.label}</span>
                    <span className="text-xs text-muted-foreground">
                      ({currentModel?.provider})
                    </span>
                  </div>
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="bg-background border-border">
                {AI_MODELS.map((model) => (
                  <SelectItem
                    key={model.value}
                    value={model.value}
                    label={model.label}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{model.label}</span>
                      <span className="text-xs text-muted-foreground">
                        {model.provider}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Temperature Control */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="temperature" className="text-sm">
                <div className="flex items-center gap-2">
                  <Thermometer className="w-4 h-4" />
                  Temperature
                </div>
              </Label>
              <span className="text-sm font-medium text-purple-600 dark:text-purple-400">
                {temperature.toFixed(1)}
              </span>
            </div>
            <Slider
              id="temperature"
              min={0}
              max={2}
              step={0.1}
              value={[temperature]}
              onValueChange={(value) => onTemperatureChange(value[0])}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{TEMPERATURE_LABELS.CONSERVATIVE}</span>
              <span>{TEMPERATURE_LABELS.BALANCED}</span>
              <span>{TEMPERATURE_LABELS.CREATIVE}</span>
            </div>
          </div>

          {/* Quick Presets */}
          <div className="space-y-2">
            <Label className="text-sm">Quick Presets</Label>
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onTemperatureChange(0.3)}
                className={cn(
                  CSS_CLASSES.BUTTON_BASE,
                  temperature === 0.3 && CSS_CLASSES.BUTTON_ACTIVE,
                )}
              >
                Precise
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onTemperatureChange(DEFAULT_TEMPERATURE)}
                className={cn(
                  CSS_CLASSES.BUTTON_BASE,
                  temperature === DEFAULT_TEMPERATURE &&
                    CSS_CLASSES.BUTTON_ACTIVE,
                )}
              >
                Balanced
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onTemperatureChange(1.2)}
                className={cn(
                  CSS_CLASSES.BUTTON_BASE,
                  temperature === 1.2 && CSS_CLASSES.BUTTON_ACTIVE,
                )}
              >
                Creative
              </Button>
            </div>
          </div>

          {/* Gemini API Key */}
          <div className="space-y-2">
            <Label htmlFor="gemini-api-key" className="text-sm">
              <div className="flex items-center gap-2">
                <Key className="w-4 h-4" />
                Gemini API Key (Optional)
              </div>
            </Label>
            <Input
              id="gemini-api-key"
              type="password"
              placeholder="Enter your Gemini API key for direct access"
              value={geminiApiKey || ''}
              onChange={(e) => onGeminiApiKeyChange?.(e.target.value)}
              className="bg-background border-border text-sm"
              isInvalid={
                geminiApiKey ? !geminiApiKey.startsWith('AIza') : false
              }
              errorMessage={
                geminiApiKey && !geminiApiKey.startsWith('AIza')
                  ? 'Gemini API keys typically start with "AIza"'
                  : undefined
              }
            />
            <p className="text-xs text-muted-foreground">
              Optional: Add your own Gemini API key to use gemini-2.5-flash
              directly. Leave empty to use the default service.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
