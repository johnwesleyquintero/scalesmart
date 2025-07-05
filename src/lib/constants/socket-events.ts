/**
 * @fileoverview This file contains constants for Socket.IO event names.
 * Centralizing these constants ensures consistency between the client and server.
 */

export const SOCKET_EVENTS = {
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  TASK_UPDATE: 'task-update',
  TASK_CREATE: 'task-create',
  TASK_DELETE: 'task-delete',
} as const;
