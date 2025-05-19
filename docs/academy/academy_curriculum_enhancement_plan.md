# Academy Curriculum Enhancement Plan

## Goal

Integrate interactive elements into the MDX articles within the existing Academy page structure.

## Component Changes

- **`AcademyArticle`**: Modified to render interactive elements within the MDX content.
- **`AcademyContentClient`**: Verify prop handling and handle loading/error states.
- **`SchoolComponent`**: Modified to pass new fields to the `AcademyContentClient`.
- **`Card`**: Modified to display an indicator if a module contains interactive elements.
- **`Quiz.tsx`**: New component for quizzes.
- **`ExerciseModule.tsx`**: New component for exercises.
- **`MdxRenderer`**: Modified to recognize and render the new interactive components.

## Phase 1: Enhancements to `AcademyArticle` Component

- **Goal:** Modify the `AcademyArticle` component to render interactive elements within the MDX content.
- **Steps:**
  1.  **Integrate Interactive Components:**
      - Create new components for quizzes (`Quiz.tsx`) and exercises (`ExerciseModule.tsx`). These components will handle the logic and rendering of interactive elements.
      - Modify the `MdxRenderer` component to recognize and render these new components within the MDX content. This will likely involve adding these components to the `components` prop passed to `useMDXComponent`.
  2.  **Implement Quiz Functionality:**
      - The `Quiz.tsx` component will display a series of questions with multiple-choice answers.
      - Implement logic to track user responses, provide feedback, and calculate a score.
      - Store quiz results in IndexedDB using the `indexeddb-service.ts` hook to persist progress.
      - Use the existing UI components and styling for the interactive elements.
  3.  **Implement Exercise Functionality:**
      - The `ExerciseModule.tsx` component will present coding exercises or other practical tasks.
      - Provide a simple `textarea` for users to write code.
      - No testing framework will be implemented.
      - Use the existing UI components and styling for the interactive elements.
  4.  **Update `AcademyArticle`:**
      - Ensure `AcademyArticle` passes necessary props to the interactive components, such as the MDX content and any initial data.

## Phase 2: Enhancements to `AcademyContentClient` Component

- **Goal:** Ensure the `AcademyContentClient` correctly renders the enhanced `AcademyArticle` component.
- **Description:** The `AcademyContentClient` component receives courses, CourseList, filter, and sort as props. It uses the courses prop to display the list of courses and the CourseList component to render the list. It also uses the filter and sort props to filter and sort the courses. The component relies on the individual module components (ArticleModule, VideoModule, ExerciseModule, and CaseStudyModule) to handle their own loading and error states. If there's no content available for a module, it displays a message saying "No content available for this module."
- **Steps:**
  1.  **Verify Prop Handling:**
      - Confirm that the `AcademyContentClient` is correctly passing the necessary props to the child components.
  2.  **Loading and Error States:**
      - The component relies on the individual module components to handle their own loading and error states.

## Phase 3: Enhancements to `SchoolComponent` and `/api/academy-courses` Endpoint

- **Goal:** Update the course data to include information about interactive elements.
- **Steps:**
  1.  **Modify `/api/academy-courses` Endpoint:**
      - Update the `/api/academy-courses` endpoint to read the MDX files and pass the relevant data to the `SchoolComponent`.
  2.  **Update `SchoolComponent`:**
      - Modify the `SchoolComponent` to pass the data to the `AcademyContentClient`.
  3.  **Update `Card` Component:**
      - Modify the `Card` component to display an indicator if a module contains interactive elements.

## Phase 4: New Components

- **Goal:** Create new components for quizzes and exercises.
- **Steps:**
  1.  **Create `Quiz.tsx`:**
      - This component will display a series of questions with multiple-choice answers.
      - Implement logic to track user responses, provide feedback, and calculate a score.
      - Store quiz results in IndexedDB using the `indexeddb-service.ts` hook to persist progress.
      - Use the existing UI components and styling for the interactive elements.
  2.  **Create `ExerciseModule.tsx`:**
      - This component will present coding exercises or other practical tasks.
      - Provide a simple `textarea` for users to write code.
      - No testing framework will be implemented.
      - Use the existing UI components and styling for the interactive elements.

## Interactive Elements

- **Quizzes:** Multiple-choice questions with feedback and score tracking, using existing UI components and styling, and storing progress in IndexedDB.
- **Exercises:** Coding exercises with a simple `textarea` for code input, using existing UI components and styling.

## Mermaid Diagram

```mermaid
graph LR
    A[SchoolComponent] --> B(/api/academy-courses];
    B --> D{Module Data};
    D --> E(AcademyContentClient);
    E --> F{Module Type};
    F -- Article --> G[AcademyArticle];
    G --> H(MdxRenderer);
    H --> I{MDX Content};
    I -- Quiz --> J[Quiz.tsx];
    I -- Exercise --> K[ExerciseModule.tsx];
    E -- CourseList --> L[Card];
    L --> M{Interactive Indicator};
    J --> O[IndexedDB];
