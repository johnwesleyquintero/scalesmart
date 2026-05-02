import { cn } from '@/lib/utils';
import Image from 'next/image';

interface LogoProps {
  className?: string;
  title?: string;
}

export default function Logo({ className, title }: Readonly<LogoProps>) {
  return (
    <div className={cn('relative overflow-hidden', className)}>
      <Image
        src="/images/agency-assets/images/logo_no_bg_no_text.png"
        alt={title || 'ScaleSmart Logo'}
        width={40}
        height={40}
        className="object-contain"
      />
    </div>
  );
}
