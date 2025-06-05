import React, { useState, useEffect } from 'react';
import { Button } from 'components/ui/button';
import { Label } from 'components/ui/label';
import { Input } from 'components/ui/input';
import { Checkbox } from 'components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from 'components/ui/radio-group';
import type { ColumnTransformationRules } from 'types/data-mapping';
import { Plus, X } from 'lucide-react';
import styles from './GenericCsvDataMapper.module.css'; // Re-use styles or define new ones

interface TransformationModalContentProps {
  fieldLabel: string;
  initialRules: ColumnTransformationRules | undefined;
  onApplyRules: (rules: ColumnTransformationRules) => void;
  onCancel: () => void;
}

const TransformationModalContent: React.FC<TransformationModalContentProps> = ({
  fieldLabel,
  initialRules,
  onApplyRules,
  onCancel,
}) => {
  const [trim, setTrim] = useState<boolean>(initialRules?.trim || false);
  const [caseTransform, setCaseTransform] = useState<
    'none' | 'upper' | 'lower' | 'title'
  >(initialRules?.case || 'none');
  const [findReplaceRules, setFindReplaceRules] = useState<
    { find: string; replace: string }[]
  >(initialRules?.findReplace || []);

  useEffect(() => {
    // Update internal state if initialRules prop changes (e.g., when modal opens for a different field)
    setTrim(initialRules?.trim || false);
    setCaseTransform(initialRules?.case || 'none');
    setFindReplaceRules(initialRules?.findReplace || []);
  }, [initialRules]);

  const handleAddFindReplaceRule = () => {
    setFindReplaceRules([...findReplaceRules, { find: '', replace: '' }]);
  };

  const handleRemoveFindReplaceRule = (index: number) => {
    setFindReplaceRules(findReplaceRules.filter((_, i) => i !== index));
  };

  const handleFindReplaceChange = (
    index: number,
    type: 'find' | 'replace',
    value: string,
  ) => {
    const newRules = [...findReplaceRules];
    newRules[index] = { ...newRules[index], [type]: value };
    setFindReplaceRules(newRules);
  };

  const handleApply = () => {
    const rules: ColumnTransformationRules = {};
    if (trim) rules.trim = true;
    if (caseTransform !== 'none') rules.case = caseTransform;
    if (findReplaceRules.length > 0) {
      // Filter out empty find/replace rules to avoid saving unnecessary data
      rules.findReplace = findReplaceRules.filter(
        (rule) => rule.find.trim() !== '' || rule.replace.trim() !== '',
      );
    }
    onApplyRules(rules);
  };

  return (
    <div className={styles.transformationModalContent}>
      <p className="text-sm text-muted-foreground mb-4">
        Configure data transformations for the &quot;{fieldLabel}&quot; column.
      </p>

      {/* Trim Whitespace */}
      <div className="mb-4">
        <Label htmlFor="trim-checkbox" className="flex items-center space-x-2">
          <Checkbox
            id="trim-checkbox"
            checked={trim}
            onCheckedChange={(checked) => setTrim(Boolean(checked))}
          />
          <span>Trim Whitespace</span>
        </Label>
        <p className="text-xs text-muted-foreground ml-6">
          Remove leading and trailing whitespace.
        </p>
      </div>

      {/* Case Transformation */}
      <div className="mb-4">
        <Label className="block mb-2">Case Transformation:</Label>
        <RadioGroup
          value={caseTransform}
          onValueChange={(value: 'none' | 'upper' | 'lower' | 'title') =>
            setCaseTransform(value)
          }
          className="flex flex-col space-y-1"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="none" id="case-none" />
            <Label htmlFor="case-none">None</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="upper" id="case-upper" />
            <Label htmlFor="case-upper">UPPERCASE</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="lower" id="case-lower" />
            <Label htmlFor="case-lower">lowercase</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="title" id="case-title" />
            <Label htmlFor="case-title">Title Case</Label>
          </div>
        </RadioGroup>
      </div>

      {/* Find and Replace */}
      <div className="mb-4">
        <Label className="block mb-2">Find and Replace:</Label>
        {findReplaceRules.map((rule, index) => (
          <div key={index} className="flex items-center space-x-2 mb-2">
            <Input
              placeholder="Find"
              value={rule.find}
              onChange={(e) =>
                handleFindReplaceChange(index, 'find', e.target.value)
              }
              className="w-1/2"
            />
            <Input
              placeholder="Replace"
              value={rule.replace}
              onChange={(e) =>
                handleFindReplaceChange(index, 'replace', e.target.value)
              }
              className="w-1/2"
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleRemoveFindReplaceRule(index)}
              aria-label="Remove find and replace rule"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}
        <Button
          variant="outline"
          size="sm"
          onClick={handleAddFindReplaceRule}
          className="mt-2"
        >
          <Plus className="mr-2 h-4 w-4" /> Add Rule
        </Button>
        <p className="text-xs text-muted-foreground mt-1">
          Literal string replacement. Supports multiple rules.
        </p>
      </div>

      <div className="flex justify-end space-x-2 mt-6">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={handleApply}>Apply Rules</Button>
      </div>
    </div>
  );
};

export default TransformationModalContent;
