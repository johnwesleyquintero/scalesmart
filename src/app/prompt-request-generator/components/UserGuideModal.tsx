import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Wand2,
  Lightbulb,
  Target,
  Layers,
  Code2,
  CheckCircle2,
} from 'lucide-react';

interface UserGuideModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const UserGuideModal: React.FC<UserGuideModalProps> = ({
  open,
  onOpenChange,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <Lightbulb className="h-6 w-6 text-yellow-500" />
            Prompt Strategy Guide
          </DialogTitle>
          <DialogDescription className="text-base">
            Master the art of structured AI communication using WesAI's
            "System-First" approach.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <section className="space-y-3">
            <h3 className="text-lg font-semibold flex items-center gap-2 text-purple-600 dark:text-purple-400">
              <Target className="h-5 w-5" />
              1. Define Your Category
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Start by selecting the most relevant category. This sets the{' '}
              <strong className="font-bold text-foreground">
                mental framework
              </strong>{' '}
              for the AI. If your task is unique, use the "Custom" option to
              define your own context.
            </p>
          </section>

          <section className="space-y-3">
            <h3 className="text-lg font-semibold flex items-center gap-2 text-blue-600 dark:text-blue-400">
              <Layers className="h-5 w-5" />
              2. Layered Context
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3 rounded-md bg-muted/50 border border-border/50">
                <span className="font-medium text-sm block mb-1">
                  Parent Task
                </span>
                <span className="text-xs text-muted-foreground">
                  The "Big Picture" goal (e.g., "Building a SaaS Portfolio").
                </span>
              </div>
              <div className="p-3 rounded-md bg-muted/50 border border-border/50">
                <span className="font-medium text-sm block mb-1">Subtask</span>
                <span className="text-xs text-muted-foreground">
                  The specific step you're on (e.g., "API Integration").
                </span>
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="text-lg font-semibold flex items-center gap-2 text-green-600 dark:text-green-400">
              <Code2 className="h-5 w-5" />
              3. Technical Precision
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Paste relevant code or data in the{' '}
              <strong className="font-bold text-foreground">Reference</strong>{' '}
              section. The generator automatically detects the language and
              wraps it in markdown for optimal AI readability.
            </p>
          </section>

          <section className="space-y-3">
            <h3 className="text-lg font-semibold flex items-center gap-2 text-orange-600 dark:text-orange-400">
              <Wand2 className="h-5 w-5" />
              4. Generate & Iterate
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Hit{' '}
              <strong className="font-bold text-foreground">
                Generate Structured Prompt
              </strong>{' '}
              to assemble your request. Use the{' '}
              <strong className="font-bold text-foreground">Auto-Save</strong>{' '}
              feature to keep track of successful prompt patterns you've built.
            </p>
          </section>

          <div className="mt-4 p-4 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-900/30">
            <h4 className="text-sm font-bold text-purple-800 dark:text-purple-300 mb-2 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              WesAI Philosophy
            </h4>
            <p className="text-xs text-purple-700/80 dark:text-purple-400/80 italic">
              "Build the system that prevents the problem. A well-structured
              prompt isn't just a request; it's a technical blueprint for the
              result you want."
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto"
          >
            Got it, let's build
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default UserGuideModal;
