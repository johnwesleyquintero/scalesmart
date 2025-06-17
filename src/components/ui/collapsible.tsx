'use client';

import * as CollapsiblePrimitive from '@radix-ui/react-collapsible';

/**
 * A component that allows content to be hidden or shown with a toggle.
 * Built using Radix UI Collapsible.
 * @see https://www.radix-ui.com/primitives/docs/components/collapsible
 */
const Collapsible = CollapsiblePrimitive.Root;

/**
 * The trigger button for the Collapsible.
 */
const CollapsibleTrigger = CollapsiblePrimitive.CollapsibleTrigger;

/**
 * The collapsible content area.
 */
const CollapsibleContent = CollapsiblePrimitive.CollapsibleContent;

export { Collapsible, CollapsibleTrigger, CollapsibleContent };
