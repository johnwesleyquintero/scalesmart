# Input

A customizable input component that extends standard HTML input attributes.

## Usage

Use the `Input` component for collecting text, numerical, or other data from the user.

```jsx
import { Input } from '@/components/ui/input';

function MyFormComponent() {
  return (
    <div className="grid w-full max-w-sm items-center gap-1.5">
      <Label htmlFor="email">Email</Label>
      <Input type="email" id="email" placeholder="Email" />
    </div>
  );
}
```

## Props

Extends standard HTML `<input>` attributes.

- `className`: `string` - Additional CSS classes to apply to the input element.
- `type`: `string` - The type of input (e.g., `text`, `email`, `password`, `number`).
- `value`: `string | number` - The value of the input.
- `onChange`: `(e: React.ChangeEvent<HTMLInputElement>) => void` - Callback function triggered when the input value changes.
- `min`: `string | number` - The minimum value for number or date input types.
- `step`: `string | number` - The step interval for number or range input types.
- `name`: `string` - The name of the input element.
- `placeholder`: `string` - The placeholder text displayed when the input is empty.
- `required`: `boolean` - Specifies whether the input field is required.
- `disabled`: `boolean` - Specifies whether the input field is disabled.
- `{...props}`: Any other standard HTML input attributes.
