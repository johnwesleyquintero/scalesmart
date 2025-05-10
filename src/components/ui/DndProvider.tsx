import React, { JSX } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

interface DndProviderProps {
  children: React.ReactNode;
}

function DndProviderWrapper({
  children,
}: Readonly<DndProviderProps>): JSX.Element {
  return <DndProvider backend={HTML5Backend}>{children}</DndProvider>;
}

export default DndProviderWrapper;
