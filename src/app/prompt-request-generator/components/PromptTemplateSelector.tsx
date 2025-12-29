import React from 'react';
import { Button } from '@/components/ui/button';
import {
  Wand2,
  FileSearch,
  FileText,
  Rocket,
  Brain,
  MessageSquare,
  Lightbulb,
  BookOpen,
  ListChecks,
} from 'lucide-react';
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
    id: 'analysis-research',
    name: 'Analysis & Research',
    description: 'Extract insights from data or documents',
    category: 'Analysis',
    icon: <FileSearch className="w-4 h-4" />,
    data: {
      context:
        'I have a set of data/information related to [topic]. I need to understand the key trends and actionable insights.',
      request:
        'Please analyze the provided information, identify the top 3-5 key findings, and suggest potential next steps.',
      parentTask: 'Strategic Analysis',
      subtask: 'Extract key insights',
      codeInput: '[Paste your data or text here]',
    },
  },
  {
    id: 'content-writing',
    name: 'Professional Writing',
    description: 'Draft or refine high-quality content',
    category: 'Writing',
    icon: <FileText className="w-4 h-4" />,
    data: {
      context:
        'I am writing a [type of document, e.g., executive summary, article] for [target audience]. The tone should be [e.g., professional, persuasive].',
      request:
        'Please help me draft/refine this content to ensure it is clear, engaging, and achieves the goal of [describe goal].',
      parentTask: 'Content Strategy',
      subtask: 'Drafting/Refining content',
    },
  },
  {
    id: 'strategic-planning',
    name: 'Strategic Planning',
    description: 'Develop frameworks and action plans',
    category: 'Strategy',
    icon: <Brain className="w-4 h-4" />,
    data: {
      context:
        'I am working on [project/goal]. I need a structured approach to achieve [specific outcome] while considering [constraints].',
      request:
        'Please help me develop a strategic framework or a step-by-step action plan to reach this goal effectively.',
      parentTask: 'Business Development',
      subtask: 'Create strategic roadmap',
    },
  },
  {
    id: 'technical-problem-solving',
    name: 'Technical Solving',
    description: 'Solve complex technical challenges',
    category: 'Technical',
    icon: <Rocket className="w-4 h-4" />,
    data: {
      context:
        'I am facing a technical challenge with [system/process]. The current setup involves [describe tech/process].',
      request:
        'Please analyze the situation and suggest a robust solution or troubleshooting steps to resolve the issue.',
      parentTask: 'Operations Management',
      subtask: 'Resolve technical bottleneck',
    },
  },
  {
    id: 'communication-drafting',
    name: 'Communication',
    description: 'Draft emails or internal messages',
    category: 'Communication',
    icon: <MessageSquare className="w-4 h-4" />,
    data: {
      context:
        'I need to communicate with [stakeholder/team] regarding [topic]. The goal is to [e.g., request approval, provide update].',
      request:
        'Please draft a professional and concise message that clearly conveys the information and includes a clear call to action.',
      parentTask: 'Team Communication',
      subtask: 'Draft stakeholder message',
    },
  },
  {
    id: 'optimization-refinement',
    name: 'Process Optimization',
    description: 'Improve efficiency and performance',
    category: 'Optimization',
    icon: <Wand2 className="w-4 h-4" />,
    data: {
      context:
        'I have an existing process/workflow for [task]. It currently takes [time/effort] and I want to make it more efficient.',
      request:
        'Please review the current process and suggest optimizations to reduce friction and improve overall output.',
      parentTask: 'Efficiency Improvement',
      subtask: 'Optimize workflow',
    },
  },
  {
    id: 'learning-explainer',
    name: 'Learning & Education',
    description: 'Simplify and explain complex topics',
    category: 'Education',
    icon: <BookOpen className="w-4 h-4" />,
    data: {
      context:
        'I am trying to understand [complex topic]. My current understanding is [basic level/none].',
      request:
        'Please explain this topic in simple terms, using analogies if possible, so that someone without a technical background can understand it.',
      parentTask: 'Personal Development',
      subtask: 'Learn new concept',
    },
  },
  {
    id: 'creative-ideation',
    name: 'Creative Ideation',
    description: 'Brainstorm and generate new ideas',
    category: 'Creative',
    icon: <Lightbulb className="w-4 h-4" />,
    data: {
      context:
        'I am looking for creative ideas for [project/campaign/event]. The target audience is [audience] and the goal is [goal].',
      request:
        'Please brainstorm 10 unique and creative ideas that align with these goals and would resonate with the audience.',
      parentTask: 'Innovation',
      subtask: 'Generate creative concepts',
    },
  },
  {
    id: 'data-summarization',
    name: 'Summarization',
    description: 'Condense long texts into key points',
    category: 'Analysis',
    icon: <ListChecks className="w-4 h-4" />,
    data: {
      context:
        'I have a long [document/article/transcript] that I need to digest quickly.',
      request:
        'Please provide a concise summary of the provided text, highlighting the top 5 most important takeaways and any action items.',
      parentTask: 'Information Management',
      subtask: 'Summarize key points',
      codeInput: '[Paste long text here]',
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
