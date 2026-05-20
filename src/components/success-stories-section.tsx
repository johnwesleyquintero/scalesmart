'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  CheckCircle2,
} from 'lucide-react';
import studiesData from '@/data/portfolio-data/case-studies.json';
import { cn } from '@/lib/utils';
import { LANDING } from '@/constants/marketing';

interface Metric {
  name: string;
  value: number;
  change: number;
  trend: 'up' | 'down';
}

interface SuccessStory {
  id: string;
  title: string;
  description: string;
  metrics: Metric[];
  tags: string[];
}

export default function SuccessStoriesSection() {
  const stories = studiesData.studies as SuccessStory[];

  return (
    <section
      id="success-stories"
      className="py-24 bg-muted/30 relative overflow-hidden"
    >
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent"></div>

      <div className="container mx-auto px-4">
        <div className="mb-16 text-center">
          <Badge
            variant="outline"
            className="mb-4 border-primary/30 text-primary"
          >
            {LANDING.SUCCESS_STORIES.badge}
          </Badge>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl mb-4">
            {LANDING.SUCCESS_STORIES.header}
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            {LANDING.SUCCESS_STORIES.subhead}
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-2">
          {stories.map((story) => (
            <Card
              key={story.id}
              className="overflow-hidden border-none shadow-xl bg-background/50 backdrop-blur-sm group hover:translate-y-[-4px] transition-all duration-300"
            >
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex gap-2">
                    {story.tags.map((tag) => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className="text-[10px] uppercase font-bold tracking-tighter bg-primary/10 text-primary border-none"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  <div className="p-2 rounded-full bg-success/10 text-success">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                </div>
                <CardTitle className="text-2xl font-bold group-hover:text-primary transition-colors">
                  {story.title}
                </CardTitle>
                <p className="text-muted-foreground mt-2">
                  {story.description}
                </p>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid grid-cols-3 gap-4 p-4 rounded-xl bg-muted/50 border border-border/50">
                  {story.metrics.map((metric, idx) => (
                    <div key={idx} className="text-center">
                      <div className="text-xs font-medium text-muted-foreground uppercase mb-1">
                        {metric.name}
                      </div>
                      <div className="flex flex-col items-center">
                        <span className="text-2xl font-bold tracking-tight">
                          {metric.trend === 'up' ? '+' : '-'}
                          {Math.abs(metric.change)}%
                        </span>
                        <div
                          className={cn(
                            'flex items-center text-[10px] font-bold mt-1',
                            metric.trend === 'up'
                              ? 'text-green-500'
                              : 'text-blue-500',
                          )}
                        >
                          {metric.trend === 'up' ? (
                            <TrendingUp className="h-3 w-3 mr-1" />
                          ) : (
                            <TrendingDown className="h-3 w-3 mr-1" />
                          )}
                          {metric.trend === 'up' ? 'GROWTH' : 'REDUCTION'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-6 flex justify-end">
                  <div className="flex items-center text-sm font-semibold text-primary group-hover:underline cursor-pointer">
                    {LANDING.SUCCESS_STORIES.readFullCta}{' '}
                    <ArrowUpRight className="h-4 w-4 ml-1" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
