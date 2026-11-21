import { getUserName } from '../../services/userService';
import { Card } from "react-bootstrap";
import VoteButtons from '../Shared/VoteButtons';
import './CommentList.css';

export default function CommentList({ comments }) {
  const handleUpvote = () => {
    alert('Upvote clicked!');
  };
  const handleDownvote = () => {
    alert('Downvote clicked!');
  };

  return (
    <div className="d-flex flex-column gap-3">
      {comments.map((comment) => (
        <Card key={comment._id} className="comment-card">
          <Card.Body>
            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div className="d-flex align-items-center gap-2">
                <div className="comment-avatar">
                  {(getUserName(comment.user) ?? 'U')[0].toUpperCase()}
                </div>
                <span className="comment-author">
                  {getUserName(comment.user) ?? 'Unknown'}
                </span>
              </div>
              <span className="badge comment-badge">
                <i className="bi bi-chat-left-text me-1"></i>
                Comment
              </span>
            </div>

            {/* Content */}
            <p className="comment-content">{comment.content}</p>

            {/* Voting */}
            <div className="d-flex align-items-center gap-2">
              <VoteButtons
                count={comment.voteCount}
                onUpvote={handleUpvote}
                onDownvote={handleDownvote}
                btnClassName="comment-vote-btn"
                countClassName="comment-vote-count"
              />
            </div>
          </Card.Body>
        </Card>
      ))}
    </div>
  );
}
