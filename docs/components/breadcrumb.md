# Breadcrumb

A navigation component that indicates the current page's location within a hierarchical structure.

## Usage

Use the `Breadcrumb` component to help users understand their location within the application and navigate back to previous pages. It is composed of `BreadcrumbList`, `BreadcrumbItem`, `BreadcrumbLink`, `BreadcrumbPage`, `BreadcrumbSeparator`, and `BreadcrumbEllipsis`.

```jsx
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbEllipsis,
} from '@/components/ui/breadcrumb';
import Link from 'next/link'; // Assuming Next.js Link component

function MyBreadcrumbExample() {
  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link href="/">Home</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link href="/components">Components</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>Breadcrumb</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}

function MyBreadcrumbWithEllipsis() {
  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link href="/">Home</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbEllipsis />
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link href="/docs/primitives/accordion">Accordion</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>Breadcrumb</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}
```

## Sub-components and Props

- **`Breadcrumb`**: The root navigation container. Extends `React.ComponentPropsWithoutRef<'nav'>`.
  - `separator`: `React.ReactNode` - Custom separator to use between items. Defaults to a `ChevronRight` icon.
- **`BreadcrumbList`**: An ordered list (`<ol>`) that contains the breadcrumb items. Extends `React.ComponentPropsWithoutRef<'ol'>`.
- **`BreadcrumbItem`**: An individual list item (`<li>`) within the breadcrumb. Extends `React.ComponentPropsWithoutRef<'li'>`.
- **`BreadcrumbLink`**: A link within the breadcrumb. Renders as an `<a>` tag by default, but can be composed with other components using `asChild`. Extends `React.ComponentPropsWithoutRef<'a'>`.
  - `asChild`: `boolean` - If true, the link will be rendered as a child of the element passed to it.
  - `as`: `React.ElementType` - The component to render as.
- **`BreadcrumbPage`**: Represents the current active page in the breadcrumb. Renders as a `<span>` element. Extends `React.ComponentPropsWithoutRef<'span'>`.
- **`BreadcrumbSeparator`**: The visual separator between breadcrumb items. Renders as a `<span>` element. Extends `React.ComponentProps<'li'>`. Defaults to a `ChevronRight` icon.
- **`BreadcrumbEllipsis`**: Represents truncated breadcrumb items, typically used when there are too many items to display. Renders as a `<span>` element. Extends `React.ComponentProps<'span'>`. Displays a `MoreHorizontal` icon.
