import React, { useState, useCallback } from 'react';
import { Task, TaskComment } from '@/lib/indexeddb-service'; // Import TaskComment type
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner'; // Import toast for user feedback
import { formatDateTime } from '@/lib/utils/date-utils'; // Import formatDateTime

interface CommentListProps {
  taskId: string;
  comments: TaskComment[]; // Use TaskComment
  onAddComment: (comment: TaskComment) => Promise<void>; // Use TaskComment
}

const CommentList: React.FC<CommentListProps> = ({
  taskId,
  comments,
  onAddComment,
}) => {
  const [newCommentText, setNewCommentText] = useState('');

  /**
   * Handles adding a new comment. Creates the comment object and passes it
   * to the parent's onAddComment handler.
   */
  const handleAddComment = useCallback(async () => {
    // Make handleAddComment async
    if (newCommentText.trim() === '') {
      return;
    }

    const newComment: TaskComment = {
      // Use TaskComment
      id: crypto.randomUUID(), // Use crypto.randomUUID() for robust ID generation
      taskId: taskId, // Add the missing taskId
      content: newCommentText,
      userId: 'CurrentUser', // TODO: Integrate with actual user authentication to get the current user's ID/name
      createdAt: Date.now(),
    };

    try {
      await onAddComment(newComment); // Await the parent's async handler
      setNewCommentText('');
    } catch (error) {
      console.error('Failed to add comment:', error);
      toast.error('Failed to add comment. Please try again.'); // Show error toast
    }
  }, [newCommentText, onAddComment, taskId]);
  return (
    <div>
      <h4 className="text-sm font-semibold text-foreground mb-2">Comments</h4>
      {comments.length === 0 ? (
        <p className="text-sm text-muted-foreground">No comments yet.</p>
      ) : (
        <ul className="space-y-2">
          {comments.map((comment) => (
            <li
              key={comment.id}
              className="bg-card p-2 rounded-md shadow-sm border border-border"
            >
              <div className="text-xs text-muted-foreground">
                {comment.userId} - {formatDateTime(comment.createdAt)}
              </div>
              <p className="text-sm text-foreground">{comment.content}</p>
            </li>
          ))}
        </ul>
      )}
      <div className="mt-4 flex space-x-2">
        <Input
          type="text"
          placeholder="Add a comment..."
          value={newCommentText}
          onChange={(e) => setNewCommentText(e.target.value)}
          className="flex-1"
        />
        <Button onClick={handleAddComment} size="sm">
          Add Comment
        </Button>
      </div>
    </div>
  );
};

export default CommentList;
