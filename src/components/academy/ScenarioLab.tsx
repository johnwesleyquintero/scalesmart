'use client';

import React, { useState } from 'react';
import { Scenario, scenariosData } from '@/data/academy/scenarios';
import { cn } from '@/lib/utils';
import {
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  Lightbulb,
  XCircle,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ScenarioCardProps {
  scenario: Scenario;
  scenarioNumber: number;
  totalScenarios: number;
  onNext: () => void;
  isLast: boolean;
}

function ScenarioCard({
  scenario,
  scenarioNumber,
  totalScenarios,
  onNext,
  isLast,
}: ScenarioCardProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);

  const toggleChoice = (id: string) => {
    if (submitted) return;
    // If multiple correct answers exist, allow multi-select; otherwise single select
    if (scenario.correctIds.length > 1) {
      setSelectedIds((prev) =>
        prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
      );
    } else {
      setSelectedIds([id]);
    }
  };

  const handleSubmit = () => {
    if (selectedIds.length === 0) return;
    setSubmitted(true);
  };

  const handleReset = () => {
    setSelectedIds([]);
    setSubmitted(false);
  };

  const isCorrect = (id: string) => scenario.correctIds.includes(id);
  const wasSelected = (id: string) => selectedIds.includes(id);
  const answeredCorrectly =
    submitted &&
    scenario.correctIds.every((id) => selectedIds.includes(id)) &&
    selectedIds.every((id) => scenario.correctIds.includes(id));

  return (
    <div className="rounded-3xl border border-border/80 bg-card shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-slate-950 text-white px-6 sm:px-8 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500 text-slate-950 text-sm font-black shrink-0">
            {scenarioNumber}
          </div>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-amber-400">
              Scenario {scenarioNumber} of {totalScenarios} · {scenario.level}
            </div>
            <div className="text-base sm:text-lg font-extrabold text-white leading-tight">
              {scenario.title}
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 sm:p-8">
        {/* Context / Situation */}
        <div className="mb-6 p-4 sm:p-5 rounded-2xl bg-muted/60 border border-border/60">
          <div className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
            Account Situation
          </div>
          <p className="text-sm sm:text-base text-foreground/90 leading-relaxed">
            {scenario.context}
          </p>

          {/* Key Metrics Table */}
          {scenario.keyMetrics && scenario.keyMetrics.length > 0 && (
            <div className="mt-4 grid grid-cols-3 gap-2">
              {scenario.keyMetrics.map((metric) => (
                <div
                  key={metric.label}
                  className="text-center p-2.5 rounded-xl bg-background border border-border/60"
                >
                  <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                    {metric.label}
                  </div>
                  <div className="flex items-center justify-center gap-1.5">
                    <span className="text-xs text-muted-foreground line-through">
                      {metric.before}
                    </span>
                    <ChevronRight className="h-3 w-3 text-muted-foreground" />
                    <span className="text-sm font-bold text-amber-500">
                      {metric.after}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Question */}
        <div className="mb-5">
          <h3 className="text-base sm:text-lg font-bold text-foreground mb-1">
            {scenario.question}
          </h3>
          {scenario.correctIds.length > 1 && !submitted && (
            <p className="text-xs text-muted-foreground italic">
              Select all that apply.
            </p>
          )}
        </div>

        {/* Choices */}
        <div className="space-y-2.5 mb-6">
          {scenario.choices.map((choice) => {
            const selected = wasSelected(choice.id);
            const correct = isCorrect(choice.id);

            let choiceStyle =
              'border-border/70 bg-background hover:border-amber-500/50 hover:bg-amber-500/5';
            let indicator = null;

            if (submitted) {
              if (correct && selected) {
                choiceStyle = 'border-emerald-500 bg-emerald-500/10';
                indicator = (
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                );
              } else if (correct && !selected) {
                choiceStyle = 'border-emerald-500/60 bg-emerald-500/5';
                indicator = (
                  <CheckCircle2 className="h-4 w-4 text-emerald-400/70 shrink-0" />
                );
              } else if (!correct && selected) {
                choiceStyle = 'border-red-500 bg-red-500/10';
                indicator = (
                  <XCircle className="h-4 w-4 text-red-500 shrink-0" />
                );
              } else {
                choiceStyle = 'border-border/40 bg-muted/30 opacity-60';
              }
            } else if (selected) {
              choiceStyle = 'border-amber-500 bg-amber-500/10';
            }

            return (
              <button
                key={choice.id}
                onClick={() => toggleChoice(choice.id)}
                disabled={submitted}
                className={cn(
                  'w-full text-left flex items-start gap-3 rounded-xl border px-4 py-3 text-sm transition-all duration-150',
                  submitted ? 'cursor-default' : 'cursor-pointer',
                  choiceStyle,
                )}
              >
                <span
                  className={cn(
                    'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[11px] font-bold mt-0.5',
                    submitted
                      ? 'border-transparent bg-transparent'
                      : selected
                        ? 'border-amber-500 bg-amber-500 text-slate-950'
                        : 'border-border text-muted-foreground',
                  )}
                >
                  {!submitted && choice.id.toUpperCase()}
                </span>
                {submitted && indicator}
                <span className="leading-relaxed text-foreground/90">
                  {choice.text}
                </span>
              </button>
            );
          })}
        </div>

        {/* Submit / Result */}
        {!submitted ? (
          <Button
            onClick={handleSubmit}
            disabled={selectedIds.length === 0}
            className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl px-6 disabled:opacity-40 transition-all"
          >
            Submit My Decision
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          <div className="space-y-5">
            {/* Result Banner */}
            <div
              className={cn(
                'flex items-center gap-3 rounded-xl p-3.5',
                answeredCorrectly
                  ? 'bg-emerald-500/10 border border-emerald-500/30'
                  : 'bg-amber-500/10 border border-amber-500/30',
              )}
            >
              {answeredCorrectly ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
              ) : (
                <Lightbulb className="h-5 w-5 text-amber-500 shrink-0" />
              )}
              <span className="text-sm font-semibold text-foreground">
                {answeredCorrectly
                  ? '✓ Correct operator instinct!'
                  : "Not quite — here's the operator reasoning:"}
              </span>
            </div>

            {/* Coach Wesley's Reasoning */}
            <div className="rounded-2xl bg-slate-950 text-white p-5 sm:p-6">
              <div className="flex items-center gap-2 mb-3 text-amber-400 font-bold text-xs uppercase tracking-widest">
                <Zap className="h-4 w-4" />
                Coach Wesley&apos;s Reasoning
              </div>
              <div className="text-xs sm:text-sm text-slate-200 leading-relaxed whitespace-pre-line">
                {scenario.coachReasoning}
              </div>
              <div className="mt-4 pt-4 border-t border-slate-800 flex items-start gap-2.5">
                <div className="h-1.5 w-1.5 rounded-full bg-amber-500 mt-2 shrink-0" />
                <p className="text-xs text-amber-400 font-semibold italic leading-relaxed">
                  Operator Takeaway: {scenario.operatorTakeaway}
                </p>
              </div>
            </div>

            {/* Retry + Next */}
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={handleReset}
                className="text-xs text-muted-foreground hover:text-foreground font-medium underline underline-offset-2 transition-colors"
              >
                Try again
              </button>

              {!isLast && (
                <Button
                  onClick={onNext}
                  className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl px-5"
                >
                  Next Scenario
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main ScenarioLab Component ────────────────────────────────────────────────

interface ScenarioLabProps {
  /** Filter scenarios by courseSlug. If omitted, shows all. */
  courseSlug?: string;
}

export default function ScenarioLab({ courseSlug }: ScenarioLabProps) {
  const scenarios = courseSlug
    ? scenariosData
        .filter((s) => s.courseSlug === courseSlug)
        .sort((a, b) => a.order - b.order)
    : scenariosData;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [completed, setCompleted] = useState(false);

  const handleNext = () => {
    if (currentIndex < scenarios.length - 1) {
      setCurrentIndex((i) => i + 1);
    } else {
      setCompleted(true);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (scenarios.length === 0) {
    return (
      <div className="rounded-2xl border border-border/80 bg-card p-8 text-center text-muted-foreground text-sm">
        No scenarios available for this course yet.
      </div>
    );
  }

  if (completed) {
    return (
      <div className="rounded-3xl border border-amber-500/40 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 text-white p-8 sm:p-12 text-center shadow-2xl">
        <div className="text-5xl mb-4">🎯</div>
        <div className="text-xs font-bold uppercase tracking-widest text-amber-400 mb-2">
          Scenario Lab Complete
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold mb-4">
          All {scenarios.length} scenarios finished.
        </h2>
        <p className="text-sm text-slate-300 max-w-xl mx-auto mb-8 leading-relaxed">
          You&apos;ve worked through the core diagnostic scenarios. Each one
          reflects a real account situation. The operator instinct you practiced
          here is the same judgment that separates a consistent 25% ACoS from a
          55% one.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Button
            onClick={() => {
              setCurrentIndex(0);
              setCompleted(false);
            }}
            variant="outline"
            className="border-slate-700 text-white hover:bg-slate-800 rounded-xl"
          >
            Restart Lab
          </Button>
          <Button
            asChild
            className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl"
          >
            <a href="/academy/certifications">
              Explore Certifications
              <ArrowRight className="ml-2 h-4 w-4" />
            </a>
          </Button>
        </div>
      </div>
    );
  }

  const scenario = scenarios[currentIndex];

  return (
    <div>
      {/* Progress Bar */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex-1 bg-muted rounded-full h-1.5 overflow-hidden">
          <div
            className="h-full bg-amber-500 transition-all duration-500 rounded-full"
            style={{ width: `${(currentIndex / scenarios.length) * 100}%` }}
          />
        </div>
        <span className="text-xs font-bold text-muted-foreground shrink-0">
          {currentIndex + 1} / {scenarios.length}
        </span>
      </div>

      {/* Scenario Pills Navigation */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {scenarios.map((s, idx) => (
          <button
            key={s.id}
            onClick={() => setCurrentIndex(idx)}
            className={cn(
              'shrink-0 px-3 py-1 rounded-full text-xs font-semibold transition-all',
              idx === currentIndex
                ? 'bg-amber-500 text-slate-950'
                : idx < currentIndex
                  ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80',
            )}
          >
            {idx + 1}. {s.title}
          </button>
        ))}
      </div>

      <ScenarioCard
        key={scenario.id}
        scenario={scenario}
        scenarioNumber={currentIndex + 1}
        totalScenarios={scenarios.length}
        onNext={handleNext}
        isLast={currentIndex === scenarios.length - 1}
      />
    </div>
  );
}
