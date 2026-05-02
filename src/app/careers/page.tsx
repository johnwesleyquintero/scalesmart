'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Loader2,
  CheckCircle2,
  Briefcase,
  DollarSign,
  Globe,
  Upload,
  MessageSquare,
  Users,
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';

// Form validation schema for careers
const careerFormSchema = z.object({
  fullName: z.string().min(2, { message: 'Full name is required.' }),
  email: z.string().email({ message: 'Valid email is required.' }),
  whatsapp: z.string().min(5, { message: 'WhatsApp number is required.' }),
  msTeams: z.string().optional(),
  profession: z.string().min(2, { message: 'Please specify your niche.' }),
  proposal: z
    .string()
    .min(20, { message: 'Tell us more about your experience (min 20 chars).' }),
  cvLink: z
    .string()
    .url({ message: 'Please provide a valid public URL to your CV.' }),
  tools: z.string().min(2, { message: 'List some tools you use.' }),
  skills: z.string().min(2, { message: 'Tell us about your skills.' }),
  referral: z.string().optional(),
});

type CareerFormValues = z.infer<typeof careerFormSchema>;

const INPUT_CLASSES =
  'w-full rounded-xl border bg-background px-4 py-3 outline-none transition-colors';
const INPUT_ERROR_CLASSES = 'border-red-500';
const INPUT_FOCUS_CLASSES = 'focus:border-blue-500';

export default function CareersPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CareerFormValues>({
    resolver: zodResolver(careerFormSchema),
  });

  const onSubmit = async (data: CareerFormValues) => {
    setIsSubmitting(true);
    try {
      // Sending data via Next.js API to avoid browser CORS errors
      const response = await fetch('/api/careers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to submit application');
      }

      setIsSuccess(true);
      toast.success('Application Submitted! We will review it soon.');
      reset();
    } catch (error) {
      console.error('Submission error:', error);
      toast.error('Failed to submit application. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="container mx-auto px-4 py-24 md:py-32 flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="mb-8 flex h-24 w-24 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30">
          <CheckCircle2 className="h-12 w-12" />
        </div>
        <h1 className="mb-4 text-4xl font-bold tracking-tight">
          Application <span className="text-emerald-600">Received.</span>
        </h1>
        <p className="mb-10 text-xl text-muted-foreground max-w-lg">
          Thank you for applying to ScaleSmart. Your profile has been added to
          our recruitment queue. If your skills match our needs, we'll reach out
          via email or WhatsApp.
        </p>
        <Button
          onClick={() => setIsSuccess(false)}
          variant="outline"
          size="lg"
          className="rounded-xl"
        >
          Back to Careers
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-24 md:py-32">
      {/* Hero Section */}
      <div className="mb-20 text-center">
        <Badge
          variant="secondary"
          className="mb-4 py-1.5 px-4 text-sm font-semibold bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
        >
          WE ARE HIRING
        </Badge>
        <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl md:text-7xl">
          Earn Up To <span className="text-blue-600">$2000/Month</span>
        </h1>
        <p className="mx-auto max-w-3xl text-xl text-muted-foreground leading-relaxed">
          Be the next VA of ScaleSmart! We are hiring talented Virtual
          Assistants across the Philippines to help international clients across
          the UK, US, Canada, and Australia.
        </p>
      </div>

      <div className="grid gap-16 lg:grid-cols-2 lg:items-start">
        {/* Info Side */}
        <div className="space-y-12">
          <div>
            <h2 className="mb-6 text-3xl font-bold">Why Join ScaleSmart?</h2>
            <div className="grid gap-6">
              <div className="flex gap-4 p-6 rounded-2xl border bg-background/50 backdrop-blur-sm">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-900/30">
                  <DollarSign className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="text-lg font-bold">Competitive Pay</h4>
                  <p className="text-muted-foreground">
                    High-paying roles with performance-based rewards and growth
                    opportunities.
                  </p>
                </div>
              </div>
              <div className="flex gap-4 p-6 rounded-2xl border bg-background/50 backdrop-blur-sm">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30">
                  <Globe className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="text-lg font-bold">Global Impact</h4>
                  <p className="text-muted-foreground">
                    Work with elite international clients and build a
                    world-class professional portfolio.
                  </p>
                </div>
              </div>
              <div className="flex gap-4 p-6 rounded-2xl border bg-background/50 backdrop-blur-sm">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30">
                  <Briefcase className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="text-lg font-bold">Structured Systems</h4>
                  <p className="text-muted-foreground">
                    Don't work in chaos. We provide the tools and systems you
                    need to succeed.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-blue-200 bg-blue-50/50 p-8 dark:border-blue-900 dark:bg-blue-900/10">
            <h3 className="mb-4 text-xl font-bold flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-blue-600" /> Application
              Tip
            </h3>
            <p className="text-muted-foreground leading-relaxed italic">
              "Make sure to set your CV link to <strong>'Public'</strong>. This
              gives you a massive advantage during our initial screening
              process!"
            </p>
          </div>
        </div>

        {/* Form Side */}
        <div className="rounded-3xl border bg-background p-8 shadow-2xl md:p-12">
          <div className="mb-8">
            <h2 className="text-2xl font-bold">Application Form</h2>
            <p className="text-muted-foreground">
              Submit your proposal and join our fast-growing company.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Complete Name</label>
              <input
                {...register('fullName')}
                className={`${INPUT_CLASSES} ${errors.fullName ? INPUT_ERROR_CLASSES : INPUT_FOCUS_CLASSES}`}
                placeholder="Juan Dela Cruz"
              />
              {errors.fullName && (
                <p className="text-xs text-red-500">
                  {errors.fullName.message}
                </p>
              )}
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Email Address</label>
                <input
                  {...register('email')}
                  className={`${INPUT_CLASSES} ${errors.email ? INPUT_ERROR_CLASSES : INPUT_FOCUS_CLASSES}`}
                  placeholder="juan@example.com"
                  type="email"
                />
                {errors.email && (
                  <p className="text-xs text-red-500">{errors.email.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">WhatsApp Number</label>
                <input
                  {...register('whatsapp')}
                  className={`${INPUT_CLASSES} ${errors.whatsapp ? INPUT_ERROR_CLASSES : INPUT_FOCUS_CLASSES}`}
                  placeholder="+63 9XX XXX XXXX"
                />
                {errors.whatsapp && (
                  <p className="text-xs text-red-500">
                    {errors.whatsapp.message}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                MS Teams ID / Email (Optional)
              </label>
              <input
                {...register('msTeams')}
                className={INPUT_CLASSES}
                placeholder="msteams@example.com"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Niche / Profession</label>
              <input
                {...register('profession')}
                className={`${INPUT_CLASSES} ${errors.profession ? INPUT_ERROR_CLASSES : INPUT_FOCUS_CLASSES}`}
                placeholder="Ex. Social Media-VA, E-Com-VA, Exec Asst-VA..."
              />
              {errors.profession && (
                <p className="text-xs text-red-500">
                  {errors.profession.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Proposal / Experience
              </label>
              <textarea
                {...register('proposal')}
                rows={4}
                className={`${INPUT_CLASSES} resize-none ${errors.proposal ? INPUT_ERROR_CLASSES : INPUT_FOCUS_CLASSES}`}
                placeholder="Tell us about yourself and previous work experience..."
              />
              {errors.proposal && (
                <p className="text-xs text-red-500">
                  {errors.proposal.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Public CV Link (GDrive/Canva/Website)
              </label>
              <div className="relative">
                <input
                  {...register('cvLink')}
                  className={`${INPUT_CLASSES} pl-11 ${errors.cvLink ? INPUT_ERROR_CLASSES : INPUT_FOCUS_CLASSES}`}
                  placeholder="https://drive.google.com/..."
                />
                <Upload className="absolute left-4 top-3.5 h-5 w-5 text-muted-foreground" />
              </div>
              {errors.cvLink && (
                <p className="text-xs text-red-500">{errors.cvLink.message}</p>
              )}
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Tools You Use</label>
                <textarea
                  {...register('tools')}
                  rows={3}
                  className={`${INPUT_CLASSES} resize-none ${errors.tools ? INPUT_ERROR_CLASSES : INPUT_FOCUS_CLASSES}`}
                  placeholder="Slack, Notion, Zapier, Canva..."
                />
                {errors.tools && (
                  <p className="text-xs text-red-500">{errors.tools.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Skills Contribution
                </label>
                <textarea
                  {...register('skills')}
                  rows={3}
                  className={`${INPUT_CLASSES} resize-none ${errors.skills ? INPUT_ERROR_CLASSES : INPUT_FOCUS_CLASSES}`}
                  placeholder="Graphic Design, Data Entry, Management..."
                />
                {errors.skills && (
                  <p className="text-xs text-red-500">
                    {errors.skills.message}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Referral Name (Optional)
              </label>
              <input
                {...register('referral')}
                className={INPUT_CLASSES}
                placeholder="Who referred you?"
              />
            </div>

            <Button
              disabled={isSubmitting}
              className="w-full h-14 text-lg rounded-xl bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-500/20"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Submitting Application...
                </>
              ) : (
                'SUBMIT APPLICATION'
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
