'use client';

import React from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { academyFaqsData } from '@/data/academy/faqs';
import { HelpCircle, Search } from 'lucide-react';

interface AcademyFaqSectionProps {
  title?: string;
  subtitle?: string;
}

export default function AcademyFaqSection({
  title = 'Frequently asked questions, answered',
  subtitle = 'Everything you need to know about ScaleSmart credentials, assessments, and the Operator methodology.',
}: AcademyFaqSectionProps) {
  return (
    <section className="relative overflow-hidden rounded-3xl bg-slate-950 text-white p-8 sm:p-12 lg:p-16 border border-slate-800 shadow-2xl my-16">
      {/* Subtle top light flare */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-32 bg-amber-500/10 blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-4xl mx-auto">
        {/* Visual Icon Badge */}
        <div className="flex flex-col items-center text-center mb-10">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-500/25 text-amber-400 mb-4 shadow-inner">
            <Search className="h-8 w-8" />
          </div>

          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white mb-3">
            {title}
          </h2>

          <p className="text-sm sm:text-base text-slate-400 max-w-2xl">
            {subtitle}
          </p>
        </div>

        {/* Accordion Component */}
        <Accordion type="single" collapsible className="w-full space-y-3">
          {academyFaqsData.map((faq) => (
            <AccordionItem
              key={faq.id}
              value={faq.id}
              className="border border-slate-800/80 bg-slate-900/60 rounded-2xl px-5 py-1 backdrop-blur-sm transition-all duration-200 data-[state=open]:border-amber-500/40 data-[state=open]:bg-slate-900/90"
            >
              <AccordionTrigger className="text-left text-sm sm:text-base font-semibold text-white hover:text-amber-400 hover:no-underline py-4">
                <span className="flex items-center gap-3">
                  <HelpCircle className="h-4 w-4 text-amber-500/70 shrink-0" />
                  <span>{faq.question}</span>
                </span>
              </AccordionTrigger>
              <AccordionContent className="text-xs sm:text-sm text-slate-300 leading-relaxed pb-4 pt-1 pl-7">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
