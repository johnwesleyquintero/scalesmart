import React, { JSX } from 'react';
import { DndContext } from '@dnd-kit/core';

interface DndProviderProps {
  children: React.ReactNode;
}

/**
 * Provides the DndContext for drag and drop functionality.
 * Built using @dnd-kit/core.
 * @see https://docs.dndkit.com/
 */
function DndProviderWrapper({
  children,
}: Readonly<DndProviderProps>): JSX.Element {
  return <DndContext>{children}</DndContext>;
}

export default DndProviderWrapper;
