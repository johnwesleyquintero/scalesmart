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
import { Contact, SalesStage } from '../types';

interface SalesPipelineBoardProps {
  customers: Contact[];
  onUpdateCustomer: (customer: Contact) => void;
}

const SALES_STAGES: SalesStage[] = [
  'Lead',
  'Prospect',
  'Qualified',
  'Proposal',
  'Negotiation',
  'Closed Won',
  'Closed Lost',
];

const SalesPipelineBoard: React.FC<SalesPipelineBoardProps> = ({
  customers,
  onUpdateCustomer,
}) => {
  const [customerMap, setCustomerMap] = useState<Map<SalesStage, Contact[]>>(
    () => {
      const map = new Map<SalesStage, Contact[]>();
      SALES_STAGES.forEach((stage) => {
        map.set(
          stage,
          customers.filter((customer) => customer.salesStage === stage),
        );
      });
      return map;
    },
  );

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

      const activeStage = activeId.split('-')[0] as SalesStage;
      const overStage = overId.split('-')[0] as SalesStage;

      if (activeStage === overStage) {
        if (activeId !== overId) {
          const activeIndex = Number(activeId.split('-')[1]);
          const overIndex = Number(overId.split('-')[1]);

          setCustomerMap((prevCustomerMap) => {
            const activeItems = [...(prevCustomerMap.get(activeStage) || [])];
            const newItems = arrayMove(activeItems, activeIndex, overIndex);
            const newMap = new Map(prevCustomerMap);
            newMap.set(activeStage, newItems);
            return newMap;
          });
        }
      } else {
        setCustomerMap((prevCustomerMap) => {
          const activeIndex = Number(activeId.split('-')[1]);
          const overIndex = Number(overId.split('-')[1]);

          const activeItems = [...(prevCustomerMap.get(activeStage) || [])];
          const overItems = [...(prevCustomerMap.get(overStage) || [])];

          const [movedItem] = activeItems.splice(activeIndex, 1);
          movedItem.salesStage = overStage;
          overItems.splice(overIndex, 0, movedItem);

          const newMap = new Map(prevCustomerMap);
          newMap.set(activeStage, activeItems);
          newMap.set(overStage, overItems);
          onUpdateCustomer(movedItem);
          return newMap;
        });
      }
    },
    [onUpdateCustomer],
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
        {SALES_STAGES.map((stage) => (
          <Card key={stage} className="w-64 m-2">
            <CardHeader>
              <CardTitle>{stage}</CardTitle>
            </CardHeader>
            <CardContent>
              <SortableContext
                items={
                  customerMap.get(stage)?.map((customer) => customer.id) || []
                }
                strategy={verticalListSortingStrategy}
              >
                {customerMap
                  .get(stage)
                  ?.map((customer) => (
                    <SortableItem key={customer.id} customer={customer} />
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
  customer: Contact;
}

const SortableItem: React.FC<SortableItemProps> = ({ customer }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: customer.id });

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
      {customer.name}
    </div>
  );
};

export default SalesPipelineBoard;
