import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchThreadById,
  clearThread,
} from "../../reducers/currentThreadSlice.js";
import {
  fetchComments,
  addComment,
  clearComments,
} from "../../reducers/commentSlice.js";

import ThreadCard from "../../components/ThreadList/ThreadCard";
import CommentForm from "../../components/Comment/CommentForm";
import CommentList from "../../components/Comment/CommentList";
import { Container, Card, Button, Spinner, Alert } from "react-bootstrap";
import "./ThreadPage.css";

export default function Thread() {
  const { threadId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [commentText, setCommentText] = useState("");

  const {
    thread,
    loading: threadLoading,
    error: threadError,
  } = useSelector((state) => state.currentThread);

  const {
    comments: threadComments,
    loading: commentsLoading,
    error: commentsError,
  } = useSelector((state) => state.comments);

  useEffect(() => {
    if (threadId) {
      dispatch(fetchThreadById(threadId));
      dispatch(fetchComments(threadId));
    }

    return () => {
      dispatch(clearThread());
      dispatch(clearComments());
    };
  }, [dispatch, threadId]);

  const handlePostComment = () => {
    if (!commentText.trim()) return;
    dispatch(addComment({ threadId, content: commentText }));
    setCommentText("");
  };

  if (threadError) {
    return (
      <Container className="my-5">
        <Alert variant="danger" role="alert">{threadError}</Alert>
        <Button variant="secondary" onClick={() => navigate(-1)}>
          Go Back
        </Button>
      </Container>
    );
  }

  if (threadLoading) {
    return (
      <Container className="my-5 text-center">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading thread...</span>
        </Spinner>
        <p className="text-muted mt-3">Loading thread...</p>
      </Container>
    );
  }

  if (!thread) {
    return (
      <Container className="my-5">
        <Alert variant="warning" role="alert">Thread not found</Alert>
        <Button variant="secondary" onClick={() => navigate(-1)}>
          Go Back
        </Button>
      </Container>
    );
  }

  return (
    <Container className="thread-container">
      {/* Thread Card */}
      <div className="mb-4">
        <ThreadCard thread={thread} goBack={() => navigate(-1)} />
      </div>

      {/* Post Comment Input */}
      <CommentForm
        commentText={commentText}
        onCommentChange={(e) => setCommentText(e.target.value)}
        onPostComment={handlePostComment}
        disabled={!commentText.trim()}
      />

      {/* Comments Section */}
      <section className="mb-5">
        <div className="d-flex align-items-center justify-content-between mb-4 px-2">
          <h2 className="comments-header-title"><span aria-hidden="true">💬</span> Comments</h2>
          <span className="comments-count">{threadComments.length} total</span>
        </div>

        {commentsError && (
          <Alert variant="danger" className="mb-3" role="alert">
            Error loading comments: {commentsError}
          </Alert>
        )}

        {commentsLoading ? (
          <Card className="text-center py-4">
            <Card.Body>
              <Spinner animation="border" role="status" aria-hidden="true" size="sm" />
              <p className="text-muted mt-2 mb-0" role="status" aria-live="polite">Loading comments...</p>
            </Card.Body>
          </Card>
        ) : threadComments.length > 0 ? (
          <CommentList />
        ) : (
          <Card className="no-comments-card">
            <Card.Body>
              <p className="no-comments-text">No comments yet. Be the first!</p>
            </Card.Body>
          </Card>
        )}
      </section>
    </Container>
  );
}
