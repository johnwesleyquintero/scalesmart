# Alert Dialog

A modal dialog that interrupts the user with important content and expects a response.

## Usage

Use the `AlertDialog` component to display critical alerts or require user confirmation before proceeding with an action. It is composed of several sub-components: `AlertDialogTrigger`, `AlertDialogContent`, `AlertDialogHeader`, `AlertDialogFooter`, `AlertDialogTitle`, `AlertDialogDescription`, `AlertDialogOverlay`, `AlertDialogAction`, and `AlertDialogCancel`.

```jsx
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button'; // Assuming Button component is available

function MyAlertDialogExample() {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive">Show Alert Dialog</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete your
            account and remove your data from our servers.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction>Continue</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
```

## Sub-components and Props

- **`AlertDialog`**: The root alert dialog container. Extends `AlertDialogPrimitive.Root`.
- **`AlertDialogTrigger`**: The element that opens the alert dialog. Extends `AlertDialogPrimitive.Trigger`. Use `asChild` to compose with other components.
- **`AlertDialogContent`**: The container for the alert dialog's content. Extends `AlertDialogPrimitive.Content`. Includes the overlay by default.
  - `className`: `string` - Additional CSS classes.
  - `{...props}`: Other `AlertDialogPrimitive.Content` props.
- **`AlertDialogHeader`**: A container for the alert dialog title and description. Extends `React.HTMLAttributes<HTMLDivElement>`.
  - `className`: `string` - Additional CSS classes.
- **`AlertDialogFooter`**: A container for alert dialog actions (e.g., confirmation and cancel buttons). Extends `React.HTMLAttributes<HTMLDivElement>`.
  - `className`: `string` - Additional CSS classes.
- **`AlertDialogTitle`**: The title of the alert dialog. Extends `AlertDialogPrimitive.Title`.
  - `className`: `string` - Additional CSS classes.
- **`AlertDialogDescription`**: The description or explanatory text for the alert dialog. Extends `AlertDialogPrimitive.Description`.
  - `className`: `string` - Additional CSS classes.
- **`AlertDialogOverlay`**: The overlay that appears behind the alert dialog. Extends `AlertDialogPrimitive.Overlay`.
  - `className`: `string` - Additional CSS classes.
- **`AlertDialogAction`**: A button that performs the primary action of the alert dialog. Extends `AlertDialogPrimitive.Action`. It is styled using `buttonVariants()`.
  - `className`: `string` - Additional CSS classes.
  - `{...props}`: Other `AlertDialogPrimitive.Action` props.
- **`AlertDialogCancel`**: A button that cancels the action and closes the alert dialog. Extends `AlertDialogPrimitive.Cancel`. It is styled using `buttonVariants({ variant: 'outline' })`.
  - `className`: `string` - Additional CSS classes.
  - `{...props}`: Other `AlertDialogPrimitive.Cancel` props.
- **`AlertDialogPortal`**: Renders the alert dialog content outside of the trigger's DOM tree. Extends `AlertDialogPrimitive.Portal`.

## Notes

- This component is built on top of Radix UI's Alert Dialog primitive, providing built-in accessibility features.
- The `AlertDialogAction` and `AlertDialogCancel` components utilize the `buttonVariants` from the Button component, ensuring consistency in button styling.
