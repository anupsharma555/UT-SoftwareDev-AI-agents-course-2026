import { Container } from "react-bootstrap";
import VoteButtons from "../Shared/VoteButtons";
import "./ThreadList.css";

export default function ThreadList({ threads, onSelect }) {
  const handleUpvote = () => {
    alert("Upvote clicked!");
  };
  const handleDownvote = () => {
    alert("Downvote clicked!");
  };

  return (
    <Container fluid className="px-0">
      {threads.map((thread) => (
        <div key={thread._id} className="thread-card">
          <div className="thread-card-body">
            {/* Voting Section */}
            <div className="vote-section">
              <VoteButtons
                count={thread.voteCount}
                onUpvote={handleUpvote}
                onDownvote={handleDownvote}
                btnClassName="vote-btn"
                countClassName="vote-count"
              />
            </div>

            {/* Thread Info */}
            <div className="thread-content-section">
              <div className="thread-header">
                <h5 className="thread-title">{thread.title}</h5>
                <span className="subreddit-badge">r/{thread.subreddit}</span>
              </div>
              <p className="thread-text">{thread.content}</p>
              <button
                className="view-thread-btn"
                onClick={() => onSelect(thread)}
              >
                💬 View Comments
              </button>
            </div>
          </div>
        </div>
      ))}
    </Container>
  );
}
