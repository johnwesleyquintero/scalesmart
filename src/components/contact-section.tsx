'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import type React from 'react';

import { Loader2, Mail, MapPin, Phone, Send } from 'lucide-react';
import { useState } from 'react';

export default function ContactSection() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate form submission
    await new Promise((resolve) => setTimeout(resolve, 1500));

    setIsSubmitting(false);
    setIsSubmitted(true);
  };

  return (
    <section id="contact" className="container relative mx-auto px-4 py-32">
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-100/50 to-blue-100/50 dark:from-purple-950/50 dark:to-blue-950/50 blur-3xl"></div>
      </div>

      <div className="mx-auto max-w-5xl">
        <div className="mb-12 text-center">
          <Badge variant="secondary" className="mb-4">
            Contact
          </Badge>
          <h2 className="mb-4 text-3xl font-bold md:text-4xl">Get In Touch</h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            Have a project in mind or want to discuss how I can help your
            business? Feel free to reach out!
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          <Card className="overflow-hidden">
            <CardHeader className="bg-primary/10 p-4">
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-primary" />
                Email
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <a
                href="mailto:johnwesleyquintero@gmail.com"
                className="text-sm text-muted-foreground hover:text-primary"
              >
                johnwesleyquintero@gmail.com
              </a>
            </CardContent>
          </Card>

          <Card className="overflow-hidden">
            <CardHeader className="bg-primary/10 p-4">
              <CardTitle className="flex items-center gap-2">
                <Phone className="h-5 w-5 text-primary" />
                Phone
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <a
                href="tel:+639504469156"
                className="text-sm text-muted-foreground hover:text-primary"
              >
                +63 950 446 9156
              </a>
            </CardContent>
          </Card>

          <Card className="overflow-hidden">
            <CardHeader className="bg-primary/10 p-4">
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                Location
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">
                Tagum, Davao Region, Philippines
              </p>
            </CardContent>
          </Card>
        </div>

        <Card className="mt-12 overflow-hidden">
          <CardHeader>
            <CardTitle>Send Me a Message</CardTitle>
            <CardDescription>
              Fill out the form below and I&apos;ll get back to you as soon as
              possible.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isSubmitted ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="mb-4 rounded-full bg-green-100 p-3 text-green-600 dark:bg-green-900/30 dark:text-green-400">
                  <Send className="h-6 w-6" />
                </div>
                <h3 className="mb-2 text-xl font-semibold">Message Sent!</h3>
                <p className="text-muted-foreground">
                  Thank you for reaching out. I&apos;ll respond to your message
                  soon.
                </p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => {
                    setIsSubmitted(false);
                  }}
                >
                  Send Another Message
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label htmlFor="name" className="text-sm font-medium">
                      Name
                    </label>
                    <Input id="name" placeholder="Your name" required />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="email" className="text-sm font-medium">
                      Email
                    </label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="Your email"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label htmlFor="subject" className="text-sm font-medium">
                    Subject
                  </label>
                  <Input
                    id="subject"
                    placeholder="Subject of your message"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="message" className="text-sm font-medium">
                    Message
                  </label>
                  <Textarea
                    id="message"
                    placeholder="Your message"
                    rows={5}
                    className="resize-none"
                    required
                  />
                </div>
              </form>
            )}
          </CardContent>
          {!isSubmitted && (
            <CardFooter className="flex justify-end border-t px-6 py-4">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {isSubmitting ? 'Sending...' : 'Send Message'}
              </Button>
            </CardFooter>
          )}
        </Card>
      </div>
    </section>
  );
}
