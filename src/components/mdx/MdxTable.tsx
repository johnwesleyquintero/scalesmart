import React from 'react';
import { cn } from '@/lib/utils';

/**
 * Shared responsive <table> wrapper used by every MDX renderer.
 *
 * Solves:
 *  1. Horizontal scroll overflow on narrow viewports (tables almost always
 *     overflow sideways, not vertically — fixes the old `overflow-y-auto` typo).
 *  2. Faded right-gradient + scroll hint so users know there's more content.
 *  3. Consistent visual styling (borders, zebra rows, padding, typography)
 *     across every MDX surface instead of 6 divergent implementations.
 *  4. `whitespace-nowrap` on `<th>` keeps headers readable even when the
 *     container forces a scroll.
 */
export const MdxTable = ({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLTableElement>) => (
  <div className="my-6 w-full">
    <div className="group relative w-full overflow-x-auto rounded-xl border border-border/60 bg-card shadow-sm">
      {/* Right-side fade to signal more content horizontally */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-card via-card/70 to-transparent opacity-0 transition-opacity group-hover:opacity-100"
      />
      <table
        className={cn(
          'w-full min-w-[520px] border-collapse text-xs sm:text-sm',
          className,
        )}
        {...props}
      >
        {children}
      </table>
    </div>
    {/* Scroll hint (visible only when actual overflow exists — JS-free approximation via small screens) */}
    <div className="mt-1.5 flex items-center justify-end text-[10px] uppercase tracking-wider font-semibold text-muted-foreground/70 sm:hidden">
      Scroll right &rarr;
    </div>
  </div>
);

export const MdxThead = ({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLTableSectionElement>) => (
  <thead className={cn('bg-muted/60', className)} {...props}>
    {children}
  </thead>
);

export const MdxTh = ({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLTableCellElement>) => (
  <th
    className={cn(
      'px-4 py-3 text-left text-[11px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground border-b border-border/60 whitespace-nowrap',
      className,
    )}
    {...props}
  >
    {children}
  </th>
);

export const MdxTd = ({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLTableCellElement>) => (
  <td
    className={cn(
      'px-4 py-3 text-left align-top text-foreground/85 border-b border-border/40 last:border-0 leading-relaxed break-words',
      className,
    )}
    {...props}
  >
    {children}
  </td>
);

export const MdxTr = ({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLTableRowElement>) => (
  <tr
    className={cn(
      'even:bg-muted/30 hover:bg-muted/50 transition-colors',
      className,
    )}
    {...props}
  >
    {children}
  </tr>
);

/**
 * Full MDX table-component bundle — drop into the `components` prop
 * of any MDXRemote call as a spread: `...mdxTableComponents`.
 */
export const mdxTableComponents = {
  table: MdxTable,
  thead: MdxThead,
  th: MdxTh,
  td: MdxTd,
  tr: MdxTr,
};
