# Label

A component used to render a label for form elements, enhancing accessibility and usability.

## Usage

Use the `Label` component to associate a text label with form controls like `Input`, `Checkbox`, or `Radio Group`. Use the `htmlFor` prop to link the label to the corresponding input element's `id`.

```jsx
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input'; // Assuming Input component is available

function MyFormInputWithLabel() {
  return (
    <div className="grid w-full max-w-sm items-center gap-1.5">
      <Label htmlFor="username">Username</Label>
      <Input type="text" id="username" placeholder="Enter your username" />
    </div>
  );
}
```

## Props

Extends standard HTML `<label>` attributes.

- `className`: `string` - Additional CSS classes to apply to the label element.
- `htmlFor`: `string` - The ID of the form element the label is associated with.
- `{...props}`: Any other standard HTML label attributes.
