import { useEffect, useRef, useState } from "react";
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

import { fetchThreadSummary } from "../../services/threadService.js";
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
  const [summary, setSummary] = useState("");
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState("");
  const summaryRequestId = useRef(0);

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

    // Reset summary state and invalidate any in-flight summary request
    summaryRequestId.current += 1;
    setSummary("");
    setSummaryError("");
    setSummaryLoading(false);

    return () => {
      summaryRequestId.current += 1;
      dispatch(clearThread());
      dispatch(clearComments());
    };
  }, [dispatch, threadId]);

  const handlePostComment = () => {
    if (!commentText.trim()) return;
    dispatch(addComment({ threadId, content: commentText }));
    setCommentText("");
  };

  const handleSummarize = async () => {
    const requestId = ++summaryRequestId.current;
    setSummaryLoading(true);
    setSummaryError("");
    try {
      const result = await fetchThreadSummary(threadId);
      if (requestId !== summaryRequestId.current) return;
      setSummary(result);
    } catch (err) {
      if (requestId !== summaryRequestId.current) return;
      setSummaryError(
        err.response?.data?.message ||
          "Could not generate a summary. Please try again.",
      );
    } finally {
      if (requestId === summaryRequestId.current) setSummaryLoading(false);
    }
  };

  if (threadError) {
    return (
      <Container className="my-5">
        <Alert variant="danger">{threadError}</Alert>
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
        <Alert variant="warning">Thread not found</Alert>
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

      {/* AI Summary */}
      <div className="mb-4">
        <Button
          variant="outline-primary"
          size="sm"
          onClick={handleSummarize}
          disabled={summaryLoading}
        >
          {summaryLoading ? (
            <>
              <Spinner
                as="span"
                animation="border"
                size="sm"
                role="status"
                aria-hidden="true"
                className="me-2"
              />
              Summarizing...
            </>
          ) : (
            "Summarize"
          )}
        </Button>

        {summaryError && (
          <Alert
            variant="danger"
            className="mt-3 mb-0"
            dismissible
            onClose={() => setSummaryError("")}
          >
            {summaryError}
          </Alert>
        )}

        {summary && !summaryError && (
          <Card className="mt-3" data-testid="thread-summary">
            <Card.Body>
              <Card.Title as="h6">AI Summary</Card.Title>
              <Card.Text className="mb-0">{summary}</Card.Text>
            </Card.Body>
          </Card>
        )}
      </div>

      {/* Post Comment Input */}
      <CommentForm
        commentText={commentText}
        onCommentChange={(e) => setCommentText(e.target.value)}
        onReplaceText={setCommentText}
        onPostComment={handlePostComment}
        disabled={!commentText.trim()}
      />

      {/* Comments Section */}
      <section className="mb-5">
        <div className="d-flex align-items-center justify-content-between mb-4 px-2">
          <h4 className="comments-header-title">💬 Comments</h4>
          <span className="comments-count">{threadComments.length} total</span>
        </div>

        {commentsError && (
          <Alert variant="danger" className="mb-3">
            Error loading comments: {commentsError}
          </Alert>
        )}

        {commentsLoading ? (
          <Card className="text-center py-4">
            <Card.Body>
              <Spinner animation="border" role="status" size="sm" />
              <p className="text-muted mt-2 mb-0">Loading comments...</p>
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
