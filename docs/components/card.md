# Card

A flexible container used to group and display content in a structured format.

## Usage

Use the `Card` component to present information in distinct blocks. It is typically used with its sub-components: `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, and `CardFooter`.

```jsx
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button'; // Assuming Button component is available

function MyCardExample() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Card Title</CardTitle>
        <CardDescription>Card Description</CardDescription>
      </CardHeader>
      <CardContent>
        <p>Card Content</p>
      </CardContent>
      <CardFooter>
        <Button>Card Button</Button>
      </CardFooter>
    </Card>
  );
}
```

## Sub-components and Props

- **`Card`**: The main card container. Extends `React.HTMLAttributes<HTMLDivElement>`.
  - `className`: `string` - Additional CSS classes.
- **`CardHeader`**: A container for the card's header content, typically including the title and description. Extends `React.HTMLAttributes<HTMLDivElement>`.
  - `className`: `string` - Additional CSS classes.
- **`CardTitle`**: The title of the card. Renders as an `<h2>` element. Extends `React.HTMLAttributes<HTMLHeadingElement>`.
  - `className`: `string` - Additional CSS classes.
- **`CardDescription`**: A description or subtitle for the card. Renders as a `<p>` element. Extends `React.HTMLAttributes<HTMLParagraphElement>`.
  - `className`: `string` - Additional CSS classes.
- **`CardContent`**: The main content area of the card. Extends `React.HTMLAttributes<HTMLDivElement>`.
  - `className`: `string` - Additional CSS classes.
- **`CardFooter`**: A container for the card's footer content, often used for actions like buttons. Extends `React.HTMLAttributes<HTMLDivElement>`.
  - `className`: `string` - Additional CSS classes.
