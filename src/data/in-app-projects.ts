import { ElementType } from 'react';
import {
  Store,
  FileSearch,
  Users,
  KanbanSquare,
  GraduationCap,
  FileText,
  MessageSquare,
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
    name: 'Amazon Seller Tools',
    description:
      'Suite of tools to optimize listings, track performance, and manage your Amazon business effectively.',
    href: '/amazon-seller-tools',
    icon: Store,
    external: true,
    auth: 'always',
    status: 'beta',
  },
  {
    name: 'Markdown Notepad',
    description:
      'Create and manage markdown notes with categories, search, and real-time preview.',
    href: '/markdown-notepad',
    icon: FileText,
    auth: 'always',
    status: 'beta',
  },
  {
    name: 'WesAI',
    description:
      'Engage with our AI assistant for quick answers, code assistance, and support.',
    href: '/chat',
    icon: MessageSquare,
    auth: 'always',
    status: 'beta',
  },
  {
    name: 'Resume Scanner',
    description:
      'Analyze your resume against job descriptions and get insights to beat Applicant Tracking Systems.',
    href: '/ats',
    icon: FileSearch,
    auth: 'always',
    status: 'beta',
  },
  {
    name: 'CRM',
    description:
      'Manage customer relationships, track interactions, and streamline your sales pipeline.',
    href: '/crm',
    icon: Users,
    auth: 'always',
    status: 'beta',
  },
  {
    name: 'Project Management',
    description:
      'Organize tasks, collaborate with your team, and keep projects on track with our intuitive PM tool.',
    href: '/project-management',
    icon: KanbanSquare,
    auth: 'always',
    status: 'beta',
  },
];
