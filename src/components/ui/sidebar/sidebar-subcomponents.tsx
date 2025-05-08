'use client';

import React from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

// interface SidebarComponentProps extends React.HTMLAttributes<HTMLElement> {
//   className?: string;
// }



// type SidebarComponentType = React.ElementType;

const createSidebarComponent = <T extends React.ElementType, P extends object = {}>( // Added P for props
  name: string,
  Component: T,
  defaultClassName: string,
) => {
  const ForwardRefComponent = React.forwardRef<
    T,
    React.ComponentProps<T> & P & { className?: string }
  >((props, ref) => {
    const { className, ...rest } = props;
    const combinedClassName = cn(defaultClassName, className);

    return (
      <Component
        ref={ref}
        className={combinedClassName}
        {...rest}
      />
    );
  });

  ForwardRefComponent.displayName = name;
  return ForwardRefComponent;
};

const SidebarTrigger = createSidebarComponent(
  // Button that toggles the sidebar
  'SidebarTrigger',
  Button,
  'h-7 w-7',
);

const SidebarRail = createSidebarComponent(
  // Rail that appears on the side of the sidebar
  'SidebarRail',
  'button',
  'absolute inset-y-0 z-20 hidden w-4 -translate-x-1/2 transition-all ease-linear after:absolute after:inset-y-0 after:left-1/2 after:w-[2px] hover:after:bg-sidebar-border group-data-[side=left]:-right-4 group-data-[side=right]:left-0 sm:flex',
);

const SidebarInset = createSidebarComponent(
  // Container for the sidebar content
  'SidebarInset',
  'main',
  'relative flex min-h-svh flex-1 flex-col bg-background peer-data-[variant=inset]:min-h-[calc(100svh-theme(spacing.4))] md:peer-data-[variant=inset]:m-2 md:peer-data-[state=collapsed]:peer-data-[variant=inset]:ml-2 md:peer-data-[variant=inset]:ml-0 md:peer-data-[variant=inset]:rounded-xl md:peer-data-[variant=inset]:shadow',
);

const SidebarInput = createSidebarComponent(
  // Input field for the sidebar
  'SidebarInput',
  Input,
  'h-8 w-full bg-background shadow-none focus-visible:ring-2 focus-visible:ring-sidebar-ring',
);

const SidebarHeader = createSidebarComponent(
  // Header for the sidebar
  'SidebarHeader',
  'div',
  'flex flex-col gap-2 p-2',
);

const SidebarFooter = createSidebarComponent(
  // Footer for the sidebar
  'SidebarFooter',
  'div',
  'flex flex-col gap-2 p-2',
);

const SidebarSeparator = createSidebarComponent(
  // Separator for the sidebar
  'SidebarSeparator',
  Separator,
  'mx-2 w-auto bg-sidebar-border',
);

const SidebarContent = createSidebarComponent(
  // Container for the sidebar content
  'SidebarContent',
  'div',
  'flex min-h-0 flex-1 flex-col gap-2 overflow-auto group-data-[collapsible=icon]:overflow-hidden',
);

const SidebarGroup = createSidebarComponent(
  // Group of related sidebar items
  'SidebarGroup',
  'div',
  'relative flex w-full min-w-0 flex-col p-2',
);

const SidebarGroupLabel = createSidebarComponent(
  // Label for a sidebar group
  'SidebarGroupLabel',
  'div',
  'duration-200 flex h-8 shrink-0 items-center rounded-md px-2 text-xs font-medium text-sidebar-foreground/70 outline-none ring-sidebar-ring transition-[margin,opa] ease-linear focus-visible:ring-2 [>svg]:size-4 [>svg]:shrink-0 group-data-[collapsible=icon]:-mt-8 group-data-[collapsible=icon]:opacity-0',
);

const SidebarGroupAction = createSidebarComponent(
  // Action for a sidebar group
  'SidebarGroupAction',
  'button',
  'absolute right-3 top-3.5 flex aspect-square w-5 items-center justify-center rounded-md p-0 text-sidebar-foreground outline-none ring-sidebar-ring transition-transform hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 [>svg]:size-4 [>svg]:shrink-0 after:absolute after:-inset-2 after:md:hidden group-data-[collapsible=icon]:hidden',
);

const SidebarGroupContent = createSidebarComponent(
  // Content for a sidebar group
  'SidebarGroupContent',
  'div',
  'w-full text-sm',
);

export {
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInput,
  SidebarInset,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
};
