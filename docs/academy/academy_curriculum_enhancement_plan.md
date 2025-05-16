# Academy Curriculum Enhancement Plan

## Overview

This document outlines the plan to enhance the Amazon Seller Academy's curriculum, based on the "Improvement Plan" outlined in `academy_architecture.md`.

## Goals

- Diversify module types.
- Improve the quiz component.
- Enhance the curriculum.
- Implement personalized learning paths.

## Detailed Plan

### 1. Diversified Module Types

- **Changes Needed:**
  - Modify the `Module` type definition in `src/lib/types.ts` to include a `type` property (e.g., "video", "exercise", "caseStudy", "article", "quiz").
  - Update the `AcademyContentClient` component (`src/components/AcademyContentClient.tsx`) to render different components based on the `module.type`.
  - Create new components for each module type (e.g., `VideoModule.tsx`, `ExerciseModule.tsx`, `CaseStudyModule.tsx`). These components will handle the specific rendering and interaction logic for each module type.
  - Update the data structure (likely in `src/data/portfolio-data/courses.json` or similar) to include the `type` property for each module.
- **Data Structures:**

  - Extend the `Module` interface in `src/lib/types.ts`:

  ```typescript
  export interface Module {
    id: string;
    title: string;
    type: 'article' | 'video' | 'exercise' | 'caseStudy' | 'quiz'; // Added type
    contentSlug?: string; // For articles
    videoUrl?: string; // For videos
    exerciseData?: any; // For interactive exercises (e.g., JSON with instructions, code snippets)
    caseStudyId?: string; // For case studies
    quizId?: string; // For quizzes
  }
  ```

- **Components:**
  - Create `VideoModule.tsx`: This component will display a video player (using a library like `react-player` or a standard HTML5 video element).
  - Create `ExerciseModule.tsx`: This component will render interactive exercises. The specific implementation will depend on the exercise format (e.g., code challenges, drag-and-drop activities).
  - Create `CaseStudyModule.tsx`: This component will display case study content, potentially pulling data from a separate data source.

### 2. Improved Quiz Component

- **Changes Needed:**
  - Enhance the `Quiz` component (`src/components/Quiz.tsx`) to provide feedback for incorrect answers, explanations for correct answers, and support for different question types.
  - Modify the quiz data structure (likely in `src/data/portfolio-data/courses.json` or similar) to include question types, correct answers, feedback, and explanations.
- **Data Structures:**

  - Extend the `Quiz` data structure (e.g., within the `Module` or a separate `Quiz` type):

  ```typescript
  export interface Question {
    id: string;
    type: 'multipleChoice' | 'trueFalse' | 'fillInTheBlank'; // Added question types
    text: string;
    options?: string[]; // For multiple choice
    correctAnswer: string | string[]; // For multiple choice, true/false, or fill-in-the-blank
    feedbackIncorrect?: string;
    explanationCorrect?: string;
  }

  export interface Quiz {
    id: string;
    title: string;
    questions: Question[];
  }
  ```

- **Components:**
  - Update the `Quiz` component to render different question types based on the `question.type`.
  - Implement logic to display feedback and explanations after the user submits their answers.

### 3. Curriculum Enhancement

- **Changes Needed:**
  - Add new courses and modules to the `courses.json` (or similar) data file, covering a wider range of Amazon seller topics.
  - Ensure the content is up-to-date and reflects the latest Amazon policies and best practices.
- **Data Structures:**
  - Update the `Course` and `Module` data structures in `src/lib/types.ts` and the corresponding data files (`src/data/portfolio-data/courses.json` or similar) to include the new courses and modules.

### 4. Personalized Learning Paths

- **Changes Needed:**
  - Implement a system to recommend courses and modules based on the user's experience level and interests.
  - Allow users to track their progress and earn badges or certificates for completing courses.
  - This will likely involve creating a user profile and storing user data (experience level, interests, course progress) in local storage (as per the architecture document) or potentially a database (if the note about local storage is no longer valid).
- **Data Structures:**

  - Create a `UserProfile` interface (or extend an existing one) to store user-specific data:

  ```typescript
  export interface UserProfile {
    id: string; // User ID (e.g., from local storage)
    experienceLevel: 'beginner' | 'intermediate' | 'advanced';
    interests: string[]; // Array of interest tags (e.g., "product research", "advertising")
    completedCourses: string[]; // Array of course IDs
    // Add other relevant user data
  }
  ```

- **Components:**
  - Create a component to display recommended courses and modules based on the user's profile.
  - Implement logic to update the user's profile when they complete courses or modules.
  - Consider a badge/certificate component.

### Mermaid Diagram (High-Level Overview)

```mermaid
graph LR
    A[User] --> B{Academy Page (src/app/academy/page.tsx)};
    B --> C{AcademyContentClient (src/components/AcademyContentClient.tsx)};
    C --> D{Module Components (Video, Exercise, CaseStudy, Quiz)};
    C --> E{Quiz Component (src/components/Quiz.tsx)};
    C --> F{Course & Module Data (courses.json, etc.)};
    C --> G{User Profile & Recommendations};
    D --> H{Video Player};
    D --> I{Interactive Exercise};
    D --> J{Case Study Content};
    E --> K{Question Types, Feedback, Explanations};
    G --> L{Experience Level & Interests};
    G --> M{Completed Courses};
    G --> N{Recommendations};
```
