'use client';
import { useMemo } from 'react';

interface TimeStampProps {
  date: string; // Expected format: YYYY-MM-DD
  relative?: boolean;
}

export default function TimeStamp({ date, relative }: TimeStampProps) {
  const formattedDate = useMemo(() => {
    const d = new Date(date);
    if (isNaN(d.getTime())) {
      return 'Invalid Date';
    }

    if (relative) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const inputDate = new Date(date);
      inputDate.setHours(0, 0, 0, 0);

      const diffTime = Math.abs(today.getTime() - inputDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 0) {
        return 'Today';
      } else if (diffDays === 1) {
        return 'Yesterday';
      } else if (diffDays < 7) {
        return `${diffDays} days ago`;
      }
    }

    // Fallback to a standard date format if not relative or if relative logic doesn't apply
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }, [date, relative]);

  return <span>{formattedDate}</span>;
}
