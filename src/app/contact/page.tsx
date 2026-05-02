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
import { SOCIAL_LINKS } from '@/constants/links';

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
      // Sending data via Next.js API to avoid browser CORS errors
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || 'Failed to submit message');
      }

      setIsSuccess(true);
      toast.success('System Logged! We will get back to you soon.');
      reset();
    } catch (error) {
      console.error('Submission error:', error);
      const message =
        error instanceof Error
          ? error.message
          : 'Failed to log system. Please try again.';
      toast.error(message);
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
    <main className="container mx-auto px-4 py-24 md:py-32">
      <div className="mb-20 grid gap-16 lg:grid-cols-2">
        <section>
          <Badge variant="secondary" className="mb-4">
            CONTACT US
          </Badge>
          <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
            Let’s build your <span className="text-blue-600">next system.</span>
          </h1>
          <p className="mb-10 text-xl text-muted-foreground leading-relaxed">
            Ready to systematize your operations? Reach out and let’s discuss
            how ScaleSmart can build the foundation for your next stage of
            growth.
          </p>

          <div className="space-y-8">
            <div className="flex gap-6">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-900/30 transition-transform hover:scale-110 hover:rotate-3">
                <Mail className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold">Email Us</h3>
                <p className="text-muted-foreground">
                  scalesmart.contact@gmail.com
                </p>
              </div>
            </div>
            <div className="flex gap-6">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-900/30 transition-transform hover:scale-110 hover:rotate-3">
                <Globe className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold">Location</h3>
                <p className="text-muted-foreground">Remote-First | Global</p>
              </div>
            </div>
          </div>

          <div className="mt-12">
            <h3 className="mb-6 text-sm font-bold uppercase tracking-widest text-muted-foreground">
              Follow Our Journey
            </h3>
            <div className="flex gap-4">
              {[
                {
                  icon: <Linkedin className="h-5 w-5" />,
                  href: SOCIAL_LINKS.LINKEDIN,
                  label: 'LinkedIn',
                },
                {
                  icon: <Facebook className="h-5 w-5" />,
                  href: SOCIAL_LINKS.FACEBOOK,
                  label: 'Facebook',
                },
              ].map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label}
                  className="flex h-12 w-12 items-center justify-center rounded-xl border bg-background transition-all hover:border-blue-500 hover:text-blue-600 hover:-translate-y-1"
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>
        </section>

        <section className="relative">
          <div className="absolute -inset-4 rounded-3xl bg-gradient-to-tr from-blue-500/10 to-indigo-500/10 blur-2xl" />
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="relative space-y-6 rounded-3xl border bg-background/80 p-8 shadow-2xl backdrop-blur-md"
          >
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-bold">
                  Full Name
                </label>
                <input
                  id="name"
                  {...register('name')}
                  placeholder="John Doe"
                  className="w-full rounded-xl border bg-background px-4 py-3 outline-none transition-colors focus:border-blue-500"
                />
                {errors.name && (
                  <p className="text-xs font-bold text-red-500">
                    {errors.name.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-bold">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  {...register('email')}
                  placeholder="john@example.com"
                  className="w-full rounded-xl border bg-background px-4 py-3 outline-none transition-colors focus:border-blue-500"
                />
                {errors.email && (
                  <p className="text-xs font-bold text-red-500">
                    {errors.email.message}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="service" className="text-sm font-bold">
                Service Interested In
              </label>
              <select
                id="service"
                {...register('service')}
                className="w-full rounded-xl border bg-background px-4 py-3 outline-none focus:border-blue-500 transition-colors appearance-none"
              >
                <option value="Operations & Growth">Operations & Growth</option>
                <option value="Workforce & Workflows">
                  Workforce & Workflows
                </option>
                <option value="Brand & Support">Brand & Support</option>
                <option value="Digital Solutions">Digital Solutions</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="space-y-2">
              <label htmlFor="message" className="text-sm font-bold">
                Tell us about your project
              </label>
              <textarea
                id="message"
                {...register('message')}
                placeholder="How can we help you scale?"
                rows={5}
                className="w-full rounded-xl border bg-background px-4 py-3 outline-none transition-colors focus:border-blue-500 resize-none"
              />
              {errors.message && (
                <p className="text-xs font-bold text-red-500">
                  {errors.message.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-14 text-lg font-bold rounded-full bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/20"
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Logging System...
                </div>
              ) : (
                'Log System Request'
              )}
            </Button>
          </form>
        </section>
      </div>
    </main>
  );
}
