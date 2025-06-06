import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { CommunicationLog } from '../types';
import { toast } from 'sonner';

const COMMUNICATION_TYPES = ['Call', 'Email', 'Meeting', 'Other'] as const;
type CommunicationType = (typeof COMMUNICATION_TYPES)[number];

interface CommunicationLogProps {
  logs: CommunicationLog[];
  customerId: string;
  onSave: (log: Omit<CommunicationLog, 'id'>) => Promise<void>;
  onUpdate: (log: CommunicationLog) => Promise<void>;
  onDelete: (logId: string, customerId: string) => Promise<void>;
}

const CommunicationLogComponent: React.FC<CommunicationLogProps> = ({
  logs,
  customerId,
  onSave,
  onUpdate,
  onDelete,
}) => {
  const [newLogType, setNewLogType] = useState<CommunicationType>('Call');
  const [newLogSubject, setNewLogSubject] = useState('');
  const [newLogNotes, setNewLogNotes] = useState('');
  const [editingLog, setEditingLog] = useState<CommunicationLog | null>(null);

  const handleSubmit = async () => {
    if (!newLogNotes.trim()) {
      toast.error('Communication notes cannot be empty.');
      return;
    }

    if (editingLog) {
      await onUpdate({
        ...editingLog,
        type: newLogType,
        subject: newLogSubject.trim() || undefined,
        notes: newLogNotes.trim(),
      });
      toast.success('Communication log updated!');
      setEditingLog(null);
    } else {
      await onSave({
        customerId,
        type: newLogType,
        subject: newLogSubject.trim() || undefined,
        notes: newLogNotes.trim(),
        date: Date.now(),
      });
      toast.success('Communication log added!');
    }
    setNewLogType('Call');
    setNewLogSubject('');
    setNewLogNotes('');
  };

  const handleEdit = (log: CommunicationLog) => {
    setEditingLog(log);
    setNewLogType(log.type as CommunicationType);
    setNewLogSubject(log.subject || '');
    setNewLogNotes(log.notes);
  };

  const handleCancelEdit = () => {
    setEditingLog(null);
    setNewLogType('Call');
    setNewLogSubject('');
    setNewLogNotes('');
  };

  const sortedLogs = useMemo(() => {
    return [...logs].sort((a, b) => b.date - a.date);
  }, [logs]);

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle className="text-foreground">Communication History</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4 space-y-3">
          <select
            value={newLogType}
            onChange={(e) => setNewLogType(e.target.value as CommunicationType)}
            className="w-full p-2 border rounded-md bg-background text-foreground"
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
          />
          <Textarea
            placeholder="Detailed notes on communication..."
            value={newLogNotes}
            onChange={(e) => setNewLogNotes(e.target.value)}
            rows={4}
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
