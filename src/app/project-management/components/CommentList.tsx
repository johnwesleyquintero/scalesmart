import React, { useState, useCallback } from 'react';
import { TaskComment } from '@/lib/indexeddb-service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { formatDateTime } from '@/lib/utils/date-utils';
import useUserProfile from '@/hooks/use-user-profile';

/**
 * @interface CommentListProps
 * @brief Props for the CommentList component.
 * @property {string} taskId - The ID of the task to which these comments belong.
 * @property {TaskComment[]} comments - An array of `TaskComment` objects to display.
 * @property {(comment: TaskComment) => Promise<void>} onAddComment - Callback function to handle adding a new comment.
 */
interface CommentListProps {
  taskId: string;
  comments: TaskComment[];
  onAddComment: (comment: TaskComment) => Promise<void>;
}

/**
 * @component CommentList
 * @brief Displays a list of comments for a given task and provides an input for adding new comments.
 *
 * This component manages the state for the new comment input field and handles the
 * submission of new comments, including optimistic UI updates and error handling
 * with toast notifications. It also formats the comment timestamps for display.
 *
 * @param {CommentListProps} props The props for the component.
 * @returns {JSX.Element} The CommentList component.
 */
const CommentList: React.FC<CommentListProps> = ({
  taskId,
  comments,
  onAddComment,
}) => {
  const { userProfile, isLoading } = useUserProfile();
  const [newCommentText, setNewCommentText] = useState('');
  const [loading, setLoading] = useState(false); // State to manage loading status during comment submission

  /**
   * @brief Handles adding a new comment.
   *
   * This asynchronous function creates a new `TaskComment` object with a unique ID,
   * the current task ID, a placeholder user ID, the content from the input field,
   * and a timestamp. It then calls the `onAddComment` prop to persist the comment.
   * It provides visual feedback using a loading state and toast notifications for
   * success or failure.
   *
   * @returns {Promise<void>} A promise that resolves when the comment has been added and persisted.
   */
  const handleAddComment = useCallback(async () => {
    if (newCommentText.trim() === '') {
      // Prevent adding empty comments
      toast.info('Comment cannot be empty.');
      return;
    }

    const newComment: TaskComment = {
      id: crypto.randomUUID(), // Generate a unique ID for the new comment
      taskId: taskId,
      content: newCommentText.trim(), // Trim whitespace from the comment content
      userId: userProfile?.id || 'anonymous', // Use actual user ID or 'anonymous' if not logged in
      createdAt: Date.now(), // Timestamp of comment creation
    };

    try {
      setLoading(true); // Set loading to true to disable input and button
      await onAddComment(newComment); // Call the parent's handler to persist the comment
      setNewCommentText(''); // Clear the input field on success
      toast.success('Comment added successfully!'); // Show success toast
    } catch (error: unknown) {
      toast.error(
        `Failed to add comment: ${(error as Error).message}. Please try again.`,
      ); // Show error toast
      console.error('Failed to add comment:', error); // Log the error for debugging
    } finally {
      setLoading(false); // Reset loading state regardless of success or failure
    }
  }, [newCommentText, onAddComment, taskId, userProfile?.id]);

  /**
   * @brief Handles the `Enter` key press event in the comment input field.
   *
   * If the `Enter` key is pressed and the component is not currently loading
   * (i.e., not already submitting a comment), it triggers the `handleAddComment` function.
   *
   * @param {React.KeyboardEvent<HTMLInputElement>} e The keyboard event object.
   */
  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' && !loading) {
        handleAddComment();
      }
    },
    [handleAddComment, loading],
  );

  return (
    <div>
      <h4 className="text-sm font-semibold text-foreground mb-2">Comments</h4>
      {comments.length === 0 ? (
        <p className="text-sm text-muted-foreground" role="status">
          No comments yet.
        </p>
      ) : (
        <ul className="space-y-2" aria-live="polite">
          {comments.map((comment) => (
            <li
              key={comment.id}
              className="bg-card p-2 rounded-md shadow-sm border border-border"
            >
              <div className="text-xs text-muted-foreground">
                {/* Display username if available, otherwise use user ID */}
                {userProfile?.id === comment.userId
                  ? userProfile.name
                  : comment.userId}{' '}
                - {formatDateTime(comment.createdAt)}
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
          onKeyPress={handleKeyPress}
          className="flex-1"
          disabled={loading} // Disable input while loading
          aria-label="New comment text input"
        />
        <Button
          onClick={handleAddComment}
          size="sm"
          disabled={loading || newCommentText.trim() === ''} // Disable button when loading or input is empty
          aria-label={loading ? 'Adding comment...' : 'Add Comment'}
        >
          {loading ? 'Adding...' : 'Add Comment'}
        </Button>
      </div>
    </div>
  );
};

export default CommentList;
