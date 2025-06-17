# Badge

A small, inline component used to display a short amount of information, often for categorization or status.

## Usage

Use the `Badge` component to highlight status, categorize items, or display counts.

```jsx
import { Badge } from '@/components/ui/badge';

function MyBadgeExample() {
  return (
    <div className="flex space-x-2">
      <Badge>Default</Badge>
      <Badge variant="secondary">Secondary</Badge>
      <Badge variant="destructive">Destructive</Badge>
      <Badge variant="outline">Outline</Badge>
    </div>
  );
}
```

## Variants

The `Badge` component supports the following visual variants:

- `default`: The standard badge style.
- `secondary`: An alternative badge style.
- `destructive`: Indicates a destructive or alert state.
- `outline`: A badge with a border, suitable for less prominent information.

## Props

Extends standard HTML `<div>` attributes and `VariantProps<typeof badgeVariants>`.

- `className`: `string` - Additional CSS classes to apply to the badge element.
- `variant`: `default` | `secondary` | `destructive` | `outline` (default: `default`)
- `{...props}`: Any other standard HTML div attributes.
