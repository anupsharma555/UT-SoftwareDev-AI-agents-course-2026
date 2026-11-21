import { useState, useEffect } from 'react';
import { upvoteComment, downvoteComment } from '../../services/commentService';
import { Card } from "react-bootstrap";
import VoteButtons from '../Shared/VoteButtons';
import './CommentList.css';

export default function CommentList({ comments: initialComments }) {
  const [comments, setComments] = useState(initialComments);

  // Sync local state when prop changes
  useEffect(() => {
    setComments(initialComments);
  }, [initialComments]);

  const handleUpvote = async (commentId) => {
    try {
      const updatedComment = await upvoteComment(commentId);
      
      // Update local state
      setComments(comments.map(comment => 
        comment._id === commentId 
          ? { ...comment, voteCount: updatedComment.voteCount }
          : comment
      ));
    } catch (err) {
      console.error('Failed to upvote comment:', err);
    }
  };

  const handleDownvote = async (commentId) => {
    try {
      const updatedComment = await downvoteComment(commentId);
      
      // Update local state
      setComments(comments.map(comment => 
        comment._id === commentId 
          ? { ...comment, voteCount: updatedComment.voteCount }
          : comment
      ));
    } catch (err) {
      console.error('Failed to downvote comment:', err);
    }
  };
  return (
    <div className="d-flex flex-column gap-3">
      {comments.map((comment) => {
        return (
          <Card key={comment._id} className="comment-card">
            <Card.Body className="p-4">
              {/* Header */}
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div className="d-flex align-items-center gap-2">
                  <div className="comment-avatar">
                    {(comment.user?.name ?? 'U')[0].toUpperCase()}
                  </div>
                  <span className="comment-author">
                    {comment.user?.name ?? 'Unknown'}
                  </span>
                </div>
                <span className="comment-badge">
                  <i className="bi bi-chat-left-text me-1"></i>
                  Comment
                </span>
              </div>

              {/* Content */}
              <p className="comment-content">
                {comment.content}
              </p>

              {/* Voting */}
              <div className="d-flex align-items-center gap-2">
                <VoteButtons
                  count={comment.voteCount ?? 0}
                  onUpvote={() => handleUpvote(comment._id)}
                  onDownvote={() => handleDownvote(comment._id)}
                />
              </div>
            </Card.Body>
          </Card>
        );
      })}
    </div>
  );
}
