import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { ListGroup } from 'react-bootstrap';

// Stable reference so the fallback does not create a new array each render.
const EMPTY_SAVED = [];

// Compact list of the current user's saved threads, rendered inside the
// Profile "Saved" tab. Each row links to the full thread view.
export default function SavedThreadsList() {
  // Defensive defaults so the component is safe even if the bookmarks slice
  // is not registered (e.g. in isolated tests).
  const saved = useSelector((state) => state.bookmarks?.saved ?? EMPTY_SAVED);
  const loading = useSelector((state) => state.bookmarks?.loading ?? false);

  if (loading) {
    return <p className="text-muted text-center py-3">Loading saved threads...</p>;
  }

  if (saved.length === 0) {
    return (
      <p className="text-muted text-center py-3">
        You haven&apos;t saved any threads yet.
      </p>
    );
  }

  return (
    <ListGroup variant="flush" className="saved-threads-list">
      {saved.map((thread) => (
        <ListGroup.Item
          key={thread._id}
          as={Link}
          to={`/thread/${thread._id}`}
          action
          className="saved-thread-row"
        >
          <div className="fw-semibold saved-thread-title">{thread.title}</div>
          <div className="small text-muted">
            r/{thread.subreddit?.name ?? 'unknown'} ·{' '}
            {thread.author?.name ?? 'Unknown'}
          </div>
        </ListGroup.Item>
      ))}
    </ListGroup>
  );
}
