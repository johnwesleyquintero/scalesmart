# Checkbox

A control that allows the user to toggle between checked and unchecked states.

## Usage

Use the `Checkbox` component to allow users to select one or more options from a set. It can be used alone or with a corresponding `Label`.

```jsx
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label'; // Assuming Label component is available

function MyCheckboxForm() {
  return (
    <div className="flex items-center space-x-2">
      <Checkbox id="terms" />
      <Label
        htmlFor="terms"
        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
      >
        Accept terms and conditions
      </Label>
    </div>
  );
}
```

## Props

Extends `React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>`. Common props include:

- `className`: `string` - Additional CSS classes to apply to the checkbox root element.
- `checked`: `boolean | 'indeterminate'` - The checked state of the checkbox.
- `onCheckedChange`: `(checked: boolean | 'indeterminate') => void` - Callback function triggered when the checked state changes.
- `disabled`: `boolean` - Specifies whether the checkbox is disabled.
- `{...props}`: Any other standard HTML input (checkbox) attributes or Radix Checkbox Primitive props.
