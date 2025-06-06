// src/lib/constants/project-management.ts

/**
 * @enum TaskStatus
 * @brief Defines the possible statuses for a task.
 */
export enum TaskStatus {
  TODO = 'to-do',
  IN_PROGRESS = 'in-progress',
  COMPLETED = 'completed',
}

/**
 * @constant TASK_STATUSES
 * @brief An array of task status objects, used for rendering columns and consistent status management.
 */
export const TASK_STATUSES = [
  { id: TaskStatus.TODO, title: 'To Do' },
  { id: TaskStatus.IN_PROGRESS, title: 'In Progress' },
  { id: TaskStatus.COMPLETED, title: 'Completed' },
];

/**
 * @constant NO_PROJECT_VALUE
 * @brief A special value used in the project selection dropdown to represent "No Project Selected".
 * This avoids using an empty string, which Radix UI's Select.Item explicitly disallows for individual items.
 */
export const NO_PROJECT_VALUE = 'no-project-selected';
