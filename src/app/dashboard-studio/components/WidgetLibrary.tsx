import React from 'react';
import { Button } from '@/components/ui/button';
import { WIDGET_TYPES, WidgetType } from '../widget-types';

interface WidgetLibraryProps {
  onSelectWidget: (type: WidgetType) => void;
}

export const WidgetLibrary: React.FC<WidgetLibraryProps> = ({
  onSelectWidget,
}) => {
  const widgetTypes = Object.values(WIDGET_TYPES);

  return (
    <div className="border p-4 rounded-lg shadow-md">
      <h3 className="text-xl font-semibold mb-4">Widget Library</h3>
      <div className="flex flex-wrap gap-2">
        {widgetTypes.map((type) => (
          <Button
            key={type}
            onClick={() => onSelectWidget(type)}
            variant="outline"
            size="sm"
          >
            {type.charAt(0).toUpperCase() + type.slice(1)}{' '}
            {/* Capitalize first letter for display */}
          </Button>
        ))}
      </div>
    </div>
  );
};
