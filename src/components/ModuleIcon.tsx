'use client';

import { ModuleType } from '@/types';
import { Book, Check, FileText, Video } from 'lucide-react';
import React from 'react';

interface ModuleIconProps {
  type: string;
  completed?: boolean;
}

const ModuleIcon: React.FC<ModuleIconProps> = ({ type, completed }) => {
  let icon;

  switch (type) {
    case ModuleType.ARTICLE:
      icon = <FileText />;
      break;
    case ModuleType.VIDEO:
      icon = <Video />;
      break;
    case ModuleType.QUIZ:
      icon = <Book />;
      break;
    default:
      icon = <FileText />;
  }

  if (completed) {
    icon = <Check />;
  }

  return <div className="w-6 h-6 flex items-center justify-center">{icon}</div>;
};

export default ModuleIcon;
