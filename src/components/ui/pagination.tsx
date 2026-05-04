import * as React from 'react';
import ReactPaginate from 'react-paginate';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ButtonProps, buttonVariants } from '@/components/ui/button';

interface HubspotPaginationProps {
  pageCount: number;
  onPageChange: (selectedItem: { selected: number }) => void;
  currentPage: number;
}

const HubspotPagination: React.FC<HubspotPaginationProps> = ({
  pageCount,
  onPageChange,
  currentPage,
}) => {
  return (
    <ReactPaginate
      previousLabel={
        <PaginationLink
          aria-label="Go to previous page"
          size="default"
          className={cn('gap-1 pl-2.5')}
        >
          <ChevronLeft className="h-4 w-4" />
          <span>Previous</span>
        </PaginationLink>
      }
      nextLabel={
        <PaginationLink
          aria-label="Go to next page"
          size="default"
          className={cn('gap-1 pr-2.5')}
        >
          <span>Next</span>
          <ChevronRight className="h-4 w-4" />
        </PaginationLink>
      }
      breakLabel={
        <PaginationEllipsis>
          <MoreHorizontal className="h-4 w-4" />
        </PaginationEllipsis>
      }
      pageCount={pageCount}
      marginPagesDisplayed={2}
      pageRangeDisplayed={5}
      onPageChange={onPageChange}
      containerClassName="flex justify-center list-none p-0 mt-6"
      pageClassName="mx-1"
      pageLinkClassName={
        cn(
          buttonVariants({
            variant: 'ghost',
            size: 'icon',
          }),
          'block p-2 rounded-md text-foreground bg-background border border-border cursor-pointer transition-all duration-200 ease-in-out'
        )
      }
      activeLinkClassName={cn('hubspot-pagination__link--active bg-primary text-primary-foreground border-primary hover:bg-primary/90')}
      previousLinkClassName={cn(
        buttonVariants({
          variant: 'ghost',
          size: 'default',
        }),
        'block p-2 pl-4 rounded-md text-foreground bg-background border border-border cursor-pointer transition-all duration-200 ease-in-out gap-1 pr-2.5'
      )}
      nextLinkClassName={cn(
        buttonVariants({
          variant: 'ghost',
          size: 'default',
        }),
        'block p-2 pr-4 rounded-md text-foreground bg-background border border-border cursor-pointer transition-all duration-200 ease-in-out gap-1 pl-2.5'
      )}
      disabledClassName={cn('hubspot-pagination__link--disabled opacity-50 cursor-not-allowed pointer-events-none')}
      forcePage={currentPage}
    />
  );
};

const Pagination = ({ className, ...props }: React.ComponentProps<'nav'>) => (
  <nav
    role="navigation"
    aria-label="pagination"
    className={cn('mx-auto flex w-full justify-center', className)}
    {...props}
  />
);
Pagination.displayName = 'Pagination';

const PaginationContent = React.forwardRef<
  HTMLUListElement,
  React.ComponentProps<'ul'>
>(({ className, ...props }, ref) => (
  <ul
    ref={ref}
    className={cn('flex flex-row items-center gap-1', className)}
    {...props}
  />
));
PaginationContent.displayName = 'PaginationContent';

const PaginationItem = React.forwardRef<
  HTMLLIElement,
  React.ComponentProps<'li'>
>(({ className, ...props }, ref) => (
  <li ref={ref} className={cn('', className)} {...props} />
));
PaginationItem.displayName = 'PaginationItem';

type PaginationLinkProps = {
  isActive?: boolean;
} & Pick<ButtonProps, 'size'> &
  React.ComponentProps<'a'>;

const PaginationLink = ({
  className,
  isActive,
  size = 'icon',
  ...props
}: PaginationLinkProps) => (
  <a
    aria-current={isActive ? 'page' : undefined}
    className={cn(
      buttonVariants({
        variant: isActive ? 'outline' : 'ghost',
        size,
      }),
      className,
    )}
    {...props}
  />
);
PaginationLink.displayName = 'PaginationLink';

const PaginationPrevious = ({
  className,
  ...props
}: React.ComponentProps<typeof PaginationLink>) => (
  <PaginationLink
    aria-label="Go to previous page"
    size="default"
    className={cn('gap-1 pl-2.5', className)}
    {...props}
  >
    <ChevronLeft className="h-4 w-4" />
    <span>Previous</span>
  </PaginationLink>
);
PaginationPrevious.displayName = 'PaginationPrevious';

const PaginationNext = ({
  className,
  ...props
}: React.ComponentProps<typeof PaginationLink>) => (
  <PaginationLink
    aria-label="Go to next page"
    size="default"
    className={cn('gap-1 pr-2.5', className)}
    {...props}
  >
    <span>Next</span>
    <ChevronRight className="h-4 w-4" />
  </PaginationLink>
);
PaginationNext.displayName = 'PaginationNext';

const PaginationEllipsis = ({
  className,
  ...props
}: React.ComponentProps<'span'>) => (
  <span
    aria-hidden
    className={cn('flex h-9 w-9 items-center justify-center', className)}
    {...props}
  >
    <MoreHorizontal className="h-4 w-4" />
    <span className="sr-only">More pages</span>
  </span>
);
PaginationEllipsis.displayName = 'PaginationEllipsis';

export {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  HubspotPagination,
};
