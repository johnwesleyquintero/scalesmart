'use client';

import React, { useState, useMemo, useCallback } from 'react';
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
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  SalesOpportunity,
  SALES_STAGES_ORDER,
  SalesStage,
} from '../types/sales';

interface SalesPipelineBoardProps {
  opportunities: SalesOpportunity[];
  onUpdateOpportunity: (opportunity: SalesOpportunity) => void;
}

const SalesPipelineBoard: React.FC<SalesPipelineBoardProps> = ({
  opportunities,
  onUpdateOpportunity,
}) => {
  const [opportunityMap, setOpportunityMap] = useState<
    Map<string, SalesOpportunity[]>
  >(() => {
    const map = new Map<string, SalesOpportunity[]>();
    SALES_STAGES_ORDER.forEach((stage) => {
      map.set(
        stage,
        opportunities.filter((opportunity) => opportunity.stage === stage),
      );
    });
    return map;
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;

      if (!over) {
        return;
      }

      const activeId = active.id as string;
      const overId = over.id as string;

      const activeStage = active.data.current?.sortable.containerId as string;
      const overStage = over.id as string;

      if (activeStage === overStage) {
        const activeIndex = opportunityMap
          .get(activeStage)
          ?.findIndex((item) => item.id === activeId);
        const overIndex = opportunityMap
          .get(overStage)
          ?.findIndex((item) => item.id === overId);

        if (activeIndex !== undefined && overIndex !== undefined) {
          setOpportunityMap((prevMap) => {
            const newOpportunities = arrayMove(
              prevMap.get(activeStage) || [],
              activeIndex,
              overIndex,
            );
            const newMap = new Map(prevMap);
            newMap.set(activeStage, newOpportunities);
            return newMap;
          });
        }
      } else {
        setOpportunityMap((prevMap) => {
          const activeOpportunities = [...(prevMap.get(activeStage) || [])];
          const overOpportunities = [...(prevMap.get(overStage) || [])];

          const movedOpportunity = activeOpportunities.find(
            (item) => item.id === activeId,
          );
          if (!movedOpportunity) return prevMap;

          const newActiveOpportunities = activeOpportunities.filter(
            (item) => item.id !== activeId,
          );
          const newMovedOpportunity = {
            ...movedOpportunity,
            stage: overStage as SalesStage,
          };

          const newOverOpportunities = [
            ...overOpportunities,
            newMovedOpportunity,
          ];

          const newMap = new Map(prevMap);
          newMap.set(activeStage, newActiveOpportunities);
          newMap.set(overStage, newOverOpportunities);

          onUpdateOpportunity(newMovedOpportunity);
          return newMap;
        });
      }
    },
    [onUpdateOpportunity, opportunityMap],
  );

  const getItemStyle = (isDragging: boolean) => ({
    opacity: isDragging ? 0.5 : 1,
  });

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <div className="flex">
        {SALES_STAGES_ORDER.map((stage) => (
          <Card key={stage} className="w-64 m-2">
            <CardHeader>
              <CardTitle>{stage}</CardTitle>
            </CardHeader>
            <CardContent>
              <SortableContext
                items={
                  opportunityMap
                    .get(stage)
                    ?.map((opportunity) => opportunity.id) || []
                }
                strategy={verticalListSortingStrategy}
              >
                {opportunityMap
                  .get(stage)
                  ?.map((opportunity) => (
                    <SortableItem
                      key={opportunity.id}
                      opportunity={opportunity}
                    />
                  )) || []}
              </SortableContext>
            </CardContent>
          </Card>
        ))}
      </div>
    </DndContext>
  );
};

interface SortableItemProps {
  opportunity: SalesOpportunity;
}

const SortableItem: React.FC<SortableItemProps> = ({ opportunity }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: opportunity.id });

  const getItemStyle = (isDragging: boolean) => ({
    opacity: isDragging ? 0.5 : 1,
  });

  const style = {
    transform: transform
      ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
      : 'none',
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="border p-2 mb-2 rounded-md cursor-grab"
    >
      {opportunity.name}
    </div>
  );
};

export default SalesPipelineBoard;
