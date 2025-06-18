import { ConditionalFormattingRule } from '../app/dashboard-studio/widget-types';

/**
 * Applies conditional formatting rules to a single data point.
 * @param dataPoint The data point object (e.g., { name: 'A', 'Series 1': 100 }).
 * @param rules An array of ConditionalFormattingRule objects.
 * @returns A React.CSSProperties object containing the combined styles from matching rules.
 */
export const applyConditionalFormatting = (
  dataPoint: Record<string, unknown>,
  rules?: ConditionalFormattingRule[],
): React.CSSProperties => {
  let itemStyle: React.CSSProperties = {};

  if (rules) {
    rules.forEach((rule) => {
      const dataValue = dataPoint[rule.field];
      let conditionMet = false;

      switch (rule.operator) {
        case 'gt':
          conditionMet =
            typeof dataValue === 'number' &&
            typeof rule.value === 'number' &&
            dataValue > rule.value;
          break;
        case 'lt':
          conditionMet =
            typeof dataValue === 'number' &&
            typeof rule.value === 'number' &&
            dataValue < rule.value;
          break;
        case 'eq':
          conditionMet = dataValue === rule.value;
          break;
        case 'gte':
          conditionMet =
            typeof dataValue === 'number' &&
            typeof rule.value === 'number' &&
            dataValue >= rule.value;
          break;
        case 'lte':
          conditionMet =
            typeof dataValue === 'number' &&
            typeof rule.value === 'number' &&
            dataValue <= rule.value;
          break;
        case 'ne':
          conditionMet = dataValue !== rule.value;
          break;
        case 'contains':
          conditionMet =
            typeof dataValue === 'string' &&
            typeof rule.value === 'string' &&
            dataValue.includes(rule.value);
          break;
        case 'not-contains':
          conditionMet =
            typeof dataValue === 'string' &&
            typeof rule.value === 'string' &&
            !dataValue.includes(rule.value);
          break;
        // Add more operators as needed
      }

      if (conditionMet) {
        itemStyle = { ...itemStyle, ...rule.style };
      }
    });
  }

  return itemStyle;
};
