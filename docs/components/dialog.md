# Dialog

A dialog is a window overlaid on primary content to ask for user confirmation or briefly interrupt the user with essential tasks.

## Usage

Use the `Dialog` component to display modal content that requires user interaction or attention. It is composed of several sub-components: `DialogTrigger`, `DialogContent`, `DialogHeader`, `DialogFooter`, `DialogTitle`, `DialogDescription`, `DialogOverlay`, and `DialogClose`.

```jsx
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button'; // Assuming Button component is available
import { Input } from '@/components/ui/input'; // Assuming Input component is available
import { Label } from '@/components/ui/label'; // Assuming Label component is available

function MyDialogExample() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">Edit Profile</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit profile</DialogTitle>
          <DialogDescription>
            Make changes to your profile here. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Name
            </Label>
            <Input id="name" value="Pedro Duarte" className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="username" className="text-right">
              Username
            </Label>
            <Input id="username" value="@peduarte" className="col-span-3" />
          </div>
        </div>
        <DialogFooter>
          <Button type="submit">Save changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

## Sub-components and Props

- **`Dialog`**: The root dialog container. Extends `DialogPrimitive.Root`.
- **`DialogTrigger`**: The element that opens the dialog. Extends `DialogPrimitive.Trigger`. Use `asChild` to compose with other components.
- **`DialogContent`**: The container for the dialog's content. Extends `DialogPrimitive.Content`. Includes the overlay and a close button by default.
  - `className`: `string` - Additional CSS classes.
  - `children`: `React.ReactNode` - The content of the dialog.
- **`DialogHeader`**: A container for the dialog title and description. Extends `React.HTMLAttributes<HTMLDivElement>`.
- **`DialogFooter`**: A container for dialog actions (e.g., buttons). Extends `React.HTMLAttributes<HTMLDivElement>`.
- **`DialogTitle`**: The title of the dialog. Extends `DialogPrimitive.Title`.
- **`DialogDescription`**: The description or explanatory text for the dialog. Extends `DialogPrimitive.Description`.
- **`DialogOverlay`**: The overlay that appears behind the dialog. Extends `DialogPrimitive.Overlay`.
- **`DialogClose`**: A button to close the dialog. Extends `DialogPrimitive.Close`.
