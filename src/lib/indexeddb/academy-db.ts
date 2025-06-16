import { db } from '@/lib/indexeddb-service'; // Assuming db is a Dexie instance or similar, strongly typed
import { Course, QuizResult } from '@/types'; // Assuming these types are defined in '@/types'

// --- Types for Academy IndexedDB Records ---
// These interfaces should match the schema defined in the indexeddb-service
// Based on observations/errors, the stored records do NOT include 'updatedAt'.
// If updatedAt is needed, it must be explicitly handled/stored by the indexeddb-service schema.
export interface ModuleProgressRecord {
  userId: string;
  courseId: string;
  moduleId: string;
  progress: number; // 0-100
  lastUpdated: number;
}

export interface QuizResultRecord {
  userId: string;
  moduleId: string;
  result: QuizResult;
  lastUpdated: number;
}

// Assuming Course interface from '@/types' includes the primary key (e.g., 'id')

// --- Academy-specific IndexedDB Operations ---

/**
 * Updates or creates module progress for a user.
 * Assumes the 'moduleProgress' store uses a composite primary key like [userId, courseId, moduleId].
 * @param userId The ID of the user.
 * @param courseId The ID of the course.
 * @param moduleId The ID of the module.
 * @param progress The progress percentage (0-100).
 */
export async function updateModuleProgress(
  userId: string,
  courseId: string,
  moduleId: string,
  progress: number,
): Promise<void> {
  console.log('DEBUG: updateModuleProgress called with:', {
    userId,
    courseId,
    moduleId,
    progress,
  });
  const record: ModuleProgressRecord = {
    userId,
    courseId,
    moduleId,
    progress,
    lastUpdated: Date.now(),
  };
  console.log('DEBUG: Attempting to put moduleProgress record:', record);
  // Use db object directly, assuming 'moduleProgress' store exists and handles key from object
  await db.moduleProgress.put(record);
}

/**
 * Gets module progress for a specific module.
 * Assumes the 'moduleProgress' store uses a composite primary key like [userId, courseId, moduleId].
 * @param userId The ID of the user.
 * @param courseId The ID of the course.
 * @param moduleId The ID of the module.
 * @returns The progress percentage, or 0 if not found.
 */
export async function getModuleProgress(
  userId: string,
  courseId: string,
  moduleId: string,
): Promise<number> {
  // Use db object directly with composite key array
  const record = await db.moduleProgress.get([userId, courseId, moduleId]);
  return record?.progress || 0;
}

/**
 * Gets all module progress records for a given user and optionally course.
 * Leverages IndexedDB indexes for better performance compared to toArray().filter().
 * Assumes appropriate indexes exist (e.g., on userId, and potentially [userId, courseId]).
 * @param userId The ID of the user.
 * @param courseId Optional. If provided, filters progress for a specific course.
 * @returns An array of ModuleProgressRecord.
 */
export async function getCourseModuleProgress(
  userId: string,
  courseId?: string,
): Promise<ModuleProgressRecord[]> {
  let collection = db.moduleProgress.where('userId').equals(userId);

  if (courseId) {
    // Assuming a composite index [userId, courseId] exists or chaining filter is efficient enough
    collection = db.moduleProgress
      .where(['userId', 'courseId'])
      .equals([userId, courseId]);
  }

  return collection.toArray();
}

/**
 * Updates or creates a quiz result for a user.
 * Assumes the 'quizResults' store uses a composite primary key like [userId, moduleId].
 * @param userId The ID of the user.
 * @param moduleId The ID of the module the quiz belongs to.
 * @param result The quiz result data.
 */
export async function updateQuizResult(
  userId: string,
  moduleId: string,
  result: QuizResult,
): Promise<void> {
  console.log('DEBUG: updateQuizResult called with:', {
    userId,
    moduleId,
    result,
  });
  const record: QuizResultRecord = {
    userId,
    moduleId,
    result,
    lastUpdated: Date.now(),
  };
  console.log('DEBUG: Attempting to put quizResults record:', record);
  // Use db object directly, assuming 'quizResults' store exists and handles key from object
  await db.quizResults.put(record);
}

/**
 * Gets a quiz result for a specific module.
 * Assumes the 'quizResults' store uses a composite primary key like [userId, moduleId].
 * @param userId The ID of the user.
 * @param moduleId The ID of the module.
 * @returns The quiz result, or undefined if not found.
 */
export async function getQuizResult(
  userId: string,
  moduleId: string,
): Promise<QuizResult | undefined> {
  // Use db object directly with composite key array
  const record = await db.quizResults.get([userId, moduleId]);
  return record?.result;
}

/**
 * Gets all quiz results for a given user.
 * Leverages IndexedDB indexes for better performance compared to toArray().filter().
 * Assumes an index exists on userId for the quizResults store.
 * @param userId The ID of the user.
 * @returns An array of QuizResultRecord.
 */
export async function getAllQuizResultsForUser(
  userId: string,
): Promise<QuizResultRecord[]> {
  // Use .where() with the userId index
  return db.quizResults.where('userId').equals(userId).toArray();
}

/**
 * Fetches all courses.
 * Assumes the 'courses' store exists.
 * @returns A promise that resolves to an array of Course objects.
 */
export async function getAllCourses(): Promise<Course[]> {
  const allItems = await db.courses.toArray();
  return allItems;
}

/**
 * Updates a course.
 * Assumes the 'courses' store uses 'id' as the primary key and handles it from the object.
 * @param course The course object to update.
 */
export async function updateCourse(course: Course): Promise<void> {
  // Use db object directly, assuming 'courses' store exists and handles 'id' from object
  await db.courses.put(course);
}

/**
 * Deletes courses by their IDs.
 * Assumes the 'courses' store uses 'id' as the primary key.
 * Uses bulk delete for potentially better performance.
 * @param courseIds An array of course IDs to delete.
 */
export async function deleteCoursesByIds(courseIds: string[]): Promise<void> {
  await db.courses.bulkDelete(courseIds);
}
