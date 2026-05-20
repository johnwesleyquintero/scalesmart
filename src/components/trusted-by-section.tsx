'use client';

import React from 'react';
import { LANDING } from '@/constants/marketing';

const partners = LANDING.TRUSTED_BY.partners;

export default function TrustedBySection() {
  return (
    <section className="w-full py-12 border-y bg-muted/20">
      <div className="container mx-auto px-4">
        <p className="text-center text-sm font-bold uppercase tracking-widest text-muted-foreground mb-8">
          {LANDING.TRUSTED_BY.header}
        </p>
        <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
          {partners.map((partner) => (
            <div key={partner.name} className="flex items-center gap-2 group">
              <div className="h-8 w-8 rounded bg-foreground/10 flex items-center justify-center font-bold text-xs group-hover:bg-blue-600 group-hover:text-white transition-colors">
                {partner.logo}
              </div>
              <span className="font-semibold text-lg tracking-tight">
                {partner.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
