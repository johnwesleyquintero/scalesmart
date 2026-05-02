import Logo from '@/components/Logo';
import { Linkedin, Mail, Twitter, Facebook } from 'lucide-react';
import Link from 'next/link';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const footerLinks = [
    {
      title: 'Systems',
      links: [
        { name: 'Operations & Growth', href: '/services/operations-growth' },
        {
          name: 'Workforce & Workflows',
          href: '/services/workforce-workflows',
        },
        { name: 'Brand & Support', href: '/services/brand-support' },
        { name: 'Pricing', href: '/pricing' },
      ],
    },
    {
      title: 'Resources',
      links: [
        { name: 'Prompt Generator', href: '/prompt-request-generator' },
        { name: 'Blog', href: '/blog' },
        { name: 'About ScaleSmart', href: '/about' },
        { name: 'Success Stories', href: '/#success-stories' },
      ],
    },
    {
      title: 'Company',
      links: [
        { name: 'Careers', href: '/careers' },
        { name: 'Contact Us', href: '/contact' },
        { name: 'Privacy Policy', href: '/privacy-policy' },
        { name: 'Terms of Service', href: '/terms-of-service' },
      ],
    },
  ];

  return (
    <footer className="border-t bg-muted/40 transition-colors duration-300">
      <div className="container py-16 md:py-24">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-4 md:grid-cols-2">
          {/* Brand Column */}
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <Logo className="h-10 w-10" />
              <h3 className="text-2xl font-bold tracking-tight">ScaleSmart</h3>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              Helping businesses move faster, operate smarter, and scale without
              chaos through digital solutions and automated systems.
            </p>
            <div className="flex space-x-3">
              <Link
                href="https://www.linkedin.com/company/scalesmart-ph/"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full bg-background p-2.5 text-muted-foreground shadow-sm transition-all hover:bg-blue-600 hover:text-white"
              >
                <Linkedin className="h-5 w-5" />
              </Link>
              <Link
                href="https://www.facebook.com/people/ScaleSmart/61589206317712/"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full bg-background p-2.5 text-muted-foreground shadow-sm transition-all hover:bg-blue-700 hover:text-white"
              >
                <Facebook className="h-5 w-5" />
              </Link>
              <Link
                href="https://x.com/wesley_q26158"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full bg-background p-2.5 text-muted-foreground shadow-sm transition-all hover:bg-black hover:text-white"
              >
                <Twitter className="h-5 w-5" />
              </Link>
              <Link
                href="mailto:scalesmart.contact@gmail.com"
                className="rounded-full bg-background p-2.5 text-muted-foreground shadow-sm transition-all hover:bg-red-500 hover:text-white"
              >
                <Mail className="h-5 w-5" />
              </Link>
            </div>
          </div>

          {/* Categorized Links */}
          {footerLinks.map((category) => (
            <div key={category.title} className="space-y-6">
              <h3 className="text-sm font-bold uppercase tracking-widest text-foreground">
                {category.title}
              </h3>
              <ul className="space-y-4 text-sm">
                {category.links.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="text-muted-foreground transition-colors hover:text-blue-600"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-16 border-t pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground text-center md:text-left">
            &copy; {currentYear} ScaleSmart. Built for operators, by operators.
          </p>
          <div className="flex gap-8 text-xs font-medium text-muted-foreground">
            <Link
              href="/privacy-policy"
              className="hover:text-blue-600 transition-colors"
            >
              Privacy Policy
            </Link>
            <Link
              href="/terms-of-service"
              className="hover:text-blue-600 transition-colors"
            >
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
