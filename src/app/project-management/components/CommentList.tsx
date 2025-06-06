import React, { useState, useCallback } from 'react';
import { Task, Comment } from '@/lib/indexeddb-service'; // Import Comment type
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface CommentListProps {
  taskId: string;
  comments: Comment[];
  onAddComment: (comment: Comment) => Promise<void>; // Update return type to Promise<void>
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

    const newComment: Comment = {
      id: Math.random().toString(36).substring(7), // Simple ID generation
      text: newCommentText,
      author: 'CurrentUser', // TODO: Replace with actual current user ID/name
      createdAt: Date.now(),
    };

    try {
      await onAddComment(newComment); // Await the parent's async handler
      setNewCommentText('');
    } catch (error) {
      console.error('Failed to add comment:', error);
      // TODO: Implement user feedback for error (e.g., toast notification)
    }
  }, [newCommentText, onAddComment]);
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
                {comment.author} -{' '}
                {new Date(comment.createdAt).toLocaleString()}
              </div>
              <p className="text-sm text-foreground">{comment.text}</p>
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
