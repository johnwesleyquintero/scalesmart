# Alert

A component used to display important messages (e.g., warnings, errors, information) to the user.

## Usage

Use the `Alert` component to provide contextual feedback or draw attention to specific information. It can be used with `AlertTitle` and `AlertDescription` for structured content.

```jsx
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal } from 'lucide-react'; // Example icon

function MyAlertExample() {
  return (
    <Alert>
      <Terminal className="h-4 w-4" />
      <AlertTitle>Heads up!</AlertTitle>
      <AlertDescription>
        You can add components to your app using the cli.
      </AlertDescription>
    </Alert>
  );
}

function MyDestructiveAlertExample() {
  return (
    <Alert variant="destructive">
      <Terminal className="h-4 w-4" />
      <AlertTitle>Error!</AlertTitle>
      <AlertDescription>
        Something went wrong with your request.
      </AlertDescription>
    </Alert>
  );
}
```

## Variants

The `Alert` component supports the following visual variants:

- `default`: The standard alert style.
- `destructive`: Indicates a destructive or error state.

## Sub-components and Props

- **`Alert`**: The main alert container. Extends `React.HTMLAttributes<HTMLDivElement>` and `VariantProps<typeof alertVariants>`.
  - `className`: `string` - Additional CSS classes.
  - `variant`: `default` | `destructive` (default: `default`) - The visual style of the alert.
  - `{...props}`: Other standard HTML div attributes.
- **`AlertTitle`**: The title of the alert. Renders as an `<h5>` element. Extends `React.HTMLAttributes<HTMLHeadingElement>`.
  - `className`: `string` - Additional CSS classes.
- **`AlertDescription`**: The description or main content of the alert. Renders as a `<div>` element. Extends `React.HTMLAttributes<HTMLParagraphElement>`.
  - `className`: `string` - Additional CSS classes.

## Notes

- Icons can be included within the `Alert` component alongside the title and description.
- The styling is managed using `class-variance-authority` (`cva`) and Tailwind CSS classes.
