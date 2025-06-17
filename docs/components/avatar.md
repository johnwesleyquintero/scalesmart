# Avatar

A component used to display a user's profile picture, initials, or a generic fallback icon.

## Usage

Use the `Avatar` component to represent users or entities visually. It is composed of `AvatarImage` for displaying an image and `AvatarFallback` for displaying a placeholder when the image fails to load or is not available.

```jsx
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

function MyAvatarExample() {
  return (
    <Avatar>
      <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
      <AvatarFallback>CN</AvatarFallback>
    </Avatar>
  );
}

function MyAvatarWithFallback() {
  return (
    <Avatar>
      <AvatarImage src="/broken-image.jpg" alt="User Avatar" />
      <AvatarFallback>JD</AvatarFallback> {/* Fallback to initials */}
    </Avatar>
  );
}
```

## Sub-components and Props

- **`Avatar`**: The root avatar container. Extends `React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>`.
  - `className`: `string` - Additional CSS classes.
  - `{...props}`: Other `AvatarPrimitive.Root` props.
- **`AvatarImage`**: Displays the avatar image. Extends `React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image>`.
  - `src`: `string` - The image source URL.
  - `alt`: `string` (required) - Alternative text for the image.
  - `className`: `string` - Additional CSS classes.
  - `{...props}`: Other `AvatarPrimitive.Image` props.
- **`AvatarFallback`**: Displays a fallback when the image fails to load. Extends `React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>`.
  - `className`: `string` - Additional CSS classes.
  - `{...props}`: Other `AvatarPrimitive.Fallback` props. Typically contains initials or an icon.

## Notes

- This component is built on top of Radix UI's Avatar primitive, providing built-in accessibility features.
- Ensure you provide meaningful `alt` text for the `AvatarImage` for accessibility.
