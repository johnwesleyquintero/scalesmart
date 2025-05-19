# Utility Functions Documentation (`src/lib/utils.ts`)

## generateSlug

The `generateSlug` function generates a slug from a given title.

### Function Signature

```typescript
function generateSlug(title: string): string
```

### Parameters

-   `title`: The title to generate the slug from.

### Return Value

A slug generated from the title.

### Example

```typescript
import { generateSlug } from "@/lib/utils";

const title = "My Awesome Course";
const slug = generateSlug(title);
console.log(slug); // Output: my-awesome-course
