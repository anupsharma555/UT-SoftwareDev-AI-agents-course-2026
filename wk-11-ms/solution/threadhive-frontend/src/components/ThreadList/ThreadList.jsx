import { useDispatch } from 'react-redux';
import { upvoteThreadThunk, downvoteThreadThunk } from '../../reducers/threadSlice';
import { Link } from 'react-router-dom';
import { Container } from "react-bootstrap";
import VoteButtons from '../Shared/VoteButtons';
import BookmarkButton from '../Bookmark/BookmarkButton';
import './ThreadList.css';

export default function ThreadList({ threadsToDisplay }) {
  const dispatch = useDispatch();

  const handleUpvote = (threadId) => {
    dispatch(upvoteThreadThunk(threadId));
  };

  const handleDownvote = (threadId) => {
    dispatch(downvoteThreadThunk(threadId));
  };

  return (
    <Container fluid className="px-0">
      {threadsToDisplay.map((thread) => (
        <div key={thread._id} className="thread-card">
          <div className="thread-card-body">
            {/* Voting Section */}
            <div className="vote-section">
              <VoteButtons
                count={thread.voteCount}
                onUpvote={() => handleUpvote(thread._id)}
                onDownvote={() => handleDownvote(thread._id)}
              />
            </div>

            {/* Thread Info */}
            <div className="thread-content-section">
              <div className="thread-header">
                <h5 className="thread-title">{thread.title}</h5>
                <span className="subreddit-badge">
                  r/{thread.subreddit?.name || 'unknown'}
                </span>
              </div>
              <p className="thread-text">{thread.content}</p>
              <div className="d-flex align-items-center gap-3 flex-wrap">
                <Link
                  to={`/thread/${thread._id}`}
                  className="view-thread-btn"
                >
                  💬 View Comments
                </Link>
                <BookmarkButton threadId={thread._id} />
              </div>
            </div>
          </div>
        </div>
      ))}
    </Container>
  );
}
