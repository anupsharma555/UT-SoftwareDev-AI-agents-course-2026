import { useSelector, useDispatch } from "react-redux";
import {
  upvoteCommentThunk,
  downvoteCommentThunk,
} from "../../reducers/commentSlice";
import { Card, Button } from "react-bootstrap";
import "./CommentList.css";

export default function CommentList() {
  const dispatch = useDispatch();
  const comments = useSelector((state) => state.comments.comments);

  const handleUpvote = (commentId) => {
    dispatch(upvoteCommentThunk(commentId));
  };

  const handleDownvote = (commentId) => {
    dispatch(downvoteCommentThunk(commentId));
  };

  return (
    <div className="d-flex flex-column gap-3" role="list" aria-label="Comments">
      {comments.map((comment) => {
        return (
          <Card key={comment._id} className="comment-card" role="listitem">
            <Card.Body>
              {/* Header */}
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div className="d-flex align-items-center gap-2">
                  <div className="comment-avatar" aria-hidden="true">
                    {(comment.user?.name ?? "U")[0].toUpperCase()}
                  </div>
                  <span className="comment-author">
                    {comment.user?.name ?? "Unknown"}
                  </span>
                </div>
                <span className="badge comment-badge">
                  <i className="bi bi-chat-left-text me-1" aria-hidden="true"></i>
                  Comment
                </span>
              </div>

              {/* Content */}
              <p className="comment-content">{comment.content}</p>

              {/* Voting */}
              <div className="d-flex align-items-center gap-2">
                <Button
                  type="button"
                  variant="light"
                  size="sm"
                  onClick={() => handleUpvote(comment._id)}
                  aria-label={`Upvote comment by ${comment.user?.name ?? "Unknown"}`}
                  className="comment-vote-btn"
                >
                  <i className="bi bi-arrow-up" aria-hidden="true"></i>
                </Button>
                <span className="comment-vote-count">
                  {comment.voteCount ?? 0}
                  <span className="visually-hidden"> votes</span>
                </span>
                <Button
                  type="button"
                  variant="light"
                  size="sm"
                  onClick={() => handleDownvote(comment._id)}
                  aria-label={`Downvote comment by ${comment.user?.name ?? "Unknown"}`}
                  className="comment-vote-btn"
                >
                  <i className="bi bi-arrow-down" aria-hidden="true"></i>
                </Button>
              </div>
            </Card.Body>
          </Card>
        );
      })}
    </div>
  );
}
