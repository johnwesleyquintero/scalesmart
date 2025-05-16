# Local Storage Documentation

## Overview

This documentation describes how local storage is used in the application. Local storage is a web browser feature that allows websites to store data locally within the user's browser. This data persists even after the browser is closed and reopened.

## Usage

Local storage is used in the application for the following purposes:

- **Storing User Data:**
  - Course progress in `src/hooks/use-academy-storage.ts` and `src/components/AcademyContentClient.tsx`
  - Chat messages in `src/components/ui/chat-interface.tsx`
  - Workflow data in `src/app/workflow-builder/page.tsx`
  - Task data in `src/app/project-management/page.tsx`
  - Competitor analysis results in `src/components/amazon-seller-tools/competitor-analyzer.tsx`

## Technical Details

- **`src/hooks/use-local-storage.ts`:** This file defines a custom hook for using local storage with encryption and chunking to handle large data.
  - **Encryption:** The hook encrypts the data before storing it in local storage to protect sensitive information.
  - **Chunking:** The hook splits large data into smaller chunks to avoid exceeding the local storage size limit.
- **Data Persistence:** Data stored in local storage persists even after the browser is closed and reopened.
- **Data Security:** While local storage provides some level of data persistence, it is important to note that it is not a secure storage mechanism. Sensitive data should not be stored in local storage.
- **Data Size Limit:** Local storage has a size limit, which varies depending on the browser. The `useLocalStorage` hook implements chunking to overcome this limitation.

## Best Practices

- **Store Non-Sensitive Data:** Only store non-sensitive data in local storage.
- **Use Encryption:** Encrypt sensitive data before storing it in local storage. The `useLocalStorage` hook provides encryption functionality.
- **Handle Data Size Limits:** Be aware of the local storage size limit and use chunking if necessary. The `useLocalStorage` hook provides chunking functionality.
- **Provide Export Functionality:** Provide users with the ability to export their data from local storage.
- **Inform Users about Data Storage:** Clearly inform users about how their data is stored and used in the application, as demonstrated in the `src/app/privacy-policy/page.tsx` file.
