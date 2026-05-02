'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Mail,
  Facebook,
  Linkedin,
  Globe,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { GOOGLE_SHEETS_WEBHOOK_URL, SOCIAL_LINKS } from '@/constants/links';

// Form validation schema
const contactFormSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  service: z.string().min(1, { message: 'Please select a service.' }),
  message: z
    .string()
    .min(10, { message: 'Message must be at least 10 characters.' }),
});

type ContactFormValues = z.infer<typeof contactFormSchema>;

const INPUT_CLASSES =
  'w-full rounded-xl border bg-background px-4 py-3 outline-none transition-colors';
const INPUT_ERROR_CLASSES = 'border-red-500';
const INPUT_FOCUS_CLASSES = 'focus:border-blue-500';

export default function ContactPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      service: 'Digital Solutions',
    },
  });

  const onSubmit = async (data: ContactFormValues) => {
    setIsSubmitting(true);
    try {
      // Sending data to Google Sheets via Apps Script Webhook
      await fetch(GOOGLE_SHEETS_WEBHOOK_URL, {
        method: 'POST',
        mode: 'no-cors',
        body: JSON.stringify(data),
      });

      setIsSuccess(true);
      toast.success('System Logged! We will get back to you soon.');
      reset();
    } catch (error) {
      console.error('Submission error:', error);
      toast.error('Failed to log system. Please try again.');
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
          System Successfully <span className="text-emerald-600">Logged.</span>
        </h1>
        <p className="mb-10 text-xl text-muted-foreground max-w-lg">
          Thank you for reaching out to ScaleSmart. Your inquiry has been added
          to our operational queue. We'll be in touch within 24 hours.
        </p>
        <Button
          onClick={() => setIsSuccess(false)}
          variant="outline"
          size="lg"
          className="rounded-xl"
        >
          Send Another Message
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-24 md:py-32">
      <div className="grid gap-16 lg:grid-cols-2">
        <div>
          <Badge variant="secondary" className="mb-4">
            Get In Touch
          </Badge>
          <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl">
            Let's build your{' '}
            <span className="text-blue-600">scaling system.</span>
          </h1>
          <p className="mb-12 text-xl text-muted-foreground">
            Ready to move faster? Send us a message and we'll get back to you
            within 24 hours.
          </p>

          <div className="space-y-8">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/30">
                <Mail className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Email us at
                </p>
                <p className="text-lg font-bold">{SOCIAL_LINKS.EMAIL}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/30">
                <Linkedin className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  LinkedIn
                </p>
                <a
                  href={SOCIAL_LINKS.LINKEDIN}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-lg font-bold hover:text-blue-600 transition-colors"
                >
                  ScaleSmart PH
                </a>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-white">
                <Facebook className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Facebook
                </p>
                <a
                  href={SOCIAL_LINKS.FACEBOOK}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-lg font-bold hover:text-blue-600 transition-colors"
                >
                  ScaleSmart
                </a>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30">
                <Globe className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Official Website
                </p>
                <a
                  href={SOCIAL_LINKS.WEBSITE}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-lg font-bold hover:text-blue-600 transition-colors"
                >
                  scalesmart.vercel.app
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border bg-background/50 p-8 shadow-xl backdrop-blur-sm md:p-12">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="name">
                  Name
                </label>
                <input
                  {...register('name')}
                  id="name"
                  className={`${INPUT_CLASSES} ${errors.name ? INPUT_ERROR_CLASSES : INPUT_FOCUS_CLASSES}`}
                  placeholder="John Doe"
                  type="text"
                />
                {errors.name && (
                  <p className="text-xs text-red-500">{errors.name.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="email">
                  Email
                </label>
                <input
                  {...register('email')}
                  id="email"
                  className={`${INPUT_CLASSES} ${errors.email ? INPUT_ERROR_CLASSES : INPUT_FOCUS_CLASSES}`}
                  placeholder="john@example.com"
                  type="email"
                />
                {errors.email && (
                  <p className="text-xs text-red-500">{errors.email.message}</p>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="service">
                Service Interested In
              </label>
              <select
                {...register('service')}
                id="service"
                className="w-full rounded-xl border bg-background px-4 py-3 outline-none focus:border-blue-500 transition-colors appearance-none"
              >
                <option>Digital Solutions</option>
                <option>VA Workflows</option>
                <option>Tech Systems</option>
                <option>Full Agency Revamp</option>
              </select>
              {errors.service && (
                <p className="text-xs text-red-500">{errors.service.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="message">
                Message
              </label>
              <textarea
                {...register('message')}
                id="message"
                rows={4}
                className={`${INPUT_CLASSES} resize-none ${errors.message ? INPUT_ERROR_CLASSES : INPUT_FOCUS_CLASSES}`}
                placeholder="Tell us about your project..."
              />
              {errors.message && (
                <p className="text-xs text-red-500">{errors.message.message}</p>
              )}
            </div>
            <Button
              disabled={isSubmitting}
              className="w-full h-12 text-lg rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Logging System...
                </>
              ) : (
                'Send Message'
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
