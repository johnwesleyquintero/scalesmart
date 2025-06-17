# Accordion

A vertically stacked set of interactive headings that each reveal a section of content.

## Usage

Use the `Accordion` component to display collapsible content sections. It is composed of `AccordionItem`, `AccordionTrigger`, and `AccordionContent`.

```jsx
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion';

function MyAccordionExample() {
  return (
    <Accordion type="single" collapsible className="w-full">
      <AccordionItem value="item-1">
        <AccordionTrigger>Is it accessible?</AccordionTrigger>
        <AccordionContent>
          Yes. It adheres to the WAI-ARIA design pattern.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-2">
        <AccordionTrigger>Is it styled?</AccordionTrigger>
        <AccordionContent>
          Yes. It comes with default styles that match the design system.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-3">
        <AccordionTrigger>Is it animated?</AccordionTrigger>
        <AccordionContent>
          Yes. It's animated by default, but you can disable it if you prefer.
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
```

## Sub-components and Props

- **`Accordion`**: The root accordion container. Extends `AccordionPrimitive.Root`.
  - `type`: `"single"` | `"multiple"` (required) - Determines whether one or multiple items can be open at a time.
  - `collapsible`: `boolean` - When type is "single", allows the open item to be collapsed.
  - `value`: `string` - The value of the open item (for type "single").
  - `defaultValue`: `string` - The value of the item that should be open by default (for type "single").
  - `onValueChange`: `(value: string) => void` - Callback function when the open item changes (for type "single").
  - `{...props}`: Other `AccordionPrimitive.Root` props.
- **`AccordionItem`**: A container for an individual accordion item. Extends `AccordionPrimitive.Item`.
  - `value`: `string` (required) - A unique value for the item.
  - `className`: `string` - Additional CSS classes.
  - `{...props}`: Other `AccordionPrimitive.Item` props.
- **`AccordionTrigger`**: The interactive heading that toggles the visibility of the content. Extends `AccordionPrimitive.Trigger`.
  - `className`: `string` - Additional CSS classes.
  - `children`: `React.ReactNode` - The content of the trigger (e.g., the question or title).
  - `{...props}`: Other `AccordionPrimitive.Trigger` props.
- **`AccordionContent`**: The collapsible content section. Extends `AccordionPrimitive.Content`.
  - `className`: `string` - Additional CSS classes.
  - `children`: `React.ReactNode` - The content to be displayed when the item is open.
  - `{...props}`: Other `AccordionPrimitive.Content` props.

## Notes

- This component is built on top of Radix UI's Accordion primitive, providing built-in accessibility features.
- The animation for opening and closing is handled by CSS classes and keyframes defined in the global styles.
