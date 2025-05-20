# Academy Content Update Process

This document outlines the process for updating content in the ScaleSmart Academy.

## Content Creation

1.  Create new content as MDX files in the `src/app/content/academy` directory.
2.  Ensure each file includes the following metadata:
    - `title`: The title of the module.
    - `description`: A brief description of the module.
    - `moduleType`: The type of module (`article`, `video`, `exercise`, `caseStudy`, `quiz`, `simulation`).

## Content Integration

1.  Import the new MDX files into the relevant course component.
2.  Update the course's module list to include the new module.

## Content Review

1.  All content updates must be reviewed and approved by the content team.
2.  Ensure the content is accurate, up-to-date, and relevant.

## Content Updates

1.  Regularly review existing content to ensure it remains accurate and up-to-date.
2.  Update content as needed to reflect changes in the Amazon marketplace.

## Data Structures

### `AcademyDataType`

The `AcademyDataType` interface defines the structure of the academy data stored in local storage. It includes the following properties:

- `courses`: An array of `Course` objects representing the available courses.
- `moduleProgress`: A record of module completion status, where the key is the module ID and the value is a boolean indicating whether the module is completed.
- `quizResults`: A record of quiz results, where the key is the module ID and the value is a `QuizResult` object containing the quiz score, attempts, and pass status.

## Components

### `useAcademyStorage` Hook

The `useAcademyStorage` hook is responsible for managing the academy data in local storage. It provides functions for:

- Initializing the academy data.
- Retrieving the academy data.
- Saving updates to the academy data.

### Quiz Component

The `Quiz` component is used to create interactive quizzes within academy modules. It allows users to test their knowledge and track their progress. The quiz results are stored in the `quizResults` property of the `AcademyDataType` in local storage.
