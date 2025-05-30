import React, { ElementType } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'; // Corrected path
import { Badge } from '@/components/ui/badge'; // Corrected path
import { Button } from '@/components/ui/button'; // Corrected path
import Link from 'next/link';
import {
  ArrowRight,
  Store,
  FileSearch,
  Users,
  KanbanSquare,
  GraduationCap,
  Workflow as WorkflowIcon, // Renamed to avoid conflict with Workflow type if any
} from 'lucide-react';

interface Project {
  name: string;
  description: string;
  href: string;
  icon: ElementType;
  external?: boolean;
  auth: string; // Kept for potential future use
  status?: 'beta' | 'alpha' | 'live' | 'coming soon';
}

const projects: Project[] = [
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
  {
    name: 'ScaleSmart Academy',
    description:
      'Enhance your skills with free courses in e-commerce, data analytics, and digital marketing.',
    href: '/academy',
    icon: GraduationCap,
    external: true,
    auth: 'always',
    status: 'beta', // Assuming courses are also part of the beta platform features
  },
  {
    name: 'Workflow Builder',
    description:
      'Automate repetitive tasks and design custom workflows to boost productivity and efficiency.',
    href: '/workflow-builder',
    icon: WorkflowIcon,
    auth: 'always',
    status: 'beta',
  },
];

const InAppProjects = () => {
  return (
    <section
      id="platform-features"
      className="py-16 md:py-20 bg-muted/20 dark:bg-muted/10"
    >
      <div className="container mx-auto px-4">
        <div className="mb-12 text-center">
          <Badge variant="secondary" className="mb-4 text-sm">
            Platform Features
          </Badge>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-3">
            Explore Our Core Capabilities
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            Powerful tools and resources designed to help you succeed and grow
            your ventures.
          </p>
        </div>

        <div className="grid gap-6 md:gap-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Card
              key={project.name}
              className="flex flex-col overflow-hidden transition-all duration-300 hover:shadow-xl hover:border-primary/30 dark:hover:border-primary/50"
            >
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-3">
                    <project.icon className="h-7 w-7 text-primary flex-shrink-0" />
                    <CardTitle className="text-xl">{project.name}</CardTitle>
                  </div>
                  {project.status === 'beta' && (
                    <Badge
                      variant="outline"
                      className="text-xs border-orange-400 text-orange-500 dark:border-orange-500 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/30 shrink-0"
                    >
                      BETA
                    </Badge>
                  )}
                </div>
                <CardDescription className="text-sm min-h-[60px] line-clamp-3">
                  {project.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                {/* Content can be added here if needed in the future */}
              </CardContent>
              <CardFooter>
                <Button asChild variant="ghost">
                  <Link
                    href={project.href}
                    target={project.external ? '_blank' : '_self'}
                    rel={project.external ? 'noopener noreferrer' : undefined}
                  >
                    Explore {project.name}
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default InAppProjects;
