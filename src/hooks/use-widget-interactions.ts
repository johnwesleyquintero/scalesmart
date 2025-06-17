import { useState } from 'react';
import { WidgetConfig, WidgetData } from '../app/dashboard-studio/widget-types';

// This hook will manage interactions like resizing, dragging, and potentially filtering
export const useWidgetInteractions = (initialWidgets: WidgetConfig[]) => {
  const [widgets, setWidgets] = useState<WidgetConfig[]>(initialWidgets);

  const [selectedWidgetId, setSelectedWidgetId] = useState<string | null>(null);

  // Implement functions for:
  // - Updating widget position and size (for grid layout)
  const updateWidgetLayout = (
    id: string,
    newLayout: { x: number; y: number; w: number; h: number },
  ) => {
    setWidgets((prevWidgets) =>
      prevWidgets.map((widget) =>
        widget.id === id ? { ...widget, ...newLayout } : widget,
      ),
    );
  };

  // - Handling widget data updates (e.g., from filters)
  const handleWidgetDataUpdate = (id: string, newData: WidgetData) => {
    setWidgets((prevWidgets) =>
      prevWidgets.map((widget) => {
        if (widget.id === id) {
          // Cast newData to the specific widget's data type
          // This assumes newData is compatible with the widget's type
          return { ...widget, data: newData } as WidgetConfig;
        }
        return widget;
      }),
    );
  };

  // - Selecting/editing widgets
  const selectWidget = (id: string | null) => {
    setSelectedWidgetId(id);
  };

  return {
    widgets,
    setWidgets,
    selectedWidgetId,
    // Expose interaction handlers
    updateWidgetLayout,
    handleWidgetDataUpdate,
    selectWidget,
  };
};
