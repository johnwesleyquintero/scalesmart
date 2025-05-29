import React, { JSX } from 'react';
import { DndContext } from '@dnd-kit/core';

interface DndProviderProps {
  children: React.ReactNode;
}

function DndProviderWrapper({
  children,
}: Readonly<DndProviderProps>): JSX.Element {
  return <DndContext>{children}</DndContext>;
}

export default DndProviderWrapper;
