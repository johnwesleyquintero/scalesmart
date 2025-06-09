/**
 * @file CommunicationLog.tsx
 * @description This component displays and manages communication logs for a specific customer.
 * It allows users to add new logs, edit existing ones, and delete them.
 * It also sorts logs by date in descending order.
 */

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { CommunicationLog } from '../types';
import { toast } from 'sonner';

// Define the allowed communication types using a const assertion for type safety.
export const COMMUNICATION_TYPES = [
  'call',
  'email',
  'meeting',
  'chat',
] as const satisfies readonly string[];
// Derive a union type from the array for strict type checking.
export type CommunicationType = (typeof COMMUNICATION_TYPES)[number];

interface CommunicationLogProps {
  logs: CommunicationLog[];
  customerId: string;
  onSave: (log: Omit<CommunicationLog, 'id'>) => Promise<void>;
  onUpdate: (log: CommunicationLog) => Promise<void>;
  onDelete: (logId: string, customerId: string) => Promise<void>;
}

/**
 * CommunicationLogComponent displays and manages communication logs.
 */
const CommunicationLogComponent: React.FC<CommunicationLogProps> = ({
  logs,
  customerId,
  onSave,
  onUpdate,
  onDelete,
}) => {
  // State for the type of new/editing log.
  const [newLogType, setNewLogType] = useState<CommunicationType>('call');
  // State for the subject of new/editing log.
  const [newLogSubject, setNewLogSubject] = useState('');
  // State for the notes of new/editing log.
  const [newLogNotes, setNewLogNotes] = useState('');
  // State to hold the log currently being edited, or null if not editing.
  const [editingLog, setEditingLog] = useState<CommunicationLog | null>(null);

  /**
   * Handles the submission of a new or updated communication log.
   * Performs input validation and calls the appropriate parent callback (`onSave` or `onUpdate`).
   */
  const handleSubmit = async () => {
    // Validate that notes are not empty.
    if (!newLogNotes.trim()) {
      toast.error('Communication notes cannot be empty.');
      return;
    }

    if (editingLog) {
      // If `editingLog` is set, update the existing log.
      await onUpdate({
        ...editingLog,
        type: newLogType,
        subject: newLogSubject.trim() || undefined, // Use undefined if subject is empty.
        notes: newLogNotes.trim(),
      });
      toast.success('Communication log updated!');
      setEditingLog(null); // Clear editing state.
    } else {
      // Otherwise, save a new log.
      await onSave({
        customerId,
        type: newLogType,
        subject: newLogSubject.trim() || undefined, // Use undefined if subject is empty.
        notes: newLogNotes.trim(),
        date: Date.now(), // Set current timestamp for new logs.
      });
      toast.success('Communication log added!');
    }
    // Reset form fields after submission.
    setNewLogType('call');
    setNewLogSubject('');
    setNewLogNotes('');
  };

  /**
   * Sets the state to enable editing for a selected communication log.
   * Populates the form fields with the log's current data.
   */
  const handleEdit = (log: CommunicationLog) => {
    setEditingLog(log);
    setNewLogType(log.type as CommunicationType);
    setNewLogSubject(log.subject || '');
    setNewLogNotes(log.notes);
  };

  /**
   * Clears the editing state and resets the form fields.
   */
  const handleCancelEdit = () => {
    setEditingLog(null);
    setNewLogType('call');
    setNewLogSubject('');
    setNewLogNotes('');
  };

  /**
   * Memoized sorting of communication logs by date in descending order.
   * This ensures the most recent logs are displayed first without re-sorting on every render.
   */
  const sortedLogs = useMemo(() => {
    // Create a shallow copy to avoid mutating the original `logs` prop.
    return [...logs].sort((a, b) => b.date - a.date);
  }, [logs]); // Re-sort only when the `logs` array changes.

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle className="text-foreground">Communication History</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Form for adding/editing communication logs */}
        <div className="mb-4 space-y-3">
          <select
            value={newLogType}
            onChange={(e) => setNewLogType(e.target.value as CommunicationType)}
            className="w-full p-2 border rounded-md bg-background text-foreground"
            aria-label="Communication Type" // Added accessibility label
          >
            {COMMUNICATION_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
          <Input
            placeholder="Subject (Optional)"
            value={newLogSubject}
            onChange={(e) => setNewLogSubject(e.target.value)}
            aria-label="Communication Subject" // Added accessibility label
          />
          <Textarea
            placeholder="Detailed notes on communication..."
            value={newLogNotes}
            onChange={(e) => setNewLogNotes(e.target.value)}
            rows={4}
            aria-label="Communication Notes" // Added accessibility label
          />
          <div className="flex gap-2">
            <Button onClick={handleSubmit} className="flex-1">
              {editingLog ? 'Update Log' : 'Add Communication'}
            </Button>
            {editingLog && (
              <Button
                onClick={handleCancelEdit}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
            )}
          </div>
        </div>

        {/* Display section for recent interactions */}
        <h3 className="text-xl font-semibold mb-3 border-b border-border pb-2 text-foreground">
          Recent Interactions
        </h3>
        {sortedLogs.length === 0 ? (
          <p className="text-muted-foreground">
            No communication logs for this customer yet.
          </p>
        ) : (
          <div className="space-y-4">
            {sortedLogs.map((log) => (
              <Card key={log.id} className="p-4">
                <p className="text-sm text-muted-foreground">
                  {/* Format date and display type */}
                  {new Date(log.date).toLocaleString()} - {log.type}
                </p>
                {log.subject && (
                  <p className="font-semibold text-foreground">{log.subject}</p>
                )}
                <p className="whitespace-pre-wrap text-foreground">
                  {log.notes}
                </p>
                <div className="flex gap-2 mt-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(log)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(log.id!, customerId)}
                    className="text-destructive"
                  >
                    Delete
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CommunicationLogComponent;
