import { Button } from 'react-bootstrap';
import { FaBookmark, FaRegBookmark } from 'react-icons/fa';
import { useDispatch, useSelector } from 'react-redux';
import { toggleBookmark } from '../../reducers/bookmarkSlice';
import './BookmarkButton.css';

/**
 * Bookmark toggle for a question, used by QuestionCard and QuestionContent.
 * Shows a filled icon when the question is saved. Handles the auth guard internally.
 */
const BookmarkButton = ({ questionId, className = '' }) => {
  const dispatch = useDispatch();
  const { userInfo } = useSelector((state) => state.user);
  // The bookmark slice may be absent in isolated test stores, so default safely.
  const savedIds = useSelector((state) => state.bookmark?.ids ?? EMPTY_IDS);
  const isPending = useSelector((state) => questionId in (state.bookmark?.pending ?? EMPTY_PENDING));
  const isAuthenticated = !!userInfo;
  const isSaved = isAuthenticated && savedIds.includes(questionId);

  const handleClick = async (e) => {
    // The button lives inside a card with a Link, so don't navigate.
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      alert('You must be logged in to bookmark a question.');
      return;
    }

    // Wait for the current request so the server and the icon cannot get out of step.
    if (isPending) return;

    try {
      await dispatch(
        toggleBookmark({ questionId, shouldBookmark: !isSaved }),
      ).unwrap();
    } catch (error) {
      alert(`Failed to ${isSaved ? 'remove bookmark' : 'bookmark question'}: ${error}`);
    }
  };

  return (
    <Button
      variant="link"
      onClick={handleClick}
      className={`p-0 text-decoration-none bookmark-btn ${isSaved ? 'bookmark-btn--saved' : ''} ${className}`}
      aria-label={isSaved ? 'Remove bookmark' : 'Bookmark question'}
      aria-pressed={isSaved}
      title={isSaved ? 'Remove bookmark' : 'Bookmark question'}
    >
      {isSaved ? <FaBookmark /> : <FaRegBookmark />}
    </Button>
  );
};

const EMPTY_IDS = [];
const EMPTY_PENDING = {};

export default BookmarkButton;
