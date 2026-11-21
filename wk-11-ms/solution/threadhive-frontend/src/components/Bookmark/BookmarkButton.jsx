import { useDispatch, useSelector } from 'react-redux';
import { Button } from 'react-bootstrap';
import {
  saveBookmarkThunk,
  removeBookmarkThunk,
} from '../../reducers/bookmarkSlice';

// Stable reference so the fallback does not create a new array each render
// (which react-redux warns about and which causes unnecessary rerenders).
const EMPTY_IDS = [];

// Toggle control for saving/unsaving a thread. Shared by the feed
// (ThreadList) and the single-thread view (ThreadCard) so the saved/unsaved
// state stays consistent everywhere.
export default function BookmarkButton({ threadId, className = '' }) {
  const dispatch = useDispatch();
  // Defensive: some store configurations (e.g. isolated component tests) do
  // not register the bookmarks slice.
  const savedIds = useSelector((state) => state.bookmarks?.savedIds ?? EMPTY_IDS);
  const isSaved = savedIds.includes(threadId);

  const handleToggle = () => {
    if (isSaved) {
      dispatch(removeBookmarkThunk(threadId));
    } else {
      dispatch(saveBookmarkThunk(threadId));
    }
  };

  return (
    <Button
      variant="link"
      size="sm"
      className={`bookmark-btn text-decoration-none p-0 ${className}`}
      onClick={handleToggle}
      aria-label={isSaved ? 'Remove bookmark' : 'Save thread'}
      title={isSaved ? 'Remove bookmark' : 'Save thread'}
      aria-pressed={isSaved}
    >
      <i className={`bi ${isSaved ? 'bi-bookmark-fill' : 'bi-bookmark'} me-1`}></i>
      {isSaved ? 'Saved' : 'Save'}
    </Button>
  );
}
