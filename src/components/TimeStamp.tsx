'use client';
import { useMemo, useState, useEffect } from 'react';

interface TimeStampProps {
  date: string; // Expected format: YYYY-MM-DD
  relative?: boolean;
}

export default function TimeStamp({ date, relative }: TimeStampProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const formattedDate = useMemo(() => {
    if (!mounted) {
      // Return a consistent placeholder during SSR to avoid mismatch
      return date;
    }

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

    // Fallback to a standard date format
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }, [date, relative, mounted]);

  return <span title={date}>{formattedDate}</span>;
}
