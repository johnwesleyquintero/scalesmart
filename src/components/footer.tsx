import Logo from '@/components/Logo';
import { Github, Linkedin, Mail, Twitter, Facebook } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t bg-muted/40 min-h-[200px]">
      <div className="container py-8 md:py-12">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          <div>
            <div className="flex items-center gap-2">
              <Logo className="h-8 w-8" />
              <h3 className="text-lg font-semibold">ScaleSmart</h3>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              Helping businesses move faster, operate smarter, and scale without
              chaos through digital solutions and systems.
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold">Quick Links</h3>
            <ul className="mt-2 space-y-2 text-sm">
              <li>
                <Link
                  href="/services"
                  className="text-muted-foreground hover:text-primary"
                >
                  Services
                </Link>
              </li>
              <li>
                <Link
                  href="/pricing"
                  className="text-muted-foreground hover:text-primary"
                >
                  Pricing
                </Link>
              </li>
              <li>
                <Link
                  href="/about"
                  className="text-muted-foreground hover:text-primary"
                >
                  About
                </Link>
              </li>
              <li>
                <Link
                  href="/blog"
                  className="text-muted-foreground hover:text-primary"
                >
                  Blog
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="text-muted-foreground hover:text-primary"
                >
                  Contact
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-semibold">Connect</h3>
            <div className="mt-2 flex space-x-4">
              <Link
                href="https://www.linkedin.com/company/scalesmart-ph/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn"
                className="rounded-full bg-background p-2 text-muted-foreground transition-all hover:text-primary hover:scale-110 hover:shadow-lg hover:shadow-primary/20 duration-300 hover:bg-primary/10 hover:rotate-6 group"
              >
                <Linkedin className="h-5 w-5" />
              </Link>
              <Link
                href="https://www.facebook.com/people/ScaleSmart/61589206317712/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="rounded-full bg-background p-2 text-muted-foreground transition-all hover:text-primary hover:scale-110 hover:shadow-lg hover:shadow-primary/20 duration-300 hover:bg-primary/10 hover:rotate-6 group"
              >
                <Facebook className="h-5 w-5" />
              </Link>
              <Link
                href="https://x.com/wesley_q26158"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="X"
                className="rounded-full bg-background p-2 text-muted-foreground transition-all hover:text-primary hover:scale-110 hover:shadow-lg hover:shadow-primary/20 duration-300 hover:bg-primary/10 hover:rotate-6 group"
              >
                <Twitter className="h-5 w-5" />
              </Link>
              <Link
                href="mailto:scalesmart.contact@gmail.com"
                aria-label="Email"
                className="rounded-full bg-background p-2 text-muted-foreground transition-all hover:text-primary hover:scale-110 hover:shadow-lg hover:shadow-primary/20 duration-300 hover:bg-primary/10 hover:rotate-6 group"
              >
                <Mail className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>
        <div className="mt-8 border-t pt-6">
          <p className="text-center text-sm text-muted-foreground">
            &copy; {currentYear} ScaleSmart. All rights reserved.
          </p>
          <div className="text-center text-sm text-muted-foreground">
            <Link href="/privacy-policy" className="hover:text-primary">
              Privacy & Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
