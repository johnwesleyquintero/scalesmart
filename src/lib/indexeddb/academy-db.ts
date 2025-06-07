import {
  setItem,
  getItem,
  deleteItem,
  getRecordFromSupabase,
  syncFromSupabase,
  getAllItemsFromStore, // Added import
} from '@/lib/indexeddb-service';
import { Course, QuizResult } from '@/types'; // Assuming these types are defined in '@/types'

// --- IndexedDB Store Names for Academy Data ---
const ACADEMY_COURSE_STORE = 'academy-courses';
const ACADEMY_MODULE_PROGRESS_STORE = 'academy-module-progress';
const ACADEMY_QUIZ_RESULTS_STORE = 'academy-quiz-results';

// --- Types for Academy IndexedDB Records ---
export interface ModuleProgressRecord {
  userId: string;
  courseId: string;
  moduleId: string;
  progress: number; // 0-100
  updatedAt: number; // Timestamp
}

export interface QuizResultRecord {
  userId: string;
  moduleId: string;
  result: QuizResult;
  updatedAt: number; // Timestamp
}

// --- Academy-specific IndexedDB Operations ---

/**
 * Updates or creates module progress for a user.
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
  const key = `${userId}-${courseId}-${moduleId}`;
  const record: ModuleProgressRecord = {
    userId,
    courseId,
    moduleId,
    progress,
    updatedAt: Date.now(),
  };
  await setItem(ACADEMY_MODULE_PROGRESS_STORE, key, record);
}

/**
 * Gets module progress for a specific module.
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
  const key = `${userId}-${courseId}-${moduleId}`;
  const record = await getItem<ModuleProgressRecord>(key);
  return record?.progress || 0;
}

/**
 * Gets all module progress records for a given user and optionally course.
 * This function needs to iterate through the store, as `getItem` is for specific keys.
 * @param userId The ID of the user.
 * @param courseId Optional. If provided, filters progress for a specific course.
 * @returns An array of ModuleProgressRecord.
 */
export async function getCourseModuleProgress(
  userId: string,
  courseId?: string,
): Promise<ModuleProgressRecord[]> {
  // This requires iterating through the main store and filtering.
  // A more efficient approach for large datasets might involve creating an index
  // on userId in the IndexedDB schema, but for now, we'll filter in memory.
  const allItems = await getAllItemsFromStore<ModuleProgressRecord>(
    ACADEMY_MODULE_PROGRESS_STORE,
  );
  return allItems.filter(
    (record) =>
      record.userId === userId && (!courseId || record.courseId === courseId),
  );
}

/**
 * Updates or creates a quiz result for a user.
 * @param userId The ID of the user.
 * @param moduleId The ID of the module the quiz belongs to.
 * @param result The quiz result data.
 */
export async function updateQuizResult(
  userId: string,
  moduleId: string,
  result: QuizResult,
): Promise<void> {
  const key = `${userId}-${moduleId}`;
  const record: QuizResultRecord = {
    userId,
    moduleId,
    result,
    updatedAt: Date.now(),
  };
  await setItem(ACADEMY_QUIZ_RESULTS_STORE, key, record);
}

/**
 * Gets a quiz result for a specific module.
 * @param userId The ID of the user.
 * @param moduleId The ID of the module.
 * @returns The quiz result, or undefined if not found.
 */
export async function getQuizResult(
  userId: string,
  moduleId: string,
): Promise<QuizResult | undefined> {
  const key = `${userId}-${moduleId}`;
  const record = await getItem<QuizResultRecord>(key);
  return record?.result;
}

/**
 * Gets all quiz results for a given user.
 * @param userId The ID of the user.
 * @returns An array of QuizResultRecord.
 */
export async function getAllQuizResultsForUser(
  userId: string,
): Promise<QuizResultRecord[]> {
  const allItems = await getAllItemsFromStore<QuizResultRecord>(
    ACADEMY_QUIZ_RESULTS_STORE,
  );
  return allItems.filter((record) => record.userId === userId);
}

/**
 * Fetches all items from a given IndexedDB store.
 * This is a generic helper for retrieving all records when specific keys are not known.
 * @param storeName The name of the object store.
 * @returns A promise that resolves to an array of all items in the store.
 */

// --- Course Management (Placeholder for now, assuming these will interact with Supabase/IndexedDB) ---

/**
 * Fetches all courses. This might involve syncing from Supabase first.
 * @param supabaseClient The Supabase client instance.
 * @returns A promise that resolves to an array of Course objects.
 */
export async function getAllCourses(): Promise<Course[]> {
  // Retrieve all items directly from IndexedDB
  const allItems = await getAllItemsFromStore<Course>(ACADEMY_COURSE_STORE);
  return allItems;
}

/**
 * Updates a course.
 * @param course The course object to update.
 */
export async function updateCourse(course: Course): Promise<void> {
  await setItem(ACADEMY_COURSE_STORE, course.id, course);
}

/**
 * Deletes courses by their IDs.
 * @param courseIds An array of course IDs to delete.
 */
export async function deleteCoursesByIds(courseIds: string[]): Promise<void> {
  for (const id of courseIds) {
    await deleteItem(ACADEMY_COURSE_STORE, id);
  }
}
