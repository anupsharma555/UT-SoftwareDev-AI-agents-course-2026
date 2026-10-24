import { useState, useEffect } from "react";
import { Container, Card, Button, Row, Col, Stack } from "react-bootstrap";
import { upvoteThread, downvoteThread } from "../../services/threadService";
import VoteButtons from '../Shared/VoteButtons';
import './ThreadCard.css';

export default function ThreadCard({ thread: initialThread, goBack, onVoteUpdate }) {
  const [thread, setThread] = useState(initialThread);

  // Sync with prop changes
  useEffect(() => {
    setThread(initialThread);
  }, [initialThread]);

  if (!thread) return <div>No thread found</div>;

  const handleUpvote = async () => {
    try {
      const updatedThread = await upvoteThread(thread._id);
      setThread({ ...thread, voteCount: updatedThread.voteCount });
      if (onVoteUpdate) {
        onVoteUpdate(thread._id, updatedThread.voteCount);
      }
    } catch (err) {
      console.error("Error during upvote:", err);
    }
  };

  const handleDownvote = async () => {
    try {
      const updatedThread = await downvoteThread(thread._id);
      setThread({ ...thread, voteCount: updatedThread.voteCount });
      if (onVoteUpdate) {
        onVoteUpdate(thread._id, updatedThread.voteCount);
      }
    } catch (err) {
      console.error("Error during downvote:", err);
    }
  };

  return (
    <Card className="single-thread-card">
      <Card.Body>
        <Button 
          onClick={goBack} 
          variant="link" 
          size="sm" 
          className="back-to-home-btn text-decoration-none"
        >
          <i className="bi bi-arrow-left me-2"></i>Back to Home
        </Button>

        <Row className="g-3">
          {/* Voting UI */}
          <Col xs="auto">
            <Stack gap={2} className="text-center vote-column">
              <VoteButtons
                count={thread.voteCount}
                onUpvote={handleUpvote}
                onDownvote={handleDownvote}
              />
            </Stack>
          </Col>

          {/* Thread content */}
          <Col>
            <h3 className="thread-title">
              {thread.title}
            </h3>
            <p className="thread-content">
              {thread.content}
            </p>

            <div className="d-flex gap-4 flex-wrap thread-meta">
              <div className="d-flex align-items-center gap-2">
                <i className="bi bi-person-circle thread-meta-icon"></i>
                <span>
                  <strong className="thread-meta-author">{thread.author?.name ?? "Unknown"}</strong>
                </span>
              </div>
              <div className="d-flex align-items-center gap-2">
                <i className="bi bi-bookmark thread-meta-icon"></i>
                <span className="badge thread-meta-badge">
                  r/{thread.subreddit?.name || "unknown"}
                </span>
              </div>
            </div>
          </Col>
        </Row>
      </Card.Body>
    </Card>
  );
}
