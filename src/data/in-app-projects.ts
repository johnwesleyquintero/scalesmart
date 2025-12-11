import { ElementType } from 'react';
import {
  Store,
  FileSearch,
  Users,
  KanbanSquare,
  GraduationCap,
  FileText,
  MessageSquare,
  Lightbulb,
} from 'lucide-react';

interface Project {
  name: string;
  description: string;
  href: string;
  icon: ElementType;
  external?: boolean;
  auth: string;
  status?: 'beta' | 'alpha' | 'live' | 'coming soon';
}

export const projects: Project[] = [
  {
    name: 'Prompt Request Generator',
    description:
      'Generate effective prompts for various AI models and use cases.',
    href: '/prompt-request-generator',
    icon: Lightbulb,
    auth: 'always',
    status: 'beta',
  },
];
