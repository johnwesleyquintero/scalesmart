'use client';

import { Badge } from '@/components/ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { HelpCircle, MessageCircle, ArrowRight } from 'lucide-react';
import Link from 'next/link';

const FAQ_DATA = [
  {
    category: 'Company & Services',
    questions: [
      {
        q: 'What is the "Triad Call" system?',
        a: 'We implement a weekly triad call between the VA, the client, and the CEO. This ensures transparency, allows for progress reporting, and provides an opportunity for us to offer business development suggestions.',
      },
      {
        q: 'Do you provide support for the VAs?',
        a: 'Yes. ScaleSmart provides 24/7 mentor support for all our VAs. If they need help with tools, work advice, or technical hurdles, our mentors are available to guide them at any time.',
      },
      {
        q: 'How are VAs trained?',
        a: 'Every VA is trained specifically based on your business needs. We ensure they are proficient in the tools and workflows required for your niche before they begin.',
      },
    ],
  },
  {
    category: 'Contracts & Billing',
    questions: [
      {
        q: 'Is there a long-term contract?',
        a: 'There are no long-term contracts. You are billed on an hourly basis, and there are no cancellation fees or penalties if you decide to stop the service.',
      },
      {
        q: 'What does the hourly fee cover?',
        a: 'The hourly fee is all-inclusive. It covers the assistant’s salary, benefits, vacation time, bonuses, office space, and equipment. There are no hidden overhead costs.',
      },
      {
        q: 'Can my VA work on holidays or weekends?',
        a: 'Yes. The hourly rate remains the same even for holiday or weekend work. Whether or not to provide a bonus for holiday work is entirely up to your discretion.',
      },
    ],
  },
  {
    category: 'Operations & Communication',
    questions: [
      {
        q: 'How do I communicate with my assistant?',
        a: 'Communication is primarily handled via Slack. we create specific channels for each client that include the VA, the mentor, and the CEO to ensure quality is strictly monitored and support is always available.',
      },
      {
        q: 'Do you use time-tracking software?',
        a: 'We prefer to focus on progress and quality of work rather than just counting hours. However, the choice is yours! You are welcome to use tools like Clockify or Google Spreadsheets if you prefer strict tracking.',
      },
      {
        q: 'What happens if a VA is not performing well?',
        a: 'We have a zero-tolerance policy for poor behavior or persistent low quality. We issue a maximum of two warnings. If issues persist, the VA is dismissed, and we provide a FREE replacement immediately.',
      },
      {
        q: 'How do you handle credit card security?',
        a: 'ScaleSmart is not liable for loss or damage related to credit card information. However, any unauthorized use of a client’s card results in immediate dismissal and a free replacement of the VA. We recommend using secure permission tools instead of sharing raw card details.',
      },
    ],
  },
  {
    category: 'Technical Expertise',
    questions: [
      {
        q: 'What platforms are VAs proficient in?',
        a: 'All our assistants are experts in Microsoft Office and proficient in major CRMs like Zendesk, Infusionsoft, and Basecamp. Depending on your specific needs, we can provide VAs skilled in accounting, design, CMS, or programming environments.',
      },
      {
        q: 'Can I add more workload beyond the initial scope?',
        a: 'Absolutely. Just let us know your changing needs, and we will adjust the workload and training accordingly to match the difficulty of the new tasks.',
      },
    ],
  },
];

export default function FAQPage() {
  return (
    <div className="container mx-auto px-4 py-24 md:py-32">
      <div className="mb-20 max-w-3xl">
        <Badge variant="secondary" className="mb-4">
          FAQS
        </Badge>
        <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
          Everything You Need <span className="text-blue-600">To Know.</span>
        </h1>
        <p className="text-xl text-muted-foreground leading-relaxed">
          Common questions about our systems, our VAs, and how we help your
          business scale without the friction.
        </p>
      </div>

      <div className="grid gap-12 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <div className="space-y-16">
            {FAQ_DATA.map((group) => (
              <div key={group.category}>
                <h2 className="mb-6 text-2xl font-bold border-b pb-4 text-blue-600">
                  {group.category}
                </h2>
                <Accordion type="single" collapsible className="w-full">
                  {group.questions.map((faq, index) => (
                    <AccordionItem
                      key={index}
                      value={`${group.category}-${index}`}
                      className="border-b-0 mb-4 rounded-2xl border bg-background/50 px-6 transition-all hover:border-blue-200 hover:shadow-sm"
                    >
                      <AccordionTrigger className="text-left font-bold text-lg hover:no-underline py-6">
                        {faq.q}
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground text-base leading-relaxed pb-6">
                        {faq.a}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-4 lg:sticky lg:top-32 h-fit">
          <div className="rounded-3xl border bg-blue-600 p-8 text-white shadow-xl">
            <HelpCircle className="mb-6 h-12 w-12 opacity-50" />
            <h3 className="mb-4 text-2xl font-bold">Still have questions?</h3>
            <p className="mb-8 text-blue-100">
              Can't find the answer you're looking for? Reach out to our team
              directly and we'll get back to you within 24 hours.
            </p>
            <div className="space-y-4">
              <Button
                variant="secondary"
                className="w-full h-12 font-bold rounded-xl"
                asChild
              >
                <Link href="/contact" className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5" /> Message Support
                </Link>
              </Button>
              <Button
                variant="outline"
                className="w-full h-12 font-bold rounded-xl bg-transparent border-white text-white hover:bg-white/10"
                asChild
              >
                <Link href="/contact" className="flex items-center gap-2">
                  Book a Strategy Call <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
