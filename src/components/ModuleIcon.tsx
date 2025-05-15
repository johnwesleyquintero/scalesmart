import { ModuleType } from '@/types';
import { BarChart2, BookOpen, Check, Play } from 'lucide-react';
import React from 'react';

type ModuleIconProps = {
  type: ModuleType;
  completed?: boolean;
};

const ModuleIcon: React.FC<ModuleIconProps> = ({ type, completed }) => {
  if (completed) {
    return <Check className="h-5 w-5 text-green-500" />;
  }

  switch (type) {
    case ModuleType.VIDEO:
      return <Play className="h-5 w-5" />;
    case ModuleType.ARTICLE:
      return <BookOpen className="h-5 w-5" />;
    case ModuleType.QUIZ:
      return <BarChart2 className="h-5 w-5" />;
    default:
      return null;
  }
};

export default ModuleIcon;
