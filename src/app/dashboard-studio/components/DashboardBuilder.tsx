'use client';
import React, { useState } from 'react';
import { WidgetLibrary } from './WidgetLibrary';
import {
  WidgetConfig,
  WIDGET_TYPES,
  ChartWidgetConfig,
  TableWidgetConfig,
  KpiWidgetConfig,
  TextWidgetConfig,
  ImageWidgetConfig,
  FilterWidgetConfig,
} from '../widget-types';
import { ChartWidget } from './ChartWidget';
import { TableWidget } from './TableWidget';
import KpiWidget from './KpiWidget';
import TextWidget from './TextWidget';
import ImageWidget from './ImageWidget';
import { FilterWidget } from './FilterWidget';
import { v4 as uuidv4 } from 'uuid';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface DashboardBuilderProps {
  initialWidgets?: WidgetConfig[];
}

export const DashboardBuilder: React.FC<DashboardBuilderProps> = ({
  initialWidgets,
}) => {
  const [widgets, setWidgets] = useState<WidgetConfig[]>(initialWidgets || []);

  const addWidget = (type: string) => {
    let newWidget: WidgetConfig;
    const defaultX = (widgets.length * 2) % 12;
    const defaultY = Infinity;

    switch (type) {
      case WIDGET_TYPES.CHART: {
        newWidget = {
          id: uuidv4(),
          type,
          title: 'New Chart Widget',
          x: defaultX,
          y: defaultY,
          w: 6,
          h: 4,
          data: {
            labels: ['Jan', 'Feb', 'Mar'],
            datasets: [{ label: 'Sales', data: [100, 200, 150] }],
          },
          chartType: 'bar',
        } as ChartWidgetConfig;
        break;
      }
      case WIDGET_TYPES.GEOSPATIAL_MAP: {
        newWidget = {
          id: uuidv4(),
          type: WIDGET_TYPES.CHART,
          title: 'New Geospatial Map Widget',
          x: defaultX,
          y: defaultY,
          w: 6,
          h: 4,
          data: {
            labels: ['Location 1', 'Location 2'],
            datasets: [
              { label: 'Latitude', data: [37.7749, 34.0522] },
              { label: 'Longitude', data: [-122.4194, -118.2437] },
            ],
          },
          chartType: 'geospatial-map',
          initialPosition: [0, 0],
          initialZoom: 2,
        } as ChartWidgetConfig;
        break;
      }
      case WIDGET_TYPES.TABLE:
        newWidget = {
          id: uuidv4(),
          type,
          title: 'New Table Widget',
          x: defaultX,
          y: defaultY,
          w: 6,
          h: 4,
          data: {
            headers: ['Column 1', 'Column 2'],
            rows: [['Data 1', 'Data 2']],
          },
        } as TableWidgetConfig;
        break;
      case WIDGET_TYPES.KPI:
        newWidget = {
          id: uuidv4(),
          type,
          title: 'New KPI Widget',
          x: defaultX,
          y: defaultY,
          w: 3,
          h: 2,
          data: { value: 'N/A', label: 'Metric' },
        } as KpiWidgetConfig;
        break;
      case WIDGET_TYPES.TEXT:
        newWidget = {
          id: uuidv4(),
          type,
          title: 'New Text Widget',
          x: defaultX,
          y: defaultY,
          w: 4,
          h: 2,
          data: { content: 'Edit this text or use Markdown.' },
        } as TextWidgetConfig;
        break;
      case WIDGET_TYPES.IMAGE:
        newWidget = {
          id: uuidv4(),
          type,
          title: 'New Image Widget',
          x: defaultX,
          y: defaultY,
          w: 4,
          h: 3,
          data: { url: '', altText: '' },
        } as ImageWidgetConfig;
        break;
      case WIDGET_TYPES.FILTER:
        newWidget = {
          id: uuidv4(),
          type,
          title: 'New Filter Widget',
          x: defaultX,
          y: defaultY,
          w: 3,
          h: 2,
          data: {
            dataSourceId: '',
            field: '',
            filterType: 'dropdown',
            options: [],
          } as FilterWidgetConfig['data'],
        } as FilterWidgetConfig;
        break;
      default:
        console.error('Attempted to add unknown widget type:', type);
        return;
    }

    setWidgets((prevWidgets) => [...prevWidgets, newWidget]);
  };

  const renderWidget = (widget: WidgetConfig) => {
    switch (widget.type) {
      case WIDGET_TYPES.CHART:
        return <ChartWidget config={widget as ChartWidgetConfig} />;
      case WIDGET_TYPES.TABLE:
        return <TableWidget config={widget as TableWidgetConfig} />;
      case WIDGET_TYPES.KPI:
        return <KpiWidget config={widget as KpiWidgetConfig} />;
      case WIDGET_TYPES.TEXT:
        return (
          <TextWidget
            id={widget.id}
            content={(widget as TextWidgetConfig).data.content}
          />
        );
      case WIDGET_TYPES.IMAGE: {
        const imageWidget = widget as ImageWidgetConfig;
        return (
          <ImageWidget
            id={imageWidget.id}
            imageUrl={imageWidget.data.url}
            altText={imageWidget.data.altText}
          />
        );
      }
      case WIDGET_TYPES.FILTER: {
        const filterWidget = widget as FilterWidgetConfig;
        return (
          <FilterWidget
            config={filterWidget}
            onFilterChange={(filterValue) =>
              console.log('Filter value changed:', filterValue)
            }
          />
        );
      }
      default:
        return <div>Unknown Widget Type</div>;
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setWidgets((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  }

  return (
    <div className="border p-4 rounded-lg">
      <h2 className="text-2xl font-semibold mb-4">Build Your Dashboard</h2>
      <div className="mb-4">
        <WidgetLibrary onSelectWidget={addWidget} />
      </div>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={widgets} strategy={verticalListSortingStrategy}>
          {widgets.map((widget) => (
            <SortableWidget key={widget.id} id={widget.id}>
              {renderWidget(widget)}
            </SortableWidget>
          ))}
        </SortableContext>
      </DndContext>
    </div>
  );
};

function SortableWidget({
  id,
  children,
}: {
  id: string;
  children: React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="border p-4 rounded shadow mb-4"
    >
      {children}
    </div>
  );
}
