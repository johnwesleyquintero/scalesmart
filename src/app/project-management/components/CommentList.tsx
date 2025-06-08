import React, { useState, useCallback } from 'react';
import { TaskComment } from '@/lib/indexeddb-service'; // Import TaskComment type
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
   * @brief Handles adding a new comment.
   *
   * Creates a new `TaskComment` object with a unique ID, current task ID,
   * user ID (placeholder), content, and timestamp. It then calls the
   * `onAddComment` prop to persist the comment and clears the input field.
   *
   * @returns {Promise<void>} A promise that resolves when the comment has been added.
   */
  const handleAddComment = useCallback(async () => {
    if (newCommentText.trim() === '') {
      return;
    }

    const newComment: TaskComment = {
      id: crypto.randomUUID(),
      taskId: taskId,
      content: newCommentText,
      userId: 'anonymous_user', // Placeholder: Integrate with actual user authentication
      createdAt: Date.now(),
    };

    try {
      await onAddComment(newComment);
      setNewCommentText('');
      toast.success('Comment added successfully!'); // Add success toast
    } catch (error) {
      toast.error('Failed to add comment. Please try again.'); // Add error toast
      console.error('Failed to add comment:', error); // Log error
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
