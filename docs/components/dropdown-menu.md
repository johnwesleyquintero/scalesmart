# Dropdown Menu

A context menu or dropdown menu for displaying a list of links or actions.

## Usage

Use the `DropdownMenu` component to provide users with a list of options or actions in a dropdown. It is composed of several sub-components: `DropdownMenuTrigger`, `DropdownMenuContent`, `DropdownMenuItem`, `DropdownMenuCheckboxItem`, `DropdownMenuRadioItem`, `DropdownMenuLabel`, `DropdownMenuSeparator`, `DropdownMenuShortcut`, `DropdownMenuGroup`, `DropdownMenuPortal`, `DropdownMenuSub`, `DropdownMenuSubTrigger`, and `DropdownMenuSubContent`, and `DropdownMenuRadioGroup`.

```jsx
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuGroup,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button'; // Assuming Button component is available

function MyDropdownMenuExample() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">Open</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        <DropdownMenuLabel>My Account</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem>
            Profile
            <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem>
            Billing
            <DropdownMenuShortcut>⌘B</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem>
            Settings
            <DropdownMenuShortcut>⌘S</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem>
            Keyboard shortcuts
            <DropdownMenuShortcut>⌘K</DropdownMenuShortcut>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem>Team</DropdownMenuItem>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>Invite users</DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent>
                <DropdownMenuItem>Email</DropdownMenuItem>
                <DropdownMenuItem>Message</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>More...</DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>
          <DropdownMenuItem>New Team</DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem>GitHub</DropdownMenuItem>
        <DropdownMenuItem>Support</DropdownMenuItem>
        <DropdownMenuItem disabled>API</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          Log out
          <DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

## Sub-components and Props

- **`DropdownMenu`**: The root dropdown menu container. Extends `DropdownMenuPrimitive.Root`.
- **`DropdownMenuTrigger`**: The element that opens the dropdown menu. Extends `DropdownMenuPrimitive.Trigger`. Use `asChild` to compose with other components.
- **`DropdownMenuContent`**: The container for the dropdown menu's content. Extends `DropdownMenuPrimitive.Content`.
  - `className`: `string` - Additional CSS classes.
  - `sideOffset`: `number` (default: 4) - The distance between the trigger and the content.
- **`DropdownMenuItem`**: An interactive item within the dropdown menu. Extends `DropdownMenuPrimitive.Item`.
  - `className`: `string` - Additional CSS classes.
  - `inset`: `boolean` - Adds left padding for alignment.
- **`DropdownMenuCheckboxItem`**: A dropdown menu item with a checkbox. Extends `DropdownMenuPrimitive.CheckboxItem`.
  - `className`: `string` - Additional CSS classes.
  - `checked`: `boolean | 'indeterminate'` - The checked state.
- **`DropdownMenuRadioItem`**: A dropdown menu item with a radio button. Extends `DropdownMenuPrimitive.RadioItem`.
  - `className`: `string` - Additional CSS classes.
  - `value`: `string` - The value of the radio item.
- **`DropdownMenuLabel`**: A non-interactive label within the dropdown menu. Extends `DropdownMenuPrimitive.Label`.
  - `className`: `string` - Additional CSS classes.
  - `inset`: `boolean` - Adds left padding for alignment.
- **`DropdownMenuSeparator`**: A horizontal line to separate groups of items. Extends `DropdownMenuPrimitive.Separator`.
  - `className`: `string` - Additional CSS classes.
- **`DropdownMenuShortcut`**: A small text element to display keyboard shortcuts. Extends `React.HTMLAttributes<HTMLSpanElement>`.
  - `className`: `string` - Additional CSS classes.
- **`DropdownMenuGroup`**: A container for grouping related menu items. Extends `DropdownMenuPrimitive.Group`.
- **`DropdownMenuPortal`**: Renders the dropdown menu content outside of the trigger's DOM tree. Extends `DropdownMenuPrimitive.Portal`.
- **`DropdownMenuSub`**: A container for nested dropdown menus. Extends `DropdownMenuPrimitive.Sub`.
- **`DropdownMenuSubTrigger`**: The element that opens a nested dropdown menu. Extends `DropdownMenuPrimitive.SubTrigger`.
  - `className`: `string` - Additional CSS classes.
  - `inset`: `boolean` - Adds left padding for alignment.
- **`DropdownMenuSubContent`**: The container for a nested dropdown menu's content. Extends `DropdownMenuPrimitive.SubContent`.
  - `className`: `string` - Additional CSS classes.
- **`DropdownMenuRadioGroup`**: A container for grouping radio items. Extends `DropdownMenuPrimitive.RadioGroup`.
