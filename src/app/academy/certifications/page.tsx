'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import AcademyHero from '@/components/academy/AcademyHero';
import AcademyNavTabs from '@/components/academy/AcademyNavTabs';
import FeaturedCertificationCard from '@/components/academy/FeaturedCertificationCard';
import CertificationCard from '@/components/academy/CertificationCard';
import AcademyFaqSection from '@/components/academy/AcademyFaqSection';
import { certificationsData } from '@/data/academy/certifications';
import { CredentialTrack, CREDENTIAL_TRACKS } from '@/types/academy';
import { Button } from '@/components/ui/button';
import {
  Award,
  CheckCircle2,
  Download,
  ExternalLink,
  Filter,
  Layers,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function CertificationsPage() {
  const FILTER_BTN_BASE =
    'px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl transition-all duration-150 border';
  const FILTER_BTN_INACTIVE =
    'bg-muted/50 text-muted-foreground border-border/60 hover:text-foreground hover:bg-muted';

  const [activeFilter, setActiveFilter] = useState<'all' | CredentialTrack>(
    'all',
  );

  const featuredCert =
    certificationsData.find((c) => c.featured) || certificationsData[0];

  const filteredCertifications = certificationsData.filter((cert) => {
    if (activeFilter === 'all') return true;
    return cert.track === activeFilter;
  });

  const amazonAlignedCount = certificationsData.filter(
    (c) => c.track === CREDENTIAL_TRACKS.AMAZON_ALIGNED,
  ).length;
  const operatorCredentialsCount = certificationsData.filter(
    (c) => c.track === CREDENTIAL_TRACKS.OPERATOR_CREDENTIAL,
  ).length;

  return (
    <div className="max-w-7xl mx-auto py-6 sm:py-10">
      {/* Academy Navigation Tabs */}
      <AcademyNavTabs />

      {/* Hero Section */}
      <AcademyHero
        title="ScaleSmart Academy Certifications"
        subtitle="Prove your Amazon Ads expertise, get certified, and earn verifiable digital credentials to showcase your operational and advertising leadership."
        eyebrow="Credentials & Assessments"
        primaryCtaText="View All Certifications"
        primaryCtaHref="#catalogue"
        secondaryCtaText="My Achievements"
        secondaryCtaHref="#achievements"
        showBadges={false}
      />

      {/* Featured Spotlight Certification */}
      <div className="my-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Featured Credential
          </h2>
          <span className="text-xs text-amber-500 font-semibold">
            Recommended Starting Point
          </span>
        </div>
        <FeaturedCertificationCard certification={featuredCert} />
      </div>

      {/* Main Certifications Catalogue Section */}
      <section id="catalogue" className="my-12 scroll-mt-20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-6 border-b border-border/80">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              Certifications Catalogue
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Select an official Amazon-aligned track or advance to Coach Wesley
              Operator credentials.
            </p>
          </div>

          {/* Right Action: My Achievements anchor button */}
          <div className="flex items-center gap-3">
            <Button
              asChild
              className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-5 py-2 rounded-xl shadow-md text-xs sm:text-sm"
            >
              <a href="#achievements">
                <Award className="h-4 w-4 mr-2" />
                My Achievements
              </a>
            </Button>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 mb-8">
          <button
            onClick={() => setActiveFilter('all')}
            className={cn(
              FILTER_BTN_BASE,
              activeFilter === 'all'
                ? 'bg-foreground text-background border-foreground shadow-sm'
                : FILTER_BTN_INACTIVE,
            )}
          >
            All Certifications ({certificationsData.length})
          </button>

          <button
            onClick={() => setActiveFilter(CREDENTIAL_TRACKS.AMAZON_ALIGNED)}
            className={cn(
              FILTER_BTN_BASE,
              activeFilter === CREDENTIAL_TRACKS.AMAZON_ALIGNED
                ? 'bg-foreground text-background border-foreground shadow-sm'
                : FILTER_BTN_INACTIVE,
            )}
          >
            Amazon-Aligned Track ({amazonAlignedCount})
          </button>

          <button
            onClick={() =>
              setActiveFilter(CREDENTIAL_TRACKS.OPERATOR_CREDENTIAL)
            }
            className={cn(
              FILTER_BTN_BASE,
              activeFilter === CREDENTIAL_TRACKS.OPERATOR_CREDENTIAL
                ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-sm font-bold'
                : FILTER_BTN_INACTIVE,
            )}
          >
            Coach Wesley Operator Credentials ({operatorCredentialsCount})
          </button>
        </div>

        {/* 2-Column Certification Grid (matching Amazon Ads Academy Reference) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredCertifications.map((certification) => (
            <CertificationCard
              key={certification.id}
              certification={certification}
            />
          ))}
        </div>
      </section>

      {/* Achievement & Digital Credentials Concept Section */}
      <section id="achievements" className="my-16 scroll-mt-20">
        <div className="rounded-3xl border border-border/80 bg-card p-8 sm:p-12 shadow-sm relative overflow-hidden">
          <div className="max-w-3xl mb-8">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-500 mb-2">
              <Award className="h-4 w-4" />
              <span>Verifiable Operator Credentials</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground mb-3">
              Earn Verified Badges & Shareable Certificates
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Showcase your operational mastery to brand partners, employers,
              and clients. Each ScaleSmart credential validates that you can
              diagnose live account metrics, protect profitability, and run
              campaigns with institutional discipline.
            </p>
          </div>

          {/* Certificate Preview Card */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
            <div className="lg:col-span-2 rounded-2xl border border-amber-500/30 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 text-white p-6 sm:p-8 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-amber-500 flex items-center justify-center font-black text-slate-950 text-sm">
                    SS
                  </div>
                  <span className="font-bold text-sm tracking-wide text-white">
                    SCALESMART ACADEMY
                  </span>
                </div>
                <span className="text-[11px] font-mono uppercase tracking-widest text-amber-400">
                  VERIFIED CREDENTIAL
                </span>
              </div>

              <div className="space-y-2 mb-6">
                <div className="text-xs uppercase tracking-widest text-slate-400 font-medium">
                  Certificate of Operator Achievement
                </div>
                <div className="text-xl sm:text-2xl font-black text-white">
                  ScaleSmart Amazon PPC Operator (Level 1)
                </div>
                <p className="text-xs text-slate-300">
                  Demonstrated mastery in portfolio diagnostics, placement bid
                  engineering, search term harvesting, and multi-ASIN margin
                  preservation.
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-between pt-4 border-t border-slate-800 text-xs text-slate-400 gap-2">
                <span>
                  Curriculum Director: <strong>Coach Wesley</strong>
                </span>
                <span>
                  Verification: <strong>SS-OP-2026-B9</strong>
                </span>
              </div>
            </div>

            {/* Credential Features List */}
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-foreground">
                    LinkedIn Verifiable
                  </h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Add credential badges directly to your professional profile
                    and portfolio.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-foreground">
                    High-Resolution PDF
                  </h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Download printable proof of certification for clients and
                    team onboarding.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-foreground">
                    Continuous Currency
                  </h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Updated quarterly to reflect Amazon algorithm shifts and
                    console updates.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Frequently Asked Questions */}
      <AcademyFaqSection
        title="Frequently asked questions, answered"
        subtitle="Learn how certification badges work, retake policies, and the difference between Amazon definitions and ScaleSmart operational credentials."
      />
    </div>
  );
}
