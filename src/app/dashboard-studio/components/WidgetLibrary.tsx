import React from 'react';
import { WIDGET_TYPES, WidgetType } from '../widget-types';

interface WidgetLibraryProps {
  onSelectWidget: (type: WidgetType) => void;
}

export const WidgetLibrary: React.FC<WidgetLibraryProps> = ({
  onSelectWidget,
}) => {
  const widgetTypes = Object.keys(WIDGET_TYPES) as WidgetType[];

  return (
    <div className="border p-4 rounded-lg shadow-md">
      <h3 className="text-xl font-semibold mb-4">Widget Library</h3>
      <div className="flex flex-wrap gap-2">
        {widgetTypes.map((type) => (
          <button
            key={type}
            onClick={() => onSelectWidget(type)}
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded text-sm"
          >
            {type.replace(/([A-Z])/g, ' $1').trim()}{' '}
            {/* Convert camelCase to spaced words */}
          </button>
        ))}
      </div>
    </div>
  );
};
