# Button

A customizable button component with support for different variants, sizes, and rendering as a child element.

## Variants

The `Button` component supports the following visual variants:

- `default`: The primary button style.
- `destructive`: Indicates a destructive action.
- `outline`: A button with a border, suitable for secondary actions.
- `secondary`: An alternative button style.
- `ghost`: A minimal button style without a background or border.
- `link`: Renders the button as a link.

## Sizes

The `Button` component supports the following sizes:

- `default`: Standard size.
- `sm`: Small size.
- `lg`: Large size.
- `icon`: Square size suitable for icons.

## Usage

Use the `Button` component for interactive elements that trigger an action. Choose the appropriate `variant` and `size` based on the context and importance of the action.

```jsx
import { Button } from '@/components/ui/button';

function MyComponent() {
  return (
    <div className="flex space-x-4">
      <Button>Default Button</Button>
      <Button variant="secondary">Secondary Button</Button>
      <Button variant="outline">Outline Button</Button>
      <Button variant="destructive">Destructive Button</Button>
      <Button variant="ghost">Ghost Button</Button>
      <Button variant="link">Link Button</Button>
      <Button size="sm">Small Button</Button>
      <Button size="lg">Large Button</Button>
      <Button size="icon">
        <span>Icon</span>
      </Button>{' '}
      {/* Replace with actual icon */}
    </div>
  );
}
```

## Props

Extends standard HTML button attributes and `VariantProps<typeof buttonVariants>`.

- `variant`: `default` | `destructive` | `outline` | `secondary` | `ghost` | `link` (default: `default`)
- `size`: `default` | `sm` | `lg` | `icon` (default: `default`)
- `asChild`: `boolean` (default: `false`) - If true, renders as a child of the element passed to it.
