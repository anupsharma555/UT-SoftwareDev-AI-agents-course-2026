import { getUserName } from '../../services/userService';
import { Card, Button, Col, Row, Stack } from "react-bootstrap";
import VoteButtons from '../Shared/VoteButtons';
import './ThreadCard.css';

export default function ThreadCard({ thread, goBack }) {
  const voteCount = thread.upvotedBy.length - thread.downvotedBy.length;

  const handleUpvote = async () => {
    alert("Upvote clicked!");
  };

  const handleDownvote = async () => {
    alert("Downvote clicked!");
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
                count={voteCount}
                onUpvote={handleUpvote}
                onDownvote={handleDownvote}
                btnClassName="vote-button"
                countClassName="vote-count-display"
              />
            </Stack>
          </Col>

          {/* Thread content */}
          <Col>
            <h3 className="thread-title">{thread.title}</h3>
            <p className="thread-content">{thread.content}</p>

            <div className="d-flex gap-4 flex-wrap thread-meta">
              <div className="d-flex align-items-center gap-2">
                <i className="bi bi-person-circle thread-meta-icon"></i>
                <span>
                  <strong className="thread-meta-author">{getUserName(thread.author)}</strong>
                </span>
              </div>
              <div className="d-flex align-items-center gap-2">
                <i className="bi bi-bookmark thread-meta-icon"></i>
                <span className="badge thread-meta-badge">r/{thread.subredditName}</span>
              </div>
            </div>
          </Col>
        </Row>
      </Card.Body>
    </Card>
  );
}
