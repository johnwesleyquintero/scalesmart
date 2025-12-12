import React from 'react';
import { Button } from '@/components/ui/button';
import { Wand2, Bug, Code, FileText, Rocket, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface PromptTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: React.ReactNode;
  data: {
    context: string;
    request: string;
    parentTask?: string;
    subtask?: string;
    codeInput?: string;
  };
}

export const PROMPT_TEMPLATES: PromptTemplate[] = [
  {
    id: 'debug-error',
    name: 'Debug Error',
    description: 'Help fix a specific error or bug',
    category: 'Error Fixing',
    icon: <Bug className="w-4 h-4" />,
    data: {
      context:
        "I'm encountering an error in my application. The project is built with [technology stack]. This issue started occurring when [describe when the error started].",
      request:
        'Please help me identify the root cause of this error and provide a solution to fix it.',
      parentTask: 'Fix application errors',
      subtask: 'Debug specific error',
      codeInput: '// Paste the error message and relevant code here',
    },
  },
  {
    id: 'code-review',
    name: 'Code Review',
    description: 'Get feedback on your code quality',
    category: 'Code Review',
    icon: <Code className="w-4 h-4" />,
    data: {
      context:
        "I've written this code for [describe the purpose]. I want to ensure it follows best practices and is maintainable.",
      request:
        'Please review my code and suggest improvements for performance, readability, and maintainability.',
      parentTask: 'Improve code quality',
      subtask: 'Review implementation',
    },
  },
  {
    id: 'documentation',
    name: 'Documentation',
    description: 'Create comprehensive documentation',
    category: 'Documentation',
    icon: <FileText className="w-4 h-4" />,
    data: {
      context:
        'I need to create documentation for [describe what needs documentation]. The target audience is [describe audience].',
      request:
        'Please help me write clear, comprehensive documentation that explains [specific aspects].',
      parentTask: 'Create project documentation',
      subtask: 'Write technical docs',
    },
  },
  {
    id: 'feature-implementation',
    name: 'Feature Implementation',
    description: 'Build a new feature from scratch',
    category: 'Feature Development',
    icon: <Rocket className="w-4 h-4" />,
    data: {
      context:
        'I want to implement a new feature that [describe what the feature should do]. The existing codebase uses [technology stack].',
      request:
        'Please provide a step-by-step implementation guide for this feature, including code examples and best practices.',
      parentTask: 'Implement new features',
      subtask: 'Build specific functionality',
    },
  },
  {
    id: 'security-audit',
    name: 'Security Review',
    description: 'Check for security vulnerabilities',
    category: 'Security',
    icon: <Shield className="w-4 h-4" />,
    data: {
      context:
        'I need to ensure my application is secure. It handles [describe sensitive data/functionality] and uses [security measures already in place].',
      request:
        'Please review my code/configuration for security vulnerabilities and suggest improvements.',
      parentTask: 'Improve application security',
      subtask: 'Conduct security audit',
    },
  },
  {
    id: 'optimization',
    name: 'Performance Optimization',
    description: 'Improve application performance',
    category: 'Performance',
    icon: <Wand2 className="w-4 h-4" />,
    data: {
      context:
        "My application is experiencing performance issues with [describe specific performance problems]. It's built with [technology stack].",
      request:
        'Please help me optimize the performance by identifying bottlenecks and suggesting improvements.',
      parentTask: 'Optimize application performance',
      subtask: 'Fix performance issues',
    },
  },
];

interface PromptTemplateSelectorProps {
  onSelectTemplate: (template: PromptTemplate) => void;
  className?: string;
}

const PromptTemplateSelector: React.FC<PromptTemplateSelectorProps> = ({
  onSelectTemplate,
  className,
}) => {
  const [selectedCategory, setSelectedCategory] = React.useState<string>('All');

  const categories = [
    'All',
    ...Array.from(new Set(PROMPT_TEMPLATES.map((t) => t.category))),
  ];
  const filteredTemplates =
    selectedCategory === 'All'
      ? PROMPT_TEMPLATES
      : PROMPT_TEMPLATES.filter((t) => t.category === selectedCategory);

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex flex-wrap gap-2">
        {categories.map((category) => (
          <Button
            key={category}
            variant={selectedCategory === category ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory(category)}
            className="text-xs"
          >
            {category}
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {filteredTemplates.map((template) => (
          <button
            key={template.id}
            onClick={() => onSelectTemplate(template)}
            className={cn(
              'p-3 rounded-lg border border-border bg-background hover:bg-accent/50 hover:border-accent',
              'transition-all duration-200 text-left group',
            )}
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 rounded-md bg-primary/10 text-primary group-hover:bg-primary/20">
                {template.icon}
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-sm">{template.name}</h4>
                <p className="text-xs text-muted-foreground">
                  {template.description}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {template.category}
              </span>
              <span className="text-xs text-primary group-hover:underline">
                Use template →
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default PromptTemplateSelector;
